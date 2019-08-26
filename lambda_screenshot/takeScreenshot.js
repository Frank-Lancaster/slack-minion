const URL = require("url");
const { uploadScreenshot } = require("./uploadScreenshot");

exports.takeScreenshot = async (browser, targetUrl, elementString) => {
    const page = await browser.newPage();
    if(targetUrl.includes("kibana")){
        await page.setViewport({
            width: 2000,
            height: 600,
            isMobile: false
        });
    } else {
        await page.setViewport({
            width: 2000,
            height: 8000,
            isMobile: false
        });
    } 
    

    console.log("Requesting", targetUrl);

    await page.goto(targetUrl, {
        waitUntil: ["networkidle0"],

    });

    await page.waitFor(10000);

    console.log("page loaded");
    console.log("Looking for " + elementString);

    let element = await page.$(elementString);
    return await upload(element, page);
};
async function upload(element, page) {
    const { x, y, width, height } = await element.boundingBox();
    const imagePath = `/tmp/screenshot-${new Date().getTime()}.png`;
    console.error("Loaded target element");
    await page.screenshot({
        path: imagePath,
        clip: {
            x: x + 2,
            y: y + 2,
            width: width - 2,
            height: height - 2
        }
    });
    console.error("Made screeshot");
    const url = await uploadScreenshot(imagePath);
    console.error("Got url", url);
    page.close();
    return imagePath;
}

