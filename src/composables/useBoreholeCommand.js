/**
 * 钻孔补孔命令 —— 从 App.borehole.backup.vue 迁移并修复中文乱码
 *
 * 在 CAD 可写视口中交互式放置钻孔符号：
 * 1. 注册 GEO_BOREHOLE 命令到命令管理器
 * 2. 触发后循环 editor.getPoint 拾取点
 * 3. 每个点创建钻孔块参照（圆 + 十字 + 编号 + 深度），appendEntity 到模型空间
 *
 * 用法：
 *   import { configureBoreholeViewer, startBoreholePlacement } from '@/composables/useBoreholeCommand'
 *   // viewer @create 时：
 *   configureBoreholeViewer(() => options.value, (nextNo) => { options.startNo = nextNo })
 *   // ribbon 补孔按钮 click：
 *   startBoreholePlacement()
 */
import {
  AcApDocManager,
  AcApSettingManager,
  AcEdCommand,
  AcEdOpenMode,
  AcEdOsnapResolver,
  AcEdPromptPointOptions,
  AcEdPromptStatus,
  AcTrView2d,
} from '@mlightcad/cad-simple-viewer'
import {
  AcCmColor,
  AcDbBlockReference,
  AcDbBlockTableRecord,
  AcDbCircle,
  AcDbLayerTableRecord,
  AcDbLine,
  AcDbText,
  AcDbTextHorizontalMode,
  AcDbTextVerticalMode,
  AcDbOsnapMode,
  AcGePoint3d,
  acdbOsnapModesToMask,
} from '@mlightcad/data-model'

// ===== 常量 =====
export const BOREHOLE_COMMAND_NAME = 'GEO_BOREHOLE'
const BOREHOLE_LAYER = 'GEO_BOREHOLE'
const BOREHOLE_TEXT_LAYER = 'GEO_BOREHOLE_TEXT'
const BOREHOLE_SYMBOL_COLOR = 0xf7d154 // 钻孔符号色（黄）
const BOREHOLE_TEXT_COLOR = 0x66d9ef   // 钻孔文字色（青）

const manualViewEntityStates = new WeakMap()

// ===== 工具函数 =====
const formatError = (err) => {
  if (!err) return ''
  if (typeof err === 'string') return err
  return err.message || String(err)
}

const cadColor = (rgb) => new AcCmColor().setRGBValue(rgb)

const asEntityList = (entity) => (Array.isArray(entity) ? entity : [entity]).filter(Boolean)

const hasEntityObjectId = (entity) => (
  entity?.objectId !== undefined && entity?.objectId !== null && entity?.objectId !== ''
)

const getManualViewEntityState = (view) => {
  let state = manualViewEntityStates.get(view)
  if (!state) {
    state = { pending: new Set(), canceled: new Set() }
    manualViewEntityStates.set(view, state)
  }
  return state
}

const deleteManualViewEntityStateIfEmpty = (view, state) => {
  if (state.pending.size === 0 && state.canceled.size === 0) {
    manualViewEntityStates.delete(view)
  }
}

const addManualViewEntity = (view, entity) => {
  if (hasEntityObjectId(entity)) {
    const state = getManualViewEntityState(view)
    state.pending.add(entity.objectId)
    state.canceled.delete(entity.objectId)
  }
  view.addEntity(entity)
}

// ===== 钻孔实体构造 =====
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

/** 根据图纸范围自适应钻孔符号尺寸 */
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

