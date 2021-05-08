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
            
            report.ram.used = parseFloat(((report.ram.total - report.ram.free)  / 1024 / 1024 / 1024).toFixed(2))
            report.ram.total = parseFloat((report.ram.total / 1024 / 1024 / 1024).toFixed(2))
            report.ram.free = parseFloat((report.ram.free / 1024 / 1024 / 1024).toFixed(2))

            report.cpu = parseFloat(report.cpu.toFixed(2));

            report.network.tx_sec = parseFloat((report.network.tx_sec * 8 / 1024 / 1024).toFixed(2));
            report.network.rx_sec = parseFloat((report.network.rx_sec * 8 / 1024 / 1024).toFixed(2));

            vms.set(report.name, report);
        }
        console.log(vms);
    }); 

    setInterval(async () => {
        socket.emit("vms", Array.from(vms.values()));
    }, 1000);
});

http.listen(port, () => console.log(`Started on port ${port.toString()}`));
