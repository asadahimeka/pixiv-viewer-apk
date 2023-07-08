import { Clipboard } from '@capacitor/clipboard'
import { FileDownload } from 'capacitor-plugin-filedownload'
import { Filesystem, Directory } from '@capacitor/filesystem'
import { Share } from '@capacitor/share'
import { StatusBar, Style } from '@capacitor/status-bar'
import Analytics from '@capacitor-community/appcenter-analytics'
import axios from 'axios'
import { LocalStorage } from './storage'

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

export async function downloadFile(uri, fileName) {
  try {
    const res = await FileDownload.download({ uri, fileName })
    return { res }
  } catch (error) {
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

export async function downloadBlob(blob, fileName) {
  try {
    const base64 = await blobToBase64(blob)
    const res = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.External,
    })
    await Share.share({
      files: [res.uri],
    })
    return { res }
  } catch (error) {
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

export function setStatusBarOverlayOn() {
  StatusBar.setStyle({ style: Style.Dark })
  StatusBar.setOverlaysWebView({ overlay: true })
}

export function setStatusBarOverlayOff() {
  StatusBar.setStyle({ style: localStorage.PXV_DARK ? Style.Dark : Style.Light })
  StatusBar.setOverlaysWebView({ overlay: false })
}
