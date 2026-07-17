<script setup>
/**
 * 项目驾驶舱 —— 进入项目后的主页面（流程导航 + 紧凑操作栏）
 * - 顶部流程导航条（8 节点，明显状态，可点击切阶段）
 * - 第二行操作栏：项目负责人显示项目级入口，普通角色显示当前阶段入口
 * - 阶段功能区保留 i北勘 原功能 + 平台新增功能（补孔/建模等 CAD）
 * - 内容区按 cockpitTab + stageFunc 渲染：驾驶舱大屏 / 阶段工作台 / i北勘嵌入 / CAD 工作区 / 待办 / 成果 / 地图 …
 * - CAD 模式进入专业工作区，由专业工作区自带 Ribbon 接管
 */
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import {
  ArrowLeft, DataBoard, Document, Folder, CircleCheck, Promotion, EditPen, MapLocation, View, Notebook, Aim, Files, Coffee, Box, TrendCharts, VideoCamera, Picture, Link, Place, FolderOpened, List, Lock, Monitor, Warning, Timer, Tickets, User, Flag, Share, Grid, ScaleToOriginal,
} from '@element-plus/icons-vue'
import { useAppStore } from '../store/useAppStore'
import FlowNav from '../components/FlowNav.vue'
import TodoPanel from '../components/TodoPanel.vue'
import ResultPanel from '../components/ResultPanel.vue'
import ThemeToggle from '../components/ThemeToggle.vue'
import IbgiPane from './IbgiPane.vue'

// 资源路径拼接：适配 GitHub Pages 子路径 /cad_demo/（import.meta 只能在 script 内使用）
const assetUrl = (file) => import.meta.env.BASE_URL + file

const {
  flowStages, stageAccess, stageRibbons, todos, results, personas,
  integrationUrls, boreholes: boreholeTable,
  state, user, currentProject, currentProjectRole, currentProjectRoleId,
  currentStage, currentProjectStageStatus,
  setStage, setStageFunc, enterWorkspace, logout,
} = useAppStore()

const isLeader = computed(() => currentProjectRoleId.value === 'leader')
const isEngineer = computed(() => currentProjectRoleId.value === 'engineer')
const stageName = (id) => flowStages.find((s) => s.id === id)?.name || '-'

// 图标名 → 组件
const iconMap = {
  Flag, Document, View, Position: MapLocation, Aim, Coffee, EditPen, Promotion, Notebook, Box, Tickets, Share, Grid, MapLocation, CircleCheck, User, DataBoard, List, FolderOpened, Files, Place, Monitor, Folder, Link, ScaleToOriginal,
}
// 注：Position 等同 MapLocation 图标在此处复用
iconMap.Position = MapLocation

const stageOverviewCommand = {
  id: 'stage-overview', label: '阶段总览', icon: DataBoard, tooltip: '当前阶段概览',
}
const stageCommonCommands = [
  { id:'todo', label:'阶段待办', icon: List, tooltip:'本阶段待办' },
  { id:'result', label:'成果中心', icon: FolderOpened, tooltip:'本阶段成果' },
]
// 所有阶段共用同一套扁平操作栏，仅命令内容随阶段和角色变化。
const commandItems = computed(() => {
  if (isLeader.value) {
    return [
      { id:'dashboard', label:'项目总览', icon: DataBoard, tooltip:'项目驾驶舱' },
      { id:'full-process', label:'i北勘全流程', icon: Link, tooltip:'查看 i北勘全流程' },
      { id:'todo', label:'流程待办', icon: List, tooltip:'全部流程待办' },
      { id:'result', label:'成果中心', icon: FolderOpened, tooltip:'项目成果' },
    ]
  }

  const stageId = currentStage.value.id
  let stageCommands = []
  if (isEngineer.value && stageId === 's2') {
    stageCommands = [
      { id:'s2-layout', label:'平面布孔', icon: MapLocation, tooltip:'勘探点布置' },
      { id:'s2-plan', label:'i北勘纲要', icon: Document, tooltip:'在 i北勘中编制勘察纲要' },
    ]
  } else if (isEngineer.value && stageId === 's7') {
    stageCommands = [
      { id:'s7-ibgi', label:'i北勘内业', icon: Link, tooltip:'i北勘内业整理' },
      { id:'cag-system', label:'专业系统', icon: Grid, tooltip:'进入 CAG 专业系统' },
      { id:'s7-model', label:'地质建模', icon: Box, tooltip:'唤起地质建模程序' },
    ]
  } else if (stageId === 's8') {
    stageCommands = [
      { id:'s8-report', label:'智能报告', icon: Document, tooltip:'进入智能报告编制程序' },
      { id:'s8-review', label:'智能审核', icon: CircleCheck, tooltip:'对接智能审核外部程序' },
      { id:'s8-approval', label:'i北勘审批', icon: Link, tooltip:'进入 i北勘审批流程' },
    ]
  } else {
    const focusedStage = {
      s3: { id:'s3-recon', label:'i北勘辨识', icon: View },
      s4: { id:'s4-survey', label:'i北勘放线', icon: MapLocation },
      s5: { id:'s5-explore', label:'i北勘勘探', icon: Aim },
    }[stageId]
    stageCommands = focusedStage
      ? [focusedStage]
      : (stageRibbons[stageId]?.funcs || []).map((item) => ({
          id: item.id,
          label: item.label,
          icon: iconMap[item.icon] || Document,
          tooltip: item.desc || item.label,
        }))
  }

  return [stageOverviewCommand, ...stageCommands, ...stageCommonCommands]
})
const commandId = (item) => item.id
const commandLabel = (item) => item.label
const isCommandActive = (item) => {
  const id = commandId(item)
  if (id === 'dashboard' || id === 'stage-overview') return !state.stageFunc
  return state.stageFunc === id
}

