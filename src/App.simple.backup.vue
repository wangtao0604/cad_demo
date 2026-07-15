<script setup>
import { ref, computed, onErrorCaptured, onMounted, onUnmounted } from 'vue'
import { MlCadViewer } from '@mlightcad/cad-viewer'
import {
  AcApDocManager,
  AcApSettingManager,
  AcEdCommand,
  AcEdOpenMode,
  AcEdOsnapResolver,
  eventBus,
} from '@mlightcad/cad-simple-viewer'
import { AcDbBlockTableRecord, AcDbDatabase } from '@mlightcad/data-model'

const locale = ref('zh')
const errorMsg = ref('')
const errorStack = ref('')
const failedFileName = ref('')
const lastOpenProgress = ref(null)
const lastCadOpenError = ref(null)
const lastViewerMessage = ref('')

const toggleLocale = () => {
  locale.value = locale.value === 'zh' ? 'en' : 'zh'
}

const clearError = () => {
  errorMsg.value = ''
  errorStack.value = ''
  failedFileName.value = ''
  lastCadOpenError.value = null
  lastViewerMessage.value = ''
}

const formatError = (err) => {
  if (!err) return ''
  if (typeof err === 'string') return err
  return err.message || String(err)
}

const formatStack = (err) => {
  if (!err || typeof err === 'string') return ''
  return err.stack || ''
}

const isDwgParserFailure = (value) => {
  const message = value || ''
  return (
    /memory access out of bounds|out of WASM memory|Failed to decode DWG/i.test(message) ||
    (/Failed to parse drawing/i.test(message) && /\.dwg$/i.test(failedFileName.value || ''))
  )
}

const describeCadError = (message) => {
  if (!isDwgParserFailure(message)) return message

  return [
    'DWG 解析失败：当前 LibreDWG WebAssembly 解析器打不开这个 DWG，前端没有拿到可渲染的图元数据。',
    `原始错误：${message}`,
    '',
    '处理建议：',
    '1. 用 AutoCAD / ODA / 其他 CAD 软件把图纸另存为 DXF 后再打开。',
    '2. 或另存为较低版本 DWG（例如 2013/2010），先 PURGE/清理图纸再试。',
    '3. 如果必须直接打开这个 DWG，需要接入 native/服务端 ODA 转换，浏览器里的这个 WASM worker 不能可靠解这个文件。',
  ].join('\n')
}

const formatProgress = (progress) => {
  if (!progress) return ''
  return [
    progress.stage,
    progress.subStage,
    progress.subStageStatus,
    progress.percentage != null ? `${progress.percentage}%` : '',
  ].filter(Boolean).join(' / ')
}

const openDiagnostics = computed(() => {
  const rows = []
  if (failedFileName.value) rows.push(`File: ${failedFileName.value}`)
  if (lastOpenProgress.value) rows.push(`Last progress: ${formatProgress(lastOpenProgress.value)}`)
  if (lastViewerMessage.value) rows.push(`Viewer message: ${lastViewerMessage.value}`)
  return rows.join('\n')
})

const showError = (message, err) => {
  errorMsg.value = [describeCadError(message), openDiagnostics.value].filter(Boolean).join('\n\n')
  errorStack.value = formatStack(err)
}

const patchCadOpenErrors = () => {
  if (AcDbDatabase.prototype.__cadDemoOpenErrorPatched) return

  const originalRead = AcDbDatabase.prototype.read
  const originalOpenUri = AcDbDatabase.prototype.openUri

  AcDbDatabase.prototype.read = async function patchedRead(...args) {
    try {
      return await originalRead.apply(this, args)
    } catch (err) {
      window.__cadDemoLastOpenError = err
      throw err
    }
  }

  AcDbDatabase.prototype.openUri = async function patchedOpenUri(...args) {
    try {
      return await originalOpenUri.apply(this, args)
    } catch (err) {
      window.__cadDemoLastOpenError = err
      throw err
    }
  }

  Object.defineProperty(AcDbDatabase.prototype, '__cadDemoOpenErrorPatched', {
    value: true,
    configurable: false,
  })
}

