const { graphList, getNewGraph, fetchPanel, uploadGraph, shotFunc, dashboardPrep, graphHelp } = require('../lib/graphFunctions')
var fs = require('fs');
const { getTime, formatUptime, DEFAULT_TIME } = require("../lib/timeFunctions");
const { getChrome } = require('../lambda_screenshot');

exports.main = async function main(message, bot) {
    var arguements = message.text.split(" ");
    if (arguements.length == 1) {
        graphByItself(message, bot)
    }
    if (arguements.length == 2) {
        graphBoardNoTime(message, bot)
    }
    if (arguements.length == 3) {
        graphDashboardWithTime(message, bot);
    }
    if( arguements.length == 4) {
        console.log(message.text);
        message.thread_ts = message.ts;
        fetchPanel(bot, message, DEFAULT_TIME);
    }
}

async function graphByItself(message, bot) {
    message.text = "You need to give me something to graph! If you need help, say \"graph help\".";
    bot.sendEphemeral(message);
}

async function graphBoardNoTime(message, bot) {
    console.log(message.text);
    var messageText = message.text.toLowerCase().split(" ");
    if (fs.existsSync("./graph/" + messageText[1] + ".json")) {
        message.text = message.text + " 1h";
        message.thread_ts = message.ts;
        let chrome = await getChrome();
        dashboardPrep(bot, message, chrome);
    }
    else if (messageText[1] === "help") {
        graphHelp(bot, message, DEFAULT_TIME);
    }
    else if (messageText[1] === "list") {
        graphList(bot, message);
    }
    else {
        message.text = "Not a valid dashboard. Say \"graph list\" for a list of dashboards you can ask me for.";
        bot.sendEphemeral(message);
    }
}

async function graphDashboardWithTime(message, bot) {
    console.log(message.text);
    var messageText = message.text.toLowerCase().split(" ");
    if (/\d/.test(messageText[2])) {
        if (fs.existsSync("./graph/" + messageText[1] + ".json")) {
            message.thread_ts = message.ts;
            let chrome = await getChrome();
            dashboardPrep(bot, message, chrome);
        } else {
            message.text = "Not a valid panel. Say \"graph list\" for a list of panels you can ask me for.";
            bot.sendEphemeral(message);
        }
    } else if (messageText[2].toLocaleLowerCase() === "list") {
        if (fs.existsSync("./graph/" + messageText[1] + ".json")) {
            let rawdata = fs.readFileSync("./graph/" + messageText[1] + ".json");
            let dashboard = JSON.parse(rawdata);
            var panels = "Keywords:\n";
            for (var key in dashboard.panels) {
                panels = panels + key.toLocaleLowerCase() + " - " + dashboard.panels[key].desc + "\n";
            }
            if (panels === "Keywords:\n") {
                panels = "No panels for this dashboard.";
            }
            var reply = {
                "attachments": [{
                    "title": "Dashboard: " + messageText[1].toLocaleLowerCase() + " - " + dashboard.desc,
                    "text": panels
                }]
            };
            message.text = "";
            message.attachments = reply.attachments;
            bot.sendEphemeral(message);
        } else {
            message.text = "Not a valid dashboard. Say \"graph list\" for a list of dashboards you can ask me for.";
            bot.sendEphemeral(message);
        }
    } else {
        message.thread_ts = message.ts;
        message.text = message.text + " 1h";
        fetchPanel(bot, message, DEFAULT_TIME);
    }
}

exports.desc = function desc(){
    return "Graph Grafana dashboards and panels"
}