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
          <span class="umami--click--clear_db_cache">{{ $t('cache.clear') }}</span>
        </van-button>
      </template>
    </van-cell>
    <van-cell center :title="$t('cache.local')">
      <template #label>
        <span>{{ size.local[1] }} {{ $t('cache.records') }} ~ {{ size.local[0] | bytes }}</span>
      </template>
      <template #right-icon>
        <van-button size="small" color="linear-gradient(to right, #ff6034, #ee0a24)" @click="clearCache('local')">
          <span class="umami--click--clear_local_cache">{{ $t('cache.clear') }}</span>
        </van-button>
      </template>
    </van-cell>
    <van-cell center :title="$t('cache.session')">
      <template #label>
        <span>{{ size.session[1] }} {{ $t('cache.records') }} ~ {{ size.session[0] | bytes }}</span>
      </template>
      <template #right-icon>
        <van-button type="primary" size="small" @click="clearCache('session')">
          <span class="umami--click--clear_session_cache">{{ $t('cache.clear') }}</span>
        </van-button>
      </template>
    </van-cell>
    <van-cell center :title="$t('cache.mem')">
      <template #label>
        <span>{{ size.mem }}</span>
      </template>
    </van-cell>
  </div>
</template>

<script>
import { Device } from '@capacitor/device'
import { Dialog } from 'vant'
import { LocalStorage, SessionStorage } from '@/utils/storage'
import localDb from '@/utils/localDb'

export default {
  name: 'SettingClearCache',
  filters: {
    bytes(bytes) {
      bytes = Number(bytes)
      if (!bytes) return '0 B'

      const k = 1024
      const dm = 1
      const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

      const i = Math.floor(Math.log(bytes) / Math.log(k))

      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
    },
  },
  components: {
  },
  data() {
    return {
      size: {
        db: [0, 0],
        local: [0, 0],
        session: [0, 0],
        mem: 0,
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
      const { memUsed } = await Device.getInfo()
      this.size.mem = (memUsed / 1048576).toFixed(2) + 'MB'
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
        default:
          break
      }
      let message = this.$t('cache.confirm.first', [showName])
      if (type == 'db') message += this.$t('cache.confirm.second')
      Dialog.confirm({
        message,
        confirmButtonColor: 'black',
        cancelButtonColor: '#1989fa',
        closeOnPopstate: true,
        confirmButtonText: this.$t('common.confirm'),
        cancelButtonText: this.$t('common.cancel'),
      }).then(async () => {
        if (type === 'db') await localDb.clear()
        if (type === 'local') LocalStorage.clear()
        if (type === 'session') SessionStorage.clear()

        this.calcCacheSize()
        this.$toast.success(this.$t('cache.success_tip'))
      })
    },
  },
}
</script>

<style lang="stylus" scoped>

</style>