# esm-seedrandom API

## Fast PRNG Algorithms

### alea

alea, a 53-bit multiply-with-carry generator by Johannes Baagøe.

- **Period:** `~2^116`
- **Reported to pass:** all BigCrush tests.

```javascript
import {prng_alea} from 'esm-seedrandom'
import {prng_alea} from 'esm-seedrandom/esm/alea.mjs'
import prng_alea from 'esm-seedrandom/esm/alea.mjs'

// from a browser or deno environment
import {prng_alea} from '//cdn.jsdelivr.net/npm/esm-seedrandom/esm/index.min.mjs'
import {prng_alea} from '//cdn.jsdelivr.net/npm/esm-seedrandom/esm/alea.min.mjs'


let myrng = prng_alea('an example seed string', {state: true})

console.log(myrng()); // between 0.0 and 1.0 as f32
console.log(myrng.quick()); // between 0.0 and 1.0 as f32
console.log(myrng.double()); // between 0.0 and 1.0 as f64
console.log(myrng.int32()); // between -2147483648 and 2147483647


let mystate = myrng.state()
console.log(mystate); // a JSON-serializable object capturing the internal PRNG state

let dup_myrng = prng_alea(null, {state: mystate})
```

### xor128

xor128, a pure xor-shift generator by George Marsaglia.

- **Period:** `2^128-1`.
- **Reported to fail:** MatrixRank and LinearComp.

```javascript
import {prng_xor128} from 'esm-seedrandom'
import {prng_xor128} from 'esm-seedrandom/esm/index.mjs'
import prng_xor128 from 'esm-seedrandom/esm/index.mjs'

// from a browser or deno environment
import {prng_xor128} from '//cdn.jsdelivr.net/npm/esm-seedrandom/esm/index.min.mjs'
import {prng_xor128} from '//cdn.jsdelivr.net/npm/esm-seedrandom/esm/xor128.min.mjs'


let myrng = prng_xor128('an example seed string', {state: true})

console.log(myrng()); // between 0.0 and 1.0 as f32
console.log(myrng.quick()); // between 0.0 and 1.0 as f32
console.log(myrng.double()); // between 0.0 and 1.0 as f64
console.log(myrng.int32()); // between -2147483648 and 2147483647


let mystate = myrng.state()
console.log(mystate); // a JSON-serializable object capturing the internal PRNG state

let dup_myrng = prng_xor128(null, {state: mystate})
```

### tychei

[Tyche-i, by Samuel Neves and Filipe Araujo][tychei-paper], is a bit-shifting random
number generator derived from ChaCha, a modern stream cipher.


- **Period:** ~2^127
- **Reported to pass:** No systematic BigCrush failures reported.

 [tychei-paper]: https://eden.dei.uc.pt/~sneves/pubs/2011-snfa2.pdf

```javascript
import {prng_tychei} from 'esm-seedrandom'
import {prng_tychei} from 'esm-seedrandom/esm/tychei.mjs'
import prng_tychei from 'esm-seedrandom/esm/tychei.mjs'

// from a browser or deno environment
import {prng_tychei} from '//cdn.jsdelivr.net/npm/esm-seedrandom/esm/index.min.mjs'
import {prng_tychei} from '//cdn.jsdelivr.net/npm/esm-seedrandom/esm/tychei.min.mjs'


let myrng = prng_tychei('an example seed string', {state: true})

console.log(myrng()); // between 0.0 and 1.0 as f32
console.log(myrng.quick()); // between 0.0 and 1.0 as f32
console.log(myrng.double()); // between 0.0 and 1.0 as f64
console.log(myrng.int32()); // between -2147483648 and 2147483647


let mystate = myrng.state()
console.log(mystate); // a JSON-serializable object capturing the internal PRNG state

let dup_myrng = prng_tychei(null, {state: mystate})
```

### xorwow

xorwow, George Marsaglia's 160-bit xor-shift combined plus weyl.

- **Period:** 2^192-2^32
- **Reported to fail:** CollisionOver, SimpPoker, and LinearComp.

```javascript
import {prng_xorwow} from 'esm-seedrandom'
import {prng_xorwow} from 'esm-seedrandom/esm/xorwow.mjs'
import prng_xorwow from 'esm-seedrandom/esm/xorwow.mjs'

// from a browser or deno environment
import {prng_xorwow} from '//cdn.jsdelivr.net/npm/esm-seedrandom/esm/index.min.mjs'
import {prng_xorwow} from '//cdn.jsdelivr.net/npm/esm-seedrandom/esm/xorwow.min.mjs'


let myrng = prng_xorwow('an example seed string', {state: true})

console.log(myrng()); // between 0.0 and 1.0 as f32
console.log(myrng.quick()); // between 0.0 and 1.0 as f32
console.log(myrng.double()); // between 0.0 and 1.0 as f64
console.log(myrng.int32()); // between -2147483648 and 2147483647


let mystate = myrng.state()
console.log(mystate); // a JSON-serializable object capturing the internal PRNG state

let dup_myrng = prng_xorwow(null, {state: mystate})
```

### xor4096

