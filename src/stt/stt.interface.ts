export interface TranscriptionResult {
    text: string;
    language?: string;
    confidence?: number;
    durationMs?: number;
}

export interface SpeechToText {
    transcribe(audio: Buffer): Promise<TranscriptionResult>;
}