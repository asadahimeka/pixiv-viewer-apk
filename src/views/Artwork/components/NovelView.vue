<template>
  <div
    ref="view"
    class="novel-view"
    :class="{ shrink: isShrink, loaded: artwork.images, censored }"
    :style="{ backgroundColor: textConfig.bg }"
    @click="showFull"
  >
    <div class="image-box">
      <ImagePximg :src="getImgUrl" nobg :alt="artwork.title" class="image" />
    </div>
    <div
      class="novel_text"
      :class="{ vertical: textConfig.direction=='v' }"
      :style="novelStyle"
      v-html="novelText"
    >
    </div>
    <Icon v-if="isShrink" class="dropdown" name="dropdown" scale="4" />
  </div>
</template>

<script>
import { imgProxy } from '@/api'
import { mapGetters } from 'vuex'

const fontMap = {
  'sans-serif': 'YuGothic, "Hiragino Kaku Gothic Pro", Meiryo, "Source Han Sans", "Source Han Sans JP", "Noto Sans CJK JP", "Avenir Next", Avenir, "Source Sans", "Noto Sans", Roboto, Verdana, "Pingfang TC", "Pingfang HK", "Hiragino Sans CNS", "Lantinghei TC", "Source Han Sans TW", "Source Han Sans HK", "Noto Sans CJK TC", "Microsoft JhengHei", "Pingfang SC", "Hiragino Sans GB", "Lantinghei SC", "Source Han Sans CN", "Noto Sans CJK SC", "Microsoft Yahei", DengXian, "Apple SD Gothic Neo", "Source Han Sans K", "Source Han Sans KR", "Noto Sans CJK KR", "Malgun Gothic", sans-serif',
  'serif': '"Source Serif Pro", "Source Serif", "Noto Serif", "Times New Roman", "Georgia Pro", Georgia, "Songti SC", "Source Han Serif SC", "Source Han Serif CN", "Noto Serif SC", Simsun, "Yu Mincho", YuMincho, "Hiragino Mincho ProN", "Hiragino Mincho Pro", "Source Han Serif", "Source Han Serif JP", "BIZ UDMincho Medium", "Noto Serif JP", "Songti TC", "Source Han Serif TC", "Source Han Serif TW", "Source Han Serif HK", "Noto Serif TC", PMingLiu, AppleMyungjo, "Source Han Serif K", "Source Han Serif KR", "Noto Serif KR", Batang, serif',
  'lxgw': '"LXGW WenKai Screen", sans-serif',
}

export default {
  name: 'NovelView',
  props: {
    artwork: {
      type: Object,
      required: true,
    },
    textObj: {
      type: Object,
      required: true,
    },
    textConfig: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      isShrink: this.textConfig.direction == 'h',
    }
  },
  computed: {
    ...mapGetters(['isCensored']),
    censored() {
      return this.isCensored(this.artwork)
    },
    getImgUrl() {
      return this.artwork.images?.[0]?.m || ''
    },
    novelText() {
      return this.textObj.text
        ?.replace(/\n/g, '<br>')
        ?.replace(/\[newpage\]/g, '<hr style="margin: 1rem 0;font-weight: bold;font-size: 1.2em;">')
        ?.replace(/\[\[rb:([^>[\]]+) *> *([^>[\]]+)\]\]/g, '<ruby>$1<rt>$2</rt></ruby>')
        ?.replace(/\[\[jumpuri:([^>\s[\]]+) *> *([^>\s[\]]+)\]\]/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>')
        ?.replace(/\[pixivimage:([\d-]+)\]/g, '<img style="display:block;max-width:100%;margin:auto" src="https://pixiv.re/$1.png" alt>')
        ?.replace(/\[chapter: *([^[\]]+)\]/g, '<h2 style="margin: 1rem 0;font-weight:bold;font-size:1.5em">$1</h3>')
        ?.replace(/\[uploadedimage:(\d+)\]/g, (_, $1) => `<img style="display:block;max-width:100%;margin:auto" src="${this.getEmbedImg($1)}" alt>`)
        ?.replace(/若想浏览插图，还请使用网页版。/g, '-- Image --')
    },
    novelStyle() {
      return {
        fontSize: this.textConfig.size + 'px',
        lineHeight: this.textConfig.height,
        fontWeight: this.textConfig.weight,
        fontFamily: fontMap[this.textConfig.font],
        color: this.textConfig.color,
      }
    },
  },
  watch: {
    textConfig: {
      deep: true,
      handler(val) {
        if (val.font == 'lxgw') this.loadLxgwFont()
      },
    },
  },
  mounted() {
    if (this.textConfig.font == 'lxgw') this.loadLxgwFont()
  },
  methods: {
    showFull() {
      if (this.isShrink) this.isShrink = false
    },
    loadLxgwFont() {
      document.head.insertAdjacentHTML('beforeend', '<link rel="stylesheet" href="https://lib.baomitu.com/lxgw-wenkai-screen-webfont/1.7.0/style.min.css">')
    },
    getEmbedImg(id) {
      const urls = this.textObj.embedImgs?.[id]?.urls
      return imgProxy(urls?.['1200x1200'] || urls?.original || '')
    },
  },
}
</script>

<style lang="stylus" scoped>
.novel_text
  width 900px
  margin 40px auto
  line-height 2
  white-space pre-wrap
  font-feature-settings: normal;
  overflow-wrap: break-word;
  text-align: justify;
  user-select text !important

  &.vertical
    width 90%
    height 75vh
    padding 10px 20px 40px
    overflow-x: auto;
    writing-mode: vertical-rl;

.novel-view {
  position: relative;
  width 100%
  min-height: 600px;
  margin-top 40px

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

      &[lazy="loading"] {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 120px !important;
        height: 120px !important;
        min-height: auto;
      }
    }
  }

}
</style>
