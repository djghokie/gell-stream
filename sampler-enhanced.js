const assert = require('assert');
const _ = require('lodash');

const MODES = {
	FIRST: true,
	LAST: true,
	RANDOM: true
}

module.exports = async function* sampler($stream, size=1, mode="FIRST") {
	assert($stream, 'source stream is required');
	assert(_.isNumber(size) && size > 0, 'size must be number greater than zero');

	let next, sampled = 0;
	do {
		next = await $stream.next();

		sampled++;
		
		if (next) yield next.value;
	} while (next && !next.done && sampled < size)
}
