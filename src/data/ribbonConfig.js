/**
 * Ribbon 工具栏 schema —— 按角色裁剪
 * - 全量页签：开始/钻孔/建模/剖面/三维/视图/测量/外业
 * - buildRibbonForRole(role): 返回该角色可见页签 + 是否只读
 *   · engineer  全功能可编辑
 *   · surveyor  测量版（开始/测量/视图）
 *   · pipeline  外业版（开始/外业/视图）
 *   · leader    只读全功能
 *   · reviewer/approver/marketing 轻量（开始/视图）
 * 补孔按钮 id = borehole-place（engineer 可用，leader 只读禁用）
 */
import {
  Document, Files, FolderOpened, Refresh, Setting, Download, Upload, Plus, Aim,
  Search, MagicStick, Box, Share, View, Camera, ZoomIn, ZoomOut, FullScreen,
  Grid, Pointer, EditPen, Tickets, Connection, DataAnalysis, Position, Operation,
  Rank, ScaleToOriginal, Crop, MapLocation, Histogram, Promotion, Tools,
} from '@element-plus/icons-vue'

/** 全量页签定义 */
const allTabs = [
  {
    id: 'home', title: '开始', groups: [
      { id: 'g-file', title: '文件', collections: [{ id: 'c-file', items: [
        { id: 'new', type: 'button', label: '新建', size: 'large', icon: Files, tooltip: '新建工程' },
        { id: 'open', type: 'button', label: '打开', size: 'small', icon: FolderOpened },
        { id: 'save', type: 'button', label: '保存', size: 'small', icon: Document },
      ] }] },
      { id: 'g-cad', title: 'CAD', collections: [{ id: 'c-cad', items: [
        { id: 'import-dwg', type: 'button', label: '导入DWG', size: 'small', icon: Upload },
        { id: 'export-dwg', type: 'button', label: '导出DWG', size: 'small', icon: Download },
        { id: 'print', type: 'button', label: '打印', size: 'small', icon: Document },
      ] }] },
      { id: 'g-edit', title: '编辑', collections: [{ id: 'c-edit', items: [
        { id: 'undo', type: 'button', label: '撤销', size: 'small', icon: Refresh },
        { id: 'redo', type: 'button', label: '重做', size: 'small', icon: Refresh },
        { id: 'settings', type: 'button', label: '选项', size: 'small', icon: Setting },
      ] }] },
    ],
  },
  {
    id: 'borehole', title: '钻孔', groups: [
      { id: 'g-place', title: '补孔', collections: [{ id: 'c-place', items: [
        { id: 'borehole-place', type: 'button', label: '补孔', size: 'large', icon: Aim, tooltip: '在 CAD 视口中交互放置钻孔符号' },
      ] }] },
      { id: 'g-bhdata', title: '钻孔数据', collections: [{ id: 'c-bhdata', items: [
        { id: 'bh-import', type: 'button', label: '导入钻孔', size: 'small', icon: Upload },
        { id: 'bh-export', type: 'button', label: '导出', size: 'small', icon: Download },
        { id: 'bh-query', type: 'button', label: '查询', size: 'small', icon: Search },
      ] }] },
      { id: 'g-bhview', title: '视图', collections: [{ id: 'c-bhview', items: [
        { id: 'bh-table', type: 'button', label: '钻孔总表', size: 'small', icon: Tickets },
        { id: 'bh-log', type: 'button', label: '柱状图', size: 'small', icon: DataAnalysis },
      ] }] },
    ],
  },
  {
    id: 'model', title: '建模', groups: [
      { id: 'g-gen', title: '地质建模', collections: [{ id: 'c-gen', items: [
        { id: 'gen-surface', type: 'button', label: '生成地层', size: 'large', icon: Box, tooltip: '根据钻孔生成地层曲面' },
        { id: 'gen-grid', type: 'button', label: '网格化', size: 'small', icon: Grid },
        { id: 'gen-tin', type: 'button', label: 'TIN曲面', size: 'small', icon: Connection },
      ] }] },
      { id: 'g-edit', title: '编辑', collections: [{ id: 'c-edit', items: [
        { id: 'mod-edit', type: 'button', label: '编辑地层', size: 'small', icon: EditPen },
        { id: 'mod-clip', type: 'button', label: '裁剪', size: 'small', icon: Crop },
        { id: 'mod-merge', type: 'button', label: '合并', size: 'small', icon: Operation },
      ] }] },
      { id: 'g-calc', title: '计算', collections: [{ id: 'c-calc', items: [
        { id: 'calc-vol', type: 'button', label: '方量', size: 'small', icon: DataAnalysis },
        { id: 'calc-area', type: 'button', label: '面积', size: 'small', icon: ScaleToOriginal },
      ] }] },
    ],
  },
  {
    id: 'section', title: '剖面', groups: [
      { id: 'g-sec-gen', title: '生成', collections: [{ id: 'c-sec', items: [
        { id: 'sec-draw', type: 'button', label: '绘制剖面线', size: 'large', icon: Share, tooltip: '在图上拾取剖面线生成剖面' },
        { id: 'sec-from-bh', type: 'button', label: '钻孔连线', size: 'small', icon: Connection },
      ] }] },
      { id: 'g-sec-edit', title: '编辑', collections: [{ id: 'c-sec-edit', items: [
        { id: 'sec-annotate', type: 'button', label: '标注', size: 'small', icon: EditPen },
        { id: 'sec-hatch', type: 'button', label: '填充', size: 'small', icon: Grid },
      ] }] },
    ],
  },
  {
    id: 'view3d', title: '三维', groups: [
      { id: 'g-scene', title: '场景', collections: [{ id: 'c-scene', items: [
        { id: 'open-cad', type: 'button', label: '三维建模视图', size: 'large', icon: View, tooltip: '打开 CAD 三维建模视口' },
        { id: 'snapshot', type: 'button', label: '快照', size: 'small', icon: Camera },
      ] }] },
      { id: 'g-3d-view', title: '视角', collections: [{ id: 'c-3d', items: [
        { id: 'iso', type: 'button', label: '等轴测', size: 'small', icon: Box },
        { id: 'top', type: 'button', label: '俯视', size: 'small', icon: Position },
        { id: 'front', type: 'button', label: '前视', size: 'small', icon: Position },
      ] }] },
    ],
  },
  {
    id: 'survey', title: '测量', groups: [
      { id: 'g-survey', title: '放线', collections: [{ id: 'c-survey', items: [
        { id: 'sv-layout', type: 'button', label: '放线', size: 'large', icon: Position, tooltip: '按设计坐标放样孔位' },
        { id: 'sv-ctrl', type: 'button', label: '控制点布设', size: 'small', icon: MapLocation },
        { id: 'sv-import', type: 'button', label: '坐标导入', size: 'small', icon: Upload },
      ] }] },
      { id: 'g-check', title: '复核', collections: [{ id: 'c-check', items: [
        { id: 'sv-recheck', type: 'button', label: '坐标复核', size: 'small', icon: Search },
        { id: 'sv-resurv', type: 'button', label: '复测', size: 'small', icon: Refresh },
      ] }] },
      { id: 'g-sv-view', title: '视图', collections: [{ id: 'c-svv', items: [
        { id: 'sv-points', type: 'button', label: '点位总表', size: 'small', icon: Tickets },
        { id: 'sv-plane', type: 'button', label: '平面图', size: 'small', icon: View },
      ] }] },
    ],
  },
  {
    id: 'field', title: '外业', groups: [
      { id: 'g-detect', title: '探测', collections: [{ id: 'c-detect', items: [
        { id: 'fd-pipe', type: 'button', label: '管线探测', size: 'large', icon: Aim, tooltip: '现场管线探测记录' },
        { id: 'fd-record', type: 'button', label: '记录录入', size: 'small', icon: EditPen },
      ] }] },
      { id: 'g-explore', title: '勘探', collections: [{ id: 'c-explore', items: [
        { id: 'fd-send', type: 'button', label: '勘探宝下发', size: 'small', icon: Promotion },
        { id: 'fd-bhlog', type: 'button', label: '钻孔记录', size: 'small', icon: Document },
      ] }] },
      { id: 'g-fdata', title: '资料', collections: [{ id: 'c-fdata', items: [
        { id: 'fd-files', type: 'button', label: '外业资料', size: 'small', icon: FolderOpened },
        { id: 'fd-photo', type: 'button', label: '现场照片', size: 'small', icon: Camera },
      ] }] },
    ],
  },
  {
    id: 'view', title: '视图', groups: [
      { id: 'g-zoom', title: '缩放', collections: [{ id: 'c-zoom', items: [
        { id: 'z-win', type: 'button', label: '窗口缩放', size: 'large', icon: ZoomIn },
        { id: 'z-all', type: 'button', label: '全景', size: 'small', icon: FullScreen },
        { id: 'z-real', type: 'button', label: '实时', size: 'small', icon: ZoomOut },
      ] }] },
      { id: 'g-pan', title: '平移', collections: [{ id: 'c-pan', items: [
        { id: 'pan', type: 'button', label: '平移', size: 'large', icon: Pointer },
      ] }] },
      { id: 'g-tool', title: '工具', collections: [{ id: 'c-tool', items: [
        { id: 'measure', type: 'button', label: '测量', size: 'small', icon: ScaleToOriginal },
        { id: 'annotate', type: 'button', label: '标注', size: 'small', icon: EditPen },
        { id: 'redraw', type: 'button', label: '重画', size: 'small', icon: Refresh },
      ] }] },
    ],
  },
]

