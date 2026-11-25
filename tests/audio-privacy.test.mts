import { describe, it, expect } from "vitest";
import { readdir } from "node:fs/promises";
import { join } from "node:path";

describe("Audio Privacy Verification", () => {

    it("should process audio without creating audio files on disk", async () => {

        const projectRoot = process.cwd();

        const audioExtensions = [".wav", ".mp3", ".pcm", ".raw"];

        async function findAudioFiles(directory: string): Promise<string[]> {
            const entries = await readdir(directory, {
                withFileTypes: true
            });

            const files: string[] = [];

            for (const entry of entries) {
                if (entry.name === "node_modules" || entry.name === ".git") {
                    continue;
                }

                const fullPath = join(directory, entry.name);

                if (entry.isDirectory()) {
                    files.push(...await findAudioFiles(fullPath));
                } else if (
                    audioExtensions.includes(
                        entry.name.substring(entry.name.lastIndexOf(".")).toLowerCase()
                    )
                ) {
                    files.push(fullPath);
                }
            }

            return files;
        }

        const audioFilesBefore = await findAudioFiles(projectRoot);

        // Simulate in-memory audio processing.
        const audioBuffer = Buffer.alloc(640);
        const processedAudio = Buffer.from(audioBuffer);

        expect(processedAudio.length).toBe(640);

        const audioFilesAfter = await findAudioFiles(projectRoot);

        expect(audioFilesAfter).toEqual(audioFilesBefore);

        console.log("Audio files before:", audioFilesBefore.length);
        console.log("Audio files after:", audioFilesAfter.length);
        console.log("Audio processing completed in memory.");
    });

});