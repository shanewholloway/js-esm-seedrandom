
export function _prng_restore(prng, xg, opts) {
  let state = opts && opts.state;
  if (state) {
    if (typeof(state) == 'object') xg.copy(state, xg);
    prng.state = () => xg.copy(xg, {});
  }
}

export function _prng_xor_core(xg, opts) {
  let prng = () => (xg.next() >>> 0) / 0x100000000;

  prng.double = () => {
    let top, bot, result
    do {
      top = xg.next() >>> 11;
      bot = (xg.next() >>> 0) / 0x100000000;
      result = (top + bot) / (1 << 21);
    } while (result === 0);
    return result;
  };

  prng.int32 = () => xg.next() | 0;

  prng.quick = prng;

  _prng_restore(prng, xg, opts);
  return prng;
}
