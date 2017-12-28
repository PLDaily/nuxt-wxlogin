const { Nuxt, Builder } = require('nuxt')
const bodyParser = require('body-parser')
const session = require('express-session')
const axios = require('axios')
const config = require('./config')
const log4js = require('log4js')
const app = require('express')()
const logger = log4js.getLogger('app')

log4js.configure({
  // 定义输出方式
  appenders: {
    console: {
      type: 'console'
    },
    http: {
      'type': 'dateFile',
      'filename': 'log/access.log',
      'pattern': '-yyyy-MM-dd',
      'compress': true
    },
    emergencies: {
      type: 'file',
      filename: 'log/errors.log'
    },
    error: {
      'type': 'logLevelFilter',
      'level': 'ERROR',
      appender: 'emergencies'
    }
  },
  // 设置以上定义输出方式的执行范围
  categories: {
    console: {
      appenders: ['console'],
      level: 'debug'
    },
    default: {
      appenders: ['http', 'error'],
      level: 'info'
    }
  }
})

app.use(log4js.connectLogger(log4js.getLogger('http')))
// Sessions 来创建 req.session
app.use(session({
  secret: 'super-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60000000 }
}))

// Body parser，用来封装 req.body
app.use(bodyParser.json())
app.use('/api/login', (req, res, next) => {
  const code = req.body.code || void 0
  // 获取微信access_token与unionid用于登录
  getToken(code).then(data => {
    // code失效
    if (data.errcode && data.errcode === 40029) {
      throw new Error('code失效')
    } else {
      const unionid = data.unionid
      const wxAccessToken = data.access_token
      // 后端登录，获取后端登录凭证token
      login(unionid, wxAccessToken).then(data => {
        req.session.accessToken = data.access_token
        return res.json({ accessToken: data.access_token })
      }).catch(err => {
        logger.error('Something went wrong:', err)
      })
    }
  }).catch(err => {
    logger.error('Something went wrong:', err)
  })
})

// 获取微信的access_token
function getToken (code) {
  let reqUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${config.wx.appid}&secret=${config.wx.secret}&code=${code}&grant_type=authorization_code`
  return axios.get(reqUrl)
    .then(data => data.data)
    .catch(err => {
      logger.error('Something went wrong:', err)
    })
}

// 后端借口的登录，你的会不同
function login (identifier, credential) {
  return axios.request({
    baseURL: config.apiurl,
    url: '/login/wechat',
    method: 'post',
    data: {
      platform: 'web',
      identifier: identifier,
      credential: credential,
      deviceId: 'wechat',
      seftwareVersion: 'wechat',
      hardwareVersion: 'wechat'
    }
  }).then(res => res.data).catch(err => {
    logger.error('Something went wrong:', err)
  })
}

// 我们用这些选项初始化 Nuxt.js：
const isProd = process.env.NODE_ENV === 'production'
const nuxt = new Nuxt({ dev: !isProd })
// 生产模式不需要 build
if (!isProd) {
  const builder = new Builder(nuxt)
  builder.build()
}
app.use(nuxt.render)
app.listen(3000)
console.log('Server is listening on http://localhost:3000')
