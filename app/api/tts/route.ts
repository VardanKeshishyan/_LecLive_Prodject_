import { NextResponse } from "next/server"
import { GoogleGenAI, Modality } from "@google/genai"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set")
  return new GoogleGenAI({ apiKey })
}

/** Convert raw 16-bit PCM (24kHz mono) to WAV so browsers can play it natively. */
function pcmToWav(pcmBase64: string, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): string {
  const pcmBuffer = Buffer.from(pcmBase64, "base64")
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8
  const blockAlign = (numChannels * bitsPerSample) / 8
  const dataSize = pcmBuffer.length
  const headerSize = 44
  const wav = Buffer.alloc(headerSize + dataSize)

  // RIFF header
  wav.write("RIFF", 0)
  wav.writeUInt32LE(36 + dataSize, 4)
  wav.write("WAVE", 8)
  // fmt chunk
  wav.write("fmt ", 12)
  wav.writeUInt32LE(16, 16)          // chunk size
  wav.writeUInt16LE(1, 20)           // PCM format
  wav.writeUInt16LE(numChannels, 22)
  wav.writeUInt32LE(sampleRate, 24)
  wav.writeUInt32LE(byteRate, 28)
  wav.writeUInt16LE(blockAlign, 32)
  wav.writeUInt16LE(bitsPerSample, 34)
  // data chunk
  wav.write("data", 36)
  wav.writeUInt32LE(dataSize, 40)
  pcmBuffer.copy(wav, 44)

  return wav.toString("base64")
}

export async function POST(req: Request) {
  let body: { text?: string; voiceName?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const text = body.text?.trim()
  if (!text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 })
  }

  const truncated = text.slice(0, 4000)
  const voiceName = body.voiceName || "Kore"

  try {
    const ai = getClient()

    const res = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ role: "user", parts: [{ text: truncated }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    })

    const parts = res.candidates?.[0]?.content?.parts
    const audioPart = parts?.find(
      (p: { inlineData?: { data?: string; mimeType?: string } }) => p.inlineData?.data
    )

    if (!audioPart?.inlineData?.data) {
      return NextResponse.json({ error: "No audio returned from TTS model" }, { status: 502 })
    }

    const rawMime = audioPart.inlineData.mimeType ?? ""
    const isRawPcm = rawMime.includes("pcm") || rawMime === "audio/l16" || rawMime === ""

    // Convert raw PCM to WAV so browsers can decode it
    const wavBase64 = isRawPcm
      ? pcmToWav(audioPart.inlineData.data)
      : audioPart.inlineData.data

    return NextResponse.json({
      audioBase64: wavBase64,
      mimeType: "audio/wav",
    })
  } catch (e) {
    console.error("[tts]", e)
    return NextResponse.json({ error: String(e) }, { status: 502 })
  }
}
