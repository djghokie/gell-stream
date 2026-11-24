const assert = require('assert');
const _ = require('lodash');

const { array: arraySink } = require('../sink');
const drain = require('../drain');
const transformer = require('../transformer');

async function* source() {
	yield [1, 2];
	yield [3, 4];
	yield [5, 6];
}

describe('transformer', function() {
	it('transforms all items', async function() {
		const f = item => item[0] + item[1];

		const items = [];

		await drain(transformer(source(), f), arraySink(items));

		assert.strictEqual(items.length, 3);
		assert.strictEqual(items[0], 3);
		assert.strictEqual(items[1], 7);
		assert.strictEqual(items[2], 11);
	})
})