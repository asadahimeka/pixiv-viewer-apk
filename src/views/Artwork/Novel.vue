<template>
  <div class="artwork">
    <TopBar />
    <div class="more_btn" @click="showSettings=!showSettings">
      <Icon class="icon" name="more3" />
    </div>
    <div class="ia-cont">
      <div class="ia-left">
        <van-loading v-if="loading" size="50px" style="margin-top: 3rem;" />
        <NovelView v-else :artwork="artwork" :text-obj="novelText" :text-config="textConfig" />
      </div>
      <div class="ia-right">
        <van-skeleton class="skeleton" title avatar :row="5" avatar-size="42px" :loading="loading">
          <NovelMeta is-novel :artwork="artwork" />
        </van-skeleton>
        <div v-if="!loading" class="series-btns">
          <van-button v-if="novelText.prev" color="#7232dd" size="small" plain block @click="toNovel(novelText.prev.id)">
            {{ $t('novel.series.prev') }} {{ novelText.prev.title }}
          </van-button>
          <van-button v-if="novelText.next" color="#7232dd" size="small" plain block @click="toNovel(novelText.next.id)">
            {{ $t('novel.series.next') }} {{ novelText.next.title }}
          </van-button>
          <van-button type="info" size="small" plain block @click="share">
            {{ $t('artwork.share.share') }}
          </van-button>
          <van-button type="info" size="small" plain block @click="downloadNovel">
            {{ $t('common.download') }}
          </van-button>
        </div>
        <keep-alive>
          <AuthorNovelCard v-if="artwork.author" :id="artwork.author.id" :key="artwork.id" />
        </keep-alive>
      </div>
    </div>
    <van-divider style="margin: 0.7rem 0;" />
    <keep-alive>
      <RelatedNovel :key="artwork.id" :artwork="artwork" />
    </keep-alive>
    <van-share-sheet v-model="showShare" :title="$t('artwork.share.title')" :options="shareOptions" @select="onShareSel" />
    <van-action-sheet v-model="showSettings" class="setting-actions" :title="$t('novel.settings.title')" :overlay="false">
      <div class="configs">
        <div class="conf-title">{{ $t('novel.settings.text.size') }}</div>
        <div class="conf-inp">
          <van-slider v-model="textConfig.size" :min="12" :max="36" class="conf-slider" @change="onSizeChange" />
        </div>
        <div class="conf-fcont">
          <div class="conf-fitem">
            <div class="conf-title">{{ $t('novel.settings.text.font') }}</div>
            <div class="conf-inp">
              <van-radio-group v-model="textConfig.font" direction="horizontal">
                <van-radio name="sans-serif">{{ $t('novel.settings.text.sans') }}</van-radio>
                <van-radio name="serif">{{ $t('novel.settings.text.serif') }}</van-radio>
              </van-radio-group>
            </div>
          </div>
          <div class="conf-fitem">
            <div class="conf-title">{{ $t('novel.settings.text.direction') }}</div>
            <div class="conf-inp">
              <van-radio-group v-model="textConfig.direction" direction="horizontal">
                <van-radio name="h">{{ $t('novel.settings.text.direct_h') }}</van-radio>
                <van-radio name="v">{{ $t('novel.settings.text.direct_v') }}</van-radio>
              </van-radio-group>
            </div>
          </div>
        </div>
        <div class="conf-title">{{ $t('novel.settings.text.height') }}</div>
        <div class="conf-inp">
          <van-slider v-model="textConfig.height" :min="1" :max="5" :step="0.5" class="conf-slider" @change="onSizeChange" />
        </div>
        <div class="conf-title">{{ $t('novel.settings.text.weight') }}</div>
        <div class="conf-inp">
          <van-slider v-model="textConfig.weight" :min="100" :max="900" :step="100" class="conf-slider" @change="onSizeChange" />
        </div>
        <div class="conf-fcont">
          <div class="conf-fitem">
            <div class="conf-title">{{ $t('novel.settings.text.color') }}</div>
            <div class="conf-inp">
              <input v-model="textConfig.color" type="color">
            </div>
          </div>
          <div class="conf-fitem">
            <div class="conf-title">{{ $t('novel.settings.text.bg') }}</div>
            <div class="conf-inp">
              <input v-model="textConfig.bg" type="color">
            </div>
          </div>
        </div>
      </div>
    </van-action-sheet>
  </div>
</template>

<script>
import _ from 'lodash'
import { Share } from '@capacitor/share'
import { mapGetters } from 'vuex'
import api from '@/api'
import { downloadBlob, trackEvent } from '@/utils'
import { getCache, setCache } from '@/utils/siteCache'
import { LocalStorage } from '@/utils/storage'
import TopBar from '@/components/TopBar'
import NovelView from './components/NovelView.vue'
import Meta from './components/Meta'
import AuthorNovelCard from './components/AuthorNovelCard.vue'
import RelatedNovel from './components/RelatedNovel.vue'

