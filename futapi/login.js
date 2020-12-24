import path from 'path'
import puppeteer from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

const help = `

  This script is used to login inside webapp and store the login information
  as a Chromium user. 
  These user infromation are stored in futapi/users/<username> directory 
  (where <username> is a placeholder for a username you want to choose).

  Usage:
  $ node login.js <username>

  Then login into the webapp with your account credentials.
  The option "Remeber this computer/device" must be true.
  When you are succefully logged in the webapp just close the Chromium app.
  `

console.log(help)

if (process.argv.length !== 3) {
  console.log('[ERROR] Please enter a username.\n')
  process.exit(1)
}

puppeteer.use(StealthPlugin())

const username = process.argv[2]
const userDataDir = path.join(process.cwd(), 'users', username)

async function login () {
  const options = { headless: false, userDataDir: userDataDir }
  const browser = await puppeteer.launch(options)

  const page = (await browser.pages())[0]
  await page.goto('https://www.ea.com/fifa/ultimate-team/web-app/')
}

login()
