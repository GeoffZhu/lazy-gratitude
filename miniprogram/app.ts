App<IAppOption>({
  globalData: {},
  onLaunch() {
    wx.cloud.init({
      env: '配置你的云开发环境',
      traceUser: true,
    });
  },
})