// —— 当前阶段功能区 ——
const stageFuncs = computed(() => stageRibbons[state.currentStageId]?.funcs || [])
const activeFunc = computed(() => stageFuncs.value.find((f) => f.id === state.stageFunc) || null)
const ibgiStagePreview = computed(() => ({
  's2-plan':    { title:'纲要（i北勘）', src: import.meta.env.BASE_URL + 'ibgi-outline-preview.png' },
  's3-recon':   { title:'辨识（i北勘）', src: import.meta.env.BASE_URL + 'ibgi-recognition-preview.png' },
  's4-survey':  { title:'放线（i北勘）', src: import.meta.env.BASE_URL + 'ibgi-survey-preview.png' },
  's5-explore': { title:'勘探（i北勘）', src: import.meta.env.BASE_URL + 'ibgi-exploration-preview.png' },
  's7-ibgi':    { title:'内业（i北勘）', src: import.meta.env.BASE_URL + 'ibgi-full-process-preview.png' },
})[state.stageFunc] || null)
const externalProgramPreview = computed(() => ({
  's7-model': {
    title: '三维地质建模',
    src: import.meta.env.BASE_URL + 'geology-modeling-preview.png',
    alt: '北勘三维地质建模软件界面预览',
  },
  's8-approval': {
    title: '审批（i北勘）',
    src: import.meta.env.BASE_URL + 'ibgi-approval-preview.png',
    alt: 'i北勘产品交付审批页面预览',
  },
})[state.stageFunc] || null)

// —— 内容面板类型 ——
const isOverview = computed(() => state.cockpitTab === 'overview')
const funcPanel = computed(() => {
  if (isOverview.value) return state.stageFunc || 'dashboard'
  const sf = state.stageFunc
  if (!sf) return 'stage-workbench'
  if (ibgiStagePreview.value) return 'external'
  const f = activeFunc.value
  if (f) return f.type // 'external'
  return sf // 'todo' | 'result' | 'map' | 'files' | 'quality'
})

// —— i北勘 嵌入地址/标题（仅驾驶舱「工程信息」保留）——
const ibgiUrl = computed(() => {
  if (isOverview.value && state.stageFunc === 'info') return integrationUrls.ibgiEngineeringInfo || ''
  return ''
})
const ibgiTitle = computed(() => '工程信息')

// —— 待办 / 成果：待办在驾驶舱汇总，成果始终跟随当前流程阶段。——
const todoItems = computed(() => {
  if (!canAccessStage(state.currentStageId)) return []
  const all = todos
  return isOverview.value ? all : all.filter((t) => t.stageId === state.currentStageId)
})
const stageTodoItems = computed(() => todoItems.value.filter((t) => t.stageId === state.currentStageId))
const resultItems = computed(() => {
  if (!canAccessStage(state.currentStageId)) return []
  const vis = (r) => !r.roles || r.roles.includes(currentProjectRoleId.value)
  return results.filter((r) => r.stageId === state.currentStageId && vis(r))
})

// —— 唤起外部程序 ——
const launchExternal = (f) => {
  setStageFunc(f.id)
  ElMessage.success({ message: `正在唤起外部程序：${f.label}（${f.desc}）`, duration: 3000 })
}

// —— 紧凑操作栏命令 ——
const onRibbonClick = ({ itemId }) => {
  const id = itemId.includes('::') ? itemId.split('::')[1] : itemId
  if (id === 'dashboard' || id === 'stage-overview') return setStageFunc(null)
  if (id === 'full-process') return setStageFunc('full-process')
  if (id === 'todo')   return setStageFunc('todo')
  if (id === 'result') return setStageFunc('result')
  if (id === 'map')    return setStageFunc('map')
  if (id === 'files')  return setStageFunc('files')
  if (id === 'quality')return setStageFunc('quality')
  if (id === 'info')   return setStageFunc('info')
  if (['s2-plan','s3-recon','s4-survey','s5-explore'].includes(id)) return setStageFunc(id)
  if (id === 's2-layout') return enterWorkspace('s2', 'placement')
  if (id === 's7-ibgi') return setStageFunc('s7-ibgi')
  if (id === 'cag-system') return enterWorkspace('s7', 'cag')
  // 阶段功能（外部程序）
  const f = stageFuncs.value.find((x) => x.id === id)
  if (f) launchExternal(f)
}

