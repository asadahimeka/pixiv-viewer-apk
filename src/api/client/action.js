import axios from 'axios'
import { DEF_API_PROXY, COMMON_PROXY } from '@/consts'
import PixivAuth from './pixiv-auth'
import { LocalStorage } from '@/utils/storage'

const API_DOMAIN = 'app-api.pixiv.net'
const OAUTH_DOMAIN = 'oauth.secure.pixiv.net'
const DEF_API_HOSTS = {
  [OAUTH_DOMAIN]: '210.140.139.161',
  [API_DOMAIN]: '210.140.139.161',
}
const DEF_PXIMG_IP = '210.140.139.131'

function dnsQuery(domain) {
  return Promise.race([
    axios.get(`${COMMON_PROXY}https://1.1.1.1/dns-query?name=${domain}&do=false&cd=false`, {
      headers: {
        'Accept': 'application/dns-json',
        'User-Agent': navigator.userAgent,
      },
    }),
    new Promise((_resolve, reject) => {
      setTimeout(() => reject(new Error('请求超时')), 5000)
    }),
  ])
}

async function setPximgIP() {
  if (!LocalStorage.get('PXV_PXIMG_DIRECT', false)) return
  const ip = LocalStorage.get('PXV_PXIMG_IP')
  if (ip) {
    window.p_pximg_ip = ip
    return
  }
  try {
    const res = await dnsQuery('i.pximg.net')
    const { data } = res.data.Answer[0]
    console.log('pximg dns answer: ', data)
    window.p_pximg_ip = data
    LocalStorage.set('PXV_PXIMG_IP', data)
  } catch (err) {
    console.log('setPximgIP err: ', err)
    window.p_pximg_ip = DEF_PXIMG_IP
  }
}

async function setApiHosts(config) {
  console.log('config: ', config)
  if (config.apiHosts) {
    window.p_api_hosts = config.apiHosts
    return
  }
  try {
    const res = await dnsQuery('pixiv.me')
    const { data } = res.data.Answer[0]
    console.log('dns answer: ', data)
    window.p_api_hosts = {
      [OAUTH_DOMAIN]: data,
      [API_DOMAIN]: data,
    }
    config.apiHosts = window.p_api_hosts
    PixivAuth.writeConfig(config)
  } catch (err) {
    console.log('setApiHosts err: ', err)
    window.p_api_hosts = DEF_API_HOSTS
  }
}

async function prepare() {
  const config = PixivAuth.readConfig()
  if (!PixivAuth.checkConfig(config)) throw new Error('Not login.')
  if (config.useApiProxy) {
    window.p_api_proxy = config.apiProxy || DEF_API_PROXY
  } else if (config.directMode) {
    await setApiHosts(config)
  }

  const pixivAuth = new PixivAuth()
  const res = await pixivAuth.relogin()
  if (!res) throw new Error('Login error.')
  return pixivAuth.pixiv
}

const actionMap = {}
const app = {
  get: (url, fn) => {
    actionMap[url] = fn
  },
}

/**
 * @param {import('./pixiv-api').default} pixiv
 */
