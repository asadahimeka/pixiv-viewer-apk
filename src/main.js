import 'swiper/css/swiper.css'
import 'vant/lib/index.css'
import '@/assets/css/base.styl'

import { App as app } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import Vue from 'vue'
import VueAwesomeSwiper from 'vue-awesome-swiper'
import VueMasonry from 'vue-masonry-css'
import Vant, { Toast, Lazyload, ImagePreview } from 'vant'

import SvgIcon from '@/icons'
import Masonry from './components/Masonry.vue'
import TopBar from '@/components/TopBar'
import AppComp from './App.vue'
import router from './router'
import store from './store'
import { i18n } from './i18n'

import './polyfill'

StatusBar.setStyle({ style: localStorage.__PXV_DARK ? Style.Dark : Style.Light })
StatusBar.setBackgroundColor({ color: localStorage.__PXV_DARK ? '#16161A' : '#FFFFFF' })

Vue.use(Toast)
Vue.use(ImagePreview)
Vue.use(Lazyload, {
  observer: true,
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

app.addListener('backButton', ev => {
  if (!ev.canGoBack || history.length <= 1) {
    app.exitApp()
  } else {
    router.back()
  }
})
