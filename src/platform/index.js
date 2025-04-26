const platform = {
  current: process.env.PLATFORM,
  isAndroid: process.env.PLATFORM == 'android',
  isIOS: process.env.PLATFORM == 'ios',
  isCapacitor: process.env.PLATFORM == 'android' || process.env.PLATFORM == 'ios',
  isTauri: process.env.PLATFORM == 'tauri',
  isElectron: process.env.PLATFORM == 'electron',
}

export default platform
