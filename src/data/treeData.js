/**
 * 工程树数据 —— 按角色裁剪可见节点
 * - 节点 roles 字段：哪些角色可见该节点（不标则全可见）
 * - buildTreeForRole(role): 递归过滤，folder 过滤后无子节点则隐藏
 * type 决定双击打开的页签类型：borehole/table/stratum/section/scene/cad/ibgi
 */
const R = ['leader', 'engineer', 'surveyor', 'pipeline']

export const treeData = [
  {
    id: 'prj', name: '勘察工程 · 山区复杂地质建模', type: 'folder', children: [
      {
        id: 'bh', name: '钻孔数据', type: 'folder', children: [
          { id: 'zk01', name: 'ZK-01', type: 'borehole', meta: '孔深 28.5m', roles: R },
          { id: 'zk02', name: 'ZK-02', type: 'borehole', meta: '孔深 31.2m', roles: R },
          { id: 'zk03', name: 'ZK-03', type: 'borehole', meta: '孔深 25.0m', roles: ['leader', 'engineer', 'surveyor'] },
          { id: 'zk04', name: 'ZK-04', type: 'borehole', meta: '孔深 33.6m', roles: ['leader', 'engineer', 'surveyor'] },
          { id: 'tbl1', name: '钻孔总表', type: 'table', meta: '报表', roles: R },
        ],
      },
      {
        id: 'str', name: '地层模型', type: 'folder', children: [
          { id: 'l1', name: '① 素填土', type: 'stratum', meta: '0.0–1.2m' },
          { id: 'l2', name: '② 粉质粘土', type: 'stratum', meta: '1.2–6.5m' },
          { id: 'l3', name: '③ 中砂', type: 'stratum', meta: '6.5–12.0m' },
          { id: 'l4', name: '④ 圆砾', type: 'stratum', meta: '12.0–18.5m' },
          { id: 'l5', name: '⑤ 强风化泥岩', type: 'stratum', meta: '18.5–24.0m' },
          { id: 'l6', name: '⑥ 中风化泥岩', type: 'stratum', meta: '24.0m↓' },
        ],
      },
      {
        id: 'sec', name: '剖面图', type: 'folder', children: [
          { id: 'aa', name: "A-A' 工程地质剖面", type: 'section', meta: '4 钻孔' },
          { id: 'bb', name: "B-B' 工程地质剖面", type: 'section', meta: '3 钻孔' },
        ],
      },
      {
        id: 'scene', name: '三维场景', type: 'folder', children: [
          { id: 'cad3d', name: '三维地质建模视图', type: 'cad', meta: 'CAD', roles: R },
          { id: 's1', name: '场景一 · 场区整体', type: 'scene', meta: '等轴测', roles: R },
        ],
      },
      {
        id: 'survey', name: '测量控制', type: 'folder', roles: ['leader', 'engineer', 'surveyor'], children: [
          { id: 'cp1', name: '控制点 K1~K5', type: 'scene', meta: '坐标', roles: ['leader', 'engineer', 'surveyor'] },
          { id: 'lp1', name: '放线点总表', type: 'table', meta: '测量', roles: ['leader', 'engineer', 'surveyor'] },
        ],
      },
      {
        id: 'field', name: '外业资料', type: 'folder', roles: ['leader', 'engineer', 'pipeline'], children: [
          { id: 'fd1', name: '管线探测记录', type: 'table', meta: '外业', roles: ['leader', 'engineer', 'pipeline'] },
          { id: 'fd2', name: '现场照片册', type: 'scene', meta: '影像', roles: ['leader', 'engineer', 'pipeline'] },
        ],
      },
      {
        id: 'result', name: '成果文档', type: 'folder', roles: R, children: [
          { id: 'rs1', name: '勘察报告', type: 'table', meta: 'DOCX', roles: R },
          { id: 'rs2', name: '自动审核报告〔专题2〕', type: 'table', meta: 'PDF', roles: ['leader', 'reviewer', 'approver'] },
          { id: 'rs3', name: '三维地质模型', type: 'cad', meta: 's3mb', roles: R },
        ],
      },
      {
        id: 'ext', name: '外部对接', type: 'folder', roles: R, children: [
          { id: 'ibgi', name: 'i北勘项目工作台', type: 'ibgi', meta: '协同', roles: R },
        ],
      },
    ],
  },
]

/** 递归过滤：按角色裁剪树 */
function filterNode(node, role) {
  // 叶子节点：roles 不存在则全可见，存在则需包含该角色
  if (!node.children || node.children.length === 0) {
    if (!node.roles) return node
    return node.roles.includes(role) ? node : null
  }
  // folder：roles 存在且不含该角色 → 整个 folder 隐藏
  if (node.roles && !node.roles.includes(role)) return null
  const kids = node.children
    .map((c) => filterNode(c, role))
    .filter(Boolean)
  if (kids.length === 0) return null
  return { ...node, children: kids }
}

/** 按角色构建工程树 */
export function buildTreeForRole(role) {
  return treeData
    .map((n) => filterNode(n, role))
    .filter(Boolean)
}

/** 地层配色（地质惯例，与 CSS 变量一致） */
export const strataColors = [
  { name: '素填土', color: '#8b6f4e' },
  { name: '粉质粘土', color: '#c9a96e' },
  { name: '中砂', color: '#e6cf86' },
  { name: '圆砾', color: '#a98c66' },
  { name: '强风化泥岩', color: '#6a6a6a' },
  { name: '中风化泥岩', color: '#48484a' },
]

/** 钻孔总表 mock */
export const boreholeTable = [
  { code: 'ZK-01', x: 31456.21, y: 45218.77, elev: 156.32, depth: 28.5, gw: 4.2, strata: 6 },
  { code: 'ZK-02', x: 31478.05, y: 45245.10, elev: 157.01, depth: 31.2, gw: 3.8, strata: 6 },
  { code: 'ZK-03', x: 31502.44, y: 45230.66, elev: 155.88, depth: 25.0, gw: 4.5, strata: 5 },
  { code: 'ZK-04', x: 31525.90, y: 45260.33, elev: 156.74, depth: 33.6, gw: 3.5, strata: 6 },
]

/** 钻孔柱状图分层 mock（ZK-01） */
export const boreholeLayers = [
  { name: '素填土', top: 0.0, bottom: 1.2, color: '#8b6f4e' },
  { name: '粉质粘土', top: 1.2, bottom: 6.5, color: '#c9a96e' },
  { name: '中砂', top: 6.5, bottom: 12.0, color: '#e6cf86' },
  { name: '圆砾', top: 12.0, bottom: 18.5, color: '#a98c66' },
  { name: '强风化泥岩', top: 18.5, bottom: 24.0, color: '#6a6a6a' },
  { name: '中风化泥岩', top: 24.0, bottom: 28.5, color: '#48484a' },
]

export const waterLevel = 4.2
