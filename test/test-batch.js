import assert from 'node:assert';

import drain from '../drain.js';
import sampler from '../sampler.js';
import batch from '../batch.js';
import stream from '../stream.js';
import { array as arraySink } from '../sink.js';

/**
 * A sink that groups items into batches and flushes the final, partial batch
 * when the stream closes it (drain and sampler call return on the sink)
 */
function* batchingSink(batches, size) {
	let batch = [];

	try {
		while (true) {
			const item = yield;

			batch.push(item);

			if (batch.length === size) {
				batches.push(batch);
				batch = [];
			}
		}
	} finally {
		if (batch.length) batches.push(batch);
	}
}

describe('batch processing', function() {
	it('drain closes the sink so it can flush a final partial batch', async function() {
		const batches = [];

		await drain([1, 2, 3, 4, 5].values(), batchingSink(batches, 2));

		assert.deepStrictEqual(batches, [[1, 2], [3, 4], [5]]);
	})

	it('sampler closes the sink so it can flush a final partial batch', async function() {
		const batches = [];

		await sampler([1, 2, 3, 4, 5].values(), batchingSink(batches, 2), 3);

		assert.deepStrictEqual(batches, [[1, 2], [3]]);
	})
})


async function collect($stream, limit = 100) {
	const items = [];

	for (let next = await $stream.next(); !next.done; next = await $stream.next()) {
		if (items.push(next.value) > limit) throw new Error(`more than ${limit} items (runaway stream)`);
	}

	return items;
}

describe('batch operator', function() {
	it('groups items into arrays of the given size', async function() {
		assert.deepStrictEqual(await collect(batch([1, 2, 3, 4].values(), 2)), [[1, 2], [3, 4]]);
	})

	it('emits a final partial batch', async function() {
		assert.deepStrictEqual(await collect(batch([1, 2, 3, 4, 5].values(), 2)), [[1, 2], [3, 4], [5]]);
	})

	it('emits nothing for an empty source', async function() {
		assert.deepStrictEqual(await collect(batch([].values(), 3)), []);
	})

	it('batches falsy items', async function() {
		assert.deepStrictEqual(await collect(batch([0, false, null].values(), 2)), [[0, false], [null]]);
	})

	it('closes the source when the consumer stops early', async function() {
		let closed = false;
		function* source() { try { yield 1; yield 2; yield 3; } finally { closed = true; } }

		const $batched = batch(source(), 1);
		await $batched.next();
		await $batched.return();

		assert.strictEqual(closed, true);
	})

	for (const size of [0, -1, 1.5, '2']) {
		it(`rejects a batch size of ${JSON.stringify(size)}`, async function() {
			await assert.rejects(batch([1].values(), size).next(), /size must be a positive integer/);
		})
	}

	it('batches within a stream chain', async function() {
		const items = [];

		await stream([1, 2, 3].values()).batch(2).sink(arraySink(items));

		assert.deepStrictEqual(items, [[1, 2], [3]]);
	})
})
