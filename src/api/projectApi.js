import { http } from './httpClient'
import { unwrapList } from './response'

const projectPath = (projectId, resource) => `/projects/${encodeURIComponent(projectId)}/${resource}`

export async function getProjects(query) {
  return unwrapList(await http.get('/projects', { query }), ['projects'])
}

export async function getProjectTodos(projectId) {
  return unwrapList(await http.get(projectPath(projectId, 'todos')), ['todos'])
}

export async function getProjectResults(projectId) {
  return unwrapList(await http.get(projectPath(projectId, 'results')), ['results'])
}
