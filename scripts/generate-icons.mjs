import { writeFileSync, mkdirSync } from "fs"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import { deflateSync } from "zlib"

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, "../public/icons")
mkdirSync(outDir, { recursive: true })

function drawRgba(size) {
  const data = new Uint8Array(size * size * 4)
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.22
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      const dist = Math.hypot(x - cx, y - cy)
      if (dist <= r) {
        data[i] = 212
        data[i + 1] = 113
        data[i + 2] = 58
        data[i + 3] = 255
      } else {
        data[i] = 14
        data[i + 1] = 12
        data[i + 2] = 10
        data[i + 3] = 255
      }
    }
  }
  return data
}

function crc32(buf) {
  let c = 0xffffffff
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1
  }
  return (c ^ 0xffffffff) >>> 0
}

function chunk(type, data) {
  const len = Buffer.alloc(4)
  len.writeUInt32BE(data.length)
  const t = Buffer.from(type)
  const combined = Buffer.concat([t, data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(combined))
  return Buffer.concat([len, combined, crc])
}

function encodePng(size, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(size, 0)
  ihdr.writeUInt32BE(size, 4)
  ihdr[8] = 8
  ihdr[9] = 6
  const raw = []
  for (let y = 0; y < size; y++) {
    raw.push(0)
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4
      raw.push(rgba[i], rgba[i + 1], rgba[i + 2], rgba[i + 3])
    }
  }
  const idat = deflateSync(Buffer.from(raw))
  return Buffer.concat([
    signature,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ])
}

for (const size of [192, 512]) {
  writeFileSync(join(outDir, `${size}.png`), encodePng(size, drawRgba(size)))
}
console.log("Icons written to public/icons/")
