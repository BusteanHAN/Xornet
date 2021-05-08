const si = require('systeminformation');
const io = require("socket.io-client");
const os = require('os');
const version = '0.04';
const logo = [
    '    __  __      _____ \n',
    '\\_//  \\|__)|\\ ||_  |  \n',
    `/ \\\\__/| \\ | \\||__ |  ${version}`,
]
const backend = "ws://backend.xornet.cloud";
const socket = io.connect(backend, { reconnect: true });

console.log(logo.join(""));

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
    // console.log("Sending Statistics");
}, 1000);

var emitter = null;

socket.once('connect', async () => {
    console.log(`Connected to ${backend}`);
    emitter = setInterval(function() {
        socket.emit('report', statistics)
    }, 1000);
});

socket.once('disconnect', async () => {
    console.log(`Disconnected from ${backend}`);
    clearInterval(emitter);
});