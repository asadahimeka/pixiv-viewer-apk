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
    <my-nav v-if="showNav" />
  </div>
</template>

<script>
import Nav from '@/components/Nav'
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

</style>
