import sharp from 'sharp'

async function main() {
  const { data, info } = await sharp('IMG-20260624-WA0001.jpg')
    .raw()
    .toBuffer({ resolveWithObject: true })

  const { width, height, channels } = info

  // Check 4 corners
  const corners = [
    [0, 0], [width - 1, 0],
    [0, height - 1], [width - 1, height - 1],
  ]
  console.log('Corner pixels:')
  for (const [x, y] of corners) {
    const off = (y * width + x) * channels
    console.log(`  (${x},${y}): rgb(${data[off]},${data[off + 1]},${data[off + 2]})`)
  }

  // Edge scan - find most common color along border
  const freq = {}
  function add(r, g, b) {
    const rounded = `${Math.round(r / 15) * 15},${Math.round(g / 15) * 15},${Math.round(b / 15) * 15}`
    freq[rounded] = (freq[rounded] || 0) + 1
  }
  for (let x = 0; x < width; x++) {
    const offTop = x * channels
    const offBot = ((height - 1) * width + x) * channels
    add(data[offTop], data[offTop + 1], data[offTop + 2])
    add(data[offBot], data[offBot + 1], data[offBot + 2])
  }
  for (let y = 0; y < height; y++) {
    const offLeft = y * width * channels
    const offRight = (y * width + width - 1) * channels
    add(data[offLeft], data[offLeft + 1], data[offLeft + 2])
    add(data[offRight], data[offRight + 1], data[offRight + 2])
  }

  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1])
  console.log('\nTop 5 edge colors (most common):')
  for (const [color, count] of sorted.slice(0, 5)) {
    console.log(`  rgb(${color}) — ${count} pixels`)
  }
}

main().catch(console.error)
