import OpenAI from "openai";
import type { SpeechToText, TranscriptionResult } from "./stt.interface.js";

export class OpenAISTT implements SpeechToText {
    private client: OpenAI;

    constructor(apiKey?: string) {
        this.client = new OpenAI({
            apiKey: apiKey ?? process.env.OPENAI_API_KEY,
        });
    }

    async transcribe(audio: Buffer): Promise<TranscriptionResult> {
        if (audio.length === 0) {
            throw new Error("Audio buffer is empty.");
        }

        const file = new File(
            [new Uint8Array(audio)],
            "speech.wav",
            { type: "audio/wav" }
        );

        const result = await this.client.audio.transcriptions.create({
            file,
            model: "gpt-4o-mini-transcribe",
            response_format: "json",
        });

        return {
            text: result.text,
        };
    }
}