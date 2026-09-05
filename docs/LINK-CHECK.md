# 外部链接 HTTP 验收

检查时间：2026-09-05 14:35（Asia/Shanghai）。

## 范围与判定口径

- 从本仓库 `frontend/index.html` 的实际 `href` 提取链接，解析 HTML 中的 `&amp;` 后请求；没有另造候选地址。
- 使用 `curl` 发起只读 GET，允许最多 8 次 HTTP 重定向，单请求超时 35 秒，响应正文丢弃。不使用浏览器 Cookie、账号凭据或 Cookie jar，不读取网页脚本、隐藏应用状态，不操作浏览器，不提交问卷。
- 分别模拟桌面 Chrome 与手机 Safari User-Agent。手机 UA 检查不等于手机真机或微信内置浏览器检查。
- HTTP 302 跳转到高德自身也计为 1 次；只统计服务端 HTTP 重定向，不统计 JavaScript 导航、App 唤起、登录交互或用户点击。
- 最终 HTTP 200 只证明对应响应可取回，不独立证明页面已完成渲染、地图数据正确或表单能够提交。

## 源码入口

| 入口 | 源码位置与数量 | 实际目标 |
| --- | --- | --- |
| 高德导航到会场 | `data-map="navigation"`，3 处 | `https://uri.amap.com/navigation?to=120.267222,30.188177,%E6%9D%AD%E5%B7%9E%E8%90%A7%E5%B1%B1%E4%BA%BA%E6%B0%91%E5%B9%BF%E5%9C%BA%E5%B8%8C%E5%B0%94%E9%A1%BF%E6%AC%A2%E6%9C%8B%E9%85%92%E5%BA%97&mode=car&src=yixinhui&callnative=0` |
| 查看酒店位置 | 会场与酒店模块，共 2 处 | `https://uri.amap.com/poidetail?poiid=B0FFJTFFJU&src=yixinhui&callnative=0` |
| 填写课前问卷 | `data-survey`，3 处 | `https://fcntz0gsnz8y.feishu.cn/share/base/form/shrcnJA1INpa4fZmPlv5NTp6BPg` |

源码另有一个 `callnative=1` 的“尝试打开高德App”入口，不属于本次 HTTP 验收范围，未将其记为 App 唤起通过。

## 实测结果

| 入口 | UA | HTTP 状态链 | 302 次数 | 全部 HTTP 重定向次数 | 最终响应 |
| --- | --- | --- | ---: | ---: | --- |
| 高德导航 | 桌面 Chrome | 302 → 200 | 1 | 1 | 200 |
| 高德导航 | 手机 Safari | 302 → 200 | 1 | 1 | 200 |
| 高德 POI | 桌面 Chrome | 302 → 200 | 1 | 1 | 200 |
| 高德 POI | 手机 Safari | 302 → 200 | 1 | 1 | 200 |
| 飞书问卷 | 桌面 Chrome | 302 → 302 → 302 → 302 → 302 → 200 | 5 | 5 | 200 |
| 飞书问卷 | 手机 Safari | 302 → 302 → 302 → 302 → 302 → 200 | 5 | 5 | 200 |

六次请求的 `curl` 均正常退出，无 stderr。

### 高德最终 URL

桌面导航：

```text
https://ditu.amap.com/dir?type=car&to%5Blnglat%5D=120.267222,30.188177&to%5Bname%5D=%E6%9D%AD%E5%B7%9E%E8%90%A7%E5%B1%B1%E4%BA%BA%E6%B0%91%E5%B9%BF%E5%9C%BA%E5%B8%8C%E5%B0%94%E9%A1%BF%E6%AC%A2%E6%9C%8B%E9%85%92%E5%BA%97&src=yixinhui&callnative=0&innersrc=uriapi
```

手机导航：

```text
https://m.amap.com/navigation/index/autoSearch=1&naviType=car&daddr=120.267222,30.188177,%E6%9D%AD%E5%B7%9E%E8%90%A7%E5%B1%B1%E4%BA%BA%E6%B0%91%E5%B9%BF%E5%9C%BA%E5%B8%8C%E5%B0%94%E9%A1%BF%E6%AC%A2%E6%9C%8B%E9%85%92%E5%BA%97&src=yixinhui&callnative=0&innersrc=uriapi
```

桌面 POI：

```text
https://ditu.amap.com/detail/B0FFJTFFJU/?src=yixinhui&callnative=0&innersrc=uriapi
```

手机 POI：