const textConfig = LocalStorage.get('PXV_TEXT_CONFIG', {
  size: 16,
  height: 2,
  font: 'sans-serif',
  weight: 400,
  direction: 'h',
  color: '#1f1f1f',
  bg: '#ffffff',
})

export default {
  name: 'NovelDetail',
  components: {
    TopBar,
    NovelMeta: Meta,
    AuthorNovelCard,
    NovelView,
    RelatedNovel,
  },
  data() {
    return {
      loading: false,
      artwork: {},
      novelText: {},
      showSettings: false,
      textConfig,
    }
  },
  computed: {
    ...mapGetters(['isCensored']),
  },
  watch: {
    $route() {
      if (
        this.$route.name === 'NovelDetail' &&
        this.$route.params.id != this.artwork.id
      ) {
        this.init()
      }
    },
    textConfig: {
      deep: true,
      handler(val) {
        LocalStorage.set('PXV_TEXT_CONFIG', val)
      },
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
      this.novelText = {}
      Promise.all([
        this.getArtwork(id),
        this.getNovelText(id),
      ]).finally(() => {
        this.loading = false
      })
    },
    async getNovelText(id) {
      const res = await api.getNovelText(id)
      if (res.status === 0) {
        this.novelText = res.data
      } else {
        this.$toast({
          message: res.msg,
          icon: require('@/icons/error.svg'),
          duration: 3000,
        })
      }
    },
    async getArtwork(id) {
      const res = await api.getNovelDetail(id)
      if (res.status === 0) {
        this.artwork = res.data

        if (this.isCensored(this.artwork)) {
          this.$toast({
            message: this.$t('common.content.hide'),
            icon: require('@/icons/ban-view.svg'),
          })
        }

        let historyList = await getCache('novels.history', [])
        if (!Array.isArray(historyList)) historyList = []
        if (historyList.length > 100) historyList = historyList.slice(0, 100)
        historyList = _.uniqBy([res.data, ...historyList], 'id')
        setCache('novels.history', historyList)
      } else {
        this.$toast({
          message: res.msg,
          icon: require('@/icons/error.svg'),
          duration: 3000,
        })
      }
    },
    openUrl(url) {
      trackEvent('Open Link', { url })
      window.open(url, '_blank', 'noopener noreferrer')
    },
    async share() {
      const shareUrl = `https://pixiv.pics/n/${this.artwork.id}`
      try {
        await Share.share({
          title: 'Pixiv Viewer',
          text: `${this.$t('artwork.share.share')} ${this.artwork.author.name} ${this.$t('artwork.share.of_art')} ${this.artwork.title} - ID: ${this.artwork.id}`,
          url: shareUrl,
        })
        trackEvent('Share Novel')
      } catch (error) {
        console.log('error: ', error)
      }
    },
    toNovel(id) {
      this.$router.push(`/novel/${id}`)
    },
    onSizeChange(value) {
      this.$toast(this.$t('tips.current_value') + value)
    },
    async downloadNovel() {
      trackEvent('Download Novel')
      await downloadBlob(new Blob([this.novelText.text]), `${this.artwork.id}_${this.artwork.title}.txt`)
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
  .more_btn
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

  .series-btns
    padding 0 40px
    ::v-deep
      .van-button
        &:not(:last-child)
          margin-bottom 10px
        .van-button__text
          overflow: hidden
          text-overflow: ellipsis
          white-space: nowrap

  ::v-deep .van-share-sheet
    width 10rem !important
    left 50% !important
    margin-left -5rem !important
  ::v-deep .van-share-sheet__option:first-child img
    background: #f2f3f5;
    border-radius: 50%;
  ::v-deep .van-share-sheet__options::-webkit-scrollbar
    height 0.12rem

.setting-actions
  max-width 750px
  height 600px
  overflow-y auto
  left unset
  right 0
  box-shadow 0px 0px 8px 2px #ccc;
  .configs
    padding 20px 50px 120px
  .conf-fcont
    display flex
    align-items center
  .conf-fitem
    width 50%
    flex 1
  .conf-title
    margin 20px 0 30px
    padding: 20px 16px 0 16px;
    color: #777
    font-size: 15PX;
    font-weight bold
  .conf-inp
    padding-left 20px
  .conf-slider
    margin-top 40px

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
    margin-bottom 60px
    padding-right 40px
    box-sizing border-box
    overflow hidden
    ::v-deep
      .artwork-meta
        padding 20px 30px 40px
        background #f5f5f5
        border-radius 20px
      .shrink::after
        background: linear-gradient(to top, #f5f5f5, rgba(255,255,255,0));

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
    ::v-deep .novel_text
      width 660px

  .ia-right
    max-width unset !important
    padding-right 0 !important
    .artwork-meta
      margin 20px 10px !important
      padding 20px 30px
    ::v-deep
      .artwork-list
        height 4.5rem !important
      .author-card .artwork-list-wrap .artwork-list .swiper-slide .image-slide
        height 4.2rem !important

</style>
