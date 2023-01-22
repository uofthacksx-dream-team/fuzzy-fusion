"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const glob = require("glob");
const { v4: uuidv4 } = require("uuid");
const { Storage } = require("@google-cloud/storage");

// use application default credentials
const storage = new Storage();

const bucket = storage.bucket("fuzzy_fusion");

const util = require("util");
const exec = util.promisify(require("child_process").exec);

// create app
const app = express();

// middleware
app.use(cors());
app.use(bodyParser.json());

// libraries
const cohere = require("cohere-ai");
cohere.init(process.env.COHERE_API_KEY);

/*
 * example req.body...
 * {
 *   prompt: "sword"
 * }
 */
app.post("/api/object", async (req, res, next) => {
  try {
    const { prompt } = req.body;
    const {
      body: { generations },
    } = await cohere.generate({
      prompt: `This program takes a short prompt and generates a longer prompt based on the shorter one.
      
        Short Prompt: a train
        Long Prompt: a black train with a steam engine
        --
        Short Prompt: a man in a suit
        Long Prompt: a young man in a suit carrying a briefcase
        --
        Short Prompt: a chocolate chip cookie
        Long Prompt: a warm gooey chocolate chip cookie
        --
        Short Prompt: a racecar
        Long Prompt: a formula one racecar with red stripes
        --
        Short Prompt: a tree
        Long Prompt: an old birch tree swaying in the wind
        --
        Short Prompt: a bear
        Long Prompt: a ferocious brown grizzly bear with sharp claws
        --
        Short Prompt: a rocking chair
        Long Prompt: a comfortable wooden rocking chair with yellow cushions
        --
        Short Prompt: an ant
        Long Prompt: a black ant with jagged mandibles
        --
        Short Prompt: a camera
        Long Prompt: a vintage 35mm film camera
        --
        Short Prompt: a soccer ball
        Long Prompt: a white and black soccer ball stained with dirt and grass
        --
        Short Prompt: ${prompt}
        Long Prompt:`, // prompt engineering
      model: "xlarge",
      temperature: 0.8,
      stop_sequences: ["--"],
    });
    const generation = generations[0].text.split("--")[0].trim();

    const uuid = uuidv4();

    res.status(200).send({ prompt, generation, id: uuid });

    // run model
    await exec(
      `python3 ./stable-dreamfusion/main.py --text ${generation} --workspace ${uuid} -O --iters 100 --w 100 --h 100`
    );
    await exec(
      `python3 ./stable-dreamfusion/main.py --workspace ${uuid} -O --test --save_mesh`
    );
    // await exec(
    //   `python3 ./stable-dreamfusion/main.py --text ${generation} --workspace ${uuid} -O --iters 1500 --w 100 --h 100`
    // );
    // await exec(
    //   `python3 ./stable-dreamfusion/main.py --workspace ${uuid} -O --test --save_mesh`
    // );

    glob(
      `./stable-dreamfusion/${uuid}/results/*_rgb.mp4`,
      undefined,
      async (err, files) => {
        if (err) {
          throw err;
        }
        const [file] = files;
        await Promise.all(
          [
            `./stable-dreamfusion/${uuid}/mesh/mesh.obj`,
            `./stable-dreamfusion/${uuid}/mesh/mesh.mtl`,
            `./stable-dreamfusion/${uuid}/mesh/albedo.png`,
            file,
          ].map(async (filepath) => {
            const ext = filepath.slice(filepath.length - 3);

            bucket.upload(filepath, { destination: `${uuid}.${ext}` });
          })
        );
      }
    );
  } catch (err) {
    next(err);
  }
});

app.get("/api/object/:id", async (req, res, next) => {
  try {
    const id = req.params.id;
    console.log(bucket.name);
    const done = (
      await Promise.all(
        [
          bucket.file(`${id}.obj`),
          bucket.file(`${id}.mtl`),
          bucket.file(`${id}.png`),
          bucket.file(`${id}.mp4`),
        ].map(async (file) => {
          const [exists] = await file.exists();
          return exists;
        })
      )
    ).every((exists) => exists);

    res.status(200).send({
      urls: done
        ? [
            `https://storage.googleapis.com/${bucket.name}/${id}.obj`,
            `https://storage.googleapis.com/${bucket.name}/${id}.mtl`,
            `https://storage.googleapis.com/${bucket.name}/${id}.mp4`,
          ]
        : [],
    });
  } catch (err) {
    next(err);
  }
});

app.use(async (err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).send({ status: status, message: err.message });
});

// serve static files
app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src * self blob: data: gap:; style-src * self 'unsafe-inline' blob: data: gap:; script-src * 'self' 'unsafe-eval' 'unsafe-inline' blob: data: gap:; object-src * 'self' blob: data: gap:; img-src * self 'unsafe-inline' blob: data: gap:; connect-src self * 'unsafe-inline' blob: data: gap:; frame-src * self blob: data: gap:;"
  );
  next();
});
app.use(express.static(__dirname + "/public"));

const port = process.env.PORT || "5000";
app.listen(port, () => {
  console.log(`Running on port ${port}...`);
});
