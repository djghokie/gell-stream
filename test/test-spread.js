import assert from 'node:assert';

import spread from '../spread.js';

async function collect($stream, limit = 100) {
	const items = [];

	for (let next = await $stream.next(); !next.done; next = await $stream.next()) {
		if (items.push(next.value) > limit) throw new Error(`more than ${limit} items (runaway stream)`);
	}

	return items;
}

describe('spread', function() {
	it('spreads every source item, including falsy ones', async function() {
		const items = await collect(spread([0, 1].values(), x => [x, x + 10]));

		assert.deepStrictEqual(items, [0, 10, 1, 11]);
	})

	it('emits falsy items produced by the spread function', async function() {
		const items = await collect(spread([1].values(), () => [0, false, 2]));

		assert.deepStrictEqual(items, [0, false, 2]);
	})

	it('ignores a source generator return value and terminates', async function() {
		function* source() { yield 1; return 2; }

		const items = await collect(spread(source(), x => [x]));

		assert.deepStrictEqual(items, [1]);
	})

	it('rejects with a clear error when the function does not return an iterable', async function() {
		await assert.rejects(collect(spread([1].values(), () => 5)), /spread function must return an iterable/);
	})

	it('requires a spread function', async function() {
		await assert.rejects(spread([].values(), null).next(), /spread function is required/);
	})

	it('closes the source when the consumer stops early', async function() {
		let closed = false;
		function* source() { try { yield 1; yield 2; } finally { closed = true; } }

		const $spread = spread(source(), x => [x, x]);
		await $spread.next();
		await $spread.return();

		assert.strictEqual(closed, true);
	})
})
