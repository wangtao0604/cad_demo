<script setup>
/**
 * 项目负责人驾驶舱 —— 大屏数据看板
 * 参考北勘安全看板风格：深色科技框、中央地图、左右统计图表
 */
import { computed } from 'vue'
import {
  DataBoard, OfficeBuilding, Warning, DocumentChecked, MapLocation, Aim, Tickets, TrendCharts,
} from '@element-plus/icons-vue'
import { flowStages, categories } from '../data/mockData'

const props = defineProps({
  projects: { type: Array, default: () => [] },
  user: { type: Object, default: () => ({}) },
})
const emit = defineEmits(['openProject'])

const stageName = (id) => flowStages.find((s) => s.id === id)?.name || '-'
const stageShort = (id) => flowStages.find((s) => s.id === id)?.short || '-'
const stageColor = (id) => {
  const m = { s2: '#4a9eff', s3: '#a855f7', s4: '#06b6d4', s5: '#f59e0b', s7: '#ec4899', s8: '#c8322f' }
  return m[id] || '#6b7280'
}
const catColor = (cat) => {
  const m = { '市政勘察': '#4a9eff', '轨道交通': '#a855f7', '建筑勘察': '#f59e0b', '水利勘察': '#10b981', '交通勘察': '#ec4899' }
  return m[cat] || '#6b7280'
}

const kpi = computed(() => {
  const list = props.projects
  const total = list.length
  const doing = list.filter((p) => p.progress < 100).length
  const warning = list.filter((p) => p.progress < 30).length
  const done = list.filter((p) => p.progress >= 100).length
  return [
    { label: '在施项目', value: total, sub: doing + ' 个进行中', icon: OfficeBuilding, color: '#4a9eff' },
    { label: '本月新增', value: Math.max(1, Math.floor(total / 3)), sub: '环比 +12%', icon: DataBoard, color: '#10b981' },
    { label: '卡点预警', value: warning, sub: '需重点关注', icon: Warning, color: '#f59e0b' },
    { label: '待审成果', value: done + 3, sub: '报告/模型待审', icon: DocumentChecked, color: '#c8322f' },
  ]
})

const stageStats = computed(() => {
  return flowStages.map((s) => ({
    ...s,
    count: props.projects.filter((p) => p.stageId === s.id).length,
  })).filter((s) => s.count > 0)
})

const catStats = computed(() => {
  return categories.slice(1).map((c) => ({
    name: c,
    count: props.projects.filter((p) => p.category === c).length,
    color: catColor(c),
  }))
})

const regionStats = computed(() => {
  const map = {}
  props.projects.forEach((p) => {
    const region = p.city.split('·')[0]
    map[region] = (map[region] || 0) + 1
  })
  return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count)
})

const recentProjects = computed(() => [...props.projects].sort((a, b) => b.progress - a.progress).slice(0, 5))

const mapPoints = computed(() => props.projects.map((p, i) => ({
  ...p,
  x: 60 + (i % 4) * 130 + Math.random() * 40,
  y: 80 + Math.floor(i / 4) * 100 + Math.random() * 40,
})))

const trend = computed(() => [12, 18, 22, 28, 35, 42, 48, 55, 62, 70, 78, 85])
</script>

