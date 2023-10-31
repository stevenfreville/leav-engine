// Read .env file with fs without using dotenv
const childProcess = require('child_process')
const fs = require('fs');

const {getArtifactList, downloadArtifact, unzip, initEnvVariables} = require("./utils");

initEnvVariables();

// Get commit sha1 from git
const commitSha1 = childProcess.execSync("git rev-parse HEAD").toString().trim();
let artifact;

getArtifactList()
    .then((list) => {
        // Find the artifact with the same commit sha1
        artifact = list.artifacts.find((artifact) => {
            if (artifact.workflow_run.head_sha === commitSha1) return artifact.id;
        })

        if (!artifact) throw new Error(`No artifact found for this commit ${commitSha1}`);

        const fileName = `${artifact.name}.zip`;
        // before download remove file if exists
        if (fs.existsSync(fileName)) {
            fs.unlinkSync(fileName);
        }

        return downloadArtifact(fileName, artifact.archive_download_url)
    })
    .then((fileName) => {
        return unzip(fileName, "../.")
    })
    .then((res) => {
        console.log('file unzipped', res)
    })
    .catch((err) => {
        console.log('error', err)
    });