// 返回阶段工作台 / 驾驶舱
const onBackToBase = () => setStageFunc(null)

// 流程条切阶段
const onFlowSelect = (stageId) => {
  if (isLeader.value) {
    state.currentStageId = stageId
    setStageFunc(null)
    return
  }
  setStage(stageId)
}

// 待办去办理：跳转到对应阶段的外部程序
const onTodoHandle = (t) => {
  setStage(t.stageId)
  if (t.action === 'CAG' || t.action === 's3mb') {
    const target = t.action === 's3mb' ? 's7-model' : (stageRibbons[t.stageId]?.funcs?.[0]?.id || null)
    if (target) launchExternal(stageRibbons['s7']?.funcs?.find((f) => f.id === target) || stageRibbons[t.stageId]?.funcs?.[0])
    else ElMessage.success('已转外部程序办理')
  }
}

// 成果查看
const onResultView = (r) => {
  if (['cad','log','section'].includes(r.viewer)) {
    setStage(r.stageId)
    const map = { cad: 's7-model', log: 's7-log', section: 's7-sec' }
    const f = stageRibbons['s7']?.funcs?.find((x) => x.id === map[r.viewer])
    if (f) launchExternal(f)
  } else {
    ElMessage.info(`预览：${r.name}`)
  }
}

const canAccessStage = (stageId) => {
  const acc = stageAccess[stageId]
  return acc ? acc.includes(currentProjectRoleId.value) : false
}

const onBack = () => { state.view = 'dashboard' }
const onLogout = () => logout()

// 阶段工作台指标
const projectMetrics = computed(() => [
  { label:'项目总体进度', value:`${currentProject.value.progress}%`, icon:TrendCharts, color:'#4a9eff' },
  { label:'当前所在阶段', value:stageName(currentProject.value.stageId), icon:Flag, color:'#10b981' },
  { label:'项目成员', value:`${currentProject.value.members} 人`, icon:User, color:'#a855f7' },
  { label:'计划截止', value:currentProject.value.deadline, icon:Timer, color:'#f59e0b' },
])
const stageMetrics = computed(() => [
  { label:'阶段状态', value: ({done:'已完成',doing:'进行中',todo:'未开始'})[currentProjectStageStatus.value[currentStage.value.id]] || '-', icon: Promotion, color:'#10b981' },
  { label:'本阶段待办', value: todoItems.value.length + ' 项', icon: List, color:'#a855f7' },
  { label:'本阶段成果', value: resultItems.value.length + ' 项', icon: FolderOpened, color:'#4a9eff' },
  { label:'勘探点数', value: boreholeTable.length + ' 个', icon: Aim, color:'#f59e0b' },
])
</script>

