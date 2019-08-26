const { getChrome } = require('../lambda_screenshot');
const { checkPromehteus, alertCheck } = require("../lib/prometheusFunctions");

exports.main = async function main(message, bot) {
    if (message.username === 'PagerDuty' && message.attachments[0].fallback.toLocaleLowerCase().includes("triggered")) {
        message.thread_ts = message.ts;
        bot.reply(message, "Let me see what I can find on Prometheus.");
        let chrome = await getChrome();
        checkPromehteus(bot, message, chrome);
    } else {
        message.text = "Hey! Don't touch that.";
        bot.sendEphemeral(message);
    }
}

exports.desc = function desc(){
    return "Used to interface with Pager Duty"
}