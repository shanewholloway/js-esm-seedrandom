### `prng_alea`

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
