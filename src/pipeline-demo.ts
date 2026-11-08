import MockMicrophoneModule = require("./audio/mock-microphone");
import AudioProcessorModule = require("./audio/audio-processor");
import VoiceActivityDetectorModule = require("./audio/vad");

const MockMicrophone = MockMicrophoneModule;
const AudioProcessor = AudioProcessorModule;
const VoiceActivityDetector = VoiceActivityDetectorModule;

async function runPipelineDemo(): Promise<void> {
    console.log("====================================");
    console.log("       AI VOICE CO-PILOT");
    console.log("       AUDIO PIPELINE DEMO");
    console.log("====================================");

    const microphone = new MockMicrophone();
    const processor = new AudioProcessor();
    const vad = new VoiceActivityDetector(0.02);

    console.log("\nStarting audio pipeline...\n");

    microphone.start();

    let totalFrames = 0;

    for (let i = 1; i <= 20; i++) {
        const frame = microphone.generateFrame();

        // Frames 4-12 simulate speech; others simulate silence.
        const isSpeech = i >= 4 && i <= 12;

        const view = new DataView(
            frame.data.buffer,
            frame.data.byteOffset,
            frame.data.byteLength
        );

        const samples = frame.data.length / 2;

        for (let j = 0; j < samples; j++) {
            const value = isSpeech
                ? Math.round(
                    10000 * Math.sin(
                        2 * Math.PI * 440 * j / frame.config.sampleRate
                    )
                )
                : 0;

            view.setInt16(j * 2, value, true);
        }

        const result = processor.processFrame(frame);
        const event = vad.detect(result.rms, frame.timestamp);

        totalFrames++;

        console.log(
            `Frame ${frame.id}: RMS=${result.rms.toFixed(4)}`
        );

        if (event) {
            console.log(`VAD Event: ${event.type}`);
        }
    }

    microphone.stop();

    console.log("\n====================================");
    console.log("Audio Pipeline Completed");
    console.log(`Total Frames Processed: ${totalFrames}`);
    console.log("====================================");
}

void runPipelineDemo();