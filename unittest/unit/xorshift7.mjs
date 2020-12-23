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

describe('xorshift7 with state', () => {
  let _ans_shared = [ 0.5485894610174, 0.1137475436553359, 0.2735925179440528 ]
  const snap = {
    opt: { state: { i: 0, x: [ -1534938808, 2033299828, 2137027632, -1736997815, 1638824590, 466195994, -146690448, 1900193694 ]}},
    direct: _ans_shared,
    quick: _ans_shared,
    int32: [ -1938793502, 488541980, 1175070917 ],
    double: [ 0.5485892838227957, 0.27359278181790225, 0.27243765569291334 ]
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
