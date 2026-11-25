import { describe, it, expect, beforeEach } from "vitest";

let AudioProcessor: new () => {
    processFrame(frame: any): any;
};

describe("Audio Processor Performance Profiling", () => {

    beforeEach(async () => {
        const module = await import("../src/audio/audio-processor.js");
        AudioProcessor = module.default;
    });

    const config = {
        sampleRate: 16000,
        format: "PCM_16BIT" as const,
        channels: "MONO" as const,
        bitDepth: 16 as const,
        frameDurationMs: 20
    };

    const frame = {
        id: 1,
        timestamp: Date.now(),
        data: new Uint8Array(640),
        config
    };

    it("should measure processing latency over 10,000 frames", () => {
        const processor = new AudioProcessor();
        const iterations = 10000;

        const start = performance.now();

        for (let i = 0; i < iterations; i++) {
            processor.processFrame(frame);
        }

        const totalTime = performance.now() - start;
        const averageLatency = totalTime / iterations;

        console.log("\n--- AUDIO LATENCY PROFILE ---");
        console.log("Frames processed:", iterations);
        console.log("Total time:", totalTime.toFixed(3), "ms");
        console.log("Average latency:", averageLatency.toFixed(6), "ms");

        expect(averageLatency).toBeGreaterThan(0);
    });

    it("should measure memory usage during repeated processing", () => {
        const processor = new AudioProcessor();
        const iterations = 100000;

        const memoryBefore = process.memoryUsage().heapUsed;

        for (let i = 0; i < iterations; i++) {
            processor.processFrame(frame);
        }

        const memoryAfter = process.memoryUsage().heapUsed;

        console.log("\n--- AUDIO MEMORY PROFILE ---");
        console.log("Frames processed:", iterations);
        console.log(
            "Memory before:",
            (memoryBefore / 1024 / 1024).toFixed(2),
            "MB"
        );
        console.log(
            "Memory after:",
            (memoryAfter / 1024 / 1024).toFixed(2),
            "MB"
        );

        expect(memoryAfter).toBeGreaterThan(0);
    });
});