const fs = require('fs');

class InstagramBrowser {
    constructor() {
        this.config = require('./config/config.json');
        this.chalk = require('chalk');
        this.moment = require('moment');
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
            await this.page.setViewport({width: 1500, height: 764});
        }
    }

    async login() {
        await this.page.goto(this.config.loginUrl);
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

    async getFollowers() {
        await this.page.goto(`${this.config.base_url}/${this.config.username}`);
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
        console.log(followers);
        fs.appendFile(`${this.config.settings.resourcePath}/${this.timestamp}.csv`, `${followers}\n`, err => {
            if (err) this.chalk.red.bold(err);
        });
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
