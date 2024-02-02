<template>
  <div
    ref="view"
    class="image-view"
    :class="{ shrink: isShrink, loaded: artwork.images, censored: isCensored(artwork) }"
    @click="showFull"
  >
    <div
      v-for="(url, index) in artwork.images"
      :key="index"
      class="image-box"
      :style="index === 0 ? { width: `${displayWidth}px`, height: `${displayWidth / (artwork.width / artwork.height)}px` } : null"
    >
      <!-- :style="{height: `${(375/artwork.width*artwork.height).toFixed(2)}px`}" -->
      <ImagePximg
        v-longpress="isLongpressDL?e => downloadArtwork(e, index):null"
        :src="getImgUrl(url)"
        :alt="`${artwork.title} - Page ${index + 1}`"
        nobg
        class="image"
        @click.native.stop="view(index, isCensored(artwork))"
        @contextmenu.native="preventContext"
      />
      <canvas
        v-if="artwork.type === 'ugoira'"
        id="ugoira"
        ref="ugoira"
        class="ugoira"
        :width="artwork.width"
        :height="artwork.height"
        @click="openDownloadPanel()"
      ></canvas>
    </div>
    <Icon v-if="isShrink" class="dropdown" name="dropdown" scale="4" />
    <div v-if="artwork.type === 'ugoira'" class="ugoira-controls">
      <div v-if="ugoiraPlaying" class="btn-pause" @click="drawCanvas('pause')">
        <Icon class="pause" name="pause" scale="6" />
      </div>
      <div v-else class="btn-play" @click="playUgoira()">
        <Icon class="play" name="play" scale="6" />
      </div>
      <div v-if="progressShow" class="progress-bar" :style="{ width: `${progress * 100}%` }">
        <div class="background"></div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { Fancybox } from '@fancyapps/ui'
import { Dialog } from 'vant'
import nprogress from 'nprogress'
import JSZip from 'jszip'
import GIF from 'gif.js'
import tsWhammy from 'ts-whammy'
import api from '@/api'
import { LocalStorage } from '@/utils/storage'
import { downloadBlob, downloadFile, sleep, trackEvent } from '@/utils'
import { Filesystem, Directory } from '@himeka/capacitor-filesystem'
import { FFmpegKitPlugin } from '@himeka/capacitor-ffmpeg-kit'
import writeBlob from 'capacitor-blob-writer'

const imgResSel = LocalStorage.get('PXV_DTL_IMG_RES', 'Medium')
const isLongpressDL = LocalStorage.get('PXV_LONGPRESS_DL', false)

