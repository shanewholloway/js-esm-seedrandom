import rpi_commonjs from '@rollup/plugin-commonjs'
import rpi_resolve from '@rollup/plugin-node-resolve';

const plugins = [ rpi_resolve(), rpi_commonjs() ]

export default [
  { input: `unittest.mjs`, plugins,
    output: { file: `__unittest.cjs.js`, format: 'cjs', sourcemap: 'inline' }},

  { input: `unittest.mjs`, plugins,
    output: { file: `__unittest.iife.js`, format: 'iife', name: `test_esm_seedrandom`, sourcemap: 'inline' }},
]
