/**
 * 勘察一体化平台 · 项目 mock 数据
 * - personas: 7 个角色（含默认导航/可见导航/界面形态/聚焦阶段）
 * - flowStages: 8 节点勘察主线（参考图1流程）
 * - stageAccess: 各阶段办理岗位（角色门禁）
 * - projects: 项目列表（userRoles 可覆盖演示账号在单个项目中的角色）
 * - todos / results: 按角色的待办与项目成果（含专题2自动审核报告）
 */

/** 角色配置 —— 决定进入项目后看到什么 */
export const personas = {
  leader:    { id:'leader',    name:'张明', title:'项目负责人', avatar:'张', defaultRole:'leader',    defaultNav:'overview', navs:['overview','info','files','quality','design','survey','recon','log','explore','soil','test','product','monitor','field','video','ibgi','map','result','todo'], mode:'cockpit',   focusStage:'s7', desc:'项目全貌 · 全流程进度与卡点' },
  engineer:  { id:'engineer',  name:'孙伟', title:'项目工程师', avatar:'孙', defaultRole:'engineer',  defaultNav:'stage',    navs:['overview','stage','files','quality','design','survey','recon','log','explore','soil','test','product','monitor','field','video','ibgi','map','result','todo'], mode:'workspace', focusStage:'s7', desc:'内业整理阶段 · 转接 CAG 系统' },
  reviewer:  { id:'reviewer',  name:'黄磊', title:'项目审核人', avatar:'黄', defaultRole:'reviewer',  defaultNav:'todo',     navs:['overview','files','quality','result','todo'],                  mode:'cockpit',   focusStage:'s8', desc:'流程待办 · 专题2 自动审核报告' },
  approver:  { id:'approver',  name:'陈总', title:'项目审定人', avatar:'陈', defaultRole:'approver',  defaultNav:'todo',     navs:['overview','files','quality','result','todo'],                  mode:'cockpit',   focusStage:'s8', desc:'流程待办 · 勘察报告终审定' },
  marketing: { id:'marketing', name:'李华', title:'营销经理',   avatar:'李', defaultRole:'marketing', defaultNav:'result',   navs:['overview','result','todo'],                                  mode:'cockpit',   focusStage:'s8', desc:'成果中心 · 经营关注事项' },
  surveyor:  { id:'surveyor',  name:'王强', title:'测量工程师', avatar:'王', defaultRole:'surveyor',  defaultNav:'survey',   navs:['overview','survey','recon','field','video','map','result','todo'], mode:'workspace', focusStage:'s4', desc:'测量放线 · 坐标复核' },
  pipeline:  { id:'pipeline',  name:'刘洋', title:'管线探测员', avatar:'刘', defaultRole:'pipeline',  defaultNav:'recon',    navs:['overview','recon','explore','soil','field','video','result','todo'], mode:'workspace', focusStage:'s3', desc:'现场辨识/野外勘探 · 探测成果' },
}

/** 角色下拉（登录页用） */
export const personaList = Object.values(personas)

/** 项目角色定义不包含人员姓名和头像，登录身份与项目权限分别使用。 */
export const roleDefinitions = Object.fromEntries(personaList.map(({
  id, title, defaultNav, navs, mode, focusStage, desc,
}) => [id, { id, title, defaultNav, navs, mode, focusStage, desc }]))

/** 6 节点勘察主线（去掉「启动」「水土试验」阶段） */
export const flowStages = [
  { id:'s2', name:'纲要策划', short:'纲要', icon:'Document' },
  { id:'s3', name:'现场辨识', short:'辨识', icon:'View' },
  { id:'s4', name:'测量放线', short:'放线', icon:'Position' },
  { id:'s5', name:'野外勘探', short:'勘探', icon:'Aim' },
  { id:'s7', name:'内业整理', short:'内业', icon:'EditPen', tool:'CAG' },
  { id:'s8', name:'产品交付', short:'交付', icon:'Promotion' },
]

