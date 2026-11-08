import type {
    AudioConfig,
    AudioFrame,
    MicrophoneEvent
} from "../schemas/audio.schema";

class MockMicrophone {
    private config: AudioConfig;
    private frameId = 0;
    private running = false;

    constructor(
        config: AudioConfig = {
            sampleRate: 44100,
            frameDurationMs: 20,
            bitDepth: 16,
            channels: "MONO",
            format: "PCM_16BIT"
        }
    ) {
        this.config = config;
    }

    start(): void {
        if (this.running) return;

        this.running = true;
        console.log("Mock microphone started");

        this.emitEvent({
            type: "microphone_started",
            timestamp: Date.now()
        });
    }

    generateFrame(): AudioFrame {
        if (!this.running) {
            throw new Error("Microphone is not running");
        }

        const samplesPerFrame =
            this.config.sampleRate *
            (this.config.frameDurationMs / 1000);

        const bytesPerSample = this.config.bitDepth / 8;

        const channels =
            this.config.channels === "MONO" ? 1 : 2;

        const frameSize =
            samplesPerFrame * bytesPerSample * channels;

        return {
            id: ++this.frameId,
            timestamp: Date.now(),
            data: new Uint8Array(frameSize),
            config: this.config
        };
    }

    stop(): void {
        if (!this.running) return;

        this.running = false;
        console.log("Mock microphone stopped");

        this.emitEvent({
            type: "microphone_stopped",
            timestamp: Date.now()
        });
    }

    private emitEvent(event: MicrophoneEvent): void {
        console.log(
            "Microphone Event:",
            event.type,
            event.timestamp
        );
    }
}

export = MockMicrophone;