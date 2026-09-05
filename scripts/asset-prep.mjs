import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assets = path.join(root, 'frontend/assets');
const require = createRequire(import.meta.url);
const bundledModules = '/Users/songfuxie/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
let sharp;
try {
  sharp = require('sharp');
} catch {
  sharp = require(require.resolve('sharp', { paths: [bundledModules] }));
}

const inputRoot = '/var/folders/88/r708_x4d0yq98zj3tdnkdqpr0000gn/T';
const augustAssets = '/Users/songfuxie/Projects/enterprise-ai-productivity-camp-guide-2026-08/frontend/assets';
const shareUrl = 'https://yichinghui.github.io/enterprise-ai-productivity-camp-guide-2026-09/';
const photos = [
  ['hotel-exterior.webp', 'codex-clipboard-1fb0e6f6-ab24-4b48-8241-1e2e2d33c70e.jpg', '酒店外观'],
  ['hotel-entrance.webp', 'codex-clipboard-1f2a2b07-db69-4f75-a7d3-29bf2daac14e.jpg', '酒店入口'],
  ['room-king.webp', 'codex-clipboard-215fb4c4-0271-4da1-a077-ce6feb1df925.jpg', '大床房'],
  ['room-twin.webp', 'codex-clipboard-41cf74e8-9113-4f08-89cc-93ff0af04796.jpg', '双床房'],
  ['hotel-transport.webp', 'codex-clipboard-7e25435d-cf12-40ac-b68d-8dcd9dab9fe5.jpg', '酒店交通地图'],
  ['hotel-nearby.webp', 'codex-clipboard-4ceca541-8f32-44bc-989a-e0db0c8286bd.jpg', '酒店周边与交通指南'],
];
const copies = [
  ['manager-wechat.jpg', path.join(inputRoot, 'codex-clipboard-cd6a8f87-6d8e-4979-ac45-5a1d85911996.jpg'), '酒店订房经理微信名片'],
  ['logo-blue.png', path.join(augustAssets, 'yixinhui-logo-blue.png'), '意心会白底蓝字Logo'],
  ['lecturer.jpg', path.join(augustAssets, 'lecturer-langgeladi.jpg'), '狼格拉底讲师照片'],
];

await fs.mkdir(assets, { recursive: true });
await fs.mkdir(path.join(root, 'docs'), { recursive: true });
const rows = [];
for (const [name, original, description] of photos) {
  const source = path.join(inputRoot, original);
  const target = path.join(assets, name);
  const isGuide = name.includes('transport') || name.includes('nearby');
  await sharp(source).rotate().resize({ width: 1200, withoutEnlargement: true })
    .webp({ quality: isGuide ? 88 : 82, effort: 6 }).toFile(target);
  rows.push({ name, source, description, sourceMetadata: await sharp(source).metadata(), metadata: await sharp(target).metadata(), bytes: (await fs.stat(target)).size, operation: isGuide ? '保持比例缩放至1200px，WebP质量88，保留交通图原内容' : '保持比例缩放至1200px，WebP质量82' });
}
for (const [name, source, description] of copies) {
  const target = path.join(assets, name);
  await fs.copyFile(source, target);
  const [before, after] = await Promise.all([fs.readFile(source), fs.readFile(target)]);
  if (!before.equals(after)) throw new Error(`原字节复用校验失败：${name}`);
  rows.push({ name, source, description, sourceMetadata: await sharp(source).metadata(), metadata: await sharp(target).metadata(), bytes: after.length, operation: '原字节复制；无裁切、重绘、压缩或配色修改' });
}

// QR uses macOS CoreImage, black on white with a four-module quiet zone.
const sharePath = path.join(root, 'docs/share-qr.png');
const swiftGenerate = `
import Foundation
import CoreImage
import CoreGraphics
import ImageIO
let url = CommandLine.arguments[1]
let output = CommandLine.arguments[2]
let filter = CIFilter(name: "CIQRCodeGenerator")!
filter.setValue(url.data(using: .utf8)!, forKey: "inputMessage")
filter.setValue("Q", forKey: "inputCorrectionLevel")
let code = filter.outputImage!
let moduleSize = 8
let quiet = 4
let w = (Int(code.extent.width) + quiet * 2) * moduleSize
let h = (Int(code.extent.height) + quiet * 2) * moduleSize
let context = CGContext(data: nil, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w * 4, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue)!
context.setFillColor(CGColor(gray: 1, alpha: 1))
context.fill(CGRect(x: 0, y: 0, width: w, height: h))
let cg = CIContext().createCGImage(code, from: code.extent)!
context.interpolationQuality = .none
context.draw(cg, in: CGRect(x: quiet * moduleSize, y: quiet * moduleSize, width: Int(code.extent.width) * moduleSize, height: Int(code.extent.height) * moduleSize))
let dest = CGImageDestinationCreateWithURL(URL(fileURLWithPath: output) as CFURL, "public.png" as CFString, 1, nil)!
CGImageDestinationAddImage(dest, context.makeImage()!, nil)
guard CGImageDestinationFinalize(dest) else { fatalError("Failed to write share QR") }
`;
execFileSync('/usr/bin/swift', ['-e', swiftGenerate, shareUrl, sharePath], { encoding: 'utf8' });

// Do not print or save the manager's embedded WeChat payload.
const swiftVerify = `
import Foundation
import Vision
func decode(_ pathname: String) throws -> [String] {
 let request = VNDetectBarcodesRequest()
 request.symbologies = [.qr]
 try VNImageRequestHandler(url: URL(fileURLWithPath: pathname)).perform([request])
 return (request.results ?? []).compactMap { $0.payloadStringValue }.filter { !$0.isEmpty }
}
let manager = try decode(CommandLine.arguments[1])
let share = try decode(CommandLine.arguments[2])
let answer: [String: Any] = ["managerQRReadable": !manager.isEmpty, "shareQRReadable": !share.isEmpty, "shareQRExactMatch": share.count == 1 && share[0] == CommandLine.arguments[3]]
let data = try JSONSerialization.data(withJSONObject: answer, options: [.sortedKeys])
print(String(data: data, encoding: .utf8)!)
`;
const validation = JSON.parse(execFileSync('/usr/bin/swift', ['-e', swiftVerify, path.join(assets, 'manager-wechat.jpg'), sharePath, shareUrl], { encoding: 'utf8' }));
if (!validation.managerQRReadable || !validation.shareQRReadable || !validation.shareQRExactMatch) throw new Error(`QR validation failed: ${JSON.stringify(validation)}`);
const total = rows.reduce((sum, row) => sum + row.bytes, 0);
console.log(JSON.stringify({ images: rows.map(({ name, metadata, bytes }) => ({ name, width: metadata.width, height: metadata.height, bytes })), totalImageBytes: total, shareQRBytes: (await fs.stat(sharePath)).size, validation }, null, 2));

// Print an audit table for the maintainer. Documentation is edited via apply_patch.
console.log('\nAudit rows:');
for (const row of rows) console.log(`| ${row.name} | ${row.description} | ${row.sourceMetadata.width}×${row.sourceMetadata.height} → ${row.metadata.width}×${row.metadata.height} | ${row.bytes} | ${row.operation} |`);
