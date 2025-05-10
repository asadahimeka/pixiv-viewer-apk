import axios from 'axios'
import * as fs from '@tauri-apps/plugin-fs'
import { invoke } from '@tauri-apps/api/core'
import { open } from '@tauri-apps/plugin-shell'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { sep as sepFn, pictureDir } from '@tauri-apps/api/path'
import { open as openFileDialog } from '@tauri-apps/plugin-dialog'
import { Toast } from 'vant'
import { i18n } from '@/i18n'
import { LocalStorage } from '@/utils/storage'
import axiosTauriAdapter from './axios-tauri-adapter'

const sep = sepFn()
const client = axios.create({ adapter: axiosTauriAdapter })

export function copyText(text, cb, errCb) {
  writeText(`${text}`).then(cb, errCb)
}

export async function openUrl(url) {
  try {
    await open(url)
  } catch (error) {
    window.open(url, '_blank', 'noopener noreferrer')
  }
}

export async function getSelectedSaveDir() {
  try {
    const selected = await openFileDialog({ directory: true })
    return selected
  } catch (err) {
    return null
  }
}

const baseDlDir = async () => LocalStorage.get('PXV_DL_DIR', `${await pictureDir()}${sep}pixiv-viewer`)
export async function ensureDownloadDir(sub = '') {
  const dir = (await baseDlDir()) + (sub || '')
  const isExist = await fs.exists(dir)
  if (!isExist) {
    await fs.mkdir(dir, { recursive: true })
  }
}

const isDirect = LocalStorage.get('PXV_PXIMG_DIRECT', false)
export async function downloadFile(url, fileName, subDir = '') {
  try {
    if (subDir) subDir = sep + subDir
    await ensureDownloadDir(subDir)

    let resPath = ''
    if (isDirect && /\.(jpe?g|png)$/.test(url)) {
      const newUrl = new URL(url)
      newUrl.protocol = 'http:'
      newUrl.host = window.p_pximg_ip
      resPath = await invoke('download_file', {
        url: newUrl.href,
        writePath: `${await baseDlDir()}${subDir || ''}`,
        fileName,
        id: fileName,
        headers: { Host: 'i.pximg.net', Referer: 'https://www.pixiv.net/' },
      })
    } else {
      resPath = await invoke('download_file', {
        url,
        writePath: `${await baseDlDir()}${subDir || ''}`,
        fileName,
        id: fileName,
      })
    }

    Toast.clear(true)
    Toast({
      message: i18n.t('tip.downloaded') + ': ' + decodeURIComponent(resPath),
      duration: 3000,
    })

    return { res: resPath }
  } catch (error) {
    return { error }
  }
}

/**
 * @param {Blob} blob
 * @param {string} fileName
 * @param {string} subDir
 */
export async function downloadBlob(blob, fileName, subDir = '') {
  try {
    if (subDir) subDir = sep + subDir

    await ensureDownloadDir(subDir)
    const res = `${await baseDlDir()}${subDir}${sep}${fileName}`
    await fs.writeFile(res, await blob.arrayBuffer())

    Toast.clear(true)
    Toast({
      message: i18n.t('tip.downloaded') + ': ' + decodeURIComponent(res),
      duration: 3000,
    })

    return { res }
  } catch (error) {
    return { error }
  }
}

// export async function downloadText(text, fileName, authorName) {
//   try {
//     fileName = replaceValidFilename(fileName)

//     const dir = (isDlDirByAuthor && authorName) ? authorName : '_txt'
//     await ensureDownloadDir(sep + dir)
//     const path = `${await baseDlDir()}${sep}${dir}${sep}${fileName}`
//     await fs.writeTextFile(path, text)

//     Toast({
//       message: i18n.t('tip.downloaded') + ': ' + decodeURIComponent(path),
//       duration: 3000,
//     })

//     return path
//   } catch (err) {
//     Toast(i18n.t('KCziWydyIc-nodsgMmA2D') + ': ' + err)
//   }
// }

export async function getPximgUri(url) {
  url.protocol = 'http:'
  url.host = window.p_pximg_ip
  const { data } = await client(url.href, {
    responseType: 'blob',
    headers: { Host: 'i.pximg.net', Referer: 'https://www.pixiv.net/' },
  })
  return URL.createObjectURL(data)
}
