# gell-streamz

Stream processing with (async) generators: read from any iterator, chain operators, and drain the result into a sink.

Built for working through large or open-ended result sets (DynamoDB query pages, search results) one item at a time, without loading everything into memory.

Extracted from [gell](https://www.npmjs.com/package/gell) (`gell/stream/*`).

## Install

```bash
npm install gell-streamz
```

Requires Node.js 20.19+ or 22.12+ when loaded with `require()` from CommonJS (the package is ESM-only).

## Usage

```js
import stream from 'gell-streamz';
import { array } from 'gell-streamz/sink';

async function* orders() {
	yield { id: 1, total: 40 };
	yield { id: 2, total: 0 };
	yield { id: 3, total: 125 };
}

// collect into an array
const big = await stream(orders())
	.filter(order => order.total > 50)
	.map(order => order.id)
	.sink(array());
// => [3]

// reduce to a single value
const revenue = await stream(orders()).reduce((sum, order) => sum + order.total, 0);
// => 165
```

## API

### `stream(source)`

Wraps a source iterator (a generator, async generator, or anything with `next()` and `return()`, such as `[1, 2].values()`) and returns a chain. Each chain method below returns the chain, except `sink` and `reduce`, which run it.

| Method | Description |
|---|---|
| `map(f)` | Replace each item with `f(item)` (`f` may be async) |
| `filter(f)` | Keep items for which `f(item)` is truthy (`f` may be async) |
| `spread(f)` | Replace each item with the items of the iterable `f(item)` returns |
| `batch(size)` | Group items into arrays of `size`; the last batch holds what remains |
| `sample(size = 1, mode = 'FIRST')` | Keep up to `size` items: `FIRST` (stops reading early), `LAST`, or `RANDOM` (uniform; items stay in stream order) |
| `tap(f)` | Call `f(item)` for side effects and pass the item through unchanged |
| `debug(label?)` / `log(label?)` | Write each item to `console.debug` / `console.log`, prefixed by `label` |
| `pipe(iterator)` | Continue the chain from your own operator (an iterator over the previous step) |
| `sink(sink)` | Drain the chain into a sink; resolves to the sink's result |
| `reduce(f, initialValue)` | Drain into a reducer; resolves to the accumulated value |

### Sinks (`gell-streamz/sink`)

A sink is a generator that receives items through `yield`. Each comes initialized and closed by `drain`.

| Sink | Result |
|---|---|
| `array(items = [])` | Pushes each item onto `items`; resolves to `items` |
| `mapper(f, items = [])` | Pushes `f(item)` onto `items`; resolves to `items` |
| `console()` | Writes each item to `console.debug` |

`gell-streamz/delegate` provides `delegate(f)`, a sink that calls `f(item)` and resolves to the last result.

### Building blocks

Every operator is also available on its own and works directly on iterators:

| Import | Signature |
|---|---|
| `gell-streamz/drain` | `drain(stream, sink, initializeSink = true)` |
| `gell-streamz/transformer` | `transformer(stream, f)` (map) |
| `gell-streamz/filter` | `filter(stream, f)` |
| `gell-streamz/spread` | `spread(stream, f)` |
| `gell-streamz/batch` | `batch(stream, size)` |
| `gell-streamz/sampler-enhanced` | `sampler(stream, size = 1, mode = 'FIRST', random = Math.random)` |
| `gell-streamz/sampler` | `sampler(stream, sink, size = 1)`: samples the first `size` items straight into a sink |
| `gell-streamz/tap` | `tap(stream, f)` |
| `gell-streamz/reducer` | `reducer(f, initialValue)` (a sink) |

See [docs/stream.md](docs/stream.md) for how items, sinks and closing work.

## License

ISC
