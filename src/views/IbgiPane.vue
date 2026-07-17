<script setup>
/**
 * i北勘项目工作台嵌入（iframe 对接，保留）
 * - 实连模式：真实 iframe 加载 i北勘 projHome
 * - SSO 模拟：URL 附带 token 参数（演示登录态注入机制）
 * - 示意图模式：复刻 projHome 登录后工作台
 */
import { ref, computed } from 'vue'
import { Refresh, Link, Lock, Open } from '@element-plus/icons-vue'

const props = defineProps({
  projectName: { type: String, default: '' },
  url: { type: String, default: '' }, // 外部传入的 i北勘 页面地址
  userName: { type: String, default: '' },
  roleTitle: { type: String, default: '' },
})

const IBGI_HOME = 'https://www.ibgi.cn/#/project/projHome'
const IBGI_INFO = 'http://www.ibgi.cn/#/project/projContent/engineering/subprojectSurvey/surEngInfo'
const mode = ref('real') // real | schematic
const sso = ref(false)
const loading = ref(true)
const token = ref('SIM-' + Math.random().toString(36).slice(2, 10).toUpperCase())

const baseUrl = computed(() => props.url || IBGI_HOME)
const frameSrc = computed(() => {
  if (!sso.value) return baseUrl.value
  const sep = baseUrl.value.includes('?') ? '&' : '?'
  return `${baseUrl.value}${sep}_sso=1&proj=${encodeURIComponent(props.projectName)}&token=${token.value}`
})

const onReload = () => {
  loading.value = true
  const f = document.querySelector('.ibgi-frame')
  if (f) f.src = frameSrc.value
}
const onOpenWin = () => window.open(frameSrc.value, '_blank')
const onFrameLoad = () => { loading.value = false }
</script>

<template>
  <div class="ibgi-pane">
    <!-- 工具条 -->
    <div class="ib-toolbar">
      <el-radio-group v-model="mode" size="small">
        <el-radio-button value="real">实连 i北勘</el-radio-button>
        <el-radio-button value="schematic">示意图</el-radio-button>
      </el-radio-group>
      <template v-if="mode === 'real'">
        <el-switch v-model="sso" inline-prompt active-text="SSO" inactive-text="未登录" />
        <el-button :icon="Refresh" size="small" @click="onReload">刷新</el-button>
        <el-button :icon="Open" size="small" @click="onOpenWin">新窗口</el-button>
      </template>
    </div>

    <!-- banner -->
    <div v-if="mode === 'real'" class="ib-banner" :class="{ sso }">
      <el-icon><Lock v-if="!sso" /><Link v-else /></el-icon>
      <span v-if="!sso">外部对接 · 未注入登录态，下方将显示 i北勘 登录页（真实联调需 i北勘 提供 SSO/免登接口）</span>
      <span v-else>SSO 演示 · 已注入 token={{ token }}（机制演示，真实免登需 i北勘 配合支持该参数）</span>
    </div>

    <!-- 实连 iframe -->
    <div v-if="mode === 'real'" class="ib-frame-wrap">
      <div v-if="loading" class="ib-loading">正在加载 i北勘 项目工作台…</div>
      <iframe :src="frameSrc" class="ibgi-frame" title="i北勘" @load="onFrameLoad" />
    </div>

    <!-- 示意图：复刻 projHome 登录后工作台 -->
    <div v-else class="ib-schematic">
      <div class="sc-topbar">
        <span class="sc-logo">i北勘</span>
        <span class="sc-proj">{{ projectName || '勘察工程' }}</span>
        <span class="sc-user">{{ userName || '演示用户' }} · {{ roleTitle || '项目成员' }}</span>
      </div>
      <div class="sc-body">
        <div class="sc-left">
          <div class="sc-tabs">
            <div class="sc-tab active">项目</div>
            <div class="sc-tab">工程</div>
            <div class="sc-tab">GIS地图</div>
          </div>
          <div class="sc-table">
            <div class="sc-th">
              <span>项目编号</span><span>项目名称</span><span>类别</span><span>状态</span>
            </div>
            <div v-for="(r,i) in 6" :key="i" class="sc-tr">
              <span>BGI-2026-{{ 100+i }}</span>
              <span>{{ ['山区复杂地质建模','地铁17号线勘察','CBD高层地基','水库坝基勘察','市政道路改扩建','跨河桥梁勘察'][i] }}</span>
              <span>{{ ['市政','轨道','建筑','水利','市政','交通'][i] }}</span>
              <span class="st">{{ ['内业','勘探','待审','纲要','内业','放线'][i] }}</span>
            </div>
          </div>
        </div>
        <div class="sc-right">
          <div class="sr-title">工程详情</div>
          <div class="sr-row"><label>工程名称</label><span>{{ projectName }}</span></div>
          <div class="sr-row"><label>工程类别</label><span>市政勘察</span></div>
          <div class="sr-row"><label>当前阶段</label><span>内业整理</span></div>
          <div class="sr-row"><label>勘探点数</label><span>4 个</span></div>
          <div class="sr-mini">
            <div class="sm-title">业务进度</div>
            <div class="sm-bar"><span style="width:72%"></span></div>
            <div class="sm-tags">
              <span>野外勘探 ✓</span><span>内业整理 进行中</span><span>产品交付</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ibgi-pane { position: absolute; inset: 0; display: flex; flex-direction: column; background: var(--app-bg); }
