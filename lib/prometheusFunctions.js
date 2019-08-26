const axios = require('axios');
const graphFunctions = require('./graphFunctions');
const { readMappings } = require('./mapFunctions');
const path = require('path');
var fs = require('fs');
const { graphList, getNewGraph, fetchPanel, uploadGraph, shotFunc, fetchGraph, dashboardPrep } = require('./graphFunctions') 


function alertCheck(bot, message, alertsToggle, chrome) {
    if (alertsToggle === 1) {
        checkPromehteus(bot, message, chrome);
    }
}

async function checkPromehteus(bot, message, chrome) {
    console.log(message.text);
    axios({
        method: 'get',
        url: process.env.prom,
        responseType: 'JSON'
    })
        .then(async function (response) {
            var resArr = response.data.data.result;
            if (resArr.length === 0) {
                bot.reply(message, "No current alerts on Prometheus.");
            }
            else {
                var alerts = [];
                var apps = [];
                var urls = [];
                let rawdata = fs.readFileSync("./alerts/blacklist.json");
                let blacklistJSON = JSON.parse(rawdata);
                for (var i = 0; i < resArr.length; i++) {
                    if (!alerts.includes(resArr[i].metric.alertname)) {
                        if (!blacklistJSON.blacklist.includes(resArr[i].metric.alertname)) {
                            if (resArr[i].metric.alertstate === "firing") {
                                bot.reply(message, "ALERT: " + resArr[i].metric.alertname + ". Let me grab you some information.");
                                if (!apps.includes(resArr[i].metric.app)) {
                                    try {
                                        const alertPath = path.resolve(__dirname, "../alerts/alerts.json");
                                        let rawdata = fs.readFileSync(alertPath);
                                        let appList = JSON.parse(rawdata);
                                        for (var j = 0; j < appList[resArr[i].metric.app].dashboards.length; j++) {
                                            if (!urls.includes(appList[resArr[i].metric.app].dashboards[j])) {
                                                try {
                                                    var message2 = message;
                                                    message2.thread_ts = message2.ts;
                                                    bot.reply(message2, "Dashboard link: " + appList[resArr[i].metric.app].dashboards[j]);
                                                    await shotFunc(bot, message, appList[resArr[i].metric.app].dashboards[j], appList[resArr[i].metric.app].dashboards[j], chrome, ".react-grid-layout");
                                                } catch (err) {
                                                    console.log("Could not fetch dashboard", err);
                                                }
                                                urls = urls + appList[resArr[i].metric.app].dashboards[j];
                                            }   
                                        }
                                        alerts = alerts + resArr[i].metric.alertname;
                                        apps = apps + resArr[i].metric.app;
                                    } catch (err) {
                                        console.log("error " + err);
                                        bot.reply(message, "There was no configurations set up to handle " + resArr[i].metric.app + ".");
                                    }
                                }

                            }
                        } else {
                            bot.reply(message, "ALERT: " + resArr[i].metric.alertname + ", but it is blacklisted.");
                            alerts = alerts + resArr[i].metric.alertname;
                        }
                    }
                    let triggersData = fs.readFileSync("./alerts/triggers.json");
                    let triggersJSON = JSON.parse(triggersData);
                    for(var key in triggersJSON){
                        if(resArr[i].metric.alertname.includes(key)){
                            if (!urls.includes(triggersJSON[resArr[i].metric.app])) {
                                try {
                                    await shotFunc(bot, message, triggersJSON[key], triggersJSON[key], chrome, ".react-grid-layout");
                                } catch (err) {
                                    console.log("Could not fetch dashboard", err);
                                }
                                urls = urls + triggersJSON[resArr[i].metric.app];
                            }   
                        }
                    }
                }
            }
        });
}

var exported = {
    checkPromehteus,
    alertCheck
}

module.exports = exported