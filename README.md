# 企业AI提效实战营 · 杭州课前须知

2026年9月19—20日已报名学员指南。独立静态站点；不修改八月站点或飞书正式问卷。

- 页面：`frontend/index.html`
- 设计与来源：`docs/DESIGN.md`
- 验收：`docs/TEST-REPORT.md`
- 待办：`docs/TODO.md`
- 变更历史：`docs/CHANGELOG.md`
- 分享二维码：`docs/share-qr.png`

本地预览：在 `frontend/` 运行 `python3 -m http.server 4175 --bind 127.0.0.1`。

内容验证：`node frontend/tests/content-check.mjs`。

正式地址：[打开课前须知](https://yichinghui.github.io/enterprise-ai-productivity-camp-guide-2026-09/)

源码仓库：[GitHub](https://github.com/YichingHui/enterprise-ai-productivity-camp-guide-2026-09)。

上线验证：`node scripts/verify-live.mjs`，只读回取HTML、CSS、JS及当前全部素材，核验HTTP及SHA-256，不操作正式问卷。

截图修订的独立验收见 `docs/REVISION-QA.md`；软件下载入口核对见 `docs/SOFTWARE-LINKS.md`。交通指南支持页内查看高清 JPG、放大细节和原图回退。

GitHub Pages 只发布 `frontend/` 中的HTML/CSS/JS/assets，内部说明、测试脚本、测试报告和分享二维码不作为网站目录发布。源码仓库为公开仓库；不得写入凭据、学员信息或临时认证链接。

## 分享给学员

直接复制正式地址到微信群，或发送 `docs/share-qr.png`。无需发送带临时认证参数的飞书地址。请提醒学员先查看日程，再在开课前完成需求问卷；订房联系酒店经理，课程问题联系谢老师。

微信可能出现GitHub外部访问确认；二维码长按及高德App唤起需要真机检查。遇高德详情要求登录时，使用本页主导航或复制会场地址。网站不会声称能消除微信平台提示。

## 更新与恢复

在功能/修复分支更改，运行内容检查并预览，再合并到main推送，触发Pages。工作流只监听前端与工作流文件变化，文档更新不触发部署。恢复使用git revert提交，不强制覆盖历史。首次部署运行与完整证据见 `docs/TEST-REPORT.md`。
