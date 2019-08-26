const getChrome = require("./getChrome");

const { optimizeImage } = require("./optimizeImage");
const { takeScreenshot } = require("./takeScreenshot.js.js");

const screenshotHandler = async (url, context) => {
    // For keeping the browser launch
    context.callbackWaitsForEmptyEventLoop = false;
    const chrome = await getChrome();

    console.log("got chrome");
    console.log(chrome);

    const headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Credentials": true,
        "access-control-allow-methods": "GET"
    };


    try {
        let result = await takeScreenshot(chrome, url);

        return result;
    } catch (e) {
        console.error('Could not take screenshot', e);
        throw(e); 
    }
};

module.exports = {
    takeScreenshot,
    optimizeImage,
    screenshotHandler,
    getChrome
};

