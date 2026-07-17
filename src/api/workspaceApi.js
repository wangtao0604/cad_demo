import { http } from './httpClient'
import { unwrapData, unwrapList } from './response'

const projectPath = (projectId, resource) => `/projects/${encodeURIComponent(projectId)}/${resource}`

export async function getProjectTree(projectId) {
  return unwrapList(await http.get(projectPath(projectId, 'tree')), ['tree', 'nodes'])
}

export async function getBoreholes(projectId) {
  const payload = await http.get(projectPath(projectId, 'boreholes'))
  const data = unwrapData(payload)
  return {
    boreholes: unwrapList(payload, ['boreholes']),
    strataColors: Array.isArray(data?.strataColors) ? data.strataColors : [],
  }
}

export async function getBoreholeLog(projectId, code) {
  const path = projectPath(projectId, `boreholes/${encodeURIComponent(code)}/log`)
  return unwrapData(await http.get(path)) || {}
}