/** 各阶段办理岗位（角色门禁）—— 非本阶段岗位进阶段办理会看到门禁 */
export const stageAccess = {
  s2: ['leader','engineer'],
  s3: ['leader'],
  s4: ['leader','surveyor'],
  s5: ['leader','pipeline'],
  s7: ['leader','engineer'],
  s8: ['leader','engineer','reviewer','approver','marketing'],
}

/** 阶段状态映射（mock：某项目各阶段完成情况） */
export const stageStatus = {
  s2: 'done', s3: 'done', s4: 'done', s5: 'done',
  s7: 'doing', s8: 'todo',
}

/** 项目列表 —— roles 为项目岗位；userRoles 为账号在该项目中的角色覆盖。 */
export const projects = [
  { id:'p1',  name:'山区复杂地质三维建模',   category:'市政勘察', stageId:'s7', status:'内业整理中', progress:72, city:'北京·门头沟', coords:{x:120,y:140}, roles:['leader','engineer','reviewer','approver','surveyor','pipeline'], members:28, deadline:'2026-09-30', desc:'山区复杂地质条件下三维地质建模与勘察一体化示范' },
  { id:'p2',  name:'地铁17号线岩土工程勘察',  category:'轨道交通', stageId:'s5', status:'野外勘探中', progress:45, city:'北京·朝阳',   coords:{x:300,y:90},  roles:['leader','engineer','surveyor'], userRoles:{ leader:'engineer' }, members:15, deadline:'2026-11-15', desc:'轨道交通沿线岩土工程详细勘察' },
  { id:'p3',  name:'CBD高层建筑地基勘察',     category:'建筑勘察', stageId:'s8', status:'待审定',     progress:90, city:'天津·滨海',   coords:{x:480,y:220}, roles:['leader','reviewer','approver','marketing'], userRoles:{ leader:'approver' }, members:10, deadline:'2026-08-20', desc:'超高层建筑地基勘察与基础方案论证' },
  { id:'p4',  name:'水库坝基工程地质勘察',     category:'水利勘察', stageId:'s2', status:'纲要策划中', progress:12, city:'河北·保定',   coords:{x:200,y:300}, roles:['leader','engineer'],                                         members:6,  deadline:'2027-03-01', desc:'水库坝基工程地质勘察前期' },
  { id:'p5',  name:'市政道路改扩建勘察',       category:'市政勘察', stageId:'s7', status:'内业整理中', progress:60, city:'北京·海淀',   coords:{x:360,y:260}, roles:['engineer','pipeline','surveyor'],                            members:12, deadline:'2026-10-10', desc:'城市主干路改扩建岩土工程勘察' },
  { id:'p6',  name:'跨河桥梁工程勘察',         category:'交通勘察', stageId:'s4', status:'测量放线中', progress:30, city:'北京·丰台',   coords:{x:90,y:260},  roles:['engineer','surveyor'],                                       members:8,  deadline:'2026-12-20', desc:'跨河特大桥岩土工程勘察' },
  { id:'p7',  name:'新城综合体地勘',           category:'建筑勘察', stageId:'s2', status:'纲要策划中', progress:5,  city:'北京·大兴',   coords:{x:420,y:120}, roles:['leader','engineer','marketing'],                             members:4,  deadline:'2027-05-01', desc:'新城综合体项目前期勘察策划' },
  { id:'p8',  name:'高速公路沿线地质调查',     category:'交通勘察', stageId:'s3', status:'现场辨识中', progress:20, city:'河北·廊坊',   coords:{x:150,y:200}, roles:['engineer','pipeline'],                                       members:7,  deadline:'2026-11-30', desc:'高速公路沿线地质灾害辨识与调查' },
  { id:'p9',  name:'综合管廊岩土勘察',         category:'市政勘察', stageId:'s7', status:'内业整理中', progress:68, city:'北京·通州',   coords:{x:260,y:170}, roles:['leader','engineer','reviewer'],                              members:11, deadline:'2026-10-25', desc:'城市综合管廊岩土工程勘察内业' },
  { id:'p10', name:'滨海新区基坑支护勘察',     category:'建筑勘察', stageId:'s8', status:'待交付',     progress:95, city:'天津·和平',   coords:{x:460,y:280}, roles:['leader','reviewer','approver','marketing'],                  members:9,  deadline:'2026-08-10', desc:'深基坑支护勘察成果交付' },
  { id:'p11', name:'引水隧洞工程勘察',         category:'水利勘察', stageId:'s2', status:'纲要策划中', progress:15, city:'河北·张家口', coords:{x:60,y:180},  roles:['leader','engineer','surveyor'],                              members:5,  deadline:'2027-04-15', desc:'长距离引水隧洞工程地质勘察策划' },
  { id:'p12', name:'轨道交通支线详勘',         category:'轨道交通', stageId:'s5', status:'野外勘探中', progress:40, city:'北京·顺义',   coords:{x:340,y:340}, roles:['engineer','surveyor','pipeline'],                            members:13, deadline:'2026-12-05', desc:'轨道交通支线岩土工程详细勘察' },
]