export default {
  props: {
    artwork: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      displayWidth: 0,
      displayHeight: 0,
      isShrink: false,
      ugoira: null,
      ugoiraPlaying: false,
      curIndex: 0,
      progressShow: false,
      progress: 0,
      isLongpressDL,
    }
  },
  computed: {
    original() {
      return this.artwork.images.map(url => url.o)
    },
    ...mapGetters(['isCensored']),
  },
  watch: {
    artwork(val) {
      if (val.images && val.images.length > 0) {
        this.init()
      }
    },
  },
  mounted() {
    this.init()
  },
  deactivated() {
    this.resetUgoira()
  },
  methods: {
    getImgUrl(urls) {
      const urlMap = {
        Medium: urls.l,
        Large: urls.l.replace(/\/c\/\d+x\d+(_\d+)?\//g, '/'),
        Original: urls.o,
      }
      return urlMap[imgResSel] || urls.l
    },
    view(index, censored) {
      if (censored) {
        this.$toast({
          message: this.$t('common.content.hide'),
          icon: require('@/icons/ban-view.svg'),
        })
      } else {
        Fancybox.show(this.artwork.images.map(e => ({
          src: e.o,
          thumb: e.l,
        })), {
          compact: false,
          backdropClick: 'close',
          contentClick: 'close',
          startIndex: index,
          Thumbs: { showOnStart: false },
          Carousel: { infinite: false },
          Toolbar: {
            display: {
              left: ['infobar'],
              middle: ['toggleZoom', 'myDownload', 'rotateCW', 'flipX', 'flipY', 'close'],
              right: [],
            },
            items: {
              myDownload: {
                tpl: '<button class="f-button"><svg><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 11l5 5 5-5M12 4v12"></path></svg></button>',
                click: async ev => {
                  console.log('ev: ', ev)
                  const { page } = ev.instance.carousel
                  const item = this.artwork.images[page]
                  const fileName = `${this.artwork.author.name}_${this.artwork.title}_${this.artwork.id}_p${page}.${item.o.split('.').pop()}`
                  await downloadFile(item.o, fileName)
                },
              },
            },
          },
        })
      }
    },
    preventContext(/** @type {Event} */ event) {
      if (!isLongpressDL) return true
      event.preventDefault()
      return false
    },
    async downloadArtwork(/** @type {Event} */ ev, index) {
      if (!isLongpressDL || this.artwork.type == 'ugoira') {
        return
      }
      ev.preventDefault()
      const src = this.artwork.images[index].o
      const fileName = `${this.artwork.author.name}_${this.artwork.title}_${this.artwork.id}_p${index}.${src.split('.').pop()}`
      const res = await Dialog.confirm({
        title: this.$t('wuh4SsMnuqgjHpaOVp2rB'),
        message: fileName,
        lockScroll: false,
        closeOnPopstate: true,
        cancelButtonText: this.$t('common.cancel'),
        confirmButtonText: this.$t('common.confirm'),
      }).catch(() => 'cancel')
      if (res != 'confirm') return
      await this.$nextTick()
      downloadFile(src, fileName)
    },
    showFull() {
      if (this.isShrink) this.isShrink = false
    },
    async ugoiraMetadata() {
      const res = await api.ugoiraMetadata(this.artwork.id)
      if (res.status === 0) {
        return Object.freeze(res.data)
      } else {
        this.$toast({
          message: res.msg,
        })
      }
    },
    async playUgoira() {
      if (this.progressShow) return

      if (this.ugoira) {
        this.drawCanvas('play')
        return
      }

      const ugoira = await this.ugoiraMetadata()
      const frames = {}
      ugoira.frames.forEach(frame => {
        frames[frame.file] = frame
      })

      this.ugoira = {
        frames,
        zip: ugoira.zip,
      }
      // console.log(this.ugoira);
      this.progressShow = true
      let zipUrl = ugoira.zip
      if (zipUrl.includes('i-cf.pximg.net')) zipUrl = zipUrl.replace('i-cf.pximg.net', 'i.pixiv.re')
      nprogress.start()
      window.CapacitorWebFetch(zipUrl).then(res => {
        return res.blob()
      }).then(blob => {
        nprogress.done()
        const jszip = new JSZip()
        jszip.loadAsync(blob).then(zip => {
          let index = 0
          const files = Object.keys(zip.files)
          files.forEach(name => {
            zip
              .file(name)
              .async('blob')
              .then(async blob => {
                return {
                  blob,
                  bmp: await createImageBitmap(blob),
                }
              })
              .then(({ blob, bmp }) => {
                this.ugoira.frames[name].blob = blob
                this.ugoira.frames[name].bmp = bmp

                if (++index === files.length) {
                  this.progressShow = false
                  this.drawCanvas('play')
                }
              })
          })
        }).catch(() => {})
      }).catch(error => {
        nprogress.done()
        this.resetUgoira()
        this.$toast({
          message: error.message,
        })
      })
    },
    drawCanvas(action) {
      const ctx = this.$refs.ugoira[0].getContext('2d')
      // console.log(ctx);
      const { width, height } = this.artwork

      const frames = Object.values(this.ugoira.frames)

      const draw = () => {
        this.curIndex++
        setTimeout(
          () => {
            if (!this.ugoira || !this.ugoiraPlaying) return

            // const imgUri = URL.createObjectURL(frames[this.curIndex - 1].data);
            // const imgData = new Image();
            // imgData.onload = () => {
            ctx.clearRect(0, 0, width, height)
            ctx.drawImage(frames[this.curIndex - 1].bmp, 0, 0, width, height)

            if (this.curIndex >= frames.length) this.curIndex = 0
            draw()
            // };
            // imgData.src = imgUri;
          },
          this.curIndex === 0 ? 0 : frames[this.curIndex - 1].delay
        )
      }

      if (action === 'play') {
        this.ugoiraPlaying = true
        draw()
      } else if (action === 'pause') {
        this.ugoiraPlaying = false
      }
    },
    downloadZIP() {
      downloadFile(
        this.ugoira.zip,
        `[${this.artwork.author.name}]_${this.artwork.title}_${this.artwork.id}.zip`,
        'ugoira'
      )
    },
    async downloadWebM() {
      if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
        this.$toast({
          message: this.$t('tips.ios_webm'),
          icon: require('@/icons/error.svg'),
        })
        return
      }

      this.$toast(this.$t('tip.down_wait'))
      await sleep(1000)

      const { width, height } = this.artwork

      const cacheCanvas = document.createElement('canvas')
      cacheCanvas.width = width
      cacheCanvas.height = height
      const ctx = cacheCanvas.getContext('2d')

      // const encoder = new global.Whammy.Video()
      // Object.values(this.ugoira.frames).forEach(frame => {
      //   ctx.clearRect(0, 0, width, height)
      //   ctx.drawImage(frame.bmp, 0, 0, width, height)
      //   encoder.add(ctx, frame.delay)
      // })
      // const webm = encoder.compile()

      const images = []
      let duration = 0
      Object.values(this.ugoira.frames).forEach(frame => {
        ctx.clearRect(0, 0, width, height)
        ctx.drawImage(frame.bmp, 0, 0, width, height)
        images.push(ctx.canvas.toDataURL('image/webp'))
        duration += frame.delay
      })

      const webm = tsWhammy.fromImageArrayWithOptions(images, { duration: duration / 1000 })

      downloadBlob(
        webm,
        `[${this.artwork.author.name}]_${this.artwork.title}_${this.artwork.id}.webm`,
        'ugoira'
      )
    },
    async downloadGIF() {
      this.$toast(this.$t('tip.down_wait'))
      await sleep(1000)

      let images = Object.values(this.ugoira.frames)
      let offset = 1
      if (images.length >= 100) {
        // 抽帧间隔
        offset = 2
        images = images.filter((frame, idx) => idx % offset === 0) // 抽帧
        // .map(frame => URL.createObjectURL(frame.blob));
      }

      const { width, height } = this.artwork

      const cacheCanvas = document.createElement('canvas')
      cacheCanvas.width = width
      cacheCanvas.height = height
      const ctx = cacheCanvas.getContext('2d')

      const gif = new GIF({
        workers: 10,
        quality: 10,
        width,
        height,
        workerScript: `${process.env.BASE_URL}static/js/gif.worker.js`,
      })
      Object.values(images).forEach(frame => {
        ctx.clearRect(0, 0, width, height)
        ctx.drawImage(frame.bmp, 0, 0, width, height)
        gif.addFrame(ctx, { copy: true, delay: frame.delay * offset })
      })
      gif.on('finished', blob => {
        downloadBlob(
          blob,
          `[${this.artwork.author.name}]_${this.artwork.title}_${this.artwork.id}.gif`,
          'ugoira'
        )
      })
      gif.render()
    },
    async saveFrames() {
      let duration = 0
      const images = Object.values(this.ugoira.frames)
      await Promise.all(images.map(async frame => {
        duration += frame.delay
        await writeBlob({
          blob: frame.blob,
          path: `ugoira_${this.artwork.id}/${frame.file}`,
          directory: Directory.External,
          recursive: true,
        })
      }))
      return images.length / duration * 1000
    },
    async convertUgoiraUsingFFmpeg(ext = 'mp4') {
      const loading = this.$toast.loading({
        duration: 0,
        forbidClick: true,
        message: this.$t('tip.down_wait'),
      })
      try {
        const rate = await this.saveFrames()
        const id = `${this.artwork.id}`
        const filename = `${this.artwork.id}`

        const input = (await Filesystem.getUri({ path: `ugoira_${id}`, directory: Directory.External })).uri + '/%06d.jpg'
        const exists = await Filesystem.stat({ path: 'pixiv-viewer/ugoira', directory: Directory.Downloads }).catch(() => false)
        if (!exists) {
          await Filesystem.mkdir({ path: 'pixiv-viewer/ugoira', directory: Directory.Downloads, recursive: true })
        }
        const { uri: output } = await Filesystem.getUri({ path: `pixiv-viewer/ugoira/${filename}.${ext}`, directory: Directory.Downloads })
        const cmds = {
          mp4: `-y -r ${rate} -i "${input}" -pix_fmt yuv420p -vf "pad=ceil(iw/2)*2:ceil(ih/2)*2" "${output}"`,
          gif: `-y -r ${rate} -i "${input}" -filter_complex [0:v]split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=5:diff_mode=rectangle -vsync 0 "${output}"`,
          apng: `-y -r ${rate} -i "${input}" -c:v apng -plays 0 -vsync 0 "${output}"`,
          webp: `-y -r ${rate} -i "${input}" -c:v libwebp -lossless 0 -compression_level 5 -quality 100 -loop 0 -vsync 0 "${output}"`,
          webm: `-y -r ${rate} -i "${input}" -c:v libvpx-vp9 -lossless 0 -crf 15 -b 0 -vsync 0 "${output}"`,
        }
        const { returnCode } = await FFmpegKitPlugin.execute({ command: cmds[ext] })
        if (returnCode != 0) {
          throw new Error('FFmpegKit ReturnCode: ' + returnCode)
        }

        await FFmpegKitPlugin.scanFile({ path: `pixiv-viewer/ugoira/${filename}.${ext}`, directory: Directory.Downloads })

        loading.clear()
        console.log('path: ', output)
        this.$toast(`${this.$t('tip.downloaded')}: ${output.replace('file://', '')}`)
      } catch (error) {
        loading.clear()
        console.log('error: ', error?.message)
        this.$toast({
          message: this.$t('D8R2062pjASZe9mgvpeLr') + ': ' + error?.message,
          icon: require('@/icons/error.svg'),
        })
      }
    },
    download(type) {
      trackEvent('Download Ugoira', { type })
      const actions = {
        'ZIP': () => this.downloadZIP(),
        'GIF(web)': () => this.downloadGIF(),
        'WebM(web)': () => this.downloadWebM(),
        'MP4(ffmpeg)': () => this.convertUgoiraUsingFFmpeg('mp4'),
        'GIF(ffmpeg)': () => this.convertUgoiraUsingFFmpeg('gif'),
        'APNG(ffmpeg)': () => this.convertUgoiraUsingFFmpeg('apng'),
        'WEBP(ffmpeg)': () => this.convertUgoiraUsingFFmpeg('webp'),
        'WEBM(ffmpeg)': () => this.convertUgoiraUsingFFmpeg('webm'),
        'MP4(ugoira-mp4)': () => window.open(`https://f.pixiv.pics/api/ugoira-mp4?id=${this.artwork.id}`, '_blank', 'noopener'),
        'MP4(ugoira.com)': () => window.open(`https://ugoira.com/i/${this.artwork.id}`, '_blank', 'noopener noreferrer'),
      }
      actions[type]?.()
    },
    openDownloadPanel() {
      if (this.progressShow) return

      if (this.ugoira) {
        this.$emit('open-download')
      } else {
        this.playUgoira()
      }
    },
    resetUgoira() {
      this.ugoira = null
      this.ugoiraPlaying = false
      this.curIndex = 0
      this.progress = 0
      this.progressShow = false
    },
    init() {
      this.resetUgoira()
      this.$nextTick(() => {
        this.displayWidth = document.getElementById('app').getBoundingClientRect().width
        this.displayHeight =
          this.displayWidth / (this.artwork.width / this.artwork.height)
        setTimeout(() => {
          if (this.artwork.images && this.artwork.images.length >= 3) {
            this.isShrink = true
          } else {
            this.isShrink = false
          }
        }, 0)
      })
    },
  },
}
</script>

