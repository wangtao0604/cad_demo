<script setup>
import { ref, computed, onErrorCaptured, onMounted, onUnmounted } from 'vue'
import { MlCadViewer } from '@mlightcad/cad-viewer'
import {
  AcApDocManager,
  AcApSettingManager,
  AcEdCommand,
  AcEdOpenMode,
  AcEdOsnapResolver,
  AcEdPromptPointOptions,
  AcEdPromptStatus,
  AcTrView2d,
  eventBus,
} from '@mlightcad/cad-simple-viewer'
import {
  AcCmColor,
  AcDbBlockReference,
  AcDbBlockTableRecord,
  AcDbCircle,
  AcDbDatabase,
  AcDbLayerTableRecord,
  AcDbLine,
  AcDbText,
  AcDbTextHorizontalMode,
  AcDbTextVerticalMode,
  AcGePoint3d,
} from '@mlightcad/data-model'

const locale = ref('zh')
const errorMsg = ref('')
const errorStack = ref('')
const failedFileName = ref('')
const lastOpenProgress = ref(null)
const lastCadOpenError = ref(null)
const lastViewerMessage = ref('')
const boreholeDialogVisible = ref(false)
const boreholePrefix = ref('ZK')
const boreholeStartNo = ref(1)
const boreholeDepth = ref(20)
const activeBoreholeOptions = ref({
  prefix: 'ZK',
  startNo: 1,
  depth: 20,
})

const BOREHOLE_COMMAND_NAME = 'GEO_BOREHOLE'
const BOREHOLE_LAYER = 'GEO_BOREHOLE'
const BOREHOLE_TEXT_LAYER = 'GEO_BOREHOLE_TEXT'
const BOREHOLE_SYMBOL_COLOR = 0xf7d154
const BOREHOLE_TEXT_COLOR = 0x66d9ef
const manualViewEntityStates = new WeakMap()

const asEntityList = (entity) => (Array.isArray(entity) ? entity : [entity]).filter(Boolean)

const hasEntityObjectId = (entity) => (
  entity?.objectId !== undefined && entity?.objectId !== null && entity?.objectId !== ''
)

const getManualViewEntityState = (view) => {
  let state = manualViewEntityStates.get(view)
  if (!state) {
    state = {
      pending: new Set(),
      canceled: new Set(),
    }
    manualViewEntityStates.set(view, state)
  }
  return state
}

const deleteManualViewEntityStateIfEmpty = (view, state) => {
  if (state.pending.size === 0 && state.canceled.size === 0) {
    manualViewEntityStates.delete(view)
  }
}

const patchManualViewEntityGuards = () => {
  const proto = AcTrView2d?.prototype
  if (!proto || proto.__cadDemoManualViewEntityGuardsPatched) return

  const originalHasEntity = proto.hasEntity
  const originalRemoveEntity = proto.removeEntity
  const originalBatchConvert = proto.batchConvert
  const originalClear = proto.clear

  proto.hasEntity = function patchedHasEntity(objectId) {
    const state = manualViewEntityStates.get(this)
    return state?.pending.has(objectId) || originalHasEntity.call(this, objectId)
  }

  proto.removeEntity = function patchedRemoveEntity(entity) {
    const state = manualViewEntityStates.get(this)
    if (state) {
      for (const item of asEntityList(entity)) {
        if (!hasEntityObjectId(item)) continue
        const objectId = item.objectId
        if (state.pending.has(objectId)) {
          state.canceled.add(objectId)
        }
        state.pending.delete(objectId)
      }
      deleteManualViewEntityStateIfEmpty(this, state)
    }
    return originalRemoveEntity.call(this, entity)
  }

  proto.batchConvert = async function patchedBatchConvert(entities, ...args) {
    const entityList = asEntityList(entities)
    try {
      return await originalBatchConvert.call(this, entities, ...args)
    } finally {
      const state = manualViewEntityStates.get(this)
      if (state) {
        const canceledEntities = []
        for (const item of entityList) {
          if (!hasEntityObjectId(item)) continue
          const objectId = item.objectId
          if (state.canceled.has(objectId)) {
            canceledEntities.push(item)
          }
          state.pending.delete(objectId)
          state.canceled.delete(objectId)
        }

        if (canceledEntities.length > 0) {
          originalRemoveEntity.call(this, canceledEntities.length === 1 ? canceledEntities[0] : canceledEntities)
        }
        deleteManualViewEntityStateIfEmpty(this, state)
      }
    }
  }

  proto.clear = function patchedClear(...args) {
    manualViewEntityStates.delete(this)
    return originalClear.apply(this, args)
  }

  Object.defineProperty(proto, '__cadDemoManualViewEntityGuardsPatched', {
    value: true,
    configurable: false,
  })
}

