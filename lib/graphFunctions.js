const fs = require('fs');
const { mapFromFile, readMappings } = require('./mapFunctions')
const { promisify } = require('util');
const { getTime, getNewGraph, DEFAULT_TIME } = require('./timeFunctions')
const request = require('request');
var Slack = require('nodejslack');
var sem = require('semaphore')(1);
const { takeScreenshot } = require('../lambda_screenshot');



async function graphList(bot, message) {
    var files = fs.readdirSync("./graph");
    for (var i = 0; i < files.length; i++) {
        if (files[i].endsWith(".json")) {
            let rawdata = fs.readFileSync("./graph/" + files[i]);
            let dashboard = JSON.parse(rawdata);
            var reply = {
                "attachments": [{
                    "title": "Dashboard: " + files[i].replace(".json", "") + " - " + dashboard.desc
                }]
            };
            message.text = "";
            message.attachments = reply.attachments;
            bot.sendEphemeral(message);
        }
    }
}

function graphHelp(bot, message, DEFAULT_TIME) {
    var reply = {
        "attachments": [{
            "title": "You can request dashboards and panels from me",
            "text": "Examples:\ngraph meta - This will return the whole meta dashboard.\ngraph meta 5h - This will return the whole meta dashboard over the past 5 hours.\ngraph meta restreq - This will return the rest requests panel from the meta dashboard.\ngraph meta restreq 30m - This will return the rest requests panel from the meta dashboard over the past 30 minutes."
        }, {
            "title": "Timeframes",
            "text": "If you don't give me a time, I'll default to " + DEFAULT_TIME + ".\nTimes can be specified in minutes (m), hours (h), or days (d)."

        }, {
            "title": "List of dashboards and panels",
            "text": "If you'd like to see a list of all dashboards and panels you can request, say \"graph list\".\nYou can see all the panels for a specific dashboard by saying \"graph (dashboard name) list\"."
        }]
    }
    message.text = "";
    message.attachments = reply.attachments;
    bot.sendEphemeral(message);
}


async function fetchPanel(bot, message, DEFAULT_TIME) {
    var messageText = message.text.toLowerCase().split(" ");
    if (fs.existsSync("./graph/" + messageText[1] + ".json")) {
        let rawdata = fs.readFileSync("./graph/" + messageText[1] + ".json");
        let dashboard = JSON.parse(rawdata);
        if(dashboard.panels.hasOwnProperty(messageText[2].toLocaleUpperCase())){
            var panelToGet = messageText[2].toUpperCase();
            if(!dashboard.panels[panelToGet].url.includes("from=") || !dashboard.panels[panelToGet].url.includes("to=")){
                dashboard.panels[panelToGet].url = dashboard.panels[panelToGet].url + "&from=now-3h&to=now";
            }
            var oldGraph = dashboard.panels[panelToGet].url;
            var oldStart = "";
            var oldStartIndex = oldGraph.indexOf("from=") + 5;
            if (messageText[3].includes('.') || !(/\d/.test(messageText[3])) || ((messageText[3][messageText[3].length - 1] != 'm') && (messageText[3][messageText[3].length - 1] != 'h') && (messageText[3][messageText[3].length - 1] != 'd'))) {
                bot.reply(message, "Invalid time! Defaulting to " + DEFAULT_TIME + ".");
                messageText[3] = DEFAULT_TIME;
            }
            bot.reply(message, "Graphing " + dashboard.panels[panelToGet].desc + " over " + messageText[3] + "...");
            var newGraph = getTime(messageText[3], oldGraph, oldStartIndex, oldStart);
            await download(newGraph.newGraph, "image.png");
            upload(message, bot, "image.png", dashboard.panels[panelToGet].desc);
        } else {
            message.text = "Not a valid panel. Say \"graph list\" for a list of panels you can ask me for.";
            bot.sendEphemeral(message);
        }
    }
}

var download = function (uri, filename) {
    return new Promise(function (resolve, reject) {
        request(uri).pipe(fs.createWriteStream(filename).on('close', resolve));
    });
};

