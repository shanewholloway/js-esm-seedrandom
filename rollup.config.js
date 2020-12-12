import { terser as rpi_terser } from 'rollup-plugin-terser'


const _cfg_ = { plugins: [] }
const _cfg_min_ = { ... _cfg_,
  plugins: [ ... _cfg_.plugins, rpi_terser() ]}

export default [
  ... add_mjs('index'),

  ... add_mjs('alea'),
  ... add_mjs('tychei'),
  ... add_mjs('xor128'),
  ... add_mjs('xor4096'),
  ... add_mjs('xorshift7'),
  ... add_mjs('xorwow'),
  ... add_mjs('arc4'),
]

function add_mjs(source, dest=source) {
  return [
    { ..._cfg_, input: `lib/${source}.mjs`,
      output: { file: `esm/${dest}.mjs`, format: 'es', sourcemap: true }},

    { ... _cfg_min_, input: `lib/${source}.mjs`,
      output: { file: `esm/${dest}.min.mjs`, format: 'es', sourcemap: false }},
  ]
}
