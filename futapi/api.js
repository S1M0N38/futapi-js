import path from 'path'
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

import { LoginError } from './errors.js'

puppeteer.use(StealthPlugin())

export default class API {
  constructor (email, password, codes) {
    this.username = email.split('@')[0]
    this.userDataDir = path.join(process.cwd(), 'users', this.username)
    this.email = email
    this.password = password
    this.codes = codes
    this.loggedIn = false
  }

  async _login () {
    const loginButton = await this.page.waitForSelector('#Login button')
    await Promise.all([
      this.page.waitForNavigation(),
      loginButton.click('#Login button')
    ])

    console.log(this.page.url()) // maybe go to web app when already logged in

    await this.page.click('#password', { clickCount: 3 })
    await this.page.type('#email', this.email)
    await this.page.click('#password', { clickCount: 3 })
    await this.page.type('#password', this.password)
    await Promise.all([
      this.page.waitForNavigation(),
      this.page.click('#btnLogin')
    ])

    console.log(this.page.url()) // maybe go to web app when already logged in

    // Login Verification
    if (this.page.url().startsWith('https://signin.ea.com')) {
      await Promise.all([
        this.page.waitForNavigation(),
        this.page.click('#btnSendCode')
      ])
      for (const code of this.codes) {
        await this.page.type('#oneTimeCode', code)
        await Promise.all([
          this.page.waitForNavigation({ waitUntil: 'networkidle0' }),
          this.page.click('#btnSubmit')
        ])
        console.log(this.page.url())
        if (!this.page.url().startsWith('https://signin.ea.com')) { return }
        await this.page.click('#oneTimeCode', { clickCount: 3 })
      }
      throw new LoginError(`
        All backup code are invalid.
        Go to https://myaccount.ea.com/cp-ui/security/index for new backup codes.`
      )
    }
  }

  async launch () {
    const options = {
      headless: false,
      userDataDir: this.userDataDir,
      slowMo: 50
    }
    this.browser = await puppeteer.launch(options)
    this.page = (await this.browser.pages())[0]
    this.page.on('response', response => this._jsonInterceptor(response))

    await this.page.goto('https://www.ea.com/fifa/ultimate-team/web-app/')

    // Based on https response:
    // 1. Login for the first time (need verification code)
    // 2. Login with expired token
    // 3. The webapp is automatically launch

    const authURL = /.*ea\.com\/connect\/auth.*(FIFA21_JS_WEB_APP|SERVER).*/
    const response = await (await this.page.waitForResponse(response =>
      response.url().match(authURL) && response.request().method() === 'GET'
    )).json()

    if ('error' in response) {
      console.log('start login')
      await this._login()
    } else { console.log('not need for login.') }

    await this.page.waitForResponse(
      'https://utas.external.s3.fut.ea.com/ut/game/fifa21/rivals/user/prizeDetails'
    )
    await this.page.waitForSelector('ut-click-shield', { hidden: true })
    this.loggedIn = true
  }

  async close () {
    await this.browser.close()
  }

  async sleep (milliseconds) {
    milliseconds += milliseconds / 5 * Math.random()
    await this.page.waitForTimeout(milliseconds)
  }

  async _clickHome () {
    await this.page.waitForTimeout(1000)
    await this.page.click('button.icon-home')
    await this.page.waitForXPath('//h1[@class = "title" and text() = "Home"]')
    await this.page.waitForSelector('ut-click-shield', { hidden: true })
    await this.page.waitForTimeout(1000)
  }

  async _clickSquads () {
    await this.page.waitForTimeout(1000)
    await this.page.click('button.icon-squad')
    await this.page.waitForXPath('//h1[@class = "title" and text() = "Squads"]')
    await this.page.waitForSelector('ut-click-shield', { hidden: true })
    await this.page.waitForTimeout(1000)
  }

  async _clickSBC () {
    await this.page.waitForTimeout(1000)
    await this.page.click('button.icon-sbc')
    await this.page.waitForXPath('//h1[@class = "title" and text() = "Squad Building Challenges"]')
    await this.page.waitForSelector('ut-click-shield', { hidden: true })
    await this.page.waitForTimeout(1000)
  }

