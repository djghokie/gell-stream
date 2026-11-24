const assert = require('assert');
const _ = require('lodash');

module.exports = async function* reducer(f, initialValue) {
	assert(_.isFunction(f), 'reducer function is required');

	let accumulator = initialValue;

	let item = yield accumulator;

	while (true) {
		accumulator = await f(accumulator, item);

		item = yield accumulator;
	}
}
