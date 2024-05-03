<template>
  <div class="main-layout">
    <div class="app-main">
      <transition v-if="isPageEffectOn" :name="transitionName" mode="out-in">
        <keep-alive>
          <router-view />
        </keep-alive>
      </transition>
      <keep-alive v-else>
        <router-view />
      </keep-alive>
    </div>
    <my-nav v-if="showNav" :is-nav-appear="isNavAppear" />
    <div v-else class="back_to_top" :class="{ 'back_to_top--show': !isNavAppear }" @click="scrollToTop()">
      <van-icon name="back-top" />
    </div>
  </div>
</template>

<script>
import Nav from '@/components/Nav'
import { throttleScroll } from '@/utils'
import { LocalStorage } from '@/utils/storage'

const isPageEffectOn = LocalStorage.get('PXV_PAGE_EFFECT', false)

export default {
  components: {
    'my-nav': Nav,
  },
  props: {
    showNav: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      isPageEffectOn,
      transitionName: isPageEffectOn ? 'fade' : '',
      isNavAppear: true,
    }
  },
  watch: {
    '$route'(to, from) {
      if (!isPageEffectOn) return
      const toDepth = to.meta.__depth
      const fromDepth = from.meta.__depth
      if (toDepth == fromDepth) {
        this.transitionName = 'fade'
      } else {
        this.transitionName = toDepth < fromDepth ? 'slide-right' : 'slide-left'
      }
      console.log('this.transitionName: ', this.transitionName)
    },
  },
  mounted() {
    addEventListener('scroll', throttleScroll(document.documentElement, scroll => {
      if (scroll > 160) this.isNavAppear = false
    }, () => {
      this.isNavAppear = true
    }), { passive: true })
  },
  methods: {
    scrollToTop() {
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' })
    },
  },
}
</script>

<style lang="stylus" scoped>
.main-layout
  box-sizing border-box

.app-main
  position relative
  // height 100vh
  padding 10px 8px 0
  box-sizing border-box
  // overflow-y auto

.back_to_top
  position fixed
  bottom 40PX
  right 20PX
  z-index 999
  display: flex;
  align-items: center;
  justify-content: center;
  width 40PX
  height 40PX
  cursor: pointer;
  color #fff
  border-radius 50%
  box-shadow: 0 2PX 8PX 0 rgba(0,0,0,.12);
  transform: scale(0);
  transition: .3s cubic-bezier(.25,.8,.5,1);
  background-color rgba(241, 194, 95, 0.9)
  ::v-deep .van-icon
    font-size 22PX
    font-weight 600
  &--show
    transform: scale(1);
  // @media screen and (max-width: 1280px)
    // display none
</style>