/** 工程类别（看板筛选用） */
export const categories = ['全部','市政勘察','轨道交通','建筑勘察','水利勘察','交通勘察']

/** 按角色的待办 */
export const todos = {
  leader: [
    { id:'l1', title:'ZK-03 钻孔进度滞后 2 天', stageId:'s5', priority:'高', type:'卡点' },
    { id:'l2', title:'水库项目勘察纲要待审批', stageId:'s2', priority:'中', type:'审批' },
    { id:'l3', title:'本周项目周报未提交', stageId:'s7', priority:'低', type:'报告' },
    { id:'l4', title:'CBD项目进入审定环节', stageId:'s8', priority:'高', type:'关注' },
  ],
  engineer: [
    { id:'e1', title:'内业整理：ZK-01~04 柱状图编制', stageId:'s7', priority:'高', type:'制图', action:'CAG' },
    { id:'e2', title:'地层模型三维复核', stageId:'s7', priority:'中', type:'建模', action:'s3mb' },
    { id:'e3', title:"A-A' 工程地质剖面更新", stageId:'s7', priority:'中', type:'制图' },
    { id:'e4', title:'钻孔总表数据核对', stageId:'s7', priority:'低', type:'数据' },
  ],
  reviewer: [
    { id:'r1', title:'自动审核报告待复核（专题2）', stageId:'s8', priority:'高', type:'审核', topic:'专题2' },
    { id:'r2', title:'勘察报告初稿审核', stageId:'s8', priority:'高', type:'审核' },
    { id:'r3', title:'地层划分合理性复核', stageId:'s7', priority:'中', type:'审核' },
  ],
  approver: [
    { id:'a1', title:'勘察报告终审定', stageId:'s8', priority:'高', type:'审定' },
    { id:'a2', title:'三维地质模型审定', stageId:'s8', priority:'中', type:'审定' },
  ],
  marketing: [
    { id:'m1', title:'CBD项目交付确认', stageId:'s8', priority:'中', type:'交付' },
    { id:'m2', title:'客户成果满意度回访', stageId:'s8', priority:'低', type:'经营' },
  ],
  surveyor: [
    { id:'w1', title:'ZK 新增孔位坐标复核', stageId:'s4', priority:'高', type:'复核' },
    { id:'w2', title:'场区控制点复测', stageId:'s4', priority:'中', type:'测量' },
    { id:'w3', title:'跨河桥桥位放线', stageId:'s4', priority:'高', type:'放线' },
  ],
  pipeline: [
    { id:'p1', title:'现场管线探测成果录入', stageId:'s3', priority:'高', type:'探测' },
    { id:'p2', title:'地下管线图编绘', stageId:'s5', priority:'中', type:'编绘' },
  ],
}

