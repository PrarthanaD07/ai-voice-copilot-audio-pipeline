import type { VADEvent } from "../schemas/audio.schema";

class VoiceActivityDetector {

    private speaking: boolean = false;

    private threshold: number;

    constructor(threshold: number = 0.02) {
        this.threshold = threshold;
    }

    detect(rms: number, timestamp: number): VADEvent | null {

        const isSpeech = rms > this.threshold;

        // Detect speech start
        if (isSpeech && !this.speaking) {

            this.speaking = true;

            return {
                type: "speech_start",
                timestamp
            };
        }

        // Detect speech end
        if (!isSpeech && this.speaking) {

            this.speaking = false;

            return {
                type: "speech_end",
                timestamp
            };
        }

        return null;
    }

    reset(): void {
        this.speaking = false;
    }
}

export = VoiceActivityDetector;