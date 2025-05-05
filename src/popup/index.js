class PopupController {
  constructor() {
    this.statePort = null

    this.toggle = document.getElementById('toggle')
    this.status = document.getElementById('status')
    this.templateUpload = document.getElementById('template-upload')
    this.templatePreview = document.getElementById('template-preview')
    this.thresholdSlider = document.getElementById('threshold-slider')
    this.thresholdValue = document.getElementById('threshold-value')
    this.settingsBtn = document.getElementById('settings-btn')

    this.init()
  }

  async init() {
    console.log('initialized popup')
    // Load saved state
    const state = await browser.runtime.sendMessage({ type: 'GET_STATE' })
    console.log('state', state)
    this.updateUI(state)

    // Setup state listener
    this.statePort = browser.runtime.connect({ name: 'state-listener' })

    this.statePort.onMessage.addListener(message => {
      console.log('popup: from notify all', message)

      if (message.type === 'STATE_UPDATE') {
        this.updateUI(message.data)
      }
    })

    // Event listeners
    this.toggle.addEventListener('change', this.handleToggle.bind(this))
    this.templateUpload.addEventListener('change', this.handleTemplateUpload.bind(this))
    this.thresholdSlider.addEventListener('input', this.handleThresholdChange.bind(this))
    this.settingsBtn.addEventListener('click', this.openSettings.bind(this))

    // Cleanup
    window.addEventListener('unload', () => {
      this.statePort.disconnect()
    })
  }

  updateUI(state) {
    if (state?.active) {
      this.toggle.checked = state.active
      this.updateStatus(state.active)
    }

    if (state?.threshold) {
      this.thresholdSlider.value = state.threshold
      this.thresholdValue.textContent = state.threshold
    }

    if (state?.template) {
      this.showTemplatePreview(state.template)
    }
  }

  async handleToggle() {
    // In your popup.js or content script:
    // browser.notifications.create({
    //   type: 'basic',
    //   title: 'Your Notification',
    //   message: 'This works in Firefox'
    // })
    console.log('handleToggle')
    const active = this.toggle.checked
    await browser.storage.sync.set({ active })
    await browser.runtime.sendMessage({
      type: 'TOGGLE_STATE',
      active
    })
    this.updateStatus(active)
  }

  async handleTemplateUpload(event) {
    const file = event.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = async e => {
      const imageUrl = e.target.result
      this.showTemplatePreview(imageUrl)

      await browser.storage.sync.set({ template: imageUrl })
      await browser.runtime.sendMessage({
        type: 'UPDATE_TEMPLATE',
        imageUrl
      })
    }
    reader.readAsDataURL(file)
  }

  handleThresholdChange() {
    const threshold = parseFloat(this.thresholdSlider.value).toFixed(2)
    this.thresholdValue.textContent = threshold

    browser.storage.sync.set({ threshold })
    browser.runtime.sendMessage({
      type: 'UPDATE_THRESHOLD',
      threshold
    })
  }

  showTemplatePreview(imageUrl) {
    this.templatePreview.innerHTML = `
      <img src="${imageUrl}" alt="Template Preview">
    `
  }

  updateStatus(active) {
    this.status.textContent = active ? 'ON' : 'OFF'
    this.status.className = active ? 'status-badge active' : 'status-badge inactive'
  }

  openSettings() {
    browser.runtime.openOptionsPage()
  }
}

// new PopupController()

// setTimeout(() => {
new PopupController()
console.log('ssssDelayed initialization complete')
// }, 300)

// function showNotification(message) {
//   const notif = document.createElement('div')
//   notif.className = 'notification'
//   notif.textContent = message
//   document.body.appendChild(notif)
//   setTimeout(() => notif.remove(), 3000)
// }
