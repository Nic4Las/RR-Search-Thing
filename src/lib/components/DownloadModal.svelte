<script lang="ts">
	import npyjs from "$lib/numpyLoader";
	import { AlertCircle, Database, FileAxis3d } from "@lucide/svelte";
	import { onMount } from "svelte";
	import dataUrl from "../../assets/data_cleaned_deduped_index.json?url";
	import embeddingsUrl from "../../assets/embeddings_deduped.npy?url";
	import vectorDB from "../../db/embeddings";
	import { novelDB } from "../../db/novels";
	import * as AlertDialog from "./ui/alert-dialog";
	import { Button } from "./ui/button";
	import { Progress } from "./ui/progress";
	import type { ImportProgress } from "$lib/workers/jsonlWorker.worker";
	import JsonWorker from "$lib/workers/jsonlWorker.worker?worker"; 

	export function importNovelsFromJsonl(
		jsonlUrl: string,
		onProgress: (progress: number) => void,
		onComplete: () => void,
		onError: (error: string) => void,
	): () => void {
		const worker = new JsonWorker();

		worker.onmessage = (
			event: MessageEvent<ImportProgress | { error: string }>,
		) => {
			const data = event.data;

			if ("error" in data) {
				onError(data.error);
				worker.terminate();
				return;
			}

			onProgress(data.progress);

			if (data.completed) {
				onComplete();
				worker.terminate();
			}
		};

		worker.postMessage({ url: jsonlUrl });

		// Return a cancel function
		return () => {
			worker.terminate();
		};
	}

	type DownloadItem = {
		name: string;
		size: string;
		progress: number;
		icon: any; // Simplified for Svelte
		completed: boolean;
	};

	let isFirstVisit = $state(true);
	let isOpen = $state(false);
	let downloadStarted = $state(false);
	let downloadItems = $state<DownloadItem[]>([
		{
			name: "Book Database",
			size: "68.2MB",
			progress: 0,
			icon: Database,
			completed: false,
		},
		{
			name: "Similarity Embeddings",
			size: "83.8MB",
			progress: 0,
			icon: FileAxis3d,
			completed: false,
		},
	]);
	let allCompleted = $state(downloadItems.every((item) => item.completed));

	onMount(() => {
		// Check if this is the first visit
		const hasVisited = localStorage.getItem("hasVisitedBooksite");

		if (!hasVisited) {
			isFirstVisit = true;
			isOpen = true;
		} else {
			isFirstVisit = false;
		}
	});

	// Start the download process
	async function startDownloads() {
		console.log("Starting downloads, clearing existing data");
		await novelDB.novels.clear(); // Clear existing data

		importNovelsFromJsonl(
			dataUrl,
			(progress) => {
				downloadItems[0].progress = Math.round(progress * 100);
			},
			() => {
				downloadItems[0].progress = 100;
				downloadItems[0].completed = true;
			},
			(error) => {
				console.error("Error importing novels", error);
			},
		);

		console.log("Database cleared, starting download");
		downloadStarted = true;

		const npy = new npyjs();

		const embeddings = await npy.load(embeddingsUrl, {
			onProgress: (loaded, total) => {
				downloadItems[1].progress = total
					? Math.round((loaded / total) * 100)
					: 0;
			},
		});

		vectorDB.embeddings.add({
			vectors: embeddings,
		});

		downloadItems[1].completed = true;
		localStorage.setItem("hasVisitedBooksite", "true");
	}

	function handleClose() {
		if (allCompleted || !downloadStarted) {
			isOpen = false;
		}
	}

	function skipDownload() {
		// Close the modal without setting localStorage
		// This means the modal will appear again on next visit
		history.back();
	}
</script>

<AlertDialog.Root open={isOpen && isFirstVisit} onOpenChange={handleClose}>
	<AlertDialog.Content class="sm:max-w-md">
		<AlertDialog.Header>
			<AlertDialog.Title class="text-xl"
				>Download Required Data</AlertDialog.Title
			>
			<AlertDialog.Description>
				This book recommendation site uses local similarity search for
				better performance and privacy. This requires downloading
				approximately 120MB of data.
			</AlertDialog.Description>
		</AlertDialog.Header>

		{#if !downloadStarted}
			<div class="py-6 space-y-4">
				<div
					class="flex items-start gap-3 p-3 bg-amber-50 text-amber-800 rounded-md border border-amber-200"
				>
					<AlertCircle class="h-5 w-5 shrink-0 mt-0.5" />
					<div class="text-sm">
						<p class="font-medium">Download Information</p>
						<ul class="list-disc list-inside mt-1 space-y-1">
							<li>Book Database (42MB)</li>
							<li>Similarity Embeddings (78MB)</li>
							<li>One-time download for this device</li>
							<li>Enables offline search capabilities</li>
						</ul>
					</div>
				</div>
			</div>

			<AlertDialog.Footer class="flex flex-col sm:flex-row gap-2">
				<Button variant="outline" onclick={skipDownload}>Cancel</Button>
				<Button onclick={startDownloads}>Start Download</Button>
			</AlertDialog.Footer>
		{:else}
			<div class="space-y-6 py-4">
				{#each downloadItems as item, index (index)}
					<div class="space-y-2">
						<div class="flex justify-between items-center">
							<div class="flex items-center gap-2">
								<item.icon />
								<span class="font-medium">{item.name}</span>
							</div>
							<span class="text-sm text-muted-foreground"
								>{item.size}</span
							>
						</div>

						<div class="space-y-1">
							<Progress value={item.progress} class="h-2" />
							<div
								class="flex justify-between text-xs text-muted-foreground"
							>
								<span>{item.progress}%</span>
								{#if item.completed}
									<span class="text-green-600 font-medium"
										>Complete</span
									>
								{:else}
									<span>Downloading...</span>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>

			<AlertDialog.Footer>
				{#if allCompleted}
					<Button onclick={handleClose}>Continue to Site</Button>
				{:else}
					<Button disabled>Downloading...</Button>
				{/if}
			</AlertDialog.Footer>
		{/if}
	</AlertDialog.Content>
</AlertDialog.Root>
