const axios = require('axios');
var util = require('util')


exports.main = function main(message, bot){
    

    var urls = ["https://gitPlaceHolderURL/api/v4/groups/2727/merge_requests?state=opened"];

    bot.reply(message, "Here are your open merge requests: ");

    for(var i = 0; i < urls.length; i++){
        axios({
            method: 'get',
            url: urls[i],
            responseType: 'JSON'
        }).then(function (response) {

            var reply = "";
            console.log(message);
            response = response.data;
            for(var i in response){
                try{
                    if(!response[i].title.includes("WIP")){
                    reply = reply + "```" + response[i].title + " by " + response[i].author.name  + "```\nLink: " + response[i].web_url + "\n";
                    }
                } catch(e){
                    console.log(e);
                }
            }
            bot.reply(message, reply);
        })
    }
    
}

exports.desc = function desc(){
    return "Lists all open merge requests for the supplied repos."
}

