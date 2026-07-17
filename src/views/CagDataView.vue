<script setup>
import { computed, reactive, ref, watch } from 'vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, List, Plus } from '@element-plus/icons-vue'
import { useAppStore } from '../store/useAppStore'

const props = defineProps({ command: { type: String, default: 'cag-view-borehole' } })
const emit = defineEmits(['select'])
const {
  cagDatasets, cagLoading, loadCagDataset,
  createCagRow, updateCagRow, deleteCagRows,
} = useAppStore()

const tabs = [
  { id:'cag-view-layer', label:'综合分层' },
  { id:'cag-view-borehole', label:'钻孔信息' },
  { id:'cag-view-geology', label:'地质描述' },
  { id:'cag-view-water', label:'水位信息' },
  { id:'cag-view-soil', label:'常规土试' },
  { id:'cag-view-special-soil', label:'特殊土试' },
  { id:'cag-view-demo-test', label:'岩石实验' },
  { id:'cag-view-water-quality', label:'水质分析' },
  { id:'cag-view-soluble-salt', label:'水的易溶盐' },
]

const configs = {
  'cag-view-borehole': {
    columns: [
      ['id','序号',58], ['favorite','收藏',64], ['code','钻孔编号',130], ['type','钻孔类型',210],
      ['elevation','孔口标高(m)',130], ['depth','钻孔深度(m)',130], ['date','勘探钻孔日期',190],
      ['layerAction','地层信息',100], ['waterAction','水位信息',100],
    ],
  },
  'cag-view-layer': {
    columns: [['id','序号',70],['code','钻孔编号',130],['layer','层号',90],['name','土层名称',180],['bottom','层底标高(m)',140],['thickness','厚度(m)',120],['description','岩土描述',360],['status','状态',100]],
  },
  'cag-view-geology': {
    columns: [['id','序号',70],['code','钻孔编号',130],['range','深度范围(m)',160],['name','岩土名称',160],['color','颜色',110],['density','密实度',120],['description','地质描述',520]],
  },
  'cag-view-water': {
    columns: [['id','序号',70],['code','钻孔编号',150],['initial','初见水位(m)',160],['stable','稳定水位(m)',160],['elevation','水位标高(m)',160],['date','观测日期',200],['note','备注',420]],
  },
  'cag-view-soil': {
    columns: [['id','序号',70],['code','样品编号',150],['test','试验项目',220],['moisture','含水率(%)',150],['density','密度(g/cm³)',150],['voidRatio','孔隙比',130],['status','试验状态',150],['report','报告',100]],
  },
  'cag-view-special-soil': {
    columns: [['id','序号',70],['code','样品编号',150],['test','特殊试验',260],['value','试验值',140],['unit','单位',110],['date','完成日期',180],['status','状态',130],['report','报告',100]],
  },
  'cag-view-demo-test': {
    columns: [['id','序号',70],['code','试验编号',150],['name','试验名称',220],['instrument','试验仪器',240],['operator','试验人员',140],['date','试验时间',190],['status','状态',130],['record','记录',100]],
  },
  'cag-view-water-quality': {
    columns: [['id','序号',70],['code','水样编号',150],['ph','pH值',110],['hardness','总硬度(mg/L)',170],['chloride','氯离子(mg/L)',170],['sulfate','硫酸根(mg/L)',170],['date','检测日期',180],['report','报告',100]],
  },
  'cag-view-soluble-salt': {
    columns: [['id','序号',70],['code','样品编号',150],['total','易溶盐总量(%)',180],['carbonate','碳酸根(%)',160],['chloride','氯离子(%)',160],['sulfate','硫酸根(%)',160],['status','状态',130],['report','报告',100]],
  },
}

