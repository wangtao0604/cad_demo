<script setup>
import { computed, ref, watch } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { List } from '@element-plus/icons-vue'

const props = defineProps({ command: { type: String, default: 'cag-view-borehole' } })
const emit = defineEmits(['select'])

const tabs = [
  { id:'cag-view-layer', label:'综合分层' },
  { id:'cag-view-borehole', label:'钻孔信息' },
  { id:'cag-view-geology', label:'地质描述' },
  { id:'cag-view-water', label:'水位信息' },
  { id:'cag-view-soil', label:'常规土试' },
  { id:'cag-view-special-soil', label:'特殊土试' },
  { id:'cag-view-demo-test', label:'演示实验' },
  { id:'cag-view-water-quality', label:'水质分析' },
  { id:'cag-view-soluble-salt', label:'水的易溶盐' },
]

const boreholeCodes = ['ZK-01','ZK-02','ZK-03','ZK-04','ZK-05','ZK-06','ZK-07','ZK-08','ZK-09','ZK-10','ZK-11','ZK-12','ZK-13']
const makeRows = (mapper) => boreholeCodes.map((code, index) => ({ id:index + 1, code, ...mapper(index, code) }))

const configs = {
  'cag-view-borehole': {
    columns: [
      ['id','序号',58], ['favorite','收藏',64], ['code','钻孔编号',130], ['type','钻孔类型',210],
      ['elevation','孔口标高(m)',130], ['depth','钻孔深度(m)',130], ['date','勘探钻孔日期',190],
      ['layerAction','地层信息',100], ['waterAction','水位信息',100],
    ],
    rows: makeRows((i) => ({ favorite:'☆', type:i % 3 ? '一般性探孔' : '取土、标准贯入、重型动力触探', elevation:(34.56 + i * 0.07).toFixed(2), depth:[58,30,40,62,55][i % 5].toFixed(2), date:`2026-07-${String(15 - i).padStart(2,'0')} 14:${String(20 + i).padStart(2,'0')}:00`, layerAction:'查看', waterAction:i % 3 === 2 ? '-' : '查看' })),
  },
  'cag-view-layer': {
    columns: [['id','序号',70],['code','钻孔编号',130],['layer','层号',90],['name','土层名称',180],['bottom','层底标高(m)',140],['thickness','厚度(m)',120],['description','岩土描述',360],['status','状态',100]],
    rows: makeRows((i) => ({ layer:`${i % 6 + 1}`, name:['素填土','粉质黏土','中砂','圆砾','强风化泥岩','中风化泥岩'][i % 6], bottom:(33.2 - i * 1.35).toFixed(2), thickness:(1.2 + i % 4 * 0.6).toFixed(2), description:'层位连续，岩土特征及分层界线已完成复核', status:i % 4 ? '已确认' : '待复核' })),
  },
  'cag-view-geology': {
    columns: [['id','序号',70],['code','钻孔编号',130],['range','深度范围(m)',160],['name','岩土名称',160],['color','颜色',110],['density','密实度',120],['description','地质描述',520]],
    rows: makeRows((i) => ({ range:`${(i * 1.5).toFixed(1)}-${(i * 1.5 + 2.4).toFixed(1)}`, name:['粉质黏土','中砂','圆砾','泥岩'][i % 4], color:['黄褐色','灰黄色','杂色','棕红色'][i % 4], density:['稍密','中密','密实'][i % 3], description:'结构较均匀，局部夹薄层，钻进过程稳定，取芯完整。' })),
  },
  'cag-view-water': {
    columns: [['id','序号',70],['code','钻孔编号',150],['initial','初见水位(m)',160],['stable','稳定水位(m)',160],['elevation','水位标高(m)',160],['date','观测日期',200],['note','备注',420]],
    rows: makeRows((i) => ({ initial:(8.4 + i * 0.3).toFixed(2), stable:(7.9 + i * 0.28).toFixed(2), elevation:(26.4 - i * 0.21).toFixed(2), date:`2026-07-${String(i + 1).padStart(2,'0')}`, note:i % 3 ? '水位稳定' : '雨后复测' })),
  },
  'cag-view-soil': {
    columns: [['id','序号',70],['code','样品编号',150],['test','试验项目',220],['moisture','含水率(%)',150],['density','密度(g/cm³)',150],['voidRatio','孔隙比',130],['status','试验状态',150],['report','报告',100]],
    rows: makeRows((i, code) => ({ code:`${code}-T${i + 1}`, test:'常规物理力学性质试验', moisture:(18 + i * 0.7).toFixed(1), density:(1.82 + i * 0.01).toFixed(2), voidRatio:(0.62 + i * 0.012).toFixed(3), status:i % 4 ? '已完成' : '复核中', report:'查看' })),
  },
  'cag-view-special-soil': {
    columns: [['id','序号',70],['code','样品编号',150],['test','特殊试验',260],['value','试验值',140],['unit','单位',110],['date','完成日期',180],['status','状态',130],['report','报告',100]],
    rows: makeRows((i, code) => ({ code:`${code}-S${i + 1}`, test:['高压固结','三轴剪切','渗透试验'][i % 3], value:(12.6 + i * 1.8).toFixed(2), unit:['MPa','kPa','cm/s'][i % 3], date:`2026-07-${String(i + 2).padStart(2,'0')}`, status:'已完成', report:'查看' })),
  },
  'cag-view-demo-test': {
    columns: [['id','序号',70],['code','试验编号',150],['name','试验名称',220],['instrument','试验仪器',240],['operator','试验人员',140],['date','试验时间',190],['status','状态',130],['record','记录',100]],
    rows: makeRows((i, code) => ({ code:`YS-${String(i + 1).padStart(3,'0')}`, name:['颗粒分析','固结试验','直剪试验'][i % 3], instrument:['粒度分析仪','固结仪','应变控制直剪仪'][i % 3], operator:['王工','李工','赵工'][i % 3], date:`2026-07-${String(i + 1).padStart(2,'0')} 09:30`, status:'已完成', record:'查看' })),
  },
  'cag-view-water-quality': {
    columns: [['id','序号',70],['code','水样编号',150],['ph','pH值',110],['hardness','总硬度(mg/L)',170],['chloride','氯离子(mg/L)',170],['sulfate','硫酸根(mg/L)',170],['date','检测日期',180],['report','报告',100]],
    rows: makeRows((i, code) => ({ code:`${code}-W`, ph:(7.1 + i * 0.03).toFixed(2), hardness:180 + i * 4, chloride:42 + i * 2, sulfate:68 + i * 3, date:`2026-07-${String(i + 1).padStart(2,'0')}`, report:'查看' })),
  },
  'cag-view-soluble-salt': {
    columns: [['id','序号',70],['code','样品编号',150],['total','易溶盐总量(%)',180],['carbonate','碳酸根(%)',160],['chloride','氯离子(%)',160],['sulfate','硫酸根(%)',160],['status','状态',130],['report','报告',100]],
    rows: makeRows((i, code) => ({ code:`${code}-Y${i + 1}`, total:(0.12 + i * 0.008).toFixed(3), carbonate:(0.015 + i * 0.001).toFixed(3), chloride:(0.028 + i * 0.002).toFixed(3), sulfate:(0.034 + i * 0.002).toFixed(3), status:'已完成', report:'查看' })),
  },
}

