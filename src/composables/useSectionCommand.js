import {
  AcApDocManager,
  AcEdCommand,
  AcEdOpenMode,
  AcEdPromptPointOptions,
  AcEdPromptStatus,
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
  AcGePoint3d,
} from '@mlightcad/data-model'

export const SECTION_LINE_COMMAND_NAME = 'GEO_SECTION_LINE'
const TEST_HOLE_LAYER = 'GEO_TEST_HOLE'
const SECTION_LINE_LAYER = 'GEO_SECTION_LINE'
let sectionFinishHandler = () => {}
let lastSectionHoles = []

const color = (rgb) => new AcCmColor().setRGBValue(rgb)

const ensureLayer = (context, name, rgb) => {
  const table = context.doc.database.tables.layerTable
  let layer = table.getAt(name)
  if (!layer) {
    layer = new AcDbLayerTableRecord({ name, color: color(rgb), isOff: false, isPlottable: true })
    table.add(layer)
  }
  context.view.addLayer(layer)
  return layer
}

const style = (entity, layer, rgb) => {
  entity.layer = layer
  entity.color = color(rgb)
  return entity
}

const appendAndDisplay = (context, entities) => {
  const modelSpace = context.doc.database.tables.blockTable.modelSpace
  entities.forEach((entity) => {
    modelSpace.appendEntity(entity)
    context.view.addEntity(entity)
  })
}

const makeText = (text, point, height) => {
  const entity = new AcDbText()
  entity.textString = text
  entity.position = point
  entity.alignmentPoint = point
  entity.height = height
  entity.horizontalMode = AcDbTextHorizontalMode.LEFT
  entity.verticalMode = AcDbTextVerticalMode.MIDDLE
  return style(entity, TEST_HOLE_LAYER, 0x66d9ef)
}

export const SECTION_TEST_HOLES = [
  { code: 'ZK1', x: 330, y: 190, elevation: 42.6, depth: 20 },
  { code: 'ZK2', x: 365, y: 80, elevation: 41.2, depth: 20 },
  { code: 'ZK3', x: 610, y: 175, elevation: 40.1, depth: 20 },
  { code: 'ZK4', x: 430, y: 405, elevation: 43.8, depth: 20 },
  { code: 'ZK5', x: 120, y: 365, elevation: 39.7, depth: 20 },
]

const distanceToSegment = (point, start, end) => {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  if (!lengthSquared) return Math.hypot(point.x - start.x, point.y - start.y)
  const ratio = Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared))
  return Math.hypot(point.x - (start.x + ratio * dx), point.y - (start.y + ratio * dy))
}

const holesAlongSection = (points) => {
  if (points.length < 2) return []
  return SECTION_TEST_HOLES
    .map((hole) => {
      let bestDistance = Infinity
      let order = Infinity
      let distanceBefore = 0
      for (let index = 1; index < points.length; index += 1) {
        const start = points[index - 1]
        const end = points[index]
        const distance = distanceToSegment(hole, start, end)
        if (distance < bestDistance) {
          bestDistance = distance
          const segmentLength = Math.hypot(end.x - start.x, end.y - start.y)
          const ratio = segmentLength
            ? Math.max(0, Math.min(1, ((hole.x - start.x) * (end.x - start.x) + (hole.y - start.y) * (end.y - start.y)) / (segmentLength * segmentLength)))
            : 0
          order = distanceBefore + ratio * segmentLength
        }
        distanceBefore += Math.hypot(end.x - start.x, end.y - start.y)
      }
      return { ...hole, distance: bestDistance, order }
    })
    .filter((hole) => hole.distance <= 24)
    .sort((a, b) => a.order - b.order)
    .map(({ distance, order, ...hole }) => hole)
}

export const addSectionTestHoles = () => {
  const manager = AcApDocManager.instance
  const context = manager.context
  if (!context?.doc?.database || context.doc.__sectionTestHolesAdded) return
  ensureLayer(context, TEST_HOLE_LAYER, 0x66d9ef)
  const radius = 13
  SECTION_TEST_HOLES.forEach((hole) => {
    const blockName = `GEO_SECTION_${hole.code}`
    let blockRecord = context.doc.database.tables.blockTable.getAt(blockName)
    if (!blockRecord) {
      blockRecord = new AcDbBlockTableRecord({ name: blockName, origin: new AcGePoint3d(0, 0, 0) })
      context.doc.database.tables.blockTable.add(blockRecord)
      blockRecord.appendEntity([
        style(new AcDbCircle(new AcGePoint3d(0, 0, 0), radius), TEST_HOLE_LAYER, 0xf7d154),
        style(new AcDbLine(new AcGePoint3d(-radius, 0, 0), new AcGePoint3d(radius, 0, 0)), TEST_HOLE_LAYER, 0xf7d154),
        style(new AcDbLine(new AcGePoint3d(0, -radius, 0), new AcGePoint3d(0, radius, 0)), TEST_HOLE_LAYER, 0xf7d154),
        makeText(hole.code, new AcGePoint3d(radius + 10, 7, 0), 11),
        makeText(`${hole.depth}m`, new AcGePoint3d(radius + 10, -8, 0), 9),
      ])
    }
    const blockReference = style(new AcDbBlockReference(blockName), TEST_HOLE_LAYER, 0xf7d154)
    blockReference.position = new AcGePoint3d(hole.x, hole.y, 0)
    appendAndDisplay(context, [blockReference])
  })
  context.doc.__sectionTestHolesAdded = true
  window.setTimeout(() => context.view.zoomToFitDrawing(), 120)
}

