<template>
  <div class="search">
    <div class="search-bar-wrap" :class="{ dropdown: focus }">
      <van-search
        v-model="keywords"
        class="search-bar"
        shape="round"
        :placeholder="$t('search.placeholder')"
        maxlength="50"
        :clearable="false"
        @input="onSearchInput"
        @focus="onFocus"
        @search="onSearch"
      />
      <div ref="words" class="search-bar-word" @click="handleWordsClick($event)">
        <span v-if="keywordsList.length === 0 && !lastWord" class="placeholder">{{ $t('search.placeholder') }}</span>
        <div v-for="(word, index) in keywordsList" :key="index" class="word">
          <span class="text">{{ word }}</span>
          <span class="close" :data-index="index"></span>
        </div>
        <div v-if="lastWord && keywords.trim()" class="word">
          <span class="text no-line">{{ lastWord }}</span>
        </div>
      </div>
      <div
        v-if="(isSelfHibi && keywords.trim() && artList.length)"
        class="show_pop_icon"
        @click="(showPopPreview = !showPopPreview)"
      >
        <Icon class="icon" name="popular" />
      </div>
    </div>
    <div v-if="focus" class="search-dropdown">
      <div v-if="keywords.trim()" class="pid-n-uid">
        <div class="keyword" @click="onSearch">{{ $t('search.seach_tag') }} {{ keywords.trim() }} </div>
        <div v-if="isSelfHibi" class="keyword" @click="$router.push(`/search_user/${keywords.trim()}`)">
          {{ $t('search.search_user') }} {{ keywords.trim() }}
        </div>
      </div>
      <div v-if="pidOrUidList.length" class="pid-n-uid">
        <template v-for="n in pidOrUidList">
          <div :key="'p_' + n" class="keyword" @click="toPidPage(n)">→ {{ $t('common.artwork') }} ID: {{ n }} </div>
          <div :key="'u_' + n" class="keyword" @click="toUidPage(n)">→ {{ $t('common.user') }} ID: {{ n }} </div>
          <!-- <div :key="'s_' + n" class="keyword" @click="toSpotlightPage(n)">→ 特辑 ID: {{ n }} </div> -->
        </template>
      </div>
      <div v-if="keywords.trim() && autoCompleteTagList.length" class="search-history">
        <div class="title-bar">{{ $t('search.autocomplete') }}</div>
        <div v-for="tag in autoCompleteTagList" :key="tag" class="keyword" @click="searchTag(tag)">
          {{ tag }}
        </div>
      </div>
      <div v-if="!keywords.trim() && searchHistory.length > 0" class="search-history">
        <div class="title-bar">
          {{ $t('search.history') }}
          <div @click="clearHistory">
            <Icon name="del" scale="2" />
          </div>
        </div>
        <div v-for="(word, index) in searchHistory" :key="index" class="keyword" @click="searchTag(word)">
          {{ word }}
        </div>
      </div>
    </div>
    <ImageSearch v-show="!focus && !keywords.trim()" ref="imageSearch" key="container" />
    <div v-show="!focus && !keywords.trim()" class="com_sel_tabs">
      <div class="com_sel_tab cur">{{ $t('common.illust_manga') }}</div>
      <div class="com_sel_tab" @click="$router.replace('/search_novel')">{{ $t('common.novel') }}</div>
      <div class="com_sel_tab" @click="$router.replace('/search_user')">{{ $t('common.user') }}</div>
    </div>
    <div class="list-wrap" :class="{ focus: focus }" :style="{ paddingTop: keywords.trim() ? '1.6rem' : '2.6rem' }">
      <div v-show="keywords.trim()" class="search_params">
        <van-dropdown-menu class="search_param_sel" active-color="#f2c358">
          <template v-if="!showPopPreview">
            <van-dropdown-item v-model="searchParams.mode" :options="searchModes" />
            <van-dropdown-item v-model="searchParams.order" :options="searchOrders" />
            <van-dropdown-item v-model="searchParams.duration" :options="searchDuration" />
            <van-dropdown-item v-model="usersIriTag" :options="usersIriTags" />
          </template>
          <van-dropdown-item ref="s_date" :title="$t('common.date')">
            <div class="sel_search_date">
              <span>{{ $t('search.date.start') }}</span>
              <input v-model="searchDateValS" type="date" :min="minDate" :max="maxDate">
              <br>
              <span>{{ $t('search.date.end') }}</span>
              <input v-model="searchDateValE" type="date" :min="minDate" :max="maxDate">
            </div>
            <div style="width: 9.4rem;margin: 5px auto 10px">
              <van-button
                style="height: 36px;"
                block
                round
                color="#f2c358"
                @click="searchByDate"
              >
                {{ $t('common.confirm') }}
              </van-button>
            </div>
            <div style="width: 9.4rem;margin: 5px auto 10px">
              <van-button
                style="height: 36px;"
                block
                round
                @click="resetSearchDate"
              >
                {{ $t('common.reset') }}
              </van-button>
            </div>
          </van-dropdown-item>
        </van-dropdown-menu>
      </div>
      <PopularPreview v-if="showPopPreview && keywords.trim()" ref="popPreview" :word="keywords" :params="searchParams" />
      <van-list
        v-else-if="keywords.trim()"
        v-model="loading"
        class="result-list"
        :loading-text="$t('tips.loading')"
        :finished="finished"
        :error.sync="error"
        :immediate-check="false"
        :offset="800"
        :finished-text="$t('tips.no_more')"
        :error-text="$t('tips.net_err')"
        @load="doSearch"
      >
        <wf-cont v-bind="$store.getters.wfProps">
          <ImageCard v-for="art in artList" :key="art.id" mode="all" :artwork="art" @click-card="toArtwork($event)" />
        </wf-cont>
      </van-list>
      <Tags v-if="!keywords.trim()" @search="searchTag" />
      <van-loading v-show="keywords.trim() && artList.length == 0 && !finished" class="loading" :size="'50px'" />
      <div class="mask" @click="focus = false"></div>
    </div>
  </div>
