import assert from 'node:assert';

export default async function* filter($stream, f) {
	assert($stream, 'source stream is required');
	assert(typeof f === 'function', 'filter function is required');

	try {
		for (let next = await $stream.next(); !next.done; next = await $stream.next()) {
			if (await f(next.value)) yield next.value;
		}
	} finally {
		await $stream.return?.();
	}
}
