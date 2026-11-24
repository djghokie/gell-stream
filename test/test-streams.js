import assert from 'node:assert';

import transformer from '../transformer.js';
import { array as arraySink, console as consoleSink } from '../sink.js';
import drain from '../drain.js';

import stream from '../stream.js';
import filter from '../filter.js';

describe('streams', function() {
	let $source, items;

	beforeEach(function() {
		$source = [10, 20, 30, 40, 50, 60].values();

		items = [];
	})

	describe('map', function() {
		it('manual', async function() {
			const $transformed = transformer($source, n => n/2);

			await drain($transformed, arraySink(items));

			assert.deepStrictEqual(items, [5, 10, 15, 20, 25, 30]);
		})

		it('chained', async function() {
			await stream($source)
				.map(n => n/2)
				.sink(arraySink(items));

			assert.deepStrictEqual(items, [5, 10, 15, 20, 25, 30]);
		})
	})

	describe('filter', function() {
		it('simple', async function() {
			const $filtered = filter($source, n => n > 15);

			await drain($filtered, arraySink(items));

			assert.deepStrictEqual(items, [20, 30, 40, 50, 60]);
		})

		it('map then filter', async function() {
			const $transformed = transformer($source, n => n/2);
			const $filtered = filter($transformed, n => n > 15);

			await drain($filtered, arraySink(items));

			assert.deepStrictEqual(items, [20, 25, 30]);
		})

		it('chained', async function() {
			await stream($source)
				.filter(n => n <= 20)
				.map(n => n/2)
				.sink(arraySink(items));

			assert.deepStrictEqual(items, [5, 10]);
		})
	})

	describe('sample', function() {
		it('source', async function() {
			await stream($source)
				.sample(3)
				.sink(arraySink(items));

			assert.deepStrictEqual(items, [10, 20, 30]);
		})

		it('filtered', async function() {
			await stream($source)
				.filter(n => n > 30)
				.sample()
				.sink(arraySink(items));

			assert.deepStrictEqual(items, [40]);
		})

		it('passes the sampling mode through', async function() {
			await stream($source)
				.sample(2, 'LAST')
				.sink(arraySink(items));

			assert.deepStrictEqual(items, [50, 60]);
		})
	})

	describe('spread', function() {
		it('simple', async function() {
			await stream($source)
				.sample(1)
				.spread(item => {
					const newItems = [];
					for (let i = 0; i < 5; i++) newItems.push(item+i);
					return newItems.values();
				})
				.sink(arraySink(items));

			assert.deepStrictEqual(items, [10, 11, 12, 13, 14]);
		})
	})

	describe('reduce', function() {
		it('resolves to the reduced value', async function() {
			const total = await stream($source).reduce((sum, n) => sum + n, 0);

			assert.strictEqual(total, 210);
		})

		it('reduces falsy items', async function() {
			const count = await stream([0, 0, 0].values()).reduce(n => n + 1, 0);

			assert.strictEqual(count, 3);
		})
	})

	describe('early termination', function() {
		it('closes the original source when a downstream sample stops', async function() {
			let closed = false;
			function* source() { try { yield 1; yield 2; yield 3; } finally { closed = true; } }

			await stream(source())
				.map(n => n * 2)
				.filter(() => true)
				.sample(1)
				.sink(arraySink(items));

			assert.deepStrictEqual(items, [2]);
			assert.strictEqual(closed, true);
		})
	})

	describe('validation', function() {
		for (const method of ['map', 'filter', 'spread', 'reduce', 'tap']) {
			it(`${method} requires a function`, function() {
				assert.throws(() => stream($source)[method]('not a function'), new RegExp(`${method} function is required`));
			})
		}

		it('stream requires an iterator source', function() {
			assert.throws(() => stream([1, 2]), /stream source must be an iterator/);
		})

		it('pipe rejects something that is not an iterator', function() {
			assert.throws(() => stream($source).pipe([1, 2]), /pipe requires an iterator/);
		})

		it('pipe accepts an iterator without a return method', async function() {
			await stream([1].values()).pipe([7, 8].values()).sink(arraySink(items));

			assert.deepStrictEqual(items, [7, 8]);
		})

		it('pipe makes the given iterator the stream the next step reads from', async function() {
			async function* doubled($items) { for await (const n of $items) yield n * 2; }

			const $chain = stream([1, 2].values());
			await $chain.pipe(doubled([5, 6].values())).sink(arraySink(items));

			assert.deepStrictEqual(items, [10, 12]);
		})
	})
})