<template>
  <div class="leader-dash">
    <!-- 顶部 KPI -->
    <div class="kpi-row">
      <div v-for="k in kpi" :key="k.label" class="kpi-card">
        <div class="kpi-icon" :style="{ background: k.color + '1a', color: k.color, boxShadow: '0 0 16px ' + k.color + '33' }">
          <el-icon><component :is="k.icon" /></el-icon>
        </div>
        <div class="kpi-body">
          <div class="kpi-value" :style="{ color: k.color }">{{ k.value }}</div>
          <div class="kpi-label">{{ k.label }}</div>
          <div class="kpi-sub">{{ k.sub }}</div>
        </div>
      </div>
    </div>

    <!-- 三栏大屏 -->
    <div class="board-grid">
      <!-- 左侧 -->
      <div class="board-col">
        <div class="panel">
          <div class="panel-head"><el-icon><Tickets /></el-icon><span>项目公告</span></div>
          <div class="notice-list">
            <div class="notice-item"><span class="n-date">2026-07-10</span><span class="n-dot" style="background:#f59e0b" />水库项目勘察纲要待审批</div>
            <div class="notice-item"><span class="n-date">2026-07-08</span><span class="n-dot" style="background:#10b981" />地铁17号线勘探进度过半</div>
            <div class="notice-item"><span class="n-date">2026-07-05</span><span class="n-dot" style="background:#c8322f" />CBD项目报告进入审定</div>
            <div class="notice-item"><span class="n-date">2026-07-01</span><span class="n-dot" style="background:#4a9eff" />月度质量安全检查通知</div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-head"><el-icon><OfficeBuilding /></el-icon><span>工程类别分布</span></div>
          <div class="cat-list">
            <div v-for="c in catStats" :key="c.name" class="cat-item">
              <span class="cat-name" :style="{ color: c.color }">{{ c.name }}</span>
              <div class="cat-bar-bg"><div class="cat-bar" :style="{ width: (c.count / Math.max(...catStats.map(x=>x.count)) * 100) + '%', background: c.color }" /></div>
              <span class="cat-count" :style="{ color: c.color }">{{ c.count }}</span>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-head"><el-icon><MapLocation /></el-icon><span>区域分布</span></div>
          <div class="region-list">
            <div v-for="(r, i) in regionStats" :key="r.name" class="region-item">
              <span class="region-rank">{{ i + 1 }}</span>
              <span class="region-name">{{ r.name }}</span>
              <span class="region-count">{{ r.count }} 个</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间地图 -->
      <div class="board-col board-center">
        <div class="panel map-panel">
          <div class="panel-head center-head"><el-icon><Aim /></el-icon><span>项目分布态势</span></div>
          <div class="map-wrap">
            <svg viewBox="0 0 600 400" class="map-svg">
              <defs>
                <pattern id="grid2" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(74,158,255,0.08)" stroke-width="1" />
                </pattern>
                <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stop-color="rgba(74,158,255,0.12)" />
                  <stop offset="100%" stop-color="rgba(74,158,255,0)" />
                </radialGradient>
              </defs>
              <rect width="600" height="400" fill="url(#grid2)" />
              <circle cx="300" cy="200" r="160" fill="url(#mapGlow)" />
              <path d="M60,200 Q150,80 300,90 T540,180 Q560,280 460,330 T200,350 Q80,310 60,200 Z" fill="rgba(74,158,255,0.04)" stroke="rgba(74,158,255,0.18)" stroke-width="1.5" />
              <g v-for="p in mapPoints" :key="p.id" class="map-pt" @click="emit('openProject', p.id)">
                <circle :cx="p.x" :cy="p.y" :r="26" :fill="stageColor(p.stageId) + '22'" :stroke="stageColor(p.stageId)" stroke-width="1.5" />
                <circle :cx="p.x" :cy="p.y" :r="8" :fill="stageColor(p.stageId)" />
                <circle :cx="p.x" :cy="p.y" :r="4" fill="#fff" />
                <text :x="p.x" :y="p.y - 32" text-anchor="middle" fill="#e0e4ed" font-size="11" font-weight="600">{{ p.name.length > 8 ? p.name.slice(0,7)+'…' : p.name }}</text>
                <text :x="p.x" :y="p.y + 38" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="10">{{ stageShort(p.stageId) }} · {{ p.progress }}%</text>
              </g>
            </svg>
            <div class="map-legend">
              <div class="legend-title">阶段图例</div>
              <div v-for="s in flowStages" :key="s.id" class="legend-item">
                <span class="legend-dot" :style="{ background: stageColor(s.id) }" />{{ s.short }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧 -->
      <div class="board-col">
        <div class="panel">
          <div class="panel-head"><el-icon><TrendCharts /></el-icon><span>阶段分布</span></div>
          <div class="stage-list">
            <div v-for="s in stageStats" :key="s.id" class="stage-bar-item">
              <div class="stage-bar-label">
                <span>{{ s.name }}</span>
                <span :style="{ color: stageColor(s.id) }">{{ s.count }} 个</span>
              </div>
              <div class="stage-bar-bg">
                <div class="stage-bar" :style="{ width: (s.count / Math.max(...stageStats.map(x=>x.count)) * 100) + '%', background: stageColor(s.id) }" />
              </div>
            </div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-head"><el-icon><Warning /></el-icon><span>项目卡点 / 预警</span></div>
          <div class="warning-list">
            <div class="warning-item high"><span class="w-tag">高</span>CBD项目报告审定滞后</div>
            <div class="warning-item high"><span class="w-tag">高</span>水库坝基纲要待审批</div>
            <div class="warning-item mid"><span class="w-tag">中</span>地铁17号线 ZK-03 进度滞后</div>
            <div class="warning-item low"><span class="w-tag">低</span>高速项目现场辨识延期</div>
          </div>
        </div>

        <div class="panel">
          <div class="panel-head"><el-icon><TrendCharts /></el-icon><span>年度项目进度趋势</span></div>
          <div class="trend-chart">
            <svg viewBox="0 0 280 100" preserveAspectRatio="none" class="trend-svg">
              <polyline :points="trend.map((v,i)=>`${i*25},${100-v}`).join(' ')" fill="none" stroke="#4a9eff" stroke-width="2" />
              <polygon :points="`0,100 ${trend.map((v,i)=>`${i*25},${100-v}`).join(' ')} 275,100`" fill="url(#trendFill)" opacity="0.3" />
              <defs>
                <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stop-color="#4a9eff" />
                  <stop offset="100%" stop-color="rgba(74,158,255,0)" />
                </linearGradient>
              </defs>
            </svg>
            <div class="trend-labels">
              <span>1月</span><span>6月</span><span>12月</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部项目快捷列表 -->
    <div class="bottom-projs">
      <div v-for="p in recentProjects" :key="p.id" class="mini-proj" @click="emit('openProject', p.id)">
        <span class="mp-name">{{ p.name }}</span>
        <span class="mp-stage" :style="{ color: stageColor(p.stageId) }">{{ stageShort(p.stageId) }}</span>
        <span class="mp-progress">{{ p.progress }}%</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.leader-dash {
  height: 100%; overflow: auto;
  display: flex; flex-direction: column; gap: 16px;
  padding: 16px 20px 20px;
  background: radial-gradient(ellipse at 50% 0%, rgba(74,158,255,0.08), transparent 60%), #0b0d12;
}

/* KPI */
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
.kpi-card {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 18px;
  background: linear-gradient(135deg, rgba(26,29,38,0.9), rgba(19,22,30,0.95));
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  position: relative; overflow: hidden;
}
.kpi-card::before {
  content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 3px;
  background: linear-gradient(180deg, var(--kpi-color, #4a9eff), transparent);
}
.kpi-icon { width: 46px; height: 46px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; }
.kpi-value { font-size: 28px; font-weight: 800; line-height: 1; }
.kpi-label { color: rgba(255,255,255,0.7); font-size: 13px; font-weight: 600; margin-top: 6px; }
.kpi-sub { color: rgba(255,255,255,0.35); font-size: 11px; margin-top: 2px; }

/* 三栏 */
.board-grid { flex: 1; display: grid; grid-template-columns: 1fr 1.6fr 1fr; gap: 14px; min-height: 0; }
.board-col { display: flex; flex-direction: column; gap: 14px; }
.board-center { min-height: 0; }

.panel {
  background: linear-gradient(135deg, rgba(26,29,38,0.92), rgba(16,19,26,0.95));
  border: 1px solid rgba(74,158,255,0.12);
  border-radius: 12px; padding: 14px;
  box-shadow: 0 0 20px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.02);
  display: flex; flex-direction: column; gap: 10px;
}
.map-panel { flex: 1; min-height: 0; }
.panel-head { display: flex; align-items: center; gap: 8px; color: #4a9eff; font-size: 13px; font-weight: 700; margin-bottom: 4px; }
.panel-head.center-head { justify-content: center; }

/* 公告 */
.notice-list { display: flex; flex-direction: column; gap: 8px; }
.notice-item { display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.75); font-size: 12px; }
.n-date { color: rgba(255,255,255,0.35); font-size: 11px; min-width: 68px; }
.n-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }

/* 类别 */
.cat-list { display: flex; flex-direction: column; gap: 10px; }
.cat-item { display: flex; align-items: center; gap: 10px; font-size: 12px; }
.cat-name { width: 70px; white-space: nowrap; }
.cat-bar-bg { flex: 1; height: 6px; background: rgba(255,255,255,0.06); border-radius: 3px; overflow: hidden; }
.cat-bar { height: 100%; border-radius: 3px; transition: width 0.5s; }
.cat-count { min-width: 24px; text-align: right; font-weight: 700; }

/* 区域 */
.region-list { display: flex; flex-direction: column; gap: 6px; }
.region-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: rgba(255,255,255,0.75); }
.region-rank { width: 18px; height: 18px; border-radius: 4px; background: rgba(74,158,255,0.12); color: #4a9eff; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; }
.region-name { flex: 1; }
.region-count { color: rgba(255,255,255,0.45); }

/* 地图 */
.map-wrap { flex: 1; position: relative; min-height: 0; }
.map-svg { width: 100%; height: 100%; }
.map-pt { cursor: pointer; transition: all 0.2s; }
.map-pt:hover { filter: brightness(1.3); }
.map-legend {
  position: absolute; right: 10px; top: 10px;
  background: rgba(16,19,26,0.9); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px; padding: 10px 12px; backdrop-filter: blur(8px);
}
.legend-title { color: rgba(255,255,255,0.5); font-size: 10px; margin-bottom: 6px; font-weight: 600; }
.legend-item { display: flex; align-items: center; gap: 6px; color: rgba(255,255,255,0.65); font-size: 11px; margin-bottom: 3px; }
.legend-dot { width: 8px; height: 8px; border-radius: 50%; }

/* 阶段分布 */
.stage-list { display: flex; flex-direction: column; gap: 10px; }
.stage-bar-item { font-size: 12px; }
.stage-bar-label { display: flex; justify-content: space-between; color: rgba(255,255,255,0.75); margin-bottom: 5px; }
.stage-bar-bg { height: 7px; background: rgba(255,255,255,0.06); border-radius: 4px; overflow: hidden; }
.stage-bar { height: 100%; border-radius: 4px; transition: width 0.5s; }

/* 预警 */
.warning-list { display: flex; flex-direction: column; gap: 8px; }
.warning-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: rgba(255,255,255,0.75); }
.w-tag { width: 18px; height: 18px; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 700; color: #fff; }
.warning-item.high .w-tag { background: #c8322f; }
.warning-item.mid .w-tag { background: #f59e0b; }
.warning-item.low .w-tag { background: #4a9eff; }

/* 趋势图 */
.trend-chart { height: 90px; display: flex; flex-direction: column; }
.trend-svg { flex: 1; width: 100%; }
.trend-labels { display: flex; justify-content: space-between; color: rgba(255,255,255,0.35); font-size: 10px; padding-top: 4px; }

/* 底部项目 */
.bottom-projs { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 4px; }
.mini-proj {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 14px; background: rgba(26,29,38,0.8);
  border: 1px solid rgba(255,255,255,0.06); border-radius: 8px;
  cursor: pointer; transition: all 0.15s; white-space: nowrap;
}
.mini-proj:hover { border-color: rgba(74,158,255,0.3); background: rgba(74,158,255,0.08); }
.mp-name { color: #e0e4ed; font-size: 12px; font-weight: 600; }
.mp-stage { font-size: 11px; }
.mp-progress { color: rgba(255,255,255,0.4); font-size: 11px; }

@media (max-width: 1280px) {
  .board-grid { grid-template-columns: 1fr 1.2fr; }
  .board-col:first-child { display: none; }
  .kpi-row { grid-template-columns: repeat(2, 1fr); }
}
</style>
