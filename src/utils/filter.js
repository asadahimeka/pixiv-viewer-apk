import Mint from 'mint-filter'
import store from '@/store'
import { getCache, setCache } from './storage/siteCache'
import { isBlockTagHit } from '.'

const re1 = /漫画|描き方|お絵かきTIPS|manga|BL|スカラマシュ|散兵|雀魂|じゃんたま/i
const re2 = /R-?18|恋童|ペド|幼女|萝莉|loli|小学生|BL|腐|スカラマシュ|散兵|雀魂|じゃんたま/i

const blockedUserIds = [24517, 14002767, 16776564, 33333, 423251, 27526, 13150573]
export function filterHomeIllust(e) {
  if (e.type == 'manga') return false
  if (e.images.length != 1) return false
  if (e.illust_ai_type == 2) return false
  if (blockedUserIds.includes(+e.author.id)) return false
  return !re1.test(JSON.stringify(e.tags))
}

export function filterRecommIllust(e) {
  if (e.illust_ai_type == 2) return false
  return !re2.test(JSON.stringify(e.tags))
}

export function filterHomeNovel(e) {
  if (e.novel_ai_type == 2) return false
  return !re2.test(JSON.stringify(e.tags))
}

export function filterCensoredIllust(artwork) {
  if (store.state.blockUids.length && store.state.blockUids.includes(`${artwork?.author?.id}`)) {
    return false
  }

  if (isBlockTagHit(store.state.blockTags, artwork?.tags)) {
    return false
  }

  if (artwork.x_restrict == 1) {
    if (artwork.illust_ai_type == 2) {
      return store.state.contentSetting.r18 && store.state.contentSetting.ai
    }
    return store.state.contentSetting.r18
  }
  if (artwork.x_restrict == 2) {
    if (artwork.illust_ai_type == 2) {
      return store.state.contentSetting.r18g && store.state.contentSetting.ai
    }
    return store.state.contentSetting.r18g
  }
  if (artwork.illust_ai_type == 2) {
    return store.state.contentSetting.ai
  }
  return true
}

export function filterCensoredIllusts(list = []) {
  console.log('list: ', list)
  return list.filter(filterCensoredIllust)
}

const aiTags = ['AI', 'AI生成', 'AI生成作品', 'AI作画', 'AIイラスト', 'AIgenerated', 'AI-generated', 'AI-assisted', 'AI辅助', 'AIアシスタンス'].map(e => e.toLowerCase())
export function isAiIllust(artwork) {
  return artwork.illust_ai_type == 2 || !!artwork.tags?.some(e => aiTags.includes(e.name?.toLowerCase()))
}

/** @type {Mint} */
let mint
const presetWords = ['vpn', 'VPN', '推荐', '好用', '梯子']
export async function mintVerify(word = '', forceCheck = false) {
  if (presetWords.some(e => word.includes(e))) {
    return false
  }
  if (!forceCheck && store.getters.isR18On) {
    return true
  }
  word = word.replace(/[A-Za-z\d\s~`!@#$%^&*()_+\-=[\]{};':"\\|,./<>?]+/g, '')
  try {
    if (!mint) {
      let filterWords = await getCache('s.filter.words')
      if (!filterWords) {
        const resp = await fetch(`${process.env.BASE_URL}static/words.txt`)
        filterWords = (await resp.text()).split(/\s+/)
        setCache('s.filter.words', filterWords, -1)
      }
      mint = new Mint(filterWords)
    }
    return mint.verify(word)
  } catch (error) {
    return true
  }
}

export const BLOCK_INPUT_WORDS = [/r-?18/i, /18-?r/i, /^黄?色情?图$/, /^ero$/i, /工口/, /エロ/]
export const BLOCK_LAST_WORD_RE = /スカラマシュ|散|(^\d+$)|雀魂|じゃんたま/i
export const BLOCK_SEARCH_WORD_RE = /スカラマシュ|散兵|放浪者(原神)|流浪者(原神)|雀魂|じゃんたま/i
export const BLOCK_RESULT_RE = /恋童|ペド|幼女|进群|加好友|度盘|低价|スカラマシュ|散兵|雀魂|じゃんたま/
