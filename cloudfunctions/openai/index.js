const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV,
})

const { Configuration, OpenAIApi } = require('openai')
const config = require('./config')
const accessControl = require('../shared/accessControl')
const concurrencyControl = require('../shared/concurrencyControl')
const saveUserContent = require('../shared/saveUserContent')

const OPENAI_API_KEY = config.KEY.OPENAI_API_KEY
const OPENAI_ORG_KEY = config.KEY.OPENAI_ORG_KEY

const configuration = new Configuration({
  organization: OPENAI_ORG_KEY,
  apiKey: OPENAI_API_KEY,
  basePath: 'https://gzgzgz.deno.dev/v1',
})
const openai = new OpenAIApi(configuration)

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

  let resp
  try {
    resp = await openai.createChatCompletion({
      model: maxLength > 500 ? 'gpt-3.5-turbo-16k' : 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content:
            '你是一个感谢信生成器，用户给你感谢信的主题和要求，需要根据主题和要求生成感谢信',
        },
        {
          role: 'user',
          content: `主题 "${content}"。语言为${lang}。字数限制${maxLength}字。`,
        },
      ],
      max_tokens: maxLength === 200 ? 1000 : maxLength === 400 ? 2000 : 4000,
      temperature: 0.8,
    })
  } catch (e) {
    console.error(e)
    return {
      code: -1,
      msg: '休息中，请稍候再试',
    }
  }
  return {
    code: 0,
    data: resp.data.choices[0].message.content,
    msg: '成功',
  }
}
