import assert from 'node:assert';

import transformer from './transformer.js';
import drain from './drain.js';

import filter from './filter.js';
import spread from './spread.js';
import reducer from './reducer.js';
import sampler from './sampler.js';
import tap from './tap.js';
import batch from './batch.js';

// any object with a next() method; return() is optional (e.g. array iterators do not have one)
function isIterator(arg) {
	return arg != null && typeof arg.next === 'function';
}

function assertFunction(f, name) {
	assert(typeof f === 'function', `${name} function is required`);
}

/**
 * Process a source stream (iterator)
 * 
 * @param {*} $source 
 * @returns 
 */
export default function stream($source) {
	assert(isIterator($source), 'stream source must be an iterator');

	let $last = $source;

	return {
		filter: function(f) {
			assertFunction(f, 'filter');

			return this.pipe(filter($last, f));
		},

		map: function(f) {
			assertFunction(f, 'map');

			return this.pipe(transformer($last, f));
		},

		spread: function(f) {
			assertFunction(f, 'spread');

			return this.pipe(spread($last, f));
		},

		reduce: function(f, initialValue) {
			assertFunction(f, 'reduce');

			return this.sink(reducer(f, initialValue));
		},

		sample: function(size=1, mode='FIRST') {
			return this.pipe(sampler($last, size, mode));
		},

		batch: function(size) {
			return this.pipe(batch($last, size));
		},

		tap: function(f) {
			assertFunction(f, 'tap');

			return this.pipe(tap($last, f));
		},

		// writes each item to console.debug / console.log, prefixed by label when given
		debug: function(label) {
			return this.tap(item => label === undefined ? console.debug(item) : console.debug(label, item));
		},

		log: function(label) {
			return this.tap(item => label === undefined ? console.log(item) : console.log(label, item));
		},

		pipe: function($stream) {
			assert(isIterator($stream), 'pipe requires an iterator');

			$last = $stream;

			return this;
		},

		sink: $sink => drain($last, $sink)
	}
}

