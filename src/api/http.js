import axios from 'axios'
import nprogress from 'nprogress'
import { BASE_API_URL, UA_Header } from '@/consts'

axios.defaults.baseURL = BASE_API_URL
axios.defaults.timeout = 20000
axios.defaults.headers.post['Content-Type'] = 'application/json'
axios.defaults.headers.common['User-Agent'] = UA_Header['User-Agent']
axios.defaults.headers.common.Origin = 'https://localhost'

axios.interceptors.request.use(config => {
  nprogress.start()
  return config
})

axios.interceptors.response.use(
  res => {
    nprogress.done()
    return res
  },
  err => {
    nprogress.done()
    return Promise.reject(err)
  }
)

const get = async (url, params = {}, config = {}) => {
  console.log('url: ', url)
  console.log('params: ', params)
  try {
    let res
    if (/^\/(?!prks).*/.test(url) && window.APP_CONFIG.useLocalAppApi) {
      res = await window.__localApiMap__[url]?.({ query: params, ...config })
    } else {
      res = (await axios.get(url, { params, ...config })).data
    }

    return res
  } catch (error) {
    console.error(error)
    return { error }
  }
}

export { get }
