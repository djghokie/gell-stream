import assert from 'node:assert';

import filter from '../filter.js';

async function collect($stream, limit = 100) {
	const items = [];

	for (let next = await $stream.next(); !next.done; next = await $stream.next()) {
		if (items.push(next.value) > limit) throw new Error(`more than ${limit} items (runaway stream)`);
	}

	return items;
}

describe('filter', function() {
	it('keeps falsy items that pass the predicate', async function() {
		const items = await collect(filter([5, 0, false, null, 6].values(), () => true));

		assert.deepStrictEqual(items, [5, 0, false, null, 6]);
	})

	it('keeps filtering past a falsy item that fails the predicate', async function() {
		const items = await collect(filter([1, 0, 2].values(), x => x > 0));

		assert.deepStrictEqual(items, [1, 2]);
	})

	it('ignores a source generator return value and terminates', async function() {
		function* source() { yield 1; return 2; }

		const items = await collect(filter(source(), () => true));

		assert.deepStrictEqual(items, [1]);
	})

	it('closes the source when the consumer stops early', async function() {
		let closed = false;
		function* source() { try { yield 1; yield 2; yield 3; } finally { closed = true; } }

		const $filtered = filter(source(), () => true);
		await $filtered.next();
		await $filtered.return();

		assert.strictEqual(closed, true);
	})
})
