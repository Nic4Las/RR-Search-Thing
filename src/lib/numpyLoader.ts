import fetch from 'cross-fetch';

interface NpyDtype {
	name: string;
	size: number;
	arrayConstructor: new (buffer: ArrayBuffer, byteOffset?: number, length?: number) => ArrayBufferView;
	converter?: (arr: any) => any;
}

interface NpyResult {
	dtype: string;
	data: ArrayBufferView;
	shape: number[];
	fortranOrder: boolean;
}

interface NpyjsOptions {
	convertFloat16?: boolean;
}

interface FetchProgressCallback {
	(loaded: number, total: number): void;
}

interface ExtendedFetchArgs extends RequestInit {
	onProgress?: FetchProgressCallback;
}

class npyjs {
	private convertFloat16: boolean;
	private dtypes: Record<string, NpyDtype>;

	constructor(opts?: NpyjsOptions) {
		if (opts && !('convertFloat16' in opts)) {
			console.warn([
				"npyjs constructor now accepts {convertFloat16?: boolean}.",
				"For usage, go to https://github.com/jhuapl-boss/npyjs."
			].join(" "));
		}

		this.convertFloat16 = opts?.convertFloat16 ?? true;

		this.dtypes = {
			"<u1": {
				name: "uint8",
				size: 8,
				arrayConstructor: Uint8Array,
			},
			"|u1": {
				name: "uint8",
				size: 8,
				arrayConstructor: Uint8Array,
			},
			"<u2": {
				name: "uint16",
				size: 16,
				arrayConstructor: Uint16Array,
			},
			"|i1": {
				name: "int8",
				size: 8,
				arrayConstructor: Int8Array,
			},
			"<i2": {
				name: "int16",
				size: 16,
				arrayConstructor: Int16Array,
			},
			"<u4": {
				name: "uint32",
				size: 32,
				arrayConstructor: Uint32Array,
			},
			"<i4": {
				name: "int32",
				size: 32,
				arrayConstructor: Int32Array,
			},
			"<u8": {
				name: "uint64",
				size: 64,
				arrayConstructor: BigUint64Array,
			},
			"<i8": {
				name: "int64",
				size: 64,
				arrayConstructor: BigInt64Array,
			},
			"<f4": {
				name: "float32",
				size: 32,
				arrayConstructor: Float32Array
			},
			"<f8": {
				name: "float64",
				size: 64,
				arrayConstructor: Float64Array
			},
			"<f2": {
				name: "float16",
				size: 16,
				arrayConstructor: Uint16Array,
				converter: this.convertFloat16 ? this.float16ToFloat32Array : undefined
			},
		};
	}

	private float16ToFloat32Array(float16Array: Uint16Array): Float32Array {
		const length = float16Array.length;
		const float32Array = new Float32Array(length);

		for (let i = 0; i < length; i++) {
			float32Array[i] = npyjs.float16ToFloat32(float16Array[i]);
		}

		return float32Array;
	}

	static float16ToFloat32(float16: number): number {
		// Extract the parts of the float16
		const sign = (float16 >> 15) & 0x1;
		const exponent = (float16 >> 10) & 0x1f;
		const fraction = float16 & 0x3ff;

		// Handle special cases
		if (exponent === 0) {
			if (fraction === 0) {
				// Zero
				return sign ? -0 : 0;
			}
			// Denormalized number
			return (sign ? -1 : 1) * Math.pow(2, -14) * (fraction / 0x400);
		} else if (exponent === 0x1f) {
			if (fraction === 0) {
				// Infinity
				return sign ? -Infinity : Infinity;
			}
			// NaN
			return NaN;
		}

		// Normalized number
		return (sign ? -1 : 1) * Math.pow(2, exponent - 15) * (1 + fraction / 0x400);
	}

	parse(arrayBufferContents: ArrayBuffer): NpyResult | null {
		// const version = arrayBufferContents.slice(6, 8); // Uint8-encoded
		const headerLength = new DataView(arrayBufferContents.slice(8, 10)).getUint8(0);
		const offsetBytes = 10 + headerLength;

		const hcontents = new TextDecoder("utf-8").decode(
			new Uint8Array(arrayBufferContents.slice(10, 10 + headerLength))
		);
		const header = JSON.parse(
			hcontents
				.toLowerCase() // True -> true
				.replace(/'/g, '"')
				.replace("(", "[")
				.replace(/,*\),*/g, "]")
		);
		const shape = header.shape as number[];
		const dtype = this.dtypes[header.descr];

		if (!dtype) {
			console.error(`Unsupported dtype: ${header.descr}`);
			return null;
		}

		const nums = new dtype.arrayConstructor(
			arrayBufferContents,
			offsetBytes
		);

		// Convert float16 to float32 if converter exists
		const data = dtype.converter ? dtype.converter.call(this, nums) : nums;

		return {
			dtype: dtype.name,
			data,
			shape,
			fortranOrder: header.fortran_order
		};
	}

	async load(
		filename: string | ArrayBuffer,
		fetchArgs?: ExtendedFetchArgs
	): Promise<NpyResult | null | any> {
		/*
		Loads an array from a stream of bytes.
		*/
		fetchArgs = fetchArgs || {};
		let arrayBuf: ArrayBuffer;

		// If filename is ArrayBuffer
		if (filename instanceof ArrayBuffer) {
			arrayBuf = filename;
		}
		// If filename is a file path
		else {
			const { onProgress, ...restFetchArgs } = fetchArgs;

			if (onProgress) {
				const response = await fetch(filename, { ...restFetchArgs });
				const contentLength = response.headers.get('content-length');
				const total = contentLength ? parseInt(contentLength, 10) : 0;
				const reader = response.body?.getReader();

				if (!reader) {
					throw new Error("Failed to get reader from response");
				}

				let receivedLength = 0;
				const chunks: Uint8Array[] = [];

				while (true) {
					const { done, value } = await reader.read();

					if (done) {
						break;
					}

					chunks.push(value);
					receivedLength += value.length;

					if (total) {
						onProgress(receivedLength, total);
					}
				}

				// Concatenate chunks into a single Uint8Array
				const chunksAll = new Uint8Array(receivedLength);
				let position = 0;
				for (const chunk of chunks) {
					chunksAll.set(chunk, position);
					position += chunk.length;
				}

				arrayBuf = chunksAll.buffer;
			} else {
				const resp = await fetch(filename, { ...restFetchArgs });
				arrayBuf = await resp.arrayBuffer();
			}
		}

		const result = this.parse(arrayBuf);

		return result;
	}
}

export default npyjs;
