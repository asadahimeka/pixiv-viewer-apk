<template>
  <div class="setting-page">
    <top-bar id="top-bar-wrap" />
    <h3 class="af_title">{{ $t('user.sess.login') }}</h3>
    <van-cell size="large" center title="App API (RefreshToken)" is-link @click="openConfirmDialog('showTokenDialog')" />
    <van-cell size="large" center title="App API (OAuth)" is-link @click="openConfirmDialog('showConfirmDialog')" />
    <van-cell size="large" center title="Web API (Cookie)" is-link to="/account/session" />
    <van-dialog
      v-model="showConfirmDialog"
      width="9rem"
      :title="$t('tips.tip')"
      show-cancel-button
      :cancel-button-text="$t('common.cancel')"
      :confirm-button-text="$t('common.confirm')"
      @confirm="openLoginWindow"
    >
      <van-cell>{{ $t('login.o.desc1') }}</van-cell>
    </van-dialog>
    <van-dialog
      v-model="showTokenDialog"
      width="9rem"
      :title="$t('login.t.d3')"
      show-cancel-button
      :cancel-button-text="$t('common.cancel')"
      confirm-button-text="OK"
      @confirm="setLocalHibi"
    >
      <van-cell>{{ $t('login.t.d1') }}</van-cell>
      <van-cell>{{ $t('login.t.d2') }}</van-cell>
      <van-cell><a href="https://www.nanoka.top/posts/e78ef86/" target="_blank">🔗https://www.nanoka.top/posts/e78ef86/</a></van-cell>
      <van-cell><a href="https://github.com/Tsuk1ko/pxder#%E5%87%86%E5%A4%87" target="_blank">🔗https://github.com/Tsuk1ko/pxder</a></van-cell>
      <van-cell><a href="https://github.com/mixmoe/HibiAPI/issues/53" target="_blank">🔗https://github.com/mixmoe/HibiAPI/issues/53</a></van-cell>
      <van-field v-model="appConfig.refreshToken" label="RefreshToken：" label-width="2rem" :placeholder="$t('login.t.d3')" />
      <van-cell>
        <div class="flex">
          <span style="margin-right: 0.3rem">{{ $t('setting.other.direct_mode.proxy.title') }}</span>
          <van-switch :value="appConfig.useApiProxy" :disabled="appConfig.directMode" size="24" @change="setUseApiProxy" />
        </div>
      </van-cell>
      <van-cell>
        <div class="flex">
          <span style="margin-right: 0.3rem">{{ $t('setting.other.direct_mode.title') }}</span>
          <van-switch :value="appConfig.directMode" :disabled="appConfig.useApiProxy" size="24" @change="setDirectMode" />
        </div>
      </van-cell>
    </van-dialog>
  </div>
</template>

<script>
import { getLoginURL } from '@/api/client/login'
import PixivAuth from '@/api/client/pixiv-auth'
import { trackEvent } from '@/utils'
import { LocalStorage } from '@/utils/storage'
import { Dialog } from 'vant'

export default {
  name: 'Login',
  data() {
    return {
      appConfig: { ...window.APP_CONFIG },
      showConfirmDialog: false,
      showTokenDialog: false,
    }
  },
  methods: {
    async openConfirmDialog(showKey) {
      const res = await Dialog.confirm({
        title: this.$t('sess.warn.title'),
        message: this.$t('sess.warn.text'),
        closeOnPopstate: true,
        cancelButtonText: this.$t('common.cancel'),
        confirmButtonText: this.$t('common.confirm'),
      }).catch(() => {})
      if (res != 'confirm') return
      this[showKey] = true
    },
    async setLocalHibi() {
      if (this.appConfig.refreshToken?.length == 43) {
        this.appConfig.useLocalAppApi = true
        PixivAuth.writeConfig(this.appConfig)
        trackEvent('RefreshToken Login')
        setTimeout(() => {
          location.assign('/')
        }, 500)
      } else {
        this.$toast(this.$t('login.t.d4'))
      }
    },
    async openLoginWindow() {
      const res = getLoginURL()
      LocalStorage.set('PXV_LOGIN_CODEV', res.code_verifier, 600)
      window.open(res.login_url, '_blank', 'noopener noreferrer')
    },
    async setUseApiProxy(val) {
      if (val) {
        const res = await Dialog.confirm({
          title: this.$t('setting.other.direct_mode.confirm.proxy_title'),
          message: this.$t('setting.other.direct_mode.confirm.proxy_msg'),
          confirmButtonText: this.$t('common.confirm'),
          cancelButtonText: this.$t('common.cancel'),
        }).catch(() => 'cancel')
        if (res == 'cancel') return
        this.$set(this.appConfig, 'useApiProxy', true)
      } else {
        this.$set(this.appConfig, 'useApiProxy', false)
      }
      trackEvent('useApiProxy', { val })
      await this.$nextTick()
      PixivAuth.writeConfig(this.appConfig)
    },
    async setDirectMode(val) {
      if (val) {
        const res = await Dialog.confirm({
          title: this.$t('setting.other.direct_mode.confirm.title'),
          message: this.$t('setting.other.direct_mode.confirm.msg'),
          confirmButtonText: this.$t('common.confirm'),
          cancelButtonText: this.$t('common.cancel'),
        }).catch(() => 'cancel')
        if (res == 'cancel') return
        this.$set(this.appConfig, 'directMode', true)
      } else {
        this.$set(this.appConfig, 'directMode', false)
      }
      trackEvent('setDirectMode', { val })
      await this.$nextTick()
      PixivAuth.writeConfig(this.appConfig)
    },
  },
}
</script>

<style lang="stylus" scoped>

</style>
