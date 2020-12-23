import * as assert from 'uvu/assert'
import {test_prng_alg} from './_common.mjs'

import { prng_xor4096 } from 'esm-seedrandom'
import { prng_xor4096 as prng_xor4096_isolated } from 'esm-seedrandom/esm/xor4096.mjs'
import { prng_xor4096 as prng_xor4096_minify } from 'esm-seedrandom/esm/xor4096.min.mjs'

const cjs_prng_xor4096 = require('seedrandom/lib/xor4096.js')

describe('xor4096', () => {
  let _ans_shared = [0.6993883652612567,0.2972783006262034,0.9184850819874555]
  const snap = {
    seed: 'an example seed string',
    direct: _ans_shared,
    quick: _ans_shared,
    int32: [-1291117140, 1276800579, -350103907],
    double: [0.6993881689445022,0.9184847710401316,0.39560491763906536],
  }

  describe('shared', () =>
    test_prng_alg('xor4096', prng_xor4096, snap))

  describe('isolated', () =>
    test_prng_alg('xor4096', prng_xor4096_isolated, snap))

  describe('isolated minified', () =>
    test_prng_alg('xor4096', prng_xor4096_minify, snap))

  if (cjs_prng_xor4096)
    describe('original seedrandom (CommonJS)', () =>
      test_prng_alg('xor4096', cjs_prng_xor4096, snap))
})