xor4096, by Richard Brent, is a 4096-bit xor-shift with a
very long period that also adds a Weyl generator. It also passes
BigCrush with no systematic failures.  Its long period may
be useful if you have many generators and need to avoid
collisions.

- **Period:** 2^4128-2^32.
- **Reported to pass:** No systematic BigCrush failures reported.

```javascript
import {prng_xor4096} from 'esm-seedrandom'
import {prng_xor4096} from 'esm-seedrandom/esm/xor4096.mjs'
import prng_xor4096 from 'esm-seedrandom/esm/xor4096.mjs'

// from a browser or deno environment
import {prng_xor4096} from '//cdn.jsdelivr.net/npm/esm-seedrandom/esm/index.min.mjs'
import {prng_xor4096} from '//cdn.jsdelivr.net/npm/esm-seedrandom/esm/xor4096.min.mjs'


let myrng = prng_xor4096('an example seed string', {state: true})

console.log(myrng()); // between 0.0 and 1.0 as f32
console.log(myrng.quick()); // between 0.0 and 1.0 as f32
console.log(myrng.double()); // between 0.0 and 1.0 as f64
console.log(myrng.int32()); // between -2147483648 and 2147483647


let mystate = myrng.state()
console.log(mystate); // a JSON-serializable object capturing the internal PRNG state

let dup_myrng = prng_xor4096(null, {state: mystate})
```

### xorshift7

xorshift7, by François Panneton and Pierre L'ecuyer, takes
a different approach: it adds robustness by allowing more shifts
than Marsaglia's original three.  It is a 7-shift generator
with 256 bits, that passes BigCrush with no systmatic failures.

- **Period:** 2^256-1.
- **Reported to pass:** No systematic BigCrush failures reported.

```javascript
import {prng_xorshift7} from 'esm-seedrandom'
import {prng_xorshift7} from 'esm-seedrandom/esm/xorshift7.mjs'
import prng_xorshift7 from 'esm-seedrandom/esm/xorshift7.mjs'

// from a browser or deno environment
import {prng_xorshift7} from '//cdn.jsdelivr.net/npm/esm-seedrandom/esm/index.min.mjs'
import {prng_xorshift7} from '//cdn.jsdelivr.net/npm/esm-seedrandom/esm/xorshift7.min.mjs'


let myrng = prng_xorshift7('an example seed string', {state: true})

console.log(myrng()); // between 0.0 and 1.0 as f32
console.log(myrng.quick()); // between 0.0 and 1.0 as f32
console.log(myrng.double()); // between 0.0 and 1.0 as f64
console.log(myrng.int32()); // between -2147483648 and 2147483647


let mystate = myrng.state()
console.log(mystate); // a JSON-serializable object capturing the internal PRNG state

let dup_myrng = prng_xorshift7(null, {state: mystate})
```

### arc4

The original ARC4-based prng included in the [seedrandom][] library.

- **Period:** ~2^1600

 [seedrandom]: https://github.com/davidbau/seedrandom

```javascript
import {prng_arc4} from 'esm-seedrandom'
import {prng_arc4} from 'esm-seedrandom/esm/arc4.mjs'
import prng_arc4 from 'esm-seedrandom/esm/arc4.mjs'

// from a browser or deno environment
import {prng_arc4} from '//cdn.jsdelivr.net/npm/esm-seedrandom/esm/index.min.mjs'
import {prng_arc4} from '//cdn.jsdelivr.net/npm/esm-seedrandom/esm/arc4.min.mjs'


let myrng = prng_arc4('an example seed string', {state: true})

console.log(myrng()); // between 0.0 and 1.0 as f64
console.log(myrng.quick()); // between 0.0 and 1.0 as f32
console.log(myrng.double()); // between 0.0 and 1.0 as f64
console.log(myrng.int32()); // between -2147483648 and 2147483647


let mystate = myrng.state()
console.log(mystate); // a JSON-serializable object capturing the internal PRNG state

let dup_myrng = prng_arc4(null, {state: mystate})
```


## Common API

### Construction

```javascript
let prng = prng_algorithm('your own seed string')

// or to allow state capture:
let prng = prng_algorithm('your own seed string', {state: true})

// or to restore state:
let state = JSON.parse( your_load_from_storage_impl() )
let prng = prng_algorithm('your own seed string', {state: state})
```

### Floating point numbers between 0.0 and 1.0

`prng.quick()` returns a pseudo random number between 0.0 and 1.0 with enough bits for a 32-bit floating point.

`prng.double()` returns a pseudo random number between 0.0 and 1.0 with enough bits for a 64-bit floating point.

`prng()` is an alias for `prng.quick()` for most algorithms.
The ARC4 algorithm aliases `prng()` to `prng.double()`.

### 32-bit Integers

`prng.int32()` returns a pseudo random number between -2147483648 and 2147483647 for a 32-bit signed integer.


### State capture

`prng.state()` returns JSON serializable object used to reinitialize the PRNG algorithm to the same state.

##### Save State

```javascript
let prng = prng_algorithm('your own seed string', {state: true})

let state = JSON.stringify( prng.state() )
your_save_to_storage_impl(state)
```

##### Restore State

```javascript
let state = JSON.parse( your_load_from_storage_impl() )
let prng = prng_algorithm(null, {state})
```

