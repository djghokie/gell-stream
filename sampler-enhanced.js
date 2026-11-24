import assert from 'node:assert';
import _ from 'lodash';

const MODES = {
	FIRST: true,
	LAST: true,
	RANDOM: true
}

/**
 * Samples up to size items from a stream
 *
 * Modes
 * 	- FIRST: the first size items; stops reading once they are taken
 * 	- LAST: the last size items; reads the whole stream
 * 	- RANDOM: a uniform random sample of size items (reservoir sampling); reads the whole stream
 *
 * LAST and RANDOM hold at most size items in memory and yield them in stream order
 *
 * @param {*} $stream
 * @param {*} size - maximum number of items to sample
 * @param {*} mode - FIRST (default), LAST, or RANDOM
 * @param {*} random - returns a number in [0, 1); used by RANDOM (default Math.random)
 */
export default async function* sampler($stream, size=1, mode="FIRST", random=Math.random) {
	assert($stream, 'source stream is required');
	assert(_.isNumber(size) && size > 0, 'size must be number greater than zero');
	assert(MODES[mode], `mode must be one of ${Object.keys(MODES).join(', ')}`);

	try {
		if (mode === 'FIRST') {
			for (let sampled = 0; sampled < size; sampled++) {
				const next = await $stream.next();

				if (next.done) return;

				yield next.value;
			}

			return;
		}

		// reservoir of { index, value } so that sampled items can be yielded in stream order
		const reservoir = [];

		for (let index = 0, next = await $stream.next(); !next.done; index++, next = await $stream.next()) {
			const sample = { index, value: next.value };

			if (reservoir.length < size) reservoir.push(sample);
			else if (mode === 'LAST') {
				reservoir.shift();
				reservoir.push(sample);
			} else {
				const slot = Math.floor(random() * (index + 1));

				if (slot < size) reservoir[slot] = sample;
			}
		}

		yield* reservoir.sort((a, b) => a.index - b.index).map(sample => sample.value);
	} finally {
		// close the source so it can release resources once the sample is taken
		await $stream.return?.();
	}
}