<template>
  <div class="cockpit-page">
    <!-- 顶部栏 -->
    <header class="cp-header">
      <div class="cp-left">
        <el-button :icon="ArrowLeft" text @click="onBack">返回看板</el-button>
        <div class="cp-proj">
          <span class="cp-proj-name">{{ currentProject.name }}</span>
          <span class="cp-proj-cat">{{ currentProject.category }} · {{ currentProject.city }}</span>
        </div>
      </div>
      <div class="cp-right">
        <ThemeToggle />
        <div class="cp-user">
          <span class="cp-avatar">{{ user.avatar }}</span>
          <div class="cp-userinfo">
            <span class="cp-name">{{ user.name }}</span>
            <span class="cp-role">{{ currentProjectRole.title }}</span>
          </div>
        </div>
        <el-button text @click="onLogout">退出</el-button>
      </div>
    </header>

    <!-- 流程导航条 -->
    <FlowNav
      :stages="flowStages"
      :current-id="state.currentStageId"
      :status-map="currentProjectStageStatus"
      :access-map="stageAccess"
      :role="currentProjectRoleId"
      @select="onFlowSelect"
    />

    <!-- 主体 -->
    <div class="cp-body">
      <!-- 流程条负责阶段导航；此处仅保留当前阶段的紧凑命令。 -->
      <div class="cp-commandbar" aria-label="当前阶段操作">
        <div class="cp-commandbar-context">
          <span class="cp-commandbar-dot" />
          <span>{{ isLeader ? '项目操作' : '当前阶段' }}</span>
        </div>
        <button
          v-for="(item, index) in commandItems"
          :key="item.id"
          type="button"
          class="cp-command"
          :class="{ 'is-primary': index === 0 && !state.stageFunc, 'is-active': isCommandActive(item) }"
          :aria-pressed="isCommandActive(item)"
          :title="item.tooltip || item.label"
          @click="onRibbonClick({ itemId: item.id })"
        >
          <el-icon><component :is="item.icon || Document" /></el-icon>
          <span>{{ commandLabel(item) }}</span>
        </button>
      </div>

      <main class="cp-main">
        <!-- 项目驾驶舱：仅展示当前项目信息 -->
        <div v-if="isOverview && funcPanel === 'dashboard'" class="view-scroll">
          <div class="stage-current">
            <div class="sc-left">
              <div class="sc-stage">{{ currentProject.name }}</div>
              <div class="sc-desc">{{ currentProject.desc }}</div>
            </div>
            <div class="sc-right">
              <div class="sc-access">
                <span class="sc-label">当前查看：</span>
                <span class="sc-role-tag">{{ currentStage.name }}</span>
                <span class="sc-role-tag">{{ currentProject.category }}</span>
                <span class="sc-role-tag">{{ currentProject.city }}</span>
              </div>
            </div>
          </div>

          <div class="metric-grid">
            <div v-for="m in projectMetrics" :key="m.label" class="metric-card">
              <div class="mc-icon" :style="{ background: m.color + '1a', color: m.color }">
                <el-icon><component :is="m.icon" /></el-icon>
              </div>
              <div class="mc-body">
                <div class="mc-value">{{ m.value }}</div>
                <div class="mc-label">{{ m.label }}</div>
              </div>
            </div>
          </div>

          <div class="two-col">
            <div class="block-card">
              <div class="bc-head">
                <span class="bc-title">{{ currentStage.name }} · 阶段待办</span>
                <span class="bc-sub">{{ stageTodoItems.length }} 项</span>
                <el-button v-if="stageTodoItems.length" text size="small" style="margin-left:auto" @click="setStageFunc('todo')">全部</el-button>
              </div>
              <TodoPanel :items="stageTodoItems.slice(0,4)" :stages="flowStages" empty-text="本阶段暂无待办" @handle="onTodoHandle" />
            </div>
            <div class="block-card">
              <div class="bc-head">
                <span class="bc-title">{{ currentStage.name }} · 阶段成果</span>
                <span class="bc-sub">{{ resultItems.length }} 项</span>
                <el-button v-if="resultItems.length" text size="small" style="margin-left:auto" @click="setStageFunc('result')">全部</el-button>
              </div>
              <ResultPanel :results="resultItems" :role="currentProjectRoleId" :stages="flowStages" @view="onResultView" />
            </div>
          </div>
        </div>

        <!-- 阶段工作台（默认） -->
        <div v-else-if="funcPanel === 'stage-workbench'" class="view-scroll">
          <div class="stage-current">
            <div class="sc-left">
              <div class="sc-stage">{{ currentStage.name }}</div>
              <div class="sc-desc">当前阶段 · {{ currentProjectStageStatus[currentStage.id] === 'doing' ? '进行中' : currentProjectStageStatus[currentStage.id] === 'done' ? '已完成' : '未开始' }}</div>
            </div>
            <div class="sc-right">
              <div class="sc-access">
                <span class="sc-label">办理岗位：</span>
                <span v-for="r in (stageAccess[currentStage.id] || [])" :key="r" class="sc-role-tag">{{ personas[r]?.title }}</span>
              </div>
              <div v-if="!canAccessStage(currentStage.id)" class="sc-denied">
                <el-icon><Lock /></el-icon> 您非本阶段办理岗位，以下功能为查看模式
              </div>
            </div>
          </div>

          <div class="metric-grid">
            <div v-for="m in stageMetrics" :key="m.label" class="metric-card">
              <div class="mc-icon" :style="{ background: m.color + '1a', color: m.color }">
                <el-icon><component :is="m.icon" /></el-icon>
              </div>
              <div class="mc-body">
                <div class="mc-value">{{ m.value }}</div>
                <div class="mc-label">{{ m.label }}</div>
              </div>
            </div>
          </div>

          <!-- 本阶段待办 / 成果 预览 -->
          <div class="two-col">
            <div class="block-card">
              <div class="bc-head"><span class="bc-title">本阶段待办</span><span class="bc-sub">{{ todoItems.length }} 项</span>
                <el-button v-if="todoItems.length" text size="small" style="margin-left:auto" @click="setStageFunc('todo')">全部</el-button>
              </div>
              <TodoPanel :items="todoItems.slice(0,4)" :stages="flowStages" empty-text="本阶段暂无待办" @handle="onTodoHandle" />
            </div>
            <div class="block-card">
              <div class="bc-head"><span class="bc-title">本阶段成果</span><span class="bc-sub">{{ resultItems.length }} 项</span>
                <el-button v-if="resultItems.length" text size="small" style="margin-left:auto" @click="setStageFunc('result')">全部</el-button>
              </div>
              <ResultPanel :results="resultItems" :role="currentProjectRoleId" :stages="flowStages" @view="onResultView" />
            </div>
          </div>
        </div>

        <!-- i北勘 工程信息（仅项目负责人可见） -->
        <div v-else-if="isOverview && funcPanel === 'info'" class="view-scroll ibgi-view">
          <div class="ibgi-card">
            <div class="bc-head">
              <span class="bc-title">工程信息</span>
              <span class="bc-sub">i北勘 · 仅项目负责人可见</span>
              <el-button text size="small" style="margin-left:auto" @click="onBackToBase">返回</el-button>
            </div>
            <IbgiPane
              :project-name="currentProject.name"
              :url="ibgiUrl"
              :user-name="user.name"
              :role-title="currentProjectRole.title"
            />
          </div>
        </div>

        <!-- 项目负责人 i北勘全流程占位预览 -->
        <div v-else-if="isOverview && funcPanel === 'full-process'" class="view-scroll">
          <div class="block-card ibgi-process-card">
            <div class="bc-head">
              <span class="bc-title">全流程（i北勘）</span>
              <el-button text size="small" style="margin-left:auto" @click="onBackToBase">返回</el-button>
            </div>
            <div class="ibgi-process-preview">
              <img :src="assetUrl('ibgi-full-process-preview.png')" alt="i北勘全流程页面预览" />
            </div>
          </div>
        </div>

        <!-- 外部程序唤起面板 -->
        <div v-else-if="funcPanel === 'external'" class="view-scroll">
          <div
            class="block-card"
            :class="{
              'ibgi-outline-card': ibgiStagePreview,
              'external-preview-card': externalProgramPreview,
            }"
          >
            <div class="bc-head">
              <span class="bc-title">{{ ibgiStagePreview?.title || externalProgramPreview?.title || activeFunc?.label }}</span>
              <span v-if="externalProgramPreview" class="bc-sub">外部程序界面预览</span>
              <span v-else-if="!ibgiStagePreview" class="bc-sub">{{ activeFunc?.desc }}</span>
              <el-button text size="small" style="margin-left:auto" @click="onBackToBase">返回</el-button>
            </div>
            <div v-if="ibgiStagePreview" class="ibgi-outline-preview">
              <img :src="ibgiStagePreview.src" :alt="ibgiStagePreview.title + '页面预览'" />
            </div>
            <div v-else-if="externalProgramPreview" class="external-program-preview">
              <img :src="externalProgramPreview.src" :alt="externalProgramPreview.alt" />
            </div>
            <div v-else class="external-panel">
              <el-icon :size="56"><Monitor /></el-icon>
              <div class="ep-title">外部程序唤起</div>
              <div class="ep-desc">{{ activeFunc?.desc || '正在对接外部专业程序' }}</div>
              <el-button type="primary" plain @click="ElMessage.success({ message: '已发送唤起指令：' + activeFunc?.label, duration: 2000 })">立即唤起</el-button>

              <!-- 产品交付：编制报告素材 -->
              <div v-if="activeFunc?.id === 's8-report'" class="material-list">
                <div class="ml-title">准备报告素材</div>
                <div class="ml-item"><el-icon><Grid /></el-icon> 实验数据</div>
                <div class="ml-item"><el-icon><Tickets /></el-icon> 岩性描述</div>
                <div class="ml-item"><el-icon><Warning /></el-icon> 地下水位</div>
                <div class="ml-item"><el-icon><Document /></el-icon> 岩土性能指标</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 待办（全部 / 本阶段） -->
        <div v-else-if="funcPanel === 'todo'" class="view-scroll">
          <div class="block-card">
            <div class="bc-head">
              <span class="bc-title">{{ isOverview ? '流程待办' : currentStage.name + ' · 待办' }}</span>
              <span class="bc-sub">{{ currentProjectRole.title }} · {{ todoItems.length }} 项</span>
              <el-button text size="small" style="margin-left:auto" @click="onBackToBase">返回</el-button>
            </div>
            <TodoPanel :items="todoItems" :stages="flowStages" @handle="onTodoHandle" />
          </div>
        </div>

        <!-- 成果（全部 / 本阶段） -->
        <div v-else-if="funcPanel === 'result'" class="view-scroll">
          <div class="block-card">
            <div class="bc-head">
              <span class="bc-title">{{ currentStage.name }} · 成果</span>
              <span class="bc-sub">模型 / 文档 / 报告 / 图件</span>
              <el-button text size="small" style="margin-left:auto" @click="onBackToBase">返回</el-button>
            </div>
            <ResultPanel :results="resultItems" :role="currentProjectRoleId" :stages="flowStages" @view="onResultView" />
          </div>
        </div>

        <!-- 数据地图 -->
        <div v-else-if="funcPanel === 'map'" class="view-scroll">
          <div class="block-card map-card">
            <div class="bc-head"><span class="bc-title">勘探点空间分布</span><span class="bc-sub">{{ currentProject.name }}</span>
              <el-button text size="small" style="margin-left:auto" @click="onBackToBase">返回</el-button>
            </div>
            <div class="bh-map">
              <svg viewBox="0 0 600 360" class="bh-svg">
                <defs>
                  <pattern id="g2" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M40 0L0 0 0 40" fill="none" stroke="var(--border)" />
                  </pattern>
                </defs>
                <rect width="600" height="360" fill="url(#g2)" />
                <path d="M120,80 L480,80 L520,180 L460,300 L140,300 L100,200 Z" fill="var(--surface-item)" stroke="var(--border-light)" />
                <g v-for="(b,i) in boreholeTable" :key="b.code">
                  <circle :cx="120+i*120" :cy="180" r="14" fill="rgba(200,50,47,0.15)" stroke="#c8322f" />
                  <circle :cx="120+i*120" :cy="180" r="5" fill="#c8322f" />
                  <text :x="120+i*120" :y="160" text-anchor="middle" fill="var(--text)" font-size="12" font-weight="600">{{ b.code }}</text>
                  <text :x="120+i*120" :y="210" text-anchor="middle" fill="var(--text-mute)" font-size="10">深{{ b.depth }}m</text>
                </g>
              </svg>
            </div>
          </div>
        </div>

        <!-- 过程文件 -->
        <div v-else-if="funcPanel === 'files'" class="view-scroll">
          <div class="block-card">
            <div class="bc-head"><span class="bc-title">过程文件</span><span class="bc-sub">勘察过程文档</span>
              <el-button text size="small" style="margin-left:auto" @click="onBackToBase">返回</el-button>
            </div>
            <div class="file-list">
              <div class="file-item"><el-icon><Document /></el-icon><span>勘察纲要_V1.0.docx</span><span class="file-tag">已审批</span></div>
              <div class="file-item"><el-icon><Document /></el-icon><span>现场踏勘记录表.pdf</span><span class="file-tag">已归档</span></div>
              <div class="file-item"><el-icon><Document /></el-icon><span>测量放线成果.xlsx</span><span class="file-tag">待审核</span></div>
              <div class="file-item"><el-icon><Document /></el-icon><span>勘探日志_2026-07-01.pdf</span><span class="file-tag">已归档</span></div>
              <div class="file-item"><el-icon><Document /></el-icon><span>试验报告汇总.docx</span><span class="file-tag">编制中</span></div>
            </div>
          </div>
        </div>

        <!-- 质量管控 -->
        <div v-else-if="funcPanel === 'quality'" class="view-scroll">
          <div class="block-card">
            <div class="bc-head"><span class="bc-title">质量管控</span><span class="bc-sub">检查 / 审核 / 验收</span>
              <el-button text size="small" style="margin-left:auto" @click="onBackToBase">返回</el-button>
            </div>
            <div class="quality-list">
              <div class="quality-item pass"><el-icon><CircleCheck /></el-icon><span>勘察纲要质量检查</span><span class="q-status pass">通过</span></div>
              <div class="quality-item pass"><el-icon><CircleCheck /></el-icon><span>勘探点布设复核</span><span class="q-status pass">通过</span></div>
              <div class="quality-item warn"><el-icon><Warning /></el-icon><span>试验数据一致性校验</span><span class="q-status warn">异常</span></div>
              <div class="quality-item wait"><el-icon><Timer /></el-icon><span>报告终审定</span><span class="q-status wait">待办</span></div>
            </div>
          </div>
        </div>

        <!-- 占位页（page 类型功能） -->
        <div v-else-if="funcPanel === 'page'" class="view-scroll">
          <div class="block-card">
            <div class="bc-head"><span class="bc-title">{{ activeFunc?.label || '功能' }}</span><span class="bc-sub">该模块待接入真实业务</span>
              <el-button text size="small" style="margin-left:auto" @click="onBackToBase">返回</el-button>
            </div>
            <div class="placeholder">
              <el-icon :size="48"><Monitor /></el-icon>
              <div class="ph-text">{{ activeFunc?.label }} — 视图待开发</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
