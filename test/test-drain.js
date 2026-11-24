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