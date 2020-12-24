export class CredentialsError extends Error {
  constructor (message) {
    super(message)
    this.name = 'CredentialsError'
  }
}

export class LoginError extends Error {
  constructor (message) {
    super(message)
    this.name = 'LoginError'
  }
}
