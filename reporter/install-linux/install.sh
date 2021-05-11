#!/bin/sh

mkdir /etc/xornet
wget "https://github.com/Geoxor/Xornet/releases/download/v0.09/xornet-reporter-v0.09.bin.09" -P /etc/xornet
chmod +x /etc/xornet/xornet-reporter-v0.09.bin.09
echo "Xornet reporter downloaded!"
sudo wget "https://cdn.discordapp.com/attachments/808856125817618532/841671047011106836/xornet.service" -P /etc/systemd$systemctl enable xornet
systemctl start xornet
systemctl status xornet