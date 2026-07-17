<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, default: "A-A' 工程地质剖面" },
})

const W = 900
const H = 380

// 4 个钻孔：水平位置(0~1)、孔口高程、孔深
const holes = [
  { code: 'ZK-01', x: 0.08, elev: 156.3, depth: 28.5 },
  { code: 'ZK-02', x: 0.34, elev: 157.0, depth: 31.2 },
  { code: 'ZK-03', x: 0.62, elev: 155.9, depth: 25.0 },
  { code: 'ZK-04', x: 0.90, elev: 156.7, depth: 33.6 },
]

// 地层底界（相对高程，m）。每孔每层底界高程 = 孔口高程 - 累计厚度
const layerDefs = [
  { name: '素填土', color: '#8b6f4e', bottoms: [155.1, 155.8, 154.7, 155.5] },
  { name: '粉质粘土', color: '#c9a96e', bottoms: [149.8, 150.5, 149.4, 150.2] },
  { name: '中砂', color: '#e6cf86', bottoms: [144.3, 145.0, 143.9, 144.7] },
  { name: '圆砾', color: '#a98c66', bottoms: [137.8, 138.5, 137.4, 138.2] },
  { name: '强风化泥岩', color: '#6a6a6a', bottoms: [132.3, 133.0, 131.9, 132.7] },
  { name: '中风化泥岩', color: '#48484a', bottoms: [127.8, 125.8, 130.9, 123.1] },
]

const waterElev = 152.1
const topElev = 160
const bottomElev = 122
const elevRange = topElev - bottomElev
const padL = 80
const padR = 40
const padT = 30
const padB = 50
const plotW = W - padL - padR
const plotH = H - padT - padB

const xAt = (h) => padL + h.x * plotW
const yAt = (elev) => padT + (topElev - elev) / elevRange * plotH

const svg = computed(() => {
  let s = ''
  // 背景
  s += `<rect x="0" y="0" width="${W}" height="${H}" fill="var(--panel)"/>`
  // 网格 + 高程刻度
  for (let e = bottomElev; e <= topElev; e += 4) {
    const y = yAt(e)
    s += `<line x1="${padL}" y1="${y}" x2="${W - padR}" y2="${y}" stroke="var(--border)" stroke-dasharray="2,4"/>`
    s += `<text x="${padL - 6}" y="${y + 3}" font-size="10" fill="var(--text-mute)" text-anchor="end">${e}</text>`
  }

  // 地面线 + 各地层多边形（相邻钻孔之间）
  // 顶部地面线
  let groundPts = holes.map((h) => `${xAt(h)},${yAt(h.elev)}`).join(' ')
  s += `<polyline points="${groundPts}" fill="none" stroke="#c9a96e" stroke-width="1.5"/>`

  // 每层：在每对相邻钻孔间画多边形
  for (let li = 0; li < layerDefs.length; li++) {
    const layer = layerDefs[li]
    const topLine = li === 0 ? holes.map((h) => ({ x: xAt(h), y: yAt(h.elev) })) : holes.map((h, i) => ({ x: xAt(h), y: yAt(layerDefs[li - 1].bottoms[i]) }))
    const botLine = holes.map((h, i) => ({ x: xAt(h), y: yAt(layer.bottoms[i]) }))

    for (let i = 0; i < holes.length - 1; i++) {
      const pts = [
        topLine[i], topLine[i + 1], botLine[i + 1], botLine[i],
      ].map((p) => `${p.x},${p.y}`).join(' ')
      s += `<polygon points="${pts}" fill="${layer.color}" stroke="var(--border)" stroke-width="0.5"/>`
    }
  }

  // 地下水位线
  const wY = yAt(waterElev)
  s += `<line x1="${padL}" y1="${wY}" x2="${W - padR}" y2="${wY}" stroke="#4a9eff" stroke-width="1.2" stroke-dasharray="7,3"/>`
  s += `<text x="${W - padR + 4}" y="${wY + 3}" font-size="10" fill="#4a9eff">水位 ${waterElev}</text>`

  // 钻孔竖线 + 标注
  holes.forEach((h) => {
    const x = xAt(h)
    const yTop = yAt(h.elev)
    const yBot = yAt(h.elev - h.depth)
    s += `<line x1="${x}" y1="${yTop}" x2="${x}" y2="${yBot}" stroke="var(--text)" stroke-width="1.2"/>`
    s += `<circle cx="${x}" cy="${yTop}" r="3" fill="#f7d154" stroke="#1a1a2e"/>`
    // 钻孔编号
    s += `<text x="${x}" y="${yTop - 8}" font-size="11" fill="var(--accent-2)" text-anchor="middle" font-weight="600">${h.code}</text>`
    // 孔口高程
    s += `<text x="${x}" y="${yTop - 22}" font-size="9" fill="var(--text-mute)" text-anchor="middle">${h.elev.toFixed(1)}</text>`
    // 孔深
    s += `<text x="${x}" y="${yBot + 12}" font-size="9" fill="var(--text-mute)" text-anchor="middle">${h.depth}m</text>`
  })

  // 地层图例
  let lx = padL
  const ly = H - 22
  layerDefs.forEach((l) => {
    s += `<rect x="${lx}" y="${ly}" width="14" height="10" fill="${l.color}" stroke="var(--border)"/>`
    s += `<text x="${lx + 18}" y="${ly + 9}" font-size="10" fill="var(--text-mute)">${l.name}</text>`
    lx += l.name.length * 11 + 32
  })

  // 标题
  s += `<text x="${W / 2}" y="18" font-size="14" fill="var(--text)" text-anchor="middle" font-weight="600">${props.title}</text>`

  // 方向标
  s += `<g transform="translate(${W - padR - 30}, ${padT + 10})">`
  s += `<line x1="0" y1="0" x2="24" y2="0" stroke="var(--text-dim)" stroke-width="1.2"/>`
  s += `<polygon points="24,0 18,-3 18,3" fill="var(--text-dim)"/>`
  s += `<text x="12" y="-5" font-size="10" fill="var(--text-dim)" text-anchor="middle">A</text>`
  s += `<text x="-6" y="3" font-size="10" fill="var(--text-dim)" text-anchor="middle">A'</text>`
  s += `</g>`

  return s
})
</script>

<template>
  <div class="view-pad">
    <div class="svg-wrap">
      <svg :viewBox="`0 0 ${W} ${H}`" :width="W" :height="H" xmlns="http://www.w3.org/2000/svg">
        <g v-html="svg" />
      </svg>
    </div>
  </div>
</template>
