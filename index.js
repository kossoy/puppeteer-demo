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

    for (const hashTag in hashTagPeopleUrls) {
        for (const person of hashTagPeopleUrls[hashTag]) {
            const personPage = await insta.getPersonPage(person)
                .catch(e => {
                    insta.error(`CANNOT GET ${person} PAGE`);
                    insta.error(e);
                });
            const followers = insta.toInt(
                await insta.getPersonFollowers(personPage)
                    .catch(e => {
                        insta.error(`CANNOT GET ${personPage} FOLLOWERS`);
                        insta.error(e);
                    })
            );

            let infoMsg = `${hashTag}> PERSON PAGE: ${personPage}, FOLLOWERS: ${followers}`;
            if (followers > insta.config.followMin && followers < insta.config.followMax) {
                const personName = insta.getUserFromUrl(personPage);
                const entry = {
                    username: personName,
                    page: personPage,
                    followers: followers,
                    hashTag: hashTag,
                    added: insta.timestamp
                };
                insta.info(`PROCESSING: ${personName}`);
                const userId = insta.getMd5(personPage);
                const vocalist = await insta.db.getVocalist(userId);
                if (!vocalist) {
                    await insta.db.addVocalists(userId, entry)
                        .then(() => {
                            insta.log(`ADDED ${userId} TO DB`);
                            insta.makePDF(personName).then(pdf => insta.debug(`PDF IN: ${pdf}`));
                        })
                        .catch(e => {
                            insta.error(`ERROR ADDING ${personName} TO DB`);
                            insta.error(e);
                        });
                } else {
                    insta.info(`${personName} already added`);
                }
            } else {
                infoMsg = `${infoMsg}, NOT GOOD`;
            }
            insta.debug(infoMsg);
        }
    }

    await insta.closeBrowser().then(() => insta.debug("BROWSER CLOSED"));

    insta.log(`EXECUTION TIME - ${insta.moment().diff(startTime, "seconds")} SECONDS`);
    process.exit(0);
})();


