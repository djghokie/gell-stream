import assert from 'node:assert';

import drain from '../drain.js';

import { setTimeout } from 'node:timers/promises';

describe('drain', function() {
	function* recordingSink(items) {
		let item = yield;

		while (true) {
			items.push(item);

			item = yield;
		}
	}

	it('delivers falsy items to the sink', async function() {
		const items = [];

		await drain([0, null, false, '', 1].values(), recordingSink(items));

		assert.deepStrictEqual(items, [0, null, false, '', 1]);
	})

	it('does not deliver a source generator return value as an item', async function() {
		const items = [];
		function* source() { yield 1; return 99; }

		await drain(source(), recordingSink(items));

		assert.deepStrictEqual(items, [1]);
	})

	it("resolves to the sink's last yielded value", async function() {
		function* countingSink() {
			let count = 0;
			let item = yield count;

			while (true) item = yield ++count;
		}

		const result = await drain(['a', 'b', 'c'].values(), countingSink());

		assert.strictEqual(result, 3);
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

		const result = await drain([1, 2].values(), summarizingSink());

		assert.strictEqual(result, 'saw 2');
	})

	it('sends nothing to the sink for an empty stream', async function() {
		const items = [];

		await drain([].values(), recordingSink(items));

		assert.deepStrictEqual(items, []);
	})

	it('waits for each item of an async source', async function() {
		const items = [];
		async function* source() {
			yield await setTimeout(5, 'a');
			yield await setTimeout(1, 'b');
		}

		await drain(source(), recordingSink(items));

		assert.deepStrictEqual(items, ['a', 'b']);
	})

	it('finishes each item in an async sink before reading the next', async function() {
		const events = [];
		function* source() {
			for (const n of [1, 2]) { events.push(`read ${n}`); yield n; }
		}
		async function* slowSink() {
			let item = yield;

			while (true) {
				events.push(`start ${item}`);
				await setTimeout(5);
				events.push(`end ${item}`);

				item = yield;
			}
		}

		await drain(source(), slowSink());

		assert.deepStrictEqual(events, ['read 1', 'start 1', 'end 1', 'read 2', 'start 2', 'end 2']);
	})

	it('does not re-initialize a sink the caller already started', async function() {
		const items = [];
		const $sink = recordingSink(items);
		$sink.next();

		await drain([1, 2].values(), $sink, false);

		assert.deepStrictEqual(items, [1, 2]);
	})
})
