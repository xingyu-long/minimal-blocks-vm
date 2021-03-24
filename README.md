# Setup

Minimal setup for vm and blocks to work together.
(No setup for user interaction)

1. Install dependencies:
   `npm install`
   `cd services && npm install`

2. Run service to serve .sb3 file
   `cd services && npm start` or just `npm run services`

3. Run the demo:
   `npm start`
   visit http://localhost:3000/#test

The demo app uses the input project (filename) based on the input window.location.hash (e.g., test which match test.sb3 in `sb3-projects` directory)
You can copy & paste .sb3 files in `sb3-projects` and possible rename it to unique project id of each Scratch project.

# Extract XML

Send GET request to http://localhost:3001/xml/{projectId}
e.g. http://localhost:3001/xml/483476381 will get xml for project at the following url
https://scratch.mit.edu/projects/483476381/
