import { signIn, signOut } from '../api/authApi'
import { getPlatformMetadata } from '../api/platformApi'
import { getProjects, getProjectTodos, getProjectResults } from '../api/projectApi'
import { getProjectTree, getBoreholes, getBoreholeLog } from '../api/workspaceApi'
import { getCagDataset, createCagRow, updateCagRow, deleteCagRows } from '../api/cagApi'

function indexById(items = []) {
  return Object.fromEntries(items.map((item) => [item.id, item]))
}

function normalizeMetadata(metadata) {
  const personaList = metadata.personaList || metadata.personas || []
  const roleList = metadata.roleList || metadata.roles || []
  return {
    ...metadata,
    personaList: Array.isArray(personaList) ? personaList : Object.values(personaList),
    personas: Array.isArray(personaList) ? indexById(personaList) : personaList,
    roleDefinitions: Array.isArray(metadata.roleDefinitions)
      ? indexById(metadata.roleDefinitions)
      : (metadata.roleDefinitions || indexById(roleList)),
  }
}

export const restPlatformService = {
  async getMetadata() {
    return normalizeMetadata(await getPlatformMetadata())
  },

  login: signIn,
  logout: signOut,
  getProjects,

  async getProjectContext(projectId) {
    const [todos, results, tree, boreholeData] = await Promise.all([
      getProjectTodos(projectId),
      getProjectResults(projectId),
      getProjectTree(projectId),
      getBoreholes(projectId),
    ])
    return { todos, results, tree, ...boreholeData }
  },

  getBoreholeLog,
  getCagDataset,
  createCagRow,
  updateCagRow,
  deleteCagRows,
}
