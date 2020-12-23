### `prng_arc4`

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

