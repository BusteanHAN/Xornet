![Xornet Logo](https://cdn.discordapp.com/attachments/806300597338767450/840561743804891166/unknown.png)

# Information
We are XORNET this is a fun little project started by @Geoxor for people who have servers and don’t have shit to do with them , our goal is to let people use our software to manage their servers!

Heres the discord server for you to join
https://discord.gg/geoxor

# Reporter
The reporter is the main binary app that you can easily download and install on your VMs or servers, it takes care of reporting system information to http://xornet.cloud and its lightweight!

The compiled binaries work on the following operating systems:
  - Debian
  - Windows 10
  - Windows Server 2019

The reporter can be run using node.js at least on:
  - Debian
  - Ubuntu
  - Manjaro
  - Raspbian
  - Windows 10
  - Windows Server 2019
 
# TODO
- Updater for Reporter (using Electron)
- Figure out why the front-end lags
- Comment the code since people are actually forking the code
- Fix width of column titles on taskmanager because the chevron conflicts the adjescent divs
- Make the infoFields actually display info about that specific machine you clicked on instead of showing the totals of the entire network (however we still want to have the totals of the entire network in a home dashboard instead)
- Make the disks show their drive letter or even total space in GB/TB on the gauges
- Make the disk usage show properly on the taskmananger
- Update the OS icons to black instead of blue-ish black so they work properly on darkmode
- Match the rogue colors to GitHubs red colors since thats what color pallete we use as reference for darkmode
- Make it so when machines disconnect they get grayscaled and marked as disconnected on the frontend taskmanager and add an option to hide disconnected machines just like rogues
- Figure out how to properly implement chart.js with vue so we dont have to force refresh/recreate the entire graph from scratch (vue-chart.js doesn't work due to us using Vue 3 whereas vue-chart.js works only with Vue 2)
  
# Disclaimer
We don't know how to code, if you get hacked, its your fault for not committing.
