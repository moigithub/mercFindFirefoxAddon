class PopupController {
  constructor() {
    this.statePort = null

    this.toggle = document.getElementById('toggle')
    this.status = document.getElementById('status')
    this.settingsBtn = document.getElementById('settings-btn')

    this.init()
  }

  async init() {
    // Load saved state
    const state = await browser.runtime.sendMessage({ type: 'GET_STATE' })
    this.updateUI(state)

    // Setup state listener
    this.statePort = browser.runtime.connect({ name: 'state-listener' })

    this.statePort.onMessage.addListener(message => {
      if (message.type === 'STATE_UPDATE') {
        this.updateUI(message.data)
      }
    })

    // Event listeners
    this.toggle.addEventListener('change', this.handleToggle.bind(this))
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
  }

  async handleToggle() {
    const active = this.toggle.checked
    await browser.storage.sync.set({ active })
    await browser.runtime.sendMessage({
      type: 'TOGGLE_STATE',
      active
    })
    this.updateStatus(active)
  }

  updateStatus(active) {
    this.status.textContent = active ? 'ON' : 'OFF'
    this.status.className = active ? 'status-badge active' : 'status-badge inactive'
  }

  openSettings() {
    browser.runtime.openOptionsPage()
  }
}

new PopupController()
