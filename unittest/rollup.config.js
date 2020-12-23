import rpi_resolve from '@rollup/plugin-node-resolve';

const plugins = [ rpi_resolve() ]

export default [
  { input: `unittest.mjs`, plugins,
    output: { file: `mocha_unittest.cjs.js`, format: 'cjs', sourcemap: false }},

  { input: `unittest.mjs`, plugins,
    output: { file: `browser_unittest.iife.js`, format: 'iife', name: `test_esm_seedrandom`, sourcemap: false }},
]