/** 钻孔符号 = 圆 + 横线 + 竖线 + 编号文字 + 深度文字 */
const createBoreholeEntities = (point, code, depth, metrics) => {
  const center = new AcGePoint3d(point)
  const { radius, textHeight, textOffsetX, labelOffsetY, depthOffsetY } = metrics
  return [
    styleEntity(new AcDbCircle(center, radius), BOREHOLE_LAYER, BOREHOLE_SYMBOL_COLOR),
    styleEntity(new AcDbLine(pointAt(center, -radius, 0), pointAt(center, radius, 0)), BOREHOLE_LAYER, BOREHOLE_SYMBOL_COLOR),
    styleEntity(new AcDbLine(pointAt(center, 0, -radius), pointAt(center, 0, radius)), BOREHOLE_LAYER, BOREHOLE_SYMBOL_COLOR),
    createBoreholeText(code, pointAt(center, textOffsetX, labelOffsetY), textHeight),
    createBoreholeText(`${formatDepth(depth)}m`, pointAt(center, textOffsetX, depthOffsetY), textHeight * 0.82),
  ]
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

/** 把钻孔符号封装成块定义 + 块参照，便于整体移动/删除 */
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

// ===== 补孔命令 =====
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
        const prompt = new AcEdPromptPointOptions('指定钻孔插入点 <取消>:')
        prompt.allowNone = true
        prompt.disableOSnap = false
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

const registerBoreholeCommand = (getOptions, onFinish) => {
  try {
    const manager = AcApDocManager.instance
    if (manager.commandManager.lookupGlobalCmd(BOREHOLE_COMMAND_NAME)) return

    manager.commandManager.addCommand(
      'USER',
      BOREHOLE_COMMAND_NAME,
      '放置钻孔',
      new PlaceBoreholeCommand(getOptions, onFinish),
      ['BHOLE', 'KT'],
    )
  } catch (err) {
    if (!formatError(err).includes('instance is not created yet')) {
      console.warn('[补孔] 注册命令失败:', err)
    }
  }
}

// ===== CAD 稳定性补丁（来自 backup，幂等）=====
const enableDefaultOsnap = () => {
  AcApSettingManager.instance.osnapModes = acdbOsnapModesToMask([
    AcDbOsnapMode.EndPoint,
    AcDbOsnapMode.MidPoint,
    AcDbOsnapMode.Center,
    AcDbOsnapMode.Quadrant,
    AcDbOsnapMode.Nearest,
  ])
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
        console.warn('[CAD] 跳过对象捕捉查找:', err)
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
        console.warn('[CAD] 跳过对象捕捉收集:', err)
        return []
      }
      throw err
    }
  }

  Object.defineProperty(proto, '__cadDemoOsnapPatched', { value: true, configurable: false })
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
      console.warn('[CAD] 写入默认值初始化失败:', err)
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
          console.warn('[CAD] 追加实体前初始化失败:', err)
        }
      }
    }
    return originalAppendEntity.apply(this, args)
  }

  Object.defineProperty(proto, '__cadDemoAppendDefaultsPatched', { value: true, configurable: false })
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

  Object.defineProperty(proto, '__cadDemoCommandDefaultsPatched', { value: true, configurable: false })
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

  Object.defineProperty(proto, '__cadDemoManualViewEntityGuardsPatched', { value: true, configurable: false })
}

const attachDocManagerDefaultGuards = () => {
  try {
    const manager = AcApDocManager.instance
    if (manager.__cadDemoDefaultGuardsAttached) return
    manager.events.documentCreated.addEventListener(ensureWritableDefaults)
    manager.events.documentActivated.addEventListener(ensureWritableDefaults)
    manager.editor.events.commandWillStart.addEventListener(ensureWritableDefaults)
    manager.editor.events.commandEnded.addEventListener(ensureWritableDefaults)
    Object.defineProperty(manager, '__cadDemoDefaultGuardsAttached', { value: true, configurable: false })
  } catch (err) {
    if (!formatError(err).includes('instance is not created yet')) {
      console.warn('[CAD] 文档管理器守卫挂载失败:', err)
    }
  }
}

// 模块加载时执行一次幂等补丁
patchOsnapResolver()
patchEntityAppendDefaults()
patchCommandDefaults()
patchManualViewEntityGuards()

// ===== 对外接口 =====

/**
 * 在 MlCadViewer @create 时调用：配置 viewer + 注册补孔命令
 * @param {() => {prefix:string, startNo:number, depth:number}} getOptions 返回当前补孔参数
 * @param {(nextNo:number) => void} onFinish 命令结束时回调（更新起始编号）
 */
export function configureBoreholeViewer(getOptions, onFinish) {
  try {
    AcApSettingManager.instance.isShowCommandLine = true
    enableDefaultOsnap()
    patchManualViewEntityGuards()
    ensureWritableDefaults()
    attachDocManagerDefaultGuards()
    registerBoreholeCommand(getOptions, onFinish)
  } catch (err) {
    console.warn('[补孔] viewer 配置失败:', err)
  }
}

/** 触发补孔命令（进入拾取点模式） */
export function startBoreholePlacement() {
  try {
    ensureWritableDefaults()
    AcApDocManager.instance.sendStringToExecute(BOREHOLE_COMMAND_NAME)
  } catch (err) {
    console.error('[补孔] 启动失败:', err)
  }
}
