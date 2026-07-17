<script setup>
/**
 * 登录页 · 一体化平台
 * 深色 + 品牌红强调；选择演示人员，项目角色在进入项目后确定
 */
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Lock, Key, Right, Connection } from '@element-plus/icons-vue'
import { useAppStore } from '../store/useAppStore'
import ThemeToggle from '../components/ThemeToggle.vue'

const { personaList, projects, roleDefinitions, login } = useAppStore()

const form = ref({ account: 'admin', password: '123456', captcha: '' })
const captchaCode = ref('8K3M')
const selectedRole = ref('leader')
const loading = ref(false)

const currentPersona = computed(() => personaList.find((p) => p.id === selectedRole.value) || personaList[0] || {})
const roleIdsForPersona = (persona = {}) => [...new Set(projects.map((project) => (
  project.userRoles?.[persona.id] || persona.defaultRole
)).filter(Boolean))]
const roleTitlesForPersona = (persona) => roleIdsForPersona(persona)
  .map((roleId) => roleDefinitions[roleId]?.title)
  .filter(Boolean)
const isHighlightedMultiRole = (persona) => roleIdsForPersona(persona).length >= 3
const currentPersonaDesc = computed(() => {
  if (!isHighlightedMultiRole(currentPersona.value)) return currentPersona.value.desc || ''
  return `跨项目角色：${roleTitlesForPersona(currentPersona.value).join(' / ')}`
})

