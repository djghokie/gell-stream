import assert from 'node:assert';
import _ from 'lodash';

const MODES = {
	FIRST: true,
	LAST: true,
	RANDOM: true
}

export default async function* sampler($stream, size=1, mode="FIRST") {
	assert($stream, 'source stream is required');
	assert(_.isNumber(size) && size > 0, 'size must be number greater than zero');

	let next, sampled = 0;
	do {
		next = await $stream.next();

		sampled++;
		
		if (next) yield next.value;
	} while (next && !next.done && sampled < size)
}
