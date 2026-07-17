const boreholeCodes = ['ZK-01','ZK-02','ZK-03','ZK-04','ZK-05','ZK-06','ZK-07','ZK-08','ZK-09','ZK-10','ZK-11','ZK-12','ZK-13']
const makeRows = (mapper) => boreholeCodes.map((code, index) => ({ id:index + 1, code, ...mapper(index, code) }))

export const cagMockData = {
  'cag-view-borehole': makeRows((i) => ({ favorite:'☆', type:i % 3 ? '一般性探孔' : '取土、标准贯入、重型动力触探', elevation:(34.56 + i * 0.07).toFixed(2), depth:[58,30,40,62,55][i % 5].toFixed(2), date:`2026-07-${String(15 - i).padStart(2,'0')} 14:${String(20 + i).padStart(2,'0')}:00`, layerAction:'查看', waterAction:i % 3 === 2 ? '-' : '查看' })),
  'cag-view-layer': makeRows((i) => ({ layer:`${i % 6 + 1}`, name:['素填土','粉质黏土','中砂','圆砾','强风化泥岩','中风化泥岩'][i % 6], bottom:(33.2 - i * 1.35).toFixed(2), thickness:(1.2 + i % 4 * 0.6).toFixed(2), description:'层位连续，岩土特征及分层界线已完成复核', status:i % 4 ? '已确认' : '待复核' })),
  'cag-view-geology': makeRows((i) => ({ range:`${(i * 1.5).toFixed(1)}-${(i * 1.5 + 2.4).toFixed(1)}`, name:['粉质黏土','中砂','圆砾','泥岩'][i % 4], color:['黄褐色','灰黄色','杂色','棕红色'][i % 4], density:['稍密','中密','密实'][i % 3], description:'结构较均匀，局部夹薄层，钻进过程稳定，取芯完整。' })),
  'cag-view-water': makeRows((i) => ({ initial:(8.4 + i * 0.3).toFixed(2), stable:(7.9 + i * 0.28).toFixed(2), elevation:(26.4 - i * 0.21).toFixed(2), date:`2026-07-${String(i + 1).padStart(2,'0')}`, note:i % 3 ? '水位稳定' : '雨后复测' })),
  'cag-view-soil': makeRows((i, code) => ({ code:`${code}-T${i + 1}`, test:'常规物理力学性质试验', moisture:(18 + i * 0.7).toFixed(1), density:(1.82 + i * 0.01).toFixed(2), voidRatio:(0.62 + i * 0.012).toFixed(3), status:i % 4 ? '已完成' : '复核中', report:'查看' })),
  'cag-view-special-soil': makeRows((i, code) => ({ code:`${code}-S${i + 1}`, test:['高压固结','三轴剪切','渗透试验'][i % 3], value:(12.6 + i * 1.8).toFixed(2), unit:['MPa','kPa','cm/s'][i % 3], date:`2026-07-${String(i + 2).padStart(2,'0')}`, status:'已完成', report:'查看' })),
  'cag-view-demo-test': makeRows((i) => ({ code:`YS-${String(i + 1).padStart(3,'0')}`, name:['颗粒分析','固结试验','直剪试验'][i % 3], instrument:['粒度分析仪','固结仪','应变控制直剪仪'][i % 3], operator:['王工','李工','赵工'][i % 3], date:`2026-07-${String(i + 1).padStart(2,'0')} 09:30`, status:'已完成', record:'查看' })),
  'cag-view-water-quality': makeRows((i, code) => ({ code:`${code}-W`, ph:(7.1 + i * 0.03).toFixed(2), hardness:180 + i * 4, chloride:42 + i * 2, sulfate:68 + i * 3, date:`2026-07-${String(i + 1).padStart(2,'0')}`, report:'查看' })),
  'cag-view-soluble-salt': makeRows((i, code) => ({ code:`${code}-Y${i + 1}`, total:(0.12 + i * 0.008).toFixed(3), carbonate:(0.015 + i * 0.001).toFixed(3), chloride:(0.028 + i * 0.002).toFixed(3), sulfate:(0.034 + i * 0.002).toFixed(3), status:'已完成', report:'查看' })),
}
