const cloud = require('wx-server-sdk')

const db = cloud.database()
const concurrencyControlDoc = db.collection('concurrency-control').doc('concurrency-control')

/**
 * 用于控制API调用频率，当前规则为 每分钟不超过60次
 */ 
module.exports = async () => {
  const { data } = await concurrencyControlDoc.get()
  let { totalCallCount, lastCallTime } = data

  const now = Date.now()
  if (now - lastCallTime > 60000) {
    totalCallCount = 1
    lastCallTime = Date.now()
    await concurrencyControlDoc.update({
      data: { totalCallCount, lastCallTime }
    })
  } else {
    if (totalCallCount > 120) {
      return false
    } else {
      totalCallCount++
      await concurrencyControlDoc.update({
        data: { totalCallCount }
      })
    }
  }
  return true
}