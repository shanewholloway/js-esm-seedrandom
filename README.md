# esm-seedrandom

Seeded random number generator for JavaScript, ported to ES Modules.

* Version: 3.0.5
* Author: David Bau
* Date: 2019-09-14
* ES Modules port in 2020-12 by Shane Holloway


## Use

```html
<script type="module">
  import {prng_alea} from '//cdn.jsdelivr.net/npm/esm-seedrandom/esm/alea.min.mjs'

  let myrng = prng_alea('an example seed string')

  console.log(myrng()); // Always 0.2594452982302755
  console.log(myrng()); // Always 0.8249292692635208
  console.log(myrng()); // Always 0.42271768930368125

  // Use "quick" to get only 32 bits of randomness in a float.
  console.log(myrng.quick()); // Always 0.9041450754739344
  console.log(myrng.quick()); // Always 0.2318330816924572

  // Use "int32" to get a 32 bit (signed) integer
  console.log(myrng.int32()); // Always -837787218
  console.log(myrng.int32()); // Always 436021751

  console.log(myrng.double()); // Always 0.11515812985359886
  console.log(myrng.double()); // Always 0.5701184166211825
</script>
```


## Fast PRNG Algorithms

The package includes several fast PRNGs.  To use Johannes Baagøe's extremely fast Alea PRNG:


```js
// Use alea for Johannes Baagøe's clever and fast floating-point RNG.
import {prng_alea} from 'esm-seedrandom';
let arng = prng_alea('hello.');

// By default provides 32 bits of randomness in a float.
console.log(arng());               // Always 0.4783254903741181

// Use "double" to get 56 bits of randomness.
console.log(arng.double());        // Always 0.8297006866124559

// Use "int32" to get a 32 bit (signed) integer.
console.log(arng.int32());         // Always 1076136327
```


|PRNG name       | Time vs native | Period      | Author               |
|----------------|----------------|-------------|----------------------|
|`prng_alea`     |  1.95 ns, 0.9x | ~2^116      | Baagøe               |
|`prng_xor128`   |  2.04 ns, 0.9x | 2^128-1     | Marsaglia            |
|`prng_tychei`   |  2.32 ns, 1.1x | ~2^127      | Neves/Araujo (ChaCha)|
|`prng_xorwow`   |  2.40 ns, 1.1x | 2^192-2^32  | Marsaglia            |
|`prng_xor4096`  |  2.40 ns, 1.1x | 2^4096-2^32 | Brent (xorgens)      |
|`prng_xorshift7`|  2.64 ns, 1.3x | 2^256-1     | Panneton/L'ecuyer    |
|`prng_arc4`     |  3.80 ns, 1.8x | ~2^1600     | Bau (ARC4)           |


## Docs

```sh
npm install esm-seedrandom
```

or in HTML,

```html
```

#### Saving & Restoring PRNG state

```js
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
However, if the "state" option is specified, the prng gets a state() method
that returns a plain object the can be used to reconstruct a prng later in
the same state (by passing that saved object back as the state option).



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

