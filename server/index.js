const express = require("express");
const app = express(); 
const morgan = require("morgan");
const axios  = require("axios");
const port = process.env.PORT || 8080;
const http = require("http").createServer(app);
const io = require("socket.io")(http, {cors: { origin: "*" }});
app.use(morgan("dev")); // Enable HTTP code logs

let machines = new Map();

app.get("/updates", async (req, res) => {
    try {
        const { data } = await axios.get('https://api.github.com/repos/Geoxor/Xornet/releases');
        latestVersion = parseFloat(data[0].tag_name.replace("v", ""));
        res.json({latestVersion, downloadLink: `https://github.com/Geoxor/Xornet/releases/download/v${latestVersion}/xornet-reporter-v${latestVersion}`});
    } catch (error) {
        latestVersion = 0.09;
        res.json({latestVersion, downloadLink: `https://github.com/Geoxor/Xornet/releases/download/v${latestVersion}/xornet-reporter-v${latestVersion}`});
    }
}); 

// Websockets
io.on("connection", async socket => {
    console.log('connection');
    socket.on('identity', identity => console.log(identity));

    socket.on('report', async report => {
        if (report.name){
            
            // Parse RAM usage & determine used
            report.ram.used = parseFloat(((report.ram.total - report.ram.free)  / 1024 / 1024 / 1024).toFixed(2))
            report.ram.total = parseFloat((report.ram.total / 1024 / 1024 / 1024).toFixed(2))
            report.ram.free = parseFloat((report.ram.free / 1024 / 1024 / 1024).toFixed(2))

            // Parse CPU usage
            report.cpu = parseInt(report.cpu);
 
            if (Array.isArray(report.network)){ 
                
                // Clear out null interfaces
                report.network = report.network.filter(iface => iface.tx_sec !== null && iface.rx_sec !== null);

                // Get total network interfaces 
                totalInterfaces = report.network.length;
 
 
                // Combine all bandwidth together
                let TxSec = report.network.reduce((a, b) => (a + b.tx_sec), 0) * 8 / 1000 / 1000;
                let RxSec = report.network.reduce((a, b) => (a + b.rx_sec), 0) * 8 / 1000 / 1000;

                // Replace whats there with proper data
                report.network = {  
                    totalInterfaces,
                    TxSec: parseFloat(TxSec.toFixed(2)),
                    RxSec: parseFloat(RxSec.toFixed(2))
                }; 

                // console.log(report);
                if (report.static.system.uuid !== '') machines.set(report.static.system.uuid, report);
                else machines.set(report.static.uuid.os, report);
            }
        } 
    }); 

    setInterval(async () => {
        socket.emit("machines", Array.from(machines.values()));
    }, 1000);
});

http.listen(port, () => console.log(`Started on port ${port.toString()}`));
