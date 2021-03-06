const { v4: uuidv4 } = require('uuid');
const express = require("express");
const app = express();
const morgan = require("morgan");
const axios = require("axios");
const port = process.env.PORT || 8080;
const http = require("http").createServer(app);
const io = require("socket.io")(http, { cors: { origin: "*" } });
app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"')); // Enable HTTP code logs

let machines = new Map();
let machinesPings = new Map();

let latestVersion = 0.13;

app.get("/updates", async (req, res) => {
  try {
    const { data } = await axios.get(
      "https://api.github.com/repos/Geoxor/Xornet/releases"
    );
    latestVersion = parseFloat(data[0].tag_name.replace("v", ""));
    res.json({
      latestVersion,
      downloadLink: `https://github.com/Geoxor/Xornet/releases/download/v${latestVersion}/xornet-reporter-v${latestVersion}`,
    });
  } catch (error) {
    res.json({
      latestVersion,
      downloadLink: `https://github.com/Geoxor/Xornet/releases/download/v${latestVersion}/xornet-reporter-v${latestVersion}`,
    });
  }
});

setInterval(() => {
  machines = new Map();
}, 60000);

setInterval(async () => {
  io.sockets.in("client").emit("machines", Object.fromEntries(machines));
  io.sockets.in('reporter').emit('heartbeat', Date.now());
}, 1000);

function formatSeconds(seconds) {
  if(!seconds) return undefined;
  seconds = Number(seconds);
  var d = Math.floor(seconds / 86400);
  var h = Math.floor(seconds / 3600 % 24);
  var m = Math.floor(seconds % 3600 / 60);
  var s = Math.floor(seconds % 3600 % 60);
 
  return `${d}d ${h}h ${m}m ${s}s`
}

// Websockets
io.on("connection", async (socket) => {
  if (socket.handshake.auth.type === "client") socket.join("client");
  if (socket.handshake.auth.type === "reporter") {
    await addMachineToDB(socket.handshake.auth.static);
    socket.join("reporter");
  }
  if (!socket.handshake.auth.type) return socket.disconnect();

  console.log({
    type: socket.handshake.auth.type,
    uuid: socket.handshake.auth.uuid,
    // hostname: socket.handshake.auth.static.os.hostname,
  });

  // Calculate ping and append it to the machine map
  socket.on('heartbeatResponse', heartbeat => machinesPings.set(heartbeat.uuid, Math.ceil((Date.now() - heartbeat.epoch) / 2)));

  // Parse reports
  socket.on("report", async (report) => {
    if (!report.ram) return;
    report.rogue = false;

    // Add geolocation data
    report.geolocation = socket.handshake.auth.static.geolocation;
    if(report.geolocation && report.geolocation.ip) delete report.geolocation.ip;
    // console.log(report.geolocation.country);

    // Parse RAM usage & determine used
    report.ram.used = parseFloat(((report.ram.total - report.ram.free) / 1024 / 1024 / 1024).toFixed(2));
    report.ram.total = parseFloat((report.ram.total / 1024 / 1024 / 1024).toFixed(2));
    report.ram.free = parseFloat((report.ram.free / 1024 / 1024 / 1024).toFixed(2));

    // Parse uptime 
    report.uptime = {
      pure: report.uptime,
      formatted: formatSeconds(report.uptime),
    };

    // Append Ping from ping buffer
    report.ping = machinesPings.get(report.uuid);

    // Parse CPU usage
    report.cpu = parseInt(report.cpu);

    // Remove dashes from UUID
    report.uuid = report.uuid.replace(/-/g, "");

    if (Array.isArray(report.network)) {
      // Clear out null interfaces
      report.network = report.network.filter((iface) => iface.tx_sec !== null && iface.rx_sec !== null);
      
      // Get total network interfaces
      totalInterfaces = report.network.length;

      // Combine all bandwidth together
      let TxSec = (report.network.reduce((a, b) => a + b.tx_sec, 0) * 8) / 1000 / 1000;
      let RxSec = (report.network.reduce((a, b) => a + b.rx_sec, 0) * 8) / 1000 / 1000;

      // Replace whats there with proper data
      report.network = {
          totalInterfaces,
          TxSec: parseFloat(TxSec.toFixed(2)),
          RxSec: parseFloat(RxSec.toFixed(2)),
      };

      const uuidRegex = /[a-f0-9]{32}/g;
      const hostnameRegex = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9]))*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;

      // Validators
      if(!uuidRegex.test(report.uuid)) report.rogue = true;
      if(!hostnameRegex.test(report.name) || report.uuid.length !== 32) report.rogue = true;
      if(report.reporterVersion > latestVersion + 0.01) report.rogue = true;
      if(!report.hostname || report.hostname == "") report.rogue = true;
      // Add to ram
      machines.set(report.uuid, report);

      // Add to database
      if (!report.rogue) await addStatsToDB(report);
    }
  });
});

/**      USER DATABASE HANDLING       */

const User = require("./models/User.js");

/**
 * Attempts to create a user and save them to the database
 * @param {String} [id] the uuid of the user
 * @param {String} [username] the username of the user
 * @param {String} [password] the encrypted password of the user
 */

async function addUserToDB(id, username, password){
  const users = await User.find({ _id: id}).exec()
  if(users.length !== 0) return console.warn(`[MANGOLIA]: User with uuid '${id}' is already in the database!`);
  await new User({_id: id, username: username, password: password}).save(); 
  console.log(`[MANGOLIA]: User with uuid '${id}' added to the database!`);
}

/**      MACHINE DATABASE HANDLING       */

const Machine = require("./models/Machine.js");

/**
 * Attempts to create a machine and save them to the database
 * @param {Object} [static] contains the static data of the machine
 */

async function addMachineToDB(static){
  const machines = await Machine.find({ _id: static.system.uuid}).exec()
  if(machines.length !== 0) return console.warn(`[MANGOLIA]: Machine with uuid '${static.system.uuid}' is already in the database!`);
  await new Machine({_id: static.system.uuid, static: static}).save();
  console.log(`[MANGOLIA]: Machine with uuid '${static.system.uuid}' added to the database!`);
}


/**      STATS DATABASE HANDLING       */

const Stats = require("./models/Stats.js");

/**
 * Creates a stats report and saves it to database
 * @param {Object} [report] contains the stats of the machine
 */

async function addStatsToDB(report){
  const timestamp = new Date().getTime();
  await new Stats({_id: uuidv4(), machine_id: report.uuid, timestamp: timestamp, ram: report.ram, cpu: report.cpu, network: report.network, disks: report.disks}).save();
  // console.log(`[MANGOLIA]: System with uuid '${report.uuid}' reported stats and they are added to database`);
}

http.listen(port, () => console.log(`Started on port ${port.toString()}`));
