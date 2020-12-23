/*
Copyright 2019 David Bau.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/

import {_prng_restore} from './_common.mjs'

export default prng_arc4;
export function prng_arc4(seed, opts) {
  let xg = new ARC4Gen(seed);
  let prng = () => xg.next();

  prng.double = prng;

  prng.int32 = () => xg.g(4) | 0;

  prng.quick = () => xg.g(4) / 0x100000000;

  _prng_restore(prng, xg, opts);
  return prng
}


//
// ARC4
//
// An ARC4 implementation.  The constructor takes a key in the form of
// an array of at most (width) integers that should be 0 <= x < (width).
//
// The g(count) method returns a pseudorandom integer that concatenates
// the next (count) outputs from ARC4.  Its return value is a number x
// that is in the range 0 <= x < (width ^ count).
//

//
// The following constants are related to IEEE 754 limits.
//

// const width = 256 // each RC4 output is 0 <= x < 256
// const chunks = 6 // at least six RC4 outputs for each double
const _arc4_startdenom = 281474976710656     // 256 ** 6 == width ** chunks
const _arc4_significance = 4503599627370496  // 2 ** 52 significant digits in a double
const _arc4_overflow = 9007199254740992      // 2 ** 53 == significance * 2


class ARC4Gen {
  constructor(seed) {
    if (seed == null) seed = +(new Date);

    let key = this.mixkey(seed, [])
    let i,j,t, S=[], keylen = key.length
    this.i = this.j = i = j = 0
    this.S = S

    // The empty key [] is treated as [0].
    if (!keylen) { key = [keylen++]; }

    // Set up S using the standard key scheduling algorithm.
    while (i <= 0xff) {
      S[i] = i++;
    }
    for (i = 0; i <= 0xff; i++) {
      S[i] = S[j = 0xff & (j + key[i % keylen] + (t = S[i]))];
      S[j] = t;
    }

    // For robust unpredictability, the function call below automatically
    // discards an initial batch of values.  This is called RC4-drop[256].
    // See http://google.com/search?q=rsa+fluhrer+response&btnI
    this.g(256)
  }

  next() {
    // This function returns a random double in [0, 1) that contains
    // randomness in every bit of the mantissa of the IEEE 754 value.

    let n = this.g(6);                  // Start with a numerator n < 2 ^ 48
    let d = _arc4_startdenom;           //   and denominator d = 2 ^ 48.
    let x = 0;                          //   and no 'extra last byte'.

    while (n < _arc4_significance) {    // Fill up all significant digits (2 ** 52)
      n = (n + x) * 256;                //   by shifting numerator and
      d *= 256;                         //   denominator and generating a
      x = this.g(1);                    //   new least-significant-byte.
    }
    while (n >= _arc4_overflow) {       // To avoid rounding past overflow, before adding
      n /= 2;                           //   last byte, shift everything
      d /= 2;                           //   right using integer math until
      x >>>= 1;                         //   we have exactly the desired bits.
    }
    return (n + x) / d;                 // Form the number within [0, 1).
  }

  g(count) {
    // The "g" method returns the next (count) outputs as one number.
    let t, r = 0, {i,j,S} = this;
    while (count--) {
      t = S[i = 0xff & (i + 1)];
      r = r * 256 + S[0xff & ((S[i] = S[j = 0xff & (j + t)]) + (S[j] = t))];
    }
    this.i = i;
    this.j = j;
    return r;
  }

  copy(f, t) {
    t.i = f.i;
    t.j = f.j;
    t.S = [... f.S]
    return t;
  }

  mixkey(seed, key) {
    seed = seed + ''
    let smear=0, j=0;
    while (j < seed.length) {
      key[0xff & j] =
        0xff & ((smear ^= key[0xff & j] * 19) + seed.charCodeAt(j++));
    }
    return key
  }
}
