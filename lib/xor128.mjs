// A Javascript implementaion of the "xor128" prng algorithm by
// George Marsaglia.  See http://www.jstatsoft.org/v08/i14/paper

import {_prng_xor_core} from './_common.mjs'

export default prng_xor128;
export function prng_xor128(seed, opts) {
  let xg = new Xor128Gen(seed);
  return _prng_xor_core(xg, opts);
}

class Xor128Gen {
  constructor(seed) {
    if (seed == null) seed = +(new Date);

    let strseed = '';

    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.w = 0;

    if (seed === (seed | 0)) {
      // Integer seed.
      this.x = seed;
    } else {
      // String seed.
      strseed += seed;
    }

    // Mix in string seed, then discard an initial batch of 64 values.
    for (let k = 0; k < strseed.length + 64; k++) {
      this.x ^= strseed.charCodeAt(k) | 0;
      this.next();
    }
  }

  next() {
    let {x,y,z,w} = this
    let t = x ^ (x << 11);
    this.x = y;
    this.y = z;
    this.z = w;
    return this.w = w ^ ((w >>> 19) ^ t ^ (t >>> 8));
  };

  copy(f, t) {
    t.x = f.x;
    t.y = f.y;
    t.z = f.z;
    t.w = f.w;
    return t;
  }
}

