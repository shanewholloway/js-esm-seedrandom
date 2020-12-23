### `prng_tychei`

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

