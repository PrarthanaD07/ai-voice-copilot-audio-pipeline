# Audio Module – Performance Profiling Report

## 1. Objective
To evaluate the audio processor's performance by measuring frame-processing latency and memory usage during repeated audio processing.

## 2. Test Environment
- Project: AI Voice Co-Pilot
- Runtime: Node.js
- Testing Framework: Vitest
- Audio Format: 16-bit PCM
- Sample Rate: 16,000 Hz
- Channels: Mono
- Frame Duration: 20 ms

## 3. Latency Profiling

**Test:** Processed 10,000 audio frames.

- Total processing time: 25.016 ms
- Average processing latency: 0.002502 ms per frame

## 4. Memory Profiling

**Test:** Processed 100,000 audio frames.

- Memory before processing: 11.24 MB
- Memory after processing: 13.54 MB
- Observed heap increase: 2.30 MB

Note: These are heap snapshots. Garbage collection and temporary allocations may affect the observed memory difference.

## 5. Test Execution

Command used:

`npx.cmd vitest run`

Results:
- Test files passed: 5
- Total tests passed: 16
- Failed tests: 0

## 6. Conclusion

The audio processor successfully processed repeated audio frames with low measured latency. The preliminary memory test showed a 2.30 MB heap increase. All 16 tests passed, indicating that the existing audio processing, VAD, mock microphone, and integration tests are working successfully.

Further long-session stress testing and runtime privacy verification are required.