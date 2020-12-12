// A Javascript implementaion of the "xorshift7" algorithm by
// François Panneton and Pierre L'ecuyer:
// "On the Xorgshift Random Number Generators"
// http://saluc.engr.uconn.edu/refs/crypto/rng/panneton05onthexorshift.pdf

import {_prng_xor_core} from './_common.mjs'

export default prng_xorshift7
export function prng_xorshift7(seed, opts) {
  let xg = new XorShift7Gen(seed);
  return _prng_xor_core(xg, opts);
}


class XorShift7Gen {
  constructor(seed) {
    if (seed == null) seed = +(new Date);

    var j, w, x = [];

    if (seed === (seed | 0)) {
      // Seed state array using a 32-bit integer.
      w = x[0] = seed;
    } else {
      // Seed state using a string.
      seed = '' + seed;
      for (j = 0; j < seed.length; ++j) {
        x[j & 7] = (x[j & 7] << 15) ^
            (seed.charCodeAt(j) + x[(j + 1) & 7] << 13);
      }
    }

    // Enforce an array length of 8, not all zeroes.
    while (x.length < 8) x.push(0);
    for (j = 0; j < 8 && x[j] === 0; ++j);
    if (j == 8) w = x[7] = -1; else w = x[j];

    this.x = x;
    this.i = 0;

    // Discard an initial 256 values.
    for (j = 256; j > 0; --j) {
      this.next();
    }
  }

  next() {
    // Update xor generator.
    let t, v, w, {x,i} = this
    t = x[i]; t ^= (t >>> 7); v = t ^ (t << 24);
    t = x[(i + 1) & 7]; v ^= t ^ (t >>> 10);
    t = x[(i + 3) & 7]; v ^= t ^ (t >>> 3);
    t = x[(i + 4) & 7]; v ^= t ^ (t << 7);
    t = x[(i + 7) & 7]; t = t ^ (t << 13); v ^= t ^ (t << 9);
    x[i] = v;
    this.i = (i + 1) & 7;
    return v;
  };

  copy(f, t) {
    t.x = [... f.x];
    t.i = f.i;
    return t;
  }
}
