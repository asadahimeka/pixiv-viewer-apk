<template>
  <div class="HomeRecommIllust illusts">
    <top-bar />
    <h3 class="af_title">{{ $t('common.recomm_art') }}</h3>
    <wf-cont layout="Grid">
      <ImageCard v-for="art in artList" :key="art.id" mode="all" square :artwork="art" @click-card="toArtwork($event)" />
    </wf-cont>
    <van-loading v-if="!showLoadMoreBtn && loading" class="loading" :size="'50px'" />
    <van-empty v-if="!loading && !artList.length" :description="$t('tips.no_data')" />
    <div v-if="showLoadMoreBtn && !finished" class="flex-c" style="margin: .5rem 0;">
      <van-button
        size="small"
        loading-size="1em"
        :loading-text="$t('tips.loading')"
        :loading="loading"
        @click="loadMore"
      >
        {{ $t('tips.load_more') }}
      </van-button>
    </div>
  </div>
</template>

<script>
import TopBar from '@/components/TopBar'
import ImageCard from '@/components/ImageCard'
import api from '@/api'
import { filterRecommIllust } from '@/utils/filter'
import _ from 'lodash'

export default {
  name: 'RecommendIllust',
  components: {
    TopBar,
    ImageCard,
  },
  beforeRouteEnter(to, from, next) {
    next(vm => {
      vm.notFromDetail = from.name !== 'Artwork'
    })
  },
  data() {
    return {
      loading: false,
      artList: [],
      notFromDetail: true,
      finished: false,
      nextUrl: null,
      showLoadMoreBtn: window.APP_CONFIG.useLocalAppApi,
    }
  },
  activated() {
    // document.querySelector('.app-main')?.scrollTo({ top: 0 })
    this.init()
  },
  methods: {
    toArtwork(id) {
      this.$store.dispatch('setGalleryList', this.artList)
      this.$router.push({
        name: 'Artwork',
        params: { id },
      })
    },
    tryURL(url) {
      try {
        return new URL(url)
      } catch (_err) {
        return null
      }
    },
    async loadMore() {
      const params = {}
      if (!window.APP_CONFIG.useApiProxy) {
        const u = this.tryURL(this.nextUrl)
        if (u) {
          u.searchParams.forEach((v, k) => {
            params[k] = v
          })
        }
      }
      this.loading = true
      const res = await api.getRecommendedIllust(JSON.stringify(params))
      if (res.status === 0) {
        if (res.data.length) {
          this.artList = _.uniqBy([
            ...this.artList,
            ...res.data.filter(filterRecommIllust),
          ], 'id')
          this.nextUrl = res.data.nextUrl
        } else {
          this.finished = true
        }
      } else {
        this.$toast({
          message: res.msg,
        })
      }
      this.loading = false
    },
    async getArtList() {
      this.loading = true
      this.artList = []
      const res = await api.getRecommendedIllust()
      if (res.status === 0) {
        this.artList = res.data.filter(filterRecommIllust)
        this.nextUrl = res.data.nextUrl
      } else {
        this.$toast({
          message: res.msg,
          icon: require('@/icons/error.svg'),
        })
      }
      this.loading = false
    },
    init() {
      const { list } = this.$route.params
      if (list) {
        this.artList = list
        this.nextUrl = list.nextUrl
      } else if (this.notFromDetail) {
        this.getArtList()
      }
    },
  },
}
</script>

<style lang="stylus" scoped>
.af_title
  position relative
  margin-top 40px
  margin-bottom 40px
  text-align center
  font-size 28px

.illusts
  position relative
  padding-bottom 40px

  .loading
    margin-top: 2rem;
    text-align: center;

  ::v-deep .top-bar-wrap
    width 30%
    padding-top 20px
    background transparent

  .card-box
    padding: 0 12px
    display: flex
    flex-direction: row

    .image-card
      max-height: 360px
      margin: 4px 2px

</style>
