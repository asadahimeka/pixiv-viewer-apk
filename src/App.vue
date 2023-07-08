<template>
  <div id="app">
    <Preload />
    <router-view />
  </div>
</template>

<script>
import { Device } from '@capacitor/device'
import Preload from '@/components/Preload'
import { mapMutations } from 'vuex'
import { existsSessionId, initUser } from '@/api/user'
import { localApi } from './api'
import { trackEvent } from './utils'

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
    const { webViewVersion } = await Device.getInfo()
    trackEvent('App Mounted', { webViewVersion })
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
  // max-width 750px
  width 100%
  // height 100%
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
    top 0.3rem
    margin-bottom 0
    padding 0
</style>
