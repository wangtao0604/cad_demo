<script setup>
/**
 * 成果中心 —— 模型 / 文档 / 报告 / 图件
 * 专题成果（专题2自动审核报告）受角色可见控制
 * 模型/图件类成果可"查看"唤起对应查看器
 */
import { computed } from 'vue'
import { Document, Box, Tickets, Share, DataAnalysis, Position, Grid, View, Lock } from '@element-plus/icons-vue'
import { flowStages } from '../data/mockData'

const props = defineProps({
  results: { type: Array, default: () => [] },
  role: { type: String, default: '' },
})
const emit = defineEmits(['view'])

const iconMap = { Document, Box, Tickets, Share, DataAnalysis, Position, Grid, View }

const visibleResults = computed(() =>
  props.results.filter((r) => !r.roles || r.roles.includes(props.role))
)

const stageName = (id) => flowStages.find((s) => s.id === id)?.name || '-'

const typeColor = (t) => ({
  '文档': '#4a9eff', '模型': '#10b981', '图件': '#f59e0b', '报告': '#a855f7', '表格': '#6b7280',
}[t] || '#6b7280')

const lockedResults = computed(() =>
  props.results.filter((r) => r.roles && !r.roles.includes(props.role))
)
</script>

<template>
  <div class="result-panel">
    <div class="rp-grid">
      <div v-for="r in visibleResults" :key="r.id" class="rp-card">
        <div class="rc-icon" :style="{ background: typeColor(r.type) + '1a', color: typeColor(r.type) }">
          <el-icon><component :is="iconMap[r.icon] || Document" /></el-icon>
        </div>
        <div class="rc-body">
          <div class="rc-name">{{ r.name }}</div>
          <div class="rc-meta">
            <span class="rc-type" :style="{ color: typeColor(r.type) }">{{ r.type }}</span>
            <span class="rc-fmt">{{ r.format }}</span>
            <span class="rc-stage">{{ stageName(r.stageId) }}</span>
          </div>
        </div>
        <el-button v-if="r.viewer" size="small" type="primary" plain @click="emit('view', r)">查看</el-button>
        <el-button v-else size="small" plain>下载</el-button>
      </div>
    </div>
    <div v-if="visibleResults.length === 0" class="rp-empty">本阶段暂无成果</div>
    <div v-if="lockedResults.length" class="rp-locked">
      <div class="rl-title"><el-icon><Lock /></el-icon> 以下成果当前角色无权查看</div>
      <div v-for="r in lockedResults" :key="r.id" class="rl-item">{{ r.name }}</div>
    </div>
  </div>
</template>

<style scoped>
.result-panel { display: flex; flex-direction: column; gap: 18px; }
.rp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 14px; }
.rp-empty { padding: 36px 16px; color: rgba(255,255,255,0.38); font-size: 13px; text-align: center; }
.rp-card {
  display: flex; align-items: center; gap: 14px;
  padding: 16px; background: #1a1d26;
  border: 1px solid rgba(255,255,255,0.06); border-radius: 10px;
  transition: all 0.15s;
}
.rp-card:hover { border-color: rgba(74,158,255,0.3); }
.rc-icon { width: 44px; height: 44px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; }
.rc-body { flex: 1; min-width: 0; }
.rc-name { color: #e0e4ed; font-size: 14px; font-weight: 600; }
.rc-meta { display: flex; gap: 10px; margin-top: 6px; align-items: center; }
.rc-type { font-size: 11px; font-weight: 600; }
.rc-fmt { padding: 1px 6px; border-radius: 3px; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.5); font-size: 10px; }
.rc-stage { color: rgba(255,255,255,0.35); font-size: 11px; }
.rp-locked { padding: 14px 16px; background: rgba(245,158,11,0.05); border: 1px dashed rgba(245,158,11,0.25); border-radius: 10px; }
.rl-title { display: flex; align-items: center; gap: 6px; color: #fbbf24; font-size: 12px; font-weight: 600; margin-bottom: 8px; }
.rl-item { color: rgba(255,255,255,0.35); font-size: 12px; padding: 3px 0; }
</style>