const activeCommand = ref(configs[props.command] ? props.command : 'cag-view-borehole')
const page = ref(1)
const pageSize = ref(10)
const config = computed(() => configs[activeCommand.value])
const rows = computed(() => config.value.rows.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))

watch(() => props.command, (command) => {
  if (configs[command]) activeCommand.value = command
})
watch(activeCommand, (command) => {
  page.value = 1
  emit('select', tabs.find((tab) => tab.id === command)?.label || '数据查看')
})
watch(pageSize, () => { page.value = 1 })
</script>

<template>
  <el-config-provider :locale="zhCn">
    <div class="cag-data-view">
      <div class="cag-data-surface">
        <el-tabs v-model="activeCommand" class="data-tabs">
          <el-tab-pane v-for="tab in tabs" :key="tab.id" :label="tab.label" :name="tab.id" />
        </el-tabs>

        <div class="data-title">
          <el-icon class="data-title-icon"><List /></el-icon>
          <span>数据列表</span>
        </div>

        <el-table :data="rows" stripe border height="calc(100% - 128px)" class="data-table">
          <el-table-column
            v-for="column in config.columns"
            :key="column[0]"
            :prop="column[0]"
            :label="column[1]"
            :min-width="column[2]"
            align="center"
            show-overflow-tooltip
          >
            <template #default="scope">
              <el-button v-if="['查看'].includes(scope.row[column[0]])" link type="primary">查看</el-button>
              <span v-else :class="{ favorite: column[0] === 'favorite' }">{{ scope.row[column[0]] }}</span>
            </template>
          </el-table-column>
        </el-table>

        <div class="data-pagination">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            :total="config.rows.length"
            layout="total, sizes, prev, pager, next, jumper"
            background
          />
        </div>
      </div>
    </div>
  </el-config-provider>
</template>

<style scoped>
.cag-data-view {
  --el-bg-color: #fff;
  --el-bg-color-overlay: #fff;
  --el-fill-color: #f1f3f7;
  --el-fill-color-blank: #fff;
  --el-fill-color-light: #f4f6fa;
  --el-fill-color-lighter: #f7f8fb;
  --el-text-color-primary: #3e4654;
  --el-text-color-regular: #5b6370;
  --el-border-color: #e2e6ee;
  flex: 1;
  min-height: 0;
  height: auto;
  padding: 12px;
  background: #eef1f7;
  color: #424957;
}
.cag-data-surface { height: 100%; padding: 0 14px 14px; background: #fff; border: 1px solid #e2e6ee; box-shadow: 0 2px 8px rgba(35,47,70,0.08); overflow: hidden; }
.data-tabs { height: 48px; }
:deep(.data-tabs .el-tabs__header) { margin: 0; }
:deep(.data-tabs .el-tabs__nav-wrap) { padding: 0; }
:deep(.data-tabs .el-tabs__item) { height: 48px; padding: 0 20px; color: #4b5362; font-weight: 600; }
:deep(.data-tabs .el-tabs__item.is-active) { color: #409eff; }
.data-title { height: 52px; display: flex; align-items: center; gap: 9px; color: #3e4654; font-size: 16px; font-weight: 700; }
.data-title-icon { color: #409eff; font-size: 20px; }
.data-table {
  width: 100%;
  background: #fff;
  --el-table-bg-color: #fff;
  --el-table-tr-bg-color: #fff;
  --el-table-header-bg-color: #edf0f7;
  --el-table-row-hover-bg-color: #eef6ff;
  --el-table-border-color: #e2e6ee;
  --el-table-text-color: #5b6370;
  --el-table-header-text-color: #505866;
}
:deep(.data-table .el-table__body-wrapper),
:deep(.data-table .el-scrollbar__view) { background: #fff; }
:deep(.data-table th.el-table__cell) { height: 48px; font-weight: 700; }
:deep(.data-table td.el-table__cell) { height: 48px; }
.favorite { color: #9aa2af; font-size: 19px; }
.data-pagination { height: 58px; display: flex; align-items: center; justify-content: flex-end; }
:deep(.data-pagination .el-select__wrapper),
:deep(.data-pagination .el-input__wrapper) { background: #fff; }
</style>
