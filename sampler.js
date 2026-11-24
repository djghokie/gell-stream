import assert from 'node:assert';

export default async function sampler($stream, $sink, size=1) {
	assert($stream, '$stream is required');
	assert($sink, '$sink is required');

	let last = $sink.next();
	
	let next, sampled = 0;
	do {
		next = await $stream.next();

		sampled++;
		
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

		if (next && next.value) last = await $sink.next(next.value);
	} while (next && !next.done && sampled < size)

	last = await $sink.return();

	return last.value;
}