<style lang="stylus" scoped>
.image-view {
  position: relative;
  min-height: 600px;
  // background-color: #fafafa;

  &.censored {
    pointer-events: none;
  }

  &.loaded {
    min-height: unset;
  }

  &.shrink {
    max-height: 1000px;
    overflow: hidden;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
      background: linear-gradient(to top, rgb(255, 255, 255), rgba(#fff, 0));
    }

    .dropdown {
      position: absolute;
      bottom: 26px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 1;
      color: #fafafa;
      filter: drop-shadow(1px 4px 8px rgba(0, 0, 0, 0.2));
      animation: ani-dropdown 2s ease-in-out infinite;
    }

    @keyframes ani-dropdown {
      0%, 100% {
        transform: translate(-50%, 0);
      }

      50% {
        transform: translate(-50%, 6px);
      }
    }
  }

  .image-box {
    position: relative;
    // background: #fafafa;

    &:nth-of-type(n+2) {
      min-height: 600px;
      // max-height: 1000px;
    }

    .image {
      display: block;
      width: 100%;
      height: 100%;
      // min-height: 600px;
      // max-height: 1000px;
      object-fit: cover;
      transition transform 0.5s
      transform none

      &[lazy="loading"] {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: scale(0.9);
        width: 120px !important;
        height: 120px !important;
        margin-left: -60px !important;
        margin-top: -60px !important;
        min-height: auto;
      }
    }

    .ugoira {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: auto;
      max-width: 100%;
      height: auto;
      max-height 100%
    }
  }

  .ugoira-controls {
    position: absolute;
    bottom: 0;
    width: 100%;

    .btn-play, .btn-pause {
      position: absolute;
      right: 16px;
      bottom: 16px;
      color: rgba(122, 172, 208, 0.9);
    }

    .progress-bar {
      position: absolute;
      bottom: 0;
      width: 0;
      height: 4px;
      overflow: hidden;
      transition: width 0.1s;

      .background {
        position: absolute;
        bottom: 0;
        width: 100%;
        height: 4px;
        background: linear-gradient(to right, #3fffa2 0%, #1a9be0 100%);
      }
    }
  }
}
</style>
