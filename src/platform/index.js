const platform = {
  current: process.env.VUE_APP_PLATFORM,
  isAndroid: process.env.VUE_APP_PLATFORM == 'android',
  isIOS: process.env.VUE_APP_PLATFORM == 'ios',
  isCapacitor: process.env.VUE_APP_PLATFORM == 'android' || process.env.VUE_APP_PLATFORM == 'ios',
  isTauri: process.env.VUE_APP_PLATFORM == 'tauri',
  isElectron: process.env.VUE_APP_PLATFORM == 'electron',
}

export default platform
