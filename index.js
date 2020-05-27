const Insta = require('./Insta');

(async () => {

    const insta = new Insta();
    const startTime = insta.moment();

    await insta.initPuppetter().then(() => insta.debug("PUPPETEER INITIALIZED"));
    await insta.login().then(() => insta.debug("LOGGED IN"));
    await insta.getFollowers().then(followers => {
        insta.recordFollowers(followers);
        insta.info(`FOLLOWERS: ${followers}`);
    })
    await insta.takeScreenShot().then(screenshot => insta.debug(`SCREENSHOT IN: ${screenshot}`))
    await insta.makePDF().then(pdf => insta.debug(`PDF IN: ${pdf}`))

    await insta.closeBrowser().then(() => insta.debug("BROWSER CLOSED"));
    insta.log(`EXECUTION TIME - ${insta.moment().diff(startTime, "seconds")} SECONDS`);
})();


