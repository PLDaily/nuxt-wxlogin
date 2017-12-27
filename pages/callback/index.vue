<template>
  <section class="container">
  正在登录
  </section>
</template>

<script>
import axios from 'axios'
const config = require('../../config')
export default {
  mounted () {
    const code = this.$route.query.code || void 0
    axios.post(`${config.origin}/api/login`, {
      code: code
    }).then(data => {
      // 成功获取token后将其存放在vuex状态树中
      this.$store.commit('SETACCESSTOKEN', data.accessToken)
      window.location.replace(config.origin)
    }).catch(err => {
      throw err
    })
  }
}
</script>
