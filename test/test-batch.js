import assert from 'node:assert';

import drain from '../drain.js';
import sampler from '../sampler.js';

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