const addManualViewEntity = (view, entity) => {
  if (hasEntityObjectId(entity)) {
    const state = getManualViewEntityState(view)
    state.pending.add(entity.objectId)
    state.canceled.delete(entity.objectId)
  }
  view.addEntity(entity)
}

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

const showBoreholeDialog = () => {
  configureViewer()
  boreholeDialogVisible.value = true
}

const closeBoreholeDialog = () => {
  boreholeDialogVisible.value = false
}

const toPositiveNumber = (value, fallback) => {
  const number = Number(value)
  return Number.isFinite(number) && number > 0 ? number : fallback
}

const getBoreholeOptions = () => ({
  prefix: (boreholePrefix.value || 'ZK').trim() || 'ZK',
  startNo: Math.max(1, Math.floor(toPositiveNumber(boreholeStartNo.value, 1))),
  depth: toPositiveNumber(boreholeDepth.value, 20),
})

const startBoreholePlacement = () => {
  activeBoreholeOptions.value = getBoreholeOptions()
  boreholeStartNo.value = activeBoreholeOptions.value.startNo
  boreholeDepth.value = activeBoreholeOptions.value.depth
  boreholeDialogVisible.value = false

  try {
    configureViewer()
    AcApDocManager.instance.sendStringToExecute(BOREHOLE_COMMAND_NAME)
  } catch (err) {
    showError(formatError(err) || 'Failed to start borehole placement.', err)
  }
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

const isIgnorableBrowserError = (value) => (
  /ResizeObserver loop (completed with undelivered notifications|limit exceeded)/i.test(formatError(value))
)

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
    'DWG 鐟欙絾鐎芥径杈Е閿涙艾缍嬮崜?LibreDWG WebAssembly 鐟欙絾鐎介崳銊﹀ⅵ娑撳秴绱戞潻娆庨嚋 DWG閿涘苯澧犵粩顖涚梾閺堝瀣侀崚鏉垮讲濞撳弶鐓嬮惃鍕禈閸忓啯鏆熼幑顔衡偓?,
    `閸樼喎顫愰柨娆掝嚖閿?{message}`,
    '',
    '婢跺嫮鎮婂楦款唴閿?,
    '1. 閻?AutoCAD / ODA / 閸忔湹绮?CAD 鏉烆垯娆㈤幎濠傛禈缁剧褰熺€涙ü璐?DXF 閸氬骸鍟€閹垫挸绱戦妴?,
    '2. 閹存牕褰熺€涙ü璐熸潏鍐х秵閻楀牊婀?DWG閿涘牅绶ユ俊?2013/2010閿涘绱濋崗?PURGE/濞撳懐鎮婇崶鍓х剨閸愬秷鐦妴?,
    '3. 婵″倹鐏夎箛鍛淬€忛惄瀛樺复閹垫挸绱戞潻娆庨嚋 DWG閿涘矂娓剁憰浣瑰复閸?native/閺堝秴濮熺粩?ODA 鏉烆剚宕查敍灞剧セ鐟欏牆娅掗柌宀€娈戞潻娆庨嚋 WASM worker 娑撳秷鍏橀崣顖炴浆鐟欙綀绻栨稉顏呮瀮娴犺翰鈧?,
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

const ensureWritableDefaults = () => {
  try {
    const manager = AcApDocManager.instance
    const db = manager.curDocument?.database
    db?.ensureDatabaseDefaults?.()
    if (db && !db.tables.layerTable.getAt(db.clayer)) {
      db.clayer = '0'
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

const cadColor = (rgb) => new AcCmColor().setRGBValue(rgb)

const ensureBoreholeLayer = (context, name, rgb) => {
  const db = context.doc.database
  const layerTable = db.tables.layerTable
  let layer = layerTable.getAt(name)
  if (layer) {
    context.view.addLayer(layer)
    return layer
  }

  layer = new AcDbLayerTableRecord({
    name,
    color: cadColor(rgb),
    isOff: false,
    isPlottable: true,
  })
  layerTable.add(layer)
  context.view.addLayer(layer)
  return layer
}

const pointAt = (point, dx = 0, dy = 0, dz = 0) => (
  new AcGePoint3d(point.x + dx, point.y + dy, (point.z || 0) + dz)
)

const styleEntity = (entity, layerName, rgb) => {
  entity.layer = layerName
  entity.color = cadColor(rgb)
  return entity
}

const getBoreholeSymbolMetrics = (db) => {
  const extmin = db.extmin
  const extmax = db.extmax
  const width = Math.abs((extmax?.x || 0) - (extmin?.x || 0))
  const height = Math.abs((extmax?.y || 0) - (extmin?.y || 0))
  const span = Math.max(width, height)
  const radius = Number.isFinite(span) && span > 0
    ? Math.min(Math.max(span * 0.003, 1), 2000)
    : 100

  return {
    radius,
    textHeight: radius * 1.15,
    textOffsetX: radius * 1.65,
    labelOffsetY: radius * 0.45,
    depthOffsetY: -radius * 1.05,
  }
}

const formatDepth = (depth) => {
  const number = Number(depth)
  if (!Number.isFinite(number)) return '20'
  return Number.isInteger(number) ? String(number) : number.toFixed(1)
}

const createBoreholeText = (text, position, height) => {
  const entity = new AcDbText()
  entity.textString = text
  entity.position = position
  entity.alignmentPoint = position
  entity.height = height
  entity.horizontalMode = AcDbTextHorizontalMode.LEFT
  entity.verticalMode = AcDbTextVerticalMode.MIDDLE
  return styleEntity(entity, BOREHOLE_TEXT_LAYER, BOREHOLE_TEXT_COLOR)
}

const createBoreholeEntities = (point, code, depth, metrics) => {
  const center = new AcGePoint3d(point)
  const { radius, textHeight, textOffsetX, labelOffsetY, depthOffsetY } = metrics
  const entities = [
    styleEntity(new AcDbCircle(center, radius), BOREHOLE_LAYER, BOREHOLE_SYMBOL_COLOR),
    styleEntity(new AcDbLine(pointAt(center, -radius, 0), pointAt(center, radius, 0)), BOREHOLE_LAYER, BOREHOLE_SYMBOL_COLOR),
    styleEntity(new AcDbLine(pointAt(center, 0, -radius), pointAt(center, 0, radius)), BOREHOLE_LAYER, BOREHOLE_SYMBOL_COLOR),
    createBoreholeText(code, pointAt(center, textOffsetX, labelOffsetY), textHeight),
    createBoreholeText(`${formatDepth(depth)}m`, pointAt(center, textOffsetX, depthOffsetY), textHeight * 0.82),
  ]

  return entities
}

const getAvailableBoreholeBlockName = (db, code) => {
  const safeCode = String(code).replace(/[^A-Za-z0-9_-]/g, '_') || 'POINT'
  let index = 1
  let name = `GEO_BH_${safeCode}`

  while (db.tables.blockTable.getAt(name)) {
    index += 1
    name = `GEO_BH_${safeCode}_${index}`
  }

  return name
}

const createBoreholeBlockReference = (db, point, code, depth, metrics) => {
  const blockName = getAvailableBoreholeBlockName(db, code)
  const blockRecord = new AcDbBlockTableRecord({
    name: blockName,
    origin: new AcGePoint3d(0, 0, 0),
  })

  db.tables.blockTable.add(blockRecord)
  blockRecord.appendEntity(createBoreholeEntities(new AcGePoint3d(0, 0, 0), code, depth, metrics))

  const blockRef = new AcDbBlockReference(blockName)
  blockRef.position = new AcGePoint3d(point)
  return styleEntity(blockRef, BOREHOLE_LAYER, BOREHOLE_SYMBOL_COLOR)
}

class PlaceBoreholeCommand extends AcEdCommand {
  constructor(optionsProvider, finishHandler) {
    super()
    this.mode = AcEdOpenMode.Write
    this.optionsProvider = optionsProvider
    this.finishHandler = finishHandler
  }

  async execute(context) {
    const db = context.doc.database
    const options = this.optionsProvider()
    const metrics = getBoreholeSymbolMetrics(db)
    let nextNo = options.startNo

    ensureBoreholeLayer(context, BOREHOLE_LAYER, BOREHOLE_SYMBOL_COLOR)
    ensureBoreholeLayer(context, BOREHOLE_TEXT_LAYER, BOREHOLE_TEXT_COLOR)

    try {
      while (true) {
        const prompt = new AcEdPromptPointOptions('閹稿洤鐣鹃崟妯诲赴閻愰€涚秴缂?<閸ョ偠婧呯紒鎾存将>')
        prompt.allowNone = true
        prompt.disableOSnap = true
        const result = await AcApDocManager.instance.editor.getPoint(prompt)

        if (result.status !== AcEdPromptStatus.OK || !result.value) break

        const code = `${options.prefix}${nextNo}`
        const blockRef = createBoreholeBlockReference(db, result.value, code, options.depth, metrics)
        db.tables.blockTable.modelSpace.appendEntity(blockRef)
        addManualViewEntity(context.view, blockRef)
        nextNo += 1
      }
    } finally {
      this.finishHandler(nextNo)
    }
  }
}

const registerBoreholeCommand = () => {
  try {
    const manager = AcApDocManager.instance
    if (manager.commandManager.lookupGlobalCmd(BOREHOLE_COMMAND_NAME)) return

    manager.commandManager.addCommand(
      'USER',
      BOREHOLE_COMMAND_NAME,
      '鐢啰鐤嗛崟妯诲赴閻?,
      new PlaceBoreholeCommand(
        () => activeBoreholeOptions.value,
        (nextNo) => {
          if (Number.isFinite(nextNo) && nextNo > 0) {
            boreholeStartNo.value = nextNo
          }
        },
      ),
      ['BHOLE', 'KT'],
    )
  } catch (err) {
    if (!formatError(err).includes('instance is not created yet')) {
      console.warn('[CAD Viewer] Failed to register borehole command:', err)
    }
  }
}
const configureViewer = () => {
  AcApSettingManager.instance.isShowCommandLine = true
  disableOsnap()
  patchManualViewEntityGuards()
  ensureWritableDefaults()
  attachDocManagerDefaultGuards()
  registerBoreholeCommand()
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
  if (isIgnorableBrowserError(err) || isIgnorableBrowserError(event.message)) {
    event.preventDefault?.()
    return
  }
  showError(formatError(err) || 'Unhandled browser error.', err)
}

const onUnhandledRejection = (event) => {
  const err = event.reason
  if (isIgnorableBrowserError(err)) {
    event.preventDefault?.()
    return
  }
  showError(formatError(err) || 'Unhandled promise rejection.', err)
}

patchCadOpenErrors()
patchOsnapResolver()
patchEntityAppendDefaults()
patchCommandDefaults()
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
  if (isIgnorableBrowserError(err)) return false
  showError(formatError(err), err)
  console.error('[CAD Viewer Error]', err, info)
  return false
})
</script>

<template>
  <div style="width:100vw; height:100vh; background:#1a1a2e; position:relative;">
    <div
      style="position:absolute; top:12px; left:12px; z-index:9999;
             display:flex; align-items:center; gap:8px; padding:8px;
             background:rgba(18, 24, 38, 0.92); border:1px solid rgba(102, 217, 239, 0.45);
             border-radius:6px; box-shadow:0 8px 24px rgba(0,0,0,0.28);"
    >
      <span style="color:#d7e3f4; font-size:13px; padding:0 4px;">閸曟ɑ甯?/span>
      <button
        @click="showBoreholeDialog"
        style="padding:7px 12px; border:1px solid #66d9ef; border-radius:4px;
               background:#18283b; color:#66d9ef; cursor:pointer; font-size:14px;"
      >
        鐢啰鐤嗛崟妯诲赴閻?      </button>
    </div>

    <div
      v-if="boreholeDialogVisible"
      @click.self="closeBoreholeDialog"
      style="position:absolute; inset:0; z-index:10000; background:rgba(0,0,0,0.36);
             display:flex; align-items:center; justify-content:center;"
    >
      <div
        @keydown.stop
        style="width:min(360px, calc(100vw - 32px)); padding:18px;
               background:#111827; border:1px solid rgba(102, 217, 239, 0.55);
               border-radius:8px; box-shadow:0 18px 48px rgba(0,0,0,0.45); color:#e5edf7;"
      >
        <div style="font-size:16px; font-weight:600; margin-bottom:14px;">鐢啰鐤嗛崟妯诲赴閻?/div>
        <label style="display:block; font-size:13px; margin-bottom:10px;">
          <span style="display:block; margin-bottom:6px; color:#aab8c8;">缂傛牕褰块崜宥囩磻</span>
          <input
            v-model="boreholePrefix"
            style="width:100%; box-sizing:border-box; padding:8px 10px; border-radius:4px;
                   border:1px solid #334155; background:#0f172a; color:#e5edf7; outline:none;"
          />
        </label>
        <label style="display:block; font-size:13px; margin-bottom:10px;">
          <span style="display:block; margin-bottom:6px; color:#aab8c8;">鐠у嘲顫愭惔蹇撳娇</span>
          <input
            v-model.number="boreholeStartNo"
            type="number"
            min="1"
            step="1"
            style="width:100%; box-sizing:border-box; padding:8px 10px; border-radius:4px;
                   border:1px solid #334155; background:#0f172a; color:#e5edf7; outline:none;"
          />
        </label>
        <label style="display:block; font-size:13px; margin-bottom:16px;">
          <span style="display:block; margin-bottom:6px; color:#aab8c8;">濞ｅ崬瀹?m)</span>
          <input
            v-model.number="boreholeDepth"
            type="number"
            min="0.1"
            step="0.1"
            @keyup.enter="startBoreholePlacement"
            style="width:100%; box-sizing:border-box; padding:8px 10px; border-radius:4px;
                   border:1px solid #334155; background:#0f172a; color:#e5edf7; outline:none;"
          />
        </label>
        <div style="display:flex; justify-content:flex-end; gap:8px;">
          <button
            @click="closeBoreholeDialog"
            style="padding:7px 13px; border:1px solid #475569; border-radius:4px;
                   background:transparent; color:#cbd5e1; cursor:pointer;"
          >
            閸欐牗绉穃r
          </button>
          <button
            @click="startBoreholePlacement"
            style="padding:7px 13px; border:1px solid #66d9ef; border-radius:4px;
                   background:#0e7490; color:white; cursor:pointer;"
          >
            瀵偓婵绔风純?          </button>
        </div>
      </div>
    </div>
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
        閸忔娊妫碶r
      </button>
    </div>

    <button
      @click="toggleLocale"
      style="position:absolute; top:12px; right:12px; z-index:9999;
             padding:8px 16px; border:1px solid #409eff; border-radius:4px;
             background:#1a1a2e; color:#409eff; cursor:pointer; font-size:14px;"
    >
      {{ locale === 'zh' ? '娑擃厽鏋? : 'EN' }}
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
