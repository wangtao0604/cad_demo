import { http } from './httpClient'
import { unwrapData } from './response'

export async function getPlatformMetadata() {
  return unwrapData(await http.get('/platform/metadata', { auth: false })) || {}
}
