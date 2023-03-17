<template>
  <div class="image-card" :style="{ paddingBottom: paddingBottom(artwork) }" @click.stop="click(artwork.id)">
    <img v-lazy="imgSrc" :alt="artwork.title" class="image" :class="{ censored: isCensored(artwork) }">
    <div class="tag-r18-ai">
      <van-tag v-if="index">#{{ index }}</van-tag>
      <van-tag v-if="tagText" :color="tagText === 'R-18' ? '#fb7299' : '#ff3f3f'">{{ tagText }}</van-tag>
      <van-tag v-if="isAiIllust" color="#536cb8">&nbsp;AI&nbsp;</van-tag>
    </div>
    <div v-if="(mode == 'all' || mode === 'cover') && artwork.count > 1" class="layer-num">
      <Icon name="layer" scale="1.5" />
      {{ artwork.count }}
    </div>
    <Icon
      v-if="(mode == 'all' || mode === 'cover') && artwork.type === 'ugoira'"
      class="btn-play"
      name="play"
      scale="8"
    />
    <div v-if="mode == 'all' || mode === 'meta'" class="meta">
      <div class="content">
        <h2 class="title" :title="artwork.title">{{ artwork.title }}</h2>
        <div class="author-cont">
          <img :src="artwork.author.avatar" :alt="artwork.author.name" class="avatar" @error="onAvatarErr">
          <div class="author">{{ artwork.author.name }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
export default {
  props: {
    artwork: {
      type: Object,
      required: true,
    },
    mode: {
      type: String,
      required: false,
      default: 'cover',
    },
    column: {
      type: Number,
      required: false,
      default: 2,
    },
    index: {
      type: Number,
    },
    square: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {}
  },
  computed: {
    imgSrc() {
      if (this.square) {
        return this.artwork.images[0].s
      }
      return this.artwork.images[0].m
    },
    isAiIllust() {
      return this.artwork.illust_ai_type == 2
    },
    tagText() {
      if (this.artwork.x_restrict == 1) {
        return 'R-18'
      } else if (this.artwork.x_restrict == 2) {
        return 'R-18G'
      } else {
        return false
      }
    },
    ...mapGetters(['isCensored']),
  },
  methods: {
    onAvatarErr() {
      const src = this.artwork.author.avatar
      if (!src) return
      if (src.includes('i.pixiv.re')) return
      try {
        const u = new URL(src)
        u.host = 'i.pixiv.re'
        // eslint-disable-next-line vue/no-mutating-props
        this.artwork.author.avatar = u.href
      } catch (error) {
        console.log('error: ', error)
      }
    },
    click(id) {
      if (
        !id ||
        (this.$route.name === 'Artwork' && this.$route.params.id == id)
      ) { return false }

      this.$emit('click-card', id)
    },
    paddingBottom(artwork) {
      const pb = artwork.height / artwork.width * 100
      if (pb < 45) return '45%'
      if (pb > 160) return '160%'
      return pb.toFixed(2) + '%'
    },
  },
}
</script>

<style lang="stylus" scoped>
.image-card {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  background: #fafafa;
  margin-bottom: 10px;
  border-radius: 20px;

  .image {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;

    &[lazy="loading"] {
      width: 100px;
      height: 100px;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
  }

  .tag-r18-ai {
    position: absolute;
    top: 12px;
    left: 12px;
  }

  .layer-num {
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    background: rgba(#000, 0.3);
    color: #fff;
    padding: 4px 8px;
    font-size: 18px;
    border-radius: 5px;

    svg {
      vertical-align: bottom;
      margin-right: 4px;
    }
  }

  .btn-play {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    color: #565656;
    opacity: 0.6;
  }

  .meta {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;

    &::before {
      position: absolute;
      content: '';
      bottom: 0;
      width: 100%;
      height: 50%;
      background-image: linear-gradient(0deg, rgba(0, 0, 0, 0.5) 0%, rgba(255, 255, 255, 0) 100%);
    }

    .content {
      position: absolute;
      bottom: 0;
      width: 100%;
      padding: 18px 14px;
      box-sizing: border-box;
      color: #fff;

      .author-cont {
        display: flex;
        align-items: center;
      }

      .title {
        line-height: normal;
        font-size: 24px;
        margin: 10px 0;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
      }

      .avatar {
        width: 48px;
        min-width: 48px;
        height: 48px;
        margin-right: 8px;
        vertical-align: bottom;
        border-radius: 50%;
        overflow: hidden;
      }

      .author {
        display: inline-block;
        font-size: 20px;
        font-weight: 200;
      }
    }
  }
}
</style>