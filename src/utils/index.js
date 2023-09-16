import { Clipboard } from '@capacitor/clipboard'
import { FileDownload } from '@himeka/capacitor-plugin-filedownload'
import { Filesystem, Directory } from '@himeka/capacitor-filesystem'
// import { Share } from '@capacitor/share'
import { StatusBar, Style } from '@capacitor/status-bar'
import Analytics from '@capacitor-community/appcenter-analytics'
import axios from 'axios'
import { LocalStorage } from './storage'
import { Toast } from 'vant'
import { i18n } from '@/i18n'

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

function replaceValidFilename(str = '') {
  const maxLen = 127
  const strArr = str.split('.')
  const ext = strArr.pop()
  str = strArr.join('').replace(/[\\/|?*:<>'"\s.]/g, '_') + '.' + ext
  if (str.length > maxLen) str = str.slice(-maxLen)
  return str
}

export async function downloadFile(url, fileName, subpath) {
  try {
    fileName = replaceValidFilename(fileName)
    Toast(i18n.t('tip.downloading') + ': ' + fileName)
    if (subpath) fileName = subpath + '/' + fileName
    const res = await FileDownload.download({
      uri: url,
      fileName: 'pixiv-viewer/' + fileName,
    })
    Toast({
      message: i18n.t('tip.downloaded') + ': ' + decodeURIComponent(res.path.replace('file://', '')),
      duration: 3000,
    })
    return { res }
  } catch (error) {
    Toast(i18n.t('D8R2062pjASZe9mgvpeLr') + ': ' + error)
    return { error }
  }
}

function blobToBase64(blob) {
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
    const base64 = await blobToBase64(blob)
    const res = await Filesystem.writeFile({
      path: 'pixiv-viewer/' + fileName,
      data: base64,
      directory: Directory.Downloads,
      recursive: true,
    })
    Toast({
      message: i18n.t('tip.downloaded') + ': ' + decodeURIComponent(res.uri.replace('file://', '')),
      duration: 3000,
    })
    // await Share.share({
    //   files: [res.uri],
    // })
    return { res }
  } catch (error) {
    Toast(i18n.t('D8R2062pjASZe9mgvpeLr') + ': ' + error)
    return { error }
  }
}

const isAnalyticsOn = LocalStorage.get('PXV_ANALYTICS', true)
export function trackEvent(name, properties) {
  if (!isAnalyticsOn) return
  return Analytics.trackEvent({
    name,
    properties,
  })
}

export function dealStatusBarEnter() {
  StatusBar.setStyle({ style: Style.Dark })
  StatusBar.setOverlaysWebView({ overlay: true })
}

const isDark = !!localStorage.PXV_DARK
export function dealStatusBarEnterLeave() {
  StatusBar.setStyle({ style: isDark ? Style.Dark : Style.Light })
  StatusBar.setOverlaysWebView({ overlay: false })
}
