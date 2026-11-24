import assert from 'node:assert';

// import { console as consoleSink } from '../sink.js';
// import sampler from '../sampler.js';

function* batch() {
	let items = [];

	async function flush() {
		console.debug('######', 'flushing items', items.length);
		console.debug('$$$$$$', items);

		items = [];
	}

	async function doBatch(item) {
		items.push(item);

		if (items.length >= 5) return flush();
	}

	let item = yield;

	try {
		while (true) yield doBatch(item);
	} finally {
		yield flush();
	}
}

/**
 * WIP: temporary test to figure out batch flushing
 * 	- idea would be for drain implementations to call return on the sink
 * 	- allows for final sink flushing
 */
describe.skip('batch processing', function() {
	it('generator return', function() {
		function* future() {
			let count = 0;

			yield ++count;

			/*
			try {
				yield ++count;
			} finally {
				yield ++count;
			}
			*/

			/*
			while (true) {
				try {
					yield ++count;
				} finally {
					yield 1000;
				}
			}
			*/

			try {
				while (true) yield ++count;
			} finally {
				yield 1000;
			}
		}

		let f = future();

		console.debug('######', f.next()); // init
		console.debug('######', f.next());
		console.debug('######', f.next());
		console.debug('######', f.next());
		console.debug('######', f.next());
		console.debug('######', f.next());
		console.debug('######', f.next());
		console.debug('######', f.return());
	})

	it('test', function() {
		const $items = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].values();

		/**
		 * TODO: the sampler/drain needs to call return
		 */

		// return sampler($items, consoleSink(), 5);
		return sampler($items, batch(), 8);
	})
})