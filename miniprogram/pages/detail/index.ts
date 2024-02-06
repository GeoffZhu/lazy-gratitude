const app = getApp<IAppOption>()


Page({
  data: {
    content: ''
  },
  onLoad(query) {
    if (query.index === undefined) {
      wx.setNavigationBarTitle({
        title: '为您生成的感谢信'
      })
      this.setData({
        content: wx.getStorageSync('last_content').replace(/\\n/g, '\n')
      })
    }
  },
  onBtnTap() {
    wx.setClipboardData({
      data: this.data.content,
      success() {
        wx.showToast({
          icon: 'none',
          title: '复制成功'
        })
      },
      fail() {
        wx.showToast({
          icon: 'none',
          title: '复制失败'
        })
      }
    })
  }
})