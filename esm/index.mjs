function _prng_restore(prng, xg, opts) {
  let state = opts && opts.state;
  if (state) {
    if (typeof(state) == 'object') xg.copy(state, xg);
    prng.state = () => xg.copy(xg, {});
  }
}

function _prng_xor_core(xg, opts) {
  let prng = () => (xg.next() >>> 0) / 0x100000000;

  prng.double = () => {
    let top, bot, result;
    do {
      top = xg.next() >>> 11;
      bot = (xg.next() >>> 0) / 0x100000000;
      result = (top + bot) / (1 << 21);
    } while (result === 0);
    return result;
  };

  prng.int32 = () => xg.next() | 0;

  prng.quick = prng;

  _prng_restore(prng, xg, opts);
  return prng;
}

// A port of an algorithm by Johannes Baagøe <baagoe@baagoe.com>, 2010
function prng_alea(seed, opts) {
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
    let {c,s0,s1,s2} = this;
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

// A Javascript implementaion of the "xor128" prng algorithm by
function prng_xor128(seed, opts) {
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
    let {x,y,z,w} = this;
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

// A Javascript implementaion of the "xorwow" prng algorithm by
function prng_xorwow(seed, opts) {
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
    let {x,y,z,w,v,d} = this;
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

// A Javascript implementaion of the "xorshift7" algorithm by
function prng_xorshift7(seed, opts) {
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
    let t, v, {x,i} = this;
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

// A Javascript implementaion of Richard Brent's Xorgens xor4096 algorithm.
function prng_xor4096(seed, opts) {
  let xg = new Xor4096Gen(seed);
  return _prng_xor_core(xg, opts);
}


class Xor4096Gen {
  constructor(seed) {
    if (seed == null) seed = +(new Date);

    let t, v, i, j, w, X = [], limit = 128;
    if (seed === (seed | 0)) {
      // Numeric seeds initialize v, which is used to generates X.
      v = seed;
      seed = null;
    } else {
      // String seeds are mixed into v and X one character at a time.
      seed = seed + '\0';
      v = 0;
      limit = Math.max(limit, seed.length);
    }
    // Initialize circular array and weyl value.
    for (i = 0, j = -32; j < limit; ++j) {
      // Put the unicode characters into the array, and shuffle them.
      if (seed) v ^= seed.charCodeAt((j + 32) % seed.length);
      // After 32 shuffles, take v as the starting w value.
      if (j === 0) w = v;
      v ^= v << 10;
      v ^= v >>> 15;
      v ^= v << 4;
      v ^= v >>> 13;
      if (j >= 0) {
        w = (w + 0x61c88647) | 0;     // Weyl.
        t = (X[j & 127] ^= (v + w));  // Combine xor and weyl to init array.
        i = (0 == t) ? i + 1 : 0;     // Count zeroes.
      }
    }
    // We have detected all zeroes; make the key nonzero.
    if (i >= 128) {
      X[(seed && seed.length || 0) & 127] = -1;
    }
    // Run the generator 512 times to further mix the state before using it.
    // Factoring this as a function slows the main generator, so it is just
    // unrolled here.  The weyl generator is not advanced while warming up.
    i = 127;
    for (j = 4 * 128; j > 0; --j) {
      v = X[(i + 34) & 127];
      t = X[i = ((i + 1) & 127)];
      v ^= v << 13;
      t ^= t << 17;
      v ^= v >>> 15;
      t ^= t >>> 12;
      X[i] = v ^ t;
    }
    // Storing state as object members is faster than using closure variables.
    this.w = w;
    this.X = X;
    this.i = i;
  }

  next() {
    let t, v, {w, X, i} = this;
    // Update Weyl generator.
    this.w = w = (w + 0x61c88647) | 0;
    // Update xor generator.
    v = X[(i + 34) & 127];
    t = X[i = ((i + 1) & 127)];
    v ^= v << 13;
    t ^= t << 17;
    v ^= v >>> 15;
    t ^= t >>> 12;
    // Update Xor generator array state.
    v = X[i] = v ^ t;
    this.i = i;
    // Result is the combination.
    return (v + (w ^ (w >>> 16))) | 0;
  }

  copy(f, t) {
    t.i = f.i;
    t.w = f.w;
    t.X = [... f.X];
    return t;
  }
}

// A Javascript implementaion of the "Tyche-i" prng algorithm by
function prng_tychei(seed, opts) {
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
    let {a,b,c,d} = this;
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
function prng_arc4(seed, opts) {
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
const _arc4_startdenom = 281474976710656;     // 256 ** 6 == width ** chunks
const _arc4_significance = 4503599627370496;  // 2 ** 52 significant digits in a double
const _arc4_overflow = 9007199254740992;      // 2 ** 53 == significance * 2


class ARC4Gen {
  constructor(seed) {
    if (seed == null) seed = +(new Date);

    let key = this.mixkey(seed, []);
    let i,j,t, S=[], keylen = key.length;
    this.i = this.j = i = j = 0;
    this.S = S;

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
    this.g(256);
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
    t.S = [... f.S];
    return t;
  }

  mixkey(seed, key) {
    seed = seed + '';
    let smear=0, j=0;
    while (j < seed.length) {
      key[0xff & j] =
        0xff & ((smear ^= key[0xff & j] * 19) + seed.charCodeAt(j++));
    }
    return key
  }
}

export { prng_alea, prng_arc4, prng_tychei, prng_xor128, prng_xor4096, prng_xorshift7, prng_xorwow };
//# sourceMappingURL=index.mjs.map
