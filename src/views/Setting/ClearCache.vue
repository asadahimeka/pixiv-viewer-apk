<template>
  <div class="setting-page">
    <top-bar id="top-bar-wrap" />
    <h3 class="af_title">{{ $t('cache.title') }}</h3>
    <van-cell center :title="$t('cache.db')">
      <template #label>
        <span>{{ size.db[1] }} {{ $t('cache.records') }} ~ {{ size.db[0] | bytes }}</span>
      </template>
      <template #right-icon>
        <van-button type="info" size="small" @click="clearCache('db')">
          <span>{{ $t('cache.clear') }}</span>
        </van-button>
      </template>
    </van-cell>
    <van-cell center :title="$t('cache.local')">
      <template #label>
        <span>{{ size.local[1] }} {{ $t('cache.records') }} ~ {{ size.local[0] | bytes }}</span>
      </template>
      <template #right-icon>
        <van-button size="small" color="linear-gradient(to right, #ff6034, #ee0a24)" @click="clearCache('local')">
          <span>{{ $t('cache.clear') }}</span>
        </van-button>
      </template>
    </van-cell>
    <van-cell center :title="$t('cache.session')">
      <template #label>
        <span>{{ size.session[1] }} {{ $t('cache.records') }} ~ {{ size.session[0] | bytes }}</span>
      </template>
      <template #right-icon>
        <van-button type="primary" size="small" @click="clearCache('session')">
          <span>{{ $t('cache.clear') }}</span>
        </van-button>
      </template>
    </van-cell>
    <van-cell center :title="$t('ltKHIZm9mBZ8Dit_u8aW4')">
      <!-- <template #label>
        <span>{{ size.imgCache[1] }} {{ $t('cache.records') }} ~ {{ size.imgCache[0] | bytes }}</span>
      </template> -->
      <template #right-icon>
        <van-button type="primary" size="small" @click="clearCache('imgCache')">
          <span>{{ $t('cache.clear') }}</span>
        </van-button>
      </template>
    </van-cell>
    <van-cell center is-link :title="$t('I9MyPQxu3O04E3h2qRBzN')" @click="openSettings" />
  </div>
</template>

<script>
import { Dialog } from 'vant'
import { LocalStorage, SessionStorage } from '@/utils/storage'
import localDb from '@/utils/localDb'
import { formatBytes, trackEvent } from '@/utils'
import { NativeSettings, IOSSettings } from 'capacitor-native-settings'
import { Filesystem, Directory } from '@capacitor/filesystem'

export default {
  name: 'SettingClearCache',
  filters: {
    bytes(bytes) {
      return formatBytes(bytes)
    },
  },
  data() {
    return {
      size: {
        db: [0, 0],
        local: [0, 0],
        session: [0, 0],
        imgCache: [0, 0],
      },
    }
  },
  activated() {
    this.calcCacheSize()
  },
  methods: {
    async calcCacheSize() {
      this.size.local = [LocalStorage.size, localStorage.length]
      this.size.session = [SessionStorage.size, sessionStorage.length]
      this.size.db = [
        (await navigator.storage.estimate()).usage,
        await localDb.length(),
      ]
      // const { size = 0, len = 0 } = await Filesystem.getFileSize({ path: '', directory: Directory.External }).catch(() => ({}))
      // this.size.imgCache = [size, len]
    },
    clearCache(type) {
      let showName
      switch (type) {
        case 'db':
          showName = this.$t('cache.db')
          break
        case 'local':
          showName = this.$t('cache.local')
          break
        case 'session':
          showName = this.$t('cache.session')
          break
        case 'imgCache':
          showName = this.$t('ltKHIZm9mBZ8Dit_u8aW4')
          break
        default:
          break
      }
      let message = this.$t('cache.confirm.first', [showName])
      if (type == 'db') message += this.$t('cache.confirm.second')
      if (type == 'local') message += this.$t('L1YwIFcNQQQVihEgMBUaK')
      Dialog.confirm({
        message,
        confirmButtonColor: 'black',
        cancelButtonColor: '#1989fa',
        closeOnPopstate: true,
        confirmButtonText: this.$t('common.confirm'),
        cancelButtonText: this.$t('common.cancel'),
      }).then(async () => {
        if (type === 'db') {
          await localDb.clear()
          const keyList = await caches.keys()
          await Promise.all(keyList.map(async key => {
            await caches.delete(key)
          }))
        }
        if (type === 'local') LocalStorage.clear()
        if (type === 'session') SessionStorage.clear()
        if (type === 'imgCache') {
          const directory = Directory.Cache
          const { files } = await Filesystem.readdir({ path: '', directory })
          await Promise.all(files.map(async it => {
            if (it.type == 'directory') {
              await Filesystem.rmdir({ path: it.name, directory, recursive: true })
            } else {
              await Filesystem.deleteFile({ path: it.name, directory })
            }
          }))
        }

        this.calcCacheSize()
        this.$toast.success(this.$t('cache.success_tip'))
        trackEvent('ClearCache', { type })
      }).catch(() => {})
    },
    openSettings() {
      NativeSettings.openIOS({
        option: IOSSettings.App,
      })
    },
  },
}
</script>

<style lang="stylus" scoped>

</style>
