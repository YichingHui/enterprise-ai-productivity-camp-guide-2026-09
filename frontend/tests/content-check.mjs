import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

if (failures.length) {
  console.error(`FAIL: ${failures.length}/${checks} 项静态验收未通过：\n${failures.map((message, index) => `${index + 1}. ${message}`).join('\n')}`);
  process.exit(1);
}
console.log(`PASS: ${checks} 项静态验收；${surveyLinks.length} 个正式问卷入口；${amapLinks.length} 个高德入口；${images.length} 张图片；${resources.size} 个本地资源。`);
console.log('边界：以上不代表真实微信、二维码识别、地图拉起、飞书提交或动态交互已通过；这些由实际浏览器验收确认。');