.cockpit-page { position: fixed; inset: 0; display: flex; flex-direction: column; background: var(--app-bg); color: var(--text); }
.cp-header {
  height: 58px; flex-shrink: 0; display: flex; align-items: center; justify-content: space-between;
  padding: 0 22px; background: var(--header-bg); border-bottom: 1px solid var(--border);
}
.cp-left { display: flex; align-items: center; gap: 16px; }
.cp-proj { display: flex; flex-direction: column; }
.cp-proj-name { color: var(--text); font-size: 16px; font-weight: 700; }
.cp-proj-cat { color: var(--text-mute); font-size: 11px; }
.cp-right { display: flex; align-items: center; gap: 12px; }
.cp-user { display: flex; align-items: center; gap: 8px; }
.cp-avatar { width: 32px; height: 32px; border-radius: 50%; background: var(--panel-3); border: 1px solid var(--border); color: var(--text-dim); font-size:13px; font-weight:600; display:flex; align-items:center; justify-content:center; }
.cp-userinfo { display: flex; flex-direction: column; }
.cp-name { color: var(--text); font-size: 13px; font-weight: 600; }
.cp-role { color: var(--text-mute); font-size: 11px; }

.cp-body { flex: 1; display: flex; flex-direction: column; min-height: 0; }
.cp-commandbar {
  height: 58px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 22px;
  overflow-x: auto;
  overflow-y: hidden;
  background: var(--panel);
  border-bottom: 1px solid var(--border);
  box-shadow: 0 5px 14px rgba(15, 23, 42, 0.06);
}
.cp-commandbar-context {
  height: 30px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  margin-right: 8px;
  padding-right: 16px;
  border-right: 1px solid var(--border);
  color: var(--text-mute);
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}
.cp-commandbar-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 12%, transparent);
}
.cp-command {
  height: 40px;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--text-dim);
  font: inherit;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s, color 0.15s;
}
.cp-command .el-icon { color: var(--text-mute); font-size: 17px; }
.cp-command:hover {
  color: var(--text);
  background: var(--surface-hover);
  border-color: var(--border);
}
.cp-command:hover .el-icon { color: var(--accent); }
.cp-command.is-primary,
.cp-command.is-active {
  color: var(--accent);
  background: var(--surface-active);
  border-color: color-mix(in srgb, var(--accent) 28%, var(--border));
}
.cp-command.is-primary .el-icon,
.cp-command.is-active .el-icon { color: var(--accent); }
.cp-inline-ws { flex: 1; min-height: 0; }

