import sharp from 'sharp'

const INPUT = process.argv[2] || 'IMG-20260624-WA0001.jpg'
const OUTPUT = process.argv[3] || 'public/logo.png'

async function removeBg() {
  const image = sharp(INPUT)
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true })
  const { width, height, channels } = info

  // Detect if image is mostly grayscale
  let grayCount = 0
  for (let i = 0; i < Math.min(1000, width * height); i++) {
    const off = i * channels
    const r = data[off], g = data[off + 1], b = data[off + 2]
    if (Math.abs(r - g) < 15 && Math.abs(g - b) < 15) grayCount++
  }
  const isGray = grayCount > 800

  // Find background color from edges
  const edgeColors = []
  const stride = Math.max(1, Math.floor(width / 100))
  for (let x = 0; x < width; x += stride) {
    const tOff = x * channels
    const bOff = ((height - 1) * width + x) * channels
    edgeColors.push([data[tOff], data[tOff + 1], data[tOff + 2]])
    edgeColors.push([data[bOff], data[bOff + 1], data[bOff + 2]])
  }
  for (let y = 0; y < height; y += stride) {
    const lOff = y * width * channels
    const rOff = (y * width + width - 1) * channels
    edgeColors.push([data[lOff], data[lOff + 1], data[lOff + 2]])
    edgeColors.push([data[rOff], data[rOff + 1], data[rOff + 2]])
  }

  // Cluster edge colors to find dominant one
  const buckets = new Map()
  for (const [r, g, b] of edgeColors) {
    const key = `${Math.round(r / 10) * 10},${Math.round(g / 10) * 10},${Math.round(b / 10) * 10}`
    buckets.set(key, (buckets.get(key) || 0) + 1)
  }
  const best = [...buckets.entries()].sort((a, b) => b[1] - a[1])[0][0]
  const [bgR, bgG, bgB] = best.split(',').map(Number)

  // For grayscale images, use brightness threshold instead of color distance
  const tolerance = isGray ? 40 : 60

  const out = Buffer.alloc(width * height * 4)

  for (let i = 0; i < width * height; i++) {
    const srcOff = i * channels
    const dstOff = i * 4

    const r = data[srcOff], g = data[srcOff + 1], b = data[srcOff + 2]

    let alpha
    if (isGray) {
      const brightness = (r + g + b) / 3
      const bgBrightness = (bgR + bgG + bgB) / 3
      const diff = Math.abs(brightness - bgBrightness)
      alpha = diff > tolerance ? 255 : 0
    } else {
      const dist = Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2)
      alpha = dist > tolerance ? 255 : 0
    }

    out[dstOff] = r
    out[dstOff + 1] = g
    out[dstOff + 2] = b
    out[dstOff + 3] = alpha
  }

  await sharp(out, { raw: { width, height, channels: 4 } })
    .png()
    .toFile(OUTPUT)

  console.log(`✓ ${OUTPUT} (${isGray ? 'grayscale' : 'color'} mode, bg: rgb(${bgR},${bgG},${bgB}), tolerance: ${tolerance})`)
}

removeBg().catch((err) => { console.error('Error:', err.message); process.exit(1) })
