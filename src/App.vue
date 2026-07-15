<script setup>
/**
 * 勘察一体化平台 · 顶层路由壳
 * 按 store.view 切换：login → dashboard → cockpit → workspace
 */
import { useAppStore } from './store/useAppStore'
import LoginPage from './views/LoginPage.vue'
import ProjectDashboard from './views/ProjectDashboard.vue'
import ProjectCockpit from './views/ProjectCockpit.vue'
import WorkspaceShell from './views/WorkspaceShell.vue'

const { state } = useAppStore()
</script>

<template>
  <LoginPage v-if="state.view === 'login'" />
  <ProjectDashboard v-else-if="state.view === 'dashboard'" />
  <ProjectCockpit v-else-if="state.view === 'cockpit'" />
  <WorkspaceShell v-else-if="state.view === 'workspace'" />
</template>