class DrawSectionLineCommand extends AcEdCommand {
  constructor() {
    super()
    this.mode = AcEdOpenMode.Write
  }

  async execute(context) {
    ensureLayer(context, SECTION_LINE_LAYER, 0xffcf4a)
    const points = []
    try {
      while (true) {
        const prompt = new AcEdPromptPointOptions(points.length ? '指定下一点 <完成>:' : '指定剖线起点:')
        prompt.allowNone = points.length > 1
        prompt.disableOSnap = false
        if (points.length) {
          prompt.basePoint = points[points.length - 1]
          prompt.useBasePoint = true
          prompt.useDashedLine = true
        }
        const result = await AcApDocManager.instance.editor.getPoint(prompt)
        if (result.status !== AcEdPromptStatus.OK || !result.value) break
        const point = new AcGePoint3d(result.value)
        if (points.length) {
          appendAndDisplay(context, [style(new AcDbLine(points[points.length - 1], point), SECTION_LINE_LAYER, 0xffcf4a)])
        }
        points.push(point)
      }
    } finally {
      lastSectionHoles = holesAlongSection(points)
      sectionFinishHandler({ pointCount: points.length, holeCount: lastSectionHoles.length })
    }
  }
}

export const configureSectionViewer = (onFinish) => {
  const manager = AcApDocManager.instance
  sectionFinishHandler = onFinish
  if (!manager.commandManager.lookupGlobalCmd(SECTION_LINE_COMMAND_NAME)) {
    manager.commandManager.addCommand(
      'USER', SECTION_LINE_COMMAND_NAME, '交互生成剖线',
      new DrawSectionLineCommand(), ['SECLINE'],
    )
  }
  window.setTimeout(addSectionTestHoles, 350)
}

export const startSectionLine = () => {
  AcApDocManager.instance.sendStringToExecute(SECTION_LINE_COMMAND_NAME)
}

export const generateCadSection = () => {
  if (lastSectionHoles.length < 2) return { ok: false, message: '剖线至少需要经过两个测试孔' }
  const context = AcApDocManager.instance.context
  ensureLayer(context, 'GEO_SECTION_RESULT', 0xffffff)
  const baseX = 900
  const baseY = 80
  const horizontalScale = 2.2
  const verticalScale = 5
  const layerRatios = [0.08, 0.25, 0.43, 0.62, 0.8, 1]
  const layerColors = [0x8b6f4e, 0xc9a96e, 0xe6cf86, 0xa98c66, 0x6a6a6a, 0x48484a]
  let runningDistance = 0
  const profileHoles = lastSectionHoles.map((hole, index) => {
    if (index) {
      const previous = lastSectionHoles[index - 1]
      runningDistance += Math.hypot(hole.x - previous.x, hole.y - previous.y)
    }
    return { ...hole, profileX: baseX + runningDistance * horizontalScale }
  })
  const entities = []
  const profilePoint = (hole, elevation) => new AcGePoint3d(hole.profileX, baseY + elevation * verticalScale, 0)
  for (let index = 1; index < profileHoles.length; index += 1) {
    const previous = profileHoles[index - 1]
    const current = profileHoles[index]
    entities.push(style(new AcDbLine(profilePoint(previous, previous.elevation), profilePoint(current, current.elevation)), 'GEO_SECTION_RESULT', 0xf7d154))
    layerRatios.forEach((ratio, layerIndex) => {
      const previousElevation = previous.elevation - previous.depth * ratio
      const currentElevation = current.elevation - current.depth * ratio
      entities.push(style(new AcDbLine(profilePoint(previous, previousElevation), profilePoint(current, currentElevation)), 'GEO_SECTION_RESULT', layerColors[layerIndex]))
    })
  }
  profileHoles.forEach((hole) => {
    entities.push(style(new AcDbLine(profilePoint(hole, hole.elevation), profilePoint(hole, hole.elevation - hole.depth)), 'GEO_SECTION_RESULT', 0xffffff))
    const label = makeText(`${hole.code}  H=${hole.elevation}m  D=${hole.depth}m`, profilePoint(hole, hole.elevation + 2.5), 8)
    label.layer = 'GEO_SECTION_RESULT'
    entities.push(label)
  })
  const title = makeText("A-A' 工程地质剖面", new AcGePoint3d(baseX, baseY + 250, 0), 12)
  title.layer = 'GEO_SECTION_RESULT'
  entities.push(title)
  appendAndDisplay(context, entities)
  window.setTimeout(() => context.view.zoomToFitDrawing(), 120)
  return { ok: true, holeCount: profileHoles.length }
}
