import API from '../futapi/api.js'
import { LoginError } from '../futapi/errors.js'
import { user1 } from './users.js'

describe('API launch', () => {
  test.skip('first time login invalid backup codes', async () => {
    const fakeCodes = ['73899675', '51840933', '12893787']
    const api = new API(user1.email, user1.password, fakeCodes)
    api.userDataDir = undefined
    await expect(api.launch()).rejects.toThrow(LoginError)
    expect(api.loggedIn).toBeFalsy()
    await api.close()
  })

  test.skip('first time login', async () => {
    const api = new API(user1.email, user1.password, user1.codes)
    api.userDataDir = undefined
    await api.launch()
    expect(api.loggedIn).toBeTruthy()
    await api.close()
  })

  test('launch webapp without login', async () => {
    const api = new API(user1.email, user1.password, user1.codes)
    await api.launch()
    expect(api.loggedIn).toBeTruthy()
    await api.close()
  })
})

describe.only('API endpoints (no market)', () => {
  let api

  beforeAll(async () => {
    api = new API(user1.email, user1.password, user1.codes)
    await api.launch()
  })

  test('squads click', async () => {
    await api._clickSquads()
    const title = await api.page.$eval('h1.title', el => el.textContent)
    expect(title).toBe('Squads')
  })

  test('home click', async () => {
    await api._clickHome()
    const title = await api.page.$eval('h1.title', el => el.textContent)
    expect(title).toBe('Home')
  })

  afterAll(async () => {
    await api.close()
  })
})
