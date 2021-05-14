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

let hackerMessage = { message: "Brute force attack detected, your IP has been added to the watchlist", link: "https://media.tenor.co/videos/04092e8b7235c59632755352927cf20f/mp4"};

app.get("/blog/wp-includes/wlwmanifest.xml",      (req, res) => res.send(hackerMessage));
app.get("/web/wp-includes/wlwmanifest.xml",       (req, res) => res.send(hackerMessage));
app.get("/wordpress/wp-includes/wlwmanifest.xml", (req, res) => res.send(hackerMessage));
app.get("/website/wp-includes/wlwmanifest.xml",   (req, res) => res.send(hackerMessage));
app.get("/wp/wp-includes/wlwmanifest.xml",        (req, res) => res.send(hackerMessage));
app.get("/news/wp-includes/wlwmanifest.xml",      (req, res) => res.send(hackerMessage));
app.get("/2020/wp-includes/wlwmanifest.xml",      (req, res) => res.send(hackerMessage));
app.get("/2019/wp-includes/wlwmanifest.xml",      (req, res) => res.send(hackerMessage));
app.get("/shop/wp-includes/wlwmanifest.xml",      (req, res) => res.send(hackerMessage));
app.get("/wp1/wp-includes/wlwmanifest.xml",       (req, res) => res.send(hackerMessage));
app.get("/test/wp-includes/wlwmanifest.xml",      (req, res) => res.send(hackerMessage));
app.get("/wp2/wp-includes/wlwmanifest.xml",       (req, res) => res.send(hackerMessage));
app.get("/site/wp-includes/wlwmanifest.xml",      (req, res) => res.send(hackerMessage));
app.get("/cms/wp-includes/wlwmanifest.xml",       (req, res) => res.send(hackerMessage));
app.get("/sito/wp-includes/wlwmanifest.xml",      (req, res) => res.send(hackerMessage));
app.get("/TP/public/index.php",                   (req, res) => res.send(hackerMessage));
app.get("/TP/index.php",                          (req, res) => res.send(hackerMessage));
app.get("/thinkphp/html/public/index.php",        (req, res) => res.send(hackerMessage));
app.get("/html/public/index.php",                 (req, res) => res.send(hackerMessage));
app.get("/public/index.php",                      (req, res) => res.send(hackerMessage));
app.get("/TP/html/public/index.php",              (req, res) => res.send(hackerMessage));
app.get("/elrekt.php",                            (req, res) => res.send(hackerMessage));
app.get("/index.php",                             (req, res) => res.send(hackerMessage));
app.get("/wp-includes/wlwmanifest.xml",           (req, res) => res.send(hackerMessage));
app.get("/xmlrpc.php?rsd",                        (req, res) => res.send(hackerMessage));
app.get("/2018/wp-includes/wlwmanifest.xml",      (req, res) => res.send(hackerMessage));
app.get("/media/wp-includes/wlwmanifest.xml",     (req, res) => res.send(hackerMessage));
app.get("/.env",                                  (req, res) => res.send(hackerMessage));
app.get("/",                                      (req, res) => res.send(hackerMessage));
app.get("/info.php",                              (req, res) => res.send(hackerMessage));
app.get("/config.send",                           (req, res) => res.send(hackerMessage));
app.get("/.git/config",                           (req, res) => res.send(hackerMessage));
app.get("/v2/_catalog",                           (req, res) => res.send(hackerMessage));
app.get("/api/search?folderIds=0",                (req, res) => res.send(hackerMessage));
app.get("/idx_config/",                           (req, res) => res.send(hackerMessage));
app.get("/telescope/requests",                    (req, res) => res.send(hackerMessage));
app.get("/server-status",                         (req, res) => res.send(hackerMessage));

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
    // name: socket.handshake.auth.static.os.hostname,
  });

  socket.on("report", async (report) => {
    if (report.name) {

        // Parse RAM usage & determine used
        report.ram.used = parseFloat(((report.ram.total - report.ram.free) / 1024 / 1024 / 1024).toFixed(2));
        report.ram.total = parseFloat((report.ram.total / 1024 / 1024 / 1024).toFixed(2));
        report.ram.free = parseFloat((report.ram.free / 1024 / 1024 / 1024).toFixed(2));

        // Parse CPU usage
        report.cpu = parseInt(report.cpu);

        // Remove dashes from UUID
        report.uuid = report.uuid.replace(/-/g, "");

        if (Array.isArray(report.network)) {
            // Clear out null interfaces
            report.network = report.network.filter((iface) => iface.tx_sec !== null && iface.rx_sec !== null);

            // Get total network interfaces
            totalInterfaces = report.network.length;

            // Combine all bandwidth together
            let TxSec = (report.network.reduce((a, b) => a + b.tx_sec, 0) * 8) / 1000 / 1000;
            let RxSec = (report.network.reduce((a, b) => a + b.rx_sec, 0) * 8) / 1000 / 1000;

            // Replace whats there with proper data
            report.network = {
                totalInterfaces,
                TxSec: parseFloat(TxSec.toFixed(2)),
                RxSec: parseFloat(RxSec.toFixed(2)),
            };

            machines.set(report.uuid, report);
      }
    }
  });
});

http.listen(port, () => console.log(`Started on port ${port.toString()}`));
