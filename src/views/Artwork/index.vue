<template>
  <div class="artwork">
    <TopBar />
    <div class="share_btn" @click="share">
      <Icon class="icon" name="share" />
    </div>
    <div class="ia-cont">
      <div class="ia-left">
        <van-loading v-if="loading" size="50px" />
        <ImageView ref="imgView" :artwork="artwork" :lazy="true" @open-download="ugoiraDownloadPanelShow = true" />
      </div>
      <div class="ia-right">
        <van-skeleton class="skeleton" title avatar :row="5" avatar-size="42px" :loading="loading">
          <ArtworkMeta ref="artworkMeta" :artwork="artwork" @ugoira-download="showUgPanelFromDlBtn" />
        </van-skeleton>
        <keep-alive>
          <AuthorCard v-if="artwork.author" :id="artwork.author.id" :key="artwork.id" />
        </keep-alive>
      </div>
    </div>
    <van-divider style="margin: 0.7rem 0;" />
    <keep-alive>
      <Related :key="artwork.id" :artwork="artwork" />
    </keep-alive>
    <van-action-sheet
      v-model="ugoiraDownloadPanelShow"
      :actions="ugoiraDownloadPanelActions"
      :cancel-text="$t('common.cancel')"
      :description="$t('artwork.download.placeholder')"
      close-on-popstate
      close-on-click-action
      @select="onUgoiraDownloadPanelSelect"
    />
  </div>
</template>

<script>
import TopBar from '@/components/TopBar'
import ImageView from './components/ImageView'
import Meta from './components/Meta'
import AuthorCard from './components/AuthorCard'
import Related from './components/Related'
import { Share } from '@capacitor/share'
import { mapGetters } from 'vuex'
import nprogress from 'nprogress'
import api from '@/api'
import { getCache, setCache } from '@/utils/siteCache'
import _ from 'lodash'
import { i18n } from '@/i18n'

const ugoiraDownloadPanelActions = [
  { name: 'ZIP', subname: i18n.t('artwork.download.zip') },
  { name: 'GIF', subname: i18n.t('artwork.download.gif') },
  { name: 'WebM', subname: i18n.t('artwork.download.webm') }, // chrome only
]

export default {
  name: 'Artwork',
  components: {
    TopBar,
    ImageView,
    ArtworkMeta: Meta,
    AuthorCard,
    Related,
  },
  beforeRouteUpdate(to, from, next) {
    if (this.$refs.artworkMeta.showComments) {
      this.$refs.artworkMeta.showComments = false
      next(false)
      nprogress.done()
    } else {
      next()
    }
  },
  beforeRouteLeave(to, from, next) {
    if (this.$refs.artworkMeta.showComments) {
      this.$refs.artworkMeta.showComments = false
      next(false)
      nprogress.done()
    } else {
      next()
    }
  },
  data() {
    return {
      loading: false,
      artwork: {},
      ugoiraDownloadPanelShow: false,
      ugoiraDownloadPanelActions,
    }
  },
  computed: {
    ...mapGetters(['isCensored']),
  },
  watch: {
    $route() {
      if (
        this.$route.name === 'Artwork' &&
        this.$route.params.id != this.artwork.id
      ) {
        this.init()
      }
    },
  },
  mounted() {
    this.init()
  },
  methods: {
    init() {
      this.loading = true
      const id = +this.$route.params.id
      this.artwork = {}
      this.getArtwork(id)
    },
    async getArtwork(id) {
      // console.log(id);
      const res = await api.getArtwork(id)
      if (res.status === 0) {
        this.artwork = res.data
        this.loading = false

        if (this.isCensored(this.artwork)) {
          this.$toast({
            message: this.$t('common.content.hide'),
            icon: require('@/icons/ban-view.svg'),
          })
        }

        let historyList = await getCache('illusts.history', [])
        if (!Array.isArray(historyList)) historyList = []
        if (historyList.length > 100) historyList = historyList.slice(0, 100)
        historyList = _.uniqBy([res.data, ...historyList], 'id')
        setCache('illusts.history', historyList)
      } else {
        this.$toast({
          message: res.msg,
          icon: require('@/icons/error.svg'),
          duration: 3000,
        })
        setTimeout(() => {
          this.$router.back()
        }, 500)
      }
    },
    showUgPanelFromDlBtn() {
      if (!this.$refs.imgView.ugoira) {
        this.$toast(this.$t('artwork.download.ugoira.tip'))
        return
      }
      this.ugoiraDownloadPanelShow = true
    },
    onUgoiraDownloadPanelSelect(item) {
      this.$refs.imgView.download(item.name)
    },
    openUrl(url) {
      window.open(url, '_blank', 'noopener noreferrer')
    },
    async share() {
      const shareUrl = `https://pixiv.pics/i/${this.artwork.id}`
      try {
        await Share.share({
          title: 'Pixiv Viewer',
          text: `${this.$t('artwork.share.share')} ${this.artwork.author.name} ${this.$t('artwork.share.of_art')} ${this.artwork.title} - ID: ${this.artwork.id}`,
          url: shareUrl,
        })
      } catch (error) {
        console.log('error: ', error)
      }
    },
  },
}
</script>

<style lang="stylus">
img[src*="/api/qrcode?text"]
  position absolute
  top 50%
  left 50%
  transform translate(-50%, -50%)
  width 5rem !important
  height 5rem !important

.app-main:has(.artwork)
  padding 0

  .related
    padding-left 16px
    padding-right 16px
</style>
<style lang="stylus" scoped>
.artwork
  .skeleton
    margin: 30px 0;
  .share_btn
    position: fixed;
    top: 0;
    right 0
    padding: 0.8rem 0.5rem;
    z-index: 99;
    font-size 2.6em
    cursor pointer
    .svg-icon
      color: #fafafa;
      filter: drop-shadow(0.02667rem 0.05333rem 0.05333rem rgba(0,0,0,0.8));

  ::v-deep .van-share-sheet,.van-action-sheet
    width 10rem !important
    left 50% !important
    margin-left -5rem !important
  ::v-deep .van-share-sheet__option:first-child img
    background: #f2f3f5;
    border-radius: 50%;
  ::v-deep .van-share-sheet__options::-webkit-scrollbar
    height 0.12rem

.ia-cont
  display flex
  align-items flex-start
  min-height 100vh

  .ia-left
    display flex
    justify-content center
    align-items center
    width 72%
    min-width 72%
    margin-top 20px
    padding 0 20px

    ::v-deep .image-box
      width: 100% !important
      height: auto !important
      min-width 300px
      min-height 300px
      &:not(:last-child)
        margin-bottom 10px

      .image
        width auto
        max-width 100%
        height auto
        max-height 96vh
        margin 0 auto

  .ia-right
    max-width 28%
    padding-right 40px
    box-sizing border-box
    overflow hidden

.artwork
  ::v-deep .top-bar-wrap
    width 30vw
    background none

@media screen and (max-width: 1200px)
  .ia-cont
    display block !important

  .ia-left
    width 100% !important
    margin 0 auto !important
    padding 0 !important

    ::v-deep .image
      max-width: 100% !important
      max-height: 90vh !important

  .ia-right
    max-width unset !important
    padding-right 0 !important
    .artwork-meta
      margin-top 10px !important

</style>