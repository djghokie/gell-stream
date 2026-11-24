import assert from 'node:assert';

/**
 * WIP: "drain" should refer to any implementation that reads a stream and delegates to a sink
 * 	- this implementation should be renamed "all" or "full"
 * 	- sampler should be moved here and renamed "sample"
 * 	- other implementations could be added
 * 		- batch
 * 		- page
 */

/**
 * "drains" a stream into a sink
 * 
 * IMPROVEMENTS
 * 	- sink parameter should allow generator or function
 * 
 * @param {*} $stream 
 * @param {*} $sink 
 * @param {*} initializeSink - whether or not to initialize the sink 
 * @returns 
 */
export default async function all($stream, $sink, initializeSink=true) {
	assert($stream, '$stream is required');
	assert($sink, '$sink is required');

	/**
	 * WIP: errors/rejections from the sink handler seem to get swallowed
	 * 	- happens during sink initialization
	 * 	- what happens during sink.next ?
	 */
	if (initializeSink)
		var last = await $sink.next();
	
	let next;
	do {
		/**
		 * WIP: think thru stream read here
		 * 	- next will either return
		 * 		- promise for val/done
		 * 		- val as a promise
		 * 	- if next returns promise
		 * 		- must wait as you wont know if the stream is done
		 * 	- if next returns a non promise
		 * 		- await has no effect
		 * 		- value (promise or not) passed to sink
		 */
		
		next = await $stream.next();

		/**
		 * WIP: buffering
		 * 	- would read a number of items in before sending to sink
		 */

		// console.debug('$$$$$$', 'got next', next);

		/**
		 * WIP: batching
		 * 	- call sink x number of times before waiting on the batch to complete
		 */

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

		// NOTE: a done result carries the generator's return value, which is not a stream item
		if (!next.done) last = await $sink.next(next.value);
	} while (!next.done)

	/**
	 * WIP: this effectively closes the sink, which may not be the desired behavior
	 */
	const closed = await $sink.return();

	// prefer a value the sink returns when closed; otherwise the last value it yielded (e.g. a reducer's accumulator)
	return closed.value !== undefined ? closed.value : last?.value;
}
