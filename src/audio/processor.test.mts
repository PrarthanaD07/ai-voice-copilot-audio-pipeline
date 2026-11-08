import {
describe,
expect,
it,
beforeEach
} from "vitest";

let AudioProcessor: new () => {
processFrame(frame: any): any;
};

describe("AudioProcessor", () => {


beforeEach(async () => {
    const module = await import("./audio-processor.js");
    AudioProcessor = module.default;
});

const config = {
    sampleRate: 16000,
    format: "PCM_16BIT",
    channels: "MONO",
    bitDepth: 16,
    frameDurationMs: 20
};

function createFrame(
    data = new Uint8Array(640),
    customConfig = config
) {
    return {
        id: 1,
        timestamp: 123456,
        data,
        config: customConfig
    };
}

it("should process a valid audio frame", () => {
    const processor = new AudioProcessor();

    const result = processor.processFrame(createFrame());

    expect(result.frameId).toBe(1);
    expect(result.sampleCount).toBe(320);
    expect(result.durationMs).toBe(20);
    expect(result.rms).toBe(0);
    expect(result.peak).toBe(0);
});

it("should calculate RMS and peak correctly", () => {
    const processor = new AudioProcessor();

    const data = new Uint8Array(640);
    const view = new DataView(data.buffer);

    view.setInt16(0, 16384, true);
    view.setInt16(2, -32768, true);

    const result = processor.processFrame(createFrame(data));

    expect(result.peak).toBe(1);
    expect(result.rms).toBeCloseTo(Math.sqrt(1.25 / 320));
});

it("should reject audio formats other than 16-bit", () => {
    const processor = new AudioProcessor();

    const invalidConfig = {
        ...config,
        bitDepth: 8
    };

    expect(() =>
        processor.processFrame(
            createFrame(new Uint8Array(640), invalidConfig)
        )
    ).toThrow("Only 16-bit PCM audio is supported");
});

it("should reject audio frames with an invalid size", () => {
    const processor = new AudioProcessor();

    expect(() =>
        processor.processFrame(
            createFrame(new Uint8Array(100))
        )
    ).toThrow("Invalid audio frame size");
});


});
