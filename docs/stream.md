# gell streams

_how streams, operators and sinks fit together_

## Concepts

* **source**: any iterator (`next()`, optionally `return()`); sync or async
	* generators, async generators, `array.values()`, paginated queries
* **operator**: an async generator that reads from a source and yields new items
	* `transformer` (map), `filter`, `spread`, `batch`, `sampler` (sample), `tap`
	* operators compose: each one is the source for the next
* **sink**: a generator that receives items through `yield`
	* `array`, `mapper`, `console`, `delegate`, `reducer`
* **drain**: reads a stream to the end and sends every item to a sink
* **stream()**: a chainable wrapper that builds operators and drains into a sink

## Items

* every item is delivered, including falsy ones (`0`, `null`, `false`, `''`)
* a stream ends when its iterator reports `done`
	* a generator's `return` value is not an item and is ignored
* items are processed one at a time
	* drain waits for the sink to finish an item before reading the next one
	* async functions passed to `map`, `filter`, `spread` and `tap` are awaited

## Sinks

* drain initializes a sink by calling `next()` once before sending items
	* pass `initializeSink = false` when the sink has already been started
* drain closes the sink (`return()`) when the stream ends
	* a sink can flush buffered work in a `finally` block
* drain resolves to
	* the value the sink returns when it is closed, if any
	* otherwise the last value the sink yielded (e.g. the `array` sink's array, the `reducer`'s accumulator)

## Closing sources

* every operator closes its source (`return()`) when it finishes, fails, or is stopped early
* closing propagates up a chain
	* e.g. `stream(query).map(f).sample(1)` closes `query` after the first item
	* lets sources release resources such as open queries or connections

## Sampling

* `FIRST`: the first `size` items; stops reading as soon as they are taken
* `LAST`: the last `size` items; reads the whole stream
* `RANDOM`: a uniform random sample (reservoir sampling); reads the whole stream
* `LAST` and `RANDOM` hold at most `size` items and yield them in stream order

## WIP

* error handling strategies (fail fast, ignore)
* parallel / concurrent processing
* buffering ahead of a slow sink
* sinks as plain functions
* events
