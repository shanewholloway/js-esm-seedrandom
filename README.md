# esm-seedrandom

Explicitly seeded random number generator for JavaScript, ported to ES Modules.

Unit tested for number generator compatability with original [seedrandom][] CommonJS NPM package.</p>

* Version: 3.0.5
* Author: David Bau
* Date: 2019-09-14
* ES Modules port in 2020-12 by Shane Holloway

 [seedrandom]: https://github.com/davidbau/seedrandom


## Demo

GitHub Pages-based [Live demo](https://shanewholloway.github.io/js-esm-seedrandom/index.html)


## Use

## Fast PRNG Algorithms

|PRNG name         | Period      | Author               | BigCrush test results |
|------------------|-------------|----------------------|-----------------------|
|[prng_alea][]     | ~2^116      | Baagøe               | pass all
|[prng_xor128][]   | 2^128-1     | Marsaglia            | fail MatrixRank and LinearComp
|[prng_tychei][]   | ~2^127      | Neves/Araujo (ChaCha)| pass all
|[prng_xorwow][]   | 2^192-2^32  | Marsaglia            | fail CollisionOver, SimpPoker, and LinearComp
|[prng_xor4096][]  | 2^4096-2^32 | Brent (xorgens)      | pass all
|[prng_xorshift7][]| 2^256-1     | Panneton/L'ecuyer    | pass all
|[prng_arc4][]     | ~2^1600     | Bau (ARC4)           | unknown

 [prng_alea]: ./docs/alea.md
 [prng_xor128]: ./docs/xor128.md
 [prng_tychei]: ./docs/tychei.md
 [prng_xorwow]: ./docs/xorwow.md
 [prng_xor4096]: ./docs/xor4096.md
 [prng_xorshift7]: ./docs/xorshift7.md
 [prng_arc4]: ./docs/arc4.md


To use Johannes Baagøe's extremely fast Alea PRNG:


```javascript
// Use alea for Johannes Baagøe's clever and fast floating-point RNG.
import {prng_alea} from 'esm-seedrandom';
let myrng = prng_alea('hello.');

// By default provides 32 bits of randomness in a float.
console.log(myrng());               // Always 0.4783254903741181 for this seed and sequence
console.log(myrng.quick());         // Always 0.8297006865032017 for this seed and sequence

// Use "double" to get 56 bits of randomness.
console.log(myrng.double());        // Always 0.4692433053279662 for this seed and sequence

// Use "int32" to get a 32 bit (signed) integer.
console.log(myrng.int32());         // Always 1350551666 for this seed and sequence
```

or direclty from HTML,

```html
<script type="module">
  import {prng_alea} from '//cdn.jsdelivr.net/npm/esm-seedrandom/esm/alea.min.mjs'

  let myrng = prng_alea('an example seed string')

  console.log(myrng()); // Always 0.2594452982302755 for this seed and sequence
  console.log(myrng()); // Always 0.8253263409715146 for this seed and sequence
  console.log(myrng()); // Always 0.42280301195569336 for this seed and sequence

  // Use "quick" to get only 32 bits of randomness in a float.
  console.log(myrng.quick()); // Always 0.9045045920647681 for this seed and sequence
  console.log(myrng.quick()); // Always 0.7626296668313444 for this seed and sequence

  // Use "int32" to get a 32 bit (signed) integer
  console.log(myrng.int32()); // Always 1157605039 for this seed and sequence
  console.log(myrng.int32()); // Always 346379077 for this seed and sequence

  console.log(myrng.double()); // Always 0.9541419381134651 for this seed and sequence
  console.log(myrng.double()); // Always 0.7982540860513401 for this seed and sequence
</script>
```


## Docs

See the [API docs](./docs/api.md).


### Overview

From NodeJS,

```sh
npm install esm-seedrandom
```

or in HTML,

```html
<script type='module'>
  import {prng_alea} from '//cdn.jsdelivr.net/npm/esm-seedrandom/esm/index.min.mjs'

  // or use the individual algorithms by module

  import {prng_alea} from '//cdn.jsdelivr.net/npm/esm-seedrandom/esm/alea.min.mjs'
  import {prng_xor128} from '//cdn.jsdelivr.net/npm/esm-seedrandom/esm/xor128.min.mjs'
  import {prng_tychei} from '//cdn.jsdelivr.net/npm/esm-seedrandom/esm/tychei.min.mjs'
  import {prng_xorwow} from '//cdn.jsdelivr.net/npm/esm-seedrandom/esm/xorwow.min.mjs'
  import {prng_xor4096} from '//cdn.jsdelivr.net/npm/esm-seedrandom/esm/xor4096.min.mjs'
  import {prng_xorshift7} from '//cdn.jsdelivr.net/npm/esm-seedrandom/esm/xorshift7.min.mjs'
  import {prng_arc4} from '//cdn.jsdelivr.net/npm/esm-seedrandom/esm/arc4.min.mjs'
</script>
```

#### Saving & Restoring PRNG state

```javascript
import {prng_alea} from 'esm-seedrandom';

let rng_first = prng_alea("secret-seed", {state: true});
let saved_state = rng_first.state()
for (let j = 0; j < 1e5; ++j)
  rng_first();

// later

let rng_replica = prng_alea("", {state: saved_state});
for (let j = 0; j < 1e5; ++j)
  rng_replica();

```

In normal use the prng is opaque and its internal state cannot be accessed.
However, if the `state` option is provided, the prng gets a state() method
that returns a plain object the can be used to reconstruct a prng later in
the same state (by passing that saved object back as the state option).


## Unit tests

Mocha-based [live unittests](https://shanewholloway.github.io/js-esm-seedrandom/unittest.html)
for reproducability and validation of state capture and restore.

In NodeJS [unittests][gh-actions-unittests], validation of state snapshot compatability with the original [seedrandom][] CommonJS implementation is performed.

 [gh-actions-unittests]: https://github.com/shanewholloway/js-esm-seedrandom/actions?query=workflow%3A%22Node.js+CI%22

## LICENSE (MIT)

Copyright 2020 Shane Holloway. (ES Module port)
Copyright 2019 David Bau.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

