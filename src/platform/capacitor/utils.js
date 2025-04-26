import { Toast } from 'vant'
import { Clipboard } from '@capacitor/clipboard'
import { FileDownload } from '@himeka/capacitor-plugin-filedownload'
import { Filesystem, Directory } from '@himeka/capacitor-filesystem'
import writeBlob from 'capacitor-blob-writer'
import { LocalStorage } from './storage'
import { getCache, setCache } from './siteCache'
import { i18n } from '@/i18n'

export async function copyText(string, cb, errCb) {
  try {
    await Clipboard.write({ string })
    cb()
  } catch (error) {
    errCb(error)
  }
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

export async function downloadBlob(blob, fileName, subpath) {
  try {
    fileName = replaceValidFilename(fileName)
    if (subpath) fileName = subpath + '/' + fileName

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

const isOverlayOff = LocalStorage.get('PXV_STATUSBAR_OVERLAY_OFF', false)

export function dealStatusBarOnEnter() {
  if (isOverlayOff) return
  document.documentElement.classList.add('pt0')
  window['nav-bar-overlay']?.classList.add('op0')
}

export async function dealStatusBarOnLeave() {
  if (isOverlayOff) return
  document.documentElement.classList.remove('pt0')
  window['nav-bar-overlay']?.classList.remove('op0')
}
