import { CURRENT_WEB_VERSION, getAppInfo, getDeviceInfo } from './version'
import { trackEvent } from '@/utils'

export async function onMounted() {
  const appInfo = await getAppInfo()
  const deviceInfo = await getDeviceInfo()
  trackEvent('Capacitor App Mounted', {
    webVer: CURRENT_WEB_VERSION,
    appVer: `${appInfo.version}(${appInfo.build})`,
    webViewVersion: deviceInfo.webViewVersion,
    device: [
      deviceInfo.platform,
      deviceInfo.osVersion,
      deviceInfo.model,
      deviceInfo.manufacturer,
    ].join('_'),
  })
}
