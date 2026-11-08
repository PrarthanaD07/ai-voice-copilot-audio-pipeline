import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from "vitest";

let MockMicrophone: new () => {
    start(): void;
    stop(): void;
    generateFrame(): { id: number; data: Uint8Array };
};

describe("MockMicrophone", () => {

    beforeEach(async () => {
        MockMicrophone = (
            await import("../src/audio/mock-microphone.js")
        ).default;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("should throw an error if a frame is generated before starting", () => {
        const microphone = new MockMicrophone();

        expect(() => microphone.generateFrame())
            .toThrow("Microphone is not running");
    });

    it("should start the microphone successfully", () => {
        const microphone = new MockMicrophone();
        const consoleSpy = vi.spyOn(console, "log");

        microphone.start();

        expect(consoleSpy).toHaveBeenCalledWith(
            "Mock microphone started"
        );

        microphone.stop();
    });

    it("should generate an audio frame with the correct size", () => {
        const microphone = new MockMicrophone();

        microphone.start();

        const frame = microphone.generateFrame();

        expect(frame.id).toBe(1);
        expect(frame.data).toBeInstanceOf(Uint8Array);
        expect(frame.data.length).toBe(1764);

        microphone.stop();
    });

    it("should generate frames with increasing IDs", () => {
        const microphone = new MockMicrophone();

        microphone.start();

        const frame1 = microphone.generateFrame();
        const frame2 = microphone.generateFrame();

        expect(frame1.id).toBe(1);
        expect(frame2.id).toBe(2);

        microphone.stop();
    });

});