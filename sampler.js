import assert from 'node:assert';

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
	assert(typeof size === 'number' && size > 0, 'size must be number greater than zero');
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

/**
 * Samples the first size items of a stream straight into a sink, then closes the sink
 * 	- resolves like drain: the value the sink returns when closed, otherwise the last value it yielded
 * 
 * @param {*} $stream 
 * @param {*} $sink 
 * @param {*} size - maximum number of items to sample
 */
export async function sampleInto($stream, $sink, size=1) {
	assert($stream, '$stream is required');
	assert($sink, '$sink is required');

	let last = await $sink.next();

	try {
		for (let sampled = 0; sampled < size; sampled++) {
			const next = await $stream.next();

			// NOTE: a done result carries the generator's return value, which is not a stream item
			if (next.done) break;

			/**
			 * WIP: assume $sink handling is async
			 * 	- hence the await call here
			 * 	- this will process everything serially, which might not be desired
			 * 	- perhaps other implementations could proceed concurrently
			 * 
			 * WIP: the above statements arent quite right
			 * 	- this only works for async generators
			 * 	- non-async generators that yield promises will run concurrently
			 * 		- this creates problems for some sinks that need to run sequentually
			 */

			last = await $sink.next(next.value);
		}
	} finally {
		// close the source so it can release resources once the sample is taken
		await $stream.return?.();
	}

	const closed = await $sink.return();

	// same as drain: prefer a value the sink returns when closed; otherwise the last value it yielded
	return closed.value !== undefined ? closed.value : last?.value;
}
