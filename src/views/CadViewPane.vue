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
import { AcEdOpenMode, AcApDocManager, AcApSettingManager, eventBus } from '@mlightcad/cad-simple-viewer'
import {
  configureBoreholeViewer,
  startBoreholePlacement,
  BOREHOLE_COMMAND_NAME,
} from '../composables/useBoreholeCommand'

const props = defineProps({
  options: { type: Object, required: true }, // { prefix, startNo, depth }
  trigger: { type: Number, default: 0 },
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

const emit = defineEmits(['borehole-finish', 'status', 'created'])

const locale = ref('zh')
const cadBaseUrl = new URL('/cad-data/', window.location.origin).href
const drawingUrl = new URL('/cad-data/templates/acadiso.dxf', window.location.origin).href
const placing = ref(false)
const viewerReady = ref(false)
const errorMsg = ref('')
const pendingTrigger = ref(0)

const runBorehole = () => {
  placing.value = true
  emit('status', `补孔中 · ${props.options.prefix}${props.options.startNo} 起 / 深度 ${props.options.depth}m`)
  startBoreholePlacement()
}

const onViewerCreate = () => {
  configureBoreholeViewer(
    () => ({
      prefix: props.options.prefix,
      startNo: props.options.startNo,
      depth: props.options.depth,
    }),
    (nextNo) => {
      // 命令 finally 回调：复位状态 + 通知父更新起始编号
      placing.value = false
      emit('status', '就绪')
      emit('borehole-finish', nextNo)
    },
  )
  viewerReady.value = true
  emit('created')
  // viewer 就绪后补发缓存的触发
  if (pendingTrigger.value > 0) {
    pendingTrigger.value = 0
    runBorehole()
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
    runBorehole()
  },
)

const onViewerMessage = ({ message, type }) => {
  if (type === 'error') errorMsg.value = message || ''
}

onMounted(() => {
  eventBus.on('message', onViewerMessage)
})
onUnmounted(() => {
  eventBus.off('message', onViewerMessage)
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
      补孔模式：在视口中点击放置钻孔，空回车或 Esc 结束
    </div>
    <MlCadViewer
      :locale="locale"
      :background="0x1a1a2e"
      :mode="AcEdOpenMode.Write"
      theme="dark"
      :base-url="cadBaseUrl"
      :url="drawingUrl"
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