const disableOsnap = () => {
  AcApSettingManager.instance.osnapModes = 0
}

const isOsnapModelSpaceWriteError = (err) => (
  formatError(err).includes('not open for write')
)

const patchOsnapResolver = () => {
  const proto = AcEdOsnapResolver.prototype
  if (proto.__cadDemoOsnapPatched) return

  const originalResolve = proto.resolve
  const originalCollectOsnapPoints = proto.collectOsnapPoints

  proto.resolve = function patchedResolve(...args) {
    if (AcApSettingManager.instance.osnapModes === 0) return undefined
    try {
      return originalResolve.apply(this, args)
    } catch (err) {
      if (isOsnapModelSpaceWriteError(err)) {
        console.warn('[CAD Viewer] Skipped object snap lookup:', err)
        return undefined
      }
      throw err
    }
  }

  proto.collectOsnapPoints = function patchedCollectOsnapPoints(...args) {
    if (AcApSettingManager.instance.osnapModes === 0) return []
    try {
      return originalCollectOsnapPoints.apply(this, args)
    } catch (err) {
      if (isOsnapModelSpaceWriteError(err)) {
        console.warn('[CAD Viewer] Skipped object snap collection:', err)
        return []
      }
      throw err
    }
  }

  Object.defineProperty(proto, '__cadDemoOsnapPatched', {
    value: true,
    configurable: false,
  })
}

const syncViewDefaultLayers = (manager, db) => {
  const view = manager.curView
  view?.bindDrawDatabase?.(db)
  for (const layer of db.tables.layerTable.newIterator()) {
    view?.addLayer?.(layer)
  }
  manager.setActiveLayout?.()
  view?.syncDisplaySysVars?.(db)
}

const ensureWritableDefaults = () => {
  try {
    const manager = AcApDocManager.instance
    const db = manager.curDocument?.database
    db?.ensureDatabaseDefaults?.()
    if (db && !db.tables.layerTable.getAt(db.clayer)) {
      db.clayer = '0'
    }
    if (db) {
      syncViewDefaultLayers(manager, db)
    }
  } catch (err) {
    if (!formatError(err).includes('instance is not created yet')) {
      console.warn('[CAD Viewer] Failed to ensure writable defaults:', err)
    }
  }
}

const patchEntityAppendDefaults = () => {
  const proto = AcDbBlockTableRecord.prototype
  if (proto.__cadDemoAppendDefaultsPatched) return

  const originalAppendEntity = proto.appendEntity
  proto.appendEntity = function patchedAppendEntity(...args) {
    if ((window.__cadDemoCommandDepth || 0) > 0) {
      try {
        const manager = AcApDocManager.instance
        if (manager.curDocument?.database === this.database) {
          this.database?.ensureDatabaseDefaults?.()
          syncViewDefaultLayers(manager, this.database)
        }
      } catch (err) {
        if (!formatError(err).includes('instance is not created yet')) {
          console.warn('[CAD Viewer] Failed to prepare append defaults:', err)
        }
      }
    }
    return originalAppendEntity.apply(this, args)
  }

  Object.defineProperty(proto, '__cadDemoAppendDefaultsPatched', {
    value: true,
    configurable: false,
  })
}

const patchCommandDefaults = () => {
  const proto = AcEdCommand.prototype
  if (proto.__cadDemoCommandDefaultsPatched) return

  const originalTrigger = proto.trigger
  proto.trigger = async function patchedTrigger(...args) {
    ensureWritableDefaults()
    window.__cadDemoCommandDepth = (window.__cadDemoCommandDepth || 0) + 1
    try {
      return await originalTrigger.apply(this, args)
    } finally {
      window.__cadDemoCommandDepth = Math.max((window.__cadDemoCommandDepth || 1) - 1, 0)
      ensureWritableDefaults()
    }
  }

  Object.defineProperty(proto, '__cadDemoCommandDefaultsPatched', {
    value: true,
    configurable: false,
  })
}

