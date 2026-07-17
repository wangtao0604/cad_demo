import { computed, ref } from 'vue'

const STORAGE_KEY = 'cad-demo-theme'
const theme = ref('dark')
let classObserver

const normalizeTheme = (value) => value === 'light' ? 'light' : 'dark'

const applyTheme = (value) => {
  const next = normalizeTheme(value)
  theme.value = next
  document.documentElement.dataset.theme = next
  document.documentElement.classList.toggle('dark', next === 'dark')
}

const observeExternalThemeChanges = () => {
  if (classObserver) return
  classObserver = new MutationObserver(() => {
    const shouldBeDark = theme.value === 'dark'
    if (document.documentElement.classList.contains('dark') !== shouldBeDark) {
      document.documentElement.classList.toggle('dark', shouldBeDark)
    }
  })
  classObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  })
}

export const initializeTheme = () => {
  let saved = 'dark'
  try {
    saved = localStorage.getItem(STORAGE_KEY) || 'dark'
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
  applyTheme(saved)
  observeExternalThemeChanges()
}

export const useTheme = () => {
  const isDark = computed(() => theme.value === 'dark')

  const setTheme = (value) => {
    const next = normalizeTheme(value)
    applyTheme(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // The active theme still applies for the current session.
    }
  }

  const toggleTheme = () => setTheme(isDark.value ? 'light' : 'dark')

  return { theme, isDark, setTheme, toggleTheme }
}
