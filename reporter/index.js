const si = require('systeminformation');
const io = require("socket.io-client");
const os = require('os');
const version = '0.05';
const logo = [
    '    __  __      _____ \n',
    '\\_//  \\|__)|\\ ||_  |  \n',
    `/ \\\\__/| \\ | \\||__ |  ${version}`,
]
console.log(logo.join(""));


const backend = "ws://backend.xornet.cloud";
const name = os.hostname();
const platform = os.platform();

let socket = io.connect(backend, { reconnect: true });

async function getStats(){

    valueObject = {
        networkStats: `(*) tx_sec, rx_sec`,
        currentLoad: 'currentLoad',
    }

    const data = await si.get(valueObject);

    let stats = {
        name,
        platform,
        ram: {
            total: os.totalmem(), 
            free: os.freemem(),
        }, 
        cpu: data.currentLoad.currentLoad,
        network: data.networkStats,
    };   
      
    return stats; 
}  
 
let statistics = {}; 

setInterval(async () => { 
    statistics = await getStats();
    // console.log("Sending Statistics");
}, 1000);

var emitter = null;

socket.on('connect', async () => {
    console.log(`Connected to ${backend}`);
    emitter = setInterval(function() {
        socket.emit('report', statistics)
    }, 1000);
});

socket.on('disconnect', async () => {
    console.log(`Disconnected from ${backend}`);
    clearInterval(emitter);
});