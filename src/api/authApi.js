import { http, setAccessToken } from './httpClient'
import { unwrapData } from './response'

export async function signIn(credentials) {
  const session = unwrapData(await http.post('/auth/login', credentials, { auth: false })) || {}
  setAccessToken(session.accessToken || session.token || '')
  return session
}

export async function signOut() {
  try {
    await http.post('/auth/logout')
  } finally {
    setAccessToken('')
  }
}
