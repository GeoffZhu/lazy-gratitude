const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const jwt = require('jsonwebtoken')
const axios = require('axios')
const config = require('./config')
const accessControl = require('../shared/accessControl')
const concurrencyControl = require('../shared/concurrencyControl')
const saveUserContent = require('../shared/saveUserContent')

const API_KEY = config.KEY.API_KEY

let token = generateToken(API_KEY, 60 * 60)

// 云函数入口函数
exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { content, lang = '中文', maxLength = 400 } = event

  if (!content)
    return {
      code: -1,
      msg: `请输入内容`,
    }

  let canAccess = await accessControl(OPENID)
  if (!canAccess) {
    return {
      code: -1,
      msg: `每个用户可使用10次，额外次数请联系客服\n（${OPENID}）`,
    }
  }

  canAccess = await concurrencyControl()
  if (!canAccess) {
    return {
      code: -1,
      msg: '服务器故障，请稍候再试',
    }
  }

  if (isTokenExpired(token)) {
    token = generateToken(API_KEY, 60 * 60)
  }

  try {
    const url =
      maxLength > 500
        ? 'https://open.bigmodel.cn/api/paas/v3/model-api/chatglm_pro/invoke'
        : 'https://open.bigmodel.cn/api/paas/v3/model-api/chatglm_std/invoke'
    const resp = await axios.post(
      url,
      {
        temperature: 0.8,
        prompt: [
          {
            role: 'user',
            content: `请写一篇，主题 "${content}"，语言为 "${lang}"，字数限制在 "${maxLength}左右" 的感谢信`,
          },
        ],
      },
      {
        headers: {
          Authorization: 'Bearer ' + token,
        },
      }
    )
    if (resp.success === false) {
      return {
        code: -1,
        msg: resp.msg || '生成失败，请联系客服',
      }
    }
    let genContent = resp.data.data.choices[0].content.replace(/\\n/g, '\n')
    if (genContent.startsWith('"') && genContent.endsWith('"')) {
      genContent = genContent.slice(1, -1)
    }

    // 模型产出的内容要经过微信的 security API 不然小程序会被下架
    const SecCheckResult = await cloud.openapi.security.msgSecCheck({
      content: genContent,
      version: 2,
      scene: 1,
      openid: OPENID,
    })

    const hasRisky = SecCheckResult.detail.some((event) => {
      if (event.suggest === 'risky' || event.suggest === 'review') return true
      return false
    })

    if (hasRisky) {
      return {
        code: -1,
        msg: '不支持敏感类感谢信生成，请调整您的输入',
      }
    }

    return {
      code: 0,
      data: genContent,
      msg: '成功',
    }
  } catch (error) {
    console.error(error)
    throw error
  }
}

function isTokenExpired(token) {
  const decodedToken = jwt.decode(token, {
    complete: true,
  })
  const expirationTime = decodedToken.payload.exp * 1000 // JWT中的过期时间是以秒为单位的，需要转换为毫秒
  const currentTime = Date.now()
  const timeDifference = expirationTime - currentTime
  const oneHour = 60 * 60 * 1000 // 1小时的毫秒数

  return timeDifference < oneHour
}

function generateToken(apikey, expSeconds) {
  const [id, secret] = apikey.split('.')

  const payload = {
    api_key: id,
    exp: Math.round(Date.now() / 1000) + expSeconds,
    timestamp: Math.round(Date.now() / 1000),
  }

  return jwt.sign(payload, secret, {
    algorithm: 'HS256',
    header: {
      alg: 'HS256',
      sign_type: 'SIGN',
    },
  })
}
