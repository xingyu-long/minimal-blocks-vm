'use strict';

import express from 'express';
import cors from 'cors';

// const express = require("express");
// const cors = require("cors");
const app = express();

const port = 3001;
// app.use(cors({ origin: "http://localhost:3000" }));
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.get("/download/projects/:projectId", function (req, res) {
  const { projectId } = req.params;
  const file = `../sb3-projects/${projectId}`;
  console.log(`Download request for ${projectId}`);
  res.download(file); // Set disposition and send it.
});

// app.post("/download", async function (req, res) {
//   let offset = req.query.offset || 0;
//   let num_projects = req.query.num_projects || 1000;
//   let mode = req.query.mode || 'trending';
//   const projects = await retrieveProjects(offset, num_projects, mode);
//   res.json(projects);
// });

app.listen(port, () => {
  console.log(`Upload service app listening at http://localhost:${port}`);
});
