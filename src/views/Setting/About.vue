<template>
  <div class="setting-page">
    <top-bar id="top-bar-wrap" />
    <h3 class="af_title">{{ $t('about.title') }}</h3>
    <van-cell-group :title="$t('about.about_site')">
      <van-cell center :title="$t('about.version')" clickable :label="curVer" />
      <van-cell center :title="$t('about.disclaimer')" is-link :label="$t('tips.click_view')" to="/setting/about/disclaimer" />
      <van-cell v-if="appInfo.version" center :title="'APP '+$t('about.version')" clickable :label="`${appInfo.version}(${appInfo.build})`" />
      <van-cell v-if="wvVersion" center :title="'Webview '+$t('about.version')" clickable :label="wvVersion" />
      <van-cell center :title="$t('setting.check_update')" label="Go to App Center" clickable @click="openAppCenter" />
      <van-cell
        center
        :title="$t('about.source')"
        is-link
        label="Github:asadahimeka/pixiv-viewer"
        @click="openLink('https://github.com/asadahimeka/pixiv-viewer')"
      />
    </van-cell-group>
    <van-cell-group :title="$t('about.credits')">
      <van-cell
        center
        title="pixiv-viewer"
        is-link
        label="Github:journey-ad/pixiv-viewer"
        @click="openLink('https://github.com/journey-ad/pixiv-viewer')"
      />
      <van-cell
        center
        title="HibiAPI"
        is-link
        label="Github:mixmoe/HibiAPI"
        @click="openLink('https://github.com/mixmoe/HibiAPI')"
      />
      <van-cell
        center
        title="pxder"
        is-link
        label="Github:Tsuk1ko/pxder"
        @click="openLink('https://github.com/Tsuk1ko/pxder')"
      />
      <van-cell
        center
        title="PixEz"
        is-link
        label="Github:Notsfsssf/pixez-flutter"
        @click="openLink('https://github.com/Notsfsssf/pixez-flutter')"
      />
      <van-cell
        center
        title="pixivpy-async"
        is-link
        label="Github:Mikubill/pixivpy-async"
        @click="openLink('https://github.com/Mikubill/pixivpy-async')"
      />
    </van-cell-group>
    <van-cell-group :title="$t('about.feedback')">
      <van-cell
        center
        title="Github Issues"
        is-link
        label="Github:asadahimeka/pixiv-viewer"
        @click="openLink('https://github.com/asadahimeka/pixiv-viewer/issues')"
      />
      <van-cell
        center
        :title="$t('VhMNSWrg03-_ryN7nRBJ3')"
        is-link
        :label="$t('9H-9VJU67Fuabl8OgbhOr')"
        @click="openLink('https://www.nanoka.top/say/pxve_comments.html')"
      />
    </van-cell-group>
  </div>
</template>

<script>
import { App } from '@capacitor/app'
import { Device } from '@capacitor/device'
import { Dialog } from 'vant'
import { trackEvent } from '@/utils'

export default {
  name: 'SettingAbout',
  data() {
    return {
      wvVersion: '',
      appInfo: {},
      curVer: 'v1.13.7',
    }
  },
  async created() {
    const info = await App.getInfo()
    this.appInfo = info
    const { webViewVersion } = await Device.getInfo()
    this.wvVersion = webViewVersion
    this.checkUpdate()
  },
  methods: {
    openLink(link) {
      trackEvent('Open Link', { url: link.replace('https://', '') })
      window.open(link, '_blank', 'noopener noreferrer')
    },
    openAppCenter() {
      trackEvent('Check Update')
      window.open('https://install.appcenter.ms/users/yumine/apps/pixiv-viewer/distribution_groups/beta', '_blank', 'noopener noreferrer')
    },
    async checkUpdate() {
      const resp = await fetch('https://d.cocomi.eu.org/https://install.appcenter.ms/api/v0.1/apps/yumine/pixiv-viewer/distribution_groups/beta/public_releases?scope=tester&top=10000')
      const json = await resp.json()
      if (json?.[0]?.version != this.appInfo.build) {
        const res = await Dialog.confirm({ message: this.$t('JKCgrgXZfg4-HDftheb96') }).catch(() => {})
        if (res != 'confirm') return
        this.openAppCenter()
      }
    },
  },
}
</script>

<style lang="stylus" scoped>

</style>
