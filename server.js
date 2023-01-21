"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const util = require("util");
const exec = util.promisify(require("child_process").exec);

// create app
const app = express();

// middleware
app.use(cors());
app.use(helmet());

const bodyParser = require("body-parser");
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
        Long Prompt: `, // prompt engineering
      model: "xlarge",
      temperature: 0.8,
      stop_sequences: ["--"],
    });
    const generation = generations[0].text.split("--")[0].trim();

    const { stdout, stderr } = await exec(
      "python3 ./test.py"
    );

    res.status(200).send({ generation });
  } catch (err) {
    next(err);
  }
});

app.get("/api/object", (req, res, next) => {
  try {
  } catch (err) {
    next(err);
  }
});

app.get("/api/objects", (req, res, next) => {
  try {
  } catch (err) {
    next(err);
  }
});

app.use(async (err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).send({ status: status, message: err.message });
});

// serve static files
app.use(express.static(__dirname + "/public"));

const port = process.env.PORT || "5000";
app.listen(port, () => {
  console.log(`Running on port ${port}...`);
});
