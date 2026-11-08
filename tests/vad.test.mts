import {
describe,
expect,
it,
beforeEach
} from "vitest";

let VoiceActivityDetector: new (threshold?: number) => {
detect(rms: number, timestamp: number): any;
reset(): void;
};

describe("VoiceActivityDetector", () => {


let detector: InstanceType<typeof VoiceActivityDetector>;

beforeEach(async () => {
    const module = await import("../src/audio/vad.js");
    VoiceActivityDetector = module.default;
    detector = new VoiceActivityDetector(0.02);
});

it("should detect the beginning of speech", () => {
    const result = detector.detect(0.5, 1000);

    expect(result).toEqual({
        type: "speech_start",
        timestamp: 1000
    });
});

it("should detect the end of speech", () => {
    detector.detect(0.5, 1000);

    const result = detector.detect(0, 2000);

    expect(result).toEqual({
        type: "speech_end",
        timestamp: 2000
    });
});

it("should return null when there is no speech", () => {
    const result = detector.detect(0, 1000);

    expect(result).toBeNull();
});

it("should not repeatedly detect speech start", () => {
    detector.detect(0.5, 1000);

    const result = detector.detect(0.6, 2000);

    expect(result).toBeNull();
});

it("should reset speech detection state", () => {
    detector.detect(0.5, 1000);

    detector.reset();

    const result = detector.detect(0.5, 2000);

    expect(result).toEqual({
        type: "speech_start",
        timestamp: 2000
    });
});


});
