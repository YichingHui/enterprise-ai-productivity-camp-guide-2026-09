# 杭州课前须知素材来源与验证

处理日期：2026-09-05。只处理本期用户提供的酒店素材，并复用八月课前须知已有品牌与讲师素材；源文件均保留未改动。

## 网页素材

网页素材目录：`frontend/assets/`。9 张图片合计 **986,563 字节（963.44 KiB）**。照片保持原比例缩放、转换为 WebP；Logo、讲师照片和经理微信名片均按原字节复制，不裁切、不重绘、不调整配色。

| 文件 | 用途 | 原始尺寸 → 输出尺寸 | 输出字节 | 处理方式 |
| --- | --- | --- | ---: | --- |
| `hotel-exterior.webp` | 酒店外观 | 1280×853 → 1200×800 | 98,412 | WebP 质量 82 |
| `hotel-entrance.webp` | 酒店入口 | 1280×853 → 1200×800 | 147,740 | WebP 质量 82 |
| `room-king.webp` | 大床房 | 1280×853 → 1200×800 | 59,228 | WebP 质量 82 |
| `room-twin.webp` | 双床房 | 1920×1280 → 1200×800 | 69,820 | WebP 质量 82 |
| `hotel-transport.webp` | 酒店交通地图 | 1810×1280 → 1200×849 | 110,346 | WebP 质量 88，保留地图文字与完整内容 |
| `hotel-nearby.webp` | 酒店周边与交通指南 | 1810×1280 → 1200×849 | 179,588 | WebP 质量 88，保留指南文字与完整内容 |
| `manager-wechat.jpg` | 订房经理微信名片 | 1083×1464 → 1083×1464 | 145,750 | 原字节复制，完整保留原有白底、二维码和安静区 |
| `logo-blue.png` | 意心会白底蓝字 Logo | 2127×600 → 2127×600 | 109,553 | 复用八月素材，原字节复制 |
| `lecturer.jpg` | 狼格拉底讲师照片 | 940×940 → 940×940 | 66,126 | 复用八月素材，原字节复制 |

## 原件映射

用户本轮素材所在目录：

`/var/folders/88/r708_x4d0yq98zj3tdnkdqpr0000gn/T/`

| 输出文件 | 用户提供的原始文件名 |
| --- | --- |
| `hotel-exterior.webp` | `codex-clipboard-1fb0e6f6-ab24-4b48-8241-1e2e2d33c70e.jpg` |
| `hotel-entrance.webp` | `codex-clipboard-1f2a2b07-db69-4f75-a7d3-29bf2daac14e.jpg` |
| `room-king.webp` | `codex-clipboard-215fb4c4-0271-4da1-a077-ce6feb1df925.jpg` |
| `room-twin.webp` | `codex-clipboard-41cf74e8-9113-4f08-89cc-93ff0af04796.jpg` |
| `hotel-transport.webp` | `codex-clipboard-7e25435d-cf12-40ac-b68d-8dcd9dab9fe5.jpg` |
| `hotel-nearby.webp` | `codex-clipboard-4ceca541-8f32-44bc-989a-e0db0c8286bd.jpg` |
| `manager-wechat.jpg` | `codex-clipboard-cd6a8f87-6d8e-4979-ac45-5a1d85911996.jpg` |

八月复用素材来自：

- `/Users/songfuxie/Projects/enterprise-ai-productivity-camp-guide-2026-08/frontend/assets/yixinhui-logo-blue.png`
- `/Users/songfuxie/Projects/enterprise-ai-productivity-camp-guide-2026-08/frontend/assets/lecturer-langgeladi.jpg`

## 分享二维码

- 文件：`docs/share-qr.png`，仅作为分享交付文件，不放入网页图片目录。
- 内容：`https://yichinghui.github.io/enterprise-ai-productivity-camp-guide-2026-09/`
- 规格：408×408 PNG，5,577 字节，Q 级纠错，黑白像素，四模块白色安静区，无装饰或嵌入文字。
- 编码方式：macOS CoreImage `CIQRCodeGenerator`；像素放大使用最近邻，未平滑二维码边缘。

## 实际验证

- 9 张网页图片均由 Sharp 回读格式及尺寸成功；六张 WebP 宽度均为 1200 像素。
- 经理名片、Logo、讲师照片与各自原件按字节比对一致。
- macOS Vision 解码 `manager-wechat.jpg`：成功。只记录是否成功，不输出或保留二维码中的微信内部标识。
- macOS Vision 解码 `docs/share-qr.png`：成功，且唯一解码结果与上列正式链接逐字符完全一致。
- 交通图 WebP 与分享二维码已实际打开检查：完整显示，二维码保留白色边缘。
- 酒店订房手机号经长截图二维码下方原文定位 OCR 复核：`13540620182`，即 `135 4062 0182`。`13540260182` 为转写错误，不应使用。

可复现处理脚本：`scripts/asset-prep.mjs`。脚本使用本机 bundled Sharp 处理照片，使用 macOS 系统 CoreImage 和 Vision 生成/校验二维码；仅写项目输出，不修改源文件。脚本只向日志打印经理二维码是否可解码。
