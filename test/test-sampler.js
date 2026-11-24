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

describe('sampler modes', function() {
	function* source(n) { for (let i = 1; i <= n; i++) yield i; }

	it('FIRST takes the first n items', async function() {
		assert.deepStrictEqual(await collect(sampler(source(5), 2, 'FIRST')), [1, 2]);
	})

	it('LAST takes the last n items in stream order', async function() {
		assert.deepStrictEqual(await collect(sampler(source(5), 2, 'LAST')), [4, 5]);
	})

	it('LAST takes everything from a source shorter than n', async function() {
		assert.deepStrictEqual(await collect(sampler(source(2), 5, 'LAST')), [1, 2]);
	})

	it('closes the source when sampling fails partway through the stream', async function() {
		let closed = false;
		function* closable() { try { yield 1; yield 2; yield 3; } finally { closed = true; } }
		const failingRandom = () => { throw new Error('random failed'); };

		await assert.rejects(collect(sampler(closable(), 1, 'RANDOM', failingRandom)), /random failed/);

		assert.strictEqual(closed, true);
	})

	it('RANDOM keeps the first n items while the reservoir fills', async function() {
		const items = await collect(sampler(source(3), 3, 'RANDOM', () => 0.99));

		assert.deepStrictEqual(items, [1, 2, 3]);
	})

	it('RANDOM replaces a reservoir slot chosen by the random function', async function() {
		// item 3: slot floor(0.5 * 3) = 1 -> replaces 2; item 4: floor(0 * 4) = 0 -> replaces 1
		const randoms = [0.5, 0];
		const items = await collect(sampler(source(4), 2, 'RANDOM', () => randoms.shift()));

		assert.deepStrictEqual(items, [3, 4]);
	})

	it('RANDOM skips an item when the random slot falls outside the reservoir', async function() {
		// item 3: floor(0.9 * 3) = 2, outside a reservoir of 2 -> skipped
		const items = await collect(sampler(source(3), 2, 'RANDOM', () => 0.9));

		assert.deepStrictEqual(items, [1, 2]);
	})

	it('RANDOM returns n distinct source items in stream order', async function() {
		const items = await collect(sampler(source(50), 5, 'RANDOM'));

		assert.strictEqual(items.length, 5);
		assert.strictEqual(new Set(items).size, 5);
		assert(items.every(n => n >= 1 && n <= 50));
		assert.deepStrictEqual(items, [...items].sort((a, b) => a - b));
	})

	it('rejects an unknown mode', async function() {
		await assert.rejects(collect(sampler(source(3), 1, 'MIDDLE')), /mode must be one of FIRST, LAST, RANDOM/);
	})
})