const refreshCaptcha = () => {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  captchaCode.value = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

const onLogin = async () => {
  if (!form.value.account || !form.value.password) {
    ElMessage.warning('请输入账号和密码')
    return
  }
  loading.value = true
  try {
    await login({
      account: form.value.account,
      password: form.value.password,
      captcha: form.value.captcha,
      personaId: selectedRole.value,
    })
    ElMessage.success(`欢迎，${currentPersona.value.name}`)
  } catch (error) {
    ElMessage.error(error.message || '登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <ThemeToggle class="login-theme-toggle" />
    <!-- 左侧品牌区 -->
    <div class="login-brand">
      <div class="brand-logo">
        <div class="logo-mark">勘</div>
        <div class="logo-text">
          <div class="lt-title">勘察一体化平台</div>
          <div class="lt-sub">INTEGRATED SURVEY & 3D GEO-MODELING PLATFORM</div>
        </div>
      </div>
      <div class="brand-slogan">
        <h1>山区复杂地质<br/>三维建模与勘察一体化</h1>
        <p>流程驱动 · 角色协同 · 成果贯通</p>
      </div>
      <!-- 流程主线装饰 -->
      <div class="brand-flow">
        <div v-for="(s, i) in ['启动','纲要','辨识','放线','勘探','内业','交付']" :key="i" class="bf-node">
          <span class="bf-dot">{{ s }}</span>
          <span v-if="i < 6" class="bf-line" />
        </div>
      </div>
      <div class="brand-footer">BGI · 北京勘察设计研究院</div>
    </div>

    <!-- 右侧登录卡片 -->
    <div class="login-card">
      <div class="lc-head">
        <div class="lc-title">账号登录</div>
        <div class="lc-sub">请选择演示人员，项目角色将在进入项目后确定</div>
      </div>

      <!-- 演示人员选择 -->
      <div class="role-grid">
        <div
          v-for="p in personaList"
          :key="p.id"
          class="role-chip"
          :class="{ active: selectedRole === p.id }"
          @click="selectedRole = p.id"
        >
          <span class="rc-avatar">{{ p.avatar }}</span>
          <span class="rc-info">
            <span class="rc-title">{{ p.title }}</span>
            <span class="rc-name">{{ p.name }}</span>
          </span>
          <el-tooltip
            v-if="isHighlightedMultiRole(p)"
            :content="roleTitlesForPersona(p).join(' / ')"
            placement="top"
          >
            <span class="rc-multi-role"><el-icon><Connection /></el-icon>3种角色</span>
          </el-tooltip>
        </div>
      </div>

      <!-- 当前角色说明 -->
      <div class="role-desc">
        <span class="rd-tag" :class="{ 'is-multi': isHighlightedMultiRole(currentPersona) }">{{ currentPersonaDesc }}</span>
      </div>

      <!-- 登录表单 -->
      <div class="lc-form">
        <el-input v-model="form.account" size="large" placeholder="账号" :prefix-icon="User" />
        <el-input v-model="form.password" size="large" type="password" placeholder="密码" :prefix-icon="Lock" show-password />
        <div class="captcha-row">
          <el-input v-model="form.captcha" size="large" placeholder="验证码" :prefix-icon="Key" />
          <div class="captcha-box" @click="refreshCaptcha">{{ captchaCode }}</div>
        </div>
      </div>

      <div class="lc-options">
        <el-checkbox>记住账号</el-checkbox>
        <el-link type="primary" :underline="false">忘记密码？</el-link>
      </div>

      <el-button
        type="primary"
        size="large"
        class="lc-btn"
        :loading="loading"
        @click="onLogin"
      >
        进入工作台
        <el-icon class="el-icon--right"><Right /></el-icon>
      </el-button>

      <div class="lc-foot">© 2026 勘察一体化平台 · 演示原型</div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  position: fixed;
  inset: 0;
  display: flex;
  background: #0f1117;
  overflow: auto;
}
.login-theme-toggle { position: fixed; top: 18px; right: 20px; z-index: 5; }
/* 左侧品牌区 */
.login-brand {
  flex: 1.2;
  min-width: 480px;
  position: relative;
  padding: 48px 56px;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at 20% 30%, rgba(200, 50, 47, 0.18), transparent 55%),
    radial-gradient(circle at 80% 70%, rgba(120, 40, 40, 0.14), transparent 55%),
    linear-gradient(160deg, #15121a 0%, #1c1416 60%, #0f1117 100%);
  overflow: hidden;
}
.login-brand::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
}
.brand-logo { display: flex; align-items: center; gap: 14px; position: relative; }
.logo-mark {
  width: 46px; height: 46px; border-radius: 10px;
  background: linear-gradient(135deg, #c8322f, #8a1f1d);
  color: #fff; font-size: 24px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 6px 18px rgba(200, 50, 47, 0.4);
}
.lt-title { color: #fff; font-size: 20px; font-weight: 700; letter-spacing: 1px; }
.lt-sub { color: rgba(255,255,255,0.45); font-size: 10px; letter-spacing: 1.5px; margin-top: 2px; }
.brand-slogan { margin-top: 72px; position: relative; }
.brand-slogan h1 { color: #fff; font-size: 38px; line-height: 1.35; font-weight: 800; margin: 0; }
.brand-slogan h1 br + * { color: #e8a0a0; }
.brand-slogan p { color: rgba(255,255,255,0.6); font-size: 15px; margin: 18px 0 0; letter-spacing: 2px; }
.brand-flow { margin-top: 56px; display: flex; align-items: center; position: relative; flex-wrap: wrap; gap: 0; }
.bf-node { display: flex; align-items: center; }
.bf-dot {
  width: 38px; height: 38px; border-radius: 50%;
  background: rgba(200, 50, 47, 0.15);
  border: 1px solid rgba(200, 50, 47, 0.5);
  color: #e8a0a0; font-size: 12px;
  display: flex; align-items: center; justify-content: center;
}
.bf-line { width: 22px; height: 1px; background: rgba(200, 50, 47, 0.4); }
.brand-footer { margin-top: auto; color: rgba(255,255,255,0.3); font-size: 12px; position: relative; }

/* 右侧登录卡片 */
.login-card {
  width: 440px;
  min-width: 440px;
  background: #1a1d26;
  border-left: 1px solid rgba(255,255,255,0.06);
  padding: 40px 44px;
  display: flex;
  flex-direction: column;
}
.lc-head { margin-bottom: 22px; }
.lc-title { color: #fff; font-size: 22px; font-weight: 700; }
.lc-sub { color: rgba(255,255,255,0.45); font-size: 13px; margin-top: 6px; }

.role-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-bottom: 14px;
}
.role-chip {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: 8px;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.06);
  cursor: pointer; transition: all 0.18s;
}
.role-chip:hover { background: rgba(255,255,255,0.06); border-color: rgba(200,50,47,0.3); }
.role-chip.active {
  background: rgba(200, 50, 47, 0.14);
  border-color: #c8322f;
  box-shadow: 0 0 0 1px rgba(200,50,47,0.4) inset;
}
.rc-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: linear-gradient(135deg, #3a3f4e, #2a2e3a);
  color: #e0e4ed; font-size: 13px; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.role-chip.active .rc-avatar { background: linear-gradient(135deg, #c8322f, #8a1f1d); color: #fff; }
.rc-info { display: flex; flex-direction: column; min-width: 0; }
.rc-title { color: #e0e4ed; font-size: 12px; font-weight: 600; }
.rc-name { color: rgba(255,255,255,0.4); font-size: 11px; }
.rc-multi-role {
  margin-left: auto; flex-shrink: 0;
  display: inline-flex; align-items: center; gap: 3px;
  padding: 3px 5px; border-radius: 4px;
  color: #fbbf24; background: rgba(245,158,11,0.12);
  border: 1px solid rgba(245,158,11,0.36);
  font-size: 9px; font-weight: 700; white-space: nowrap;
}
.rc-multi-role .el-icon { font-size: 11px; }

.role-desc { margin-bottom: 18px; }
.rd-tag {
  display: inline-block; padding: 5px 12px; border-radius: 6px;
  background: rgba(74,158,255,0.1); border: 1px solid rgba(74,158,255,0.3);
  color: #6cb6ff; font-size: 12px;
}
.rd-tag.is-multi {
  color: #fbbf24; background: rgba(245,158,11,0.1);
  border-color: rgba(245,158,11,0.32);
}

.lc-form { display: flex; flex-direction: column; gap: 12px; }
.captcha-row { display: flex; gap: 10px; }
.captcha-row .el-input { flex: 1; }
.captcha-box {
  width: 110px; height: 40px; border-radius: 6px;
  background: linear-gradient(135deg, #2a2630, #1f1c25);
  border: 1px solid rgba(255,255,255,0.1);
  color: #e8a0a0; font-size: 20px; font-weight: 700; letter-spacing: 4px;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; user-select: none; font-style: italic;
}
.lc-options { display: flex; justify-content: space-between; align-items: center; margin: 14px 0 18px; }
.lc-btn {
  width: 100%; height: 44px; font-size: 15px; font-weight: 600;
  background: linear-gradient(135deg, #c8322f, #9a2624);
  border: none;
}
.lc-btn:hover { background: linear-gradient(135deg, #d8423f, #aa3634); }
.lc-foot { margin-top: auto; padding-top: 24px; text-align: center; color: rgba(255,255,255,0.25); font-size: 11px; }
</style>