  async _clickTransfers () {
    await this.page.waitForTimeout(1000)
    await this.page.click('button.icon-transfer')
    await this.page.waitForXPath('//h1[@class = "title" and text() = "Transfers"]')
    await this.page.waitForSelector('ut-click-shield', { hidden: true })
    await this.page.waitForTimeout(1000)
  }

  async _clickSearchTheTransferMarket () {
    await this.page.waitForTimeout(1000)
    await this.page.click('div.ut-tile-transfer-market')
    await this.page.waitForXPath('//h1[@class = "title" and text() = "Search the Transfer Market"]')
    await this.page.waitForSelector('ut-click-shield', { hidden: true })
    await this.page.waitForTimeout(1000)
  }

  async _inputSearch (
    playerName,
    quality, // 0 => any, 1 => bronze, 2 => silver, 3 => gold, 4 => special
    rarity,
    position, chemistryStyle,
    nationality, league, club,
    minBidPrice, maxBidPrice,
    minBuyNowPrice, maxBuyNowPrice) {
    const filters = await this.page.$$('button.ut-search-filter-control--row-button')

    if (playerName) {
      await this.page.type('input.ut-text-input-control', playerName)
      await (await this.page.waitForSelector('ul.playerResultsList > button')).click()
    }

    // NOT WORKING
    // if (quality) {
    //   await filters[0].click()
    //   const choices = await this.page.$$('ul.inline-list > li')
    //   await choices[quality].click()
    // }

    // TODO add others filters
  }

  async _clickSearch () {
    // await Promise.all([
    //   this.page.waitForNavigation({ waitUntil: 'networkidle0' }),
    //   this.page.click('button.call-to-action'),
    // ])
    await this.page.click('button.call-to-action')
    await this.page.waitForSelector('ut-click-shield', { hidden: true })
    await this.page.waitForTimeout(5000)
  }

  async _clickNext () {
    await this.page.click('button.next')
    await this.page.waitForTimeout(2000)
  }

  async _jsonInterceptor (response) {
    if (
      response.url().match(
        /^https:\/\/utas\.external\.s[1,2,3].fut\.ea\.com\/ut\/game\/fifa21.*/
      ) && response.request().method() === 'GET' && response.ok()
    ) {
      const url = response.url().split('fifa21')[1].split('?')[0]
      // console.log(url)
      switch (url) {
        // return during webapp launch
        case '/usermassinfo':
          this._usermassinfo = await response.json()
          break

        // returned during webapp launch and sometimes when clicked on transfers
        case '/tradepile':
          this._tradepile = await response.json()
          break

        case '/watchlist':
          this._watchlist = await response.json()
          break

        case '/sbs/sets':
          this._sbcSets = await response.json()
          break

        case '/transfermarket':
          this._transfermarket = this._transfermarket.concat(
            (await response.json()).auctionInfo)
          break

        default:
          break
      }
    }
  }

  get usermassinfo () {
    return new Promise((resolve) => {
      this._clickHome().then(() => { resolve(this._usermassinfo) })
    })
  }

  get tradepile () {
    return new Promise((resolve) => {
      this._clickTransfers().then(() => { resolve(this._tradepile) })
    })
  }

  get watchlist () {
    return new Promise((resolve) => {
      this._clickTransfers().then(() => { resolve(this._watchlist) })
    })
  }

  get sbcSets () {
    return new Promise((resolve) => {
      this._clickSBC().then(() => { resolve(this._sbcSets) })
    })
  }

  async transfermarket (playerName, quality, expiresIn = 0) {
    this._transfermarket = []

    await this._clickTransfers()
    await this._clickSearchTheTransferMarket()
    await this._inputSearch(playerName, quality)
    await this._clickSearch()
    await this.page.waitForXPath('//h1[@class = "title" and text() = "Search Results"]')
    await this.page.waitForSelector('ut-click-shield', { hidden: true })
    while (this._transfermarket.slice(-1)[0].expires < expiresIn) {
      await this._clickNext()
    }
    console.log(this._transfermarket.length)
  }
}
