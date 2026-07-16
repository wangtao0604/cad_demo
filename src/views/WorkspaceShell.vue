<script setup>
/**
 * 专业工作区 —— Ribbon + 工程树 + 多页签 + CAD 视口(补孔) + i北勘嵌入
 * 从原 App.vue 抽出，按角色裁剪 ribbon/树；从驾驶舱「阶段办理/待办/成果」唤起
 */
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { MlRibbon } from '@mlightcad/ribbon'
import {
  ArrowLeft, Lock, FolderOpened, Aim, Upload, Coffee, Connection,
  Edit, EditPen, Share, View, DataAnalysis, Operation, Grid,
} from '@element-plus/icons-vue'
import ProjectTree from '../components/ProjectTree.vue'
import StatusBar from '../components/StatusBar.vue'
import BoreholeTable from './BoreholeTable.vue'
import BoreholeLog from './BoreholeLog.vue'
import SectionPane from './SectionPane.vue'
import CadViewPane from './CadViewPane.vue'
import IbgiPane from './IbgiPane.vue'
import CagDataView from './CagDataView.vue'
import CagCommandPanel from './CagCommandPanel.vue'
import CagAutoLayerPane from './CagAutoLayerPane.vue'
import { buildRibbonForRole, fileMenuItems } from '../data/ribbonConfig'
import { buildTreeForRole } from '../data/treeData'
import { useAppStore } from '../store/useAppStore'

const {
  state, user, currentProject, currentProjectRole, currentProjectRoleId, backToCockpit,
} = useAppStore()

// 内联模式：嵌入驾驶舱内容区时隐藏顶部返回条、撑满父级
const props = defineProps({ embedded: { type: Boolean, default: false } })

