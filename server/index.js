const express = require("express");
const app = express(); 
const morgan = require("morgan");
const port = process.env.PORT || 8080;
const http = require("http").createServer(app);
const io = require("socket.io")(http, {cors: { origin: "*" }});
const si = require('systeminformation');
app.use(morgan("dev")); // Enable HTTP code logs

app.get('/vms', (req, res) => {
    res.json({message: 'fuck you'});
});

async function getStats(){
    let stats = {};

    const osInfo = await si.osInfo();
    const currentLoad = await si.currentLoad();
    const mem = await si.mem();
    const networkStats = await si.networkStats();

    const name = osInfo.hostname;
    const cpu = currentLoad.currentLoad;
    const ram = mem.used / 1000 / 1000 / 1000;
    const upload = networkStats[0].tx_sec / 1000 / 1000;
    const download = networkStats[0].rx_sec / 1000 / 1000;

    stats.name = name;
    cpu.toFixed(2) ? stats.cpu = cpu.toFixed(2) : stats.cpu = cpu || 0 
    ram.toFixed(2) ? stats.ram = ram.toFixed(2) : stats.ram = ram || 0 
    upload.toFixed(2) ? stats.upload = upload.toFixed(2) : stats.upload = upload || 0 
    download.toFixed(2) ? stats.download = download.toFixed(2) : stats.download = download || 0 

    return stats;
}

let currentStats = {};

setInterval(async () => {
    currentStats = await getStats();
}, 1000);

// Websockets
io.on("connection", async socket => {
    console.log('connection');
    setInterval(async () => {
        socket.emit("vms", [currentStats]);
    }, 1000);
});

http.listen(port, () => console.log(`Started on port ${port.toString()}`));