function upload(message, bot, filepath, itemName, url) {
    // Creating instance to connect to Slack. check: https://github.com/marcogbarcellos/nodejslack
    var slack = new Slack(process.env.SLACK_TOKEN);
    var datetime = new Date();
    var form = {
        file: fs.createReadStream(filepath), // Optional, via multipart/form-data. If omitting this parameter, you MUST submit content
        filename: (itemName + datetime), // Required 
        thread_ts: message.ts,
        fileType: 'post', // Optional, See more file types in https://api.slack.com/types/file#file_types
        channels: message.channel //Optional, If you want to put more than one channel, separate using comma, example: 'general,random'
    };
    slack.fileUpload(form)
        .then(function (response) {
            if (!response || !response.ok) {
                return Promise.reject(new Error('Something wrong happened during the upload.'));
            }

            // try{
            //     var postedNameRegex = itemName.match(/\/(.*)\?/g);
            //     postedNameRegex = postedNameRegex[0];
            //     var postedName = "";
            //     for(var i = postedNameRegex.length-2; i > 0; i = i - 1 ){
            //         if(postedNameRegex[i] === "/"){
            //             break;
            //         }
            //         postedName = postedNameRegex[i] + postedName;
            //     }
            //     postedName = postedName.replace(/-/g, " ");
            //     postedName = postedName.toLowerCase()
            //         .split(' ')
            //         .map((s) => s.charAt(0).toUpperCase() + s.substring(1))
            //         .join(' ');
            //     bot.reply(message, "Ok, here's the " + postedName + " board. Link: " + itemName);
            // } catch(e){
            //     if(url){
            //         bot.reply(message, "Ok, here's " + itemName + ". Link: " + url);
            //     } else {
            //         bot.reply(message, "Ok, here's " + itemName + ".");
            //     }
            // }
            return Promise.resolve(response);
        })
        .catch(function (err) {
            console.log('Failed on Uploading: ', err);
        });
};

async function shotFunc(bot, message, url, itemName, chrome, element) {
    sem.take(async function () {
        try {
            let imgPath = await takeScreenshot(chrome, url, element);
            await upload(message, bot, imgPath, itemName, url);
        } catch (e) {
            bot.reply(message, "Error on scraping URL. Try again.");
            console.log(e);
        }
        sem.leave();
    });
}

async function dashboardPrep(bot, message, chrome){
    var messageText = message.text.toLowerCase().split(" ");
    let rawdata = fs.readFileSync("./graph/" + messageText[1] + ".json");
    let dashboard = JSON.parse(rawdata);
    if(!dashboard.url.includes("from=") || !dashboard.url.includes("to=")){
        dashboard.url = dashboard.url + "&from=now-3h&to=now";
    }
    var oldGraph = dashboard.url;
    var oldStart = "";
    var oldStartIndex = oldGraph.indexOf("from=") + 5;
    if(messageText[2]){
        if (messageText[2].includes('.') || !(/\d/.test(messageText[2])) || ((messageText[2][messageText[2].length - 1] != 'm') && (messageText[2][messageText[2].length - 1] != 'h') && (messageText[2][messageText[2].length - 1] != 'd'))) {
            bot.reply(message, "Invalid time! Defaulting to " + DEFAULT_TIME + ".");
            messageText[2] = DEFAULT_TIME;
        }
    }
    var newGraph = getTime(messageText[2], oldGraph, oldStartIndex, oldStart);
    bot.reply(message, "Fetching dashboard " + messageText[1] + " - " + dashboard.desc + ".\nHere's the link in the meantime: " + newGraph.newGraph );
    await shotFunc(bot, message, newGraph.newGraph, dashboard.desc, chrome, ".react-grid-layout");
}


const exported = {
    getNewGraph,
    fetchPanel,
    graphList,
    uploadGraph: upload,
    shotFunc,
    graphHelp,
    dashboardPrep,
    upload
}
module.exports = exported;