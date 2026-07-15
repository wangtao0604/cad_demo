/**
 * 全局应用状态（不引入 pinia，用 reactive 轻量实现）
 * view: login | dashboard | cockpit | workspace
 */
import { reactive, computed } from 'vue'
import { personas, projects, flowStages, stageStatus } from '../data/mockData'

const state = reactive({
  view: 'login',
  userId: 'leader',
  currentProjectId: 'p1',
  currentStageId: 's7',
  cockpitTab: 'overview', // 'overview'(项目负责人驾驶舱/项目管控) | 阶段id 's2'..'s8'
  stageFunc: null,        // null=阶段工作台默认 | 功能id | 'todo' | 'result' | 'map' | 'files' | 'quality' | 'info'
  workspaceTarget: null,  // 进入专业工作区时的初始目标: 'placement'|'cag'|'borehole-place'|'cad'|'log'|'section'|null
})

const user = computed(() => personas[state.userId] || personas.leader)
const currentProject = computed(() => projects.find((p) => p.id === state.currentProjectId) || projects[0])
const currentStage = computed(() => flowStages.find((s) => s.id === state.currentStageId) || flowStages[0])

/** 项目入口权限：管理角色看全部，专业角色按项目当前阶段进入。 */
const projectStageAccess = {
  reviewer: ['s8'],
  approver: ['s8'],
  surveyor: ['s4'],
  pipeline: ['s5'],
}
const myProjects = computed(() => {
  if (['leader', 'engineer'].includes(state.userId)) return projects
  const allowedStages = projectStageAccess[state.userId]
  if (allowedStages) return projects.filter((p) => allowedStages.includes(p.stageId))
  return projects.filter((p) => p.roles.includes(state.userId))
})

/** 阶段状态（按当前项目）—— 根据项目当前 stageId 推导：之前 done，当前 doing，之后 todo */
const currentProjectStageStatus = computed(() => {
  const p = currentProject.value
  if (!p || !p.stageId) return stageStatus
  const idx = flowStages.findIndex((s) => s.id === p.stageId)
  if (idx === -1) return stageStatus
  const map = {}
  flowStages.forEach((s, i) => {
    if (i < idx) map[s.id] = 'done'
    else if (i === idx) map[s.id] = 'doing'
    else map[s.id] = 'todo'
  })
  return map
})

/** 阶段状态（全局默认，兼容旧引用） */
const stageStatusOf = computed(() => stageStatus)

function login(userId) {
  state.userId = userId || state.userId
  state.view = 'dashboard'
}

function logout() {
  state.view = 'login'
}

function openProject(id) {
  state.currentProjectId = id
  const p = projects.find((x) => x.id === id)
  if (p) state.currentStageId = p.stageId
  const u = personas[state.userId]
  // 项目负责人默认进驾驶舱；其余角色进入项目当前所在阶段。
  state.cockpitTab = u?.id === 'leader' ? 'overview' : (p?.stageId || u?.focusStage || 's2')
  state.stageFunc = null
  state.workspaceTarget = null
  state.view = 'cockpit'
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

/** 切换顶部 Ribbon 页签（overview | 阶段id） */
function setCockpitTab(tab) {
  state.cockpitTab = tab
  if (tab !== 'overview') state.currentStageId = tab
  state.stageFunc = null
  state.workspaceTarget = null
}

/** 在当前阶段内切换功能区内容 */
function setStageFunc(func) {
  state.stageFunc = func || null
}

export function useAppStore() {
  return {
    state,
    user,
    currentProject,
    currentStage,
    myProjects,
    stageStatusOf,
    currentProjectStageStatus,
    login,
    logout,
    openProject,
    enterWorkspace,
    backToCockpit,
    setStage,
    setCockpitTab,
    setStageFunc,
  }
}
