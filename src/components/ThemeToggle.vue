<script setup>
import { Moon, Sunny } from '@element-plus/icons-vue'
import { useTheme } from '../composables/useTheme'

const { isDark, toggleTheme } = useTheme()
</script>

<template>
  <span class="theme-toggle-wrap">
    <el-tooltip :content="isDark ? '切换为浅色主题' : '切换为深色主题'" placement="bottom">
      <el-button
        class="theme-toggle"
        circle
        :aria-label="isDark ? '切换为浅色主题' : '切换为深色主题'"
        @click="toggleTheme"
      >
        <el-icon><Sunny v-if="isDark" /><Moon v-else /></el-icon>
      </el-button>
    </el-tooltip>
  </span>
</template>

<style scoped>
.theme-toggle-wrap {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
}
.theme-toggle {
  width: 34px;
  height: 34px;
  flex: 0 0 34px;
  color: var(--text-dim);
  background: var(--panel-2);
  border-color: var(--border-light);
}
.theme-toggle:hover {
  color: var(--accent);
  background: var(--surface-hover);
  border-color: var(--accent);
}
.theme-toggle .el-icon { font-size: 16px; }
</style>
