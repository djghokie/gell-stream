import assert from 'node:assert';

import drain from '../drain.js';
import delegate from '../delegate.js';
import { array, console as consoleSink, mapper } from '../sink.js';

describe('sinks', function() {
	describe('array', function() {
		it('collects items into the given array and resolves to it', async function() {
			const items = ['existing'];

			const result = await drain([1, 2].values(), array(items));

			assert.strictEqual(result, items);
			assert.deepStrictEqual(items, ['existing', 1, 2]);
		})

		it('collects into a new array when none is given', async function() {
			const result = await drain([1, 2].values(), array());

			assert.deepStrictEqual(result, [1, 2]);
		})
	})

	describe('mapper', function() {
		it('collects the mapped items', async function() {
			const items = [];

			const result = await drain([1, 2].values(), mapper(n => n * 10, items));

			assert.strictEqual(result, items);
			assert.deepStrictEqual(items, [10, 20]);
		})
	})

	describe('console', function() {
		let debug, logged;

		beforeEach(function() {
			debug = console.debug;
			logged = [];
			console.debug = (...args) => logged.push(args);
		})

		afterEach(function() {
			console.debug = debug;
		})

		it('writes each item to console.debug', async function() {
			await drain(['a', 'b'].values(), consoleSink());

			assert.deepStrictEqual(logged, [['######', 'a'], ['######', 'b']]);
		})
	})

	describe('delegate', function() {
		it('passes each item to the delegate function', async function() {
			const seen = [];

			await drain([1, 2].values(), delegate(item => seen.push(item)));

			assert.deepStrictEqual(seen, [1, 2]);
		})

		it("resolves to the delegate function's last result", async function() {
			const result = await drain([1, 2, 3].values(), delegate(n => n * 10));

			assert.strictEqual(result, 30);
		})

		it('requires a delegate function', function() {
			assert.throws(() => delegate(null).next(), /delegate function is required/);
		})
	})
})
