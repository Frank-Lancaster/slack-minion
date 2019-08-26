var { promisify } = require('util');
var fs = require('fs');


async function mapFromFile(messageText) {
    var responseMappings = "placeholder";
    let data = await readMappings(responseMappings, "./graph/" + messageText + ".txt");
    responseMappings = data.toString();
    var responseArray = responseMappings.split('\n');
    return responseArray;
}

async function readMappings(response, file) {
    const readFileAsync = promisify(fs.readFile);
    return await readFileAsync(file);
}

var exported = {
    readMappings,
    mapFromFile
}

module.exports = exported;