```text
https://m.amap.com/detail/index/poiid=B0FFJTFFJU&src=yixinhui&callnative=0&innersrc=uriapi
```

### 问卷最终 URL 与认证分流

两种 UA 最终返回同一个表单路径，携带各自临时认证参数；以下已脱敏，不是可以对外转发的新链接：

```text
https://fcntz0gsnz8y.feishu.cn/share/base/form/shrcnJA1INpa4fZmPlv5NTp6BPg?auth_token=[REDACTED]
```

两种 UA 的 HTTP 跳转序列均为：

1. 表单入口 → `accounts.feishu.cn/accounts/page/login`，带 `with_guest=1` 与表单回跳地址。
2. → `login.feishu.cn/accounts/trap`。
3. → `accounts.feishu.cn/accounts/page/login`，增加 `no_trap=1`。
4. → 原表单路径，附临时 `auth_token` 与 `login_redirect_times=1`。
5. → 原表单路径，保留临时 `auth_token`，最终 HTTP 200。

这里只记录飞书服务器自身的访客认证分流，不能据此断言学员必须登录，或断言微信免登录填写已经通过。正式分享仍使用源码中的干净表单链接，不保存、传播或硬编码临时认证参数。

## 地点事实与已知差异

- 当前导航终点参数为经度 `120.267222`、纬度 `30.188177`；酒店主 POI 为 `B0FFJTFFJU`。
- 规划阶段，高德搜索结果展示完整酒店名及博学路 777 号；主 Agent 打开的旧版 POI 详情曾显示“杭州萧山人民广场尔顿欢朋酒店”“杭州萧山区学路768号”，电话 `0571-86777999` 一致。
- 当时网页分享生成的短链中，首个 HTTP `Location` 参数也含上述名称和地址差异。因此不能将差异归结为截图裁切，也未判定其成因。
- 网页正文采用[Hilton 官方酒店名称与博学路 777 号地址](https://www.hilton.com/zh-hans/hotels/hghxshx-hampton-hangzhou-xiaoshan-peoples-square/)。本次只读 HTTP 检查未重新证明高德 POI 详情文字已经修正，也未验证酒店入口精确落点。
- 主 Agent 已另行在桌面浏览器点击导航入口，实际到达 `ditu.amap.com/dir?type=car&to[lnglat]=120.267222,30.188177...`，终点文本框显示完整酒店名称。这是主 Agent 提供的 PC 可视交互证据，不是本子任务的 HTTP 200 推断。
- 主 Agent 同轮打开官方 POI URI 后，网页最终出现高德手机号登录与滑块；未登录、未处理验证码。**酒店详情端存在外部登录/验证门槛，不能记为端到端完全通过。** 主导航不受这项详情端测试影响；遇到详情门槛可返回课前须知使用主导航或复制地址。

## 验收结论与未验证项

1. 高德两个 `callnative=0` 官方 URI 入口在桌面、手机 UA 下均可取回 HTTP 响应，均为 **1 次 HTTP 302** 后返回 200；未使用旧分享短链的多层中转。可视验收仅确认 PC 主导航到达路线规划并预填酒店；POI 详情可视端要求登录/滑块，未完成端到端验收。
2. 飞书问卷在两种 UA 下均可返回 200，但无 Cookie 请求存在 **5 次 HTTP 302** 的飞书访客认证分流；不可宣传为“零跳转”。
3. 本轮没有提交答卷或读取学员数据，没有修改飞书、高德或网站源代码。
4. 真实微信内置浏览器、手机实际渲染、问卷填写提交及收卷回读、高德 App 唤起、导航终点实际入口，均不在本轮 HTTP 检查的通过范围内。
5. [高德官方路径规划文档](https://lbs.amap.com/api/uri-api/guide/travel/route)提示微信、QQ 等内置浏览器可能无法成功唤起客户端；应保留网页入口与复制地址兜底。POI 参数依据[高德官方地点详情文档](https://lbs.amap.com/api/uri-api/guide/mobile-web/information)。

## 复现配置

桌面 UA：

```text
Mozilla/5.0 (Macintosh; Intel Mac OS X 14_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36
```

手机 UA：

```text
Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1
```

复现时从源码提取干净入口，使用 `curl -sS -L --max-redirs 8 --max-time 35 -A <UA> -o /dev/null -w '%{http_code} %{num_redirects}\n' <URL>`。若为排查记录响应头或最终 URL，先脱敏认证参数，再写入报告；不要把完整临时认证 URL 保存到仓库。
