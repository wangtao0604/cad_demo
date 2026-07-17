<script setup>
import {
  Aim, Coin, Compass, DataAnalysis, Document, Files, Grid, Histogram,
  Location, MapLocation, Odometer, PieChart, Search, SetUp, TrendCharts, Warning,
} from '@element-plus/icons-vue'

defineProps({ mode: { type: String, required: true } })
const emit = defineEmits(['select'])

const statistics = [
  ['cag-stat-soil', '常规土试', Grid, 'cyan'],
  ['cag-stat-in-situ', '原位测试', Aim, 'amber'],
  ['cag-stat-jk', '综合统计JK', TrendCharts, 'blue'],
  ['cag-stat-sk', '综合统计SK', TrendCharts, 'blue'],
  ['cag-stat-borehole-layer', '钻孔&地层', Files, 'earth'],
  ['cag-stat-rebound', '回弹再压缩', DataAnalysis, 'sky'],
  ['cag-stat-high-pressure', '高压固结', DataAnalysis, 'sky'],
  ['cag-stat-rock', '岩石试验', DataAnalysis, 'sky'],
  ['cag-stat-dt', '综合统计DT', TrendCharts, 'blue'],
  ['cag-stat-single-settle', '单孔结算', Coin, 'steel'],
  ['cag-stat-water-level', '钻孔水位', MapLocation, 'orange'],
  ['cag-stat-layer-elevation', '地层标高', Histogram, 'amber'],
  ['cag-stat-workload', '工作量', PieChart, 'blue'],
  ['cag-stat-overview', '勘探点总览', Location, 'earth'],
  ['cag-stat-single-workload', '单孔工作量表', PieChart, 'blue'],
  ['cag-stat-record-a3', '备案表A3', Document, 'cyan'],
  ['cag-stat-record-a4', '备案表A4', Document, 'cyan'],
  ['cag-stat-record-hole', '备案含信孔', Document, 'cyan'],
  ['cag-stat-field-workload', '现场工作量', PieChart, 'blue'],
  ['cag-stat-field-settle', '外业结算', Coin, 'steel'],
  ['cag-stat-project-settle', '项目结算', Coin, 'steel'],
  ['cag-stat-contour', '等值线数据', Histogram, 'amber'],
  ['cag-stat-check', '数据检查', Search, 'cyan'],
]

const calculations = [
  ['cag-calc-site', '场地判别', SetUp, 'green'],
  ['cag-calc-liquefaction', '地震液化', Warning, 'pink'],
  ['cag-calc-modulus', '砂卵石模量', Odometer, 'amber'],
  ['cag-calc-map-sheet', '图幅号计算', Grid, 'cyan'],
  ['cag-calc-bearing', '承载力计算', Aim, 'earth'],
  ['cag-calc-corrosion', '腐蚀性判断', Compass, 'steel'],
]
</script>

<template>
  <div class="command-panel-wrap">
    <div class="command-panel" :class="'is-' + mode">
      <button v-for="item in mode === 'statistics' ? statistics : calculations" :key="item[0]"
        class="command-item" type="button" @click="emit('select', item[0])">
        <span class="command-icon" :class="'tone-' + item[3]">
          <el-icon><component :is="item[2]" /></el-icon>
        </span>
        <span class="command-label">{{ item[1] }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.command-panel-wrap { flex: 1; min-height: 0; padding: 18px; background: var(--app-bg); overflow: auto; }
.command-panel { display: grid; grid-template-columns: repeat(5, 78px); grid-auto-rows: 78px; gap: 10px 18px; width: max-content; min-height: 100%; align-content: start; }
.command-panel.is-calculations { grid-template-columns: repeat(3, 78px); }
.command-item { width: 78px; height: 78px; padding: 2px; border: 1px solid transparent; background: transparent; color: var(--text); font-family: inherit; cursor: pointer; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; gap: 6px; }
.command-item:hover, .command-item:focus-visible { border-color: var(--border-light); background: var(--surface-hover); outline: none; }
.command-icon { width: 44px; height: 44px; display: grid; place-items: center; border: 1px solid rgba(30,66,90,.22); color: #fff; background: linear-gradient(145deg, #56bee4, #176fa8); box-shadow: inset 0 1px rgba(255,255,255,.65); }
.command-icon .el-icon { font-size: 28px; }
.tone-amber { background: linear-gradient(145deg, #f1d55b, #b97908); }
.tone-earth { background: linear-gradient(145deg, #79a732, #755315); }
.tone-orange { background: linear-gradient(145deg, #d88a52, #7b3c29); }
.tone-steel { border-radius: 50%; background: radial-gradient(circle at 35% 28%, #fff, #8dc6e4 38%, #24577e 72%); }
.tone-green { background: linear-gradient(145deg, #51bd7b, #17734a); }
.tone-pink { background: linear-gradient(145deg, #f4a2af, #b92c5f); }
.command-label { width: 100%; color: var(--text); font-size: 12px; line-height: 16px; white-space: nowrap; text-align: center; }
</style>
