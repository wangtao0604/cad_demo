import { createApp } from 'vue'
import { i18n } from '@mlightcad/cad-viewer'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import '@mlightcad/ribbon/style.css'
import App from './App.vue'
import './style.css'

const app = createApp(App)
app.use(i18n)
app.use(ElementPlus)
// 深色主题：Element Plus dark 模式 + 自定义深色变量
document.documentElement.classList.add('dark')
app.mount('#app')
