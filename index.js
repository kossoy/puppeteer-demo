const Insta = require('./Insta');
const _ = require('lodash');


(async () => {

    const insta = new Insta();
    const startTime = insta.moment();

    await insta.initPuppetter().then(() => insta.debug("PUPPETEER INITIALIZED"));
    await insta.login().then(() => insta.debug("LOGGED IN")).catch(e => {
        insta.error(`CANNOT LOGIN`);
        insta.error(e);
    });

    let hashTagPeopleUrls = {};
    let hashTagPeopleArr = [];
    for (const hashTag of insta.config.hashTags) {
        // Get links to the people's preview popup page
        const peoplePreviewPages = await insta.getHashTagPeople(hashTag)
            .catch(e => {
                this.error(e);
            });
        hashTagPeopleUrls[hashTag] = peoplePreviewPages;
        for (const personPreviewPage of peoplePreviewPages) {
            hashTagPeopleArr.push({
                hashTag: hashTag,
                previewPage: personPreviewPage
            });
        }
    }

    const dbEntries = await insta.db.getVocalists()
        .catch(e => {
            this.error(e);
        });

    let dif = _.differenceBy(hashTagPeopleArr, dbEntries, 'previewPage');

    for (const difElement of dif) {
        const person = difElement.previewPage;
        const hashTag = difElement.hashTag;
        const personPage = await insta.getPersonPage(person)
            .catch(e => {
                insta.error(`CANNOT GET ${person} PAGE`);
                insta.error(e);
            });

        console.log(person);
        console.log(personPage);

        let followers = 0;
        followers = await insta.getPersonFollowers(personPage)
            .catch(e => {
                insta.error(`CANNOT GET ${personPage} FOLLOWERS`);
                insta.error(e);
            });

        followers = insta.toInt(followers);

        let infoMsg = `${hashTag}> PERSON PAGE: ${personPage}, FOLLOWERS: ${followers}`;
        if (followers > insta.config.followMin && followers < insta.config.followMax) {
            const personName = await insta.getUserFromUrl(personPage);
            const avatar = await insta.getAvatar(personPage);
            const entry = {
                username: personName,
                avatar: avatar,
                previewPage: person,
                page: personPage,
                followers: followers,
                hashTag: hashTag,
                added: insta.timestamp
            };

            console.log(entry);

            insta.info(`PROCESSING: ${personName}`);
            const userId = insta.getMd5(personPage);

            await insta.db.addVocalists(userId, entry)
                .then(() => {
                    insta.log(`ADDED ${userId} TO DB`);
                })
                .catch(e => {
                    insta.error(`ERROR ADDING ${personName} TO DB`);
                    insta.error(e);
                });

        } else {
            infoMsg = `${infoMsg}, NOT GOOD`;
        }

        insta.debug(infoMsg);
    }

    await insta.closeBrowser().then(() => insta.debug("BROWSER CLOSED"));

    insta.log(`EXECUTION TIME - ${insta.moment().diff(startTime, "seconds")} SECONDS`);
    process.exit(0);
})();