// 角色驱动的 ribbon / 树
const ribbon = computed(() => buildRibbonForRole(currentProjectRoleId.value))
const placementMode = ref(['placement', 'borehole-place'].includes(state.workspaceTarget))
const placementTabs = [{
  id: 'placement',
  title: '平面布孔',
  groups: [{
    id: 'g-placement-actions', title: '', orientation: 'row',
    collections: [{
      id: 'c-placement-actions',
      items: [
        { id: 'open-plan', type: 'button', label: '打开平面图', size: 'large', icon: FolderOpened, tooltip: '打开勘探点平面图' },
        { id: 'borehole-place', type: 'button', label: '布孔', size: 'large', icon: Aim, tooltip: '在 CAD 视口中布置孔位' },
        { id: 'save-upload', type: 'button', label: '保存上传', size: 'large', icon: Upload, tooltip: '保存并上传平面布孔成果' },
      ],
    }],
  }],
}]
const cagMode = ref(state.workspaceTarget === 'cag')
const sectionEditMode = ref(false)
const cagCommandLabels = {
  'cag-soil-test':'水土试验', 'cag-auto-layer':'自动分层', 'cag-manual-layer':'手动分层', 'cag-section-settings':'剖面设置',
  'cag-view-layer':'综合分层', 'cag-view-borehole':'钻孔信息', 'cag-view-geology':'地质描述', 'cag-view-water':'水位信息',
  'cag-view-soil':'常规土试', 'cag-view-special-soil':'特殊土试', 'cag-view-demo-test':'岩石实验', 'cag-view-water-quality':'水质分析', 'cag-view-soluble-salt':'水的易溶盐',
  'cag-stat-soil':'常规土试', 'cag-stat-in-situ':'原位测试', 'cag-stat-jk':'综合统计JK', 'cag-stat-sk':'综合统计SK', 'cag-stat-borehole-layer':'钻孔&地层',
  'cag-stat-rebound':'回弹再压缩', 'cag-stat-high-pressure':'高压固结', 'cag-stat-rock':'岩石试验', 'cag-stat-dt':'综合统计DT', 'cag-stat-single-settle':'单孔结算',
  'cag-stat-water-level':'钻孔水位', 'cag-stat-layer-elevation':'地层标高', 'cag-stat-workload':'工作量', 'cag-stat-overview':'勘探点总览', 'cag-stat-single-workload':'单孔工作量',
  'cag-stat-record-a3':'备案表A3', 'cag-stat-record-a4':'备案表A4', 'cag-stat-record-hole':'备案含信孔', 'cag-stat-field-workload':'现场工作量',
  'cag-stat-field-settle':'外业结算', 'cag-stat-project-settle':'项目结算', 'cag-stat-contour':'等值线数据', 'cag-stat-check':'数据检查',
  'cag-calc-site':'场地判别', 'cag-calc-liquefaction':'地震液化', 'cag-calc-modulus':'砂卵石模量',
  'cag-calc-map-sheet':'图幅号计算', 'cag-calc-bearing':'承载力计算', 'cag-calc-corrosion':'腐蚀性判断',
}
const cagTabs = [{
  id: 'cag',
  title: '专业系统',
  groups: [{
    id: 'g-cag-actions', title: '', orientation: 'row',
    collections: [{
      id: 'c-cag-actions',
      items: [
        { id:'cag-soil-test', type:'button', label:'水土试验', size:'large', icon:Coffee },
        { id:'cag-auto-layer', type:'button', label:'自动分层', size:'large', icon:Connection },
        { id:'cag-manual-layer', type:'button', label:'手动分层', size:'large', icon:EditPen },
        { id:'cag-section-settings', type:'button', label:'剖面编辑', size:'large', icon:Share },
        { id:'cag-view', type:'button', label:'编辑数据', size:'large', icon:Edit },
        { id:'cag-stat', type:'button', label:'统计', size:'large', icon:DataAnalysis },
        { id:'cag-calc', type:'button', label:'计算', size:'large', icon:Operation },
      ],
    }],
  }],
}]
const sectionActionGroup = {
  id: 'g-section-actions', title: '剖面编辑', orientation: 'row', collections: [{
    id: 'c-section-actions', items: [
      { id:'open-plan', type:'button', label:'打开平面图', size:'large', icon:FolderOpened },
      { id:'section-load-holes', type:'button', label:'加载钻孔', size:'large', icon:Aim },
      { id:'section-line', type:'button', label:'交互生成剖线', size:'large', icon:Connection },
      { id:'section-result', type:'button', label:'生成剖面', size:'large', icon:Share },
    ],
  }],
}
const cagRibbonTabs = computed(() => [{
  ...cagTabs[0],
  groups: sectionEditMode.value ? [...cagTabs[0].groups, sectionActionGroup] : cagTabs[0].groups,
}])
const specializedMode = computed(() => placementMode.value || cagMode.value || sectionEditMode.value)
const ribbonTabs = computed(() => placementMode.value ? placementTabs : cagMode.value ? cagRibbonTabs.value : ribbon.value.tabs)
const readOnly = computed(() => ribbon.value.readOnly)
const treeData = computed(() => buildTreeForRole(currentProjectRoleId.value))

const activeTab = ref(placementMode.value ? 'placement' : cagMode.value ? 'cag' : ribbon.value.defaultTab)
const ribbonLayout = ref('classic')
const ribbonMinimized = ref(false)
const treeWidth = ref(260)
const treeCollapsed = ref(false)

// 页签管理
const tabs = ref([{ id: 'tbl1', title: '钻孔总表', type: 'table', closable: true }])
const activeId = ref('tbl1')

const ensureTab = (node) => {
  const exist = tabs.value.find((t) => t.id === node.id)
  if (exist) { activeId.value = node.id; return exist }
  const tab = { id: node.id, title: node.name, type: node.type, data: node, closable: true }
  tabs.value.push(tab)
  activeId.value = node.id
  return tab
}
const ensureCadTab = () => {
  let t = tabs.value.find((x) => x.id === 'cad-view')
  if (!t) { t = { id: 'cad-view', title: '三维建模视图', type: 'cad', closable: true }; tabs.value.push(t) }
  activeId.value = 'cad-view'
  return t
}
const ensureIbgiTab = () => {
  let t = tabs.value.find((x) => x.id === 'ibgi')
  if (!t) { t = { id: 'ibgi', title: 'i北勘项目工作台', type: 'ibgi', closable: true }; tabs.value.push(t) }
  activeId.value = 'ibgi'
  return t
}

