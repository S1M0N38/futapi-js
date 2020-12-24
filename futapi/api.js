import path from 'path'
import fs from 'fs'

import { CredentialsError, LoginError } from './errors.js'

export default class API {
  constructor (username) {
    this.userDataDir = path.join(process.cwd(), 'users', username)
    if (!fs.existsSync(this.userDataDir)) {
      throw new CredentialsError(`
        [ERROR] Login data for ${username} cannot be found. You have to first
        run the login.js script.`
      )
    }
    this.username = username
    this.loggedIn = false
  }

  // TODO login () {}
}
