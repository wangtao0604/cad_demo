<script setup>
/**
 * CAD 三维建模视口页签
 * - 内嵌 MlCadViewer（可写模式）
 * - viewer @create 时注册补孔命令
 * - props.trigger 变化时触发补孔拾取
 * - 命令结束（finally 回调）复位状态
 */
import { ref, watch, onMounted, onUnmounted, onErrorCaptured } from 'vue'
import { MlCadViewer } from '@mlightcad/cad-viewer'
import {
  AcEdOpenMode, AcApDocManager, AcApSettingManager, eventBus,
  isOpenFileProgressComplete,
} from '@mlightcad/cad-simple-viewer'
import {
  configureBoreholeViewer,
  startBoreholePlacement,
  BOREHOLE_COMMAND_NAME,
} from '../composables/useBoreholeCommand'
import {
  addSectionTestHoles,
  configureSectionViewer,
  generateCadSection,
  startSectionLine,
} from '../composables/useSectionCommand'

const props = defineProps({
  options: { type: Object, required: true }, // { prefix, startNo, depth }
  trigger: { type: Number, default: 0 },
  localFile: { type: File, default: undefined },
  toolMode: { type: String, default: 'borehole' },
  generateTrigger: { type: Number, default: 0 },
})

// 关闭 CAD Viewer 自带的顶部工具栏/主菜单/命令行，只保留画布，
// 由外层 WorkspaceShell 的 @mlightcad/ribbon 提供统一 Ribbon。
AcApSettingManager.instance.isShowToolbar = false
AcApSettingManager.instance.isShowMainMenu = false
AcApSettingManager.instance.isShowCommandLine = false
AcApSettingManager.instance.isShowCoordinate = false
AcApSettingManager.instance.isShowLanguageSelector = false
AcApSettingManager.instance.isShowEntityInfo = false
AcApSettingManager.instance.isShowStats = false

// —— 修复 GitHub Pages 子路径下 CAD Worker 404 ——
// MlCadViewer 未暴露 worker URL 的 prop，其内部创建 editor 时调用
// AcApDocManager.registerWorkers(undefined)，三个 worker 全部走库写死的
// 默认路径 './assets/...'，在 Pages 子路径下被解析成源站根 '/assets/...' → 404，
// 导致 "无法打开文件" / CAD 视口空白。这里猴子补丁 registerWorkers，
// 把 dxf/dwg 解析 worker 与 mtext 渲染 worker 的地址统一加上 BASE_URL 前缀。
// 用一次性标记避免组件反复挂载时重复包裹。
// 统一把 BASE_URL 下的资源拼成【绝对 URL】。
// 关键：库内部 getFileNameFromUri 用 new URL(uri) 且不带 base，
// 相对路径（如 '/cad_demo/...'）会直接抛 "Invalid URL"，必须传绝对地址。
const absUrl = (path) =>
  new URL(import.meta.env.BASE_URL + path, window.location.origin).href

if (!AcApDocManager.prototype.__cadDemoWorkerPatched) {
  const _origRegisterWorkers = AcApDocManager.prototype.registerWorkers
  AcApDocManager.prototype.registerWorkers = function (urls) {
    return _origRegisterWorkers.call(this, {
      dxfParser: absUrl('assets/dxf-parser-worker.js'),
      dwgParser: absUrl('assets/libredwg-parser-worker.js'),
      mtextRender: absUrl('assets/mtext-renderer-worker.js'),
    })
  }
  AcApDocManager.prototype.__cadDemoWorkerPatched = true
}

const emit = defineEmits(['borehole-finish', 'section-finish', 'status', 'created', 'file-loaded'])

const locale = ref('zh')
const cadBaseUrl = absUrl('cad-data/')
const drawingUrl = absUrl('cad-data/templates/acadiso.dxf')
const placing = ref(false)
const viewerReady = ref(false)
const errorMsg = ref('')
const pendingTrigger = ref(0)
const openingFileName = ref('')

watch(
  () => props.localFile,
  (file) => {
    if (!file) return
    if (props.toolMode === 'section' && AcApDocManager.instance.curDocument) {
      AcApDocManager.instance.curDocument.__sectionTestHolesAdded = false
    }
    openingFileName.value = file.name
    errorMsg.value = ''
    emit('status', `正在打开 ${file.name}…`)
  },
)

