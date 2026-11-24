import assert from 'node:assert';
import { setTimeout } from 'node:timers/promises';

import tap from '../tap.js';
import stream from '../stream.js';
import { array as arraySink } from '../sink.js';

async function collect($stream, limit = 100) {
	const items = [];

	for (let next = await $stream.next(); !next.done; next = await $stream.next()) {
		if (items.push(next.value) > limit) throw new Error(`more than ${limit} items (runaway stream)`);
	}

	return items;
}

describe('tap', function() {
	it('calls the function with each item', async function() {
		const seen = [];

		await collect(tap([1, 0, 2].values(), item => seen.push(item)));

		assert.deepStrictEqual(seen, [1, 0, 2]);
	})

	it('passes items through unchanged, ignoring the function result', async function() {
		const items = await collect(tap([1, 2].values(), item => item * 100));

		assert.deepStrictEqual(items, [1, 2]);
	})

	it('waits for an async function before passing the item on', async function() {
		const events = [];
		const $tapped = tap([1].values(), async item => { await setTimeout(5); events.push(`tapped ${item}`); });

		for await (const item of $tapped) events.push(`received ${item}`);

		assert.deepStrictEqual(events, ['tapped 1', 'received 1']);
	})

	it('closes the source when the consumer stops early', async function() {
		let closed = false;
		function* source() { try { yield 1; yield 2; } finally { closed = true; } }

		const $tapped = tap(source(), () => {});
		await $tapped.next();
		await $tapped.return();

		assert.strictEqual(closed, true);
	})

	it('requires a tap function', async function() {
		await assert.rejects(tap([].values(), null).next(), /tap function is required/);
	})
})

describe('stream tap, debug and log', function() {
	let debug, log, logged, items;

	beforeEach(function() {
		debug = console.debug;
		log = console.log;
		logged = [];
		items = [];
		console.debug = (...args) => logged.push(['debug', ...args]);
		console.log = (...args) => logged.push(['log', ...args]);
	})

	afterEach(function() {
		console.debug = debug;
		console.log = log;
	})

	it('tap observes each item in a chain', async function() {
		const seen = [];

		await stream([1, 2].values()).map(n => n * 10).tap(n => seen.push(n)).sink(arraySink(items));

		assert.deepStrictEqual(seen, [10, 20]);
		assert.deepStrictEqual(items, [10, 20]);
	})

	it('debug writes each item to console.debug without changing the stream', async function() {
		await stream([1, 2].values()).debug().sink(arraySink(items));

		assert.deepStrictEqual(logged, [['debug', 1], ['debug', 2]]);
		assert.deepStrictEqual(items, [1, 2]);
	})

	it('debug prefixes each item with a label when given', async function() {
		await stream([1].values()).debug('after map').sink(arraySink(items));

		assert.deepStrictEqual(logged, [['debug', 'after map', 1]]);
	})

	it('log writes each item to console.log without changing the stream', async function() {
		await stream([1, 2].values()).log('item').sink(arraySink(items));

		assert.deepStrictEqual(logged, [['log', 'item', 1], ['log', 'item', 2]]);
		assert.deepStrictEqual(items, [1, 2]);
	})

	it('tap requires a function', function() {
		assert.throws(() => stream([].values()).tap('not a function'), assert.AssertionError);
	})
})
