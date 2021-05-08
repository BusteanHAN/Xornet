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

    socket.on('report', report => {
        report.name ? vms.set(report.name, report) : null;
        console.log(vms);
    }); 

    setInterval(async () => {
        socket.emit("vms", Array.from(vms.values()));
    }, 1000);
});

http.listen(port, () => console.log(`Started on port ${port.toString()}`));