function initApp(pixiv) {
  app.get('/me', async () => pixiv.authInfo().user)
  app.get('/illust', async req => {
    return pixiv.illustDetail(req.query.id)
  })
  app.get('/member', async req => {
    return pixiv.userDetail(req.query.id)
  })
  app.get('/illust_recommended', async req => {
    return pixiv.illustRecommended({
      include_privacy_policy: false,
      include_ranking_illusts: false,
      ...req.query,
    })
  })
  app.get('/user_recommended', async req => {
    return pixiv.userRecommended({
      ...req.query,
    })
  })
  app.get('/illust_new', async req => {
    return pixiv.illustNew({
      content_type: 'illust',
      ...req.query,
    })
  })
  app.get('/manga_new', async req => {
    return pixiv.mangaNew({
      ...req.query,
    })
  })
  app.get('/novel_new', async req => {
    return pixiv.novelNew({
      ...req.query,
    })
  })
  app.get('/search_autocomplete', async req => {
    return pixiv.searchAutoCompleteV2(req.query.word)
  })
  app.get('/popular_preview', async req => {
    return pixiv.searchIllustPopularPreview(req.query.word, {
      include_translated_tag_results: 'true',
      merge_plain_keyword_results: 'true',
      search_target: 'partial_match_for_tags',
      ...req.query,
    })
  })
  app.get('/popular_preview_novel', async req => {
    return pixiv.searchNovelPopularPreview(req.query.word, {
      include_translated_tag_results: 'true',
      merge_plain_keyword_results: 'true',
      search_target: 'partial_match_for_tags',
      ...req.query,
    })
  })
  app.get('/search_user', async req => {
    const { word, page = 1, size = 30 } = req.query
    return pixiv.searchUser(word, {
      offset: (page - 1) * size,
    })
  })
  app.get('/member_illust', async req => {
    const { id, illust_type = 'illust', page = 1, size = 30 } = req.query
    return pixiv.userIllusts(id, {
      type: illust_type,
      offset: (page - 1) * size,
    })
  })
  app.get('/member_novel', async req => {
    const { id, page = 1, size = 30 } = req.query
    return pixiv.userNovels(id, {
      offset: (page - 1) * size,
    })
  })
  app.get('/favorite', async req => {
    const { id, ...opts } = req.query
    if (opts.max_bookmark_id == 0) delete opts.max_bookmark_id
    return pixiv.userBookmarksIllust(id, opts)
  })
  app.get('/favorite_novel', async req => {
    const { id, ...opts } = req.query
    return pixiv.userBookmarksNovel(id, opts)
  })
  app.get('/follower', async req => {
    const { id, page = 1, size = 30 } = req.query
    return pixiv.userFollower(id, {
      offset: (page - 1) * size,
    })
  })
  app.get('/following', async req => {
    const { id, page = 1, size = 30 } = req.query
    return pixiv.userFollowing(id, {
      offset: (page - 1) * size,
    })
  })
  app.get('/rank', async req => {
    const { page = 1, size = 30, ...opts } = req.query
    return pixiv.illustRanking({
      offset: (page - 1) * size,
      ...opts,
    })
  })
  app.get('/rank_novel', async req => {
    const { page = 1, size = 30, ...opts } = req.query
    return pixiv.novelRanking({
      offset: (page - 1) * size,
      ...opts,
    })
  })
  app.get('/search', async req => {
    const {
      word,
      page = 1,
      size = 30,
      mode = 'partial_match_for_tags',
      order = 'date_desc',
      ...opts
    } = req.query
    return pixiv.searchIllust(word, {
      offset: (page - 1) * size,
      include_translated_tag_results: true,
      merge_plain_keyword_results: true,
      search_target: mode,
      sort: order,
      ...opts,
    })
  })
  app.get('/search_novel', async req => {
    const {
      word,
      page = 1,
      size = 30,
      mode = 'partial_match_for_tags',
      sort = 'date_desc',
      ...opts
    } = req.query
    return pixiv.searchNovel(word, {
      offset: (page - 1) * size,
      include_translated_tag_results: true,
      merge_plain_keyword_results: true,
      search_target: mode,
      sort,
      ...opts,
    })
  })
  app.get('/tags', async req => {
    return pixiv.trendingTagsIllust(req.query)
  })
  app.get('/tags_novel', async req => {
    return pixiv.trendingTagsNovel(req.query)
  })
  app.get('/related', async req => {
    const { id, nextUrl } = req.query
    return pixiv.illustRelated(id, { nextUrl })
  })
  app.get('/related_novel', async req => {
    const { page = 1, size = 30, id } = req.query
    return pixiv.novelRelated(id, {
      offset: (page - 1) * size,
    })
  })
  app.get('/related_member', async req => {
    const { id } = req.query
    return pixiv.userRelated(id)
  })
  app.get('/ugoira_metadata', async req => {
    const { id } = req.query
    return pixiv.ugoiraMetaData(id)
  })
  app.get('/illust_comments', async req => {
    const { page = 1, size = 30, id } = req.query
    return pixiv.illustCommentsV3(id, {
      offset: (page - 1) * size,
    })
  })
  app.get('/novel_comments', async req => {
    const { page = 1, size = 30, id } = req.query
    return pixiv.novelCommentsV3(id, {
      offset: (page - 1) * size,
    })
  })
  app.get('/illust_comment_replies', async req => {
    const { id } = req.query
    return pixiv.illustCommentReplies(id)
  })
  app.get('/novel_comment_replies', async req => {
    const { id } = req.query
    return pixiv.novelCommentReplies(id)
  })
  app.get('/manga_recommended', async req => {
    return pixiv.mangaRecommended(req.query)
  })
  app.get('/novel_recommended', async req => {
    return pixiv.novelRecommended(req.query)
  })
  app.get('/novel_series', async req => {
    const { page = 1, size = 30, id } = req.query
    return pixiv.novelSeries(id, {
      last_order: (page - 1) * size,
    })
  })
  app.get('/illust_series', async req => {
    const { page = 1, size = 30, id } = req.query
    return pixiv.illustSeries(id, {
      offset: (page - 1) * size,
    })
  })
  app.get('/member_illust_series', async req => {
    const { page = 1, size = 30, id } = req.query
    return pixiv.userIllustSeries(id, {
      offset: (page - 1) * size,
    })
  })
  app.get('/member_novel_series', async req => {
    const { page = 1, size = 30, id } = req.query
    return pixiv.userNovelSeries(id, {
      offset: (page - 1) * size,
    })
  })
  app.get('/novel_detail', async req => {
    const { id } = req.query
    return pixiv.novelDetail(id)
  })
  app.get('/novel_text', async req => {
    const { id } = req.query
    return pixiv.novelText(id)
  })
  app.get('/webview_novel', async req => {
    const { id, raw } = req.query
    return pixiv.webviewNovel(id, raw == 'true')
  })
  app.get('/live_list', async req => {
    const { page = 1, size = 30 } = req.query
    const params = {}
    if (page > 1) params.offset = (page - 1) * size
    return pixiv.liveList(params)
  })
  app.get('/req_get', async req => {
    const { path, params } = req.query
    console.log('path: ', path)
    console.log('params: ', params)
    const fns = {
      'v2/illust/follow': () => pixiv.illustFollow(JSON.parse(params)),
      'v1/novel/follow': () => pixiv.novelFollow(JSON.parse(params)),
    }
    return fns[path]?.()
  })
  app.get('/req_post', async req => {
    const { path, data } = req.query
    console.log('path: ', path)
    console.log('data: ', data)
    const d = JSON.parse(data)
    const fns = {
      'v2/illust/bookmark/add': () => pixiv.bookmarkIllust(d.illust_id),
      'v1/illust/bookmark/delete': () => pixiv.unbookmarkIllust(d.illust_id),
      'v1/user/follow/add': () => pixiv.followUser(d.user_id),
      'v1/user/follow/delete': () => pixiv.unfollowUser(d.user_id),
    }
    return fns[path]?.()
  })
  app.get('/openapi.json', async () => true)
}

async function getActionMap() {
  try {
    const p = await prepare()
    initApp(p)
    return actionMap
  } catch (err) {
    console.log('Start err:', err)
  }
}

export {
  getActionMap,
  setPximgIP,
}
