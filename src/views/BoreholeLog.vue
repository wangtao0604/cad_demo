<script setup>
import { computed, ref, watch } from 'vue'
import { useAppStore } from '../store/useAppStore'

const props = defineProps({
  code: { type: String, default: 'ZK-01' },
})

const { boreholeLogs, loadBoreholeLog } = useAppStore()
const loading = ref(false)
const errorMessage = ref('')
const log = computed(() => boreholeLogs[props.code] || { layers: [], waterLevel: 0 })

watch(() => props.code, async (code) => {
  loading.value = true
  errorMessage.value = ''
  try {
    await loadBoreholeLog(code)
  } catch (error) {
    errorMessage.value = error.message || '钻孔数据加载失败'
  } finally {
    loading.value = false
  }
}, { immediate: true })

const W = 760
const scale = 18 // px/m
const padTop = 30
const padBottom = 20
const maxDepth = computed(() => Math.max(1, log.value.layers.at(-1)?.bottom || 0))
const H = computed(() => padTop + maxDepth.value * scale + padBottom)

const colX = { depth: 0, depthW: 56, log: 56, logW: 220, desc: 276 }

const svg = computed(() => {
  const layers = log.value.layers.map((l) => {
    const y1 = padTop + l.top * scale
    const y2 = padTop + l.bottom * scale
    const h = y2 - y1
    // 简易纹理：不同地层用图案 id
    return { ...l, y1, y2, h }
  })
  const waterLevel = Number(log.value.waterLevel) || 0
  const gwY = padTop + waterLevel * scale

  let s = ''
  // 背景框
  s += `<rect x="${colX.depth}" y="${padTop - 10}" width="${W - colX.depth}" height="${H.value - padTop + 10}" fill="#1f1f38" stroke="#34344f"/>`
  // 深度刻度
  s += `<rect x="${colX.depth}" y="${padTop - 10}" width="${colX.depthW}" height="${H.value - padTop + 10}" fill="#252542"/>`
  for (let d = 0; d <= Math.ceil(maxDepth.value); d += 2) {
    const y = padTop + d * scale
    s += `<line x1="${colX.depth}" y1="${y}" x2="${colX.depth + colX.depthW}" y2="${y}" stroke="#3d3d5c"/>`
    s += `<text x="${colX.depth + colX.depthW - 4}" y="${y + 3}" font-size="10" fill="#9a9ab5" text-anchor="end">${d}</text>`
  }
  // 分层填色
  layers.forEach((l) => {
    s += `<rect x="${colX.log}" y="${l.y1}" width="${colX.logW}" height="${l.h}" fill="${l.color}" stroke="#1a1a2e" stroke-width="0.5"/>`
    // 地层编号
    s += `<text x="${colX.log + colX.logW / 2}" y="${(l.y1 + l.y2) / 2 + 3}" font-size="11" fill="#1a1a2e" text-anchor="middle" font-weight="600">${l.name}</text>`
  })
  // 柱状边框
  s += `<rect x="${colX.log}" y="${padTop}" width="${colX.logW}" height="${maxDepth.value * scale}" fill="none" stroke="#d7dbe2" stroke-width="1"/>`
  // 地下水位线
  s += `<line x1="${colX.depth}" y1="${gwY}" x2="${colX.desc}" y2="${gwY}" stroke="#4a9eff" stroke-width="1.2" stroke-dasharray="6,3"/>`
  s += `<polygon points="${colX.depth},${gwY} ${colX.depth - 6},${gwY - 4} ${colX.depth - 6},${gwY + 4}" fill="#4a9eff"/>`
  s += `<text x="${colX.desc + 6}" y="${gwY + 3}" font-size="10" fill="#4a9eff">地下水位 ${waterLevel}m</text>`
  // 右侧分层描述
  s += `<line x1="${colX.desc}" y1="${padTop}" x2="${colX.desc}" y2="${padTop + maxDepth.value * scale}" stroke="#34344f"/>`
  layers.forEach((l) => {
    s += `<text x="${colX.desc + 6}" y="${(l.y1 + l.y2) / 2 - 2}" font-size="11" fill="#e6e6f0">${l.name}</text>`
    s += `<text x="${colX.desc + 6}" y="${(l.y1 + l.y2) / 2 + 12}" font-size="10" fill="#9a9ab5">${l.top.toFixed(1)}–${l.bottom.toFixed(1)}m  厚${(l.bottom - l.top).toFixed(1)}m</text>`
  })
  // 标题
  s += `<text x="${W / 2}" y="16" font-size="14" fill="#e6e6f0" text-anchor="middle" font-weight="600">${props.code} 钻孔柱状图</text>`
  return s
})
</script>

<template>
  <div class="view-pad">
    <div v-if="errorMessage" class="log-error">{{ errorMessage }}</div>
    <div v-else v-loading="loading" class="svg-wrap">
      <svg :viewBox="`0 0 ${W} ${H}`" :width="W" :height="H" xmlns="http://www.w3.org/2000/svg">
        <g v-html="svg" />
      </svg>
    </div>
  </div>
</template>
