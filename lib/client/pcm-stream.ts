"use client"

/**
 * Capture microphone audio, resample to 16 kHz mono PCM16, and POST base64 chunks on an interval.
 */

function resampleFloat(
  input: Float32Array,
  inRate: number,
  outRate: number
): Float32Array {
  if (inRate === outRate) {
    return Float32Array.from(input)
  }
  const ratio = inRate / outRate
  const outLen = Math.max(1, Math.floor(input.length / ratio))
  const out = new Float32Array(outLen)
  for (let i = 0; i < outLen; i++) {
    const src = i * ratio
    const i0 = Math.floor(src)
    const i1 = Math.min(i0 + 1, input.length - 1)
    const f = src - i0
    out[i] = input[i0] * (1 - f) + input[i1] * f
  }
  return Float32Array.from(out)
}

function floatTo16BitPCM(float32: Float32Array): Int16Array {
  const out = new Int16Array(float32.length)
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]))
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }
  return out
}

function concatFloat(a: Float32Array, b: Float32Array): Float32Array {
  return new Float32Array([...Array.from(a), ...Array.from(b)])
}

/** Copy AudioBuffer channel data into a plain Float32Array for typing. */
function copyChannelData(input: Float32Array): Float32Array {
  const out = new Float32Array(input.length)
  out.set(input)
  return out
}

/** Copy into a Float32Array backed by a plain ArrayBuffer (TS 5.7 DOM vs buffer typing). */
function normalizeF32(a: Float32Array): Float32Array {
  const buf = new ArrayBuffer(a.length * 4)
  const out = new Float32Array(buf)
  for (let i = 0; i < a.length; i++) out[i] = a[i]!
  return out
}

function pcmToBase64(pcm: Int16Array): string {
  const buf = pcm.buffer.slice(
    pcm.byteOffset,
    pcm.byteOffset + pcm.byteLength
  ) as ArrayBuffer
  let binary = ""
  const bytes = new Uint8Array(buf)
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

const TARGET_RATE = 16000
/** ~2 seconds of audio at 16 kHz mono PCM16 */
const CHUNK_SAMPLES = TARGET_RATE * 2

export interface PcmStreamHandle {
  stop: () => void
}

/**
 * Starts streaming PCM chunks to POST /api/live/chunk.
 * Uses ScriptProcessorNode for broad browser support (hackathon-friendly).
 */
export async function startPcmStreaming(
  sessionId: string,
  options: {
    /** Called when a chunk POST fails */
    onTransportError?: (err: unknown) => void
    /** Return false to pause sending (e.g. user paused) */
    shouldSend?: () => boolean
    /** Server JSON from /api/live/chunk (includes session snapshot) */
    onChunkResponse?: (body: unknown) => void
  } = {}
): Promise<PcmStreamHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
    },
  })

  const audioContext = new AudioContext()
  const source = audioContext.createMediaStreamSource(stream)
  const bufferSize = 4096
  const processor = audioContext.createScriptProcessor(bufferSize, 1, 1)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- DOM Float32Array buffer typing vs TS 5.7
  let accum: any = new Float32Array(0)
  let sending = false

  const flush = async () => {
    if (sending) return
    if (options.shouldSend && !options.shouldSend()) return
    if (accum.length < CHUNK_SAMPLES) return
    const slice = normalizeF32(accum.slice(0, CHUNK_SAMPLES))
    accum = normalizeF32(accum.slice(CHUNK_SAMPLES))
    const pcm = floatTo16BitPCM(slice)
    const audioBase64 = pcmToBase64(pcm)
    sending = true
    try {
      const res = await fetch("/api/live/chunk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, audioBase64 }),
      })
      if (!res.ok) {
        throw new Error(await res.text())
      }
      const body = await res.json()
      options.onChunkResponse?.(body)
    } catch (e) {
      options.onTransportError?.(e)
    } finally {
      sending = false
    }
  }

  processor.onaudioprocess = (ev) => {
    if (options.shouldSend && !options.shouldSend()) return
    const input = copyChannelData(ev.inputBuffer.getChannelData(0))
    const resampled = resampleFloat(input, audioContext.sampleRate, TARGET_RATE)
    accum = normalizeF32(concatFloat(accum, resampled))
    const maxAccum = CHUNK_SAMPLES * 6
    if (accum.length > maxAccum) {
      accum = normalizeF32(accum.slice(accum.length - maxAccum))
    }
    void flush()
  }

  source.connect(processor)
  const mute = audioContext.createGain()
  mute.gain.value = 0
  processor.connect(mute)
  mute.connect(audioContext.destination)

  const stop = () => {
    try {
      processor.disconnect()
      source.disconnect()
    } catch {
      /* ignore */
    }
    stream.getTracks().forEach((t) => t.stop())
    void audioContext.close()
  }

  return { stop }
}
