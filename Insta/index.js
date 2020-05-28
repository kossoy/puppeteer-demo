const fs = require('fs');

class InstagramBrowser {
    constructor() {
        this.db = require('./db')
        this.config = require('./config/config.json');
        this.chalk = require('chalk');
        this.moment = require('moment');
        this.crypto = require('crypto')
        this.timestamp = this.moment().unix();
    }

    async initPuppetter() {
        const puppeteer = require('puppeteer');
        this.browser = await puppeteer.launch({
            headless: this.config.settings.headless,
            args: this.config.settings.args,
        });
        this.page = await this.browser.newPage();
        this.cookies = {};
        if (this.config.settings.viewport) {
            await this.page.setViewport(this.config.settings.viewport);
        }
    }

    async login() {
        await this.page.goto(`${this.config.baseUrl}/accounts/login/`);
        await this.page.waitForSelector(this.config.selectors.username);
        await this.page.type(this.config.selectors.username, this.config.username);
        await this.page.type(this.config.selectors.password, this.config.password);

        await Promise.all([
            this.page.click(this.config.selectors.loginButton),
            this.page.waitForNavigation({waitUntil: 'networkidle0'}),
        ]);

        if (!this.config.settings.headless) {
            await this.page.click(this.config.selectors.notNowButton);
        }

        this.cookies = await this.page.cookies();
        if (this.config.settings.verbose) {
            console.log(this.chalk.yellow.italic('Cookies: '), this.chalk.cyan(JSON.stringify(this.cookies)));
        }
    }

    async getHashTagPeople(hashTag) {
        const hashTagURL = `${this.config.baseUrl}/explore/tags/${hashTag}/?hl=en`;
        await this.page.goto(hashTagURL);
        this.log(`PROCESSING HASH ${hashTag}: ${hashTagURL}...`);
        await this.page.waitForSelector(".v1Nh3 > a");
        let top = [];

        for (let i = 1; i < 4; i++) {
            for (let j = 1; j < 4; j++) {
                const selector = `.EZdmt  .Nnq7C:nth-child(${i}) > .v1Nh3:nth-child(${j}) > a`;
                await this.page.$eval(selector, e => e.href).then(e => {
                    top.push(e);
                });
            }
        }
        return top;
    }

    async getPersonPage(person) {
        await Promise.all([
            this.page.goto(person),
            this.page.waitForNavigation({waitUntil: 'networkidle0'}),
        ]);
        return this.page.$eval(".e1e1d > a", e => e.href)
    }

    async getPersonFollowers(personPage) {
        await this.page.goto(personPage);
        await this.page.waitForSelector(this.config.selectors.followers);
        const followers = await this.page.$eval(this.config.selectors.followers, e => e.innerText);
        return followers.replace('followers', '').trim();
    }

    async takeScreenShot() {
        const path = `${this.config.settings.resourcePath}/${this.timestamp}.png`;
        await this.page.screenshot({path: path});
        return path;
    }

    async makePDF() {
        const path = `${this.config.settings.resourcePath}/${this.timestamp}.pdf`;
        await this.page.pdf({path: path, format: 'A4'});
        return path;
    }

    async closeBrowser() {
        await this.browser.close();
    }

    recordFollowers(followers) {
        const path = `${this.config.settings.resourcePath}/followers.json`;
        let people = JSON.parse(fs.readFileSync(path, 'utf8'));
        for (const person of followers) {
            people[this.getUserFromUrl(person.page)] = person;
        }
        fs.writeFileSync(path, JSON.stringify(people, null, 2));
    }

    toInt(str) {
        if (0 < str.indexOf('k')) {
            str = parseFloat(str.replace('k', '-')) * 1000;
        } else {
            str = parseInt(str.replace(',', ''));
        }
        return str;
    }

    getUserFromUrl(url) {
        let parts = url.split('/');
        return parts.pop() || parts.pop();
    }

    getMd5(str) {
        return this.crypto.createHash('md5').update(str).digest("hex")
    }

    debug(msg) {
        console.log(this.chalk.grey(msg));
    }

    info(msg) {
        console.log(this.chalk.green.bold(msg));
    }

    log(msg) {
        console.log(this.chalk.black(msg));
    }
}

module.exports = InstagramBrowser;