.cp-main { flex: 1; overflow: hidden; }
.view-scroll { height: 100%; overflow: auto; padding: 20px 22px; display: flex; flex-direction: column; gap: 16px; }
.metric-grid { display: grid; grid-template-columns: repeat(4, minmax(180px, 1fr)); gap: 14px; }
.metric-card { display: flex; align-items: center; gap: 14px; padding: 18px; background: var(--panel); border: 1px solid var(--border); border-radius: 8px; box-shadow: var(--shadow-card); }
.mc-icon { width: 46px; height: 46px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 22px; }
.mc-value { color: var(--text); font-size: 24px; font-weight: 700; line-height: 1.15; }
.mc-label { color: var(--text-dim); font-size: 12px; margin-top: 3px; }

.block-card { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 18px; box-shadow: var(--shadow-card); }
.bc-head { display: flex; align-items: baseline; gap: 12px; margin-bottom: 14px; }
.bc-title { color: var(--text); font-size: 15px; font-weight: 700; }
.bc-sub { color: var(--text-mute); font-size: 12px; }

.proj-tip { display: flex; align-items: center; gap: 10px; padding: 14px 16px; background: color-mix(in srgb, var(--accent) 9%, var(--panel)); border: 1px solid color-mix(in srgb, var(--accent) 35%, var(--border)); border-radius: 7px; color: var(--text-dim); font-size: 13px; }
.proj-tip .el-icon { color: #6cb6ff; font-size: 18px; }

.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }

