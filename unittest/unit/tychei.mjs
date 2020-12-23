import * as assert from 'uvu/assert'
import {test_prng_alg} from './_common.mjs'

import { prng_tychei } from 'esm-seedrandom'
import { prng_tychei as prng_tychei_isolated } from 'esm-seedrandom/esm/tychei.mjs'
import { prng_tychei as prng_tychei_minify } from 'esm-seedrandom/esm/tychei.min.mjs'

const cjs_prng_tychei = require('seedrandom/lib/tychei.js')

describe('tychei', () => {
  let _ans_shared = [0.8043622805271298,0.32537893974222243,0.3481273828074336]
  const snap = {
    seed: 'an example seed string',
    direct: _ans_shared,
    quick: _ans_shared,
    int32: [-840257607,1397491905,1495195724],
    double: [0.8043619753737162,0.3481274036560348,0.12684038641910578],
  }


  describe('shared', () =>
    test_prng_alg('tychei', prng_tychei, snap))

  describe('isolated', () =>
    test_prng_alg('tychei', prng_tychei_isolated, snap))

  describe('isolated minified', () =>
    test_prng_alg('tychei', prng_tychei_minify, snap))

  if (cjs_prng_tychei)
    describe('original seedrandom (CommonJS)', () =>
      test_prng_alg('tychei', cjs_prng_tychei, snap))
})

describe('tychei with state', () => {
  let _ans_shared = [ 0.9540062851738185, 0.14673241949640214, 0.15592244057916105 ]
  const snap = {
    opt: {state: {"a":1114141776,"b":1081436905,"c":2079925175,"d":1230677184}},

    direct: _ans_shared,
    quick: _ans_shared,
    int32: [ -197541501, 630210943, 669681783 ],
    double: [ 0.9540062650358293, 0.15592288850046654, 0.6584937794035384 ],
  }


  describe('shared', () =>
    test_prng_alg('tychei', prng_tychei, snap))

  describe('isolated', () =>
    test_prng_alg('tychei', prng_tychei_isolated, snap))

  describe('isolated minified', () =>
    test_prng_alg('tychei', prng_tychei_minify, snap))

  if (cjs_prng_tychei)
    describe('original seedrandom (CommonJS)', () =>
      test_prng_alg('tychei', cjs_prng_tychei, snap))
})
