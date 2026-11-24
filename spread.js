import assert from 'node:assert';

export default async function* spread($stream, f) {
	assert($stream, 'source stream is required');
	assert(typeof f === 'function', 'spread function is required');

	try {
		for (let next = await $stream.next(); !next.done; next = await $stream.next()) {
			const result = await f(next.value);

			assert(isIterable(result), 'spread function must return an iterable');

			yield* result;
		}
	} finally {
		await $stream.return?.();
	}
}

function isIterable(value) {
	return value != null && (typeof value[Symbol.iterator] === 'function' || typeof value[Symbol.asyncIterator] === 'function');
}
