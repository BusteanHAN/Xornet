const si = require('systeminformation');
const io = require("socket.io-client");
const os = require('os');

async function getStats(){

    valueObject = {
        networkStats: 'tx_sec, rx_sec',
        currentLoad: 'currentLoad',
    }

    const data = await si.get(valueObject);

    let stats = {
        name: os.hostname(),
        ram: {
            total: os.totalmem(), 
            free: os.freemem(),
        },
        cpu: data.currentLoad.currentLoad,
        network: data.networkStats[0],
    };
 
    return stats;
}  

let statistics = {};

setInterval(async () => {
    statistics = await getStats();
    console.log("Sending Statistics");
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