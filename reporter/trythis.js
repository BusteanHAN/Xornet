const si = require("systeminformation");
const os = require("os");

let static = {};
const version = 0.09;

// This will get information about all the drives on the system
async function getDriveInformation() {
    drives = []; // Create an array for the drives to be stored within
    static = await (await si.diskLayout());
    // This will loop through all the drives and push the data into the drives Array
    for (x in static) {
        drives.push([
            static[x].type,
            static[x].name,
            static[x].size
        ]);
        x += 1; // Increments the loop
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

// For Testing
// getStats().then(data => {
//     console.log(data);
// })
