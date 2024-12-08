import rpi_terser from '@rollup/plugin-terser'

export default [
  ... add('index'),

  ... add('alea'),
  ... add('tychei'),
  ... add('xor128'),
  ... add('xor4096'),
  ... add('xorshift7'),
  ... add('xorwow'),
  ... add('arc4'),
]

function add(source, dest=source) {
  return [
    { input: `lib/${source}.js`,
      output: [
        { file: `esm/${dest}.js`, format: 'es', sourcemap: true },
        { file: `esm/${dest}.mjs`, format: 'es', sourcemap: true },
      ],
    },

    { input: `lib/${source}.js`,
      plugins: [ rpi_terser() ],
      output: [
        { file: `esm/${dest}.min.js`, format: 'es', sourcemap: false },
        { file: `esm/${dest}.min.mjs`, format: 'es', sourcemap: false },
      ],
    },
  ]
}
