// 2020-12 Shane Holloway (ported to ES Modules)
// Copyright 2019 David Bau.

// A library of seedable RNGs implemented in Javascript.

// alea, a 53-bit multiply-with-carry generator by Johannes Baagøe.
// Period: ~2^116
// Reported to pass: all BigCrush tests.
export * from './alea.mjs';

// xor128, a pure xor-shift generator by George Marsaglia.
// Period: 2^128-1.
// Reported to fail: MatrixRank and LinearComp.
export * from './xor128.mjs';

// xorwow, George Marsaglia's 160-bit xor-shift combined plus weyl.
// Period: 2^192-2^32
// Reported to fail: CollisionOver, SimpPoker, and LinearComp.
export * from './xorwow.mjs';

// xorshift7, by François Panneton and Pierre L'ecuyer, takes
// a different approach: it adds robustness by allowing more shifts
// than Marsaglia's original three.  It is a 7-shift generator
// with 256 bits, that passes BigCrush with no systmatic failures.
// Period: 2^256-1.
// Reported to pass: No systematic BigCrush failures reported.
export * from './xorshift7.mjs';

// xor4096, by Richard Brent, is a 4096-bit xor-shift with a
// very long period that also adds a Weyl generator. It also passes
// BigCrush with no systematic failures.  Its long period may
// be useful if you have many generators and need to avoid
// collisions.
// Period: 2^4128-2^32.
// Reported to pass: No systematic BigCrush failures reported.
export * from './xor4096.mjs';

// Tyche-i, by Samuel Neves and Filipe Araujo, is a bit-shifting random
// number generator derived from ChaCha, a modern stream cipher.
// https://eden.dei.uc.pt/~sneves/pubs/2011-snfa2.pdf
// Period: ~2^127
// Reported to pass: No systematic BigCrush failures reported.
export * from './tychei.mjs';

// The original ARC4-based prng included in this library.
// Period: ~2^1600
export * from './arc4.mjs';