const activeCommand = ref(configs[props.command] ? props.command : 'cag-view-borehole')
const page = ref(1)
const pageSize = ref(10)
const config = computed(() => configs[activeCommand.value])
const allRows = computed(() => cagDatasets[activeCommand.value] || [])
const rows = computed(() => allRows.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))
const selectedRows = ref([])
const editorVisible = ref(false)
const editingRow = ref(null)
const editorForm = reactive({})
const saving = ref(false)
const actionFields = new Set(['favorite', 'layerAction', 'waterAction', 'report', 'record'])
const editableColumns = computed(() => config.value.columns.filter(([key]) => key !== 'id' && !actionFields.has(key)))
const editorTitle = computed(() => editingRow.value ? '编辑数据' : '新增数据')

const resetEditorForm = (row = {}) => {
  Object.keys(editorForm).forEach((key) => delete editorForm[key])
  editableColumns.value.forEach(([key]) => { editorForm[key] = row[key] ?? '' })
}

const openAdd = () => {
  editingRow.value = null
  resetEditorForm()
  editorVisible.value = true
}

const openEdit = (row) => {
  editingRow.value = row
  resetEditorForm(row)
  editorVisible.value = true
}

const saveEditor = async () => {
  const requiredKey = editableColumns.value[0]?.[0]
  if (requiredKey && !String(editorForm[requiredKey] ?? '').trim()) {
    ElMessage.warning(`请填写${editableColumns.value[0][1]}`)
    return
  }
  saving.value = true
  try {
    if (editingRow.value) {
      await updateCagRow(activeCommand.value, editingRow.value.id, { ...editorForm })
      ElMessage.success('数据已更新')
    } else {
      await createCagRow(activeCommand.value, { ...editorForm })
      page.value = Math.ceil(allRows.value.length / pageSize.value)
      ElMessage.success('数据已新增')
    }
    editorVisible.value = false
  } catch (error) {
    ElMessage.error(error.message || '数据保存失败')
  } finally {
    saving.value = false
  }
}

