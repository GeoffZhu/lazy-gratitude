## 感谢信生成器
![Demo](/assets/demo.png "Demo")

感谢信生成器是一款通过通过大模型生成感谢信的微信小程序


## 如何使用
直接使用微信开发者工具打开此项目即可

### 1、配置API KEY
cloudfuncitons 目录中实现了 openai 和 chatglm 两个云函数，小程序代码中当前使用的是 chatglm。可以在对应云函数的config.json中配置 API_KEY

### 2、配置云开发

#### 在 app.ts 中配置你的云开发 env
#### 在云开发面板建表
1、创建两个云数据库的 Collection，名称分别为 access-control 和 concurrency-control
2、给 concurrency-control 创建一个 ID 为 concurrency-control 的 Doc，包含 totalCallCount, lastCallTime 两个字段，值均为0

## 问题

### 如何开启访问限制
cloudfuncitons/shared/accessControl 实现了根据用户OPENID的访问限制
cloudfuncitons/shared/concurrencyControl 实现了对大模型API每分钟调用次数的限制，目前为每分不得超过120次，可自行修改或扩展。

云函数中访问控制的代码逻辑
``` javascript 
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
```