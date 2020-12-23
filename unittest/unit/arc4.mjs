import * as assert from 'uvu/assert'
import {test_prng_alg} from './_common.mjs'

import { prng_arc4 } from 'esm-seedrandom'
import { prng_arc4 as prng_arc4_isolated } from 'esm-seedrandom/esm/arc4.mjs'
import { prng_arc4 as prng_arc4_minify } from 'esm-seedrandom/esm/arc4.min.mjs'

const cjs_prng_arc4 = require('seedrandom')

describe('arc4', () => {
  let _ans_shared =
    [ 0.7396757600041567, 0.2125229710920903, 0.6653061318678898 ]
  const snap = {
    seed: 'an example seed string',
    direct: _ans_shared,
    quick: [0.7396757598035038,0.8617978817783296,0.4058805995155126],
    int32: [-1118084098,-593573578,1743243901],
    double: _ans_shared,
  }

  describe('shared', () =>
    test_prng_alg('arc4', prng_arc4, snap))

  describe('isolated', () =>
    test_prng_alg('arc4', prng_arc4_isolated, snap))

  describe('isolated minified', () =>
    test_prng_alg('arc4', prng_arc4_minify, snap))

  if (cjs_prng_arc4)
    describe('original seedrandom (CommonJS)', () =>
      test_prng_alg('arc4', cjs_prng_arc4, snap))
})
