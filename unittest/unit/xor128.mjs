import * as assert from 'uvu/assert'
import {test_prng_alg} from './_common.mjs'

import { prng_xor128 } from 'esm-seedrandom'
import { prng_xor128 as prng_xor128_isolated } from 'esm-seedrandom/esm/xor128.mjs'
import { prng_xor128 as prng_xor128_minify } from 'esm-seedrandom/esm/xor128.min.mjs'

const cjs_prng_xor128 = require('seedrandom/lib/xor128.js')

describe('xor128', () => {
  let _ans_shared = [0.9560257731936872,0.6461276928894222,0.3774650595150888]
  const snap = {
    seed: 'an example seed string',
    direct: _ans_shared,
    quick: _ans_shared,
    int32: [-188867866, -1519869986, 1621200086],
    double: [0.9560259085310425,0.37746513052634856,0.7683549630822994],
  }

  describe('shared', () =>
    test_prng_alg('xor128', prng_xor128, snap))

  describe('isolated', () =>
    test_prng_alg('xor128', prng_xor128_isolated, snap))

  describe('isolated minified', () =>
    test_prng_alg('xor128', prng_xor128_minify, snap))

  if (cjs_prng_xor128)
    describe('original seedrandom (CommonJS)', () =>
      test_prng_alg('xor128', cjs_prng_xor128, snap))
})