.stage-current { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; background: var(--panel); border: 1px solid var(--border-light); border-left: 4px solid var(--accent); border-radius: 8px; }
.sc-stage { color: var(--text); font-size: 22px; font-weight: 700; }
.sc-desc { color: var(--text-dim); font-size: 13px; margin-top: 4px; }
.sc-right { display: flex; flex-direction: column; align-items: flex-end; gap: 10px; }
.sc-access { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; justify-content: flex-end; }
.sc-label { color: var(--text-mute); font-size: 12px; }
.sc-role-tag { padding: 3px 10px; border-radius: 5px; background: rgba(74,158,255,0.12); color: #6cb6ff; font-size: 11px; }
.sc-denied { display: flex; align-items: center; gap: 6px; color: #fbbf24; font-size: 12px; }

.func-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
.func-card { display: flex; align-items: center; gap: 12px; padding: 14px 16px; background: var(--surface-item); border: 1px solid var(--border); border-radius: 7px; cursor: pointer; transition: background 0.15s, border-color 0.15s; }
.func-card:hover { background: var(--surface-hover); border-color: var(--border-light); }
.func-card.ibgi { border-left: 3px solid #10b981; }
.func-card.cad { border-left: 3px solid #4a9eff; }
.func-card.page { border-left: 3px solid #f59e0b; }
.func-card.external { border-left: 3px solid #f59e0b; }
.func-card.common { border-left: 3px solid #38bdf8; }
.fc-icon { width: 38px; height: 38px; border-radius: 8px; background: var(--panel-3); display: flex; align-items: center; justify-content: center; font-size: 18px; color: #6cb6ff; flex-shrink: 0; }
.func-card.ibgi .fc-icon { color: #34d399; }
.func-card.cad .fc-icon { color: #6cb6ff; }
.func-card.page .fc-icon { color: #fbbf24; }
.func-card.external .fc-icon { color: #fbbf24; }
.func-card.common .fc-icon { color: #38bdf8; }
.fc-body { flex: 1; display: flex; flex-direction: column; }
.fc-name { color: var(--text); font-size: 13px; font-weight: 600; }
.fc-tag { color: var(--text-mute); font-size: 10px; margin-top: 2px; }
.fc-go { color: var(--text-mute); font-size: 14px; }

.map-card .bh-map { height: 360px; }
.bh-svg { width: 100%; height: 100%; }

.file-list, .quality-list { display: flex; flex-direction: column; gap: 8px; }
.file-item, .quality-item {
  display: flex; align-items: center; gap: 10px; padding: 12px 14px;
  background: var(--surface-item); border: 1px solid var(--border); border-radius: 6px;
  color: var(--text); font-size: 13px;
}
.file-item .el-icon, .quality-item .el-icon { color: #6cb6ff; font-size: 16px; }
.file-tag, .q-status { margin-left: auto; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
.file-tag { background: rgba(74,158,255,0.12); color: #6cb6ff; }
.q-status.pass { background: rgba(103,194,58,0.12); color: #34d399; }
.q-status.warn { background: rgba(245,158,11,0.12); color: #fbbf24; }
.q-status.wait { background: var(--panel-3); color: var(--text-mute); }

.ibgi-view { padding: 16px; background: var(--app-bg); }
.ibgi-card { position: relative; height: 100%; display: flex; flex-direction: column; background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: 16px; }
.ibgi-card .bc-head { flex-shrink: 0; }
.ibgi-outline-card { height: 100%; display: flex; flex-direction: column; padding: 14px; }
.ibgi-outline-card .bc-head { flex-shrink: 0; margin-bottom: 10px; }
.ibgi-outline-preview { flex: 1; min-height: 0; overflow: auto; background: #eef1f7; border: 1px solid var(--border); }
.ibgi-outline-preview img { display: block; width: 100%; min-width: 1080px; height: auto; }
.ibgi-process-card { height: 100%; display: flex; flex-direction: column; padding: 14px; }
.ibgi-process-card .bc-head { flex-shrink: 0; margin-bottom: 10px; }
.ibgi-process-preview { flex: 1; min-height: 0; overflow: auto; background: #eef1f7; border: 1px solid var(--border); }
.ibgi-process-preview img { display: block; width: 100%; min-width: 1080px; height: auto; }
.external-preview-card { height: 100%; display: flex; flex-direction: column; padding: 14px; }
.external-preview-card .bc-head { flex-shrink: 0; margin-bottom: 10px; }
.external-program-preview { flex: 1; min-height: 0; overflow: hidden; background: #e8edf5; border: 1px solid var(--border); }
.external-program-preview img { display: block; width: 100%; height: 100%; object-fit: contain; object-position: top center; }

.placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 60px; color: var(--text-mute); }
.ph-text { font-size: 14px; }

.external-panel { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 14px; padding: 60px; color: var(--text-dim); }
.external-panel .el-icon { color: #fbbf24; }
.ep-title { color: var(--text); font-size: 18px; font-weight: 600; }
.ep-desc { max-width: 520px; text-align: center; font-size: 13px; line-height: 1.6; }

.material-list { width: 100%; max-width: 480px; margin-top: 24px; padding: 16px; background: var(--surface-card); border: 1px solid var(--border); border-radius: 8px; box-shadow: var(--shadow-card); }

@media (max-width: 1100px) {
  .metric-grid { grid-template-columns: repeat(2, minmax(180px, 1fr)); }
  .two-col { grid-template-columns: 1fr; }
}
.ml-title { color: var(--text); font-size: 14px; font-weight: 600; margin-bottom: 12px; text-align: center; }
.ml-item { display: flex; align-items: center; gap: 9px; padding: 10px 12px; border-radius: 6px; color: var(--text); font-size: 13px; font-weight: 500; }
.ml-item:hover { background: var(--surface-hover); }
.ml-item .el-icon { color: var(--accent); font-size: 16px; }
</style>
