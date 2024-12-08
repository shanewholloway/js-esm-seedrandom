import rpi_resolve from '@rollup/plugin-node-resolve';

const plugins = [ rpi_resolve() ]

export default [
  { input: `unittest.js`, plugins,
    output: { file: `dist/mocha_unittest.cjs.js`, format: 'cjs', sourcemap: false }},

  { input: `unittest.js`, plugins,
    output: { file: `dist/browser_unittest.iife.js`, format: 'iife', name: `test_esm_seedrandom`, sourcemap: false }},
]
