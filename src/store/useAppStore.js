import { computed, reactive } from 'vue'
import { platformService } from '../services/platformService'
import { filterProjectTree } from '../domain/projectTree'

const state = reactive({
  view: 'login',
  userId: 'leader',
  currentProjectId: '',
  currentStageId: '',
  cockpitTab: 'overview',
  stageFunc: null,
  workspaceTarget: null,
  booting: true,
  bootError: '',
  authenticating: false,
  authError: '',
  projectLoading: false,
  projectError: '',
})

// Runtime data is kept stable so consumers can safely retain references while REST data is replaced.
const personas = reactive({})
const personaList = reactive([])
const roleDefinitions = reactive({})
const projects = reactive([])
const flowStages = reactive([])
const stageStatus = reactive({})
const stageAccess = reactive({})
const stageRibbons = reactive({})
const categories = reactive([])
const integrationUrls = reactive({})

const todos = reactive([])
const results = reactive([])
const projectTree = reactive([])
const boreholes = reactive([])
const strataColors = reactive([])
const boreholeLogs = reactive({})
const cagDatasets = reactive({})
const cagLoading = reactive({})

function replaceArray(target, value) {
  target.splice(0, target.length, ...(Array.isArray(value) ? value : []))
}

function replaceObject(target, value) {
  Object.keys(target).forEach((key) => delete target[key])
  Object.assign(target, value && typeof value === 'object' ? value : {})
}

function applyMetadata(metadata = {}) {
  const people = metadata.personas || {}
  const peopleList = metadata.personaList || (Array.isArray(people) ? people : Object.values(people))
  replaceArray(personaList, peopleList)
  replaceObject(personas, Array.isArray(people) ? Object.fromEntries(people.map((item) => [item.id, item])) : people)
  replaceObject(roleDefinitions, metadata.roleDefinitions)
  replaceArray(projects, metadata.projects)
  replaceArray(flowStages, metadata.flowStages)
  replaceObject(stageStatus, metadata.stageStatus)
  replaceObject(stageAccess, metadata.stageAccess)
  replaceObject(stageRibbons, metadata.stageRibbons)
  replaceArray(categories, metadata.categories)
  replaceObject(integrationUrls, metadata.integrationUrls)

  if (!state.currentProjectId && projects[0]) state.currentProjectId = projects[0].id
  if (!state.currentStageId && flowStages[0]) state.currentStageId = flowStages[0].id
}

async function initialize() {
  state.booting = true
  state.bootError = ''
  try {
    applyMetadata(await platformService.getMetadata())
  } catch (error) {
    state.bootError = error.message || '平台初始化失败'
  } finally {
    state.booting = false
  }
}

const user = computed(() => personas[state.userId] || personaList[0] || {})
const currentProject = computed(() => projects.find((project) => project.id === state.currentProjectId) || projects[0] || {})
const currentStage = computed(() => flowStages.find((stage) => stage.id === state.currentStageId) || flowStages[0] || {})

function roleIdForProject(projectOrId) {
  const project = typeof projectOrId === 'string'
    ? projects.find((item) => item.id === projectOrId)
    : projectOrId
  return project?.userRoles?.[state.userId] || user.value.defaultRole || state.userId
}

function roleForProject(projectOrId) {
  return roleDefinitions[roleIdForProject(projectOrId)] || roleDefinitions.engineer || {}
}

const currentProjectRole = computed(() => roleForProject(currentProject.value))
const currentProjectRoleId = computed(() => currentProjectRole.value.id || '')

const projectStageAccess = {
  reviewer: ['s8'],
  approver: ['s8'],
  surveyor: ['s4'],
  pipeline: ['s5'],
}

const myProjects = computed(() => projects.filter((project) => {
  const roleId = roleIdForProject(project)
  if (['leader', 'engineer'].includes(roleId)) return true
  const allowedStages = projectStageAccess[roleId]
  if (allowedStages) return allowedStages.includes(project.stageId)
  return project.roles?.includes(roleId) ?? true
}))
const hasLeaderProjects = computed(() => myProjects.value.some((project) => roleIdForProject(project) === 'leader'))
const hasNonLeaderProjects = computed(() => myProjects.value.some((project) => roleIdForProject(project) !== 'leader'))

const currentProjectStageStatus = computed(() => {
  const project = currentProject.value
  if (!project?.stageId) return stageStatus
  const index = flowStages.findIndex((stage) => stage.id === project.stageId)
  if (index === -1) return stageStatus

  return Object.fromEntries(flowStages.map((stage, stageIndex) => [
    stage.id,
    stageIndex < index ? 'done' : (stageIndex === index ? 'doing' : 'todo'),
  ]))
})
const stageStatusOf = computed(() => stageStatus)

async function login(credentials) {
  const payload = typeof credentials === 'string' ? { personaId: credentials } : credentials
  state.authenticating = true
  state.authError = ''
  try {
    const session = await platformService.login(payload || {})
    state.userId = session.userId || session.user?.id || payload?.personaId || state.userId
    replaceArray(projects, await platformService.getProjects({ userId: state.userId }))
    if (projects[0]) state.currentProjectId = projects[0].id
    state.view = 'dashboard'
    return user.value
  } catch (error) {
    state.authError = error.message || '登录失败'
    throw error
  } finally {
    state.authenticating = false
  }
}