/** 角色 → 可见页签 id */
const roleTabIds = {
  leader:    ['home', 'borehole', 'model', 'section', 'view3d', 'view'],
  engineer:  ['home', 'borehole', 'model', 'section', 'view3d', 'view'],
  surveyor:  ['home', 'survey', 'view'],
  pipeline:  ['home', 'field', 'view'],
  reviewer:  ['home', 'view'],
  approver:  ['home', 'view'],
  marketing: ['home', 'view'],
}

/** 只读角色（补孔等编辑按钮禁用） */
const readOnlyRoles = ['leader', 'reviewer', 'approver', 'marketing']

/** 深拷贝页签（避免裁剪时污染原数据） */
function cloneTab(tab) {
  return JSON.parse(JSON.stringify(tab, (k, v) => (v instanceof Function ? undefined : v)))
}

/**
 * 按角色构建 ribbon schema
 * @returns {{ tabs: Array, readOnly: boolean, defaultTab: string }}
 */
export function buildRibbonForRole(role) {
  const ids = roleTabIds[role] || roleTabIds.engineer
  const readOnly = readOnlyRoles.includes(role)
  const tabs = ids
    .map((id) => allTabs.find((t) => t.id === id))
    .filter(Boolean)
    .map(cloneTab)
  // 只读角色：禁用编辑类按钮
  if (readOnly) {
    const disabledIds = ['borehole-place', 'gen-surface', 'mod-edit', 'sec-draw', 'sv-layout', 'fd-pipe']
    const walk = (items) => items.forEach((it) => {
      if (disabledIds.includes(it.id)) it.disabled = true
      if (it.items) walk(it.items)
    })
    tabs.forEach((t) => t.groups.forEach((g) => g.collections.forEach((c) => walk(c.items))))
  }
  return { tabs, readOnly, defaultTab: ids[0] }
}

/** 文件菜单项 */
export const fileMenuItems = [
  { id: 'fm-new', label: '新建工程' },
  { id: 'fm-open', label: '打开工程' },
  { id: 'fm-save', label: '保存' },
  { id: 'fm-saveas', label: '另存为' },
  { id: 'fm-export', label: '导出', children: [
    { id: 'fm-export-dxf', label: '导出为 DXF' },
    { id: 'fm-export-pdf', label: '导出为 PDF' },
  ] },
]

/** 兼容旧引用（全量页签） */
export const ribbonTabs = allTabs
