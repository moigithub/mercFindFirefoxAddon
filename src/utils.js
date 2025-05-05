export async function loadStaticTemplate(file) {
  // Load image from extension resources
  const response = await fetch(file)
  const blob = await response.blob()
  const dataURL = await new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(blob)
  })

  return dataURL
}

export async function loadImage(url) {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = url
    img.onload = () => resolve(img)
  })
}

export async function processBase64Image(base64Data) {
  try {
    // 验证数据
    if (!base64Data) {
      return null
    }

    // 添加前缀（如果需要）
    const fullBase64 = base64Data.startsWith('data:image')
      ? base64Data
      : `data:image/png;base64,${base64Data}`

    // 加载图像
    const img = await loadImage(fullBase64)

    // 创建canvas
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth || img.width
    canvas.height = img.naturalHeight || img.height

    // 绘制图像
    const ctx = canvas.getContext('2d')
    ctx.drawImage(img, 0, 0)

    return canvas
  } catch (error) {
    console.error('Image processing error:', error)
    return null
  }
}
