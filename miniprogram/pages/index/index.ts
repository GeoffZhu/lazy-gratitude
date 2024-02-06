const langActions = [
  { name: '中文' },
  { name: '英文' },
  { name: '日文' }
]
const maxLengthActions = [
  { name: '200' },
  { name: '400' },
  { name: '800'}
]

Page({
  actionType: 'lang',
  data: {
    content: '',
    showActionSheet: false,
    actions: langActions,
    lang: '中文',
    maxlength: 400
  },
  onShowActions(e: any) {
    if (e.currentTarget.dataset.cell === 'lang') {
      this.actionType = 'lang'
      this.setData({
        showActionSheet: true,
        actions: langActions
      })
    }
    if (e.currentTarget.dataset.cell === 'maxlength') {
      this.actionType = 'maxlength'
      this.setData({
        showActionSheet: true,
        actions: maxLengthActions
      })
    }
  },
  onSelectAction(e: any) {
    if (this.actionType === 'lang') {
      this.setData({
        showActionSheet: false,
        lang: e.detail.name
      })
    } else {
      this.setData({
        showActionSheet: false,
        maxlength: e.detail.name
      })
    }
  },
  onCancelAction() {
    this.setData({
      showActionSheet: false
    })
  },
  async onGenrate() {
    if (this.data.content.length > 0) {
      wx.showLoading({
        title: '努力生成中',
      })

      let resp: ICloud.CallFunctionResult
      try {
        resp = await wx.cloud.callFunction({
          name: 'chatglm',
          data: {
            content: this.data.content,
            lang: this.data.lang,
            maxLength: this.data.maxlength
          }
        })
        wx.hideLoading()

        const { code, msg, data } = resp.result as { code: number, msg: string, data: string}
        if (code === 0) {
          wx.setStorageSync('last_content', data)
          wx.navigateTo({
            url: `/pages/detail/index`,
          })
        } else {
          wx.showModal({
            title: '生成失败',
            content: msg,
            duration: 3000
          })
        }
      } catch (e) {
        console.error(e)
        wx.hideLoading()
        wx.showToast({
          icon: 'none',
          title: '服务器出现故障，暂不可用，请联系客服',
          duration: 3000
        })
      }
    } else {
      wx.showToast({
        icon: 'none',
        title: '请输入您要给谁写感谢信，为什么？',
        duration: 5000
      })
    }
  },
  onShareAppMessage() {
    return {
      title: '感谢信生成器'
    }
  }
})