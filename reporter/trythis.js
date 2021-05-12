const si = require("systeminformation");
const os = require("os");

let static = {};
const version = 0.09;

async function getDriveInformation() {
  drives = [];
  static = await (await si.getStaticData()).diskLayout;
  for (x in static) {
    drives.push([
      static[x].type,
      static[x].name,
      static[x].size / 1024 / 1024 / 1024
    ]);
    total = total + static[x].size;
    x += 1;
  }
  return drives;
}

async function getStats() {
  const name = os.hostname();
  const platform = os.platform();

  valueObject = {
    networkStats: `(*) tx_sec, rx_sec`,
    currentLoad: "currentLoad"
  };

  const data = await si.get(valueObject);

  let stats = {
    static,
    name,
    platform,
    ram: {
      total: os.totalmem(),
      free: os.freemem()
    },
    cpu: data.currentLoad.currentLoad,
    network: data.networkStats,
    reporterVersion: version,
    drives: await getDriveInformation()
  };

  return stats;
}
