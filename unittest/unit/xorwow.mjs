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
