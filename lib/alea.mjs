// A port of an algorithm by Johannes Baagøe <baagoe@baagoe.com>, 2010
// http://baagoe.com/en/RandomMusings/javascript/
// https://github.com/nquinlan/better-random-numbers-for-javascript-mirror
// Original work is under MIT license -

// Copyright (C) 2010 by Johannes Baagøe <baagoe@baagoe.org>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import {_prng_restore} from './_common.mjs'

export default prng_alea;
export function prng_alea(seed, opts) {
  let xg = new AleaGen(seed);

  let prng = () => xg.next();

  prng.double = () =>
    prng() + (prng() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53

  prng.int32 = () => (xg.next() * 0x100000000) | 0;

  prng.quick = prng;

  _prng_restore(prng, xg, opts);
  return prng
}

class AleaGen {
  constructor(seed) {
    if (seed == null) seed = +(new Date);

    let n = 0xefc8249d;

    // Apply the seeding algorithm from Baagoe.
    this.c = 1;
    this.s0 = mash(' ');
    this.s1 = mash(' ');
    this.s2 = mash(' ');
    this.s0 -= mash(seed);
    if (this.s0 < 0) { this.s0 += 1; }
    this.s1 -= mash(seed);
    if (this.s1 < 0) { this.s1 += 1; }
    this.s2 -= mash(seed);
    if (this.s2 < 0) { this.s2 += 1; }

    function mash(data) {
      data = String(data);
      for (let i = 0; i < data.length; i++) {
        n += data.charCodeAt(i);
        let h = 0.02519603282416938 * n;
        n = h >>> 0;
        h -= n;
        h *= n;
        n = h >>> 0;
        h -= n;
        n += h * 0x100000000; // 2^32
      }
      return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
    }
  }

  next() {
    let {c,s0,s1,s2} = this
    let t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
    this.s0 = s1;
    this.s1 = s2;
    return this.s2 = t - (this.c = t | 0);
  }

  copy(f, t) {
    t.c = f.c;
    t.s0 = f.s0;
    t.s1 = f.s1;
    t.s2 = f.s2;
    return t;
  }
}
