<template>
  <img v-if="direct" :class="{'fadeIn':!loading}" :src="directSrc" :style="bgStyle" :lazy="lazy" :alt="alt" @load="revokeURL">
  <img v-else-if="isVLazy" v-lazy="src" :alt="alt">
  <img
    v-else
    class="img3"
    loading="lazy"
    :src="src"
    :alt="alt"
    :style="bgStyle"
    :lazy="lazy"
    @load="loading=false"
  >
</template>

<script>
import store from '@/store'
import platform from '@/platform'
import { loadingSvg as loadSvg } from '@/icons'
import { randomBg } from '@/utils'

const loadingSvg = loadSvg(localStorage.PXV_ACT_COLOR || '#38a9f5')
const defSrc = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='

const { isImgLazy, isDirectPximg } = store.state.appSetting

export default {
  name: 'DirectPximg',
  props: {
    src: {
      type: String,
      required: true,
    },
    alt: {
      type: String,
      default: '',
    },
    nobg: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      loading: true,
      localSrc: '',
      isVLazy: isImgLazy,
      direct: isDirectPximg,
    }
  },
  computed: {
    lazy() {
      return this.nobg && this.loading ? 'loading' : 'loaded'
    },
    bgStyle() {
      return { background: !this.nobg && this.loading ? randomBg() : 'none' }
    },
    directSrc() {
      return this.loading
        ? (this.nobg ? loadingSvg : defSrc)
        : this.localSrc
    },
  },
  watch: {
    src() {
      if (!this.isVLazy && this.$parent.playUgoira) {
        this.loading = true
      }
    },
  },
  mounted() {
    if (this.direct) this.setObserver()
  },
  methods: {
    revokeURL() {
      if (this.localSrc?.startsWith('blob:')) {
        URL.revokeObjectURL(this.localSrc)
      }
    },
    setObserver() {
      const options = {
        rootMargin: '0px 50px 50px 0px',
        threshold: [0],
      }
      const ob = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting && this.loading) {
          this.setImgSrc()
          ob.disconnect()
        }
      }, options)
      ob.observe(this.$el)
    },
    async setImgSrc() {
      try {
        const url = new URL(this.src)
        if (url.host == 's.pximg.net') {
          this.localSrc = this.src
          this.loading = false
          return
        }

        if (platform.isCapacitor) {
          const { getPximgUri } = await import('@/platform/capacitor/utils')
          this.localSrc = await getPximgUri(url)
          this.loading = false
          return
        }

        this.localSrc = this.src
        this.loading = false
      } catch (error) {
        console.log('error: ', error)
      }
    },
  },
}
</script>
