### `prng_xorshift7`

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

