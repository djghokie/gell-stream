import assert from 'node:assert';

import { sampleInto } from '../sampler.js';

function* recordingSink(items) {
	let item = yield;

	while (true) {
		items.push(item);

		item = yield;
	}
}

describe('sampleInto', function() {
	it('sends the first n items to the sink', async function() {
		const items = [];

		await sampleInto([1, 2, 3, 4].values(), recordingSink(items), 2);

		assert.deepStrictEqual(items, [1, 2]);
	})

	it('sends falsy items to the sink', async function() {
		const items = [];

		await sampleInto([0, false, 3].values(), recordingSink(items), 2);

		assert.deepStrictEqual(items, [0, false]);
	})

	it('does not send a source generator return value as an item', async function() {
		const items = [];
		function* source() { yield 1; return 99; }

		await sampleInto(source(), recordingSink(items), 5);

		assert.deepStrictEqual(items, [1]);
	})

	it('closes the source once the sample size is reached', async function() {
		let closed = false;
		function* source() { try { yield 1; yield 2; yield 3; } finally { closed = true; } }

		await sampleInto(source(), recordingSink([]), 1);

		assert.strictEqual(closed, true);
	})
})

describe('sampleInto results', function() {
	async function* summingSink() {
		let total = 0;
		let item = yield total;

		while (true) {
			total += item;

			item = yield total;
		}
	}

	it("resolves to the sink's last yielded value when it returns nothing", async function() {
		const result = await sampleInto([1, 2, 3, 4].values(), summingSink(), 3);

		assert.strictEqual(result, 6);
	})

	it("resolves to an async sink's initial value for an empty stream", async function() {
		const result = await sampleInto([].values(), summingSink(), 3);

		assert.strictEqual(result, 0);
	})

	it('resolves to the value the sink returns when it has one', async function() {
		function* summarizingSink() {
			let count = 0;

			try {
				while (true) { yield; count++; }
			} finally {
				return `saw ${count}`;
			}
		}

		const result = await sampleInto([1, 2, 3].values(), summarizingSink(), 2);

		assert.strictEqual(result, 'saw 2');
	})
})
