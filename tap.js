import assert from 'node:assert';

/**
 * Calls f with each item and passes the item through unchanged (f's result is ignored)
 * 	- f may be async; each item waits for f before it is passed on
 * 	- useful for logging, metrics, and other side effects
 */
export default async function* tap($stream, f) {
	assert($stream, 'source stream is required');
	assert(typeof f === 'function', 'tap function is required');

	try {
		for (let next = await $stream.next(); !next.done; next = await $stream.next()) {
			await f(next.value);

			yield next.value;
		}
	} finally {
		await $stream.return?.();
	}
}