</template>

<script>
import ImageCard from '@/components/ImageCard'
import Tags from './components/Tags'
import ImageSearch from './components/ImageSearch'
import { mapState, mapActions } from 'vuex'
import _ from 'lodash'
import dayjs from 'dayjs'
import api from '@/api'
import { notSelfHibiApi } from '@/api/http'
import PopularPreview from './components/PopularPreview.vue'

export default {
  name: 'Search',
  components: {
    Tags,
    ImageSearch,
    ImageCard,
    PopularPreview,
  },
  data() {
    return {
      scrollTop: 0,
      keywords__: '',
      keywords: '', // 关键词搜索框真实搜索内容
      keywordsList: [], // 关键词搜索框分词列表（空格分割）
      lastWord: '', // 正在输入的关键词
      focus: false, // 编辑框是否获取焦点
      curPage: 1,
      artList: [], // 作品列表
      error: false,
      loading: false,
      finished: false,
      maskShow: false,
      imageSearchShow: true,
      autoCompleteTagList: [],
      usersIriTag: '',
      usersIriTags: [
        { text: 'users入り', value: '' },
        { text: '30000users入り', value: '30000users入り' },
        { text: '20000users入り', value: '20000users入り' },
        { text: '10000users入り', value: '10000users入り' },
        { text: '7500users入り', value: '7500users入り' },
        { text: '5000users入り', value: '5000users入り' },
        { text: '1000users入り', value: '1000users入り' },
        { text: '500users入り', value: '500users入り' },
        { text: '250users入り', value: '250users入り' },
        { text: '100users入り', value: '100users入り' },
      ],
      minDate: '2007/09/13',
      maxDate: dayjs().format('YYYY/MM/DD'),
      searchParams: {
        mode: 'partial_match_for_tags',
        order: 'date_desc',
        duration: '',
        start_date: '',
        end_date: '',
      },
      searchDateValS: null,
      searchDateValE: null,
      searchModes: [
        { text: this.$t('search.mode.partial'), value: 'partial_match_for_tags' },
        { text: this.$t('search.mode.exact'), value: 'exact_match_for_tags' },
        { text: this.$t('search.mode.title'), value: 'title_and_caption' },
      ],
      searchOrders: [
        { text: this.$t('search.date.desc'), value: 'date_desc' },
        { text: this.$t('search.date.asc'), value: 'date_asc' },
      ],
      searchDuration: [
        { text: this.$t('search.dura.ph'), value: '' },
        { text: this.$t('search.dura.day'), value: 'within_last_day' },
        { text: this.$t('search.dura.week'), value: 'within_last_week' },
        { text: this.$t('search.dura.month'), value: 'within_last_month' },
      ],
      showPopPreview: false,
      isSelfHibi: !notSelfHibiApi,
    }
  },
  computed: {
    ...mapState(['searchHistory']),
    pidOrUidList() {
      return this.keywords.match(/(\d+)/g) || []
    },
  },
  watch: {
    $route() {
      if (!['Search', 'SearchKeyword'].includes(this.$route.name)) {
        return
      }
      const keyword = this.$route.params.keyword || ''

      if (this.keywords.trim() != keyword.trim()) {
        this.showPopPreview = false
        this.keywords = keyword + ' '
        this.reset()
        this.doSearch(this.keywords)
      }

      if (keyword == '') {
        this.showPopPreview = false
        // document.querySelector('.app-main')?.scrollTo(0, 0)
      }
    },
    usersIriTag() {
      this.reset()
      this.doSearch(this.keywords)
    },
    searchParams: {
      deep: true,
      handler(val) {
        console.log('val: ', val)
        if (this.showPopPreview) {
          this.$refs.popPreview.getList()
        } else {
          this.reset()
          this.doSearch(this.keywords)
        }
      },
    },
    keywords() {
      console.log('watch keywords: ', this.keywords)
      // 当关键词内容发生变化
      const keywordsList = this.keywords
        .replace(/\s\s+/g, ' ') // 去除多余空格（'abc   ' => 'abc '）
        .trimStart() // 去除开头空白字符
        .split(' ') // 按空格分割

      if (keywordsList.length === 1 && keywordsList[0] === '') {
        // 只输入空格的情况清空关键词列表并返回
        this.keywordsList = []
        this.reset()
        return
      }

      this.lastWord = keywordsList.pop() // 最顶部的元素即为正在输入的关键词

      this.keywordsList = keywordsList // 设置关键词组

      this.$nextTick(() => {
        // 保持滚动条在尾部，使用nextTick确保及时更新
        this.$refs.words.scrollLeft = this.$refs.words.clientWidth
        const listWrap = document.querySelector('.list-wrap')
        listWrap && listWrap.scrollTo({ top: 0 })
      })
    },
  },
  mounted() {
    console.log('mounted: search')
    // document.querySelector('.app-main')?.scrollTo(0, 0)

    const input = document.querySelector('input[type="search"]')
    document.addEventListener('selectionchange', () => {
      if (this.focus) { input.setSelectionRange(input.value.length, input.value.length) }
    })

    const keyword = this.$route.params.keyword
    if (['Search', 'SearchKeyword'].includes(this.$route.name) && keyword) {
      this.keywords = keyword + ' '
      this.reset()
      this.doSearch(this.keywords)
    }
  },
  methods: {
    reset() {
      this.curPage = 1
      this.artList = []
      this.loading = false
      this.finished = false
    },
    handleWordsClick(e) {
      // 处理点击事件
      const target = e.target
      if (target.className !== 'close') {
        // 点击对象不为关闭按钮则输入框获取焦点
        document.querySelector('input[type="search"]').focus()
      } else {
        const keywordsList = this.keywords.trim().split(' ') // 关键词按空格分割
        keywordsList.splice(target.dataset.index, 1) // 移除点击对象对应索引的关键词
        const keywords = keywordsList.join(' ') + ' ' // 赋值回去
        this.reset()
        this.search(keywords)
      }
    },
    resetSearchDate() {
      this.searchDateValS = null
      this.searchDateValE = null
      Object.assign(this.searchParams, {
        start_date: null,
        end_date: null,
      })
      this.$refs.s_date.toggle()
    },
    searchByDate() {
      Object.assign(this.searchParams, {
        start_date: this.searchDateValS,
        end_date: this.searchDateValE,
      })
      this.$refs.s_date.toggle()
    },
    search(keywords) {
      keywords = keywords.trim()
      console.log('search keywords: ', keywords)

      const param = this.$route.params.keyword?.trim() || ''
      if (param == keywords) {
        return
      }
      if (keywords == '') {
        this.$router.push('/search')
        // document.querySelector('.app-main')?.scrollTo(0, 0)
        return
      }
      this.$router.push(`/search/${keywords}`)
      this.showPopPreview = false
    },
    doSearch: _.throttle(async function (val) {
      val = val || this.keywords
      this.keywords__ = val
      val = val.trim()
      if (val === '') {
        this.keywords = ''
        this.reset()
        return
      }
      console.log(`doSearch: ${val}`)

      this.setSearchHistory(val)

      if (this.usersIriTag) val += ' ' + this.usersIriTag
      if (!(this.$store.state.SETTING.r18 || this.$store.state.SETTING.r18g)) val += ' -R-18'
      if (!this.$store.state.SETTING.showAi) val += ' -AI'
      this.loading = true
      // window.umami?.trackEvent('Search Tag', { type: 'search_tag', tag: val.replace(/\s+/g, '_') })
      const res = await api.search(val, this.curPage, _.pickBy(this.searchParams, Boolean))
      if (res.status === 0) {
        if (res.data.length) {
          let artList = _.uniqBy([
            ...this.artList,
            ...res.data,
          ], 'id')

          if (!artList.length) {
            this.finished = true
            return
          }

          if (this.usersIriTag) {
            const match = this.usersIriTag.match(/(\d+)/)
            artList = artList.filter(e => e.like > Number(match && match[0]))
          }

          artList = artList.filter(e => {
            return !(
              e.like < 5 ||
              /恋童|ペド|幼女/.test(JSON.stringify(e.tags)) ||
              /恋童|幼女|进群|加好友|度盘/.test(e.title) ||
              /恋童|幼女|进群|加好友|度盘/.test(e.caption)
            )
          })

          this.artList = artList

          this.curPage++
          if (this.curPage > 9) this.finished = true
        } else {
          this.finished = true
        }
        this.loading = false
      } else {
        this.$toast({
          message: res.msg,
        })
        this.loading = false
        this.error = true
      }
    }, 1500),
    toArtwork(id) {
      this.$router.push({
        name: 'Artwork',
        params: { id, list: this.artList },
      })
    },
    onSearchInput: _.debounce(async function () {
      if (notSelfHibiApi) return
      if (!this.lastWord || !this.keywords.trim()) {
        this.autoCompleteTagList = []
        return
      }
      const id = this.lastWord.match(/https?:\/\/.+\/artworks\/(\d+)/i)?.[1]
      if (id) {
        this.toPidPage(id)
        return
      }
      const res = await api.getTagsAutocomplete(this.lastWord)
      if (res.status == 0) {
        this.autoCompleteTagList = res.data
      }
    }, 500),
    onFocus() {
      this.focus = true // 获取焦点
    },
    onSearch() {
      console.log('onSearch: ', this.keywords)
      this.focus = false
      // document.querySelector('.app-main')?.scrollTo(0, 0)
      this.keywords += ' '
      this.$router.push(`/search/${this.keywords.trim()}`)
      this.reset()
      this.doSearch(this.keywords)
    },
    searchTag(keywords) {
      console.log('------- searchTag: ', keywords)
      this.focus = false
      // document.querySelector('.app-main')?.scrollTo(0, 0)
      if (this.$route.params.keyword?.trim() != keywords.trim()) {
        this.reset()
        this.search(keywords + ' ')
      }
    },
    toPidPage(id) {
      this.keywords = ''
      this.keywordsList = []
      this.lastWord = ''
      this.$router.push(`/artworks/${id}`)
    },
    toUidPage(id) {
      this.keywords = ''
      this.keywordsList = []
      this.lastWord = ''
      this.$router.push(`/users/${id}`)
    },
    toSpotlightPage(id) {
      this.keywords = ''
      this.keywordsList = []
      this.lastWord = ''
      this.$router.push(`/spotlight/${id}`)
    },
    clearHistory() {
      this.setSearchHistory(null)
    },
    switchImageSearchShow(flag) {
      if (!flag) this.$refs.imageSearch.reset()
      this.maskShow = flag
    },
    ...mapActions(['setSearchHistory']),
  },
}
</script>

