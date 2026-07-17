<script setup>
/**
 * 流程待办面板 —— 按角色显示待办
 * 带 action(CAG/s3mb) 的待办可"去办理"唤起专业工作区
 */
import { Aim, EditPen, Document, DataAnalysis, Tickets, Right } from '@element-plus/icons-vue'

const props = defineProps({
  items: { type: Array, default: () => [] },
  emptyText: { type: String, default: '暂无待办' },
  stages: { type: Array, default: () => [] },
})
const emit = defineEmits(['handle'])

const stageName = (id) => props.stages.find((s) => s.id === id)?.name || '-'

const priColor = (p) => ({ '高': '#ef4444', '中': '#f59e0b', '低': '#6b7280' }[p] || '#6b7280')
const typeIcon = { '制图': EditPen, '建模': DataAnalysis, '审核': Aim, '审定': Aim, '探测': Aim, '复核': Aim, '报告': Document, '数据': Tickets }
</script>

<template>
  <div class="todo-panel">
    <div v-for="t in items" :key="t.id" class="todo-item">
      <div class="ti-pri" :style="{ background: priColor(t.priority) }">{{ t.priority }}</div>
      <div class="ti-body">
        <div class="ti-title">
          <el-icon class="ti-type-icon"><component :is="typeIcon[t.type] || Document" /></el-icon>
          {{ t.title }}
          <span v-if="t.topic" class="ti-topic">{{ t.topic }}</span>
        </div>
        <div class="ti-meta">
          <span class="ti-stage">{{ stageName(t.stageId) }}</span>
          <span class="ti-type">{{ t.type }}</span>
        </div>
      </div>
      <el-button
        v-if="t.action"
        type="primary"
        size="small"
        plain
        @click="emit('handle', t)"
      >
        去办理<el-icon class="el-icon--right"><Right /></el-icon>
      </el-button>
    </div>
    <div v-if="items.length === 0" class="todo-empty">{{ emptyText }}</div>
  </div>
</template>

<style scoped>
.todo-panel { display: flex; flex-direction: column; gap: 10px; }
.todo-item {
  display: flex; align-items: center; gap: 14px;
  padding: 14px 16px; background: #1a1d26;
  border: 1px solid rgba(255,255,255,0.06); border-radius: 10px;
  transition: all 0.15s;
}
.todo-item:hover { border-color: rgba(74,158,255,0.3); }
.ti-pri { width: 30px; height: 30px; border-radius: 6px; color: #fff; font-size: 12px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.ti-body { flex: 1; min-width: 0; }
.ti-title { color: #e0e4ed; font-size: 14px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
.ti-type-icon { color: rgba(255,255,255,0.4); font-size: 14px; }
.ti-topic { padding: 2px 8px; border-radius: 4px; background: rgba(168,85,247,0.15); color: #c084fc; font-size: 10px; font-weight: 600; }
.ti-meta { display: flex; gap: 12px; margin-top: 6px; }
.ti-stage { color: #6cb6ff; font-size: 11px; }
.ti-type { color: rgba(255,255,255,0.4); font-size: 11px; }
.todo-empty { text-align: center; color: rgba(255,255,255,0.3); padding: 60px; }
</style>
