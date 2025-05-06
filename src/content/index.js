import { TemplateMatcher } from './template-matcher'

class ContentController {
  constructor() {
    this.matcher = new TemplateMatcher()
    this.statePort = null
    this.init()
  }

  async init() {
    await this.matcher.init()

    // Establish persistent connection
    this.statePort = browser.runtime.connect({ name: 'state-listener' })

    // Listen for state changes
    this.statePort.onMessage.addListener(message => {
      if (message.type === 'STATE_UPDATE') {
        this.handleStateUpdate(message.data)
      }
    })

    // Cleanup
    window.addEventListener('unload', () => {
      this.statePort.disconnect()
    })
  }

  handleStateUpdate({ active, threshold, template }) {
    if (active !== undefined && active !== this.matcher.isActive) {
      active ? this.startMonitoring() : this.stopMonitoring()
    }

    if (threshold !== undefined) {
      this.matcher.updateThreshold(threshold)
    }

    if (template !== undefined) {
      this.matcher.updateTemplate(template)
    }
  }

  startMonitoring() {
    this.matcher.startMatching()
  }

  stopMonitoring() {
    this.matcher.stopMatching()
  }
}

new ContentController()
