import assert from 'node:assert';
import _ from 'lodash';

import transformer from './transformer.js';
import drain from './drain.js';

import filter from './filter.js';
import spread from './spread.js';
import reducer from './reducer.js';
import sampler from './sampler.js';
import tap from './tap.js';
import batch from './batch.js';

function isIterator(arg) {
	if (_.isUndefined(arg)) return false;

	return _.isFunction(arg.next) && _.isFunction(arg.return);
}

/**
 * Process a source stream (iterator)
 * 
 * @param {*} $source 
 * @returns 
 */
export default function stream($source) {
	let $last = $source;

	return {
		filter: function(f) {
			assert(_.isFunction(f));

			return this.pipe(filter($last, f));
		},

		map: function(f) {
			assert(_.isFunction(f));

			return this.pipe(transformer($last, f));
		},

		spread: function(f) {
			assert(_.isFunction(f));

			return this.pipe(spread($last, f));
		},

		reduce: function(f, initialValue) {
			assert(_.isFunction(f));

			return this.sink(reducer(f, initialValue));
		},

		sample: function(size=1, mode='FIRST') {
			return this.pipe(sampler($last, size, mode));
		},

		batch: function(size) {
			return this.pipe(batch($last, size));
		},

		tap: function(f) {
			assert(_.isFunction(f));

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
			assert(isIterator($stream));

			$last = $stream;

			return this;
		},

		sink: $sink => drain($last, $sink)
	}
}

