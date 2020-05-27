const Insta = require('./Insta');

(async () => {

    const insta = new Insta();
    const startTime = insta.moment();

    await insta.initPuppetter().then(() => insta.debug("PUPPETEER INITIALIZED"));
    await insta.login().then(() => insta.debug("LOGGED IN"));

    let people = [];
    for (const hashTag of insta.config.hashTags) {
        people = people.concat(await insta.getHashTagPeople(hashTag));
    }

    let followersData = [];
    for (const person of people) {
        const personPage = await insta.getPersonPage(person);
        const followers = insta.toInt(await insta.getPersonFollowers(personPage));

        let infoMsg = `PERSON PAGE: ${personPage}, FOLLOWERS: ${followers}`;
        if (followers > 1000 && followers < 10000) {
            followersData.push({
                page: personPage,
                followers: followers
            })
        } else {
            infoMsg = `${infoMsg}, NOT GOOD`;
        }
        insta.info(infoMsg);
    }

    insta.recordFollowers(followersData);

    await insta.takeScreenShot().then(screenshot => insta.debug(`SCREENSHOT IN: ${screenshot}`))
    await insta.makePDF().then(pdf => insta.debug(`PDF IN: ${pdf}`))

    await insta.closeBrowser().then(() => insta.debug("BROWSER CLOSED"));
    insta.log(`EXECUTION TIME - ${insta.moment().diff(startTime, "seconds")} SECONDS`);
})();


