import assert from 'node:assert';

/**
 * Groups items into arrays of size items; the final batch holds whatever remains
 * 	- useful for bulk operations (e.g. batch writes) over a stream of items
 */
export default async function* batch($stream, size) {
	assert($stream, 'source stream is required');
	assert(Number.isInteger(size) && size > 0, 'size must be a positive integer');

	try {
		let items = [];

		for (let next = await $stream.next(); !next.done; next = await $stream.next()) {
			items.push(next.value);

			if (items.length === size) {
				yield items;

				items = [];
			}
		}

		if (items.length) yield items;
	} finally {
		await $stream.return?.();
	}
}
