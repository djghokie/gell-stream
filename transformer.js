import assert from 'node:assert';

export default async function* transformer($stream, f) {
	assert($stream, 'source stream is required');
	assert(typeof f === 'function', 'transformer function is required');

	try {
		for (let next = await $stream.next(); !next.done; next = await $stream.next()) {
			yield f(next.value);
		}
	} finally {
		await $stream.return?.();
	}
}
