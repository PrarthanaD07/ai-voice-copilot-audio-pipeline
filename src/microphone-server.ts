import "dotenv/config";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import AudioProcessor = require("./audio/audio-processor");
import VoiceActivityDetector = require("./audio/vad");

import type { AudioFrame, AudioConfig } from "./schemas/audio.schema";
import { OpenAISTT } from "./stt/openai-stt";

const PORT = 3000;

const audioConfig: AudioConfig = {
    sampleRate: 16000,
    format: "PCM_16BIT",
    channels: "MONO",
    bitDepth: 16,
    frameDurationMs: 20,
};

const processor = new AudioProcessor();
const vad = new VoiceActivityDetector(0.02);

const stt = new OpenAISTT();

let speechBuffer: Buffer[] = [];
let isSpeaking = false;

const FRAME_SIZE = 640; // 20 ms of 16 kHz mono PCM16 audio

// Convert raw PCM audio into WAV format
function createWavBuffer(pcmData: Buffer): Buffer {
    const header = Buffer.alloc(44);

    header.write("RIFF", 0);
    header.writeUInt32LE(36 + pcmData.length, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(1, 22);
    header.writeUInt32LE(16000, 24);
    header.writeUInt32LE(32000, 28);
    header.writeUInt16LE(2, 32);
    header.writeUInt16LE(16, 34);
    header.write("data", 36);
    header.writeUInt32LE(pcmData.length, 40);

    return Buffer.concat([header, pcmData]);
}

const server = createServer(async (req, res) => {
    try {
        // Serve the microphone webpage
        if (req.method === "GET" && req.url === "/") {
            const html = await readFile(
                join(process.cwd(), "public", "index.html")
            );

            res.writeHead(200, {
                "Content-Type": "text/html",
            });

            res.end(html);
            return;
        }

        // Receive microphone audio
        if (req.method === "POST" && req.url === "/audio") {
            const chunks: Buffer[] = [];

            for await (const chunk of req) {
                chunks.push(Buffer.from(chunk));
            }

            const audioBuffer = Buffer.concat(chunks);

            if (
                audioBuffer.length === 0 ||
                audioBuffer.length % FRAME_SIZE !== 0
            ) {
                res.writeHead(400);
                res.end("Invalid audio batch size");
                return;
            }

            // Process audio in 20 ms frames
            for (
                let offset = 0;
                offset < audioBuffer.length;
                offset += FRAME_SIZE
            ) {
                const frameData = new Uint8Array(
                    audioBuffer.subarray(offset, offset + FRAME_SIZE)
                );

                const frame: AudioFrame = {
                    id: Date.now() + offset,
                    timestamp: Date.now(),
                    data: frameData,
                    config: audioConfig,
                };

                // Audio processing
                const result = processor.processFrame(frame);

                // Voice activity detection
                const event = vad.detect(result.rms, result.timestamp);

                // Handle speech events
                if (event !== null) {
                    if (event.type === "speech_start") {
                        console.log("Speech started!");

                        isSpeaking = true;
                        speechBuffer = [];
                    }

                    if (event.type === "speech_end") {
                        console.log("Speech ended!");

                        isSpeaking = false;

                        const pcmAudio = Buffer.concat(speechBuffer);
                        speechBuffer = [];

                        if (pcmAudio.length > 0) {
                            const wavAudio = createWavBuffer(pcmAudio);

                            stt.transcribe(wavAudio)
                                .then((result) => {
                                    console.log(
                                        "TRANSCRIPTION:",
                                        result.text
                                    );
                                })
                                .catch((error) => {
                                    console.error(
                                        "Transcription error:",
                                        error.message
                                    );
                                });
                        }
                    }
                }

                // Collect audio while speech is active
                if (isSpeaking) {
                    speechBuffer.push(Buffer.from(frameData));
                }

                // Log audio metrics
                console.log(
                    `Frame: ${frame.id} | RMS: ${result.rms.toFixed(4)} | Peak: ${result.peak.toFixed(4)}`
                );

                // Log speech events
                if (event !== null) {
                    console.log(
                        "VAD EVENT:",
                        event.type,
                        event.timestamp
                    );
                }
            }

            res.writeHead(200, {
                "Content-Type": "text/plain",
            });

            res.end("Audio received and processed");
            return;
        }

        // Unknown routes
        res.writeHead(404);
        res.end("Not found");

    } catch (error) {
        console.error("Server error:", error);

        if (!res.headersSent) {
            res.writeHead(500);
        }

        res.end("Internal server error");
    }
});

server.listen(PORT, () => {
    console.log("==================================");
    console.log("AI Voice Co-Pilot Microphone Server");
    console.log(`Open: http://localhost:${PORT}`);
    console.log("==================================");
});