import { SoundPlayer } from '../lib/sound'

browser.windows.create({
  url: browser.runtime.getURL('popup.html'),
  type: 'popup',
  width: 400,
  height: 600
})
// console.log('Extension ID:', browser.runtime.id)
// console.log('Popup URL:', browser.runtime.getURL('popup.html'))

const state = {
  active: false,
  threshold: 0.8,
  template: null,
  listeners: new Set()
}

// Persistent connection handler
browser.runtime.onConnect.addListener(port => {
  if (port.name === 'state-listener') {
    const listener = message => {
      if (message.type === 'STATE_UPDATE') {
        port.postMessage({
          type: 'STATE_UPDATE',
          data: {
            active: state.active,
            threshold: state.threshold,
            template: state.template
          }
        })
      }
    }

    state.listeners.add(listener)
    port.onDisconnect.addListener(() => {
      state.listeners.delete(listener)
    })

    // Send initial state immediately
    port.postMessage({
      type: 'STATE_UPDATE',
      data: {
        active: state.active,
        threshold: state.threshold,
        template: state.template
      }
    })
  }
})

// State management
browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  switch (request.type) {
    case 'TOGGLE_STATE':
      state.active = request.active
      await browser.storage.sync.set({ active: state.active })
      notifyAll()
      sendResponse({ success: true })
      break

    case 'GET_STATE':
      sendResponse({
        active: state.active,
        threshold: state.threshold,
        template: state.template
      })
      break

    case 'UPDATE_TEMPLATE':
      state.template = request.imageUrl
      await browser.storage.sync.set({ template: state.template })
      notifyAll()
      sendResponse({ success: true })
      break

    // case 'UPDATE_THRESHOLD':
    //   // console.log('bg: UPDATE_THRESHOLD')
    //   state.threshold = request.threshold
    //   await browser.storage.sync.set({ threshold: state.threshold })
    //   notifyAll()
    //   sendResponse({ success: true })
    //   break

    case 'MATCH_FOUND':
      await SoundPlayer.playBeep('alert')

      sendResponse({ success: true })
      break

    case 'CAPTURE_TAB':
      try {
        const result = await browser.tabs.captureVisibleTab(null, { format: 'png', quality: 100 })

        if (!result || browser.runtime.lastError) {
          console.error('Fallo en captureVisibleTab:', browser.runtime.lastError)
          sendResponse(true) // Indicador de error
        } else {
          sendResponse(result) // Envía el data URL real
          return result
        }
      } catch (error) {
        console.error('Fallo en captureVisibleTab:', error)
        sendResponse(true) // Indicador de error
      }

      break
  }
  return true // Mantiene el puerto abierto para respuesta asíncrona
})

function notifyAll() {
  const stateData = {
    active: state.active,
    threshold: state.threshold,
    template: state.template
  }

  state.listeners.forEach(listener => {
    listener({
      type: 'STATE_UPDATE',
      data: stateData
    })
  })
}

// Persistent storage
browser.storage.sync.get(['active', 'threshold', 'template'], data => {
  if (data.active !== undefined) state.active = data.active
  if (data.threshold !== undefined) state.threshold = data.threshold
  if (data.template !== undefined) state.template = data.template
  notifyAll()
})
