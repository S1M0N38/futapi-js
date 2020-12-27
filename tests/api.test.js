import API from '../futapi/api.js'
import { LoginError } from '../futapi/errors.js'
import { user1, user2 } from './users.js'

describe.skip('API launch', () => {
  test('first time login invalid backup codes', async () => {
    const fakeCodes = ['73899675', '51840933', '12893787']
    const api = new API(user1.email, user1.password, fakeCodes)
    api.userDataDir = undefined
    await expect(api.launch()).rejects.toThrow(LoginError)
    expect(api.loggedIn).toBeFalsy()
    await api.close()
  })

  test('first time login', async () => {
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

describe('API interactions', () => {
  let api

  beforeAll(async () => {
    api = new API(user2.email, user2.password, user2.codes)
    await api.launch()
  })

  describe('API navigation (input & click)', () => {
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

    test('SBC click', async () => {
      await api._clickSBC()
      const title = await api.page.$eval('h1.title', el => el.textContent)
      expect(title).toBe('Squad Building Challenges')
    })

    test('transfers click', async () => {
      await api._clickTransfers()
      const title = await api.page.$eval('h1.title', el => el.textContent)
      expect(title).toBe('Transfers')
    })

    test('search the transfer market click', async () => {
      await api._clickSearchTheTransferMarket()
      const title = await api.page.$eval('h1.title', el => el.textContent)
      expect(title).toBe('Search the Transfer Market')
    })
  })

  describe('API endpoints', () => {
    test('usermassinfo', async () => {
      expect((await api.usermassinfo).userInfo.credits).toBeDefined()
    })

    test('tradepile', async () => {
      expect((await api.tradepile).credits).toBeDefined()
    })

    test('watchlist', async () => {
      expect((await api.watchlist).credits).toBeDefined()
    })

    test('sbcSets', async () => {
      expect((await api.sbcSets).categories).toBeDefined()
    })

    test.only('transfermarket', async () => {
      await api.transfermarket('Theo Hernández', 0, 3000)
    })
  })

  afterAll(async () => {
    await api.close()
  })
})
