import {
  personas, personaList, roleDefinitions, projects, flowStages, stageStatus,
  stageAccess, stageRibbons, categories, todos, results, IBGI_ENG_INFO,
} from '../data/mockData'
import {
  treeData, boreholeTable, strataColors, boreholeLayers, waterLevel,
} from '../data/treeData'
import { cagMockData } from '../data/cagMockData'

const clone = (value) => {
  if (typeof structuredClone === 'function') return structuredClone(value)
  return JSON.parse(JSON.stringify(value))
}

const mockCagRows = clone(cagMockData)

export const mockPlatformService = {
  async getMetadata() {
    return clone({
      personas,
      personaList,
      roleDefinitions,
      projects,
      flowStages,
      stageStatus,
      stageAccess,
      stageRibbons,
      categories,
      integrationUrls: { ibgiEngineeringInfo: IBGI_ENG_INFO },
    })
  },

  async login({ personaId }) {
    return { accessToken: 'mock-access-token', userId: personaId || 'leader' }
  },

  async logout() {},

  async getProjects() {
    return clone(projects)
  },

  async getProjectContext(_projectId, { roleId } = {}) {
    return clone({
      todos: todos[roleId] || [],
      results,
      tree: treeData,
      boreholes: boreholeTable,
      strataColors,
    })
  },

  async getBoreholeLog(_projectId, code) {
    return clone({ code, layers: boreholeLayers, waterLevel })
  },

  async getCagDataset(_projectId, dataset) {
    return clone(mockCagRows[dataset] || [])
  },

  async createCagRow(_projectId, dataset, row) {
    const rows = mockCagRows[dataset] || (mockCagRows[dataset] = [])
    const id = rows.reduce((max, item) => Math.max(max, Number(item.id) || 0), 0) + 1
    const created = { id, ...clone(row) }
    rows.push(created)
    return clone(created)
  },

  async updateCagRow(_projectId, dataset, rowId, row) {
    const rows = mockCagRows[dataset] || []
    const target = rows.find((item) => String(item.id) === String(rowId))
    if (target) Object.assign(target, clone(row))
    return clone(target || { id: rowId, ...row })
  },

  async deleteCagRows(_projectId, dataset, ids) {
    const idSet = new Set(ids.map(String))
    mockCagRows[dataset] = (mockCagRows[dataset] || []).filter((item) => !idSet.has(String(item.id)))
  },
}
