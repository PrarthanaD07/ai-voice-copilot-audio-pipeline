import type { AudioFrame } from "../schemas/audio.schema";

interface ProcessedAudioFrame {
    frameId: number;
    timestamp: number;
    sampleCount: number;
    durationMs: number;
    rms: number;
    peak: number;
}

class AudioProcessor {

    processFrame(frame: AudioFrame): ProcessedAudioFrame {

        if (frame.config.bitDepth !== 16) {
            throw new Error("Only 16-bit PCM audio is supported");
        }

        const channels =
            frame.config.channels === "MONO" ? 1 : 2;

        const bytesPerSample = 2;

        const expectedSamples =
            frame.config.sampleRate *
            frame.config.frameDurationMs / 1000;

        const expectedBytes =
            expectedSamples * channels * bytesPerSample;

        if (frame.data.length !== expectedBytes) {
            throw new Error("Invalid audio frame size");
        }

        const view = new DataView(
            frame.data.buffer,
            frame.data.byteOffset,
            frame.data.byteLength
        );

        let sumSquares = 0;
        let peak = 0;

        const sampleCount = frame.data.length / bytesPerSample;

        for (let i = 0; i < sampleCount; i++) {

            const sample = view.getInt16(i * 2, true);

            const amplitude = sample / 32768;

            sumSquares += amplitude * amplitude;

            peak = Math.max(peak, Math.abs(amplitude));
        }

        const rms = Math.sqrt(sumSquares / sampleCount);

        return {
            frameId: frame.id,
            timestamp: frame.timestamp,
            sampleCount,
            durationMs: frame.config.frameDurationMs,
            rms,
            peak
        };
    }
}

export = AudioProcessor;