
/**
 * A Bot for Slack!
 */



/**
 * Define a function for initiating a conversation on installation
 * With custom integrations, we don't have a way to find out who installed us, so we can't message them :(
 */

require('dotenv').config()
var fs = require('fs');
var slackBot = require('slackbots');
var Slack = require('nodejslack');
var request = require('request');
var sem = require('semaphore')(1);
var BotkitStorage = require('botkit-storage-mongo');
var customIntegration = require('./lib/custom_integrations');
var app = require('./lib/apps');
var { promisify } = require('util');
var axios = require('axios');
let chrome;

const { getChrome } = require('./lambda_screenshot');
const { graphList, getNewGraph, fetchPanel, uploadGraph, shotFunc, dashboardPrep, graphHelp } = require('./lib/graphFunctions') 
const { mapFromFile, readMappings } = require('./lib/mapFunctions')
const { getTime, formatUptime, DEFAULT_TIME } = require("./lib/timeFunctions");
const { checkPromehteus, alertCheck } = require("./lib/prometheusFunctions");


const CHECK_TIME = 1800000;
var alertsToggle = 0;

const args = process.argv.slice(2);

function onInstallation(bot, installer) {
    if (installer) {
        bot.startPrivateConversation({ user: installer }, function (err, convo) {
            if (err) {
                console.log(err);
            } else {
                convo.say('I am a bot that has just joined your team');
                convo.say('You must now /invite me to a channel so that I can be of use!');
            }
        });
    }
}

/**
 * Configure the persistence options
 */

var config = {};
if (process.env.MONGOLAB_URI) {
    config = {
        storage: BotkitStorage({ mongoUri: process.env.MONGOLAB_URI }),
    };
} else {
    if(args[0] == 1){
        config = {
            json_file_store: ((process.env.TOKEN) ? './db_slack_bot_ci/' : './db_slack_bot_a/'), //use a different name if an app or CI
        };
    }
}

/**
 * Are being run as an app or a custom integration? The initialization will differ, depending
 */




if (process.env.TOKEN || process.env.SLACK_TOKEN) {
    //Treat this as a custom integration
    //if(args[0] == 1){
        var token = (process.env.TOKEN) ? process.env.TOKEN : process.env.SLACK_TOKEN;
        var controller = customIntegration.configure(token, config, onInstallation);   
   // } else {
    //    var token = (process.env.TOKEN) ? process.env.TOKEN : process.env.SLACK_TEST_TOKEN;
     //   var controller = customIntegration.configure(token, config, onInstallation); 
    //}
} else if (!process.env.token) {
    console.log('Error: Specify token in environment');
    process.exit(1);
} else if (process.env.CLIENT_ID && process.env.CLIENT_SECRET && process.env.PORT) {
    //Treat this as an app
    var controller = app.configure(process.env.PORT, process.env.CLIENT_ID, process.env.CLIENT_SECRET, config, onInstallation);
} else {
    console.log('Error: If this is a custom integration, please specify TOKEN in the environment. If this is an app, please specify CLIENTID, CLIENTSECRET, and PORT in the environment');
    process.exit(1);
}

/**
 * A demonstration for how to handle websocket events. In this case, just log when we have and have not
 * been disconnected from the websocket. In the future, it would be super awesome to be able to specify
 * a reconnect policy, and do reconnections automatically. In the meantime, we aren't going to attempt reconnects,
 * WHICH IS A B0RKED WAY TO HANDLE BEING DISCONNECTED. So we need to fix this.
 *
 * TODO: fixed b0rked reconnect behavior
 */
// Handle events related to the websocket connection to Slack
controller.on('rtm_open', async function (bot) {
    chrome = await getChrome();
    console.log('** The RTM api just connected!');
});

controller.on('rtm_close', function (bot) {
    console.log('** The RTM api just closed');
    //controller = app.configure(process.env.PORT, process.env.CLIENT_ID, process.env.CLIENT_SECRET, config, onInstallation);
    process.exit(1);
    // you may want to attempt to re-open
});

/**
 * Core bot logic goes here!
 */
// BEGIN EDITING HERE!


var now = new Date();
var millisTill9 = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0, 0) - now;
if (millisTill9 < 0) {
     millisTill9 += 86400000;
}
setTimeout(function(){
    var now2 = new Date();
    var n = now2.getDay();
    if(n != 0 && n != 6){
        //Give it a different script
        //var script = require("./scripts/placeholder.js");
        var message = {
            client_msg_id: 'f671-d023-4e393a6a-96bad709-e48025c5',
            suppress_notification: false,
            type: 'message',
            text: 'placeholder',
            user: 'UAV3MF1B2',
            team: 'T02SC2P05',
            user_team: '52ST02P0C',
            source_team: 'T02P052SC',
            channel: 'GDUNDDLHJ',
            event_ts: '156659.3084921200',
            ts: '1566492159.308200',
            event: 'direct_mention'
        }
        script.main(message, bot2);
    }
}, millisTill9);

controller.on('bot_channel_join', function (bot, message) {
    bot.reply(message, "I'm here! Type \"Help\" to see avaible commands. :robot_face:");
});

controller.on('bot_message', function (bot, message) {
    try {
        var script = require("./scripts/pagerDuty.js.js");
        try{
            script.main(message, bot);
        } catch(e){
            message.thread_ts = message.ts;
            console.log(e);
            bot.reply(message, "There was an error with the script! Here's a look: ```" + e.message.substring(0, 60)+"```");
        }
    } catch (e) {
        console.log(e);
        message.thread_ts = message.ts;
        bot.reply(message, "The pager duty script seems to be missing. Check the console for more details.");
    }
});

// controller.hears(
//     [new RegExp(/\list\b/i)],
//     ['direct_mention', 'mention', 'direct_message'],
//     function (bot, message) {
//         message.text = "Scripts:\n"
//         var files = fs.readdirSync("./scripts");
//         for (var i = 0; i < files.length; i++) {
//             if (files[i].endsWith(".js")) {
//                 var name = files[i].substring(0, files[i].length - 3);
//                 message.text = message.text + name + "\n";
//             }
//         }
//         bot.sendEphemeral(message);
//     }
// );





/**
 * AN example of what could be:
 * Any un-handled direct mention gets a reaction and a pat response!
 */
controller.on('direct_message,mention,direct_mention', async function (bot, message) {
    console.log(message.text);
    // message.text = "script " + message.text;
    var messageText = message.text.split(" ");
    try {
        console.log("./scripts/" + messageText[0].toLocaleLowerCase() + ".js");
        var script = require("./scripts/" + messageText[0].toLocaleLowerCase() + ".js");
        try{
            message.text = message.text.replace(/  +/g, ' ');
            console.log(message.text);
            var response = await script.main(message, bot);
            // message.thread_ts = message.ts;
            // bot.reply(message, response);
        } catch(e){
            message.thread_ts = message.ts;
            console.log(e);
            bot.reply(message, "There was an error with the script! Here's a look: ```" + e.message.substring(0, 60)+"```");
        }
    } catch (e) {
        console.log(e);
        message.text = "I don't know what you mean... Type \"Help\" and maybe I can help. :robot_face:"
        bot.sendEphemeral(message);
    }
});






