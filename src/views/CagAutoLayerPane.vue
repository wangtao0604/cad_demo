<script setup>
import { ref } from 'vue'
import { Download, Document, Grid, Operation, RefreshRight } from '@element-plus/icons-vue'

const activeStep = ref('加载数据')
const activeInfo = ref('分层信息')
const activeTest = ref('土工试验')
const layerMode = ref('elevation')
const stratumCode = ref('')
const fourthLayerThickness = ref('')

const steps = ['加载数据', '剖面信息', '粗略分层', '详细分层', '分层设置']
const infoTabs = ['分层信息', '钻孔分层']
const testTabs = ['土工试验', '标贯', '重型动探', '波速']
</script>

<template>
  <div class="auto-layer-page">
    <div class="auto-layer-window">
      <div class="window-title">
        <span class="title-mark"><el-icon><Operation /></el-icon></span>
        <span>自动分层</span>
      </div>

      <div class="step-tabs">
        <button
          v-for="step in steps"
          :key="step"
          type="button"
          :class="{ active: activeStep === step }"
          @click="activeStep = step"
        >{{ step }}</button>
      </div>

      <section class="layer-section">
        <div class="mini-tabs">
          <button v-for="tab in infoTabs" :key="tab" type="button" :class="{ active: activeInfo === tab }" @click="activeInfo = tab">{{ tab }}</button>
        </div>
        <div class="table-frame layer-table">
          <div class="table-head layer-head"><span>地层编号</span><span>年代</span><span>岩性</span></div>
          <div class="empty-table"><el-icon><Grid /></el-icon><span>暂无分层数据</span></div>
        </div>
      </section>

      <fieldset class="statistics-section">
        <legend>统计数据</legend>
        <div class="stratum-select">
          <label>地层编号：</label>
          <el-select v-model="stratumCode" placeholder="请选择地层" clearable>
            <el-option label="第 1 层" value="1" />
            <el-option label="第 2 层" value="2" />
            <el-option label="第 3 层" value="3" />
          </el-select>
        </div>
        <div class="mini-tabs test-tabs">
          <button v-for="tab in testTabs" :key="tab" type="button" :class="{ active: activeTest === tab }" @click="activeTest = tab">{{ tab }}</button>
        </div>
        <div class="table-frame test-table">
          <div class="table-head test-head">
            <span>取土编号</span><span>取土深度</span><span>土样颜色</span><span>岩土分类</span>
            <span>天然含水率</span><span>天然密度</span><span>饱和度</span><span>孔隙比</span><span>塑限</span>
          </div>
          <div class="empty-table"><el-icon><Document /></el-icon><span>请选择地层查看统计数据</span></div>
        </div>
      </fieldset>

      <div class="detail-actions">
        <el-button>详细分层</el-button>
        <label>第四纪分层厚度字符串：</label>
        <el-input v-model="fourthLayerThickness" placeholder="例如：2,4,6" />
        <span class="detail-note">注：当地层厚度深于该字符串时，其下地层默认采用字符串中最后一层分层厚度。</span>
        <el-button type="primary" plain>出表</el-button>
      </div>

      <div class="bottom-actions">
        <el-button class="export-button" :icon="Download">导出分层成果（可导入三维地质软件）</el-button>
        <fieldset class="mode-field">
          <legend>分层方式</legend>
          <el-radio-group v-model="layerMode">
            <el-radio value="elevation">按标高</el-radio>
            <el-radio value="depth">按深度</el-radio>
          </el-radio-group>
        </fieldset>
        <div class="progress-block">
          <span>进度：</span>
          <el-progress :percentage="0" :show-text="false" />
        </div>
        <el-button :icon="RefreshRight" type="primary">开始分层</el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auto-layer-page {
  --el-bg-color: #fff; --el-bg-color-overlay: #fff; --el-fill-color-blank: #fff;
  --el-text-color-primary: #28313c; --el-text-color-regular: #48525f; --el-border-color: #c9d1dc;
  flex: 1; min-height: 0; padding: 12px; overflow: auto; color: #242b34; background: #e8ecf2;
}
.auto-layer-window { min-width: 820px; height: 100%; min-height: 610px; display: flex; flex-direction: column; border: 1px solid #9ca9b9; background: #f7f8fa; box-shadow: 0 2px 10px rgba(25,37,55,.12); }
.window-title { height: 34px; flex-shrink: 0; display: flex; align-items: center; gap: 8px; padding: 0 10px; color: #fff; background: #2da7df; font-size: 14px; font-weight: 600; }
.title-mark { width: 22px; height: 22px; display: grid; place-items: center; color: #2089bd; background: #e9fbff; }
.step-tabs, .mini-tabs { height: 32px; display: flex; align-items: end; padding: 0 5px; border-bottom: 1px solid #aeb8c4; background: #f4f5f7; }
.step-tabs button, .mini-tabs button { height: 27px; padding: 0 12px; border: 1px solid transparent; border-bottom: 0; background: transparent; color: #29323d; cursor: pointer; }
.step-tabs button.active, .mini-tabs button.active { border-color: #aeb8c4; background: #fff; color: #137db3; font-weight: 600; }
.layer-section { margin: 6px 6px 0; }
.mini-tabs { height: 26px; padding-left: 0; background: transparent; }
.mini-tabs button { height: 25px; padding: 0 10px; }
.table-frame { border: 1px solid #7fa3c8; background: #fff; }
.layer-table { height: 180px; }
.table-head { height: 26px; display: grid; align-items: center; background: linear-gradient(#fff, #edf1f5); border-bottom: 1px solid #cbd3dc; font-size: 12px; }
.table-head span { height: 100%; display: flex; align-items: center; padding: 0 7px; border-right: 1px solid #d6dce3; }
.layer-head { grid-template-columns: 18% 23% 1fr; }
.empty-table { height: calc(100% - 26px); display: flex; align-items: center; justify-content: center; gap: 8px; color: #adb4be; font-size: 13px; }
.empty-table .el-icon { font-size: 22px; }
.statistics-section { flex: 1; min-height: 225px; margin: 6px; padding: 3px 6px 6px; border: 1px solid #bdc7d3; }
.statistics-section legend, .mode-field legend { padding: 0 5px; font-size: 12px; }
.stratum-select { height: 38px; display: flex; align-items: center; gap: 8px; font-size: 12px; }
.stratum-select :deep(.el-select) { width: 180px; }
.test-tabs { margin-top: 0; border-bottom-color: #7fa3c8; }
.test-table { height: calc(100% - 67px); min-height: 130px; }
.test-head { grid-template-columns: repeat(9, minmax(82px, 1fr)); }
.detail-actions { min-height: 62px; display: grid; grid-template-columns: 130px 205px 170px 1fr 82px; grid-template-rows: 32px 24px; align-items: center; gap: 0 10px; padding: 3px 9px; }
.detail-actions > label { text-align: right; font-size: 12px; font-weight: 600; }
.detail-actions :deep(.el-input) { width: 150px; }
.detail-note { grid-column: 2 / 5; font-size: 12px; }
.bottom-actions { min-height: 64px; display: grid; grid-template-columns: 230px 230px minmax(180px, 1fr) 110px; gap: 8px; align-items: stretch; padding: 6px; border-top: 1px solid #aeb8c4; background: #f1f3f6; }
.export-button { height: 100%; white-space: normal; }
.mode-field { margin: 0; border: 1px solid #aeb8c4; }
.mode-field :deep(.el-radio-group) { width: 100%; height: 38px; justify-content: space-around; }
.progress-block { display: grid; grid-template-columns: 42px 1fr; align-items: center; font-size: 12px; }
.progress-block :deep(.el-progress) { width: 100%; }
@media (max-height: 760px) {
  .layer-table { height: 140px; }
  .statistics-section { min-height: 190px; }
}
</style>
