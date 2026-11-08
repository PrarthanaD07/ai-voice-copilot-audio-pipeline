export type AudioFormat = "PCM_16BIT";

// Supported audio channels
export type AudioChannel = "MONO" | "STEREO";

// Audio configuration
export interface AudioConfig {
    sampleRate: number;
    format: AudioFormat;
    channels: AudioChannel;
    bitDepth: number;
    frameDurationMs: number;
}

// Audio frame structure
export interface AudioFrame {
    id: number;
    timestamp: number;
    data: Uint8Array;
    config: AudioConfig;
}

// Microphone event types
export type MicrophoneEventType =
    | "microphone_started"
    | "microphone_stopped"
    | "audio_frame_received"
    | "microphone_error";

// Microphone event
export interface MicrophoneEvent {
    type: MicrophoneEventType;
    timestamp: number;
    message?: string;
}

// Voice Activity Detection event types
export type VADEventType =
    | "speech_start"
    | "speech_end";

// VAD event structure
export interface VADEvent {
    type: VADEventType;
    timestamp: number;
}

// Audio pipeline status
export type AudioPipelineStatus =
    | "IDLE"
    | "INITIALIZING"
    | "RUNNING"
    | "STOPPED"
    | "ERROR";

// Default audio configuration
const DEFAULT_AUDIO_CONFIG: AudioConfig = {
    sampleRate: 16000,
    format: "PCM_16BIT",
    channels: "MONO",
    bitDepth: 16,
    frameDurationMs: 20
};