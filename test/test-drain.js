import assert from 'node:assert';

import drain from '../drain.js';

import {
	setTimeout,
	setImmediate,
	setInterval,
} from 'node:timers/promises';

async function* testSink() {
	console.debug('######', 'sink init');

	let item = yield;

	while (true) {
		console.debug('######', item);

		/**
		 * WIP: if stream is async, values are promises
		 */

		await item;

		console.debug('$$$$$$', 'done waiting for item');

		item = yield;
	}
}

describe.skip('stream drain', function() {
	describe('base cases', function() {
		describe('non async stream and sink', function() {
			it('empty stream', function() {
				let $items = [].values();
		
				let $sink = testSink();
		
				return drain($items, $sink);
			})
		})
	})

	describe('async stream', function() {
		async function read() {
			console.debug('$$$$$$', 'reading')

			return setTimeout(1000, 'fubar');
		}

		function* stream() {
			return read();
		}

		it('single item', async function() {
			let $items = stream();
		
			let $sink = testSink();
	
			await drain($items, $sink);
		})
	})

})

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
})
