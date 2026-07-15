<script setup>
defineProps({
  status: { type: String, default: '就绪' },
  coords: { type: String, default: '' },
  command: { type: String, default: '' },
  scale: { type: String, default: '1:1000' },
})
</script>

<template>
  <div class="status-bar">
    <div class="status-item">
      <span class="status-dot" />
      <span>{{ status }}</span>
    </div>
    <div v-if="command" class="status-item">
      <span style="color:var(--warn);">命令:</span>
      <span>{{ command }}</span>
    </div>
    <div class="status-right">
      <div class="status-item">坐标: <span style="color:var(--text);">{{ coords || '—' }}</span></div>
      <div class="status-item">捕捉: <span style="color:var(--text);">关</span></div>
      <div class="status-item">比例: <span style="color:var(--text);">{{ scale }}</span></div>
    </div>
  </div>
</template>
