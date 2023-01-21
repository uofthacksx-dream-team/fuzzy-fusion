const fetch = require("node-fetch");

fetch("http://localhost:5000/api/object", {
  method: "POST",
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ prompt: "honeycomb" }),
})
  .then((res) => res.json())
  .then((json) => {
    console.log(json);
  })
  .catch((err) => {
    console.log(err);
  });
