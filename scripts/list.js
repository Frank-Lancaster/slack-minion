var fs = require('fs');

exports.main = function main(message, bot){
    message.text = "Here's a list of all the scripts you can run:\n"
        var files = fs.readdirSync("./scripts");
        message.text = message.text + "```";
        for (var i = 0; i < files.length; i++) {
            if (files[i].endsWith(".js")) {
                var name = files[i].substring(0, files[i].length - 3);
                
                try{
                    var script = require("./" + name);
                    var desc = script.desc(message, bot);
                    
                    message.text = message.text  + name + "\n-" + desc + "\n";
                } catch (e){
                    var script = require("./" + name);
                    message.text = message.text + name + "   " + "No description provided" + "\n";
                }
                
            }
        }
        message.text = message.text + "```";
        bot.sendEphemeral(message);
}

exports.desc = function desc(){
    return "Lists all scripts"
}