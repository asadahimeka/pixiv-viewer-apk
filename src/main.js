import 'swiper/css/swiper.css'
import '@fancyapps/ui/dist/fancybox/fancybox.css'
import 'vant/lib/index.css'
import '@/assets/css/base.styl'
import '@/assets/css/theme.styl'
import './polyfill'

import { App as CapApp } from '@capacitor/app'
import { StatusBar, Style as StatusBarStyle } from '@capacitor/status-bar'
import { SafeArea } from 'capacitor-plugin-safe-area'

import Vue from 'vue'
import VueAwesomeSwiper from 'vue-awesome-swiper'
import VueMasonry from 'vue-masonry-css'
import Vant, { Toast, Lazyload, ImagePreview, Dialog } from 'vant'

import SvgIcon, { loadingSvg } from './icons'
import Masonry from '@/components/Masonry.vue'
import TopBar from '@/components/TopBar.vue'
import ImagePximg from '@/components/ImagePximg.vue'
import AppComp from './App.vue'
import router from './router'
import store from './store'
import longpress from './directives/longpress'
import { i18n } from './i18n'
import { LocalStorage } from '@/utils/storage'
import { getActionMap, setPximgIP } from '@/api/client/action'
import { initBookmarkCache } from '@/utils/siteCache'
import { login } from '@/api/client/login'
import { trackEvent } from '@/utils'

setStatusBar()
setSafeAreaVar()
addCapListeners()
addErrorListener()
setupApp()

async function checkLocalApi() {
  const config = LocalStorage.get('PXV_CLIENT_CONFIG', {})
  window.APP_CONFIG = config
  if (!config.useLocalAppApi) return
  window.__localApiMap__ = await getActionMap()
  await initBookmarkCache()
}

async function setupApp() {
  const isPersisted = await navigator.storage?.persisted?.().catch(() => false)
  if (!isPersisted) await navigator.storage?.persist?.().catch(() => {})
  await setPximgIP()
  await checkLocalApi()

  Vue.use(Toast)
  Vue.use(ImagePreview)
  Vue.use(Lazyload, {
    // observer: true,
    lazyComponent: true,
    loading: localStorage.PXV_ACT_COLOR ? loadingSvg(localStorage.PXV_ACT_COLOR) : require('@/icons/loading.svg'),
    preload: 1.5,
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
  Vue.use(longpress)

  Vue.component('WfCont', Masonry)
  Vue.component('TopBar', TopBar)
  Vue.component('ImagePximg', ImagePximg)

  Vue.config.productionTip = false

  new Vue({
    router,
    store,
    i18n,
    render: h => h(AppComp),
  }).$mount('#app')
}

function addErrorListener() {
  Vue.config.errorHandler = function (err, vm, info) {
    trackEvent('vue_error', {
      err: `Error: ${err.toString()}\nInfo: ${info}\nDescription: ${vm.description}\nTag: ${vm.$vnode.tag}`,
    })
  }
  window.onerror = function (ev, source, lineno, colno, error) {
    trackEvent('global_error', { err: `${ev} ${error}: ${source} ${lineno}:${colno}` })
  }
}

function setSafeAreaVar() {
  SafeArea.getSafeAreaInsets().then(({ insets }) => {
    console.log('insets: ', insets)
    document.documentElement.style.setProperty('--safe-area-top', `${insets.top}px`)
    document.documentElement.style.setProperty('--safe-area-bottom', `${insets.bottom}px`)
  })
}

function setStatusBar() {
  // const color = localStorage.PXV_DARK ? '#16161A' : '#FFFFFF'
  StatusBar.setStyle({ style: localStorage.PXV_DARK ? StatusBarStyle.Dark : StatusBarStyle.Light })
  // StatusBar.setBackgroundColor({ color })
  // StatusBar.setOverlaysWebView({ overlay: true })
}

function addCapListeners() {
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
      await login(code, LocalStorage.get('PXV_LOGIN_CODEV'))
      trackEvent('OAuth Login Success')
      Toast.success(i18n.t('login.succ_tip'))
      setTimeout(() => {
        location.replace('/')
      }, 200)
    } catch (err) {
      alert('Login Error: ', JSON.stringify(err))
      Dialog.alert({ message: i18n.t('login.fail_tip') })
    }
  })
}
