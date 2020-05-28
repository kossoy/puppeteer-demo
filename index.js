const Insta = require('./Insta');

(async () => {

    const insta = new Insta();
    const startTime = insta.moment();

    await insta.initPuppetter().then(() => insta.debug("PUPPETEER INITIALIZED"));
    await insta.login().then(() => insta.debug("LOGGED IN"));

    let hashTagPeopleUrls = {};
    for (const hashTag of insta.config.hashTags) {
        hashTagPeopleUrls[hashTag] = await insta.getHashTagPeople(hashTag);
    }

    let followersData = [];
    for (const hashTag in hashTagPeopleUrls) {
        insta.info(`PROCESSING HASHTAG: ${hashTag}`)
        for (const person of hashTagPeopleUrls[hashTag]) {
            const personPage = await insta.getPersonPage(person);
            const followers = insta.toInt(await insta.getPersonFollowers(personPage));

            let infoMsg = `${hashTag}> PERSON PAGE: ${personPage}, FOLLOWERS: ${followers}`;
            if (followers > insta.config.followMin && followers < insta.config.followMax) {
                const entry = {
                    username: insta.getUserFromUrl(personPage),
                    page: personPage,
                    followers: followers,
                    hashTag: hashTag
                };
                followersData.push(entry);
                const userId = insta.getMd5(personPage);
                const isNull = await insta.db.getVocalist(userId);
                if (isNull) {
                    await insta.db.addVocalists(userId, entry);
                }
            } else {
                infoMsg = `${infoMsg}, NOT GOOD`;
            }
            insta.info(infoMsg);
        }
    }

    insta.recordFollowers(followersData);

    await insta.takeScreenShot().then(screenshot => insta.debug(`SCREENSHOT IN: ${screenshot}`))
    await insta.makePDF().then(pdf => insta.debug(`PDF IN: ${pdf}`))

    await insta.closeBrowser().then(() => insta.debug("BROWSER CLOSED"));
    insta.log(`EXECUTION TIME - ${insta.moment().diff(startTime, "seconds")} SECONDS`);
})();


