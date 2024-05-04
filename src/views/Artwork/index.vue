<template>
  <div class="artwork" :class="{ isSafari }">
    <TopBar />
    <div class="share_btn" @click="share">
      <Icon class="icon" name="share" />
    </div>
    <van-swipe-cell ref="swipeCell" :disabled="disableSwipe" stop-propagation @open="onSwipeOpen">
      <template #left>
        <div class="ia-sc-btn">
          <van-icon name="arrow-left" size="0.6rem" />
        </div>
      </template>
      <div class="ia-cont">
        <div class="ia-left">
          <van-loading v-if="loading" size="50px" />
          <ImageView ref="imgView" :artwork="artwork" @open-download="ugoiraDownloadPanelShow = true" />
        </div>
        <div class="ia-right">
          <van-skeleton class="skeleton" title avatar :row="5" row-width="200px" avatar-size="42px" :loading="loading">
            <ArtworkMeta ref="artworkMeta" :artwork="artwork" :maybe-ai-author="maybeAiAuthor" @ugoira-download="showUgPanelFromDlBtn" />
          </van-skeleton>
          <keep-alive>
            <AuthorCard v-if="artwork.author" :id="artwork.author.id" :key="artwork.id" @author-change="v => maybeAiAuthor = v" />
          </keep-alive>
        </div>
      </div>
      <template #right>
        <div class="ia-sc-btn">
          <van-icon name="arrow" size="0.6rem" />
        </div>
      </template>
    </van-swipe-cell>
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
// import nprogress from 'nprogress'
import api from '@/api'
import { getCache, setCache } from '@/utils/siteCache'
import { LocalStorage } from '@/utils/storage'
import _ from 'lodash'
import { i18n } from '@/i18n'
import { trackEvent, dealStatusBarOnEnter, dealStatusBarOnLeave, isSafari } from '@/utils'

const ugoiraDownloadPanelActions = [
  { name: 'ZIP', subname: i18n.t('artwork.download.zip') },
  { name: 'GIF', subname: i18n.t('artwork.download.gif') },
  { name: 'WebM', subname: i18n.t('artwork.download.webm') },
  { name: 'APNG', subname: i18n.t('artwork.download.webm') },
  { name: 'MP4(DL)', subname: i18n.t('gajzCbySkleDQrtXfX38H') },
  { name: 'MP4(Conv)', subname: i18n.t('artwork.download.mp4') },
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
  // beforeRouteUpdate(to, from, next) {
  //   if (this.$refs.artworkMeta?.showComments) {
  //     this.$refs.artworkMeta.showComments = false
  //     next(false)
  //     nprogress.done()
  //   } else {
  //     next()
  //   }
  // },
  beforeRouteEnter(to, from, next) {
    document.querySelector('.app-main')?.classList.add('isArtworkPage')
    dealStatusBarOnEnter()
    next()
  },
  beforeRouteLeave(to, from, next) {
    // if (this.$refs.artworkMeta?.showComments) {
    //   this.$refs.artworkMeta.showComments = false
    //   next(false)
    //   nprogress.done()
    // } else {
    document.querySelector('.app-main')?.classList.remove('isArtworkPage')
    // dealStatusBarOnLeave().then(() => next())
    dealStatusBarOnLeave()
    next()
    // }
  },
  data() {
    return {
      loading: false,
      artwork: {},
      ugoiraDownloadPanelShow: false,
      ugoiraDownloadPanelActions,
      disableSwipe: !LocalStorage.get('PXV_IMG_DTL_SWIPE', false),
      maybeAiAuthor: false,
      isSafari: isSafari(),
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
    document.querySelector('.app-main')?.classList.add('isArtworkPage')
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
        // setTimeout(() => {
        //   this.$router.back()
        // }, 500)
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
    onSwipeOpen({ position }) {
      this.$refs.swipeCell?.close()
      const list = this.$store.state.galleryList || []
      console.log('list: ', list)
      const curr = list.findIndex(e => e == this.artwork.id)
      console.log('curr: ', curr)
      if (position == 'left') {
        const prev = list[curr - 1]
        console.log('prev: ', prev)
        prev && this.$router.replace(`/artworks/${prev}`)
      } else {
        const next = list[curr + 1]
        console.log('next: ', next)
        next && this.$router.replace(`/artworks/${next}`)
      }
    },
    openUrl(url) {
      trackEvent('Open Link', { url })
      window.open(url, '_blank', 'noopener noreferrer')
    },
    async share() {
      const shareUrl = `https://pixiv.pics/i/${this.artwork.id}`
      try {
        await Share.share({
          title: 'Pixiv Viewer',
          text: `${this.$t('artwork.share.share')} ${this.artwork.author.name} ${this.$t('artwork.share.of_art')} ${this.artwork.title} - ID: ${this.artwork.id}`,
          url: shareUrl,
          dialogTitle: this.$t('artwork.share.share'),
        })
        trackEvent('Share Artwork')
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

.app-main.isArtworkPage,
.app-main:has(.artwork)
  padding 0 !important

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
    top: calc(0.6rem + var(--status-bar-height));
    right 0.5rem;
    z-index: 99;
    font-size 0.675rem
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
  ::v-deep .van-swipe-cell
    cursor auto

.ia-sc-btn
  display flex
  justify-content center
  align-items center
  width 0.7rem
  height 100%

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
    width 2rem
    padding-top calc(0.4rem + var(--status-bar-height))
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

@media screen and (max-width: 600px)
  .ia-left
    ::v-deep .image
      width 100% !important
      max-height unset !important

.artwork
  ::v-deep .top-bar-wrap
    width 2rem
    background none
  &.isSafari
    .image-view.loaded
      min-height auto
    .ia-right ::v-deep .artwork-meta
      padding 20px 30px 40px
      background #f5f5f5
      border-radius 20px
      @media screen and (max-width: 1200px)
        margin 0.26667rem 0.13333rem !important
      .shrink::after
        background: linear-gradient(to top, #f5f5f5, rgba(255,255,255,0));

</style>
