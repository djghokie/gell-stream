import assert from 'node:assert';

import sampler from '../sampler-enhanced.js';

async function collect($stream, limit = 100) {
	const items = [];

	for (let next = await $stream.next(); !next.done; next = await $stream.next()) {
		if (items.push(next.value) > limit) throw new Error(`more than ${limit} items (runaway stream)`);
	}

	return items;
}

describe('sampler', function() {
	it('emits only real items when the source is shorter than the sample size', async function() {
		const items = await collect(sampler([1, 2].values(), 5));

		assert.deepStrictEqual(items, [1, 2]);
	})

	it('emits nothing for an empty source', async function() {
		const items = await collect(sampler([].values(), 3));

		assert.deepStrictEqual(items, []);
	})

	it('samples falsy items', async function() {
		const items = await collect(sampler([0, false, 3].values(), 2));

		assert.deepStrictEqual(items, [0, false]);
	})

	it('closes the source once the sample size is reached', async function() {
		let closed = false;
		function* source() { try { yield 1; yield 2; yield 3; } finally { closed = true; } }

		const items = await collect(sampler(source(), 1));

		assert.deepStrictEqual(items, [1]);
		assert.strictEqual(closed, true);
	})
})
