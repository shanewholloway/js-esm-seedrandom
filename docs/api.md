# esm-seedrandom API

## Fast PRNG Algorithms

|PRNG name         | Period      | Author               |
|------------------|-------------|----------------------|
|[prng_alea][]     | ~2^116      | Baagøe               |
|[prng_xor128][]   | 2^128-1     | Marsaglia            |
|[prng_tychei][]   | ~2^127      | Neves/Araujo (ChaCha)|
|[prng_xorwow][]   | 2^192-2^32  | Marsaglia            |
|[prng_xor4096][]  | 2^4096-2^32 | Brent (xorgens)      |
|[prng_xorshift7][]| 2^256-1     | Panneton/L'ecuyer    |
|[prng_arc4][]     | ~2^1600     | Bau (ARC4)           |

 [prng_alea]: ./alea.md
 [prng_xor128]: ./xor128.md
 [prng_tychei]: ./tychei.md
 [prng_xorwow]: ./xorwow.md
 [prng_xor4096]: ./xor4096.md
 [prng_xorshift7]: ./xorshift7.md
 [prng_arc4]: ./arc4.md


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

