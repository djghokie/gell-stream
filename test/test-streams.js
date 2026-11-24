import assert from 'node:assert';

import _ from 'lodash';

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
})
