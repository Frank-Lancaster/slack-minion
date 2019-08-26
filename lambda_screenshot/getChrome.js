const puppeteer = require('puppeteer');

const getChrome = async () => {
    return puppeteer.launch({
        headless: true,
        slowMo: process.env.SLOWMO_MS,
        dumpio: true,
        executablePath: process.env.CHROME_PATH || './node_modules/puppeteer/.local-chromium/mac-662092/chrome-mac/Chromium.app/Contents/MacOS/Chromium'
        // use chrome installed by puppeteer
    });
};

module.exports = getChrome;
