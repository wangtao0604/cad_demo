<script setup>
/**
 * 项目看板 · 项目负责人使用驾驶舱 / 列表，其他角色使用列表 / 地图
 * 只显示当前用户参与的项目（按角色过滤）
 */
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, DataBoard, Grid, MapLocation, SwitchButton, Aim, Document, TrendCharts } from '@element-plus/icons-vue'
import { useAppStore } from '../store/useAppStore'
import { personas, flowStages, categories, projects as allProjects } from '../data/mockData'
import LeaderDashboard from '../components/LeaderDashboard.vue'

const { state, user, myProjects, openProject, logout } = useAppStore()

const viewMode = ref('list') // dashboard | list | map
const catFilter = ref('全部')
const stageFilter = ref('全部')
const search = ref('')

const stageName = (id) => flowStages.find((s) => s.id === id)?.name || '-'
const stageShort = (id) => flowStages.find((s) => s.id === id)?.short || '-'

/** 阶段筛选项：全部 + 8 个流程阶段 */
const stageOptions = [
  { label: '全部阶段', value: '全部' },
  ...flowStages.map((s) => ({ label: s.name, value: s.id })),
]

/** 阶段配色（与驾驶舱流程节点一致） */
const stageColor = (id) => {
  const m = {
    s2: '#4a9eff', s3: '#a855f7', s4: '#06b6d4',
    s5: '#f59e0b', s7: '#ec4899', s8: '#c8322f',
  }
  return m[id] || '#6b7280'
}

const filtered = computed(() => {
  let list = myProjects.value
  if (catFilter.value !== '全部') list = list.filter((p) => p.category === catFilter.value)
  if (stageFilter.value !== '全部') list = list.filter((p) => p.stageId === stageFilter.value)
  if (search.value) list = list.filter((p) => p.name.includes(search.value) || p.city.includes(search.value))
  return list
})

const catColor = (cat) => {
  const m = {
    '市政勘察': '#4a9eff', '轨道交通': '#a855f7', '建筑勘察': '#f59e0b',
    '水利勘察': '#10b981', '交通勘察': '#ec4899',
  }
  return m[cat] || '#6b7280'
}

const progressColor = (v) => (v >= 80 ? '#10b981' : v >= 40 ? '#4a9eff' : '#f59e0b')

const onOpen = (p) => {
  openProject(p.id)
}

const onLogout = () => {
  logout()
}
</script>

