# 课程软件下载入口核对

核对日期：2026-09-05。范围：只核对官方网页、公开应用元信息和页面可见下载入口；不安装、不运行安装包、不登录、不修改课程问卷。

## 页面接入建议

| 展示名称 | 推荐入口 | 核对结果 |
| --- | --- | --- |
| DoubaoWork（豆包工作） | https://www.doubao.com/work | 官方网页首屏展示“下载豆包工作”，无需登录即可看到下载入口；不是仅登录或邀测页面。 |
| WorkBuddy | https://www.workbuddy.cn/ | 腾讯官方产品首页，首屏展示“立即下载”，页尾提供客户端下载。 |
| Codex | https://learn.chatgpt.com/docs/app#getting-started | 官方桌面应用页面，下载区提供当前系统下载按钮及“Choose another ChatGPT download”菜单；不是网页版聊天入口。 |

按钮可统一使用“软件名称 + 官方下载”。建议下方保留一句“请在电脑上打开官方页面，选择适合自己系统的版本；现场也有助教协助安装，无需工具焦虑”。不要求三款全部提前安装，不写死安装包版本、价格或赠送权益。

## DoubaoWork（豆包工作）

- 本地 `/Applications/DoubaoWork.app/Contents/Info.plist` 的公开元信息：名称 `DoubaoWork`，标识 `com.work.pc.doubao`；用于辨别产品身份，不作为官网最新版本声明。
- 已实际打开 [豆包工作官网](https://www.doubao.com/work)。页面标题为“豆包工作 - 工作新习惯，先让豆包干”，首屏按钮为“下载豆包工作”。
- 页面可见下载版本：Mac ARM64、Mac x64、Mac 通用、Windows x64、Windows ARM64。
- 不使用通用豆包聊天客户端下载页，也不使用第三方教程或镜像下载站替代。
- 查看下载版本菜单时页面出现“准备下载中…”提示；本轮没有选择菜单中的系统安装包，也没有运行或安装软件。该按钮包含下载动作，后续验收不重复触发。

## WorkBuddy

- 本地 `/Applications/WorkBuddy.app/Contents/Info.plist` 的公开元信息：名称 `WorkBuddy`，标识 `com.workbuddy.workbuddy`，版权主体为腾讯科技（深圳）有限公司。
- [腾讯云官方安装指南](https://cloud.tencent.com.cn/document/product/1831/134387)说明应进入 WorkBuddy 官网选择下载及相应电脑系统版本。
- 已实际打开 [WorkBuddy 官网](https://www.workbuddy.cn/)，可见“腾讯出品”的产品说明、“立即下载”及“客户端下载”；未登录也可查看。
- 不采用 `workbuddy.com`（另一个同名产品），不采用非官方教程站。
- 不用 `/app-download/` 作为本课程电脑软件下载入口：该页面主要引导手机扫码；课程要求携带日常电脑。

## Codex

- 先检查本地应用上下文：当前 `/Applications/ChatGPT.app/Contents/Resources/` 包含 `codex`、`com.openai.codex.manifest` 等公开资源。
- 已检索并实际打开 [原 Codex app 官方文档地址](https://developers.openai.com/codex/app/)。当前会重定向至 [ChatGPT desktop app 官方页面](https://learn.chatgpt.com/docs/app)。
- 新页面标题为“ChatGPT desktop app”，并明确说明可以选择 ChatGPT 或 Codex；因此保留用户指定的“Codex”按钮名，但不要声称目的页标题仍叫 Codex app。
- 浏览器中可见首屏“Download for macOS (Apple Silicon)”；下载区文字列出 macOS、Windows、Linux，并有“Choose another ChatGPT download”菜单。
- 本次 Mac 环境观察到下载按钮实际目标为官方 `persistent.oaistatic.com/codex-app-prod/Codex.dmg`。只读取链接，没有点击或下载；课程页面不硬编码这个仅面向 Mac 的安装包链接。
- 采用带 `#getting-started` 的官方地址，可直接定位到下载区，由学员按电脑系统自行选择，避免误引网页版聊天。

## 验证边界

- 三款产品均已用真实浏览器打开官方页面并读到可见下载入口，未登录，未执行安装。
- `web` 文本抓取偶发返回 Internal Error 的页面已用浏览器和公开 HTML 读取补核，不能据此误报网站不可访问。
- 尚未验证 Windows / Linux 真机安装兼容性、学员账号权益、中国大陆不同网络或微信对外链的拦截情况。
- 下载入口及产品命名可能继续变化，开课前如有变化，应重新核对官方页面；无需改动飞书问卷和答卷后台。

## 本次变更

- 新增本文件，记录软件下载按钮的接入地址、产品身份、现场可见证据与测试边界。未改动页面文件或外部服务。