<style lang="stylus" scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.25s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}

.search {
  position: relative;

  .search-bar-wrap {
    position: fixed;
    top: 0;
    left 0
    width: 100%;
    z-index: 3;
    transition: all 0.2s;

    // &.dropdown {
    //   height: 500px;
    // }

    ::v-deep {
      .van-icon-search {
        margin-top: 2px;
        margin-left: 4px;
        font-size: 0.4rem;
      }

      .van-icon-clear {
        margin-top: 2px;
        margin-right: -2px;
        font-size: 0.4rem;
      }

      .van-search__content {
        background #f5f5f5
      }
    }

    .search-bar {
      width: 100vw;
      height: 120px;
      padding-top 0.133rem
      padding-bottom 0
      backdrop-filter: saturate(200%) blur(6px);
      background: rgba(255, 255, 255, 0.8);

      ::v-deep .van-cell {
        line-height: 0.6rem;

        input {
          display: inline-block;
          opacity: 0;
        }
      }
    }

    .search-bar-word {
      position: absolute;
      left: 1.5rem;
      top 50%
      margin-top -0.21334rem
      font-size: 0;
      width: 100%;
      max-width: 580px;
      height: 52px;
      border-radius: 8px;
      // overflow-x: scroll;
      white-space: nowrap;

      .placeholder {
        font-size: 0.3rem;
        line-height: 0.6rem;
        color: #adadad;
      }

      // box-sizing: border-box;
      ::v-deep .word {
        display: inline-block;
        color: #fff;
        background: #7bb7e7;
        padding: 10px 8px;
        margin: -3px 8px 0;
        border-radius: 8px;
        font-size: 24px;
        overflow: hidden;

        .text {
          border-right: 1px solid #acd9fd;
          padding-right: 8px;

          &.no-line {
            border-color: rgba(#fff, 0);
          }
        }

        .close {
          display: inline-block;
          width: 24px;
          height: 24px;
          background: url('~@/icons/close.svg');
          background-size: 100%;
        }
      }
    }

    .image-search-mask {
      position: fixed;
      // top: 128px;
      // top: env(safe-area-inset-top);
      top: 1.72rem;
      width: 100%;
      // max-width: 10rem;
      // height: calc(100% - 128px);
      // height: calc(100% - env(safe-area-inset-top));
      height: 100%;
      box-sizing: border-box;
      // pointer-events: none;
      background: rgba(0, 0, 0, 0.6);
      transition: all 0.2s;
    }
  }

  .search-history {
    // position: absolute;
    // margin-top: 150px;
    margin-bottom: 20px;
    width: 100%;
    padding: 0 6px;
    box-sizing: border-box;
    overflow: hidden;
    .title-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 40px;
      font-size: 26px;
      margin: 8px 20px;
    }
  }

  .keyword {
    float: left;
    font-size: 24px;
    padding: 12px 20px;
    background: #eaeaea;
    border-radius: 26px;
    margin: 12px 12px;
    user-select: none;
    white-space: nowrap;
    max-width: 50%;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .image-search {
    position: fixed;
    top: 48px;
    right 50px
    z-index: 5;
  }

  .com_sel_tabs {
    position fixed
    z-index 3
    left 50%
    width 100%
    transform translateX(-50%)
    top 120px
    margin-bottom 0
    padding 0px 0px 20px
    backdrop-filter: saturate(200%) blur(6px);
    background: rgba(255, 255, 255, 0.8);
  }

  .list-wrap {
    position: relative;
    z-index 1
    min-height: 100vh;
    padding-bottom: 120px;
    box-sizing: border-box;

    >.mask {
      display: none;
    }

    &.focus {
      >.mask {
        display: block;
        position: fixed;
        top: 122px;
        width: 100%;
        // max-width: 10rem;
        height: calc(100% - 122px);
        box-sizing: border-box;
        // pointer-events: none;
        background: rgba(0, 0, 0, 0.6);
        transition: all 0.2s;
      }
    }
  }
}

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.result-list {
  margin: 10px;

  .card-box {
    display: flex;
    flex-direction: row;

    .column {
      width: 50%;

      .image-card {
        max-height: 360px;
        margin: 4px 2px;
      }
    }
  }
}

.show_pop_icon
  position absolute
  top: 22px;
  right: 40px;
  font-size 36px
  padding 20px

.search_params
  position relative
  top -24px

.search_param_sel
  height 70px

  ::v-deep .van-dropdown-menu__title
    font-size 0.24rem
  ::v-deep .van-dropdown-menu__bar
    background none
    height 100% !important
    .van-dropdown-menu__item:first-child,
    .van-dropdown-menu__item:nth-child(2)
      flex 1.3

.sel_search_date
  width 750px !important
  margin: 20px auto;
  text-align center
  input
    width 72%
    height: 0.6rem;
    margin: 0.2rem;

.dropdown
  &.search-bar-wrap .search-bar
    background #fff

.search-dropdown
  position: fixed;
  top: 120px;
  z-index: 4;
  width 100%
  background: #fff

  .pid-n-uid
    display flex
    flex-wrap wrap
    margin 0 20px 10px
    .keyword
      float none !important
      width fit-content
      margin: 0px 12px 12px 0

</style>