async function logout() {
  state.view = 'login'
  state.stageFunc = null
  state.workspaceTarget = null
  try {
    await platformService.logout()
  } catch {
    // Local logout must not be blocked by an unavailable server.
  }
}

function applyProjectContext(context = {}) {
  replaceArray(todos, context.todos)
  replaceArray(results, context.results)
  replaceArray(projectTree, context.tree)
  replaceArray(boreholes, context.boreholes)
  replaceArray(strataColors, context.strataColors)
  replaceObject(boreholeLogs, {})
  replaceObject(cagDatasets, {})
  replaceObject(cagLoading, {})
}

async function openProject(id) {
  const project = projects.find((item) => item.id === id)
  if (!project) throw new Error('项目不存在或无权访问')

  state.projectLoading = true
  state.projectError = ''
  state.currentProjectId = id
  state.currentStageId = project.stageId
  const role = roleForProject(project)
  state.cockpitTab = role.id === 'leader' ? 'overview' : (project.stageId || role.focusStage || flowStages[0]?.id)
  state.stageFunc = null
  state.workspaceTarget = null

  try {
    applyProjectContext(await platformService.getProjectContext(id, { roleId: role.id }))
    state.view = 'cockpit'
  } catch (error) {
    state.projectError = error.message || '项目数据加载失败'
    throw error
  } finally {
    state.projectLoading = false
  }
}

async function loadBoreholeLog(code) {
  if (!code || !state.currentProjectId) return null
  if (boreholeLogs[code]) return boreholeLogs[code]
  const log = await platformService.getBoreholeLog(state.currentProjectId, code)
  boreholeLogs[code] = {
    code,
    layers: log.layers || [],
    waterLevel: Number(log.waterLevel) || 0,
  }
  return boreholeLogs[code]
}

async function loadCagDataset(dataset, refresh = false) {
  if (!dataset || !state.currentProjectId) return []
  if (!refresh && cagDatasets[dataset]) return cagDatasets[dataset]
  cagLoading[dataset] = true
  try {
    cagDatasets[dataset] = await platformService.getCagDataset(state.currentProjectId, dataset)
    return cagDatasets[dataset]
  } finally {
    cagLoading[dataset] = false
  }
}

async function createCagRow(dataset, row) {
  const created = await platformService.createCagRow(state.currentProjectId, dataset, row)
  const rows = cagDatasets[dataset] || (cagDatasets[dataset] = [])
  rows.push(created)
  return created
}

async function updateCagRow(dataset, rowId, changes) {
  const updated = await platformService.updateCagRow(state.currentProjectId, dataset, rowId, changes)
  const target = cagDatasets[dataset]?.find((row) => String(row.id) === String(rowId))
  if (target) Object.assign(target, updated)
  return updated
}

async function deleteCagRows(dataset, ids) {
  await platformService.deleteCagRows(state.currentProjectId, dataset, ids)
  const idSet = new Set(ids.map(String))
  cagDatasets[dataset] = (cagDatasets[dataset] || []).filter((row) => !idSet.has(String(row.id)))
}

function projectTreeForRole(roleId) {
  return filterProjectTree(projectTree, roleId)
}

function enterWorkspace(stageId, target) {
  if (stageId) state.currentStageId = stageId
  state.workspaceTarget = target || null
  state.view = 'workspace'
}

function backToCockpit() {
  state.view = 'cockpit'
}

function setStage(stageId) {
  state.currentStageId = stageId
  state.cockpitTab = stageId
  state.stageFunc = null
  state.workspaceTarget = null
}

function setCockpitTab(tab) {
  state.cockpitTab = tab
  if (tab !== 'overview') state.currentStageId = tab
  state.stageFunc = null
  state.workspaceTarget = null
}

function setStageFunc(func) {
  state.stageFunc = func || null
}

export function useAppStore() {
  return {
    state,
    personas,
    personaList,
    roleDefinitions,
    projects,
    flowStages,
    stageStatus,
    stageAccess,
    stageRibbons,
    categories,
    integrationUrls,
    todos,
    results,
    projectTree,
    boreholes,
    strataColors,
    boreholeLogs,
    cagDatasets,
    cagLoading,
    user,
    currentProject,
    currentProjectRole,
    currentProjectRoleId,
    currentStage,
    myProjects,
    hasLeaderProjects,
    hasNonLeaderProjects,
    stageStatusOf,
    currentProjectStageStatus,
    roleIdForProject,
    roleForProject,
    projectTreeForRole,
    initialize,
    login,
    logout,
    openProject,
    loadBoreholeLog,
    loadCagDataset,
    createCagRow,
    updateCagRow,
    deleteCagRows,
    enterWorkspace,
    backToCockpit,
    setStage,
    setCockpitTab,
    setStageFunc,
  }
}
