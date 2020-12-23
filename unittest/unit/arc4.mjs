import * as assert from 'uvu/assert'
import {test_prng_alg} from './_common.mjs'

import { prng_arc4 } from 'esm-seedrandom'
import { prng_arc4 as prng_arc4_isolated } from 'esm-seedrandom/esm/arc4.mjs'
import { prng_arc4 as prng_arc4_minify } from 'esm-seedrandom/esm/arc4.min.mjs'

const cjs_prng_arc4 = require('seedrandom')

describe('arc4', () => {
  let _ans_shared = [ 0.7396757600041567, 0.2125229710920903, 0.6653061318678898 ]
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

describe('arc4 with state', () => {
  let _ans_shared = [ 0.5468744446736922, 0.49507571990794474, 0.04433217638437844 ]
  const snap = {
    opt: {state: {i:122, j:135, S:[250,63,119,34,198,222,149,191,114,212,131,93,202,10,159,247,178,196,108,219,145,244,102,110,47,157,165,171,210,46,1,22,221,120,50,200,163,252,140,99,205,11,101,168,84,104,60,71,248,56,7,74,79,253,213,53,237,175,179,112,142,17,103,194,59,88,87,57,147,26,176,229,146,141,72,40,216,92,9,14,230,32,8,228,133,67,69,0,62,245,41,39,181,232,48,37,124,240,55,249,180,77,243,27,227,78,73,89,169,33,106,44,242,254,4,236,24,29,217,192,185,12,109,144,75,65,31,170,43,138,255,52,97,132,162,85,161,207,150,154,137,80,184,167,136,152,3,58,199,234,164,143,177,64,172,204,6,238,174,94,90,186,225,111,197,235,107,148,61,158,113,130,95,42,129,2,246,203,218,241,5,233,23,195,135,189,68,160,35,209,183,54,36,201,127,223,226,128,105,214,117,20,38,100,134,86,45,206,239,182,30,76,231,49,21,208,193,156,155,215,126,220,125,116,13,83,190,251,123,15,16,118,151,18,28,82,70,98,187,122,173,25,19,121,211,66,91,153,81,188,96,224,115,51,139,166]}},
    direct: _ans_shared,
    quick: [ 0.5468744444660842, 0.8916697199456394, 0.7393842963501811 ],
    int32: [ -1946159442, -465275010, -1119335924 ],
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
