// A Javascript implementaion of the "xorwow" prng algorithm by
// George Marsaglia.  See http://www.jstatsoft.org/v08/i14/paper

import {_prng_xor_core} from './_common.mjs'

export default prng_xorwow
export function prng_xorwow(seed, opts) {
  let xg = new XorWowGen(seed);
  return _prng_xor_core(xg, opts);
}

class XorWowGen {
  constructor(seed) {
    if (seed == null) seed = +(new Date);

    let strseed = '';

    this.x = 0;
    this.y = 0;
    this.z = 0;
    this.w = 0;
    this.v = 0;

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
      if (k == strseed.length) {
        this.d = this.x << 10 ^ this.x >>> 4;
      }
      this.next();
    }
  }

  next() {
    let {x,y,z,w,v,d} = this
    let t = (x ^ (x >>> 2));
    this.x = y;
    this.y = z;
    this.z = w;
    this.w = v;
    return (this.d = (d + 362437 | 0)) +
       (this.v = (v ^ (v << 4)) ^ (t ^ (t << 1))) | 0;
  };

  copy(f, t) {
    t.x = f.x;
    t.y = f.y;
    t.z = f.z;
    t.w = f.w;
    t.v = f.v;
    t.d = f.d;
    return t;
  }
}
