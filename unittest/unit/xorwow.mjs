import * as assert from 'uvu/assert'
import {test_prng_alg} from './_common.mjs'

import { prng_xorwow } from 'esm-seedrandom'
import { prng_xorwow as prng_xorwow_isolated } from 'esm-seedrandom/esm/xorwow.mjs'
import { prng_xorwow as prng_xorwow_minify } from 'esm-seedrandom/esm/xorwow.min.mjs'

const cjs_prng_xorwow = require('seedrandom/lib/xorwow.js')

describe('xorwow', () => {
  let _ans_shared = [0.5758649727795273,0.23727833456359804,0.37159455730579793]

  const snap = {
    seed: 'an example seed string',
    direct: _ans_shared,
    quick: _ans_shared,
    int32: [ -1821646071, 1019102687, 1595986471 ],
    double: [0.5758649050132439,0.37159468988193467,0.9183901875866184],
  }

  describe('shared', () =>
    test_prng_alg('xorwow', prng_xorwow, snap))

  describe('isolated', () =>
    test_prng_alg('xorwow', prng_xorwow_isolated, snap))

  describe('isolated minified', () =>
    test_prng_alg('xorwow', prng_xorwow_minify, snap))

  if (cjs_prng_xorwow)
    describe('original seedrandom (CommonJS)', () =>
      test_prng_alg('xorwow', cjs_prng_xorwow, snap))
})

describe('xorwow with state', () => {
  let _ans_shared = [ 0.9834630433470011, 0.34372456138953567, 0.5046766495797783 ]
  const snap = {
    opt: {state: {"x":733911711,"y":1463434334,"z":-1393983784,"w":-1618969858,"v":-698200019,"d":671784302}},
    direct: _ans_shared,
    quick: _ans_shared,
    int32: [ -71025688, 1476285750, -2127397591 ],
    double: [ 0.9834629744170005, 0.5046764181761018, 0.31689916339742574 ],
  }

  describe('shared', () =>
    test_prng_alg('xorwow', prng_xorwow, snap))

  describe('isolated', () =>
    test_prng_alg('xorwow', prng_xorwow_isolated, snap))

  describe('isolated minified', () =>
    test_prng_alg('xorwow', prng_xorwow_minify, snap))

  if (cjs_prng_xorwow)
    describe('original seedrandom (CommonJS)', () =>
      test_prng_alg('xorwow', cjs_prng_xorwow, snap))
})
