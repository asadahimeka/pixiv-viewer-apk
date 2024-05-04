<template>
  <div class="setting-page">
    <top-bar id="top-bar-wrap" />
    <h3 class="af_title">{{ $t('about.title') }}</h3>
    <van-cell-group :title="$t('about.about_site')">
      <van-cell center :title="$t('about.version')" clickable :label="curVer" />
      <van-cell center :title="$t('about.disclaimer')" is-link :label="$t('tips.click_view')" to="/setting/about/disclaimer" />
      <van-cell v-if="appInfo.version" center :title="'APP '+$t('about.version')" clickable :label="`${appInfo.version}(${appInfo.build})`" />
      <van-cell v-if="wvVersion" center :title="'Webview '+$t('about.version')" clickable :label="wvVersion" />
      <van-cell center :title="$t('setting.check_update')" label="Go to Github Release" clickable @click="openGithubRelease" />
      <van-cell
        center
        :title="$t('about.source')"
        is-link
        label="Github:asadahimeka/pixiv-viewer"
        @click="openLink('https://github.com/asadahimeka/pixiv-viewer')"
      />
      <van-cell center :title="'FAQ'" is-link :label="$t('tips.click_view')" to="/setting/about/faq" />
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
        title="Github Discussions"
        is-link
        label="Github:asadahimeka/pixiv-viewer"
        @click="openLink('https://github.com/asadahimeka/pixiv-viewer/discussions')"
      />
      <van-cell
        center
        title="Github Issues"
        is-link
        label="Github:asadahimeka/pixiv-viewer-apk"
        @click="openLink('https://github.com/asadahimeka/pixiv-viewer-apk/issues')"
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
      curVer: 'v1.17.2',
    }
  },
  async created() {
    this.appInfo = await App.getInfo()
    this.wvVersion = (await Device.getInfo()).webViewVersion
    this.checkUpdate()
  },
  methods: {
    openLink(link) {
      trackEvent('Open Link', { url: link.replace('https://', '') })
      window.open(link, '_blank', 'noopener noreferrer')
    },
    openGithubRelease() {
      trackEvent('Check Update')
      window.open('https://github.com/asadahimeka/pixiv-viewer/releases', '_blank', 'noopener noreferrer')
    },
    async checkUpdate() {
      const resp = await fetch('https://fastly.jsdelivr.net/gh/asadahimeka/pixiv-viewer-apk@ipa/src/views/Setting/About.vue')
      const text = await resp.text()
      if (text?.match(/curVer: '(v[\d.]+)',/i)?.[1] != this.curVer) {
        const res = await Dialog.confirm({ message: this.$t('JKCgrgXZfg4-HDftheb96') }).catch(() => {})
        if (res != 'confirm') return
        this.openGithubRelease()
      }
    },
  },
}
</script>

<style lang="stylus" scoped>

</style>