/** 项目成果（部分挂专题，受角色可见控制）—— 每个阶段的成果不同 */
export const results = [
  { id:'r1', name:'勘察报告（初稿）', type:'文档', stageId:'s8', format:'DOCX', icon:'Document' },
  { id:'r2', name:'三维地质模型', type:'模型', stageId:'s7', format:'s3mb', icon:'Box', viewer:'cad' },
  { id:'r15', name:'钻孔模型', type:'模型', stageId:'s7', format:'s3mb', icon:'Box', viewer:'cad' },
  { id:'r16', name:'综合分层模型', type:'模型', stageId:'s7', format:'s3mb', icon:'Box', viewer:'cad' },
  { id:'r3', name:'钻孔柱状图册', type:'图件', stageId:'s7', format:'PDF', icon:'Tickets', viewer:'log' },
  { id:'r4', name:"地质剖面图集", type:'图件', stageId:'s7', format:'PDF', icon:'Share', viewer:'section' },
  { id:'r17', name:'钻孔平面布置图', type:'图件', stageId:'s7', format:'DWG', icon:'Position', viewer:'cad' },
  { id:'r5', name:'自动审核报告〔专题2〕', type:'报告', stageId:'s8', format:'PDF', icon:'DataAnalysis', topic:'专题2', roles:['reviewer','approver','leader'] },
  { id:'r6', name:'勘探点平面布置图', type:'图件', stageId:'s5', format:'DWG', icon:'Position', viewer:'cad' },
  { id:'r7', name:'室内岩土试验汇总表', type:'表格', stageId:'s7', format:'XLSX', icon:'Grid' },
  // 补齐前期阶段成果（每阶段成果不同）
  { id:'r8',  name:'勘察任务书', type:'文档', stageId:'s2', format:'DOCX', icon:'Document' },
  { id:'r9',  name:'勘察纲要', type:'文档', stageId:'s2', format:'DOCX', icon:'Document' },
  { id:'r10', name:'勘探点布置图(初版)', type:'图件', stageId:'s2', format:'DWG', icon:'Position', viewer:'cad' },
  { id:'r11', name:'现场踏勘记录', type:'文档', stageId:'s3', format:'PDF', icon:'Document' },
  { id:'r12', name:'地下管线探测图', type:'图件', stageId:'s3', format:'DWG', icon:'Position', viewer:'cad' },
  { id:'r13', name:'测量放线成果表', type:'表格', stageId:'s4', format:'XLSX', icon:'Grid' },
  { id:'r14', name:'控制点成果表', type:'表格', stageId:'s4', format:'XLSX', icon:'Grid' },
]

/** 驾驶舱导航项定义 */
export const cockpitNavs = [
  { id:'overview', label:'项目驾驶舱', icon:'DataBoard', group:'项目管控' },
  { id:'info',     label:'工程信息', icon:'Document', group:'项目管控' },
  { id:'stage',    label:'勘察流程', icon:'Promotion', group:'项目管控' },
  { id:'files',    label:'过程文件', icon:'Folder', group:'项目管控' },
  { id:'quality',  label:'质量管控', icon:'CircleCheck', group:'项目管控' },

  { id:'design',   label:'设计管理', icon:'EditPen', group:'勘察作业' },
  { id:'survey',   label:'工程测量', icon:'MapLocation', group:'勘察作业' },
  { id:'recon',    label:'现场踏勘', icon:'View', group:'勘察作业' },
  { id:'log',      label:'地质编录', icon:'Notebook', group:'勘察作业' },
  { id:'explore',  label:'勘探管理', icon:'Aim', group:'勘察作业' },
  { id:'soil',     label:'地基勘察', icon:'Files', group:'勘察作业' },
  { id:'product',  label:'产品设计', icon:'Box', group:'勘察作业' },

  { id:'monitor',  label:'工程监测', icon:'TrendCharts', group:'监测协同' },
  { id:'field',    label:'现场监测', icon:'VideoCamera', group:'监测协同' },
  { id:'video',    label:'视频图文', icon:'Picture', group:'监测协同' },
  { id:'ibgi',     label:'协同平台', icon:'Link', group:'监测协同' },
  { id:'map',      label:'数据地图', icon:'Place', group:'监测协同' },

  { id:'result',   label:'成果中心', icon:'FolderOpened', group:'成果' },
  { id:'todo',     label:'流程待办', icon:'List', group:'成果' },
]

