import cv from '@techstark/opencv-js'
import { SoundPlayer } from '../lib/sound'
import { loadImage, processBase64Image } from '../utils'

export class TemplateMatcher {
  constructor() {
    this.cv = cv
    this.templateImage = null
    this.currentThreshold = 0.8
    this.matchInterval = null
  }

  async init() {
    // Initialize with saved state
    const { threshold, template } = await browser.runtime.sendMessage({
      type: 'GET_STATE'
    })

    this.currentThreshold = threshold
    if (template) {
      this.templateImage = await loadImage(template)
    }
  }

  async match() {
    if (!this.templateImage) return null

    try {
      const canvas = await this.captureVisibleTab()
      if (!canvas) return null

      const src = this.cv.imread(canvas)
      const dst = new this.cv.Mat()
      const templateImageCanvas = this.templateImage
      const template = this.cv.imread(templateImageCanvas)

      // Perform template matching
      this.cv.matchTemplate(src, template, dst, this.cv.TM_CCOEFF_NORMED)
      const result = this.cv.minMaxLoc(dst)

      // Cleanup
      src.delete()
      dst.delete()
      template.delete()

      return {
        match: result.maxVal >= this.currentThreshold,
        confidence: result.maxVal,
        location: result.maxLoc,
        timestamp: Date.now()
      }
    } catch (error) {
      console.error('Matching error:', error)
      return null
    }
  }

  async captureVisibleTab() {
    // console.log('captureVisibleTab')
    return new Promise(async (resolve, reject) => {
      const response = await browser.runtime.sendMessage({ type: 'CAPTURE_TAB' })

      if (response === true || browser.runtime.lastError) {
        console.error(
          'Error al capturar:',
          browser.runtime.lastError?.message || 'Respuesta inválida'
        )
        reject(null)
      } else {
        const canvas = await processBase64Image(response)
        if (canvas) {
          resolve(canvas)
        } else {
          reject(null)
        }
      }
    })
  }

  startMatching(interval = 300) {
    this.matchInterval = setInterval(async () => {
      const result = await this.match()
      if (result?.match) {
        document.title = String(result.confidence)
        // await SoundPlayer.playBeep('confirm')

        browser.runtime.sendMessage({
          type: 'MATCH_FOUND',
          data: result
        })
      }
    }, interval)
  }

  stopMatching() {
    clearInterval(this.matchInterval)
    this.matchInterval = null
  }

  updateThreshold(threshold) {
    this.currentThreshold = threshold
  }

  async updateTemplate(imageUrl) {
    this.templateImage = await loadImage(imageUrl)
  }
}
