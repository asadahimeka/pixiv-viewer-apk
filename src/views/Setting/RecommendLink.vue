<template>
  <div class="setting-page">
    <van-cell
      center
      title="PixivNow"
      is-link
      label="https://pixiv.js.org"
      @click="openLink('https://pixiv.js.org/')"
    />
    <van-cell
      center
      title="Pixivel"
      is-link
      label="https://pixivel.moe"
      @click="openLink('https://pixivel.moe/')"
    />
    <van-cell
      center
      title="Pixiviz"
      is-link
      label="https://pixiviz.xyz"
      @click="openLink('https://pixiviz.xyz/')"
    />
    <van-cell
      center
      title="Pixiviz Kai"
      is-link
      label="https://z.pixiv.pics"
      @click="openLink('https://pixiviz.cocomi.eu.org/')"
    />
    <van-cell
      center
      title="Pixivel Kai"
      is-link
      label="https://pxelk.pixiv.pics"
      @click="openLink('https://pxelk.cocomi.eu.org/')"
    />
    <van-cell
      center
      title="PixivNow Kai"
      is-link
      label="https://pxnow.cocomi.eu.org"
      @click="openLink('https://pxnow.cocomi.eu.org/')"
    />
    <van-cell
      center
      title="pixiv萌え改"
      is-link
      label="https://pixivmoe.cocomi.eu.org"
      @click="openLink('https://pixivmoe.cocomi.eu.org/')"
    />
    <van-cell
      center
      title="PixivLxns"
      is-link
      label="https://lxns.pixiv.pics"
      @click="openLink('https://pixivlxns.cocomi.eu.org')"
    />
    <van-cell
      center
      title="Moeview"
      is-link
      label="https://moeview.pixiv.pics"
      @click="openLink('https://moeview.cocomi.eu.org/')"
    />
    <van-cell
      center
      title="Booru Masonry"
      is-link
      label="https://booru.pixiv.pics"
      @click="openLink('https://booru.cocomi.eu.org/')"
    />
    <van-cell
      center
      title="Pixiv Daily Top50"
      is-link
      label="https://www.nanoka.top/illust/pixiv/"
      @click="openLink('https://www.nanoka.top/illust/pixiv/')"
    />
    <van-cell
      center
      title="PixivCollection"
      is-link
      label="https://fav.pixiv.pics/"
      @click="openLink('https://pxc.cocomi.eu.org/')"
    />
    <van-cell
      center
      title="Ugoira Converter"
      is-link
      label="https://ugoira.pixiv.pics"
      @click="openLink('https://ugoira.cocomi.eu.org')"
    />
    <van-cell
      center
      title="Wotaku - The Otaku Index"
      is-link
      label="https://wotaku.moe/"
      @click="openLink('https://wotaku.moe/')"
    />
    <van-cell
      center
      title="AnimeGarden - Anime Torrent aggregation site"
      is-link
      label="https://garden.onekuma.cn/"
      @click="openLink('https://garden.onekuma.cn/')"
    />
  </div>
</template>

<script>
import { trackEvent } from '@/utils'

export default {
  name: 'SettingRecommendLinks',
  components: {

  },
  data() {
    return {

    }
  },
  methods: {
    openLink(link) {
      trackEvent('Open Link', { url: link.replace('https://', '') })
      window.open(link, '_blank', 'noopener')
    },
  },
}
</script>

<style lang="stylus" scoped>

</style>
