export class SoundPlayer {
  static async playBeep(type = 'default') {
    const sounds = {
      default: { freq: 800, duration: 0.1 },
      alert: { freq: 1200, duration: 0.1 },
      confirm: { freq: 600, duration: 0.1 }
    }

    try {
      const { freq, duration } = sounds[type]
      const audioCtx = new (AudioContext || webkitAudioContext)()
      const oscillator = audioCtx.createOscillator()
      const gainNode = audioCtx.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.value = freq
      gainNode.gain.value = 0.1

      oscillator.connect(gainNode)
      gainNode.connect(audioCtx.destination)

      oscillator.start()
      oscillator.stop(audioCtx.currentTime + duration)

      if (audioCtx.state === 'suspended') {
        await audioCtx.resume()
      }
    } catch (e) {
      console.error('Sound playback error:', e)
    }
  }
}
