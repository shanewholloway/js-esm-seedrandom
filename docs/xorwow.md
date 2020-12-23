### `prng_xorwow`

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

