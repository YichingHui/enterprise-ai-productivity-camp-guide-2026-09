import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

// Independent release-content checks; no browser, network or third-party dependency.
const root = fileURLToPath(new URL('../', import.meta.url));
const htmlPath = path.join(root, 'index.html');
if (!fs.existsSync(htmlPath)) {
  console.error('FAIL: frontend/index.html 尚未生成，不能执行发布内容验收。');
  process.exit(1);
}
const html = fs.readFileSync(htmlPath, 'utf8');
const failures = [];
let checks = 0;
function check(condition, message) {
  checks += 1;
  if (!condition) failures.push(message);
}
function decode(value) {
  return value.replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .replace(/&#x([\da-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
}
function attrs(tag) {
  const result = {};
  for (const match of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
    result[match[1].toLowerCase()] = decode(match[2] ?? match[3] ?? match[4]);
  }
  return result;
}
const text = decode(html.replace(/<!--[^]*?-->/g, '')
  .replace(/<(script|style)\b[^>]*>[^]*?<\/\1>/gi, '')
  .replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const compact = text.replace(/\s+/g, '');
const tags = [...html.matchAll(/<[a-z][^>]*>/gi)].map(match => ({ tag: match[0], attrs: attrs(match[0]) }));
const anchors = tags.filter(item => /^<a\b/i.test(item.tag));
const images = tags.filter(item => /^<img\b/i.test(item.tag));
const ids = tags.map(item => item.attrs.id).filter(Boolean);

check(/<html\b[^>]*lang=["']zh-CN["']/i.test(html), '页面需声明中文语言。');
check(/name=["']viewport["']/i.test(html), '缺少移动端 viewport。');
check(compact.includes('企业AI提效实战营'), '缺少课程正式名称。');
check(compact.includes('2026'), '缺少课程年份 2026。');
check(/9月19(?:日|[—–～~-]20)|09[./-]19/.test(compact), '缺少 9 月 19 日课程日期。');
check(/9月20日|9月19[—–～~-]20日|09[./-]19[—–～~-]20/.test(compact), '缺少 9 月 20 日课程日期。');
check(/09[:：]30[—–～~-]09[:：]50/.test(compact), '签到时间应为 09:30—09:50。');
check((compact.match(/10[:：]00[—–～~-]12[:：]30/g) || []).length >= 2, '两天上午均需明确 10:00—12:30。');
check((compact.match(/14[:：]00[—–～~-]17[:：]30/g) || []).length >= 2, '两天下午均需明确 14:00—17:30。');
check(/12[:：]30[—–～~-]14[:：]00/.test(compact), '午餐午休需明确 12:30—14:00。');
check(/19[:：]00[—–～~-]21[:：]00/.test(compact), '19 日实操答疑需明确 19:00—21:00。');
check(compact.includes('实操答疑'), '缺少实操答疑说明。');
check(compact.includes('杭州萧山人民广场希尔顿欢朋酒店'), '缺少完整杭州酒店名。');
check(/(?:二楼|二层|2F)会场|(?:二楼|二层)·?课程会场/.test(compact), '会场应明确在酒店二楼。');
check(compact.includes('大床') && compact.includes('双床'), '大床房与双床房应分别展示。');
check((compact.match(/388/g) || []).length >= 2, '两种房型均需展示协议价 388 元。');
check(/间.{0,3}(?:晚|夜)/.test(compact), '房价需标明每间每晚，避免与每人价格混淆。');
check(/含(?:两|2)份早餐/.test(compact), '需明确协议价含两份早餐。');
check(/9月18日/.test(compact), '需明确 9 月 18 日提前入住适用。');
check(/午[、与和及]?晚餐(?:均|费用)?自理|午餐.{0,5}晚餐.{0,5}自理/.test(compact), '需明确午晚餐自理。');
check(compact.includes('13540620182'), '酒店经理联系电话应为原始材料确认的 13540620182。');
check(compact.includes('13594719905'), '课程联系人电话应为 13594719905。');
check(compact.includes('意心会谢老师'), '课程联系人应明确意心会谢老师。');
check(compact.includes('电脑') && compact.includes('充电器'), '需提醒携带日常电脑及充电器。');
check(compact.includes('助教') && compact.includes('安装'), '需明确现场助教协助安装。');
check(/工具.{0,8}焦虑|无需.{0,8}焦虑|不用.{0,8}焦虑/.test(compact), '需明确无需工具焦虑。');

const survey = 'https://fcntz0gsnz8y.feishu.cn/share/base/form/shrcnJA1INpa4fZmPlv5NTp6BPg';
const telephoneLinks = anchors.filter(({ attrs: a }) => a.href?.startsWith('tel:'));
check(telephoneLinks.some(({ attrs: a }) => a.href === 'tel:13540620182'), '缺少正确的酒店经理拨号入口。');
check(telephoneLinks.some(({ attrs: a }) => a.href === 'tel:13594719905'), '缺少正确的课程老师拨号入口。');
for (const { attrs: a } of telephoneLinks) check(['tel:13540620182', 'tel:13594719905'].includes(a.href), `出现未经确认的拨号号码：${a.href}`);
const surveyLinks = anchors.filter(({ attrs: a }) => a.href?.includes('feishu.cn/share/base/form/'));
check(surveyLinks.length >= 2, '正文与快捷区至少各有一处正式问卷入口。');
for (const { attrs: a } of surveyLinks) check(a.href === survey, `问卷入口并非本期正式链接：${a.href}`);
check(/7[—–～~-]9分钟/.test(compact), '问卷提醒需明确预计填写 7—9 分钟。');

const amapLinks = anchors.filter(({ attrs: a }) => a.href?.startsWith('https://uri.amap.com/'));
check(amapLinks.some(({ attrs: a }) => {
  const url = new URL(a.href);
  return url.pathname === '/poidetail' && url.searchParams.get('poiid') === 'B0FFJTFFJU';
}), '缺少已核实 POI B0FFJTFFJU 的高德酒店详情入口。');
const navigationLinks = amapLinks.filter(({ attrs: a }) => new URL(a.href).pathname === '/navigation');
check(navigationLinks.length >= 2, '需在首屏/快捷区提供至少两处会场导航入口。');
for (const { attrs: a } of navigationLinks) {
  const url = new URL(a.href);
  const [lng, lat] = (url.searchParams.get('to') || '').split(',');
  check(Math.abs(Number(lng) - 120.267222) < 0.000001 && Math.abs(Number(lat) - 30.188177) < 0.000001,
    `高德导航终点坐标不正确：${a.href}`);
}
for (const { attrs: a } of amapLinks) {
  const url = new URL(a.href);
  check(['0', '1'].includes(url.searchParams.get('callnative')), `高德入口缺少明确的网页/App 打开模式：${a.href}`);
}
check(amapLinks.some(({ attrs: a }) => new URL(a.href).searchParams.get('callnative') === '1'), '应保留明确标注的高德 App 尝试入口。');

const forbidden = [
  '重庆', '壹棠', 'yitang-', '2026.08.22', '8月22日', '8月23日',
  'shrcnMfzWvTqV2lwTGWvz44ob0e', '13372799272', '13540260182', 'B0HRGK74B3',
  '106.574875', '29.631266', 'surl.amap.com', 'uri.amap.com/search',
  'enterprise-ai-productivity-camp-guide-2026-08',
];
for (const value of forbidden) check(!html.includes(value), `仍有旧期内容或不应使用的地图链接：${value}`);
for (const value of ['¥252', '¥315', '¥300+', '¥350+', '¥2980', '¥7980']) {
  check(!compact.includes(value), `仍有旧期价格：${value}`);
}
check(!/\b(?:18[:：]00|21[:：]30)\b/.test(compact), '仍有旧期 18:00 或 21:30 结束时间。');
check(new Set(ids).size === ids.length, 'HTML 存在重复 id，锚点/弹窗关联可能失效。');

for (const { attrs: a } of anchors) {
  if (a.href?.startsWith('#') && a.href.length > 1) {
    check(ids.includes(decodeURIComponent(a.href.slice(1))), `锚点目标不存在：${a.href}`);
  }
  if (a.target === '_blank') check((a.rel || '').split(/\s+/).includes('noopener'), `新窗口链接缺少 noopener：${a.href}`);
  check(!a.href?.startsWith('http:'), `外部链接必须使用 HTTPS：${a.href}`);
}
check(images.length >= 4, '预期包含品牌与酒店实景/二维码等本地图片。');
for (const { attrs: a } of images) {
  check(Object.hasOwn(a, 'alt'), `图片缺少 alt：${a.src}`);
  check(Number(a.width) > 0 && Number(a.height) > 0, `图片缺少有效宽高，可能产生布局跳动：${a.src}`);
}

const resources = new Set();
function addResource(raw) {
  if (!raw || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(raw)) return;
  check(!raw.startsWith('/'), `GitHub Pages 子路径部署不能使用站点根相对资源：${raw}`);
  const clean = decodeURIComponent(raw.split(/[?#]/, 1)[0]);
  const resolved = path.resolve(root, clean.replace(/^\//, ''));
  check(resolved.startsWith(root), `资源路径逃逸静态目录：${raw}`);
  resources.add(resolved);
}
for (const { tag, attrs: a } of tags) {
  for (const name of ['src', 'poster']) addResource(a[name]);
  if (/^<(?:a|link)\b/i.test(tag)) addResource(a.href);
  if (a.srcset) for (const candidate of a.srcset.split(',')) addResource(candidate.trim().split(/\s+/)[0]);
}
for (const cssPath of [path.join(root, 'styles.css')]) {
  if (!fs.existsSync(cssPath)) continue;
  for (const match of fs.readFileSync(cssPath, 'utf8').matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) addResource(match[1].trim());
}
for (const resource of resources) check(fs.existsSync(resource) && fs.statSync(resource).isFile(), `本地资源不存在：${path.relative(root, resource)}`);

// Screenshot-revision contract checks. Browser layout and real WeChat still need
// separate evidence; these checks protect exact content and the fallback paths.
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const app = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
for (const [id, heading] of [
  ['schedule-title', '课程时段安排'], ['prepare-title', '学员须知'], ['lecturer-title', '授课老师'],
]) check(new RegExp(`<h2\\b[^>]*id="${id}"[^>]*>${heading}</h2>`).test(html), `截图指定标题未落实：${heading}`);
check(/data-testid="survey-link"[^>]*>点击填写问卷\s*</.test(html), '问卷卡片按钮应为“点击填写问卷”。');
for (const stale of ['现在填写问卷', '两天一夜，按这张日程到场', '带上电脑，无需工具焦虑', '和讲师一起，把方法带进工作', 'AI管理艺术家']) {
  check(!text.includes(stale), `旧批注文案仍存在：${stale}`);
}
const lecturer = html.match(/<section\b[^>]*id="lecturer"[^>]*>([^]*?)<\/section>/)?.[1] || '';
const lecturerText = decode(lecturer.replace(/<[^>]+>/g, '')).replace(/\s+/g, '');
const lecturerCopy = [
  '狼格拉底', '意心会创始人', 'AI提效艺术家', '3家AI原生基因公司创始人',
  '《企业AI提效实战营》的授课内容是基于真实企业咨询、智能体定制、课程教学和业务落地，形成一套企业AI提效方法。',
  '讲师本人就是3家公司的老板。课程内容不是概念，也不是播放千篇一律的PPT，而是已践行在公司内部，并服务200+企业客户和上千名学员的真实理论与经过验证的有效方法论。',
  '国内首批进入AI应用实践的一线老板，多位抖音头部AI博主的AI启蒙老师。',
  '完成自己公司内容生产、客户管理、知识沉淀、团队协作等核心流程的AI化实践。',
  '正式对外商业服务，持续主导企业AI化架构和任务型AI智能体的定制开发与落地。',
];
for (const copy of lecturerCopy) check(lecturerText.includes(copy), `新讲师截图文案缺失或被改写：${copy}`);
check(/<h3>2023<\/h3>[^]*<h3>2024<\/h3>[^]*<h3>2025\.04 [–—-] NOW<\/h3>/.test(lecturer), '讲师经历需按 2023、2024、2025.04–NOW 排列。');
check(!/lecturer-stats|30\+|300\+|assets\/lecturer\.jpg/.test(lecturer), '讲师模块不应保留旧统计卡或旧形象照。');
const brandTag = html.match(/<a\b[^>]*class="brand"[^>]*>\s*(<img\b[^>]*>)/)?.[1];
const brand = attrs(brandTag || '');
check(brand.src === 'assets/logo-white.png' && brand.width === '2127' && brand.height === '599', '页头应使用新白色 Logo 的完整比例。');
check(/\.brand\{[^}]*background:transparent;[^}]*padding:0/.test(css), '白色透明 Logo 不应留在旧白底卡片中。');
const logo = fs.readFileSync(path.join(root, 'assets/logo-white.png'));
check(logo.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) && logo[25] === 6, '白色 Logo 应保留 RGBA PNG 格式和透明通道。');
check(logo.readUInt32BE(16) === 2127 && logo.readUInt32BE(20) === 599, 'Logo 输出尺寸应保持 2127×599。');
check(/src="assets\/lecturer-portrait\.webp"[^>]*width="1800"[^>]*height="1198"/.test(lecturer), '新讲师形象照应按完整 1800×1198 比例接入。');
check(/\.lecturer-image img\{height:auto;width:100%;object-fit:contain;/.test(css), '讲师形象照需使用完整比例适配规则，不裁切画面。');
check(surveyLinks.length === 3, '本轮应保留 3 个正式问卷入口，不新增收卷接口。');
check(amapLinks.length === 6, '本轮应保留 6 个原高德入口。');
const softwareBlock = html.match(/<div\b[^>]*class="software-links"[^>]*>([^]*?)<\/div>/)?.[1] || '';
const softwareEntries = [
  ['DoubaoWork', 'https://www.doubao.com/work'],
  ['WorkBuddy', 'https://www.workbuddy.cn/'],
  ['Codex', 'https://learn.chatgpt.com/docs/app'],
];
for (const [label, url] of softwareEntries) {
  check([...softwareBlock.matchAll(/<a\b[^>]*>[^]*?<\/a>/g)].some(([tag]) => attrs(tag).href === url && tag.includes(label)), `缺少已核验的 ${label} 官方入口。`);
}
check((softwareBlock.match(/<a\b/g) || []).length === 3, '软件入口应仅有本次指定的 3 项。');
check(compact.includes('不必提前全部安装完毕'), '软件安装应保持非强制，不制造工具焦虑。');
const brochureLinks = anchors.filter(({ tag }) => /\bdata-image-open(?:\s|>)/.test(tag));
check(brochureLinks.length === 2, '酒店补充指南应保留两张可放大的图片。');
for (const [index, expected] of ['assets/hotel-transport.jpg', 'assets/hotel-nearby.jpg'].entries()) {
  const link = brochureLinks[index]?.attrs || {};
  check(link.href === expected && link.target !== '_blank', `指南图应提供同页 JPG 原图降级入口：${expected}`);
  check(Boolean(link['data-image-title']), `指南图缺少可访问弹窗标题：${expected}`);
  const buffer = fs.readFileSync(path.join(root, expected));
  check(buffer[0] === 0xff && buffer[1] === 0xd8 && buffer.length < 800 * 1024, `指南 JPG 应格式正确且低于 800 KiB：${expected}`);
}
check(compact.includes('点击展开') && compact.includes('点击收起') && compact.includes('点击下方图片即可放大查看'), '交通指南需明确展开、收起与点击放大提示。');
check(ids.includes('image-dialog') && ids.includes('image-frame') && ids.includes('image-status'), '指南图弹窗缺少画面或加载状态结构。');
check(/<dialog[^>]*id="image-dialog"[^>]*aria-labelledby="image-title"[^>]*aria-describedby="image-help"/.test(html), '图片弹窗需有可访问标题与操作说明。');
check(/id="guide-full-image"[^>]*width="1810"[^>]*height="1280"/.test(html), '指南放大图需使用原始 1810×1280 分辨率。');
check(/data-image-zoom/.test(html) && /data-image-retry/.test(html) && /data-image-close/.test(html), '图片弹窗需保留放大、重试和关闭操作。');
check(/\.image-frame[^{}]*\{[^}]*overflow:auto/.test(css) && /\.image-frame\.is-zoomed img\{width:1810px;max-width:none/.test(css), '放大图需在独立滚动区查看，不能挤宽正文。');
check(/#image-dialog \[hidden\]\{display:none!important\}/.test(css), '弹窗加载和错误状态的 hidden 不能被 display 规则覆盖。');
const dayLabels = [...html.matchAll(/class="day-label">([^<]+)</g)].map(match => match[1]);
check(dayLabels.length === 2 && dayLabels[0] === '从业务到 AI 员工' && dayLabels[1] === '从单点到业务系统', '两日日程标签应保持完整原文。');
check(/\.day-label\{[^}]*max-width:none;white-space:nowrap/.test(css), '日程标签应有取消宽度上限且不换行的覆盖规则。');
check(/\.day-card>header\{display:grid;grid-template-columns:1fr auto/.test(css) && /\.day-card>header h3\{grid-column:1 \/ -1;grid-row:2\}/.test(css), '手机日期应独占第二行，为右侧标签保留空间。');
check(!/\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage/.test(app), '本轮不应添加后台写入或未经验证的提交状态存储。');

const cssVersion = html.match(/href="styles\.css\?v=([^"&]+)"/)?.[1];
const appVersion = html.match(/src="app\.js\?v=([^"&]+)"/)?.[1];
check(Boolean(cssVersion) && cssVersion === appVersion, '样式和脚本需使用一致的发布版本参数，避免回访时混入旧缓存。');
const staticChecks = checks;

// Isolated DOM model: exercise our image viewer state machine without a browser
// or network. This deliberately does not claim device/image-decoding coverage.
function viewerModel() {
  let document;
  class Element {
    constructor(id = '') {
      this.id = id; this.handlers = {}; this.dataset = {}; this.attributes = {};
      this.hidden = false; this.disabled = false; this.open = false; this.textContent = '';
      const values = new Set();
      this.classList = {
        add: value => values.add(value), remove: value => values.delete(value),
        contains: value => values.has(value),
        toggle(value) { if (values.has(value)) { values.delete(value); return false; } values.add(value); return true; },
      };
    }
    addEventListener(name, handler) { (this.handlers[name] ||= []).push(handler); }
    emit(name, options = {}) {
      const event = { target: this, defaultPrevented: false, preventDefault() { this.defaultPrevented = true; }, ...options };
      for (const handler of this.handlers[name] || []) handler(event);
      return event;
    }
    setAttribute(name, value) { this.attributes[name] = value; }
    removeAttribute(name) { delete this.attributes[name]; if (name === 'src') { this.complete = false; this.naturalWidth = 0; } }
    querySelector(selector) { return this.children?.[selector] || null; }
    focus() { document.activeElement = this; }
    scrollTo(x, y) { this.scrollLeft = x; this.scrollTop = y; }
    showModal() { this.open = true; }
    close() { this.open = false; this.emit('close'); }
    getBoundingClientRect() { return { left: 10, right: 100, top: 10, bottom: 100 }; }
  }
  const elements = Object.fromEntries(['toast', 'qr-dialog', 'image-dialog', 'guide-full-image', 'image-frame', 'image-status', 'image-original', 'image-title', 'qr-close', 'image-close', 'image-zoom', 'image-retry'].map(id => [id, new Element(id)]));
  elements['qr-dialog'].children = { '[data-qr-close]': elements['qr-close'] };
  elements['image-dialog'].children = { '[data-image-close]': elements['image-close'], '[data-image-zoom]': elements['image-zoom'], '[data-image-retry]': elements['image-retry'] };
  const links = brochureLinks.map(({ attrs: a }) => Object.assign(new Element(), { href: a.href, dataset: { imageTitle: a['data-image-title'] } }));
  const qrLink = new Element();
  document = {
    body: new Element('body'), activeElement: null,
    getElementById: id => elements[id],
    querySelectorAll: selector => ({ '[data-copy]': [], '[data-qr-open]': [qrLink], '[data-image-open]': links })[selector] || [],
  };
  let timerId = 0;
  const timers = new Map();
  const window = {
    setTimeout: (fn, delay) => { const id = ++timerId; timers.set(id, { fn, delay }); return id; },
    clearTimeout: id => timers.delete(id),
  };
  vm.runInNewContext(app, { document, window, navigator: {} }, { filename: 'app.js', timeout: 1000 });
  return { document, elements, links, qrLink, timers };
}
const model = viewerModel();
const { elements: e, links: modelLinks, document: modelDoc, timers } = model;
const imageDialog = e['image-dialog'];
const fullImage = e['guide-full-image'];
check(modelLinks[0].emit('click').defaultPrevented && imageDialog.open, 'DOM 模型：首张指南应在同页弹窗打开。');
check(fullImage.src === 'assets/hotel-transport.jpg' && e['image-original'].href === fullImage.src, 'DOM 模型：弹窗与原图入口应使用同一张 JPG。');
check(e['image-frame'].hidden && !e['image-status'].hidden && e['image-zoom'].disabled, 'DOM 模型：图片未加载时应展示加载状态并禁用放大。');
fullImage.complete = true; fullImage.naturalWidth = 1810; fullImage.emit('load');
check(!e['image-frame'].hidden && e['image-status'].hidden && !e['image-zoom'].disabled && timers.size === 0, 'DOM 模型：加载成功应显示图片、启用放大并清理超时。');
e['image-zoom'].emit('click');
check(e['image-frame'].classList.contains('is-zoomed') && e['image-zoom'].attributes['aria-pressed'] === 'true', 'DOM 模型：放大应同时更新视觉与可访问状态。');
e['image-zoom'].emit('click');
check(!e['image-frame'].classList.contains('is-zoomed') && e['image-zoom'].attributes['aria-pressed'] === 'false', 'DOM 模型：再次点击应适应屏幕。');
e['image-close'].emit('click');
check(!imageDialog.open && !modelDoc.body.classList.contains('modal-open') && modelDoc.activeElement === modelLinks[0], 'DOM 模型：关闭应解除滚动锁并归还触发入口焦点。');
modelLinks[1].emit('click');
check(fullImage.src === 'assets/hotel-nearby.jpg' && e['image-title'].textContent === '酒店周边餐饮与出行指南', 'DOM 模型：第二张图片应替换来源、标题及原图入口。');
fullImage.emit('error');
check(!e['image-retry'].hidden && !e['image-status'].hidden && e['image-frame'].hidden && e['image-zoom'].disabled, 'DOM 模型：加载失败应明确提示并提供重试。');
e['image-retry'].emit('click');
check(fullImage.src === 'assets/hotel-nearby.jpg' && e['image-retry'].hidden && timers.size === 1, 'DOM 模型：重试应保持当前图并重新计时。');
const timeout = [...timers.values()][0];
check(timeout?.delay === 15000, 'DOM 模型：未返回的图片请求应有 15 秒错误提示。');
timeout?.fn();
check(!e['image-retry'].hidden && e['image-status'].textContent.includes('打开 JPG 原图'), 'DOM 模型：超时应提供原图降级而非空白弹窗。');
fullImage.complete = true; fullImage.naturalWidth = 1810; fullImage.emit('load');
check(!e['image-frame'].hidden && e['image-retry'].hidden && !e['image-zoom'].disabled, 'DOM 模型：慢网晚到的成功图片应从超时状态恢复。');
imageDialog.emit('click', { clientX: 0, clientY: 0 });
check(!imageDialog.open && modelDoc.activeElement === modelLinks[1], 'DOM 模型：点击弹窗外部应关闭并归还焦点。');
imageDialog.showModal = undefined;
check(!modelLinks[0].emit('click').defaultPrevented, 'DOM 模型：不支持 dialog 的浏览器不得拦截 JPG 原图链接。');
model.qrLink.emit('click');
check(e['qr-dialog'].open && modelDoc.body.classList.contains('modal-open'), 'DOM 模型：经理二维码原有弹窗仍可打开。');
e['qr-close'].emit('click');
check(!e['qr-dialog'].open && modelDoc.activeElement === model.qrLink && !modelDoc.body.classList.contains('modal-open'), 'DOM 模型：经理二维码关闭仍应释放焦点与滚动。');

if (failures.length) {
  console.error(`FAIL: ${failures.length}/${checks} 项静态验收未通过：\n${failures.map((message, index) => `${index + 1}. ${message}`).join('\n')}`);
  process.exit(1);
}
console.log(`PASS: ${staticChecks} 项静态验收 + ${checks - staticChecks} 项隔离 DOM 模型验收；${surveyLinks.length} 个正式问卷入口；${amapLinks.length} 个高德入口；${images.length} 张图片；${resources.size} 个本地资源。`);
console.log('边界：以上不代表真实微信、二维码识别、地图拉起、飞书提交、图片实际解码或响应式排版已通过；这些由实际浏览器和真机验收确认。');