const onTreeOpen = (node) => {
  if (node.type === 'cad') return ensureCadTab()
  if (node.type === 'ibgi') return ensureIbgiTab()
  if (['table', 'borehole', 'section', 'scene', 'stratum'].includes(node.type)) return ensureTab(node)
}
const onTabRemove = (name) => {
  const idx = tabs.value.findIndex((t) => t.id === name)
  if (idx < 0) return
  tabs.value.splice(idx, 1)
  if (activeId.value === name) activeId.value = tabs.value[Math.max(0, idx - 1)]?.id || ''
}

// 补孔
const boreholeDialogVisible = ref(false)
const boreholeOptions = ref({ prefix: 'ZK', startNo: 1, depth: 20 })
const boreholeTrigger = ref(0)
const sectionLineTrigger = ref(0)
const sectionGenerateTrigger = ref(0)
const sectionHoleLoadTrigger = ref(0)
const planFileInput = ref(null)
const planFile = ref()
const onBoreholeFinish = (nextNo) => { if (Number.isFinite(nextNo) && nextNo > 0) boreholeOptions.value.startNo = nextNo }
const confirmBorehole = () => { boreholeDialogVisible.value = false; boreholeTrigger.value += 1 }
const cagActiveView = ref('专业系统')
const cagActiveCommand = ref('')

const selectPlanFile = () => {
  ensureCadTab()
  planFileInput.value?.click()
}

const onPlanFileSelect = (event) => {
  const input = event.target
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (!file.name.toLowerCase().endsWith('.dwg')) {
    ElMessage.error('请选择 DWG 格式的平面图')
    return
  }
  if (file.size === 0) {
    ElMessage.error('无法打开空的 DWG 文件')
    return
  }
  planFile.value = file
  const cadTab = ensureCadTab()
  cadTab.title = file.name
  statusBarStatus.value = `正在打开 ${file.name}…`
}

const onPlanLoaded = (fileName) => {
  ElMessage.success(`已打开平面图：${fileName}`)
}

// Ribbon 分发
const onRibbonClick = ({ itemId }) => {
  if (readOnly.value && ['borehole-place', 'gen-surface', 'mod-edit', 'sec-draw', 'sv-layout', 'fd-pipe'].includes(itemId)) {
    ElMessage.warning('只读模式，该操作不可用')
    return
  }
  if (itemId.startsWith('cag-') && itemId !== 'cag-section-settings') {
    sectionEditMode.value = false
  }
  switch (itemId) {
    case 'open-plan': selectPlanFile(); break
    case 'borehole-place': ensureCadTab(); boreholeDialogVisible.value = true; break
    case 'save-upload': ensureCadTab(); ElMessage.success('平面布孔成果已保存并上传'); break
    case 'open-cad': ensureCadTab(); break
    case 'bh-table': ensureTab({ id: 'tbl1', name: '钻孔总表', type: 'table' }); break
    case 'bh-log': ensureTab({ id: 'zk01', name: 'ZK-01', type: 'borehole' }); break
    case 'sec-draw': ensureTab({ id: 'aa', name: "A-A' 工程地质剖面", type: 'section' }); break
    case 'sv-points': ensureTab({ id: 'lp1', name: '放线点总表', type: 'table' }); break
    case 'fd-files': ensureTab({ id: 'fd1', name: '管线探测记录', type: 'table' }); break
    case 'cag-view':
      cagActiveCommand.value = 'cag-view-layer'
      cagActiveView.value = '编辑数据'
      ElMessage.success('已打开：编辑数据')
      break
    case 'cag-auto-layer':
      cagActiveCommand.value = 'cag-auto-layer'
      cagActiveView.value = '自动分层'
      break
    case 'cag-section-settings':
      cagActiveCommand.value = 'cag-section-editor'
      cagActiveView.value = '剖面编辑'
      sectionEditMode.value = true
      activeTab.value = 'cag'
      break
    case 'section-line':
      sectionLineTrigger.value += 1
      break
    case 'section-load-holes':
      sectionHoleLoadTrigger.value += 1
      break
    case 'section-result':
      sectionGenerateTrigger.value += 1
      break
    case 'cag-stat':
      cagActiveCommand.value = 'cag-stat-panel'
      cagActiveView.value = '统计'
      break
    case 'cag-calc':
      cagActiveCommand.value = 'cag-calc-panel'
      cagActiveView.value = '计算'
      break
    default:
      if (cagCommandLabels[itemId]) {
        cagActiveCommand.value = itemId
        cagActiveView.value = cagCommandLabels[itemId]
        ElMessage.success(`已打开：${cagCommandLabels[itemId]}`)
      } else {
        ElMessage.info(`执行命令：${itemId}`)
      }
  }
}
const onFileMenuSelect = (id) => ElMessage.info(`文件菜单：${id}`)

