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
      userDataDir: this.userDataDir
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

    await this.page.waitForSelector('nav.ut-tab-bar')
    await this.page.waitForTimeout(2000)
    this.loggedIn = true
  }

  async close () {
    await this.browser.close()
  }

  async _clickHome () {
    await this.page.click('button.icon-home')
    await this.page.waitForSelector('h1.title') // TODO better way to wait
    await this.sleep(500)
    console.log('cliked home')
  }

  async _clickSquads () {
    await this.page.click('button.icon-squad')
    await this.page.waitForSelector('h1.title')
    await this.sleep(500)
    console.log('cliked squad')
  }

  async _jsonInterceptor (response) {
    if (
      response.url().match(
        /^https:\/\/utas\.external\.s[1,2,3].fut\.ea\.com\/ut\/game\/fifa21.*/
      ) && response.request().method() === 'GET' && response.ok()
    ) { console.log(await response.json()) }
  }

  async sleep (milliseconds) {
    milliseconds += milliseconds / 5 * Math.random()
    await this.page.waitForTimeout(milliseconds)
  }
}
