const si = require('systeminformation');
const io = require("socket.io-client");
const axios  = require("axios");
const os = require('os');
const fs = require('fs');
const ProgressBar = require('progress');
require('path');

const version = 0.06;
const logo = [
    '    __  __      _____ \n',
    '\\_//  \\|__)|\\ ||_  |  \n',
    `/ \\\\__/| \\ | \\||__ |  ${version}`,
]
console.log(logo.join(""));

async function checkForUpdates(){
    try {
        const update = (await axios.get('http://backend.xornet.cloud/updates')).data;
        if (version < update.latestVersion) {
            console.log(`Downloading new update v${update.latestVersion}`);
            await downloadUpdate(update.downloadLink);
            console.log(`Download complete`);
            await deleteOldVersion(version);
            console.log(`Update finished`);
        } else { 
            connectToXornet(); 
        };  
    } catch (error) {
        if (error) {
            console.log(error);
            console.log(`Backend server is offline, skipping update`);
            console.log(`Waiting for backend to connect...`);
            connectToXornet(); 
        }
    }
};
async function downloadUpdate(downloadLink){
    const downloadPath = (`./${downloadLink.split('/')[downloadLink.split('/').length - 1]}`);
    console.log(downloadPath);
    
    const writer = fs.createWriteStream(downloadPath)

    const {data, headers} = await axios({
        url: downloadLink,
        method: 'GET',
        responseType: 'stream',
    });

    const totalLength = headers['content-length'];

    const progressBar = new ProgressBar(`Downloading update [:bar] :percent :rate/bps :etas`, {
        width: 50,
        complete: '=',
        incomplete: ' ',
        renderThrottle: 1,
        total: parseInt(totalLength)
    });

    data.pipe(writer);
    data.on('data', (chunk) => progressBar.tick(chunk.length))

    return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
    });
};
async function deleteOldVersion(oldVersion){
    return new Promise(resolve => {
        fs.unlink(`xornet-reporter-v${oldVersion}`, () => {
            console.log(`Deleted old version`);
            resolve();
        });
    });
};

async function connectToXornet(){
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
            reporterVersion: version,
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
};


checkForUpdates();