.ib-toolbar { display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: var(--header-bg); border-bottom: 1px solid var(--border); }
.ib-banner { display: flex; align-items: center; gap: 6px; padding: 7px 12px; font-size: 12px; background: rgba(245,158,11,0.12); border-bottom: 1px solid rgba(245,158,11,0.3); color: #fbbf24; }
.ib-banner.sso { background: rgba(16,185,129,0.12); border-color: rgba(16,185,129,0.3); color: #34d399; }
.ib-frame-wrap { flex: 1; position: relative; }
.ibgi-frame { width: 100%; height: 100%; border: none; background: #fff; }
.ib-loading { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: var(--text-dim); background: var(--app-bg); z-index: 2; }

.ib-schematic { flex: 1; display: flex; flex-direction: column; background: #f5f6f8; overflow: auto; }
.sc-topbar { height: 46px; background: #fff; border-bottom: 1px solid #e5e7eb; display: flex; align-items: center; padding: 0 16px; gap: 16px; }
.sc-logo { color: #c8322f; font-weight: 700; font-size: 16px; }
.sc-proj { color: #1f2937; font-size: 14px; font-weight: 600; }
.sc-user { margin-left: auto; color: #6b7280; font-size: 12px; }
.sc-body { flex: 1; display: flex; gap: 1px; background: #e5e7eb; }
.sc-left { flex: 1.6; background: #fff; display: flex; flex-direction: column; }
.sc-tabs { display: flex; border-bottom: 1px solid #e5e7eb; }
.sc-tab { padding: 10px 18px; color: #6b7280; font-size: 13px; cursor: pointer; border-bottom: 2px solid transparent; }
.sc-tab.active { color: #c8322f; border-color: #c8322f; font-weight: 600; }
.sc-table { flex: 1; overflow: auto; }
.sc-th, .sc-tr { display: grid; grid-template-columns: 100px 1fr 70px 70px; padding: 8px 14px; font-size: 12px; }
.sc-th { background: #f9fafb; color: #6b7280; font-weight: 600; }
.sc-tr { border-bottom: 1px solid #f3f4f6; color: #1f2937; }
.sc-tr .st { color: #c8322f; }
.sc-right { flex: 1; background: #fff; padding: 16px; }
.sr-title { color: #1f2937; font-size: 14px; font-weight: 700; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #f3f4f6; }
.sr-row { display: flex; padding: 6px 0; font-size: 12px; }
.sr-row label { width: 80px; color: #9ca3af; }
.sr-row span { color: #1f2937; }
.sr-mini { margin-top: 16px; padding: 12px; background: #f9fafb; border-radius: 6px; }
.sm-title { color: #6b7280; font-size: 12px; font-weight: 600; margin-bottom: 8px; }
.sm-bar { height: 6px; background: #e5e7eb; border-radius: 3px; overflow: hidden; }
.sm-bar span { display: block; height: 100%; background: #c8322f; }
.sm-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px; }
.sm-tags span { padding: 2px 8px; background: #fff; border: 1px solid #e5e7eb; border-radius: 4px; color: #6b7280; font-size: 11px; }
</style>
