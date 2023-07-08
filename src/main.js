import 'swiper/css/swiper.css'
import 'vant/lib/index.css'
import '@/assets/css/base.styl'
import './polyfill'

import { App as CapApp } from '@capacitor/app'
import { StatusBar, Style as StatusBarStyle } from '@capacitor/status-bar'
import Analytics from '@capacitor-community/appcenter-analytics'
import Vue from 'vue'
import VueAwesomeSwiper from 'vue-awesome-swiper'
import VueMasonry from 'vue-masonry-css'
import Vant, { Toast, Lazyload, ImagePreview, Dialog } from 'vant'

import SvgIcon from '@/icons'
import Masonry from './components/Masonry.vue'
import TopBar from '@/components/TopBar'
import AppComp from './App.vue'
import router from './router'
import store from './store'
import { i18n } from './i18n'
import { LocalStorage } from '@/utils/storage'
import { getActionMap } from '@/api/client/action'
import { initBookmarkCache } from './utils/siteCache'
import { login } from '@/api/client/login'

StatusBar.setStyle({ style: localStorage.PXV_DARK ? StatusBarStyle.Dark : StatusBarStyle.Light })
StatusBar.setBackgroundColor({ color: localStorage.PXV_DARK ? '#16161A' : '#FFFFFF' })

CapApp.addListener('backButton', ev => {
  if (!ev.canGoBack || history.length <= 1) {
    CapApp.exitApp()
  } else {
    router.back()
  }
})

CapApp.addListener('appUrlOpen', async ({ url }) => {
  if (url.startsWith('pixiv://users')) {
    url = url.replace('pixiv:/', '')
  }
  if (url.startsWith('pixiv://illusts')) {
    url = url.replace('pixiv://illusts', '/artworks')
  }
  if (url.startsWith('pixiv://novels')) {
    url = url.replace('pixiv://novels', '/novel')
  }
  if (url.startsWith('/')) {
    router.push(url)
    return
  }

  const code = url.match(/^pixiv:\/\/account\/login\?code=(\w+)/i)?.[1]
  if (!code) return

  try {
    const v = LocalStorage.get('PXV_LOGIN_CODEV')
    await login(code, v)
    Toast.success(i18n.t('login.succ_tip'))
    setTimeout(() => {
      location.replace('/')
    }, 200)
  } catch (err) {
    console.log('err: ', err)
    Dialog.alert({ message: i18n.t('login.fail_tip') })
  }
})

setupApp()

async function checkLocalApi() {
  const config = LocalStorage.get('PXV_CLIENT_CONFIG', {})
  window.APP_CONFIG = config
  if (!config.useLocalAppApi) return
  window.__localApiMap__ = await getActionMap()
  await initBookmarkCache()
}

async function setupApp() {
  await Analytics.setEnabled({ enabled: LocalStorage.get('PXV_ANALYTICS', true) })
  const isPersisted = await navigator.storage?.persisted?.().catch(() => false)
  if (!isPersisted) await navigator.storage?.persist?.().catch(() => {})
  await checkLocalApi()

  Vue.use(Toast)
  Vue.use(ImagePreview)
  Vue.use(Lazyload, {
    // observer: true,
    lazyComponent: true,
    loading: require('@/icons/loading.svg'),
    adapter: {
      error(evt) {
        const src = evt.src
        if (!src?.includes('i-cf.pximg.net')) return
        if (!/\/artworks\/|\/spotlight\//i.test(location.href)) evt.el.src = ''
        evt.el.src = src.replace('i-cf.pximg.net', 'i.pixiv.re')
      },
    },
  })
  Vue.use(Vant)
  Vue.use(VueAwesomeSwiper)
  Vue.use(VueMasonry)
  Vue.use(SvgIcon)

  Vue.component('WfCont', Masonry)
  Vue.component('TopBar', TopBar)

  Vue.config.productionTip = false

  new Vue({
    router,
    store,
    i18n,
    render: h => h(AppComp),
  }).$mount('#app')
}
