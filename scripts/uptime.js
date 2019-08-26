const { formatUptime } = require("../lib/timeFunctions");


exports.main = function main(message, bot){
    console.log(message.text);
    message.thread_ts = message.ts;
    var uptime = formatUptime(process.uptime());
    bot.reply(message, "I've been awake for " + uptime + ".");
}

exports.desc = function desc(){
    return "Tells you the bot's uptime"
}