<template>
  <div class="Home">
    <div class="com_sel_tabs">
      <div v-t="'common.illust'" class="com_sel_tab cur"></div>
      <div v-t="'common.manga'" class="com_sel_tab" @click="$router.replace('/home_manga')"></div>
      <div v-t="'common.novel'" class="com_sel_tab" @click="$router.replace('/home_novel')"></div>
      <div v-t="'g4JWYmBbfeweCBkRSgGNw'" class="com_sel_tab" @click="$router.push('/lives')"></div>
    </div>
    <div class="home-i">
      <div class="rec-cards">
        <RankCard />
        <SpotlightCard />
      </div>
      <Recomm4U v-if="isWebLogin" />
      <template v-else>
        <div class="rec-cards">
          <RecommendIllustCard />
          <DiscoveryCard />
        </div>
        <RandomIllust />
        <LatestIllustCard v-if="isSelfHibi" />
      </template>
    </div>
  </div>
</template>

<script>
import RankCard from './components/RankCard.vue'
import SpotlightCard from '../Spotlights/SpotlightCard.vue'
import DiscoveryCard from '../Discovery/DiscoveryCard.vue'
import RecommendIllustCard from '../Discovery/RecommendIllustCard.vue'
import RandomIllust from './components/RandomIllust.vue'
import LatestIllustCard from '../Discovery/LatestIllustCard.vue'
import Recomm4U from './components/Recomm4U.vue'
import { notSelfHibiApi } from '@/api/http'
import { existsSessionId } from '@/api/user'

const isWebLogin = existsSessionId()

export default {
  name: 'HomeIllust',
  components: {
    RankCard,
    SpotlightCard,
    DiscoveryCard,
    RecommendIllustCard,
    RandomIllust,
    LatestIllustCard,
    Recomm4U,
  },
  data() {
    return {
      isSelfHibi: !notSelfHibiApi,
      isWebLogin,
    }
  },
}
</script>

<style lang="stylus">
.rec-cards
  display flex

  .rank-card
    flex 1
    width 48%

@media screen and (max-width: 767px)
  .rec-cards
    display block

    .rank-card
      width auto

</style>
<style lang="stylus" scoped>
.com_sel_tabs
  z-index 99
  top 0
  padding calc(0.3rem + var(--status-bar-height)) 0 0.3rem
  background: rgba(255,255,255,1)
.home-i
  padding-bottom 100px
  background #fff

  ::v-deep .cell .title
    font-size 36px

  ::v-deep .image-slide
    background #f9ba48

  ::v-deep .image-slide:not(:has(.d-loading))
    background none

  ::v-deep .svg-icon
    margin-right 10px
    vertical-align -0.15rem

</style>
