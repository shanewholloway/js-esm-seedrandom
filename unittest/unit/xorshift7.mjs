import * as assert from 'uvu/assert'
import {test_prng_alg} from './_common.mjs'

import { prng_xorshift7 } from 'esm-seedrandom'
import { prng_xorshift7 as prng_xorshift7_isolated } from 'esm-seedrandom/esm/xorshift7.mjs'
import { prng_xorshift7 as prng_xorshift7_minify } from 'esm-seedrandom/esm/xorshift7.min.mjs'

const cjs_prng_xorshift7 = require('seedrandom/lib/xorshift7.js')

describe('xorshift7', () => {
  let _ans_shared = [0.2192698367871344,0.8553422808181494,0.2642597162630409]
  const snap = {
    seed: 'an example seed string',
    direct: _ans_shared,
    quick: _ans_shared,
    int32: [ 941756778, -621300173, 1134986839 ],
    double: [0.21927016036142388,0.2642595533104317,0.3881930901075237],
  }

  describe('shared', () =>
    test_prng_alg('xorshift7', prng_xorshift7, snap))

  describe('isolated', () =>
    test_prng_alg('xorshift7', prng_xorshift7_isolated, snap))

  describe('isolated minified', () =>
    test_prng_alg('xorshift7', prng_xorshift7_minify, snap))

  if (cjs_prng_xorshift7)
    describe('original seedrandom (CommonJS)', () =>
      test_prng_alg('xorshift7', cjs_prng_xorshift7, snap))
})
