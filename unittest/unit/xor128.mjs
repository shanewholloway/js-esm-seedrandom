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

describe('xor128 with state', () => {
  let _ans_shared = [ 0.1681680935434997, 0.5715856794267893, 0.9688262098934501 ]
  const snap = {
    opt: {state: {"x":2129486936,"y":1018211045,"z":-1036713708,"w":1054309448}},
    direct: _ans_shared,
    quick: _ans_shared,
    int32: [ 722276462, -1840025496, -133890409 ],
    double: [ 0.16816834048541995, 0.9688260512550894, 0.24403439393014414 ],
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
