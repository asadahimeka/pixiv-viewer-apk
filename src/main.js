import platform from '@/platform'

setupApp()

async function setupApp() {
  document.documentElement.classList.add(platform.current)
  if (platform.isCapacitor) {
    await import('@/platform/capacitor/init')
  }
  if (platform.isTauri) {
    await import('@/platform/tauri/init')
  }
}
