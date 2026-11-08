import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi
} from "vitest";

let MockMicrophone: any;
let AudioProcessor: any;
let VoiceActivityDetector: any;

let microphone: any;
let processor: any;
let detector: any;

describe("Audio Pipeline Integration Test", () => {

    beforeEach(async () => {
        const micModule = await import("../src/audio/mock-microphone.js");
        const processorModule = await import("../src/audio/audio-processor.js");
        const vadModule = await import("../src/audio/vad.js");

        MockMicrophone = micModule.default;
        AudioProcessor = processorModule.default;
        VoiceActivityDetector = vadModule.default;

        microphone = new MockMicrophone();
        processor = new AudioProcessor();
        detector = new VoiceActivityDetector(0.02);

        vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(() => {
        microphone?.stop();
        vi.restoreAllMocks();
    });

    it("should process audio and detect speech start and end", () => {

        // Start microphone
        microphone.start();

        // Generate speech frame
        const speechFrame = microphone.generateFrame();

        // Simulate speech audio
        const view = new DataView(
            speechFrame.data.buffer,
            speechFrame.data.byteOffset,
            speechFrame.data.byteLength
        );

        for (let i = 0; i < speechFrame.data.length / 2; i++) {
            view.setInt16(i * 2, 10000, true);
        }

        // Process speech frame
        const processedSpeech = processor.processFrame(speechFrame);

        // Detect speech start
        const speechStart = detector.detect(
            processedSpeech.rms,
            speechFrame.timestamp
        );

        expect(speechStart?.type).toBe("speech_start");

        // Generate silence frame
        const silenceFrame = microphone.generateFrame();

        // Process silence frame
        const processedSilence = processor.processFrame(silenceFrame);

        // Detect speech end
        const speechEnd = detector.detect(
            processedSilence.rms,
            silenceFrame.timestamp
        );

        expect(speechEnd?.type).toBe("speech_end");
    });

});