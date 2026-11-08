declare const process: {
  argv: string[];
  exitCode?: number;
};

class MockMicrophone {
  private stopped = false;

  constructor(
    private readonly options: {
      sampleRate: number;
      channels: number;
      frameDurationMs: number;
      speechFrames: number;
      silenceFrames: number;
      toneFrequencyHz: number;
    }
  ) {}

  async *start(): AsyncGenerator<{ data: Uint8Array }> {
    const samplesPerFrame = Math.floor(
      (this.options.sampleRate * this.options.frameDurationMs) / 1000
    );
    const frameCount = this.options.speechFrames + this.options.silenceFrames;

    for (let frameIndex = 0; frameIndex < frameCount && !this.stopped; frameIndex++) {
      const data = new Uint8Array(samplesPerFrame * this.options.channels * 2);
      const view = new DataView(data.buffer);
      const isSpeech = frameIndex < this.options.speechFrames;
      const sampleCount = samplesPerFrame * this.options.channels;

      for (let i = 0; i < sampleCount; i++) {
        const sample = isSpeech
          ? Math.sin(
              (2 * Math.PI * this.options.toneFrequencyHz * i) /
                this.options.sampleRate
            ) * 0.5
          : 0;
        view.setInt16(i * 2, Math.round(sample * 32767), true);
      }

      yield { data };
    }
  }

  stop(): void {
    this.stopped = true;
  }
}

class EnergyVad {
  constructor(
    private readonly options: {
      threshold: number;
      silenceDurationMs: number;
    }
  ) {}

  process(frame: { data: Uint8Array }): boolean {
    const sampleCount = Math.floor(frame.data.byteLength / 2);
    if (sampleCount === 0) return false;

    const view = new DataView(
      frame.data.buffer,
      frame.data.byteOffset,
      frame.data.byteLength
    );
    let sumSquares = 0;

    for (let i = 0; i < sampleCount; i++) {
      const sample = view.getInt16(i * 2, true) / 32768;
      sumSquares += sample * sample;
    }

    return Math.sqrt(sumSquares / sampleCount) >= this.options.threshold;
  }
}

class AudioPipeline {
  constructor(
    private readonly microphone: MockMicrophone,
    private readonly vad: EnergyVad
  ) {}

  async *run(): AsyncGenerator<
    | { type: "audio_frame"; frame: { data: Uint8Array } }
    | { type: "speech_start" | "speech_end"; timestampMs: number }
  > {
    const source = this.microphone as unknown as {
      frames?: () => AsyncIterable<{ data: Uint8Array }>;
      readFrames?: () => AsyncIterable<{ data: Uint8Array }>;
      start?: () => AsyncIterable<{ data: Uint8Array }> | void;
      [Symbol.asyncIterator]?: () => AsyncIterator<{ data: Uint8Array }>;
    };

    const started = source.start?.();
    const frames = source.frames?.() ?? source.readFrames?.() ?? started ?? source;
    if (!(Symbol.asyncIterator in Object(frames))) {
      throw new Error("Mock microphone does not provide an async frame stream.");
    }

    let timestampMs = 0;
    let silentMs = 0;
    let speaking = false;
    const frameDurationMs = 20;

    for await (const frame of frames as AsyncIterable<{ data: Uint8Array }>) {
      yield { type: "audio_frame", frame };

      if (this.vad.process(frame)) {
        silentMs = 0;
        if (!speaking) {
          speaking = true;
          yield { type: "speech_start", timestampMs };
        }
      } else if (speaking) {
        silentMs += frameDurationMs;
        if (silentMs >= 100) {
          speaking = false;
          yield { type: "speech_end", timestampMs };
        }
      }

      timestampMs += frameDurationMs;
    }
  }
}

async function main(): Promise<void> {
  const sampleRate = Number(process.argv[2] ?? 16000);

  if (!Number.isInteger(sampleRate) || sampleRate <= 0) {
    console.error("Error: Sample rate must be a positive integer.");
    process.exitCode = 1;
    return;
  }

  console.log("====================================");
  console.log("       AI VOICE CO-PILOT");
  console.log("         AUDIO DEMO");
  console.log("====================================");
  console.log(`Sample Rate: ${sampleRate} Hz`);
  console.log("Audio Format: PCM 16-bit");
  console.log("Channels: Mono");
  console.log("------------------------------------");

  const microphone = new MockMicrophone({
    sampleRate,
    channels: 1,
    frameDurationMs: 20,
    speechFrames: 10,
    silenceFrames: 10,
    toneFrequencyHz: 440,
  });

  const vad = new EnergyVad({
    threshold: 0.02,
    silenceDurationMs: 100,
  });

  const pipeline = new AudioPipeline(microphone, vad);

  let frameCount = 0;

  try {
    console.log("Starting mock microphone...\n");

    for await (const event of pipeline.run()) {
      if (event.type === "audio_frame") {
        frameCount++;

        console.log(
          `Frame ${frameCount}: ${event.frame.data.byteLength} bytes`
        );
      } else {
        console.log(
          `VAD Event: ${event.type} at ${event.timestampMs} ms`
        );
      }
    }

    console.log("\n------------------------------------");
    console.log("Audio processing completed.");
    console.log(`Total frames processed: ${frameCount}`);
    console.log("------------------------------------");
  } catch (error) {
    console.error("Audio pipeline failed:", error);
    process.exitCode = 1;
  } finally {
    microphone.stop();
  }
}

main().catch((error: unknown) => {
  console.error("Unexpected error:", error);
  process.exitCode = 1;
});