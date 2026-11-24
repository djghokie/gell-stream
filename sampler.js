import assert from 'node:assert';

export default async function sampler($stream, $sink, size=1) {
	assert($stream, '$stream is required');
	assert($sink, '$sink is required');

	let last = $sink.next();
	
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

	last = await $sink.return();

	return last.value;
}

