const si = require("systeminformation");
const io = require("socket.io-client");
const axios = require("axios");
const os = require("os");
const fs = require("fs");
const ProgressBar = require("progress");
require("colors");

const version = 0.13;
const logo = [
  '     ___           ___           ___           ___           ___           ___     \n',
  '    |\\__\\         /\\  \\         /\\  \\         /\\__\\         /\\  \\         /\\  \\    \n',
  '    |:|  |       /::\\  \\       /::\\  \\       /::|  |       /::\\  \\        \\:\\  \\   \n',
  '    |:|  |      /:/\\:\\  \\     /:/\\:\\  \\     /:|:|  |      /:/\\:\\  \\        \\:\\  \\  \n',
  '    |:|__|__   /:/  \\:\\  \\   /::\\~\\:\\  \\   /:/|:|  |__   /::\\~\\:\\  \\       /::\\  \\ \n',
  '____/::::\\__\\ /:/__/ \\:\\__\\ /:/\\:\\ \\:\\__\\ /:/ |:| /\\__\\ /:/\\:\\ \\:\\__\\     /:/\\:\\__\\\n',
  '\\::::/~~/~    \\:\\  \\ /:/  / \\/_|::\\/:/  / \\/__|:|/:/  / \\:\\~\\:\\ \\/__/    /:/  \\/__/\n',
  ' ~~|:|~~|      \\:\\  /:/  /     |:|::/  /      |:/:/  /   \\:\\ \\:\\__\\     /:/  /     \n',
  '   |:|  |       \\:\\/:/  /      |:|\\/__/       |::/  /     \\:\\ \\/__/     \\/__/      \n',
  '   |:|  |        \\::/  /       |:|  |         /:/  /       \\:\\__\\                  \n',
  `    \\|__|         \\/__/         \\|__|         \\/__/         \\/__/             v${version}\n`,
];

console.log(logo.join("").rainbow);

let static = {};

function getSystemExtension() {
  switch (os.platform()) {
    case "win32":
      return ".exe";
    case "linux":
      return ".bin";
    case "darwin":
      return "";
  }
}

async function checkForUpdates() {
  console.log("[INFO]".bgCyan.black + ` Checking for updates`);
  try {
    var update = (await axios.get("http://backend.xornet.cloud/updates")).data;
  } catch (error) {
    if (error) {
      console.log(error);
      if (error.response.status === 403) {
        console.log("[WARN]".bgYellow.black + ` GitHub API error, skipping...`);
        connectToXornet();
        return;
      }
      console.log(
        "[WARN]".bgYellow.black + ` Backend server is offline, skipping update`
      );
      console.log("[INFO]".bgCyan.black + ` Waiting for backend to connect...`);
      console.log("[INFO]".bgCyan.black + ` UUID: ${static.system.uuid}`.cyan);
      connectToXornet();
    }
  }
  if (os.platform() == "win32"){
    if (version < update.latestVersion) {
      console.log(
        "[INFO]".bgCyan.black +
          ` Downloading new update v${update.latestVersion}`
      );
      await downloadUpdate(update.downloadLink + getSystemExtension());
      console.log("[INFO]".bgCyan.black + ` Update finished`);
    } else {
      console.log("[INFO]".bgCyan.black + ` No updates found`);
      connectToXornet();
    }
  } else if (os.platform() == 'linux') {
    console.log("[UPDATE MESSAGE]".bgGreen.black + ` please run this command to update manually` + `'wget https://github.com/Geoxor/Xornet/releases/download/v${update.latestVersion}/install.sh && chmod +x ./install.sh && sudo ./install.sh'`.green);
  } else {
    connectToXornet();
  }
}

async function downloadUpdate(downloadLink) {
  const downloadPath = `./${
    downloadLink.split("/")[downloadLink.split("/").length - 1]
  }`;
  console.log(downloadPath);

  const writer = fs.createWriteStream(downloadPath);

  const { data, headers } = await axios({
    url: downloadLink,
    method: "GET",
    responseType: "stream",
  });

  const totalLength = headers["content-length"];

  const progressBar = new ProgressBar(
    `Downloading update [:bar] :percent :rate/bps :etas`,
    {
      width: 50,
      complete: "=",
      incomplete: " ",
      renderThrottle: 1,
      total: parseInt(totalLength),
    }
  );

  data.pipe(writer);
  data.on("data", (chunk) => progressBar.tick(chunk.length));

  return new Promise((resolve, reject) => {
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

async function getLocation() {
  location = (await axios.get(`http://ipwhois.app/json/`)).data;
  return {
    ip: location.ip,
    location: location.country,
    countryCode: location.country_code,
    isp: location.isp,
  };
}

async function getDiskInfo() {
  info = {};
  let disks = await si.fsSize();
  disks = disks.map((disk) => {
    return {
      fs: disk.fs,
      use: disk.use,
    };
  });
  return disks;
}

async function getStats() {
  const hostname = os.hostname();
  const platform = os.platform();

  valueObject = {
    networkStats: `(*) tx_sec, rx_sec`,
    currentLoad: "currentLoad",
  };

  const data = await si.get(valueObject);

  let uuid;
  if (static.system.uuid !== "") {
    uuid = static.system.uuid;
  } else {
    uuid = static.uuid.os;
  }

  let stats = {
    uuid: uuid,
    isVirtual: static.system.virtual,
    hostname,
    platform,
    ram: {
      total: os.totalmem(),
      free: os.freemem(),
    },
    cpu: data.currentLoad.currentLoad,
    network: data.networkStats,
    reporterVersion: version,
    disks: await getDiskInfo(),
    uptime: os.uptime(),
    timestamp: Date.now(),
  };
  return stats;
}

async function connectToXornet() {
  console.log("[INFO]".bgCyan.black + " Fetching system information...");

  console.log("[INFO]".bgCyan.black + ` Fetching static data...`);
  static = await si.getStaticData();
  console.log("[INFO]".bgCyan.black + ` Static data collected`.green);

  console.log("[INFO]".bgCyan.black + ` Fetching geolocation...`);
  static.geolocation = await getLocation();
  console.log("[INFO]".bgCyan.black + ` Geolocation collected`.green);

  console.log("[INFO]".bgCyan.black + ` Parsing UUID...`);
  static.system.uuid = static.system.uuid.replace(/-/g, "");
  console.log("[INFO]".bgCyan.black + ` Assigning system UUID to ${static.system.uuid.cyan}`.green);

  console.log("[INFO]".bgCyan.black + " System information collection finished".green);

  const backend = "ws://backend.xornet.cloud";
  let socket = io.connect(backend, {
    reconnect: true,
    auth: {
      static,
      type: "reporter",
      uuid: static.system.uuid,
    },
  });

  let statistics = {};
  setInterval(async () => {
    statistics = await getStats();
  }, 1000);

  var emitter = null;

  socket.on("connect", async () => {
    console.log("[CONNECTED]".bgGreen.black + ` Connected to ${backend.green}`);
    
    emitter = setInterval(function () {
      console.log("[INFO]".bgCyan.black + ` Sending Stats - ${Date.now()}`.cyan);
      socket.emit("report", statistics);
    }, 1000);
  });

  socket.on("disconnect", async () => {
    console.log("[WARN]".bgYellow.black + ` Disconnected from ${backend}`);
    clearInterval(emitter);
  });

  // Get a heartbeat from the backend and send a heartbeat response back with UUID
  socket.on("heartbeat", async (epoch) => {
    socket.emit("heartbeatResponse", {
      uuid: static.system.uuid,
      epoch,
    });
  });
}

checkForUpdates();
