import assert from 'node:assert';
import { array as arraySink } from '../sink.js';
import drain from '../drain.js';
import transformer from '../transformer.js';

async function* source() {
	yield [1, 2];
	yield [3, 4];
	yield [5, 6];
}

describe('transformer', function() {
	it('transforms all items', async function() {
		const f = item => item[0] + item[1];

		const items = [];

		await drain(transformer(source(), f), arraySink(items));

		assert.strictEqual(items.length, 3);
		assert.strictEqual(items[0], 3);
		assert.strictEqual(items[1], 7);
		assert.strictEqual(items[2], 11);
	})
})

describe('transformer edge cases', function() {
	async function collect($stream, limit = 100) {
		const items = [];

		for (let next = await $stream.next(); !next.done; next = await $stream.next()) {
			if (items.push(next.value) > limit) throw new Error(`more than ${limit} items (runaway stream)`);
		}

		return items;
	}

	it('passes falsy items through instead of ending the stream', async function() {
		const items = await collect(transformer([0, null, false, '', 1].values(), x => x));

		assert.deepStrictEqual(items, [0, null, false, '', 1]);
	})

	it('emits falsy transform results', async function() {
		const items = await collect(transformer([1, 2].values(), x => x - 1));

		assert.deepStrictEqual(items, [0, 1]);
	})

	it('ignores a source generator return value and terminates', async function() {
		function* source() { yield 1; return 2; }

		const items = await collect(transformer(source(), x => x * 10));

		assert.deepStrictEqual(items, [10]);
	})

	it('closes the source when the consumer stops early', async function() {
		let closed = false;
		function* source() { try { yield 1; yield 2; yield 3; } finally { closed = true; } }

		const $transformed = transformer(source(), x => x);
		await $transformed.next();
		await $transformed.return();

		assert.strictEqual(closed, true);
	})
})
