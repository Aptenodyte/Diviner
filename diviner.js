//Initialize modules
const nsapi = require("nsapi");
const fs = require("fs");
const https = require("https");
const opn = require("opn");
const rls = require("readline-sync");
const zlib = require("zlib");
const xml2js = require("xml2js");

//Define globals
let firstUpdater = "";
let firstUpdateTime = 0;
let lastUpdater = "";
let lastUpdateTime = 0;
let firstApiTime = 0;
let lastApiTime = 0;

//Ask user to verify their nation
console.log("Diviner v1.0 - Tool for getting update lengths");
const userNation = rls.question("Nation: ");
const api = new nsapi.NsApi(userNation); //Finish initializing nsapi
opn("https://www.nationstates.net/page=verify_login"); //Automatically open the checksum in browser
const checksum = rls.question("Verification Code: ");

verifyNation(userNation, checksum);

function verifyNation(userNation, checksum) {
  return api.authenticateRequest(userNation, checksum).then(function(response) {
    if (response) {
      console.log("Verification successful");
      console.log();
      downloadDump(); //Download the data dump if the verification is successful
    } else {
      console.log("Verification failed");
      process.kill(process.pid, "SIGTERM");
    }
  });
}

function downloadDump() {
  console.log("Downloading data dump...");
  const file = fs.createWriteStream("regions.xml.gz");
  const request = https.get("https://www.nationstates.net/pages/regions.xml.gz", function(response) {
    response.pipe(file).on("close", function() {
      extractDump();
    });
  });
}

function extractDump() {
  console.log("Extracting data dump...");
  const input = fs.createReadStream("regions.xml.gz");
  const output = fs.createWriteStream("regions.xml");
  input.pipe(zlib.createGunzip()).pipe(output).on("close", function() {
    fs.unlink("regions.xml.gz", function(err) {
      if (err) return console.error(err);
      analyzeDump();
    });
  });
}

function cleanUp() {
  console.log("Cleaning up...");
  api.cleanup();
  fs.unlink("regions.xml", function(err) {
    if (err) return console.error(err);
    readResults();
  });
}

function analyzeDump() {
  console.log("Analyzing data dump...");
  const parser = new xml2js.Parser();
  fs.readFile("regions.xml", function(err, data) {
    if (err) return console.error(err);
    parser.parseString(data, function(err, result) {
      if (err) return console.error(err);

      const dumpLength = result.REGIONS.REGION.length - 1;
      firstUpdater = result.REGIONS.REGION[0].NAME[0];
      firstUpdateTime = result.REGIONS.REGION[0].LASTUPDATE[0];
      lastUpdater = result.REGIONS.REGION[dumpLength].NAME[0];
      lastUpdateTime = result.REGIONS.REGION[dumpLength].LASTUPDATE[0];
      checkApiTimes();
    });
  });
}

function checkApiTimes() {
  console.log("Grabbing lastupdate shard from API...");
  return api.regionRequest(firstUpdater, ["lastupdate"]).then(function(data) {
    firstApiTime = data["lastupdate"];
    return api.regionRequest(lastUpdater, ["lastupdate"]).then(function(data) {
      lastApiTime = data["lastupdate"];
      cleanUp();
    });
  });
}

function readResults() {
  console.log();
  console.log(`Major is ${lastUpdateTime - firstUpdateTime} seconds`);
  if (lastUpdateTime == lastApiTime) {
    console.log("The length of minor could not be determined from the api");
  } else if (lastApiTime - firstApiTime < 0) {
    console.log("The length of minor could not be determined, since update is currently in progress")
  } else {
    console.log(`Minor is ${lastApiTime - firstApiTime} seconds`);
  }
}