// 状态栏
const statusBarStatus = ref('就绪')
const onCadStatus = (msg) => { statusBarStatus.value = msg || '就绪' }

// workspaceTarget：进入时打开对应视图
watch(() => state.workspaceTarget, (t) => {
  if (!t) return
  if (t === 'placement') {
    placementMode.value = true
    cagMode.value = false
    activeTab.value = 'placement'
    ensureCadTab()
  }
  else if (t === 'borehole-place') {
    placementMode.value = true
    cagMode.value = false
    activeTab.value = 'placement'
    ensureCadTab()
    boreholeDialogVisible.value = true
  }
  else if (t === 'cag') {
    placementMode.value = false
    cagMode.value = true
    sectionEditMode.value = false
    activeTab.value = 'cag'
    cagActiveCommand.value = ''
    cagActiveView.value = '专业系统'
  }
  else if (t === 'cad') ensureCadTab()
  else if (t === 'log') ensureTab({ id: 'zk01', name: 'ZK-01', type: 'borehole' })
  else if (t === 'section') ensureTab({ id: 'aa', name: "A-A' 工程地质剖面", type: 'section' })
  state.workspaceTarget = null
}, { immediate: true })

const onBack = () => backToCockpit()
</script>

<template>
  <div class="app-frame" :class="{ embedded: props.embedded }">
    <input
      ref="planFileInput"
      class="local-file-input"
      type="file"
      accept=".dwg,application/acad,application/x-acad,application/autocad_dwg,image/vnd.dwg"
      @change="onPlanFileSelect"
    />
    <!-- 顶部返回条（内联模式下隐藏，驾驶舱顶栏已有项目信息与返回） -->
    <div v-if="!props.embedded" class="ws-topbar">
      <el-button :icon="ArrowLeft" text @click="onBack">返回驾驶舱</el-button>
      <div class="ws-proj">
        <span class="ws-name">{{ currentProject.name }}</span>
        <span class="ws-stage">{{ currentProjectRole.title }} · 专业工作区</span>
      </div>
      <div v-if="readOnly" class="ws-ro"><el-icon><Lock /></el-icon> 只读模式</div>
    </div>

    <!-- Ribbon -->
    <MlRibbon
      v-model:active-tab="activeTab"
      v-model:layout="ribbonLayout"
      v-model:minimized="ribbonMinimized"
      :tabs="ribbonTabs"
      :file-menu-items="specializedMode ? [] : fileMenuItems"
      :show-file-menu="!specializedMode"
      :hide-layout-switcher="specializedMode"
      :hide-minimize-button="specializedMode"
      :hide-key-tips-toggle="specializedMode"
      :size="specializedMode ? 'default' : 'small'"
      :class="{ 'placement-ribbon': placementMode, 'cag-ribbon': cagMode }"
      @item-click="onRibbonClick"
      @file-menu-select="onFileMenuSelect"
    />

    <div v-if="cagMode" class="cag-workspace">
      <div class="cag-view-head">
        <el-icon><Grid /></el-icon>
        <span>{{ cagActiveView }}</span>
      </div>
      <CagDataView
        v-if="cagActiveCommand.startsWith('cag-view-')"
        :command="cagActiveCommand"
        @select="(label) => (cagActiveView = label)"
      />
      <CagAutoLayerPane v-else-if="cagActiveCommand === 'cag-auto-layer'" />
      <div v-else-if="cagActiveCommand === 'cag-section-editor'" class="section-cad-workspace">
        <CadViewPane
          :options="boreholeOptions"
          :trigger="sectionLineTrigger"
          :generate-trigger="sectionGenerateTrigger"
          :load-holes-trigger="sectionHoleLoadTrigger"
          :local-file="planFile"
          tool-mode="section"
          @section-finish="({ generated, message }) => generated ? ElMessage.success('CAD 剖面已生成') : message && ElMessage.warning(message)"
          @status="onCadStatus"
        />
      </div>
      <CagCommandPanel
        v-else-if="cagActiveCommand === 'cag-stat-panel' || cagActiveCommand === 'cag-calc-panel'"
        :mode="cagActiveCommand === 'cag-stat-panel' ? 'statistics' : 'calculations'"
        @select="(command) => onRibbonClick({ itemId: command })"
      />
      <div v-else class="cag-view-body">
        <div class="cag-view-name">{{ cagActiveView }}</div>
      </div>
      <StatusBar :status="'CAG · ' + cagActiveView" />
    </div>

    <div v-else class="app-body">
      <ProjectTree
        v-if="!placementMode"
        v-model:collapsed="treeCollapsed"
        :width="treeWidth"
        :data="treeData"
        :title="readOnly ? '工程结构(只读)' : '工程管理'"
        :read-only="readOnly"
        @open="onTreeOpen"
        @resize="(w) => (treeWidth = w)"
      />

      <div class="app-main">
        <div class="doc-tabs">
          <el-tabs v-model="activeId" type="card" style="flex:1;display:flex;flex-direction:column;min-height:0;" @tab-remove="onTabRemove">
            <el-tab-pane v-for="t in tabs" :key="t.id" :label="t.title" :name="t.id" :closable="t.closable" lazy>
              <div class="doc-tab-pane">
                <BoreholeTable v-if="t.type === 'table'" />
                <BoreholeLog v-else-if="t.type === 'borehole'" :code="t.data?.name || 'ZK-01'" />
                <SectionPane v-else-if="t.type === 'section'" :title="t.data?.name || '剖面'" />
                <CadViewPane
                  v-else-if="t.type === 'cad'"
                  :options="boreholeOptions"
                  :trigger="boreholeTrigger"
                  :local-file="planFile"
                  :read-only="readOnly"
                  @borehole-finish="onBoreholeFinish"
                  @file-loaded="onPlanLoaded"
                  @status="onCadStatus"
                />
                <IbgiPane
                  v-else-if="t.type === 'ibgi'"
                  :project-name="currentProject.name"
                  :user-name="user.name"
                  :role-title="currentProjectRole.title"
                />
                <div v-else class="view-pad">
                  <div class="view-card" style="text-align:center;color:var(--text-dim);padding:60px;">{{ t.title }} —— 该视图待开发</div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
        <StatusBar :status="statusBarStatus" />
      </div>
    </div>

    <!-- 补孔参数对话框 -->
    <el-dialog v-model="boreholeDialogVisible" title="补孔参数" width="360px" align-center>
      <el-form label-width="90px" label-position="right">
        <el-form-item label="钻孔前缀"><el-input v-model="boreholeOptions.prefix" placeholder="ZK" /></el-form-item>
        <el-form-item label="起始编号"><el-input-number v-model="boreholeOptions.startNo" :min="1" :step="1" controls-position="right" style="width:100%" /></el-form-item>
        <el-form-item label="设计孔深(m)"><el-input-number v-model="boreholeOptions.depth" :min="0.1" :step="0.5" controls-position="right" style="width:100%" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="boreholeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBorehole">开始补孔</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.app-frame.embedded { width: 100%; height: 100%; }
