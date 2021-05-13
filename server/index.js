const express = require("express");
const app = express();
const morgan = require("morgan");
const axios = require("axios");
const port = process.env.PORT || 8080;
const http = require("http").createServer(app);
const io = require("socket.io")(http, { cors: { origin: "*" } });
app.use(morgan("dev")); // Enable HTTP code logs

// Weird hackers attempting to connect to these endpoints.
// Saving these for later so I can IP ban ppl who try accessing these
//
// GET /blog/wp-includes/wlwmanifest.xml
// GET /web/wp-includes/wlwmanifest.xml
// GET /wordpress/wp-includes/wlwmanifest.xml
// GET /website/wp-includes/wlwmanifest.xml
// GET /wp/wp-includes/wlwmanifest.xml
// GET /news/wp-includes/wlwmanifest.xml
// GET /2020/wp-includes/wlwmanifest.xml
// GET /2019/wp-includes/wlwmanifest.xml
// GET /shop/wp-includes/wlwmanifest.xml
// GET /wp1/wp-includes/wlwmanifest.xml
// GET /test/wp-includes/wlwmanifest.xml
// GET /wp2/wp-includes/wlwmanifest.xml
// GET /site/wp-includes/wlwmanifest.xml
// GET /cms/wp-includes/wlwmanifest.xml
// GET /sito/wp-includes/wlwmanifest.xml
// GET /TP/public/index.php
// GET /TP/index.php
// GET /thinkphp/html/public/index.php
// GET /html/public/index.php
// GET /public/index.php
// GET /TP/html/public/index.php
// GET /elrekt.php
// GET /index.php

let machines = new Map();

app.get("/updates", async (req, res) => {
  try {
    const { data } = await axios.get(
      "https://api.github.com/repos/Geoxor/Xornet/releases"
    );
    latestVersion = parseFloat(data[0].tag_name.replace("v", ""));
    res.json({
      latestVersion,
      downloadLink: `https://github.com/Geoxor/Xornet/releases/download/v${latestVersion}/xornet-reporter-v${latestVersion}`,
    });
  } catch (error) {
    latestVersion = 0.11;
    res.json({
      latestVersion,
      downloadLink: `https://github.com/Geoxor/Xornet/releases/download/v${latestVersion}/xornet-reporter-v${latestVersion}`,
    });
  }
});

setInterval(() => {
  machines = new Map();
}, 60000);

setInterval(async () => {
  io.sockets.in("client").emit("machines", Object.fromEntries(machines));
}, 1000);

// Websockets
io.on("connection", async (socket) => {
  if (socket.handshake.auth.type === "client") socket.join("client");
  if (socket.handshake.auth.type === "reporter") socket.join("reporter");
  if (!socket.handshake.auth.type) return socket.disconnect();

  console.log({
    type: socket.handshake.auth.type,
    uuid: socket.handshake.auth.uuid,
  });
  socket.on("report", async (report) => {
    if (report.name) {
      // Parse RAM usage & determine used
      report.ram.used = parseFloat(
        ((report.ram.total - report.ram.free) / 1000 / 1000 / 1000).toFixed(2)
      );
      report.ram.total = parseFloat(
        (report.ram.total / 1000 / 1000 / 1000).toFixed(2)
      );
      report.ram.free = parseFloat(
        (report.ram.free / 1000 / 1000 / 1000).toFixed(2)
      );

      // Parse CPU usage
      report.cpu = parseInt(report.cpu);

      // Remove dashes from UUID
      report.uuid = report.uuid.replace(/-/g, "");

      if (Array.isArray(report.network)) {
        // Clear out null interfaces
        report.network = report.network.filter(
          (iface) => iface.tx_sec !== null && iface.rx_sec !== null
        );

        // Get total network interfaces
        totalInterfaces = report.network.length;

        // Combine all bandwidth together
        let TxSec =
          (report.network.reduce((a, b) => a + b.tx_sec, 0) * 8) / 1000 / 1000;
        let RxSec =
          (report.network.reduce((a, b) => a + b.rx_sec, 0) * 8) / 1000 / 1000;

        // Replace whats there with proper data
        report.network = {
          totalInterfaces,
          TxSec: parseFloat(TxSec.toFixed(2)),
          RxSec: parseFloat(RxSec.toFixed(2)),
        };


        // if (!report.static) return console.log(report);

        // Append the UUID in the report's object depending from either the system or the os object
        // if (report.static.system.uuid !== '') {
        //     report.uuid = report.static.system.uuid;
        //     machines.set(report.static.system.uuid, report);
        // }
        // else {
        //     report.uuid = report.static.uuid.os;
        //     machines.set(report.static.uuid.os, report);
        // }
        machines.set(report.uuid, report);
      }
    }
  });
});
// Websockets
io.on("connection", async (socket) => {
  if (socket.handshake.auth.type === "client") socket.join("client");
  if (socket.handshake.auth.type === "reporter") socket.join("reporter");
  if (!socket.handshake.auth.type) return socket.disconnect();

  console.log({
    type: socket.handshake.auth.type,
    uuid: socket.handshake.auth.uuid,
  });
  socket.on("report", async (report) => {
    if (report.name) {
      // Parse RAM usage & determine used
      report.ram.used = parseFloat(
        ((report.ram.total - report.ram.free) / 1000 / 1000 / 1000).toFixed(2)
      );
      report.ram.total = parseFloat(
        (report.ram.total / 1000 / 1000 / 1000).toFixed(2)
      );
      report.ram.free = parseFloat(
        (report.ram.free / 1000 / 1000 / 1000).toFixed(2)
      );
      
      report.disks = {};
      report.disks.list = socket.handshake.auth.static.disks;
      report.disks.total = Math.floor((report.disks.list.map(disk => disk.size).reduce((a, b) => a + b, 0)) / 1000 / 1000 / 1000);
      // console.log(report.disks.total);

      // Parse CPU usage
      report.cpu = parseInt(report.cpu);

      // Remove dashes from UUID
      report.uuid = report.uuid.replace(/-/g, "");

      if (Array.isArray(report.network)) {
        // Clear out null interfaces
        report.network = report.network.filter(
          (iface) => iface.tx_sec !== null && iface.rx_sec !== null
        );
        // Get total network interfaces
        totalInterfaces = report.network.length;

        // Combine all bandwidth together
        let TxSec =
          (report.network.reduce((a, b) => a + b.tx_sec, 0) * 8) / 1000 / 1000;
        let RxSec =
          (report.network.reduce((a, b) => a + b.rx_sec, 0) * 8) / 1000 / 1000;

        // Replace whats there with proper data
        report.network = {
          totalInterfaces,
          TxSec: parseFloat(TxSec.toFixed(2)),
          RxSec: parseFloat(RxSec.toFixed(2)),
        };

        // console.log(report);
        // if (!report.static) return console.log(report);

        // Append the UUID in the report's object depending from either the system or the os object
        if (report.static.system.uuid !== "") {
          report.uuid = report.static.system.uuid;
          machines.set(report.static.system.uuid, report);
        } else {
          report.uuid = report.static.uuid.os;
          machines.set(report.static.uuid.os, report);
        }
      }

      // TESTING DRIVE STUFF
    }
    // console.log(remote);
  });
});

http.listen(port, () => console.log(`Started on port ${port.toString()}`));
