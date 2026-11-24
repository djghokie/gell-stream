/**
 * WIP: just trying to get some guidelines down for writing readable streams
 */

/**
 * in this case, only the iterator values are promises
 */
function* syncInit() {
	for (let count = 0; count < 10; count++) yield setTimeout(100, count);
}
