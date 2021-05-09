const express = require("express");
const app = express(); 
const morgan = require("morgan");
const port = process.env.PORT || 8080;
const http = require("http").createServer(app);
const io = require("socket.io")(http, {cors: { origin: "*" }});
app.use(morgan("dev")); // Enable HTTP code logs

app.get('/', (req, res) => {
    res.json({message: 'fuck you'});
});

app.get('/vms', (req, res) => {
    res.json({message: 'fuck you'});
});
 
let vms = new Map();

// Websockets
io.on("connection", async socket => {
    console.log('connection');

    socket.on('report', async report => {
        if (report.name){
            
            // Parse RAM usage & determine used
            report.ram.used = parseFloat(((report.ram.total - report.ram.free)  / 1024 / 1024 / 1024).toFixed(2))
            report.ram.total = parseFloat((report.ram.total / 1024 / 1024 / 1024).toFixed(2))
            report.ram.free = parseFloat((report.ram.free / 1024 / 1024 / 1024).toFixed(2))

            // Parse CPU usage
            report.cpu = parseFloat(report.cpu.toFixed(2));
 
            if (Array.isArray(report.network)){
                
                // Clear out null interfaces
                report.network = report.network.filter(iface => iface.tx_sec !== null && iface.rx_sec !== null);

                // Get total network interfaces
                totalInterfaces = report.network.length;

                // Combine all bandwidth together
                let tx_sec = report.network.reduce((a, b) => (a.tx_sec + b.tx_sec)) * 8 / 1000 / 1000;
                let rx_sec = report.network.reduce((a, b) => (a.rx_sec + b.rx_sec)) * 8 / 1000 / 1000;

                // Replace whats there with proper data
                report.network = {
                    totalInterfaces,
                    tx_sec: parseFloat(tx_sec.toFixed(2)),
                    rx_sec: parseFloat(rx_sec.toFixed(2))
                }; 

                vms.set(report.name, report); 
            }
        } 
    }); 

    setInterval(async () => {
        socket.emit("vms", Array.from(vms.values()));
    }, 1000);
});

http.listen(port, () => console.log(`Started on port ${port.toString()}`));
