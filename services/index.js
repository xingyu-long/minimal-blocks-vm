const express = require("express");
const cors = require("cors");
const app = express();

const port = 3001;
app.use(cors({ origin: "http://localhost:3000" }));

const { extractXml } = require("./xmlUtils");

app.get("/download/projects/:projectId", function (req, res) {
  const { projectId } = req.params;
  const file = `../sb3-projects/${projectId}`;
  console.log(`Download request for ${projectId}`);
  res.download(file); // Set disposition and send it.
});

app.get("/xml/:projectId", function (req, res) {
  const { projectId } = req.params;
  const onSuccess = (xmlStr) => {
    console.log("Successfully extracted from project:", projectId);
    res.set("Content-Type", "text/xml");
    res.status(200).send(xmlStr);
  };
  const onError = (err) => {
    res.status(500).send(err);
  };
  const onTimeout = () => {
    res
      .status(500)
      .send("Error getting xml source file! Timeout after 60 seconds");
  };
  extractXml(projectId, onSuccess, onError, onTimeout);
});

app.listen(port, () => {
  console.log(`Upload service app listening at http://localhost:${port}`);
});
