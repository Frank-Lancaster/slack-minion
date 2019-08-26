exports.main = async function main(message, bot) {
    bot.reply(message, "Goodbye...");
    process.exit(0);
}

exports.desc = function desc(){
    return "Restarts the bot"
}