<template>
  <div class="dash-page">
    <!-- 顶部标题栏 -->
    <header class="dash-header">
      <div class="dh-left">
        <div class="dh-logo">勘</div>
        <div>
          <div class="dh-title">勘察一体化平台</div>
          <div class="dh-sub">项目看板</div>
        </div>
      </div>
      <div class="dh-right">
        <div class="dh-user">
          <span class="dh-avatar">{{ user.avatar }}</span>
          <div class="dh-userinfo">
            <span class="dh-name">{{ user.name }}</span>
            <span class="dh-role">{{ user.title }}</span>
          </div>
        </div>
        <el-button :icon="SwitchButton" circle @click="onLogout" title="退出登录" />
      </div>
    </header>

    <!-- 工具条 -->
    <div class="dash-toolbar">
      <div class="dt-left">
        <span class="dt-label">我的项目（{{ filtered.length }}）</span>
        <el-select v-model="catFilter" size="default" style="width:140px">
          <el-option v-for="c in categories" :key="c" :label="c" :value="c" />
        </el-select>
        <el-select v-model="stageFilter" size="default" style="width:150px" placeholder="按阶段筛选">
          <template #prefix>
            <span class="stage-dot" :style="{ background: stageFilter !== '全部' ? stageColor(stageFilter) : 'transparent' }" />
          </template>
          <el-option v-for="s in stageOptions" :key="s.value" :label="s.label" :value="s.value">
            <span class="stage-opt-dot" :style="{ background: s.value !== '全部' ? stageColor(s.value) : 'transparent', borderColor: s.value !== '全部' ? stageColor(s.value) : 'rgba(255,255,255,0.2)' }" />
            <span>{{ s.label }}</span>
          </el-option>
        </el-select>
        <el-input v-model="search" placeholder="搜索项目/城市" :prefix-icon="Search" style="width:200px" clearable />
      </div>
      <div class="dt-right">
        <el-radio-group v-model="viewMode" size="default">
          <el-radio-button v-if="user.id === 'leader'" value="dashboard"><el-icon><DataBoard /></el-icon>&nbsp;驾驶舱</el-radio-button>
          <el-radio-button value="list"><el-icon><Grid /></el-icon>&nbsp;列表</el-radio-button>
          <el-radio-button v-if="user.id !== 'leader'" value="map"><el-icon><MapLocation /></el-icon>&nbsp;地图</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <!-- 项目级全局驾驶舱（进入具体项目之前） -->
    <div v-if="viewMode === 'dashboard'" class="dash-cockpit">
      <LeaderDashboard :projects="filtered" :user="user" @open-project="openProject" />
    </div>

    <!-- 列表视图 -->
    <div v-else-if="viewMode === 'list'" class="dash-list">
      <div v-for="p in filtered" :key="p.id" class="proj-card" @click="onOpen(p)">
        <div class="pc-top">
          <div class="pc-tags">
            <span class="pc-cat" :style="{ background: catColor(p.category) + '22', color: catColor(p.category), borderColor: catColor(p.category) + '55' }">{{ p.category }}</span>
            <span class="pc-stage" :style="{ background: stageColor(p.stageId) + '22', color: stageColor(p.stageId), borderColor: stageColor(p.stageId) + '55' }">
              <span class="pc-stage-dot" :style="{ background: stageColor(p.stageId) }" />{{ stageShort(p.stageId) }}
            </span>
          </div>
          <span class="pc-status">{{ p.status }}</span>
        </div>
        <div class="pc-name">{{ p.name }}</div>
        <div class="pc-desc">{{ p.desc }}</div>
        <div class="pc-meta">
          <span><el-icon><Aim /></el-icon>{{ p.city }}</span>
          <span><el-icon><Document /></el-icon>{{ stageName(p.stageId) }}</span>
          <span><el-icon><TrendCharts /></el-icon>{{ p.members }}人</span>
        </div>
        <div class="pc-progress">
          <el-progress :percentage="p.progress" :color="progressColor(p.progress)" :stroke-width="6" :show-text="false" />
          <span class="pc-pct">{{ p.progress }}%</span>
        </div>
        <div class="pc-foot">
          <span class="pc-role">我的角色：{{ user.title }}</span>
          <span class="pc-deadline">截止 {{ p.deadline }}</span>
        </div>
      </div>
      <div v-if="filtered.length === 0" class="empty-state">暂无参与的项目</div>
    </div>

    <!-- 地图视图：项目负责人已有全局分布态势，仅其他角色保留 -->
    <div v-else class="dash-map">
      <div class="map-canvas">
        <svg viewBox="0 0 600 400" class="map-svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" stroke-width="1"/>
            </pattern>
          </defs>
          <rect width="600" height="400" fill="url(#grid)" />
          <path d="M80,120 Q200,80 320,110 T540,160 Q560,260 460,310 T200,330 Q100,300 80,200 Z" fill="rgba(74,158,255,0.04)" stroke="rgba(74,158,255,0.18)" stroke-width="1.5" />
          <g v-for="p in filtered" :key="p.id" class="map-pt" @click="onOpen(p)">
            <circle :cx="p.coords.x" :cy="p.coords.y" :r="22" fill="none" :stroke="stageColor(p.stageId)" stroke-width="2" opacity="0.75" />
            <circle :cx="p.coords.x" :cy="p.coords.y" :r="18" :fill="catColor(p.category) + '22'" :stroke="catColor(p.category)" stroke-width="1.5" />
            <circle :cx="p.coords.x" :cy="p.coords.y" :r="6" :fill="catColor(p.category)" />
            <text :x="p.coords.x" :y="p.coords.y - 26" text-anchor="middle" fill="#e0e4ed" font-size="11" font-weight="600">{{ p.name.length > 10 ? p.name.slice(0,9)+'…' : p.name }}</text>
            <text :x="p.coords.x" :y="p.coords.y + 32" text-anchor="middle" fill="rgba(255,255,255,0.5)" font-size="10">{{ stageName(p.stageId) }} · {{ p.progress }}%</text>
          </g>
        </svg>
        <div class="map-legend">
          <div class="ml-title">工程类别</div>
          <div v-for="c in categories.slice(1)" :key="c" class="ml-item">
            <span class="ml-dot" :style="{ background: catColor(c) }" />{{ c }}
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<style scoped>
.dash-page { position: fixed; inset: 0; display: flex; flex-direction: column; background: #0f1117; }
.dash-header {
  height: 60px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px;
  background: linear-gradient(180deg, #1a1d26, #161922);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.dh-left { display: flex; align-items: center; gap: 12px; }
.dh-logo { width: 38px; height: 38px; border-radius: 9px; background: linear-gradient(135deg,#c8322f,#8a1f1d); color:#fff; font-size:20px; font-weight:700; display:flex; align-items:center; justify-content:center; }
.dh-title { color: #fff; font-size: 16px; font-weight: 700; }
.dh-sub { color: rgba(255,255,255,0.4); font-size: 11px; }
.dh-right { display: flex; align-items: center; gap: 14px; }
.dh-user { display: flex; align-items: center; gap: 10px; }
.dh-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg,#3a3f4e,#2a2e3a); color:#e0e4ed; font-size:13px; font-weight:600; display:flex; align-items:center; justify-content:center; }
.dh-userinfo { display: flex; flex-direction: column; }
.dh-name { color: #e0e4ed; font-size: 13px; font-weight: 600; }
.dh-role { color: rgba(255,255,255,0.4); font-size: 11px; }

.dash-toolbar {
  height: 56px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px;
  background: #13161e; border-bottom: 1px solid rgba(255,255,255,0.05);
}
.dt-left { display: flex; align-items: center; gap: 12px; }
.dt-label { color: rgba(255,255,255,0.7); font-size: 14px; font-weight: 600; }
.dash-cockpit { flex: 1; min-height: 0; overflow: hidden; }

.dash-list {
  flex: 1; overflow: auto; padding: 20px 24px;
  display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px; align-content: start;
}
.proj-card {
  background: #1a1d26; border: 1px solid rgba(255,255,255,0.06);
  border-radius: 12px; padding: 18px; cursor: pointer; transition: all 0.18s;
  display: flex; flex-direction: column; gap: 10px;
}
.proj-card:hover { border-color: rgba(200,50,47,0.4); transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.3); }
.pc-top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.pc-tags { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.pc-cat { padding: 3px 10px; border-radius: 5px; font-size: 11px; font-weight: 600; border: 1px solid; }
.pc-stage { padding: 3px 10px 3px 8px; border-radius: 5px; font-size: 11px; font-weight: 600; border: 1px solid; display: inline-flex; align-items: center; gap: 5px; }
.pc-stage-dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
.pc-status { color: rgba(255,255,255,0.5); font-size: 12px; }
.pc-name { color: #fff; font-size: 16px; font-weight: 700; }
.pc-desc { color: rgba(255,255,255,0.45); font-size: 12px; line-height: 1.5; }
.pc-meta { display: flex; gap: 14px; color: rgba(255,255,255,0.5); font-size: 12px; }
.pc-meta span { display: flex; align-items: center; gap: 4px; }
.pc-progress { display: flex; align-items: center; gap: 10px; }
.pc-progress .el-progress { flex: 1; }
.pc-pct { color: #e0e4ed; font-size: 12px; font-weight: 600; min-width: 34px; }
.pc-foot { display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.05); }
.pc-role { color: #6cb6ff; font-size: 12px; }
.pc-deadline { color: rgba(255,255,255,0.35); font-size: 11px; }

.empty-state { grid-column: 1/-1; text-align: center; color: rgba(255,255,255,0.3); padding: 80px; }

.dash-map { flex: 1; overflow: auto; padding: 20px 24px; }
.map-canvas { position: relative; height: 100%; background: #13161e; border: 1px solid rgba(255,255,255,0.06); border-radius: 12px; overflow: hidden; }
.map-svg { width: 100%; height: 100%; }
.map-pt { cursor: pointer; transition: all 0.15s; }
.map-pt:hover circle:first-child { r: 26; opacity: 1; }
.stage-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.stage-opt-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 8px; vertical-align: middle; border: 1px solid; }
.map-legend {
  position: absolute; right: 16px; top: 16px;
  background: rgba(26,29,38,0.92); border: 1px solid rgba(255,255,255,0.08);
  border-radius: 8px; padding: 12px 14px; backdrop-filter: blur(8px);
}
.ml-title { color: rgba(255,255,255,0.6); font-size: 11px; margin-bottom: 8px; font-weight: 600; }
.ml-item { display: flex; align-items: center; gap: 8px; color: rgba(255,255,255,0.7); font-size: 12px; margin-bottom: 4px; }
.ml-dot { width: 10px; height: 10px; border-radius: 50%; }
</style>
