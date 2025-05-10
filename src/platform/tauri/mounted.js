import * as os from '@tauri-apps/plugin-os'
import { CURRENT_APP_VERSION } from '@/consts'
import { trackEvent } from '@/utils'

export async function onMounted() {
  trackEvent('Tauri App Mounted', {
    ver: CURRENT_APP_VERSION,
    device: [
      os.type(),
      os.version(),
      os.arch(),
      await os.locale(),
    ].join('_'),
  })
}