.local-file-input { display: none; }
.ws-topbar {
  height: 44px; flex-shrink: 0; display: flex; align-items: center; gap: 16px;
  padding: 0 16px; background: var(--app-bg-2); border-bottom: 1px solid var(--border);
}
.ws-proj { display: flex; align-items: center; gap: 10px; }
.ws-name { color: var(--text); font-size: 14px; font-weight: 700; }
.ws-stage { color: var(--text-dim); font-size: 11px; padding: 2px 8px; background: var(--panel); border-radius: 4px; }
.ws-ro { margin-left: auto; display: flex; align-items: center; gap: 4px; color: var(--warn); font-size: 12px; padding: 4px 10px; background: rgba(245,158,11,0.1); border-radius: 6px; }
:deep(.placement-ribbon .ml-ribbon__header) { min-height: 36px; padding: 0 14px; }
:deep(.placement-ribbon .ml-ribbon__panel) { padding: 6px 14px 4px; }
:deep(.ml-ribbon-group[data-group-id="g-placement-actions"]) {
  width: auto; min-width: 360px; max-width: none; padding: 6px 0; border-right: 0;
}
:deep(.ml-ribbon-group[data-group-id="g-placement-actions"] .ml-ribbon-collection) { gap: 10px; }
:deep(.ml-ribbon-group[data-group-id="g-placement-actions"] .ml-ribbon-item-host.is-large .el-button) {
  min-width: 108px; padding: 8px 16px; border: 1px solid rgba(74,158,255,0.18); background: rgba(255,255,255,0.025);
}
:deep(.ml-ribbon-group[data-group-id="g-placement-actions"] .ml-ribbon-item-host.is-large .el-button:hover) {
  border-color: rgba(74,158,255,0.48); background: rgba(74,158,255,0.12);
}
:deep(.ml-ribbon-group[data-group-id="g-placement-actions"] .ml-ribbon-item-host__icon) { font-size: 25px; color: #6cb6ff; }
:deep(.ml-ribbon-group[data-group-id="g-placement-actions"] .ml-ribbon-item-host__label) { font-size: 13px; font-weight: 600; }
:deep(.ml-ribbon-group[data-group-id="g-cag-actions"]) {
  width: auto; min-width: 850px; max-width: none; padding: 6px 0; border-right: 0;
}
:deep(.ml-ribbon-group[data-group-id="g-cag-actions"] .ml-ribbon-collection) { gap: 10px; }
:deep(.ml-ribbon-group[data-group-id="g-cag-actions"] .ml-ribbon-item-host.is-large) { width: 110px; }
:deep(.ml-ribbon-group[data-group-id="g-cag-actions"] .ml-ribbon-item-host.is-large .el-button) {
  width: 110px; min-width: 110px; padding: 8px 12px; border: 1px solid rgba(74,158,255,0.18); background: rgba(255,255,255,0.025);
}
:deep(.ml-ribbon-group[data-group-id="g-cag-actions"] .ml-ribbon-item-host.is-large .el-button:hover) {
  border-color: rgba(74,158,255,0.48); background: rgba(74,158,255,0.12);
}
:deep(.ml-ribbon-group[data-group-id="g-cag-actions"] .ml-ribbon-dropdown) { width: 110px; height: 100%; }
:deep(.ml-ribbon-group[data-group-id="g-cag-actions"] .ml-ribbon-item-host__icon) { font-size: 25px; color: #6cb6ff; }
:deep(.ml-ribbon-group[data-group-id="g-cag-actions"] .ml-ribbon-item-host__label) { font-size: 13px; font-weight: 600; }
.cag-workspace { flex: 1; min-height: 0; display: flex; flex-direction: column; background: #0f1117; }
.cag-view-head { height: 40px; flex-shrink: 0; display: flex; align-items: center; gap: 8px; padding: 0 16px; border-bottom: 1px solid var(--border); color: var(--text); font-size: 13px; font-weight: 600; }
.cag-view-head .el-icon { color: var(--accent); font-size: 17px; }
.cag-view-body { flex: 1; min-height: 0; display: flex; align-items: center; justify-content: center; background: var(--app-bg-2); }
.section-cad-workspace { position: relative; flex: 1; min-height: 0; }
.cag-view-name { color: var(--text-mute); font-size: 18px; }
:deep(.el-tabs__content) { flex: 1; min-height: 0; overflow: hidden; }
:deep(.el-tab-pane) { height: 100%; }
:deep(.el-tabs__nav) { border-top-left-radius: 0; }
</style>
