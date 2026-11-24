import assert from 'node:assert';

import sampler from '../sampler.js';

function* recordingSink(items) {
	let item = yield;

	while (true) {
		items.push(item);

		item = yield;
	}
}

describe('sampler (into a sink)', function() {
	it('sends the first n items to the sink', async function() {
		const items = [];

		await sampler([1, 2, 3, 4].values(), recordingSink(items), 2);

		assert.deepStrictEqual(items, [1, 2]);
	})

	it('sends falsy items to the sink', async function() {
		const items = [];

		await sampler([0, false, 3].values(), recordingSink(items), 2);

		assert.deepStrictEqual(items, [0, false]);
	})

	it('does not send a source generator return value as an item', async function() {
		const items = [];
		function* source() { yield 1; return 99; }

		await sampler(source(), recordingSink(items), 5);

		assert.deepStrictEqual(items, [1]);
	})

	it('closes the source once the sample size is reached', async function() {
		let closed = false;
		function* source() { try { yield 1; yield 2; yield 3; } finally { closed = true; } }

		await sampler(source(), recordingSink([]), 1);

		assert.strictEqual(closed, true);
	})
})
