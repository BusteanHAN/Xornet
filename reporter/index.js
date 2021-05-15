const si = require("systeminformation");
const io = require("socket.io-client");
const axios = require("axios");
const os = require("os");
const fs = require("fs");
const ProgressBar = require("progress");
require("colors");

const version = 0.12;
const logo = [
  "    __  __      _____ \n",
  "\\_//  \\|__)|\\ ||_  |  \n",
  `/ \\\\__/| \\ | \\||__ |  ${version}\n`,
];
console.log(logo.join("").magenta);

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
    const update = (await axios.get("http://backend.xornet.cloud/updates"))
      .data;
    if (version < update.latestVersion) {
      console.log(
        "[INFO]".bgCyan.black +
          ` Downloading new update v${update.latestVersion}`
      );
      await downloadUpdate(update.downloadLink + getSystemExtension());
      console.log("[INFO]".bgCyan.black + ` Download complete`);
      await deleteOldVersion(version);
      console.log("[INFO]".bgCyan.black + ` Update finished`);
    } else {
      console.log("[INFO]".bgCyan.black + ` No updates found`);
      connectToXornet();
    }
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
      connectToXornet();
    }
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

async function deleteOldVersion(oldVersion) {
  return new Promise((resolve) => {
    fs.unlink(`./xornet-reporter-v${oldVersion}${getSystemExtension()}`, () => {
      console.log(`Deleted old version`);
      resolve();
    });
  });
}

async function getLocation() {
  console.log("[INFO]".bgCyan.black + ` Fetching geolocation...`);
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
  const name = os.hostname();
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
    name,
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
  };

  return stats;
}

async function connectToXornet() {
  console.log("[INFO]".bgCyan.black + " Fetching system information...");
  static = await si.getStaticData();
  static.geolocation = await getLocation();
  static.system.uuid = static.system.uuid.replace(/-/g, "");
  console.log(
    "[INFO]".bgCyan.black + " System information collection finished"
  );

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
    socket.emit("identity", static.system.uuid);
    emitter = setInterval(function () {
      socket.emit("report", statistics);
    }, 1000);
  });

  socket.on("disconnect", async () => {
    console.log("[WARN]".bgYellow.black + ` Disconnected from ${backend}`);
    clearInterval(emitter);
  });
}

checkForUpdates();
