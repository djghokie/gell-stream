const assert = require('assert');
const _ = require('lodash');

module.exports = async function* spread($stream, f) {
	assert($stream, 'source stream is required');
	assert(_.isFunction(f), 'filter function is required');

	let next = await $stream.next();

	while (next.value) {
		const result = await f(next.value);

		yield* result;

		if (!next.done) next = await $stream.next();
	}
}