const removeRows = async (targets) => {
  if (!targets.length) return
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${targets.length} 条数据吗？`, '删除确认', {
      type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消',
    })
  } catch { return }
  try {
    await deleteCagRows(activeCommand.value, targets.map((row) => row.id))
    selectedRows.value = []
    const maxPage = Math.max(1, Math.ceil(allRows.value.length / pageSize.value))
    page.value = Math.min(page.value, maxPage)
    ElMessage.success('数据已删除')
  } catch (error) {
    ElMessage.error(error.message || '数据删除失败')
  }
}

watch(() => props.command, (command) => {
  if (configs[command]) activeCommand.value = command
})
watch(activeCommand, async (command) => {
  page.value = 1
  selectedRows.value = []
  emit('select', tabs.find((tab) => tab.id === command)?.label || '数据查看')
  try {
    await loadCagDataset(command)
  } catch (error) {
    ElMessage.error(error.message || '数据加载失败')
  }
}, { immediate: true })
watch(pageSize, () => { page.value = 1 })
</script>

<template>
  <el-config-provider :locale="zhCn">
    <div class="cag-data-view">
      <div class="cag-data-surface">
        <el-tabs v-model="activeCommand" class="data-tabs">
          <el-tab-pane v-for="tab in tabs" :key="tab.id" :label="tab.label" :name="tab.id" />
        </el-tabs>

        <div class="data-title">
          <el-icon class="data-title-icon"><List /></el-icon>
          <span>数据列表</span>
          <div class="data-actions">
            <el-button type="primary" :icon="Plus" @click="openAdd">新增</el-button>
            <el-button :icon="Delete" :disabled="!selectedRows.length" @click="removeRows(selectedRows)">删除</el-button>
          </div>
        </div>

        <el-table
          :data="rows"
          v-loading="cagLoading[activeCommand]"
          stripe
          border
          height="calc(100% - 128px)"
          class="data-table"
          @selection-change="(selection) => (selectedRows = selection)"
        >
          <el-table-column type="selection" width="48" align="center" />
          <el-table-column
            v-for="column in config.columns"
            :key="column[0]"
            :prop="column[0]"
            :label="column[1]"
            :min-width="column[2]"
            align="center"
            show-overflow-tooltip
          >
            <template #default="scope">
              <el-button v-if="['查看'].includes(scope.row[column[0]])" link type="primary">查看</el-button>
              <span v-else :class="{ favorite: column[0] === 'favorite' }">{{ scope.row[column[0]] }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="130" fixed="right" align="center">
            <template #default="scope">
              <el-button link type="primary" :icon="Edit" @click="openEdit(scope.row)">编辑</el-button>
              <el-button link type="danger" :icon="Delete" @click="removeRows([scope.row])">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="data-pagination">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            :total="allRows.length"
            layout="total, sizes, prev, pager, next, jumper"
            background
          />
        </div>
      </div>

      <el-dialog v-model="editorVisible" :title="editorTitle" width="560px" align-center destroy-on-close>
        <el-form label-position="right" label-width="120px" class="editor-form">
          <el-form-item v-for="column in editableColumns" :key="column[0]" :label="column[1]">
            <el-input
              v-model="editorForm[column[0]]"
              :type="column[0] === 'description' || column[0] === 'note' ? 'textarea' : 'text'"
              :rows="3"
              clearable
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="editorVisible = false">取消</el-button>
          <el-button type="primary" :loading="saving" @click="saveEditor">保存</el-button>
        </template>
      </el-dialog>
    </div>
  </el-config-provider>
</template>

<style scoped>
.cag-data-view {
  --el-bg-color: #fff;
  --el-bg-color-overlay: #fff;
  --el-fill-color: #f1f3f7;
  --el-fill-color-blank: #fff;
  --el-fill-color-light: #f4f6fa;
  --el-fill-color-lighter: #f7f8fb;
  --el-text-color-primary: #3e4654;
  --el-text-color-regular: #5b6370;
  --el-border-color: #e2e6ee;
  flex: 1;
  min-height: 0;
  height: auto;
  padding: 12px;
  background: #eef1f7;
  color: #424957;
}
.cag-data-surface { height: 100%; padding: 0 14px 14px; background: #fff; border: 1px solid #e2e6ee; box-shadow: 0 2px 8px rgba(35,47,70,0.08); overflow: hidden; }
.data-tabs { height: 48px; }
:deep(.data-tabs .el-tabs__header) { margin: 0; }
:deep(.data-tabs .el-tabs__nav-wrap) { padding: 0; }
:deep(.data-tabs .el-tabs__item) { height: 48px; padding: 0 20px; color: #4b5362; font-weight: 600; }
:deep(.data-tabs .el-tabs__item.is-active) { color: #409eff; }
.data-title { height: 52px; display: flex; align-items: center; gap: 9px; color: #3e4654; font-size: 16px; font-weight: 700; }
.data-title-icon { color: #409eff; font-size: 20px; }
.data-actions { margin-left: auto; display: flex; gap: 8px; }
.editor-form { max-height: 58vh; padding-right: 8px; overflow: auto; }
.data-table {
  width: 100%;
  background: #fff;
  --el-table-bg-color: #fff;
  --el-table-tr-bg-color: #fff;
  --el-table-header-bg-color: #edf0f7;
  --el-table-row-hover-bg-color: #eef6ff;
  --el-table-border-color: #e2e6ee;
  --el-table-text-color: #5b6370;
  --el-table-header-text-color: #505866;
}
:deep(.data-table .el-table__body-wrapper),
:deep(.data-table .el-scrollbar__view) { background: #fff; }
:deep(.data-table th.el-table__cell) { height: 48px; font-weight: 700; }
:deep(.data-table td.el-table__cell) { height: 48px; }
.favorite { color: #9aa2af; font-size: 19px; }
.data-pagination { height: 58px; display: flex; align-items: center; justify-content: flex-end; }
:deep(.data-pagination .el-select__wrapper),
:deep(.data-pagination .el-input__wrapper) { background: #fff; }
</style>
