<template>
  <img v-if="direct" :class="{'fadeIn':!loading}" :src="directSrc" :style="bgStyle" :lazy="lazy" :alt="alt">
  <img v-else v-lazy="src" :alt="alt">
</template>

<script>
import { Capacitor } from '@capacitor/core'
import { Filesystem, Directory } from '@himeka/capacitor-filesystem'
import { LocalStorage } from '@/utils/storage'
import { randomBg } from '@/utils'

const loadingSvg = require('@/icons/loading.svg')
const defSrc = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=='
const direct = LocalStorage.get('PXV_PXIMG_DIRECT', false)

export default {
  name: 'ImagePximg',
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
      direct,
      loadingSvg,
      loading: true,
      localSrc: '',
    }
  },
  computed: {
    lazy() {
      return this.nobg && this.loading ? 'loading' : undefined
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
  mounted() {
    if (this.direct) this.setObserver()
  },
  methods: {
    randomBg,
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
        url.host = window.p_pximg_ip
        const path = url.pathname.slice(1)
        const directory = Directory.External
        const stats = await Filesystem.stat({ path, directory }).catch(() => ({ uri: null }))
        if (stats.uri) {
          this.localSrc = Capacitor.convertFileSrc(stats.uri)
          this.loading = false
          return
        }
        const res = await Filesystem.downloadFile({
          url: url.href,
          path,
          directory,
          recursive: true,
          headers: { Host: 'i.pximg.net', Referer: 'https://www.pixiv.net' },
        })
        this.localSrc = Capacitor.convertFileSrc(res.path)
        this.loading = false
      } catch (error) {
        console.log('error: ', error)
      }
    },
  },
}
</script>
