const base32 = require('hi-base32');
var fs = require('fs');
//const kibana = require('../kibana/dash.json');
const { shotFunc } = require('../lib/graphFunctions')
const { getChrome } = require('../lambda_screenshot');

let chrome;

exports.main = async function main(message, bot) {

    var messageText = message.text.split(" ");
    if (messageText[1]) {
        if (messageText[1].toLocaleLowerCase() == "search") {

            if (messageText[2].toLocaleLowerCase() == "help") {
                message.text = "Type ```kibana search \"(kibana query)\" (time)``` to see the result of that query. Make sure to include the quotes on your query!\nIndexes include: his, cap, log";
                message.text = message.text
                bot.sendEphemeral(message);
                return;
            }
            message.text = message.text.replace(/“/g, "\"").replace(/”/g, "\"")
            var index = message.text.indexOf("\"") + 1;
            var lastIndex = message.text.lastIndexOf("\"");
            var query = message.text.substring(index, lastIndex);
            messageText = message.text.split("\"");
            if (messageText.length < 3) {
                message.text = "Did you include quotes around your query? Type ```kibana search help``` for help.";
                message.text = message.text
                bot.sendEphemeral(message);
                return;
            }
            //Change me!
            var url = "kibanaPlaceholderURL.com";
            // /query:%.+?(,)/g
            query = "'" + query.replace(/ /g, "%20") + "'),";
            //query = query.replace(/ /g, "%20");
            url = url.replace(/query:'.+?(,)/g, "query:" + query);
            if (!messageText[messageText.length - 1].includes("\"") && !messageText[messageText.length - 1] == "") {
                url = url.replace(/30d/g, messageText[messageText.length - 1].substring(1));
            }
            var chrome = await getChrome();
            message.thread_ts = message.ts;
            bot.reply(message, "Alright, let me query Kibana...\nHere's the link in the meantime: " + url);
            try {
                await shotFunc(bot, message, url, "Kibana", chrome, ".dscWrapper__content");
            } catch (e) {
                bot.reply(message, "There was an issue with your request. Does your Kibana query have the proper syntax?");
            }
        } else {
            message.text = "Type \"kibana search help\" for help on the search command.";
            bot.sendEphemeral(message);
            //bot.reply(message, "I got " + result + ".");
            //return "Please use the \"dash\" keyword";
        }
    } else {
        message.text = "Type \"kibana search help\" for help on the search command.";
        bot.sendEphemeral(message);
        //bot.reply(message, "I got " + result + ".");
        //return "Please use the \"dash\" keyword";
    }
}

exports.desc = function desc() {
    return "Query on Kibana"
}
