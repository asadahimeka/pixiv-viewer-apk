import dayjs from 'dayjs'
import { get } from './http'
import { LocalStorage, SessionStorage } from '@/utils/storage'
import { getCache, setCache } from '@/utils/siteCache'
import { i18n } from '@/i18n'

const isSupportWebP = (() => {
  const elem = document.createElement('canvas')

  if (elem.getContext && elem.getContext('2d')) {
    // was able or not to get WebP representation
    return elem.toDataURL('image/webp').indexOf('data:image/webp') === 0
  }

  // very old browser like IE 8, canvas not supported
  return false
})()

export const PXIMG_PROXY_BASE = LocalStorage.get('PXIMG_PROXY', process.env.VUE_APP_DEF_PXIMG_MAIN)
export const imgProxy = url => {
  let result = url.replace(/i\.pximg\.net/g, PXIMG_PROXY_BASE)
  if (url.startsWith('/-/')) {
    result = result.replace(/^\/-\//, `https://${PXIMG_PROXY_BASE}/`)
  }
  if (url.startsWith('/~/')) {
    result = result.replace(/^\/~\//, 'https://s.pximg.net/')
  }

  if (!isSupportWebP) {
    result = result.replace(/_10_webp/g, '_70')
    result = result.replace(/_webp/g, '')
  }

  return result
}

const parseUser = data => {
  const { user, profile, workspace } = data
  const { id, account, name, comment } = user
  const { background_image_url, birth, birth_day, gender, is_premium, is_using_custom_profile_image, job, total_follow_users, total_mypixiv_users, total_illust_bookmarks_public, total_illusts, twitter_account, twitter_url, webpage, country_code } = profile

  return {
    id,
    account,
    name,
    comment,
    country_code,
    region: profile.region,
    avatar: imgProxy(user.profile_image_urls.medium),
    bgcover: imgProxy(background_image_url || ''),
    birth: `${birth}-${birth_day}`,
    gender,
    is_premium,
    is_using_custom_profile_image,
    job,
    follow: total_follow_users,
    friend: total_mypixiv_users,
    bookmarks: total_illust_bookmarks_public,
    illusts: total_illusts,
    mangas: profile.total_manga,
    illust_series: profile.total_illust_series,
    novels: profile.total_novels,
    novel_series: profile.total_novel_series,
    twitter_account,
    twitter_url,
    webpage,
    workspace,
  }
}

const parseIllust = data => {
  const { id, title, caption, create_date, tags, tools, width, height, x_restrict, total_view, total_bookmarks, type, illust_ai_type } = data
  let images = []

  if (data.meta_single_page.original_image_url) {
    images.push({
      s: imgProxy(data.image_urls.square_medium),
      m: imgProxy(data.image_urls.medium),
      l: imgProxy(data.image_urls.large),
      o: imgProxy(data.meta_single_page.original_image_url),
    })
  } else {
    images = data.meta_pages.map(data => {
      return {
        s: imgProxy(data.image_urls.square_medium),
        m: imgProxy(data.image_urls.medium),
        l: imgProxy(data.image_urls.large),
        o: imgProxy(data.image_urls.original),
      }
    })
  }

  const artwork = {
    id,
    title,
    caption,
    author: {
      id: data.user.id,
      name: data.user.name,
      avatar: imgProxy(data.user.profile_image_urls.medium),
    },
    created: create_date,
    images,
    tags,
    tools,
    width,
    height,
    count: data.page_count,
    view: total_view,
    like: total_bookmarks,
    x_restrict,
    illust_ai_type,
    type,
  }

  return artwork
}

const parseNovel = data => {
  const images = [{
    s: imgProxy(data.image_urls.square_medium),
    m: imgProxy(data.image_urls.medium),
    l: imgProxy(data.image_urls.large),
  }]

  const artwork = {
    ...data,
    images,
    author: {
      id: data.user.id,
      name: data.user.name,
      avatar: imgProxy(data.user.profile_image_urls.medium),
    },
    created: data.create_date,
    count: data.page_count,
    view: data.total_view,
    like: data.total_bookmarks,
    illust_ai_type: data.novel_ai_type,
  }

  return artwork
}

const parseAiIllust = (d, r18) => {
  const url = 'https://i.pximg.net' + d.url.replace('/-/', '/')
  const images = [{
    s: imgProxy(url.replace('_master1200', '_square1200')),
    m: imgProxy(url),
    l: imgProxy(url.replace(/\/c\/\d+x\d+\//i, '/')),
    o: 'https://i.loli.best/' + d.illust_id,
  }]

  let avatar = d.profile_img
  if (!avatar.includes('s.pximg.net')) {
    avatar = imgProxy(avatar)
  }

  const artwork = {
    id: d.illust_id,
    title: d.title,
    caption: '',
    author: {
      id: d.user_id,
      name: d.user_name,
      avatar,
    },
    created: d.date,
    images,
    tags: d.tags.map(e => ({ name: e })),
    tools: [],
    width: d.width,
    height: d.height,
    count: d.illust_page_count,
    view: d.view_count,
    like: d.rating_count,
    x_restrict: r18 ? 1 : 0,
    illust_ai_type: 2,
    type: 'illust',
  }

  return artwork
}

const parseWebRankIllust = (d, mode, content) => {
  const url = 'https://i.pximg.net' + d.url.replace('/-/', '/')
  const images = [{
    s: imgProxy(url.replace('_master1200', '_square1200')),
    m: imgProxy(url),
    l: imgProxy(url.replace(/\/c\/\d+x\d+\//i, '/')),
    o: 'https://i.loli.best/' + d.illust_id,
  }]

  let avatar = d.profile_img
  if (!avatar.includes('s.pximg.net')) {
    avatar = imgProxy(avatar)
  }

  const artwork = {
    id: d.illust_id,
    title: d.title,
    caption: '',
    author: {
      id: d.user_id,
      name: d.user_name,
      avatar,
    },
    created: d.date,
    images,
    tags: d.tags.map(e => ({ name: e })),
    tools: [],
    width: d.width,
    height: d.height,
    count: d.illust_page_count,
    view: d.view_count,
    like: d.rating_count,
    x_restrict: mode.includes('r18') ? 1 : 0,
    illust_ai_type: 0,
    type: content?.includes('ugoira') ? 'ugoira' : 'illust',
  }

  return artwork
}

export const parseWebApiIllust = d => {
  const url = 'https://i.pximg.net' + d.url.replace('/-/', '/')
  const images = [{
    s: imgProxy(url.replace('_master1200', '_square1200')),
    m: imgProxy(url),
    l: imgProxy(url.replace(/\/c\/\d+x\d+\//i, '/')),
    o: 'https://i.loli.best/' + d.id,
  }]

  let avatar = d.profileImageUrl
  if (!avatar.includes('s.pximg.net')) {
    avatar = imgProxy(avatar)
  }

  const artwork = {
    id: d.id,
    title: d.title,
    caption: '',
    author: {
      id: d.userId,
      name: d.userName,
      avatar,
    },
    created: d.createDate,
    images,
    tags: d.tags.map(e => ({ name: e })),
    tools: [],
    width: d.width,
    height: d.height,
    count: d.pageCount,
    view: 0,
    like: 0,
    x_restrict: d.xRestrict,
    illust_ai_type: d.aiType,
    type: 'illust',
  }

  return artwork
}

const dealErrMsg = res => {
  let msg = res.error.user_message || res.error.message || res.error
  if (msg == 'Rate Limit') msg = i18n.t('tip.rate_limit')
  return msg
}

const api = {
  /**
   *
   * @param {Number} id 作品ID
   * @param {Number} index 页数 0起始
   */
  url(id, index) {
    if (!index) {
      return `https://pixiv.re/${id}.png`
    } else {
      return `https://pixiv.re/${id}-${index}.png`
    }
  },

  async getLatest() {
    const cacheKey = 'latestList'
    let latestList = await getCache(cacheKey)

    if (!latestList) {
      const res = await get('/illust_new')

      if (res.illusts) {
        latestList = res.illusts.map(art => parseIllust(art))
        setCache(cacheKey, latestList, 60 * 10)
      } else if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    console.log('latestList: ', latestList)

    return { status: 0, data: latestList }
  },

  async getLatestManga() {
    const cacheKey = 'latestList.manga'
    let latestList = await getCache(cacheKey)

    if (!latestList) {
      const res = await get('/illust_new', { content_type: 'manga' })

      if (res.illusts) {
        latestList = res.illusts.map(art => parseIllust(art))
        setCache(cacheKey, latestList, 60 * 10)
      } else if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    console.log('latestList: ', latestList)

    return { status: 0, data: latestList }
  },

  async getLatestNovel() {
    const cacheKey = 'latestList.novel'
    let latestList = await getCache(cacheKey)

    if (!latestList) {
      const res = await get('/novel_new')

      if (res.novels) {
        latestList = res.novels.map(art => parseNovel(art))
        setCache(cacheKey, latestList, 60 * 10)
      } else if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    console.log('latestList: ', latestList)

    return { status: 0, data: latestList }
  },

  /**
   *
   * @param {Number} id 作品ID
   * @param {Number} page 页数 [1,5]
   */
  async getRelated(id, page = 1) {
    const cacheKey = `relatedList_${id}_p${page}`
    let relatedList = await getCache(cacheKey)

    if (!relatedList) {
      const res = await get('/related', {
        id,
        page,
      })

      if (res.illusts) {
        relatedList = res.illusts.map(art => parseIllust(art))
        setCache(cacheKey, relatedList, 60 * 60 * 24)
      } else if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    console.log('relatedList: ', relatedList)

    return { status: 0, data: relatedList }
  },

  async getRelatedNovel(id, page = 1) {
    const cacheKey = `related_novel_${id}_p${page}`
    let relatedList = await getCache(cacheKey)

    if (!relatedList) {
      const res = await get('/related_novel', {
        id,
        page,
      })

      if (res.novels) {
        relatedList = res.novels.map(art => parseNovel(art))
        setCache(cacheKey, relatedList, 60 * 60 * 24)
      } else if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    console.log('relatedList: ', relatedList)

    return { status: 0, data: relatedList }
  },

  async getRecommendedIllust() {
    const cacheKey = 'recommended.illust'
    let relatedList = await getCache(cacheKey)

    if (!relatedList) {
      const res = await get('/illust_recommended')

      if (res.illusts) {
        relatedList = res.illusts.map(art => parseIllust(art))
        setCache(cacheKey, relatedList, 60 * 60 * 6)
      } else if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    console.log('getRecommendedIllust: ', relatedList)

    return { status: 0, data: relatedList }
  },

  async getRecommendedManga() {
    const cacheKey = 'recommended.manga'
    let relatedList = await getCache(cacheKey)

    if (!relatedList) {
      const res = await get('/manga_recommended')

      if (res.illusts) {
        relatedList = res.illusts.map(art => parseIllust(art))
        setCache(cacheKey, relatedList, 60 * 60 * 6)
      } else if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    console.log('getRecommendedmanga: ', relatedList)

    return { status: 0, data: relatedList }
  },

  async getRecommendedNovel() {
    const cacheKey = 'recommended.novel'
    let relatedList = await getCache(cacheKey)

    if (!relatedList) {
      const res = await get('/novel_recommended')

      if (res.novels) {
        relatedList = res.novels.map(art => parseNovel(art))
        setCache(cacheKey, relatedList, 60 * 60 * 6)
      } else if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    console.log('getRecommendedNovel: ', relatedList)

    return { status: 0, data: relatedList }
  },

  async getPopularPreview(word, params = {}) {
    const cacheKey = `search.popularPreview.${word}.${JSON.stringify(params)}`
    let relatedList = await getCache(cacheKey)

    if (!relatedList) {
      const res = await get('/popular_preview', { word, ...params })

      if (res.illusts) {
        relatedList = res.illusts.map(art => parseIllust(art))
        setCache(cacheKey, relatedList, 60 * 60 * 48)
      } else if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    return { status: 0, data: relatedList }
  },

  async getPopularPreviewNovel(word) {
    const cacheKey = `search.popularPreview.novel.${word}`
    let relatedList = await getCache(cacheKey)

    if (!relatedList) {
      const res = await get('/popular_preview_novel', { word })

      if (res.novels) {
        relatedList = res.novels.map(art => parseNovel(art))
        setCache(cacheKey, relatedList, 60 * 60 * 48)
      } else if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    return { status: 0, data: relatedList }
  },

  async getRecommendedUser() {
    const cacheKey = 'recommended.user'
    let relatedList = await getCache(cacheKey)

    if (!relatedList) {
      const res = await get('/user_recommended')

      if (res.user_previews) {
        relatedList = res.user_previews
          .filter(u => u.illusts.length && (
            !u.illusts.some(e => /R-?18|3DCG|ロリ|萝莉|幼女/.test(JSON.stringify(e.tags)))
          ))
          .map(u => {
            return {
              id: u.user.id,
              name: u.user.name,
              avatar: imgProxy(u.user.profile_image_urls.medium),
              illusts: u.illusts.map(i => ({
                id: i.id,
                title: i.title,
                src: imgProxy(i.image_urls.medium),
                x_restrict: i.x_restrict,
                illust_ai_type: i.illust_ai_type,
              })),
            }
          })
        setCache(cacheKey, relatedList, 60 * 60 * 6)
      } else if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    console.log('getRecommendedUser: ', relatedList)

    return { status: 0, data: relatedList }
  },

  async getRelatedUser(id) {
    const cacheKey = `related.user.${id}`
    let relatedList = await getCache(cacheKey)

    if (!relatedList) {
      const res = await get('/related_member', { id })

      if (res.user_previews) {
        relatedList = res.user_previews
          .map(u => {
            return {
              id: u.user.id,
              name: u.user.name,
              avatar: imgProxy(u.user.profile_image_urls.medium),
              illusts: u.illusts.map(i => ({
                id: i.id,
                title: i.title,
                src: imgProxy(i.image_urls.medium),
                x_restrict: i.x_restrict,
                illust_ai_type: i.illust_ai_type,
              })),
            }
          })
        setCache(cacheKey, relatedList, 60 * 60 * 6)
      } else if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    console.log('getRelatedUser: ', relatedList)

    return { status: 0, data: relatedList }
  },

  async searchUser(word) {
    const cacheKey = `search.user.${word}`
    let relatedList = await getCache(cacheKey)

    if (!relatedList) {
      const res = await get('/search_user', { word })

      if (res.user_previews) {
        relatedList = res.user_previews
          .map(u => {
            return {
              id: u.user.id,
              name: u.user.name,
              avatar: imgProxy(u.user.profile_image_urls.medium),
              illusts: u.illusts.map(i => ({
                id: i.id,
                title: i.title,
                src: imgProxy(i.image_urls.medium),
                x_restrict: i.x_restrict,
                illust_ai_type: i.illust_ai_type,
              })),
            }
          })
        setCache(cacheKey, relatedList, 60 * 60 * 12)
      } else if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    return { status: 0, data: relatedList }
  },

  async getTagsAutocomplete(word) {
    const cacheKey = `search.autocomplete.${word}`
    let relatedList = await getCache(cacheKey)

    if (!relatedList) {
      const res = await get('/search_autocomplete', { word })

      if (res.tags) {
        relatedList = res.tags.map(t => t.name)
        setCache(cacheKey, relatedList, 60 * 60 * 12)
      } else if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    console.log('getTagsAutocomplete: ', relatedList)

    return { status: 0, data: relatedList }
  },

  async getSpotlights(page) {
    const lang = i18n.locale
    const cacheKey = `spotlights.${lang}.${page}`
    let spotlights = await getCache(cacheKey)

    if (!spotlights) {
      let url = 'https://www.pixivs.cn/api/pixivision'
      const params = { page }
      if (lang != 'zh-Hans') {
        url = 'https://now.pixiv.pics/api/pixivision'
        params.lang = lang
      }
      const res = await get(url, params, {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.56',
          'origin': 'http://localhost',
        },
      })

      if (res.articles) {
        res.articles.forEach(a => {
          a.thumbnail = imgProxy(a.thumbnail)
        })
        res.rank?.forEach(a => {
          a.thumbnail = imgProxy(a.thumbnail)
        })
        res.recommend?.forEach(a => {
          a.thumbnail = imgProxy(a.thumbnail)
        })

        spotlights = res
        setCache(cacheKey, spotlights, 60 * 60 * 12)
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    console.log('spotlights: ', spotlights)

    return { status: 0, data: spotlights }
  },

  async getSpotlightTypeList(type, page) {
    const lang = i18n.locale
    const cacheKey = `spotlights.${type}.${lang}.${page}`
    let spotlights = await getCache(cacheKey)

    if (!spotlights) {
      const params = { page, type }
      if (lang != 'zh-Hans') {
        params.lang = lang
      }
      const res = await get('https://now.pixiv.pics/api/pixivision/list', params, {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.56',
          'origin': 'http://localhost',
        },
      })

      if (res.articles) {
        res.articles.forEach(a => {
          a.thumbnail = imgProxy(a.thumbnail)
        })
        res.rank?.forEach(a => {
          a.thumbnail = imgProxy(a.thumbnail)
        })
        res.recommend?.forEach(a => {
          a.thumbnail = imgProxy(a.thumbnail)
        })

        spotlights = res
        setCache(cacheKey, spotlights, 60 * 60 * 12)
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    console.log('spotlights: ', spotlights)

    return { status: 0, data: spotlights }
  },
  async getSpotlightTypeDetail(id) {
    const lang = i18n.locale
    const cacheKey = `spotlight.type.${lang}.${id}`
    let spotlight = await getCache(cacheKey)

    if (!spotlight) {
      const params = { id }
      if (lang != 'zh-Hans') {
        params.lang = lang
      }
      const res = await get('https://now.pixiv.pics/api/pixivision/detail', params, {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.56',
          'origin': 'http://localhost',
        },
      })

      if (res) {
        res.related_latest?.items?.forEach(a => {
          a.thumbnail = imgProxy(a.thumbnail)
        })
        res.related_recommend?.items?.forEach(a => {
          a.thumbnail = imgProxy(a.thumbnail)
        })

        spotlight = res
        setCache(cacheKey, JSON.parse(JSON.stringify(res)), 60 * 60 * 24)
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    console.log('spotlight: ', spotlight)

    return { status: 0, data: spotlight }
  },

  async getSpotlightDetail(id) {
    const lang = i18n.locale
    const cacheKey = `spotlight.${lang}.${id}`
    let spotlight = await getCache(cacheKey)

    if (!spotlight) {
      let domain = 'www.pixivs.cn'
      const params = {}
      if (lang != 'zh-Hans') {
        domain = 'now.pixiv.pics'
        params.lang = lang
      }
      const res = await get(`https://${domain}/api/pixivision/${id}`, params, {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.56',
          'origin': 'http://localhost',
        },
      })

      if (res) {
        res.cover = imgProxy(res.cover?.replace('i-ogp.pximg.net', 'i.pximg.net') || '')
        res.items?.forEach(a => {
          a.illust_url = imgProxy(a.illust_url)
          a.user_avatar = imgProxy(a.user_avatar)
        })
        res.related_latest?.items?.forEach(a => {
          a.thumbnail = imgProxy(a.thumbnail)
        })
        res.related_recommend?.items?.forEach(a => {
          a.thumbnail = imgProxy(a.thumbnail)
        })

        spotlight = res
        setCache(cacheKey, JSON.parse(JSON.stringify(res)), 60 * 60 * 24)
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    console.log('spotlight: ', spotlight)

    return { status: 0, data: spotlight }
  },

  /**
   *
   * @param {String} mode 排行榜类型  ['daily_ai', 'daily_r18_ai']
   * @param {Number} page 页数
   * @param {String} date YYYYMMDD 默认为「前天」
   */
  async getAiRankList(mode = 'daily_ai', page = 1, date = dayjs().subtract(2, 'days').format('YYYYMMDD')) {
    date = dayjs(date).format('YYYYMMDD')
    const cacheKey = `rankList_${mode}_${date}_${page}`
    let rankList = await getCache(cacheKey)

    if (!rankList) {
      const res = await get('https://www.pixivs.cn/api/ranking', {
        format: 'json',
        p: page,
        mode,
        date,
      })

      if (res && res.contents) {
        rankList = res.contents.map(e => parseAiIllust(e, mode.includes('r18')))
        rankList.length && setCache(cacheKey, rankList, 60 * 60 * 24)
      } else {
        return {
          status: 0,
          data: [],
        }
      }
    }

    return { status: 0, data: rankList }
  },

  async getWebRankList(mode = 'daily', page = 1, date = dayjs().subtract(2, 'days').format('YYYYMMDD'), content) {
    date = dayjs(date).format('YYYYMMDD')
    const cacheKey = `rankList_${mode}_${content}_${date}_${page}`
    let rankList = await getCache(cacheKey)

    if (!rankList) {
      const domain = mode.includes('r18') ? 'now.pixiv.pics' : 'www.pixivs.cn'
      const res = await get(`https://${domain}/api/ranking`, {
        format: 'json',
        p: page,
        mode,
        date,
        content,
      }, {
        headers: {
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.56',
          'origin': 'http://localhost',
        },
      })

      if (res && res.contents) {
        rankList = res.contents.map(e => parseWebRankIllust(e, mode, content))
        rankList.length && setCache(cacheKey, rankList, 60 * 60 * 24)
      } else {
        return {
          status: 0,
          data: [],
        }
      }
    }

    return { status: 0, data: rankList }
  },

  async getDiscoveryArtworks(mode = 'all', limit = 60) {
    let list

    const res = await get('https://now.pixiv.pics/ajax/discovery/artworks', {
      mode,
      limit,
      lang: 'zh',
      _vercel_no_cache: 1,
    }, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36 Edg/107.0.1418.56',
        'origin': 'http://localhost',
      },
    })

    const illust = res?.thumbnails?.illust
    if (illust) {
      list = illust.filter(e => !e.isAdContainer).map(e => parseWebApiIllust(e))
    } else {
      return {
        status: 0,
        data: [],
      }
    }

    return { status: 0, data: list }
  },

  async getDiscoveryList(mode = 'all', max = 20, nocache = false) {
    let list

    const params = { mode, max }

    if (nocache) params._vercel_no_cache = 1

    const res = await get('https://www.pixivs.cn/ajax/illust/discovery', params, { baseURL: '/' })

    if (res && res.illusts) {
      list = res.illusts.filter(e => !e.isAdContainer).map(e => parseWebApiIllust(e))
    } else {
      return {
        status: 0,
        data: [],
      }
    }

    return { status: 0, data: list }
  },

  /**
   *
   * @param {String} mode 排行榜类型  ['day', 'week', 'month', 'week_rookie', 'week_original', 'day_male', 'day_female', 'day_r18', 'week_r18', 'day_male_r18', 'day_female_r18', 'week_r18g']
   * @param {Number} page 页数
   * @param {String} date YYYY-MM-DD 默认为「前天」
   */
  async getRankList(mode = 'day', page = 1, date = dayjs().subtract(2, 'days').format('YYYY-MM-DD')) {
    date = dayjs(date).format('YYYY-MM-DD')
    const cacheKey = `rankList_${mode}_${date}_${page}`
    let rankList = await getCache(cacheKey)

    if (!rankList) {
      const res = await get('/rank', {
        mode,
        page,
        date,
      })

      if (res.illusts) {
        rankList = res.illusts.map(art => parseIllust(art))
        rankList.length && setCache(cacheKey, rankList, 60 * 60 * 12)
      } else if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    return { status: 0, data: rankList }
  },

  async getNovelRankList(mode = 'day', page = 1, date = dayjs().subtract(2, 'days').format('YYYY-MM-DD')) {
    date = dayjs(date).format('YYYY-MM-DD')
    const cacheKey = `rank_novel_${mode}_${date}_${page}`
    let rankList = await getCache(cacheKey)

    if (!rankList) {
      const res = await get('/rank_novel', {
        mode,
        page,
        date,
      })

      if (res.novels) {
        rankList = res.novels.map(art => parseNovel(art))
        rankList.length && setCache(cacheKey, rankList, 60 * 60 * 12)
      } else if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    return { status: 0, data: rankList }
  },

  /**
   *
   * @param {String} word 关键词
   * @param {Number} page 页数
   */
  async search(word, page = 1, params = {}) {
    const cacheKey = `searchList_${word}_${page}_${JSON.stringify(params)}`
    let searchList = SessionStorage.get(cacheKey)

    if (!searchList) {
      const res = await get('/search', {
        word,
        page,
        ...params,
      })

      if (res.illusts) {
        searchList = res.illusts.map(art => parseIllust(art))
        SessionStorage.set(cacheKey, searchList, 60 * 60 * 1)
      } else if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    return { status: 0, data: searchList }
  },

  async searchNovel(word, page = 1) {
    const cacheKey = `searchList_novel_${window.btoa(encodeURI(word))}_${page}`
    let searchList = SessionStorage.get(cacheKey)

    if (!searchList) {
      const res = await get('/search_novel', {
        word,
        page,
      })

      if (res.novels) {
        searchList = res.novels.map(art => parseNovel(art))
        SessionStorage.set(cacheKey, searchList, 60 * 60 * 1)
      } else if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    return { status: 0, data: searchList }
  },

  async getNovelDetail(id) {
    const cacheKey = `novel_${id}`
    let artwork = await getCache(cacheKey)

    if (!artwork) {
      const res = await get('/novel_detail', {
        id,
      })

      if (res.novel) {
        artwork = parseNovel(res.novel)
        setCache(cacheKey, artwork, 60 * 60 * 12)
      } else if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    return { status: 0, data: artwork }
  },

  async getNovelText(id) {
    const cacheKey = `novel_text_${id}`
    let artwork = await getCache(cacheKey)

    if (!artwork) {
      const res = await get('/novel_text', {
        id,
      })

      if (res.novel_text) {
        artwork = {
          text: res.novel_text,
          prev: res.series_prev?.id && parseNovel(res.series_prev),
          next: res.series_next?.id && parseNovel(res.series_next),
        }
        setCache(cacheKey, artwork, 60 * 60 * 24 * 7)
      } else if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    return { status: 0, data: artwork }
  },

  /**
   *
   * @param {Number} id 作品ID
   */
  async getArtwork(id) {
    const cacheKey = `artwork_${id}`
    let artwork = await getCache(cacheKey)

    if (!artwork) {
      const res = await get('/illust', {
        id,
      })

      if (res.illust) {
        artwork = parseIllust(res.illust)
        setCache(cacheKey, artwork, 60 * 60 * 12)
      } else if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    return { status: 0, data: artwork }
  },

  /**
   *
   * @param {Number} id 作品ID
   */
  async ugoiraMetadata(id) {
    const cacheKey = `ugoira_${id}`
    let ugoira = await getCache(cacheKey)

    if (!ugoira) {
      const res = await get('/ugoira_metadata', {
        id,
      })

      if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        ugoira = {
          zip: imgProxy(res.ugoira_metadata.zip_urls.medium.replace('_ugoira600x600', '_ugoira1920x1080')),
          frames: res.ugoira_metadata.frames,
        }
      }

      setCache(cacheKey, ugoira, 60 * 60 * 24)
    }

    return { status: 0, data: ugoira }
  },

  /**
   *
   * @param {Number} id 画师ID
   */
  async getMemberInfo(id) {
    const cacheKey = `memberInfo_${id}`
    let memberInfo = await getCache(cacheKey)

    if (!memberInfo) {
      const res = await get('/member', {
        id,
      })

      if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        memberInfo = parseUser(res)
      }

      setCache(cacheKey, memberInfo, 60 * 60 * 24)
    }

    return { status: 0, data: memberInfo }
  },

  /**
   *
   * @param {Number} id 画师ID
   * @param {Number} page 页数
   */
  async getMemberArtwork(id, page, illust_type = 'illust') {
    const cacheKey = `memberArtwork_${id}_${illust_type}_p${page}`
    let memberArtwork = await getCache(cacheKey)

    if (!memberArtwork) {
      const res = await get('/member_illust', {
        id,
        page,
        illust_type,
      })

      if (res.illusts) {
        memberArtwork = res.illusts.map(art => parseIllust(art))
        setCache(cacheKey, memberArtwork, 60 * 60 * 12)
      } else if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    return { status: 0, data: memberArtwork }
  },

  async getMemberNovel(id, page = 1) {
    const cacheKey = `member_novel_${id}_p${page}`
    let memberArtwork = await getCache(cacheKey)

    if (!memberArtwork) {
      const res = await get('/member_novel', {
        id,
        page,
      })

      if (res.novels) {
        memberArtwork = res.novels.map(art => parseNovel(art))
        setCache(cacheKey, memberArtwork, 60 * 60 * 12)
      } else if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    return { status: 0, data: memberArtwork }
  },

  /**
   *
   * @param {Number} id 画师ID
   * @param {Number} max_bookmark_id max_bookmark_id
   */
  async getMemberFavorite(id, max_bookmark_id) {
    const cacheKey = `memberFavorite_${id}_m${max_bookmark_id}`
    let memberFavorite = await getCache(cacheKey)

    if (!memberFavorite) {
      memberFavorite = {}

      const res = await get('/favorite', {
        id,
        max_bookmark_id,
      })

      if (res.illusts) {
        const url = new URLSearchParams(res.next_url)
        memberFavorite.next = url.get('max_bookmark_id')
        memberFavorite.illusts = res.illusts.map(art => parseIllust(art))

        setCache(cacheKey, memberFavorite, 60 * 60 * 12)
      } else if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    return { status: 0, data: memberFavorite }
  },

  async getMemberFavoriteNovel(id, max_bookmark_id) {
    const cacheKey = `member_fav_novel_${id}_m${max_bookmark_id}`
    let memberFavorite = await getCache(cacheKey)

    if (!memberFavorite) {
      memberFavorite = {}

      const res = await get('/favorite_novel', {
        id,
        max_bookmark_id,
      })

      if (res.novels) {
        const url = new URLSearchParams(res.next_url)
        memberFavorite.next = url.get('max_bookmark_id')
        memberFavorite.novels = res.novels.map(art => parseNovel(art))

        setCache(cacheKey, memberFavorite, 60 * 60 * 12)
      } else if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    return { status: 0, data: memberFavorite }
  },

  async getTags() {
    const cacheKey = 'tags'
    let tags = await getCache(cacheKey)

    if (!tags) {
      const res = await get('/tags')

      if (res.trend_tags) {
        tags = res.trend_tags.map(data => {
          const { tag, translated_name } = data
          return {
            name: tag,
            tname: translated_name,
            pic: imgProxy(data.illust.image_urls.square_medium),
          }
        })

        setCache(cacheKey, tags, 60 * 60 * 12)
      } else if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    return { status: 0, data: tags }
  },

  async getNovelTags() {
    const cacheKey = 'tags.novel'
    let tags = await getCache(cacheKey)

    if (!tags) {
      const res = await get('/tags_novel')

      if (res.trend_tags) {
        tags = res.trend_tags.map(data => {
          const { tag, translated_name } = data
          return {
            name: tag,
            tname: translated_name,
            pic: imgProxy(data.illust.image_urls.square_medium),
          }
        })

        setCache(cacheKey, tags, 60 * 60 * 12)
      } else if (res.error) {
        return {
          status: -1,
          msg: dealErrMsg(res),
        }
      } else {
        return {
          status: -1,
          msg: i18n.t('tip.unknown_err'),
        }
      }
    }

    return { status: 0, data: tags }
  },
}
export default api
