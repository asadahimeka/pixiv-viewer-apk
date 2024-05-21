<template>
  <div id="app">
    <Preload />
    <router-view />
    <div id="nav-bar-overlay"></div>
  </div>
</template>

<script>
import Preload from '@/components/Preload'
import { mapMutations } from 'vuex'
import { existsSessionId, initUser } from '@/api/user'
import { localApi } from './api'
import { trackEvent } from './utils'
import { CURRENT_WEB_VERSION, getAppInfo, getDeviceInfo } from './version'

export default {
  components: {
    Preload,
  },
  async created() {
    let user = null
    try {
      if (window.APP_CONFIG.useLocalAppApi) {
        user = await localApi.me()
      } else if (existsSessionId()) {
        user = await initUser()
      }
    } catch (err) {
      console.log('err: ', err)
    }
    console.log('user: ', user)
    this.setUser(user)
  },
  async mounted() {
    const loading = document.querySelector('#ldio-loading')
    loading && (loading.style.display = 'none')

    const appInfo = await getAppInfo()
    const deviceInfo = await getDeviceInfo()
    trackEvent('App Mounted', {
      webVer: CURRENT_WEB_VERSION,
      appVer: `${appInfo.version}(${appInfo.build})`,
      webViewVersion: deviceInfo.webViewVersion,
      device: [
        deviceInfo.platform,
        deviceInfo.osVersion,
        deviceInfo.model,
        deviceInfo.manufacturer,
      ].join('_'),
    })
  },
  methods: {
    ...mapMutations(['setUser']),
  },
}
</script>

<style lang="stylus">
html,body
  width 100%;
  // height 100%

#app
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
  width 100%
  margin 0 auto

#nprogress
  .bar
    background-color: rgb(253, 186, 47)
  .spinner
    display none

.Home
  padding-top 1.2rem
  .com_sel_tabs
    position fixed
    z-index 1
    left 50%
    transform translateX(-50%)
    top calc(0.3rem + var(--status-bar-height))
    margin-bottom 0
    padding 0
</style>