watch(
  () => props.generateTrigger,
  (value) => {
    if (!value || props.toolMode !== 'section') return
    const result = generateCadSection()
    emit('status', result.ok ? `CAD 剖面已生成 · ${result.holeCount} 个测试孔` : result.message)
    emit('section-finish', { generated: result.ok, message: result.message })
  },
)

const runInteractiveCommand = () => {
  placing.value = true
  if (props.toolMode === 'section') {
    emit('status', '交互生成剖线 · 指定起点')
    startSectionLine()
  } else {
    emit('status', `补孔中 · ${props.options.prefix}${props.options.startNo} 起 / 深度 ${props.options.depth}m`)
    startBoreholePlacement()
  }
}

const onViewerCreate = () => {
  if (props.toolMode === 'section') {
    configureSectionViewer((result) => {
      placing.value = false
      emit('status', '就绪')
      emit('section-finish', result)
    })
  } else {
    configureBoreholeViewer(
      () => ({ prefix: props.options.prefix, startNo: props.options.startNo, depth: props.options.depth }),
      (nextNo) => {
        placing.value = false
        emit('status', '就绪')
        emit('borehole-finish', nextNo)
      },
    )
  }
  viewerReady.value = true
  emit('created')
  // viewer 就绪后补发缓存的触发
  if (pendingTrigger.value > 0) {
    pendingTrigger.value = 0
    runInteractiveCommand()
  }
}

// 父组件递增 trigger → 触发补孔；viewer 未就绪则缓存
watch(
  () => props.trigger,
  (n) => {
    if (n <= 0) return
    if (!viewerReady.value) {
      pendingTrigger.value = n
      emit('status', 'CAD 视口加载中…')
      return
    }
    runInteractiveCommand()
  },
)

const onViewerMessage = ({ message, type }) => {
  if (type === 'error') errorMsg.value = message || ''
}

const onOpenFileProgress = (progress) => {
  if (!openingFileName.value) return
  if (isOpenFileProgressComplete(progress)) {
    const fileName = openingFileName.value
    openingFileName.value = ''
    emit('status', `已打开 · ${fileName}`)
    emit('file-loaded', fileName)
    if (props.toolMode === 'section') window.setTimeout(addSectionTestHoles, 100)
    return
  }
  const percentage = Math.round(Number(progress?.percentage) || 0)
  emit('status', `正在打开 ${openingFileName.value} · ${percentage}%`)
}

const onOpenFileFailed = ({ fileName }) => {
  if (!openingFileName.value) return
  openingFileName.value = ''
  errorMsg.value = `无法打开 DWG 文件：${fileName}`
  emit('status', '打开平面图失败')
}

onMounted(() => {
  eventBus.on('message', onViewerMessage)
  eventBus.on('open-file-progress', onOpenFileProgress)
  eventBus.on('failed-to-open-file', onOpenFileFailed)
})
onUnmounted(() => {
  eventBus.off('message', onViewerMessage)
  eventBus.off('open-file-progress', onOpenFileProgress)
  eventBus.off('failed-to-open-file', onOpenFileFailed)
})

onErrorCaptured((err) => {
  errorMsg.value = err?.message || String(err)
  console.error('[CadViewPane]', err)
  return false
})
</script>

<template>
  <div class="cad-pane">
    <div v-if="placing" class="cad-overlay-tip">
      {{ toolMode === 'section' ? '剖线模式：依次拾取剖线节点，空回车或 Esc 结束' : '补孔模式：在视口中点击放置钻孔，空回车或 Esc 结束' }}
    </div>
    <MlCadViewer
      :locale="locale"
      :background="0x1a1a2e"
      :mode="AcEdOpenMode.Write"
      theme="dark"
      :base-url="cadBaseUrl"
      :url="drawingUrl"
      :local-file="localFile"
      @create="onViewerCreate"
    />
    <div
      v-if="errorMsg"
      style="position:absolute;bottom:10px;left:10px;z-index:30;max-width:60%;
             padding:10px 14px;background:#2a1a1a;border:1px solid var(--danger);
             border-radius:6px;color:var(--danger);font-size:12px;"
    >
      {{ errorMsg }}
    </div>
  </div>
</template>

<style scoped>
.cad-pane { position: absolute; inset: 0; overflow: hidden; }
:deep(.ml-cad-viewer-container) {
  position: absolute !important;
  inset: 0 !important;
  width: 100% !important;
  height: 100% !important;
}
</style>
