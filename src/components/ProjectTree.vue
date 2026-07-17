<script setup>
import { ref, computed } from 'vue'
import { Search, Folder, Aim, Tickets, DataAnalysis, Share, View, Box, Connection, Link, Fold, Expand } from '@element-plus/icons-vue'

const props = defineProps({
  width: { type: Number, default: 260 },
  data: { type: Array, default: null },
  title: { type: String, default: '工程管理' },
  readOnly: { type: Boolean, default: false },
  collapsed: { type: Boolean, default: false },
})
const emit = defineEmits(['open', 'resize', 'update:collapsed'])

const toggleCollapse = () => emit('update:collapsed', !props.collapsed)

const filterText = ref('')
const treeRef = ref()

const treeData = computed(() => props.data || [])

// 节点类型 → 图标
const typeIcon = {
  folder: Folder,
  borehole: Aim,
  table: Tickets,
  stratum: DataAnalysis,
  section: Share,
  scene: Box,
  cad: View,
  ibgi: Link,
}

const nodeIcon = (data) => typeIcon[data.type] || Folder

// 树节点点击：叶节点打开页签
const onNodeClick = (data) => {
  if (data.type === 'folder') return
  emit('open', data)
}

// 搜索过滤
const filterNode = (value, data) => {
  if (!value) return true
  return (data.name || '').includes(value)
}
const onFilter = (val) => {
  filterText.value = val
  treeRef.value?.filter(val)
}

// 折叠/展开全部
const expandAll = () => {
  const t = treeRef.value
  if (!t) return
  const root = t.getNode('prj')
  if (!root) return
  const nodes = root.store.nodesMap
  Object.values(nodes).forEach((n) => { n.expanded = true })
}
const collapseAll = () => {
  const t = treeRef.value
  if (!t) return
  const root = t.getNode('prj')
  if (!root) return
  const nodes = root.store.nodesMap
  Object.values(nodes).forEach((n) => { n.expanded = false })
}

// 拖拽改变宽度
const onResizerDown = (e) => {
  e.preventDefault()
  const startX = e.clientX
  const startW = props.width
  const move = (ev) => {
    const w = Math.min(Math.max(startW + ev.clientX - startX, 180), 480)
    emit('resize', w)
  }
  const up = () => {
    document.removeEventListener('mousemove', move)
    document.removeEventListener('mouseup', up)
    document.body.style.cursor = ''
  }
  document.body.style.cursor = 'col-resize'
  document.addEventListener('mousemove', move)
  document.addEventListener('mouseup', up)
}
</script>

<template>
  <!-- 折叠态：细条展开按钮 -->
  <div v-if="collapsed" class="app-tree collapsed" @click="toggleCollapse" title="展开工程树">
    <el-icon class="rail-icon"><Expand /></el-icon>
    <span class="rail-label">工程树</span>
  </div>
  <!-- 展开态 -->
  <template v-else>
    <div class="app-tree" :style="{ width: width + 'px' }">
      <div class="tree-head">
        <span>{{ title }}<span v-if="readOnly" class="ro-tag">只读</span></span>
        <span style="display:flex;gap:6px;align-items:center;">
          <el-button text size="small" @click="expandAll" title="全部展开">+</el-button>
          <el-button text size="small" @click="collapseAll" title="全部折叠">−</el-button>
          <el-button text size="small" @click="toggleCollapse" title="折叠工程树"><el-icon><Fold /></el-icon></el-button>
        </span>
      </div>
      <div class="tree-search">
        <el-input
          :model-value="filterText"
          placeholder="搜索工程树..."
          size="small"
          clearable
          :prefix-icon="Search"
          @update:model-value="onFilter"
        />
      </div>
      <div class="tree-body">
        <el-tree
          ref="treeRef"
          :data="treeData"
          node-key="id"
          default-expand-all
          :expand-on-click-node="false"
          :filter-node-method="filterNode"
          @node-click="onNodeClick"
        >
          <template #default="{ data }">
            <div class="tree-node">
              <el-icon class="node-icon"><component :is="nodeIcon(data)" /></el-icon>
              <span class="node-label">{{ data.name }}</span>
              <span v-if="data.meta" class="node-meta">{{ data.meta }}</span>
            </div>
          </template>
        </el-tree>
      </div>
    </div>
    <div class="app-tree-resizer" @mousedown="onResizerDown" />
  </template>
</template>
