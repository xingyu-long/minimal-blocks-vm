const express = require("express");
const cors = require("cors");
const app = express();

const port = 3001;
app.use(cors({ origin: "http://localhost:3000" }));

app.get("/download/projects/:projectId", function (req, res) {
  const { projectId } = req.params;
  const file = `../sb3-projects/${projectId}`;
  console.log(`Download request for ${projectId}`);
  res.download(file); // Set disposition and send it.
});

app.listen(port, () => {
  console.log(`Upload service app listening at http://localhost:${port}`);
});