/** i北勘 深链基址（需与 i北勘 实际路由核对） */
export const IBGI_BASE = 'http://www.ibgi.cn/#/project'
/** i北勘 工程信息页（之前确认的真实地址） */
export const IBGI_ENG_INFO = 'http://www.ibgi.cn/#/project/projContent/engineering/subprojectSurvey/surEngInfo'

/**
 * 阶段功能区：每个阶段「自己的 Ribbon 菜单」
 * - 现在所有阶段业务功能均通过「外部程序」唤起（非纯 Web 端能完成），统一 type='external'
 * - 每个功能带 desc 描述，用于提示用户将唤起什么外部程序
 * - 前端自动追加「阶段待办」「成果展示」两个通用命令
 */
export const stageRibbons = {
  s2: { // 纲要策划
    funcs: [
      { id:'s2-plan',    label:'勘察纲要',   icon:'Document',     type:'external', desc:'勘察纲要策划（外部编辑器）' },
      { id:'s2-layout',  label:'勘探点布置', icon:'Position',     type:'external', desc:'外部 CAD 勘探点布置工具' },
      { id:'s2-addhole', label:'补孔',       icon:'Aim',          type:'external', desc:'补孔设计程序' },
    ],
  },
  s3: { // 现场辨识
    funcs: [
      { id:'s3-recon', label:'辨识（i北勘）', icon:'View', type:'external', desc:'i北勘现场辨识' },
      { id:'s3-pipe',  label:'管线探测', icon:'Position', type:'external', desc:'管线探测数据采集程序' },
    ],
  },
  s4: { // 测量放线
    funcs: [
      { id:'s4-survey', label:'放线（i北勘）', icon:'MapLocation', type:'external', desc:'i北勘测量放线' },
      { id:'s4-ctrl',   label:'控制点复测', icon:'Aim',         type:'external', desc:'控制点复测程序' },
    ],
  },
  s5: { // 野外勘探
    funcs: [
      { id:'s5-log',     label:'地质编录', icon:'Notebook', type:'external', desc:'地质编录程序' },
      { id:'s5-explore', label:'勘探（i北勘）', icon:'Aim', type:'external', desc:'i北勘野外勘探' },
    ],
  },
  s7: { // 内业整理
    funcs: [
      { id:'s7-layer', label:'自动分层', icon:'ScaleToOriginal', type:'external', desc:'自动分层（支持手动调整）' },
      { id:'s7-model', label:'三维建模', icon:'Box',             type:'external', desc:'三维地质建模程序' },
      { id:'s7-log',   label:'柱状图',   icon:'Tickets',         type:'external', desc:'柱状图出图程序' },
      { id:'s7-sec',   label:'剖面图',   icon:'Share',           type:'external', desc:'剖面图出图程序' },
      { id:'s7-table', label:'出表',     icon:'Grid',            type:'external', desc:'报表生成程序' },
    ],
  },
  s8: { // 产品交付
    funcs: [
      { id:'s8-report',   label:'智能报告',       icon:'Document',    type:'external', desc:'智能报告编制外部程序' },
      { id:'s8-review',   label:'智能审核',       icon:'CircleCheck', type:'external', desc:'智能审核外部程序' },
      { id:'s8-approval', label:'审批（i北勘）', icon:'Link',        type:'external', desc:'i北勘产品交付审批流程' },
    ],
  },
}
