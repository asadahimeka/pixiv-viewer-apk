import { App } from '@capacitor/app'
import { Device } from '@capacitor/device'

export const CURRENT_WEB_VERSION = 'v1.17.5'

/** @type {import('@capacitor/app').AppInfo} */
let appInfo = null
export async function getAppInfo() {
  if (!appInfo) appInfo = await App.getInfo()
  return appInfo
}

/** @type {import('@capacitor/device').DeviceInfo} */
let deviceInfo = null
export async function getDeviceInfo() {
  if (!deviceInfo) deviceInfo = await Device.getInfo()
  return deviceInfo
}
