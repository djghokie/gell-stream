import assert from 'node:assert';
import _ from 'lodash';

import transformer from './transformer.js';
import drain from './drain.js';

import filter from './filter.js';
import spread from './spread.js';
import reducer from './reducer.js';
import sampler from './sampler-enhanced.js';

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

		sample: function(size=1, mode) {
			return this.pipe(sampler($last, size));
		},

		// WIP
		debug: function() { return this; },
		log: function() { return this; },

		pipe: function($stream) {
			assert(isIterator($stream));

			$last = $stream;

			return this;
		},

		sink: $sink => drain($last, $sink)
	}
}