const attachDocManagerDefaultGuards = () => {
  try {
    const manager = AcApDocManager.instance
    if (manager.__cadDemoDefaultGuardsAttached) return

    manager.events.documentCreated.addEventListener(ensureWritableDefaults)
    manager.events.documentActivated.addEventListener(ensureWritableDefaults)
    manager.editor.events.commandWillStart.addEventListener(ensureWritableDefaults)
    manager.editor.events.commandEnded.addEventListener(ensureWritableDefaults)

    Object.defineProperty(manager, '__cadDemoDefaultGuardsAttached', {
      value: true,
      configurable: false,
    })
  } catch (err) {
    if (!formatError(err).includes('instance is not created yet')) {
      console.warn('[CAD Viewer] Failed to attach default guards:', err)
    }
  }
}

const configureViewer = () => {
  disableOsnap()
  ensureWritableDefaults()
}

const onOpenProgress = (progress) => {
  lastOpenProgress.value = progress
}

const onFailedToOpenFile = ({ fileName }) => {
  failedFileName.value = fileName || ''
  const err = window.__cadDemoLastOpenError
  lastCadOpenError.value = err || null
  showError(formatError(err) || 'Failed to open CAD file.', err)
}

const onViewerMessage = ({ message, type }) => {
  if (type === 'error') {
    lastViewerMessage.value = message || ''
  }
}

const onWindowError = (event) => {
  const err = event.error || event.message
  showError(formatError(err) || 'Unhandled browser error.', err)
}

const onUnhandledRejection = (event) => {
  const err = event.reason
  showError(formatError(err) || 'Unhandled promise rejection.', err)
}

patchCadOpenErrors()
patchOsnapResolver()
configureViewer()

onMounted(() => {
  configureViewer()
  eventBus.on('open-file-progress', onOpenProgress)
  eventBus.on('failed-to-open-file', onFailedToOpenFile)
  eventBus.on('message', onViewerMessage)
  window.addEventListener('error', onWindowError)
  window.addEventListener('unhandledrejection', onUnhandledRejection)
})

onUnmounted(() => {
  eventBus.off('open-file-progress', onOpenProgress)
  eventBus.off('failed-to-open-file', onFailedToOpenFile)
  eventBus.off('message', onViewerMessage)
  window.removeEventListener('error', onWindowError)
  window.removeEventListener('unhandledrejection', onUnhandledRejection)
})

onErrorCaptured((err, instance, info) => {
  showError(formatError(err), err)
  console.error('[CAD Viewer Error]', err, info)
  return false
})
</script>

<template>
  <div style="width:100vw; height:100vh; background:#1a1a2e; position:relative;">
    <div
      v-if="errorMsg"
      style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
             max-width:720px; width:90%; padding:24px; z-index:99999;
             background:#2a1a1a; border:1px solid #f56c6c; border-radius:8px;
             color:#f56c6c; font-size:14px; white-space:pre-wrap; word-break:break-all;"
    >
      <div style="font-size:16px; font-weight:bold; margin-bottom:12px;">CAD Viewer Error</div>
      <div style="margin-bottom:12px;">{{ errorMsg }}</div>
      <div style="font-size:12px; color:#aaa; max-height:300px; overflow:auto;">{{ errorStack }}</div>
      <button
        @click="clearError"
        style="margin-top:12px; padding:6px 16px; border:1px solid #f56c6c;
               border-radius:4px; background:transparent; color:#f56c6c; cursor:pointer;"
      >
        关闭
      </button>
    </div>

    <button
      @click="toggleLocale"
      style="position:absolute; top:12px; right:12px; z-index:9999;
             padding:8px 16px; border:1px solid #409eff; border-radius:4px;
             background:#1a1a2e; color:#409eff; cursor:pointer; font-size:14px;"
    >
      {{ locale === 'zh' ? '中文' : 'EN' }}
    </button>

    <MlCadViewer
      :locale="locale"
      :background="0x1a1a2e"
      :mode="AcEdOpenMode.Write"
      theme="dark"
      base-url="/cad-data/"
      @create="configureViewer"
    />
  </div>
</template>