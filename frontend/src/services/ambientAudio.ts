type AmbientSoundKey =
    | "rain" | "heavy_rain" | "forest" | "waves" | "fire"
    | "cafe" | "wind" | "night" | "river" | "lofi" | "none"

type LayerOptions = {
    color?: "white" | "brown"
    filter?: BiquadFilterType
    frequency?: number
    q?: number
    gain?: number
}

export type AmbientAudioController = {
    play: (sound: string, volume: number) => void
    setVolume: (volume: number) => void
    stop: () => void
    dispose: () => void
}

/**
 * Offline-friendly ambience made with the Web Audio API.
 * No external audio URLs or third-party audio files are required.
 */
export function createAmbientAudioController(): AmbientAudioController {
    let context: AudioContext | null = null
    let masterGain: GainNode | null = null
    let nodes: AudioNode[] = []
    let sources: AudioScheduledSourceNode[] = []

    function getContext(): AudioContext | null {
        if (typeof window === "undefined" || !("AudioContext" in window)) return null
        if (!context) context = new window.AudioContext()
        return context
    }

    function rememberNode<T extends AudioNode>(node: T): T {
        nodes.push(node)
        return node
    }

    function rememberSource<T extends AudioScheduledSourceNode>(source: T): T {
        sources.push(source)
        nodes.push(source)
        return source
    }

    function stop() {
        for (const source of sources) {
            try { source.stop() } catch { /* The source may already have stopped. */ }
        }
        for (const node of nodes) {
            try { node.disconnect() } catch { /* Already disconnected. */ }
        }
        sources = []
        nodes = []
        if (masterGain) {
            try { masterGain.disconnect() } catch { /* Already disconnected. */ }
            masterGain = null
        }
    }

    function createNoiseBuffer(ctx: AudioContext, color: "white" | "brown"): AudioBuffer {
        const length = ctx.sampleRate * 4
        const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
        const data = buffer.getChannelData(0)
        let brown = 0
        for (let i = 0; i < length; i += 1) {
            const white = Math.random() * 2 - 1
            brown = (brown + 0.025 * white) / 1.025
            data[i] = color === "brown" ? brown * 6 : white * 0.7 + brown * 0.5
        }
        return buffer
    }

    function addNoise(ctx: AudioContext, master: GainNode, options: LayerOptions = {}): GainNode {
        const source = rememberSource(ctx.createBufferSource())
        source.buffer = createNoiseBuffer(ctx, options.color ?? "white")
        source.loop = true

        const filter = rememberNode(ctx.createBiquadFilter())
        filter.type = options.filter ?? "lowpass"
        filter.frequency.setValueAtTime(options.frequency ?? 1000, ctx.currentTime)
        filter.Q.setValueAtTime(options.q ?? 0.7, ctx.currentTime)

        const gain = rememberNode(ctx.createGain())
        gain.gain.setValueAtTime(options.gain ?? 0.1, ctx.currentTime)

        source.connect(filter)
        filter.connect(gain)
        gain.connect(master)
        source.start()
        return gain
    }

    function addTone(ctx: AudioContext, master: GainNode, frequency: number, gainValue: number, type: OscillatorType = "sine"): OscillatorNode {
        const oscillator = rememberSource(ctx.createOscillator())
        oscillator.type = type
        oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
        const gain = rememberNode(ctx.createGain())
        gain.gain.setValueAtTime(gainValue, ctx.currentTime)
        oscillator.connect(gain)
        gain.connect(master)
        oscillator.start()
        return oscillator
    }

    function modulateGain(ctx: AudioContext, target: GainNode, rate: number, depth: number) {
        const oscillator = rememberSource(ctx.createOscillator())
        oscillator.type = "sine"
        oscillator.frequency.setValueAtTime(rate, ctx.currentTime)
        const modulationGain = rememberNode(ctx.createGain())
        modulationGain.gain.setValueAtTime(depth, ctx.currentTime)
        oscillator.connect(modulationGain)
        modulationGain.connect(target.gain)
        oscillator.start()
    }

    function play(soundName: string, volume: number) {
        stop()
        if (soundName === "none") return
        const ctx = getContext()
        if (!ctx) return

        const sound = soundName as AmbientSoundKey
        masterGain = rememberNode(ctx.createGain())
        masterGain.gain.setValueAtTime(Math.max(0, Math.min(100, volume)) / 100, ctx.currentTime)
        masterGain.connect(ctx.destination)

        switch (sound) {
            case "rain": {
                addNoise(ctx, masterGain, { filter: "bandpass", frequency: 1900, q: 0.45, gain: 0.17 })
                addNoise(ctx, masterGain, { color: "brown", filter: "lowpass", frequency: 650, gain: 0.09 })
                break
            }
            case "heavy_rain": {
                addNoise(ctx, masterGain, { filter: "lowpass", frequency: 1500, q: 0.5, gain: 0.25 })
                addNoise(ctx, masterGain, { filter: "highpass", frequency: 2100, q: 0.4, gain: 0.08 })
                addNoise(ctx, masterGain, { color: "brown", filter: "lowpass", frequency: 130, gain: 0.07 })
                break
            }
            case "forest": {
                addNoise(ctx, masterGain, { color: "brown", filter: "lowpass", frequency: 780, gain: 0.12 })
                addNoise(ctx, masterGain, { filter: "bandpass", frequency: 1450, q: 0.3, gain: 0.025 })
                addTone(ctx, masterGain, 2600, 0.0018)
                addTone(ctx, masterGain, 3150, 0.0012)
                break
            }
            case "waves": {
                const swell = addNoise(ctx, masterGain, { color: "brown", filter: "lowpass", frequency: 950, gain: 0.15 })
                addNoise(ctx, masterGain, { filter: "lowpass", frequency: 1900, gain: 0.035 })
                modulateGain(ctx, swell, 0.075, 0.075)
                break
            }
            case "fire": {
                addNoise(ctx, masterGain, { color: "brown", filter: "lowpass", frequency: 900, gain: 0.16 })
                addNoise(ctx, masterGain, { filter: "bandpass", frequency: 2400, q: 1.1, gain: 0.045 })
                addNoise(ctx, masterGain, { filter: "highpass", frequency: 4600, gain: 0.008 })
                break
            }
            case "cafe": {
                addNoise(ctx, masterGain, { color: "brown", filter: "lowpass", frequency: 430, gain: 0.15 })
                addNoise(ctx, masterGain, { filter: "bandpass", frequency: 980, q: 0.55, gain: 0.035 })
                addNoise(ctx, masterGain, { filter: "lowpass", frequency: 1800, gain: 0.022 })
                break
            }
            case "wind": {
                const gust = addNoise(ctx, masterGain, { color: "brown", filter: "lowpass", frequency: 360, gain: 0.15 })
                addNoise(ctx, masterGain, { filter: "highpass", frequency: 180, gain: 0.025 })
                modulateGain(ctx, gust, 0.035, 0.08)
                break
            }
            case "night": {
                addNoise(ctx, masterGain, { color: "brown", filter: "lowpass", frequency: 420, gain: 0.06 })
                addNoise(ctx, masterGain, { filter: "highpass", frequency: 3200, q: 0.8, gain: 0.012 })
                addTone(ctx, masterGain, 4200, 0.0015)
                break
            }
            case "river": {
                addNoise(ctx, masterGain, { filter: "lowpass", frequency: 1700, gain: 0.12 })
                addNoise(ctx, masterGain, { filter: "bandpass", frequency: 720, q: 0.45, gain: 0.045 })
                break
            }
            case "lofi": {
                addNoise(ctx, masterGain, { color: "brown", filter: "lowpass", frequency: 420, gain: 0.025 })
                addTone(ctx, masterGain, 110, 0.012, "triangle")
                addTone(ctx, masterGain, 164.81, 0.008, "triangle")
                addTone(ctx, masterGain, 220, 0.005, "sine")
                break
            }
            default:
                stop()
                break
        }

        if (ctx.state === "suspended") {
            void ctx.resume().catch(() => {
                // The browser may require another explicit user interaction.
            })
        }
    }

    function setVolume(volume: number) {
        if (!context || !masterGain) return
        masterGain.gain.setTargetAtTime(Math.max(0, Math.min(100, volume)) / 100, context.currentTime, 0.035)
    }

    function dispose() {
        stop()
        if (context && context.state !== "closed") {
            void context.close().catch(() => undefined)
        }
        context = null
    }

    return { play, setVolume, stop, dispose }
}
