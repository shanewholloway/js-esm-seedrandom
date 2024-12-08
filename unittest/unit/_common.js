import * as assert from 'uvu/assert'

function test_snap(actual, expected, snap_name) {
  let sz_actual = JSON.stringify(actual, null, 2)
  let sz_expected = JSON.stringify(expected, null, 2)
  try {
    return assert.snapshot(sz_actual, sz_expected)

  } catch (err) {
    //console.error(err.details)
    console.error({[snap_name]: actual})
    throw err
  }
}

export function test_prng_alg(name, prng_alg, snap) {
  it(`${name} direct`, () => {
    let prng = prng_alg(snap.seed, snap.opt)
    let res = Array.from({length:3}, () => prng())
    test_snap(res, snap.direct, 'direct')
  })

  it(`${name}.quick()`, () => {
    let prng = prng_alg(snap.seed, snap.opt)
    let res = Array.from({length:3}, () => prng.quick())
    test_snap(res, snap.quick, 'quick')
  })

  it(`${name}.int32()`, () => {
    let prng = prng_alg(snap.seed, snap.opt)
    let res = Array.from({length:3}, () => prng.int32())
    test_snap(res, snap.int32, 'int32')
  })

  it(`${name}.double()`, () => {
    let prng = prng_alg(snap.seed, snap.opt)
    let res = Array.from({length:3}, () => prng.double())
    test_snap(res, snap.double, 'double')
  })

  it(`${name} state with 1024 iterations`, () => {
    let prng = prng_alg(snap.seed, {...snap.opt, state: true})

    for (let i=0; i<1024; i++) {
      prng();
      prng.quick();
      prng.int32();
      prng.double();
    }

    let state = JSON.parse(JSON.stringify(prng.state()));
    let dup_prng = prng_alg('', {...snap.opt, state})

    for (let i=0; i<5; i++) {
      assert.equal(dup_prng(), prng());
      assert.equal(dup_prng.quick(), prng.quick());
      assert.equal(dup_prng.int32(), prng.int32());
      assert.equal(dup_prng.double(), prng.double());
    }
  })
}
