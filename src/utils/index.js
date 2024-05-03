import axios from 'axios'
import { Toast } from 'vant'
import { Clipboard } from '@capacitor/clipboard'
import { FileDownload } from '@himeka/capacitor-plugin-filedownload'
import { Filesystem, Directory } from '@himeka/capacitor-filesystem'
import { StatusBar, Style } from '@capacitor/status-bar'
import writeBlob from 'capacitor-blob-writer'
import { LocalStorage } from './storage'
import { getCache, setCache } from './siteCache'
import { i18n } from '@/i18n'

export function throttleScroll(el, downFn, upFn) {
  let position = el.scrollTop
  let ticking = false
  return function (arg) {
    if (ticking) return
    ticking = true
    window.requestAnimationFrame(() => {
      const scroll = el.scrollTop
      scroll > position ? downFn?.(scroll, arg) : upFn?.(scroll, arg)
      position = scroll
      ticking = false
    })
  }
}

export async function copyText(string, cb, errCb) {
  try {
    await Clipboard.write({ string })
    cb()
  } catch (error) {
    errCb(error)
  }
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function setCookie(name, value, days) {
  let expires = ''
  if (days) {
    const date = new Date()
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000))
    expires = '; expires=' + date.toUTCString()
  }
  document.cookie = name + '=' + (value || '') + expires + '; path=/;Secure'
}

export function getCookie(cname) {
  const name = cname + '='
  const ca = document.cookie.split(';')
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i]
    while (c.charAt(0) == ' ') {
      c = c.substring(1)
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length)
    }
  }
  return ''
}

export function removeCookie(key) {
  document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; Secure`
}

export function objectToQueryString(queryParameters) {
  return queryParameters
    ? Object.entries(queryParameters).reduce(
      (queryString, [key, val]) => {
        const symbol = queryString.length === 0 ? '?' : '&'
        queryString += `${symbol}${key}=${val}`
        return queryString
      },
      ''
    )
    : ''
}

export function isURL(s) {
  return /^https?:\/\/(?:www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_+.~#?&/=]*)$/i.test(s)
}

export async function checkImgAvailable(src) {
  return new Promise((resolve, reject) => {
    let img = document.createElement('img')
    img.referrerPolicy = 'no-referrer'
    img.src = src
    img.onload = () => {
      resolve(true)
      img = null
    }
    img.onerror = () => {
      reject(new Error('Network error.'))
      img = null
    }
  })
}

export async function checkUrlAvailable(url) {
  const res = await axios.get(url, { timeout: 5000 })
  if (res.data) return true
  throw new Error('Resp not ok.')
}

export function replaceValidFilename(str = '') {
  const maxLen = 72
  const strArr = str.split('.')
  const ext = strArr.pop()
  str = strArr.join('').replace(/[\\/|?*:<>'"\s.]/g, '_') + '.' + ext
  if (str.length > maxLen) str = str.slice(-maxLen)
  return str
}

export async function addDownloadHistory(args) {
  const historyList = await getCache('downloads.history') || []
  historyList.unshift({ ...args, date: new Date().toLocaleString() })
  setCache('downloads.history', historyList)
}

const isDirect = LocalStorage.get('PXV_PXIMG_DIRECT', false)
export async function downloadFile(url, fileName, subpath) {
  try {
    fileName = replaceValidFilename(fileName)
    Toast(i18n.t('tip.downloading') + ': ' + fileName)
    if (subpath) fileName = subpath + '/' + fileName

    let res
    let downloadUrl
    if (isDirect && /\.(jpe?g|png)$/.test(url)) {
      const newUrl = new URL(url)
      newUrl.host = window.p_pximg_ip
      downloadUrl = newUrl.href
      res = await Filesystem.downloadFile({
        url: downloadUrl,
        path: 'pixiv-viewer/' + fileName,
        directory: Directory.Downloads,
        recursive: true,
        headers: { Host: 'i.pximg.net', Referer: 'https://www.pixiv.net' },
      })
    } else {
      downloadUrl = url
      res = await FileDownload.download({
        uri: downloadUrl,
        fileName: 'pixiv-viewer/' + fileName,
      })
    }

    addDownloadHistory({ status: 'ok', url: downloadUrl, fileName, path: res.path })

    Toast({
      message: i18n.t('tip.downloaded') + ': ' + decodeURIComponent(res.path.replace('file://', '')),
      duration: 3000,
    })
    return { res }
  } catch (error) {
    addDownloadHistory({ status: 'error', url, fileName, error: error + '' })

    Toast(i18n.t('D8R2062pjASZe9mgvpeLr') + ': ' + error)
    return { error }
  }
}

/**
 * @param {Blob} blob
 * @returns {Promise<string>}
 */
export function blobToBase64(blob) {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })
}

export async function downloadBlob(blob, fileName, subpath) {
  try {
    fileName = replaceValidFilename(fileName)
    if (subpath) fileName = subpath + '/' + fileName

    // const base64 = await blobToBase64(blob)
    // const res = await Filesystem.writeFile({
    //   path: 'pixiv-viewer/' + fileName,
    //   data: base64,
    //   directory: Directory.Downloads,
    //   recursive: true,
    // })

    const path = 'pixiv-viewer/' + fileName
    const directory = Directory.Downloads

    await writeBlob({ blob, path, directory, recursive: true })
    const { uri } = await Filesystem.getUri({ path, directory })
    const res = { uri }

    addDownloadHistory({ status: 'ok', fileName, path: res.uri })

    Toast({
      message: i18n.t('tip.downloaded') + ': ' + decodeURIComponent(res.uri.replace('file://', '')),
      duration: 3000,
    })
    return { res }
  } catch (error) {
    addDownloadHistory({ status: 'error', fileName, error: error + '' })

    Toast(i18n.t('D8R2062pjASZe9mgvpeLr') + ': ' + error)
    return { error }
  }
}

const isAnalyticsOn = LocalStorage.get('PXV_ANALYTICS', true)
export function trackEvent(name, properties) {
  if (!isAnalyticsOn) return
  if (!name.startsWith('Route')) {
    window.umami?.track(name, properties)
  }
}

export function dealStatusBarOnEnter() {
  StatusBar.setStyle({ style: Style.Dark })
  document.documentElement.classList.add('pt0')
  window['nav-bar-overlay']?.classList.add('op0')
}

const isDark = !!localStorage.PXV_DARK
export async function dealStatusBarOnLeave() {
  try {
    document.documentElement.classList.remove('pt0')
    window['nav-bar-overlay']?.classList.remove('op0')
    await StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light })
    return true
  } catch (error) {
    return false
  }
}

export function formatBytes(bytes) {
  bytes = Number(bytes)
  if (!bytes) return '0 B'

  const k = 1024
  const dm = 1
  const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function randomBg() {
  const getRandomRangeNum = (min, max) => min + Math.floor(Math.random() * (max - min))
  const leftHue = getRandomRangeNum(0, 360)
  const bottomHue = getRandomRangeNum(0, 360)
  return `linear-gradient(to right bottom,hsl(${leftHue}, 100%, 90%) 0%,hsl(${bottomHue}, 100%, 90%) 100%)`
}

export async function readTextFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

export function loadScript(src) {
  return new Promise(resolve => {
    const script = document.createElement('script')
    script.src = src
    script.addEventListener('load', () => { resolve() }, false)
    document.head.appendChild(script)
  })
}

export function isSafari() {
  const ua = navigator.userAgent
  if (!/Chrome/i.test(ua) && /Safari/i.test(ua)) return true
  return false
}
