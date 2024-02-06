const cloud = require('wx-server-sdk')

const db = cloud.database()
const accessControlCollection = db.collection('access-control')


module.exports = async (OPENID) => {
  const accessControlDoc = accessControlCollection.doc(OPENID)
  let accessControlData
  try {
    accessControlData = await accessControlDoc.get()
  } catch(e) {
    console.error(e)
  }
  
  if (!accessControlData) {
    // 新用户 10次 机会
    await accessControlCollection.add({
      data: {
        _id: OPENID,
        count: 10,
        createdTime: Date.now()
      }
    })
  } else {
    if (accessControlData.data.count <= 0) {
      return false
    } else {
      await accessControlDoc.update({
        data: {
          count: accessControlData.data.count - 1
        }
      })
    }
  }
  return true
}