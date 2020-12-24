/*
Different account are used to test differnet part of the api

- userNotConfigured: user that is not configured with the login script so, the
    userDataDir is missing. (None)

- userConfigured: account that is configured with the login.js but does not have
    a physical copy of the game its webapp is enterly locked. (G.G)

- userLogin: an accont able to login in the webapp but with market locked. It's
    used to test the login process. (U.B.)

- userUnlocked: Fully working account with the market on the webapp unlocked.
    It's used to test the interesting part of the API. (B.P.)
*/

import API from '../futapi/api.js'
import { CredentialsError, LoginError } from '../futapi/errors.js'

test('user configured with login.js', () => {
  const username = 'userConfigured'
  const api = new API(username)
  expect(api.username).toBe(username)
  expect(api.loggedIn).toBeFalsy()
})

test('user not configured with login.js', () => {
  const username = 'userNotConfigured'
  expect(() => new API(username)).toThrowError(CredentialsError)
})
