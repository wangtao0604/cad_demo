<script setup>
/**
 * 勘察一体化平台 · 顶层路由壳
 * 按 store.view 切换：login → dashboard → cockpit → workspace
 */
import { onMounted } from 'vue'
import { useAppStore } from './store/useAppStore'
import LoginPage from './views/LoginPage.vue'
import ProjectDashboard from './views/ProjectDashboard.vue'
import ProjectCockpit from './views/ProjectCockpit.vue'
import WorkspaceShell from './views/WorkspaceShell.vue'

const { state, initialize } = useAppStore()

onMounted(initialize)
</script>

<template>
  <div v-if="state.booting" class="app-bootstrap">正在加载平台配置...</div>
  <el-result v-else-if="state.bootError" icon="error" title="平台初始化失败" :sub-title="state.bootError">
    <template #extra><el-button type="primary" @click="initialize">重新加载</el-button></template>
  </el-result>
  <LoginPage v-else-if="state.view === 'login'" />
  <ProjectDashboard v-else-if="state.view === 'dashboard'" />
  <ProjectCockpit v-else-if="state.view === 'cockpit'" />
  <WorkspaceShell v-else-if="state.view === 'workspace'" />
</template>

<style scoped>
.app-bootstrap {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  color: var(--el-text-color-secondary);
  background: var(--el-bg-color-page);
}
</style>
