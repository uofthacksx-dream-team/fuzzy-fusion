"use strict";

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

// create app
const app = express();

// middleware
app.use(cors());
app.use(helmet());

const bodyParser = require("body-parser");
app.use(bodyParser.json());

// co:here
const cohere = require("cohere-ai");
cohere.init(process.env.COHERE_API_KEY);

/*
 * req.body = {
 *   prompt: "sword"
 * }
 */
app.post("/api/object", async (req, res, next) => {
  try {
    // """
    // This program generates a startup idea and name given the industry.

    // Industry: Workplace
    // Startup Idea: A platform that generates slide deck contents automatically based on a given outline
    // Startup Name: Deckerize
    // --
    // Industry: Home Decor
    // Startup Idea: An app that calculates the best position of your indoor plants for your apartment
    // Startup Name: Planteasy
    // --
    // Industry: Healthcare
    // Startup Idea: A hearing aid for the elderly that automatically adjusts its levels and with a battery lasting a whole week
    // Startup Name: Hearspan

    // --
    // Industry: Education
    // Startup Idea: An online school that lets students mix and match their own curriculum based on their interests and goals
    // Startup Name: Prime Age

    // --
    // Industry: Productivity
    // Startup Idea:"""

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

    console.log(JSON.stringify({ r: generation }));

    res.status(200).send({ generations });
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
