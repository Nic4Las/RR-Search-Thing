// novel-import.worker.ts

import { novelDB, type NovelRaw } from "../../db/novels";

export interface ImportProgress {
    progress: number;
    completed: boolean;
    processedItems: number;
    totalItems?: number;
}

self.onmessage = async (event: MessageEvent<{ url: string }>) => {
    const { url } = event.data;

    try {
        // Fetch the JSONL file
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch JSONL file: ${response.statusText}`);
        }

        if (!response.body) {
            throw new Error('ReadableStream not supported in this browser.');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');

        let buffer = '';
        let processedItems = 0;
        let totalSize: number | undefined;
        let loadedBytes = 0;

        // Get total size if available
        totalSize = parseInt(response.headers.get('Content-Length') || '0', 10);

        // Process the stream
        while (true) {
            const { done, value } = await reader.read();

            if (done) {
                // Process any remaining data in the buffer
                if (buffer.trim()) {
                    await processNovelLine(buffer.trim());
                    processedItems++;
                }
                sendProgressUpdate(1.0, true, processedItems);
                break;
            }

            // Update loaded bytes and progress
            loadedBytes += value.length;
            const progressValue = totalSize ? loadedBytes / totalSize : undefined;

            // Decode the chunk and add to buffer
            buffer += decoder.decode(value, { stream: true });

            // Process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep the last potentially incomplete line in the buffer

            // Process each complete line
            for (const line of lines) {
                if (line.trim()) {
                    await processNovelLine(line.trim());
                    processedItems++;

                    // Send progress update periodically (every 100 items)
                    if (processedItems % 100 === 0) {
                        sendProgressUpdate(progressValue || processedItems / (processedItems + 100), false, processedItems);
                    }
                }
            }
        }
    } catch (error) {
        self.postMessage({
            error: error instanceof Error ? error.message : 'Unknown error',
            completed: false,
            progress: 0
        });
    }
};

async function processNovelLine(line: string): Promise<void> {
    try {
        const rowData: NovelRaw = JSON.parse(line);
        // console.log('Processing novel line:', rowData);
        await novelDB.novels.put({
            ...rowData,
            cover: rowData.cover ?? "",
            tags: rowData.tags ?? [],
            // titleWords: []
            titleWords: [...new Set(rowData.title.toLowerCase().split(/\s+/))],
        });
    } catch (error) {
        console.error('Error processing novel line:', error, line);
        // Continue processing other items even if one fails
    }
}

function sendProgressUpdate(progress: number, completed: boolean, processedItems: number): void {
    const update: ImportProgress = {
        progress: Math.min(1, Math.max(0, progress)), // Ensure progress is between 0 and 1
        completed,
        processedItems
    };
    self.postMessage(update);
}
