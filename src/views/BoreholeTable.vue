<script setup>
import { useAppStore } from '../store/useAppStore'

const { boreholes: boreholeTable, strataColors } = useAppStore()

const fmt = (n, d = 2) => Number(n).toFixed(d)
</script>

<template>
  <div class="view-pad">
    <div class="view-title">钻孔总表</div>
    <div class="view-card">
      <el-table :data="boreholeTable" stripe size="default" style="width:100%">
        <el-table-column prop="code" label="钻孔编号" width="110" />
        <el-table-column label="X 坐标">
          <template #default="{ row }">{{ fmt(row.x) }}</template>
        </el-table-column>
        <el-table-column label="Y 坐标">
          <template #default="{ row }">{{ fmt(row.y) }}</template>
        </el-table-column>
        <el-table-column label="孔口高程(m)">
          <template #default="{ row }">{{ fmt(row.elev) }}</template>
        </el-table-column>
        <el-table-column prop="depth" label="孔深(m)" width="90" />
        <el-table-column label="地下水位(m)">
          <template #default="{ row }">{{ fmt(row.gw, 1) }}</template>
        </el-table-column>
        <el-table-column prop="strata" label="分层数" width="80" />
      </el-table>
    </div>

    <div class="view-card" style="margin-top:14px;">
      <div style="font-size:13px;font-weight:600;margin-bottom:8px;">地层图例</div>
      <div class="legend">
        <div v-for="s in strataColors" :key="s.name" class="legend-item">
          <span class="legend-swatch" :style="{ background: s.color }" />
          <span>{{ s.name }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
