/**
 * @typedef {{
 *  (): number;
 *  double(): number;
 *  int32(): number;
 *  quick(): number;
 *  state?: unknown;
 * }} PRNGenerator
 */
/**
 * Description placeholder
 *
 * @export
 * @param {PRNGenerator} prng
 * @param {*} xg
 * @param {*} opts
 */
export function _prng_restore(prng: PRNGenerator, xg: any, opts: any): void;
/**
 * Description placeholder
 *
 * @export
 * @param {*} xg
 * @param {*} opts
 * @returns {PRNGenerator}
 */
export function _prng_xor_core(xg: any, opts: any): PRNGenerator;
export type PRNGenerator = {
    (): number;
    double(): number;
    int32(): number;
    quick(): number;
    state?: unknown;
};
