<template>
  <div class="setting-page">
    <top-bar id="top-bar-wrap" />
    <h3 class="af_title">FAQ</h3>
    <van-collapse v-model="activeNames">
      <van-collapse-item title="一直提示 API 超限或者 Rate Limit" name="1">可以到设置里切换 API 实例，或者直接使用 RefreshToken 或者 OAuth 方式登录</van-collapse-item>
      <van-collapse-item title="如何获取 RefreshToken" name="2">参见 <a href="https://www.nanoka.top/posts/e78ef86/" target="_blank">https://www.nanoka.top/posts/e78ef86/</a></van-collapse-item>
      <van-collapse-item title="图片加载很慢" name="3">受限于网络环境，图片加载速度可能会比较慢。可以到设置里切换图床，或者下载 Android 版本后打开图片直连功能</van-collapse-item>
      <van-collapse-item title="使用美国/英国 IP 无法查看某些作品" name="4">
        见 pixiv 官方公告：<a href="https://www.pixiv.net/info.php?id=10837" target="_blank" rel="noopener noreferrer">https://www.pixiv.net/info.php?id=10837</a>。
        建议用自己的账号登录本站后再使用，并且要在官方网页端<a href="https://www.pixiv.net/setting_user.php" target="_blank" rel="noopener noreferrer">设置</a>里面选择非美国/英国的地区，最好选择日区。
      </van-collapse-item>
      <van-collapse-item title="Cookie/SessionID 登录出错" name="5">建议使用 RefreshToken 方式登录</van-collapse-item>
      <van-collapse-item title="Android 版本点击下载就闪退" name="6">到系统设置里给予本应用存储权限，或者下载最新版本后再进行尝试</van-collapse-item>
    </van-collapse>
  </div>
</template>

<script>
export default {
  name: 'SettingAboutFaq',
  data() {
    return { activeNames: [] }
  },
  head() {
    return { title: 'FAQ' }
  },
}
</script>

<style lang="stylus" scoped>
</style>
