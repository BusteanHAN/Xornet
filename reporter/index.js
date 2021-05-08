const si = require('systeminformation');
const io = require("socket.io-client");

async function getStats(){
    let stats = {};

    valueObject = {
        currentLoad: 'currentLoad',
        osInfo: 'hostname',
        mem: 'used',
        networkStats: 'tx_sec, rx_sec'
    }

    const data = await si.get(valueObject);

    const name = data.osInfo.hostname;
    const cpu = data.currentLoad.currentLoad;
    const ram = data.mem.used / 1000 / 1000 / 1000;
    const upload = data.networkStats[0].tx_sec * 8 / 1000 / 1000;
    const download = data.networkStats[0].rx_sec * 8 / 1000 / 1000;

    stats.name = name;
    cpu.toFixed(2) ? stats.cpu = cpu.toFixed(2) : stats.cpu = cpu || 0;
    ram.toFixed(2) ? stats.ram = ram.toFixed(2) : stats.ram = ram || 0;
    upload.toFixed(2) ? stats.upload = upload.toFixed(2) : stats.upload = upload || 0;
    download.toFixed(2) ? stats.download = download.toFixed(2) : stats.download = download || 0;

    return stats;
}

let statistics = {};

setInterval(async () => {
    statistics = await getStats();
    console.log(statistics);
}, 1000);

const socket = io.connect("ws://backend.xornet.cloud", {
  reconnect: true,
});

socket.on('connect', async () => {
    console.log("connected");
    setInterval(() => {
        socket.emit('report', statistics)
    }, 1000);
});