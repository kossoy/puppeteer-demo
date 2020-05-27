const puppeteer = require('puppeteer');
const fs = require('fs');

const url = 'https://www.instagram.com/hannahloupark/';
const selector = 'div > section > main > div > header > section > ul > li > a';
const scrShotFile = `resources/scr-${new Date().toISOString()}.png`;
const logFile = `resources/text-file.txt`;

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);

    await page.screenshot({path: scrShotFile});

    const html = await page.$eval(selector, e => e.innerText);

    console.log(html);
    fs.appendFile(logFile, `${html}\n`, err => {
        if (err) console.log(err);
    });

    await browser.close();
})();

