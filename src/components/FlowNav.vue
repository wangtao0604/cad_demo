<script setup>
/**
 * 流程导航条 —— 8 节点勘察主线，明显显示状态
 * done(完成)/doing(进行中·脉冲)/todo(未开始)/blocked(卡点)
 */
import { computed } from 'vue'
import {
  Flag, Document, View, Position, Aim, Coffee, EditPen, Promotion,
} from '@element-plus/icons-vue'

const props = defineProps({
  stages: { type: Array, required: true },
  currentId: { type: String, default: '' },
  statusMap: { type: Object, default: () => ({}) },
  accessMap: { type: Object, default: () => ({}) },
  role: { type: String, default: '' },
})
const emit = defineEmits(['select'])

const iconMap = { Flag, Document, View, Position, Aim, Coffee, EditPen, Promotion }

const statusLabel = { done: '已完成', doing: '进行中', todo: '未开始', blocked: '卡点' }

const canAccess = (stageId) => {
  const acc = props.accessMap[stageId]
  if (!acc) return false
  return acc.includes(props.role)
}

const onItemClick = (s) => {
  emit('select', s.id)
}
</script>

<template>
  <div class="flow-nav">
    <div v-for="(s, i) in stages" :key="s.id" class="fn-item">
      <div
        class="fn-node"
        :class="[
          statusMap[s.id] || 'todo',
          { active: currentId === s.id, accessible: canAccess(s.id) }
        ]"
        @click="onItemClick(s)"
      >
        <div class="fn-icon">
          <el-icon><component :is="iconMap[s.icon]" /></el-icon>
        </div>
        <div class="fn-text">
          <div class="fn-name">{{ s.name }}</div>
          <div class="fn-status">{{ statusLabel[statusMap[s.id] || 'todo'] }}</div>
        </div>
        <div v-if="!canAccess(s.id) && statusMap[s.id] !== 'done'" class="fn-lock" title="非本阶段办理岗位">🔒</div>
      </div>
      <div v-if="i < stages.length - 1" class="fn-line" :class="{ done: statusMap[s.id] === 'done' }" />
    </div>
  </div>
</template>

<style scoped>
.flow-nav {
  display: flex; align-items: center;
  padding: 14px 20px;
  background: linear-gradient(180deg, #1a1d26, #161922);
  border-bottom: 1px solid rgba(255,255,255,0.06);
  overflow-x: auto;
}
.fn-item { display: flex; align-items: center; flex-shrink: 0; }
.fn-node {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 14px; border-radius: 10px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  cursor: pointer; transition: all 0.18s;
  position: relative;
}
.fn-node:hover { background: rgba(255,255,255,0.06); }
.fn-node.active {
  background: rgba(200,50,47,0.14);
  border-color: #c8322f;
  box-shadow: 0 0 0 1px rgba(200,50,47,0.3) inset, 0 4px 14px rgba(200,50,47,0.2);
}
.fn-icon {
  width: 34px; height: 34px; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 17px; flex-shrink: 0;
}
.fn-text { display: flex; flex-direction: column; }
.fn-name { color: #e0e4ed; font-size: 13px; font-weight: 600; white-space: nowrap; }
.fn-status { font-size: 10px; }
.fn-lock { position: absolute; top: -4px; right: -4px; font-size: 11px; }

/* 状态色 */
.fn-node.done .fn-icon { background: rgba(16,185,129,0.15); color: #34d399; }
.fn-node.done .fn-status { color: #34d399; }
.fn-node.doing .fn-icon { background: rgba(74,158,255,0.15); color: #6cb6ff; animation: pulse 1.8s ease-in-out infinite; }
.fn-node.doing .fn-status { color: #6cb6ff; }
.fn-node.todo .fn-icon { background: rgba(255,255,255,0.05); color: rgba(255,255,255,0.3); }
.fn-node.todo .fn-status { color: rgba(255,255,255,0.3); }
.fn-node.blocked .fn-icon { background: rgba(245,158,11,0.15); color: #fbbf24; }
.fn-node.blocked .fn-status { color: #fbbf24; }

.fn-line { width: 26px; height: 2px; background: rgba(255,255,255,0.1); margin: 0 4px; border-radius: 1px; }
.fn-line.done { background: #10b981; }

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(74,158,255,0.4); }
  50% { box-shadow: 0 0 0 6px rgba(74,158,255,0); }
}
</style>
