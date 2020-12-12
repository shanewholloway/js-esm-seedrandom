// A Javascript implementaion of the "Tyche-i" prng algorithm by
// Samuel Neves and Filipe Araujo.
// See https://eden.dei.uc.pt/~sneves/pubs/2011-snfa2.pdf

import {_prng_xor_core} from './_common.mjs'

export default prng_tychei
export function prng_tychei(seed, opts) {
  let xg = new TycheiGen(seed);
  return _prng_xor_core(xg, opts);
}

class TycheiGen {
  constructor(seed) {
    if (seed == null) seed = +(new Date);

    let strseed = '';

    this.a = 0;
    this.b = 0;
    this.c = 2654435769 | 0;
    this.d = 1367130551;

    if (seed === Math.floor(seed)) {
      // Integer seed.
      this.a = (seed / 0x100000000) | 0;
      this.b = seed | 0;
    } else {
      // String seed.
      strseed += seed;
    }

    // Mix in string seed, then discard an initial batch of 64 values.
    for (let k = 0; k < strseed.length + 20; k++) {
      this.b ^= strseed.charCodeAt(k) | 0;
      this.next();
    }
  }

  next() {
    let {a,b,c,d} = this
    b = (b << 25) ^ (b >>> 7) ^ c;
    c = (c - d) | 0;
    d = (d << 24) ^ (d >>> 8) ^ a;
    a = (a - b) | 0;
    this.b = b = (b << 20) ^ (b >>> 12) ^ c;
    this.c = c = (c - d) | 0;
    this.d = (d << 16) ^ (c >>> 16) ^ a;
    return this.a = (a - b) | 0;
  };

  copy(f, t) {
    t.a = f.a;
    t.b = f.b;
    t.c = f.c;
    t.d = f.d;
    return t;
  }
}


/* The following is non-inverted tyche, which has better internal
 * bit diffusion, but which is about 25% slower than tyche-i in JS.
 *

class TycheiGenAlt extends TycheiGen {
  next() {
    let {a,b,c,d} = this
    a = (a + b | 0) >>> 0;
    d = d ^ a; d = d << 16 ^ d >>> 16;
    c = c + d | 0;
    b = b ^ c; b = b << 12 ^ d >>> 20;
    this.a = a = a + b | 0;
    d = d ^ a; this.d = d = d << 8 ^ d >>> 24;
    this.c = c = c + d | 0;
    b = b ^ c;
    return this.b = (b << 7 ^ b >>> 25);
  }
}
*/
