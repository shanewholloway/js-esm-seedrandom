(function () {
	'use strict';

	let FORCE_COLOR, NODE_DISABLE_COLORS, NO_COLOR, TERM, isTTY=true;
	if (typeof process !== 'undefined') {
		({ FORCE_COLOR, NODE_DISABLE_COLORS, NO_COLOR, TERM } = process.env);
		isTTY = process.stdout && process.stdout.isTTY;
	}

	const $ = {
		enabled: !NODE_DISABLE_COLORS && NO_COLOR == null && TERM !== 'dumb' && (
			FORCE_COLOR != null && FORCE_COLOR !== '0' || isTTY
		),

		// modifiers
		reset: init(0, 0),
		bold: init(1, 22),
		dim: init(2, 22),
		italic: init(3, 23),
		underline: init(4, 24),
		inverse: init(7, 27),
		hidden: init(8, 28),
		strikethrough: init(9, 29),

		// colors
		black: init(30, 39),
		red: init(31, 39),
		green: init(32, 39),
		yellow: init(33, 39),
		blue: init(34, 39),
		magenta: init(35, 39),
		cyan: init(36, 39),
		white: init(37, 39),
		gray: init(90, 39),
		grey: init(90, 39),

		// background colors
		bgBlack: init(40, 49),
		bgRed: init(41, 49),
		bgGreen: init(42, 49),
		bgYellow: init(43, 49),
		bgBlue: init(44, 49),
		bgMagenta: init(45, 49),
		bgCyan: init(46, 49),
		bgWhite: init(47, 49)
	};

	function run(arr, str) {
		let i=0, tmp, beg='', end='';
		for (; i < arr.length; i++) {
			tmp = arr[i];
			beg += tmp.open;
			end += tmp.close;
			if (str.includes(tmp.close)) {
				str = str.replace(tmp.rgx, tmp.close + tmp.open);
			}
		}
		return beg + str + end;
	}

	function chain(has, keys) {
		let ctx = { has, keys };

		ctx.reset = $.reset.bind(ctx);
		ctx.bold = $.bold.bind(ctx);
		ctx.dim = $.dim.bind(ctx);
		ctx.italic = $.italic.bind(ctx);
		ctx.underline = $.underline.bind(ctx);
		ctx.inverse = $.inverse.bind(ctx);
		ctx.hidden = $.hidden.bind(ctx);
		ctx.strikethrough = $.strikethrough.bind(ctx);

		ctx.black = $.black.bind(ctx);
		ctx.red = $.red.bind(ctx);
		ctx.green = $.green.bind(ctx);
		ctx.yellow = $.yellow.bind(ctx);
		ctx.blue = $.blue.bind(ctx);
		ctx.magenta = $.magenta.bind(ctx);
		ctx.cyan = $.cyan.bind(ctx);
		ctx.white = $.white.bind(ctx);
		ctx.gray = $.gray.bind(ctx);
		ctx.grey = $.grey.bind(ctx);

		ctx.bgBlack = $.bgBlack.bind(ctx);
		ctx.bgRed = $.bgRed.bind(ctx);
		ctx.bgGreen = $.bgGreen.bind(ctx);
		ctx.bgYellow = $.bgYellow.bind(ctx);
		ctx.bgBlue = $.bgBlue.bind(ctx);
		ctx.bgMagenta = $.bgMagenta.bind(ctx);
		ctx.bgCyan = $.bgCyan.bind(ctx);
		ctx.bgWhite = $.bgWhite.bind(ctx);

		return ctx;
	}

	function init(open, close) {
		let blk = {
			open: `\x1b[${open}m`,
			close: `\x1b[${close}m`,
			rgx: new RegExp(`\\x1b\\[${close}m`, 'g')
		};
		return function (txt) {
			if (this !== void 0 && this.has !== void 0) {
				this.has.includes(open) || (this.has.push(open),this.keys.push(blk));
				return txt === void 0 ? this : $.enabled ? run(this.keys, txt+'') : txt+'';
			}
			return txt === void 0 ? chain([open], [blk]) : $.enabled ? run([blk], txt+'') : txt+'';
		};
	}

	function Diff() {}
	Diff.prototype = {
	  diff: function diff(oldString, newString) {
	    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
	    var callback = options.callback;

	    if (typeof options === 'function') {
	      callback = options;
	      options = {};
	    }

	    this.options = options;
	    var self = this;

	    function done(value) {
	      if (callback) {
	        setTimeout(function () {
	          callback(undefined, value);
	        }, 0);
	        return true;
	      } else {
	        return value;
	      }
	    } // Allow subclasses to massage the input prior to running


	    oldString = this.castInput(oldString);
	    newString = this.castInput(newString);
	    oldString = this.removeEmpty(this.tokenize(oldString));
	    newString = this.removeEmpty(this.tokenize(newString));
	    var newLen = newString.length,
	        oldLen = oldString.length;
	    var editLength = 1;
	    var maxEditLength = newLen + oldLen;
	    var bestPath = [{
	      newPos: -1,
	      components: []
	    }]; // Seed editLength = 0, i.e. the content starts with the same values

	    var oldPos = this.extractCommon(bestPath[0], newString, oldString, 0);

	    if (bestPath[0].newPos + 1 >= newLen && oldPos + 1 >= oldLen) {
	      // Identity per the equality and tokenizer
	      return done([{
	        value: this.join(newString),
	        count: newString.length
	      }]);
	    } // Main worker method. checks all permutations of a given edit length for acceptance.


	    function execEditLength() {
	      for (var diagonalPath = -1 * editLength; diagonalPath <= editLength; diagonalPath += 2) {
	        var basePath = void 0;

	        var addPath = bestPath[diagonalPath - 1],
	            removePath = bestPath[diagonalPath + 1],
	            _oldPos = (removePath ? removePath.newPos : 0) - diagonalPath;

	        if (addPath) {
	          // No one else is going to attempt to use this value, clear it
	          bestPath[diagonalPath - 1] = undefined;
	        }

	        var canAdd = addPath && addPath.newPos + 1 < newLen,
	            canRemove = removePath && 0 <= _oldPos && _oldPos < oldLen;

	        if (!canAdd && !canRemove) {
	          // If this path is a terminal then prune
	          bestPath[diagonalPath] = undefined;
	          continue;
	        } // Select the diagonal that we want to branch from. We select the prior
	        // path whose position in the new string is the farthest from the origin
	        // and does not pass the bounds of the diff graph


	        if (!canAdd || canRemove && addPath.newPos < removePath.newPos) {
	          basePath = clonePath(removePath);
	          self.pushComponent(basePath.components, undefined, true);
	        } else {
	          basePath = addPath; // No need to clone, we've pulled it from the list

	          basePath.newPos++;
	          self.pushComponent(basePath.components, true, undefined);
	        }

	        _oldPos = self.extractCommon(basePath, newString, oldString, diagonalPath); // If we have hit the end of both strings, then we are done

	        if (basePath.newPos + 1 >= newLen && _oldPos + 1 >= oldLen) {
	          return done(buildValues(self, basePath.components, newString, oldString, self.useLongestToken));
	        } else {
	          // Otherwise track this path as a potential candidate and continue.
	          bestPath[diagonalPath] = basePath;
	        }
	      }

	      editLength++;
	    } // Performs the length of edit iteration. Is a bit fugly as this has to support the
	    // sync and async mode which is never fun. Loops over execEditLength until a value
	    // is produced.


	    if (callback) {
	      (function exec() {
	        setTimeout(function () {
	          // This should not happen, but we want to be safe.

	          /* istanbul ignore next */
	          if (editLength > maxEditLength) {
	            return callback();
	          }

	          if (!execEditLength()) {
	            exec();
	          }
	        }, 0);
	      })();
	    } else {
	      while (editLength <= maxEditLength) {
	        var ret = execEditLength();

	        if (ret) {
	          return ret;
	        }
	      }
	    }
	  },
	  pushComponent: function pushComponent(components, added, removed) {
	    var last = components[components.length - 1];

	    if (last && last.added === added && last.removed === removed) {
	      // We need to clone here as the component clone operation is just
	      // as shallow array clone
	      components[components.length - 1] = {
	        count: last.count + 1,
	        added: added,
	        removed: removed
	      };
	    } else {
	      components.push({
	        count: 1,
	        added: added,
	        removed: removed
	      });
	    }
	  },
	  extractCommon: function extractCommon(basePath, newString, oldString, diagonalPath) {
	    var newLen = newString.length,
	        oldLen = oldString.length,
	        newPos = basePath.newPos,
	        oldPos = newPos - diagonalPath,
	        commonCount = 0;

	    while (newPos + 1 < newLen && oldPos + 1 < oldLen && this.equals(newString[newPos + 1], oldString[oldPos + 1])) {
	      newPos++;
	      oldPos++;
	      commonCount++;
	    }

	    if (commonCount) {
	      basePath.components.push({
	        count: commonCount
	      });
	    }

	    basePath.newPos = newPos;
	    return oldPos;
	  },
	  equals: function equals(left, right) {
	    if (this.options.comparator) {
	      return this.options.comparator(left, right);
	    } else {
	      return left === right || this.options.ignoreCase && left.toLowerCase() === right.toLowerCase();
	    }
	  },
	  removeEmpty: function removeEmpty(array) {
	    var ret = [];

	    for (var i = 0; i < array.length; i++) {
	      if (array[i]) {
	        ret.push(array[i]);
	      }
	    }

	    return ret;
	  },
	  castInput: function castInput(value) {
	    return value;
	  },
	  tokenize: function tokenize(value) {
	    return value.split('');
	  },
	  join: function join(chars) {
	    return chars.join('');
	  }
	};

	function buildValues(diff, components, newString, oldString, useLongestToken) {
	  var componentPos = 0,
	      componentLen = components.length,
	      newPos = 0,
	      oldPos = 0;

	  for (; componentPos < componentLen; componentPos++) {
	    var component = components[componentPos];

	    if (!component.removed) {
	      if (!component.added && useLongestToken) {
	        var value = newString.slice(newPos, newPos + component.count);
	        value = value.map(function (value, i) {
	          var oldValue = oldString[oldPos + i];
	          return oldValue.length > value.length ? oldValue : value;
	        });
	        component.value = diff.join(value);
	      } else {
	        component.value = diff.join(newString.slice(newPos, newPos + component.count));
	      }

	      newPos += component.count; // Common case

	      if (!component.added) {
	        oldPos += component.count;
	      }
	    } else {
	      component.value = diff.join(oldString.slice(oldPos, oldPos + component.count));
	      oldPos += component.count; // Reverse add and remove so removes are output first to match common convention
	      // The diffing algorithm is tied to add then remove output and this is the simplest
	      // route to get the desired output with minimal overhead.

	      if (componentPos && components[componentPos - 1].added) {
	        var tmp = components[componentPos - 1];
	        components[componentPos - 1] = components[componentPos];
	        components[componentPos] = tmp;
	      }
	    }
	  } // Special case handle for when one terminal is ignored (i.e. whitespace).
	  // For this case we merge the terminal into the prior string and drop the change.
	  // This is only available for string mode.


	  var lastComponent = components[componentLen - 1];

	  if (componentLen > 1 && typeof lastComponent.value === 'string' && (lastComponent.added || lastComponent.removed) && diff.equals('', lastComponent.value)) {
	    components[componentLen - 2].value += lastComponent.value;
	    components.pop();
	  }

	  return components;
	}

	function clonePath(path) {
	  return {
	    newPos: path.newPos,
	    components: path.components.slice(0)
	  };
	}

	//
	// Ranges and exceptions:
	// Latin-1 Supplement, 0080–00FF
	//  - U+00D7  × Multiplication sign
	//  - U+00F7  ÷ Division sign
	// Latin Extended-A, 0100–017F
	// Latin Extended-B, 0180–024F
	// IPA Extensions, 0250–02AF
	// Spacing Modifier Letters, 02B0–02FF
	//  - U+02C7  ˇ &#711;  Caron
	//  - U+02D8  ˘ &#728;  Breve
	//  - U+02D9  ˙ &#729;  Dot Above
	//  - U+02DA  ˚ &#730;  Ring Above
	//  - U+02DB  ˛ &#731;  Ogonek
	//  - U+02DC  ˜ &#732;  Small Tilde
	//  - U+02DD  ˝ &#733;  Double Acute Accent
	// Latin Extended Additional, 1E00–1EFF

	var extendedWordChars = /^[A-Za-z\xC0-\u02C6\u02C8-\u02D7\u02DE-\u02FF\u1E00-\u1EFF]+$/;
	var reWhitespace = /\S/;
	var wordDiff = new Diff();

	wordDiff.equals = function (left, right) {
	  if (this.options.ignoreCase) {
	    left = left.toLowerCase();
	    right = right.toLowerCase();
	  }

	  return left === right || this.options.ignoreWhitespace && !reWhitespace.test(left) && !reWhitespace.test(right);
	};

	wordDiff.tokenize = function (value) {
	  // All whitespace symbols except newline group into one token, each newline - in separate token
	  var tokens = value.split(/([^\S\r\n]+|[()[\]{}'"\r\n]|\b)/); // Join the boundary splits that we do not consider to be boundaries. This is primarily the extended Latin character set.

	  for (var i = 0; i < tokens.length - 1; i++) {
	    // If we have an empty string in the next field and we have only word chars before and after, merge
	    if (!tokens[i + 1] && tokens[i + 2] && extendedWordChars.test(tokens[i]) && extendedWordChars.test(tokens[i + 2])) {
	      tokens[i] += tokens[i + 2];
	      tokens.splice(i + 1, 2);
	      i--;
	    }
	  }

	  return tokens;
	};

	var lineDiff = new Diff();

	lineDiff.tokenize = function (value) {
	  var retLines = [],
	      linesAndNewlines = value.split(/(\n|\r\n)/); // Ignore the final empty token that occurs if the string ends with a new line

	  if (!linesAndNewlines[linesAndNewlines.length - 1]) {
	    linesAndNewlines.pop();
	  } // Merge the content and line separators into single tokens


	  for (var i = 0; i < linesAndNewlines.length; i++) {
	    var line = linesAndNewlines[i];

	    if (i % 2 && !this.options.newlineIsToken) {
	      retLines[retLines.length - 1] += line;
	    } else {
	      if (this.options.ignoreWhitespace) {
	        line = line.trim();
	      }

	      retLines.push(line);
	    }
	  }

	  return retLines;
	};

	function diffLines(oldStr, newStr, callback) {
	  return lineDiff.diff(oldStr, newStr, callback);
	}

	var sentenceDiff = new Diff();

	sentenceDiff.tokenize = function (value) {
	  return value.split(/(\S.+?[.!?])(?=\s+|$)/);
	};

	var cssDiff = new Diff();

	cssDiff.tokenize = function (value) {
	  return value.split(/([{}:;,]|\s+)/);
	};

	function _typeof(obj) {
	  "@babel/helpers - typeof";

	  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
	    _typeof = function (obj) {
	      return typeof obj;
	    };
	  } else {
	    _typeof = function (obj) {
	      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
	    };
	  }

	  return _typeof(obj);
	}

	var objectPrototypeToString = Object.prototype.toString;
	var jsonDiff = new Diff(); // Discriminate between two lines of pretty-printed, serialized JSON where one of them has a
	// dangling comma and the other doesn't. Turns out including the dangling comma yields the nicest output:

	jsonDiff.useLongestToken = true;
	jsonDiff.tokenize = lineDiff.tokenize;

	jsonDiff.castInput = function (value) {
	  var _this$options = this.options,
	      undefinedReplacement = _this$options.undefinedReplacement,
	      _this$options$stringi = _this$options.stringifyReplacer,
	      stringifyReplacer = _this$options$stringi === void 0 ? function (k, v) {
	    return typeof v === 'undefined' ? undefinedReplacement : v;
	  } : _this$options$stringi;
	  return typeof value === 'string' ? value : JSON.stringify(canonicalize(value, null, null, stringifyReplacer), stringifyReplacer, '  ');
	};

	jsonDiff.equals = function (left, right) {
	  return Diff.prototype.equals.call(jsonDiff, left.replace(/,([\r\n])/g, '$1'), right.replace(/,([\r\n])/g, '$1'));
	};
	// object that is already on the "stack" of items being processed. Accepts an optional replacer

	function canonicalize(obj, stack, replacementStack, replacer, key) {
	  stack = stack || [];
	  replacementStack = replacementStack || [];

	  if (replacer) {
	    obj = replacer(key, obj);
	  }

	  var i;

	  for (i = 0; i < stack.length; i += 1) {
	    if (stack[i] === obj) {
	      return replacementStack[i];
	    }
	  }

	  var canonicalizedObj;

	  if ('[object Array]' === objectPrototypeToString.call(obj)) {
	    stack.push(obj);
	    canonicalizedObj = new Array(obj.length);
	    replacementStack.push(canonicalizedObj);

	    for (i = 0; i < obj.length; i += 1) {
	      canonicalizedObj[i] = canonicalize(obj[i], stack, replacementStack, replacer, key);
	    }

	    stack.pop();
	    replacementStack.pop();
	    return canonicalizedObj;
	  }

	  if (obj && obj.toJSON) {
	    obj = obj.toJSON();
	  }

	  if (_typeof(obj) === 'object' && obj !== null) {
	    stack.push(obj);
	    canonicalizedObj = {};
	    replacementStack.push(canonicalizedObj);

	    var sortedKeys = [],
	        _key;

	    for (_key in obj) {
	      /* istanbul ignore else */
	      if (obj.hasOwnProperty(_key)) {
	        sortedKeys.push(_key);
	      }
	    }

	    sortedKeys.sort();

	    for (i = 0; i < sortedKeys.length; i += 1) {
	      _key = sortedKeys[i];
	      canonicalizedObj[_key] = canonicalize(obj[_key], stack, replacementStack, replacer, _key);
	    }

	    stack.pop();
	    replacementStack.pop();
	  } else {
	    canonicalizedObj = obj;
	  }

	  return canonicalizedObj;
	}

	var arrayDiff = new Diff();

	arrayDiff.tokenize = function (value) {
	  return value.slice();
	};

	arrayDiff.join = arrayDiff.removeEmpty = function (value) {
	  return value;
	};

	const colors = {
		'--': $.red,
		'··': $.grey,
		'++': $.green,
	};

	const TITLE = $.dim().italic;
	const TAB=$.dim('→'), SPACE=$.dim('·'), NL=$.dim('↵');
	const LOG = (sym, str) => colors[sym](sym + PRETTY(str)) + '\n';
	const LINE = (num, x) => $.dim('L' + String(num).padStart(x, '0') + ' ');
	const PRETTY = str => str.replace(/[ ]/g, SPACE).replace(/\t/g, TAB).replace(/(\r?\n)/g, NL);

	function line(obj, prev, pad) {
		let char = obj.removed ? '--' : obj.added ? '++' : '··';
		let arr = obj.value.replace(/\r?\n$/, '').split('\n');
		let i=0, tmp, out='';

		if (obj.added) out += colors[char]().underline(TITLE('Expected:')) + '\n';
		else if (obj.removed) out += colors[char]().underline(TITLE('Actual:')) + '\n';

		for (; i < arr.length; i++) {
			tmp = arr[i];
			if (tmp != null) {
				if (prev) out += LINE(prev + i, pad);
				out += LOG(char, tmp || '\n');
			}
		}

		return out;
	}

	function lines(input, expect, linenum = 0) {
		let i=0, tmp, output='';
		let arr = diffLines(input, expect);
		let pad = String(expect.split(/\r?\n/g).length - linenum).length;

		for (; i < arr.length; i++) {
			output += line(tmp = arr[i], linenum, pad);
			if (linenum && !tmp.removed) linenum += tmp.count;
		}

		return output;
	}

	function dedent(str) {
		let arr = str.match(/^[ \t]*(?=\S)/gm);
		let min = !!arr && Math.min(...arr.map(x => x.length));
		return (!arr || !min) ? str : str.replace(new RegExp(`^[ \\t]{${min}}`, 'gm'), '');
	}

	class Assertion extends Error {
		constructor(opts={}) {
			super(opts.message);
			this.name = 'Assertion';
			this.code = 'ERR_ASSERTION';
			if (Error.captureStackTrace) {
				Error.captureStackTrace(this, this.constructor);
			}
			this.details = opts.details || false;
			this.generated = !!opts.generated;
			this.operator = opts.operator;
			this.expects = opts.expects;
			this.actual = opts.actual;
		}
	}

	function assert(bool, actual, expects, operator, detailer, backup, msg) {
		if (bool) return;
		let message = msg || backup;
		if (msg instanceof Error) throw msg;
		let details = detailer && detailer(actual, expects);
		throw new Assertion({ actual, expects, operator, message, details, generated: !msg });
	}

	function snapshot(val, exp, msg) {
		val=dedent(val); exp=dedent(exp);
		assert(val === exp, val, exp, 'snapshot', lines, 'Expected value to match snapshot:', msg);
	}

	function test_snap(actual, expected, snap_name) {
	  let sz_actual = JSON.stringify(actual, null, 2);
	  let sz_expected = JSON.stringify(expected, null, 2);
	  try {
	    return snapshot(sz_actual, sz_expected)

	  } catch (err) {
	    console.error(err.details);
	    console.error({[snap_name]: actual});
	    throw err
	  }
	}

	function test_prng_alg(name, prng_alg, snap) {
	  it(`${name} direct`, () => {
	    let prng = prng_alg(snap.seed);
	    let res = Array.from({length:3}, () => prng());
	    test_snap(res, snap.direct, 'direct');
	  });

	  it(`${name}.quick()`, () => {
	    let prng = prng_alg(snap.seed);
	    let res = Array.from({length:3}, () => prng.quick());
	    test_snap(res, snap.quick, 'quick');
	  });

	  it(`${name}.int32()`, () => {
	    let prng = prng_alg(snap.seed);
	    let res = Array.from({length:3}, () => prng.int32());
	    test_snap(res, snap.int32, 'int32');
	  });

	  it(`${name}.double()`, () => {
	    let prng = prng_alg(snap.seed);
	    let res = Array.from({length:3}, () => prng.double());
	    test_snap(res, snap.double, 'double');
	  });

	}

	function _prng_restore(prng, xg, opts) {
	  let state = opts && opts.state;
	  if (state) {
	    if (typeof(state) == 'object') xg.copy(state, xg);
	    prng.state = () => xg.copy(xg, {});
	  }
	}

	function _prng_xor_core(xg, opts) {
	  let prng = () => (xg.next() >>> 0) / 0x100000000;

	  prng.double = () => {
	    let top, bot, result;
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

	// A port of an algorithm by Johannes Baagøe <baagoe@baagoe.com>, 2010
	function prng_alea(seed, opts) {
	  let xg = new AleaGen(seed);

	  let prng = () => xg.next();

	  prng.double = () =>
	    prng() + (prng() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53

	  prng.int32 = () => (xg.next() * 0x100000000) | 0;

	  prng.quick = prng;

	  _prng_restore(prng, xg, opts);
	  return prng
	}

	class AleaGen {
	  constructor(seed) {
	    if (seed == null) seed = +(new Date);

	    let n = 0xefc8249d;

	    // Apply the seeding algorithm from Baagoe.
	    this.c = 1;
	    this.s0 = mash(' ');
	    this.s1 = mash(' ');
	    this.s2 = mash(' ');
	    this.s0 -= mash(seed);
	    if (this.s0 < 0) { this.s0 += 1; }
	    this.s1 -= mash(seed);
	    if (this.s1 < 0) { this.s1 += 1; }
	    this.s2 -= mash(seed);
	    if (this.s2 < 0) { this.s2 += 1; }

	    function mash(data) {
	      data = String(data);
	      for (let i = 0; i < data.length; i++) {
	        n += data.charCodeAt(i);
	        let h = 0.02519603282416938 * n;
	        n = h >>> 0;
	        h -= n;
	        h *= n;
	        n = h >>> 0;
	        h -= n;
	        n += h * 0x100000000; // 2^32
	      }
	      return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
	    }
	  }

	  next() {
	    let {c,s0,s1,s2} = this;
	    let t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
	    this.s0 = s1;
	    this.s1 = s2;
	    return this.s2 = t - (this.c = t | 0);
	  }

	  copy(f, t) {
	    t.c = f.c;
	    t.s0 = f.s0;
	    t.s1 = f.s1;
	    t.s2 = f.s2;
	    return t;
	  }
	}

	// A Javascript implementaion of the "xor128" prng algorithm by
	function prng_xor128(seed, opts) {
	  let xg = new Xor128Gen(seed);
	  return _prng_xor_core(xg, opts);
	}

	class Xor128Gen {
	  constructor(seed) {
	    if (seed == null) seed = +(new Date);

	    let strseed = '';

	    this.x = 0;
	    this.y = 0;
	    this.z = 0;
	    this.w = 0;

	    if (seed === (seed | 0)) {
	      // Integer seed.
	      this.x = seed;
	    } else {
	      // String seed.
	      strseed += seed;
	    }

	    // Mix in string seed, then discard an initial batch of 64 values.
	    for (let k = 0; k < strseed.length + 64; k++) {
	      this.x ^= strseed.charCodeAt(k) | 0;
	      this.next();
	    }
	  }

	  next() {
	    let {x,y,z,w} = this;
	    let t = x ^ (x << 11);
	    this.x = y;
	    this.y = z;
	    this.z = w;
	    return this.w = w ^ ((w >>> 19) ^ t ^ (t >>> 8));
	  };

	  copy(f, t) {
	    t.x = f.x;
	    t.y = f.y;
	    t.z = f.z;
	    t.w = f.w;
	    return t;
	  }
	}

	// A Javascript implementaion of the "xorwow" prng algorithm by
	function prng_xorwow(seed, opts) {
	  let xg = new XorWowGen(seed);
	  return _prng_xor_core(xg, opts);
	}

	class XorWowGen {
	  constructor(seed) {
	    if (seed == null) seed = +(new Date);

	    let strseed = '';

	    this.x = 0;
	    this.y = 0;
	    this.z = 0;
	    this.w = 0;
	    this.v = 0;

	    if (seed === (seed | 0)) {
	      // Integer seed.
	      this.x = seed;
	    } else {
	      // String seed.
	      strseed += seed;
	    }

	    // Mix in string seed, then discard an initial batch of 64 values.
	    for (let k = 0; k < strseed.length + 64; k++) {
	      this.x ^= strseed.charCodeAt(k) | 0;
	      if (k == strseed.length) {
	        this.d = this.x << 10 ^ this.x >>> 4;
	      }
	      this.next();
	    }
	  }

	  next() {
	    let {x,y,z,w,v,d} = this;
	    let t = (x ^ (x >>> 2));
	    this.x = y;
	    this.y = z;
	    this.z = w;
	    this.w = v;
	    return (this.d = (d + 362437 | 0)) +
	       (this.v = (v ^ (v << 4)) ^ (t ^ (t << 1))) | 0;
	  };

	  copy(f, t) {
	    t.x = f.x;
	    t.y = f.y;
	    t.z = f.z;
	    t.w = f.w;
	    t.v = f.v;
	    t.d = f.d;
	    return t;
	  }
	}

	// A Javascript implementaion of the "xorshift7" algorithm by
	function prng_xorshift7(seed, opts) {
	  let xg = new XorShift7Gen(seed);
	  return _prng_xor_core(xg, opts);
	}


	class XorShift7Gen {
	  constructor(seed) {
	    if (seed == null) seed = +(new Date);

	    var j, w, x = [];

	    if (seed === (seed | 0)) {
	      // Seed state array using a 32-bit integer.
	      w = x[0] = seed;
	    } else {
	      // Seed state using a string.
	      seed = '' + seed;
	      for (j = 0; j < seed.length; ++j) {
	        x[j & 7] = (x[j & 7] << 15) ^
	            (seed.charCodeAt(j) + x[(j + 1) & 7] << 13);
	      }
	    }

	    // Enforce an array length of 8, not all zeroes.
	    while (x.length < 8) x.push(0);
	    for (j = 0; j < 8 && x[j] === 0; ++j);
	    if (j == 8) w = x[7] = -1; else w = x[j];

	    this.x = x;
	    this.i = 0;

	    // Discard an initial 256 values.
	    for (j = 256; j > 0; --j) {
	      this.next();
	    }
	  }

	  next() {
	    // Update xor generator.
	    let t, v, {x,i} = this;
	    t = x[i]; t ^= (t >>> 7); v = t ^ (t << 24);
	    t = x[(i + 1) & 7]; v ^= t ^ (t >>> 10);
	    t = x[(i + 3) & 7]; v ^= t ^ (t >>> 3);
	    t = x[(i + 4) & 7]; v ^= t ^ (t << 7);
	    t = x[(i + 7) & 7]; t = t ^ (t << 13); v ^= t ^ (t << 9);
	    x[i] = v;
	    this.i = (i + 1) & 7;
	    return v;
	  };

	  copy(f, t) {
	    t.x = [... f.x];
	    t.i = f.i;
	    return t;
	  }
	}

	// A Javascript implementaion of Richard Brent's Xorgens xor4096 algorithm.
	function prng_xor4096(seed, opts) {
	  let xg = new Xor4096Gen(seed);
	  return _prng_xor_core(xg, opts);
	}


	class Xor4096Gen {
	  constructor(seed) {
	    if (seed == null) seed = +(new Date);

	    let t, v, i, j, w, X = [], limit = 128;
	    if (seed === (seed | 0)) {
	      // Numeric seeds initialize v, which is used to generates X.
	      v = seed;
	      seed = null;
	    } else {
	      // String seeds are mixed into v and X one character at a time.
	      seed = seed + '\0';
	      v = 0;
	      limit = Math.max(limit, seed.length);
	    }
	    // Initialize circular array and weyl value.
	    for (i = 0, j = -32; j < limit; ++j) {
	      // Put the unicode characters into the array, and shuffle them.
	      if (seed) v ^= seed.charCodeAt((j + 32) % seed.length);
	      // After 32 shuffles, take v as the starting w value.
	      if (j === 0) w = v;
	      v ^= v << 10;
	      v ^= v >>> 15;
	      v ^= v << 4;
	      v ^= v >>> 13;
	      if (j >= 0) {
	        w = (w + 0x61c88647) | 0;     // Weyl.
	        t = (X[j & 127] ^= (v + w));  // Combine xor and weyl to init array.
	        i = (0 == t) ? i + 1 : 0;     // Count zeroes.
	      }
	    }
	    // We have detected all zeroes; make the key nonzero.
	    if (i >= 128) {
	      X[(seed && seed.length || 0) & 127] = -1;
	    }
	    // Run the generator 512 times to further mix the state before using it.
	    // Factoring this as a function slows the main generator, so it is just
	    // unrolled here.  The weyl generator is not advanced while warming up.
	    i = 127;
	    for (j = 4 * 128; j > 0; --j) {
	      v = X[(i + 34) & 127];
	      t = X[i = ((i + 1) & 127)];
	      v ^= v << 13;
	      t ^= t << 17;
	      v ^= v >>> 15;
	      t ^= t >>> 12;
	      X[i] = v ^ t;
	    }
	    // Storing state as object members is faster than using closure variables.
	    this.w = w;
	    this.X = X;
	    this.i = i;
	  }

	  next() {
	    let t, v, {w, X, i} = this;
	    // Update Weyl generator.
	    this.w = w = (w + 0x61c88647) | 0;
	    // Update xor generator.
	    v = X[(i + 34) & 127];
	    t = X[i = ((i + 1) & 127)];
	    v ^= v << 13;
	    t ^= t << 17;
	    v ^= v >>> 15;
	    t ^= t >>> 12;
	    // Update Xor generator array state.
	    v = X[i] = v ^ t;
	    this.i = i;
	    // Result is the combination.
	    return (v + (w ^ (w >>> 16))) | 0;
	  }

	  copy(f, t) {
	    t.i = f.i;
	    t.w = f.w;
	    t.X = [... f.X];
	    return t;
	  }
	}

	// A Javascript implementaion of the "Tyche-i" prng algorithm by
	function prng_tychei(seed, opts) {
	  let xg = new TycheiGen(seed);
	  return _prng_xor_core(xg, opts);
	}

	class TycheiGen {
	  constructor(seed) {
	    if (seed == null) seed = +(new Date);

	    let strseed = '';

	    this.a = 0;
	    this.b = 0;
	    this.c = 2654435769 | 0;
	    this.d = 1367130551;

	    if (seed === Math.floor(seed)) {
	      // Integer seed.
	      this.a = (seed / 0x100000000) | 0;
	      this.b = seed | 0;
	    } else {
	      // String seed.
	      strseed += seed;
	    }

	    // Mix in string seed, then discard an initial batch of 64 values.
	    for (let k = 0; k < strseed.length + 20; k++) {
	      this.b ^= strseed.charCodeAt(k) | 0;
	      this.next();
	    }
	  }

	  next() {
	    let {a,b,c,d} = this;
	    b = (b << 25) ^ (b >>> 7) ^ c;
	    c = (c - d) | 0;
	    d = (d << 24) ^ (d >>> 8) ^ a;
	    a = (a - b) | 0;
	    this.b = b = (b << 20) ^ (b >>> 12) ^ c;
	    this.c = c = (c - d) | 0;
	    this.d = (d << 16) ^ (c >>> 16) ^ a;
	    return this.a = (a - b) | 0;
	  };

	  copy(f, t) {
	    t.a = f.a;
	    t.b = f.b;
	    t.c = f.c;
	    t.d = f.d;
	    return t;
	  }
	}


	/* The following is non-inverted tyche, which has better internal
	 * bit diffusion, but which is about 25% slower than tyche-i in JS.
	 *

	class TycheiGenAlt extends TycheiGen {
	  next() {
	    let {a,b,c,d} = this
	    a = (a + b | 0) >>> 0;
	    d = d ^ a; d = d << 16 ^ d >>> 16;
	    c = c + d | 0;
	    b = b ^ c; b = b << 12 ^ d >>> 20;
	    this.a = a = a + b | 0;
	    d = d ^ a; this.d = d = d << 8 ^ d >>> 24;
	    this.c = c = c + d | 0;
	    b = b ^ c;
	    return this.b = (b << 7 ^ b >>> 25);
	  }
	}
	*/

	/*
	Copyright 2019 David Bau.

	Permission is hereby granted, free of charge, to any person obtaining
	a copy of this software and associated documentation files (the
	"Software"), to deal in the Software without restriction, including
	without limitation the rights to use, copy, modify, merge, publish,
	distribute, sublicense, and/or sell copies of the Software, and to
	permit persons to whom the Software is furnished to do so, subject to
	the following conditions:

	The above copyright notice and this permission notice shall be
	included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
	EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
	IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
	CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
	TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
	SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

	*/
	function prng_arc4(seed, opts) {
	  let xg = new ARC4Gen(seed);
	  let prng = () => xg.next();

	  prng.double = prng;

	  prng.int32 = () => xg.g(4) | 0;

	  prng.quick = () => xg.g(4) / 0x100000000;

	  _prng_restore(prng, xg, opts);
	  return prng
	}


	//
	// ARC4
	//
	// An ARC4 implementation.  The constructor takes a key in the form of
	// an array of at most (width) integers that should be 0 <= x < (width).
	//
	// The g(count) method returns a pseudorandom integer that concatenates
	// the next (count) outputs from ARC4.  Its return value is a number x
	// that is in the range 0 <= x < (width ^ count).
	//

	//
	// The following constants are related to IEEE 754 limits.
	//

	// const width = 256 // each RC4 output is 0 <= x < 256
	// const chunks = 6 // at least six RC4 outputs for each double
	const _arc4_startdenom = 281474976710656;     // 256 ** 6 == width ** chunks
	const _arc4_significance = 4503599627370496;  // 2 ** 52 significant digits in a double
	const _arc4_overflow = 9007199254740992;      // 2 ** 53 == significance * 2


	class ARC4Gen {
	  constructor(seed) {
	    if (seed == null) seed = +(new Date);

	    let key = this.mixkey(seed, []);
	    let i,j,t, S=[], keylen = key.length;
	    this.i = this.j = i = j = 0;
	    this.S = S;

	    // The empty key [] is treated as [0].
	    if (!keylen) { key = [keylen++]; }

	    // Set up S using the standard key scheduling algorithm.
	    while (i <= 0xff) {
	      S[i] = i++;
	    }
	    for (i = 0; i <= 0xff; i++) {
	      S[i] = S[j = 0xff & (j + key[i % keylen] + (t = S[i]))];
	      S[j] = t;
	    }

	    // For robust unpredictability, the function call below automatically
	    // discards an initial batch of values.  This is called RC4-drop[256].
	    // See http://google.com/search?q=rsa+fluhrer+response&btnI
	    this.g(256);
	  }

	  next() {
	    // This function returns a random double in [0, 1) that contains
	    // randomness in every bit of the mantissa of the IEEE 754 value.

	    let n = this.g(6);                  // Start with a numerator n < 2 ^ 48
	    let d = _arc4_startdenom;           //   and denominator d = 2 ^ 48.
	    let x = 0;                          //   and no 'extra last byte'.

	    while (n < _arc4_significance) {    // Fill up all significant digits (2 ** 52)
	      n = (n + x) * 256;                //   by shifting numerator and
	      d *= 256;                         //   denominator and generating a
	      x = this.g(1);                    //   new least-significant-byte.
	    }
	    while (n >= _arc4_overflow) {       // To avoid rounding past overflow, before adding
	      n /= 2;                           //   last byte, shift everything
	      d /= 2;                           //   right using integer math until
	      x >>>= 1;                         //   we have exactly the desired bits.
	    }
	    return (n + x) / d;                 // Form the number within [0, 1).
	  }

	  g(count) {
	    // The "g" method returns the next (count) outputs as one number.
	    let t, r = 0, {i,j,S} = this;
	    while (count--) {
	      t = S[i = 0xff & (i + 1)];
	      r = r * 256 + S[0xff & ((S[i] = S[j = 0xff & (j + t)]) + (S[j] = t))];
	    }
	    this.i = i;
	    this.j = j;
	    return r;
	  }

	  copy(f, t) {
	    t.i = f.i;
	    t.j = f.j;
	    t.S = [... f.S];
	    return t;
	  }

	  mixkey(seed, key) {
	    seed = seed + '';
	    let smear=0, j=0;
	    while (j < seed.length) {
	      key[0xff & j] =
	        0xff & ((smear ^= key[0xff & j] * 19) + seed.charCodeAt(j++));
	    }
	    return key
	  }
	}

	function _prng_restore$1(prng, xg, opts) {
	  let state = opts && opts.state;
	  if (state) {
	    if (typeof(state) == 'object') xg.copy(state, xg);
	    prng.state = () => xg.copy(xg, {});
	  }
	}

	// A port of an algorithm by Johannes Baagøe <baagoe@baagoe.com>, 2010
	function prng_alea$1(seed, opts) {
	  let xg = new AleaGen$1(seed);

	  let prng = () => xg.next();

	  prng.double = () =>
	    prng() + (prng() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53

	  prng.int32 = () => (xg.next() * 0x100000000) | 0;

	  prng.quick = prng;

	  _prng_restore$1(prng, xg, opts);
	  return prng
	}

	class AleaGen$1 {
	  constructor(seed) {
	    if (seed == null) seed = +(new Date);

	    let n = 0xefc8249d;

	    // Apply the seeding algorithm from Baagoe.
	    this.c = 1;
	    this.s0 = mash(' ');
	    this.s1 = mash(' ');
	    this.s2 = mash(' ');
	    this.s0 -= mash(seed);
	    if (this.s0 < 0) { this.s0 += 1; }
	    this.s1 -= mash(seed);
	    if (this.s1 < 0) { this.s1 += 1; }
	    this.s2 -= mash(seed);
	    if (this.s2 < 0) { this.s2 += 1; }

	    function mash(data) {
	      data = String(data);
	      for (let i = 0; i < data.length; i++) {
	        n += data.charCodeAt(i);
	        let h = 0.02519603282416938 * n;
	        n = h >>> 0;
	        h -= n;
	        h *= n;
	        n = h >>> 0;
	        h -= n;
	        n += h * 0x100000000; // 2^32
	      }
	      return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
	    }
	  }

	  next() {
	    let {c,s0,s1,s2} = this;
	    let t = 2091639 * s0 + c * 2.3283064365386963e-10; // 2^-32
	    this.s0 = s1;
	    this.s1 = s2;
	    return this.s2 = t - (this.c = t | 0);
	  }

	  copy(f, t) {
	    t.c = f.c;
	    t.s0 = f.s0;
	    t.s1 = f.s1;
	    t.s2 = f.s2;
	    return t;
	  }
	}

	function t(t,e){let i=new s(t),h=()=>i.next();return h.double=()=>h()+11102230246251565e-32*(2097152*h()|0),h.int32=()=>4294967296*i.next()|0,h.quick=h,function(t,s,e){let i=e&&e.state;i&&("object"==typeof i&&s.copy(i,s),t.state=()=>s.copy(s,{}));}(h,i,e),h}class s{constructor(t){null==t&&(t=+new Date);let s=4022871197;function e(t){t=String(t);for(let e=0;e<t.length;e++){s+=t.charCodeAt(e);let i=.02519603282416938*s;s=i>>>0,i-=s,i*=s,s=i>>>0,i-=s,s+=4294967296*i;}return 2.3283064365386963e-10*(s>>>0)}this.c=1,this.s0=e(" "),this.s1=e(" "),this.s2=e(" "),this.s0-=e(t),this.s0<0&&(this.s0+=1),this.s1-=e(t),this.s1<0&&(this.s1+=1),this.s2-=e(t),this.s2<0&&(this.s2+=1);}next(){let{c:t,s0:s,s1:e,s2:i}=this,h=2091639*s+2.3283064365386963e-10*t;return this.s0=e,this.s1=i,this.s2=h-(this.c=0|h)}copy(t,s){return s.c=t.c,s.s0=t.s0,s.s1=t.s1,s.s2=t.s2,s}}

	const cjs_prng_alea = require('seedrandom/lib/alea.js');

	describe('alea', () => {
	  let _ans_shared = [ 0.2594452982302755, 0.8253263409715146, 0.42280301195569336 ];
	  const snap = {
	    seed: 'an example seed string',
	    direct: _ans_shared,
	    quick: _ans_shared,
	    int32: [ 1114309071, -750217653, 1815925109 ],
	    double: [ 0.2594452984224367, 0.4228030121662897, 0.7626296668940982 ],
	  };

	  describe('shared', () =>
	    test_prng_alg('alea', prng_alea, snap));

	  describe('isolated', () =>
	    test_prng_alg('alea', prng_alea$1, snap));

	  describe('isolated minified', () =>
	    test_prng_alg('alea', t, snap));

	  if (cjs_prng_alea)
	    describe('original seedrandom (CommonJS)', () =>
	      test_prng_alg('alea', cjs_prng_alea, snap));
	});

	function _prng_restore$2(prng, xg, opts) {
	  let state = opts && opts.state;
	  if (state) {
	    if (typeof(state) == 'object') xg.copy(state, xg);
	    prng.state = () => xg.copy(xg, {});
	  }
	}

	function _prng_xor_core$1(xg, opts) {
	  let prng = () => (xg.next() >>> 0) / 0x100000000;

	  prng.double = () => {
	    let top, bot, result;
	    do {
	      top = xg.next() >>> 11;
	      bot = (xg.next() >>> 0) / 0x100000000;
	      result = (top + bot) / (1 << 21);
	    } while (result === 0);
	    return result;
	  };

	  prng.int32 = () => xg.next() | 0;

	  prng.quick = prng;

	  _prng_restore$2(prng, xg, opts);
	  return prng;
	}

	// A Javascript implementaion of the "xor128" prng algorithm by
	function prng_xor128$1(seed, opts) {
	  let xg = new Xor128Gen$1(seed);
	  return _prng_xor_core$1(xg, opts);
	}

	class Xor128Gen$1 {
	  constructor(seed) {
	    if (seed == null) seed = +(new Date);

	    let strseed = '';

	    this.x = 0;
	    this.y = 0;
	    this.z = 0;
	    this.w = 0;

	    if (seed === (seed | 0)) {
	      // Integer seed.
	      this.x = seed;
	    } else {
	      // String seed.
	      strseed += seed;
	    }

	    // Mix in string seed, then discard an initial batch of 64 values.
	    for (let k = 0; k < strseed.length + 64; k++) {
	      this.x ^= strseed.charCodeAt(k) | 0;
	      this.next();
	    }
	  }

	  next() {
	    let {x,y,z,w} = this;
	    let t = x ^ (x << 11);
	    this.x = y;
	    this.y = z;
	    this.z = w;
	    return this.w = w ^ ((w >>> 19) ^ t ^ (t >>> 8));
	  };

	  copy(f, t) {
	    t.x = f.x;
	    t.y = f.y;
	    t.z = f.z;
	    t.w = f.w;
	    return t;
	  }
	}

	function t$1(t,n){return function(t,e){let n=()=>(t.next()>>>0)/4294967296;return n.double=()=>{let e,n,i;do{e=t.next()>>>11,n=(t.next()>>>0)/4294967296,i=(e+n)/(1<<21);}while(0===i);return i},n.int32=()=>0|t.next(),n.quick=n,function(t,e,n){let i=n&&n.state;i&&("object"==typeof i&&e.copy(i,e),t.state=()=>e.copy(e,{}));}(n,t,e),n}(new e(t),n)}class e{constructor(t){null==t&&(t=+new Date);let e="";this.x=0,this.y=0,this.z=0,this.w=0,t===(0|t)?this.x=t:e+=t;for(let t=0;t<e.length+64;t++)this.x^=0|e.charCodeAt(t),this.next();}next(){let{x:t,y:e,z:n,w:i}=this,s=t^t<<11;return this.x=e,this.y=n,this.z=i,this.w=i^i>>>19^s^s>>>8}copy(t,e){return e.x=t.x,e.y=t.y,e.z=t.z,e.w=t.w,e}}

	const cjs_prng_xor128 = require('seedrandom/lib/xor128.js');

	describe('xor128', () => {
	  let _ans_shared = [0.9560257731936872,0.6461276928894222,0.3774650595150888];
	  const snap = {
	    seed: 'an example seed string',
	    direct: _ans_shared,
	    quick: _ans_shared,
	    int32: [-188867866, -1519869986, 1621200086],
	    double: [0.9560259085310425,0.37746513052634856,0.7683549630822994],
	  };

	  describe('shared', () =>
	    test_prng_alg('xor128', prng_xor128, snap));

	  describe('isolated', () =>
	    test_prng_alg('xor128', prng_xor128$1, snap));

	  describe('isolated minified', () =>
	    test_prng_alg('xor128', t$1, snap));

	  if (cjs_prng_xor128)
	    describe('original seedrandom (CommonJS)', () =>
	      test_prng_alg('xor128', cjs_prng_xor128, snap));
	});

	function _prng_restore$3(prng, xg, opts) {
	  let state = opts && opts.state;
	  if (state) {
	    if (typeof(state) == 'object') xg.copy(state, xg);
	    prng.state = () => xg.copy(xg, {});
	  }
	}

	function _prng_xor_core$2(xg, opts) {
	  let prng = () => (xg.next() >>> 0) / 0x100000000;

	  prng.double = () => {
	    let top, bot, result;
	    do {
	      top = xg.next() >>> 11;
	      bot = (xg.next() >>> 0) / 0x100000000;
	      result = (top + bot) / (1 << 21);
	    } while (result === 0);
	    return result;
	  };

	  prng.int32 = () => xg.next() | 0;

	  prng.quick = prng;

	  _prng_restore$3(prng, xg, opts);
	  return prng;
	}

	// A Javascript implementaion of the "Tyche-i" prng algorithm by
	function prng_tychei$1(seed, opts) {
	  let xg = new TycheiGen$1(seed);
	  return _prng_xor_core$2(xg, opts);
	}

	class TycheiGen$1 {
	  constructor(seed) {
	    if (seed == null) seed = +(new Date);

	    let strseed = '';

	    this.a = 0;
	    this.b = 0;
	    this.c = 2654435769 | 0;
	    this.d = 1367130551;

	    if (seed === Math.floor(seed)) {
	      // Integer seed.
	      this.a = (seed / 0x100000000) | 0;
	      this.b = seed | 0;
	    } else {
	      // String seed.
	      strseed += seed;
	    }

	    // Mix in string seed, then discard an initial batch of 64 values.
	    for (let k = 0; k < strseed.length + 20; k++) {
	      this.b ^= strseed.charCodeAt(k) | 0;
	      this.next();
	    }
	  }

	  next() {
	    let {a,b,c,d} = this;
	    b = (b << 25) ^ (b >>> 7) ^ c;
	    c = (c - d) | 0;
	    d = (d << 24) ^ (d >>> 8) ^ a;
	    a = (a - b) | 0;
	    this.b = b = (b << 20) ^ (b >>> 12) ^ c;
	    this.c = c = (c - d) | 0;
	    this.d = (d << 16) ^ (c >>> 16) ^ a;
	    return this.a = (a - b) | 0;
	  };

	  copy(f, t) {
	    t.a = f.a;
	    t.b = f.b;
	    t.c = f.c;
	    t.d = f.d;
	    return t;
	  }
	}

	function t$2(t,n){return function(t,e){let n=()=>(t.next()>>>0)/4294967296;return n.double=()=>{let e,n,i;do{e=t.next()>>>11,n=(t.next()>>>0)/4294967296,i=(e+n)/(1<<21);}while(0===i);return i},n.int32=()=>0|t.next(),n.quick=n,function(t,e,n){let i=n&&n.state;i&&("object"==typeof i&&e.copy(i,e),t.state=()=>e.copy(e,{}));}(n,t,e),n}(new e$1(t),n)}class e$1{constructor(t){null==t&&(t=+new Date);let e="";this.a=0,this.b=0,this.c=-1640531527,this.d=1367130551,t===Math.floor(t)?(this.a=t/4294967296|0,this.b=0|t):e+=t;for(let t=0;t<e.length+20;t++)this.b^=0|e.charCodeAt(t),this.next();}next(){let{a:t,b:e,c:n,d:i}=this;return e=e<<25^e>>>7^n,n=n-i|0,i=i<<24^i>>>8^t,t=t-e|0,this.b=e=e<<20^e>>>12^n,this.c=n=n-i|0,this.d=i<<16^n>>>16^t,this.a=t-e|0}copy(t,e){return e.a=t.a,e.b=t.b,e.c=t.c,e.d=t.d,e}}

	const cjs_prng_tychei = require('seedrandom/lib/tychei.js');

	describe('tychei', () => {
	  let _ans_shared = [0.8043622805271298,0.32537893974222243,0.3481273828074336];
	  const snap = {
	    seed: 'an example seed string',
	    direct: _ans_shared,
	    quick: _ans_shared,
	    int32: [-840257607,1397491905,1495195724],
	    double: [0.8043619753737162,0.3481274036560348,0.12684038641910578],
	  };


	  describe('shared', () =>
	    test_prng_alg('tychei', prng_tychei, snap));

	  describe('isolated', () =>
	    test_prng_alg('tychei', prng_tychei$1, snap));

	  describe('isolated minified', () =>
	    test_prng_alg('tychei', t$2, snap));

	  if (cjs_prng_tychei)
	    describe('original seedrandom (CommonJS)', () =>
	      test_prng_alg('tychei', cjs_prng_tychei, snap));
	});

	function _prng_restore$4(prng, xg, opts) {
	  let state = opts && opts.state;
	  if (state) {
	    if (typeof(state) == 'object') xg.copy(state, xg);
	    prng.state = () => xg.copy(xg, {});
	  }
	}

	function _prng_xor_core$3(xg, opts) {
	  let prng = () => (xg.next() >>> 0) / 0x100000000;

	  prng.double = () => {
	    let top, bot, result;
	    do {
	      top = xg.next() >>> 11;
	      bot = (xg.next() >>> 0) / 0x100000000;
	      result = (top + bot) / (1 << 21);
	    } while (result === 0);
	    return result;
	  };

	  prng.int32 = () => xg.next() | 0;

	  prng.quick = prng;

	  _prng_restore$4(prng, xg, opts);
	  return prng;
	}

	// A Javascript implementaion of the "xorwow" prng algorithm by
	function prng_xorwow$1(seed, opts) {
	  let xg = new XorWowGen$1(seed);
	  return _prng_xor_core$3(xg, opts);
	}

	class XorWowGen$1 {
	  constructor(seed) {
	    if (seed == null) seed = +(new Date);

	    let strseed = '';

	    this.x = 0;
	    this.y = 0;
	    this.z = 0;
	    this.w = 0;
	    this.v = 0;

	    if (seed === (seed | 0)) {
	      // Integer seed.
	      this.x = seed;
	    } else {
	      // String seed.
	      strseed += seed;
	    }

	    // Mix in string seed, then discard an initial batch of 64 values.
	    for (let k = 0; k < strseed.length + 64; k++) {
	      this.x ^= strseed.charCodeAt(k) | 0;
	      if (k == strseed.length) {
	        this.d = this.x << 10 ^ this.x >>> 4;
	      }
	      this.next();
	    }
	  }

	  next() {
	    let {x,y,z,w,v,d} = this;
	    let t = (x ^ (x >>> 2));
	    this.x = y;
	    this.y = z;
	    this.z = w;
	    this.w = v;
	    return (this.d = (d + 362437 | 0)) +
	       (this.v = (v ^ (v << 4)) ^ (t ^ (t << 1))) | 0;
	  };

	  copy(f, t) {
	    t.x = f.x;
	    t.y = f.y;
	    t.z = f.z;
	    t.w = f.w;
	    t.v = f.v;
	    t.d = f.d;
	    return t;
	  }
	}

	function t$3(t,i){return function(t,e){let i=()=>(t.next()>>>0)/4294967296;return i.double=()=>{let e,i,n;do{e=t.next()>>>11,i=(t.next()>>>0)/4294967296,n=(e+i)/(1<<21);}while(0===n);return n},i.int32=()=>0|t.next(),i.quick=i,function(t,e,i){let n=i&&i.state;n&&("object"==typeof n&&e.copy(n,e),t.state=()=>e.copy(e,{}));}(i,t,e),i}(new e$2(t),i)}class e$2{constructor(t){null==t&&(t=+new Date);let e="";this.x=0,this.y=0,this.z=0,this.w=0,this.v=0,t===(0|t)?this.x=t:e+=t;for(let t=0;t<e.length+64;t++)this.x^=0|e.charCodeAt(t),t==e.length&&(this.d=this.x<<10^this.x>>>4),this.next();}next(){let{x:t,y:e,z:i,w:n,v:s,d:h}=this,x=t^t>>>2;return this.x=e,this.y=i,this.z=n,this.w=s,(this.d=h+362437|0)+(this.v=s^s<<4^x^x<<1)|0}copy(t,e){return e.x=t.x,e.y=t.y,e.z=t.z,e.w=t.w,e.v=t.v,e.d=t.d,e}}

	const cjs_prng_xorwow = require('seedrandom/lib/xorwow.js');

	describe('xorwow', () => {
	  let _ans_shared = [0.5758649727795273,0.23727833456359804,0.37159455730579793];

	  const snap = {
	    seed: 'an example seed string',
	    direct: _ans_shared,
	    quick: _ans_shared,
	    int32: [ -1821646071, 1019102687, 1595986471 ],
	    double: [0.5758649050132439,0.37159468988193467,0.9183901875866184],
	  };

	  describe('shared', () =>
	    test_prng_alg('xorwow', prng_xorwow, snap));

	  describe('isolated', () =>
	    test_prng_alg('xorwow', prng_xorwow$1, snap));

	  describe('isolated minified', () =>
	    test_prng_alg('xorwow', t$3, snap));

	  if (cjs_prng_xorwow)
	    describe('original seedrandom (CommonJS)', () =>
	      test_prng_alg('xorwow', cjs_prng_xorwow, snap));
	});

	function _prng_restore$5(prng, xg, opts) {
	  let state = opts && opts.state;
	  if (state) {
	    if (typeof(state) == 'object') xg.copy(state, xg);
	    prng.state = () => xg.copy(xg, {});
	  }
	}

	function _prng_xor_core$4(xg, opts) {
	  let prng = () => (xg.next() >>> 0) / 0x100000000;

	  prng.double = () => {
	    let top, bot, result;
	    do {
	      top = xg.next() >>> 11;
	      bot = (xg.next() >>> 0) / 0x100000000;
	      result = (top + bot) / (1 << 21);
	    } while (result === 0);
	    return result;
	  };

	  prng.int32 = () => xg.next() | 0;

	  prng.quick = prng;

	  _prng_restore$5(prng, xg, opts);
	  return prng;
	}

	// A Javascript implementaion of Richard Brent's Xorgens xor4096 algorithm.
	function prng_xor4096$1(seed, opts) {
	  let xg = new Xor4096Gen$1(seed);
	  return _prng_xor_core$4(xg, opts);
	}


	class Xor4096Gen$1 {
	  constructor(seed) {
	    if (seed == null) seed = +(new Date);

	    let t, v, i, j, w, X = [], limit = 128;
	    if (seed === (seed | 0)) {
	      // Numeric seeds initialize v, which is used to generates X.
	      v = seed;
	      seed = null;
	    } else {
	      // String seeds are mixed into v and X one character at a time.
	      seed = seed + '\0';
	      v = 0;
	      limit = Math.max(limit, seed.length);
	    }
	    // Initialize circular array and weyl value.
	    for (i = 0, j = -32; j < limit; ++j) {
	      // Put the unicode characters into the array, and shuffle them.
	      if (seed) v ^= seed.charCodeAt((j + 32) % seed.length);
	      // After 32 shuffles, take v as the starting w value.
	      if (j === 0) w = v;
	      v ^= v << 10;
	      v ^= v >>> 15;
	      v ^= v << 4;
	      v ^= v >>> 13;
	      if (j >= 0) {
	        w = (w + 0x61c88647) | 0;     // Weyl.
	        t = (X[j & 127] ^= (v + w));  // Combine xor and weyl to init array.
	        i = (0 == t) ? i + 1 : 0;     // Count zeroes.
	      }
	    }
	    // We have detected all zeroes; make the key nonzero.
	    if (i >= 128) {
	      X[(seed && seed.length || 0) & 127] = -1;
	    }
	    // Run the generator 512 times to further mix the state before using it.
	    // Factoring this as a function slows the main generator, so it is just
	    // unrolled here.  The weyl generator is not advanced while warming up.
	    i = 127;
	    for (j = 4 * 128; j > 0; --j) {
	      v = X[(i + 34) & 127];
	      t = X[i = ((i + 1) & 127)];
	      v ^= v << 13;
	      t ^= t << 17;
	      v ^= v >>> 15;
	      t ^= t >>> 12;
	      X[i] = v ^ t;
	    }
	    // Storing state as object members is faster than using closure variables.
	    this.w = w;
	    this.X = X;
	    this.i = i;
	  }

	  next() {
	    let t, v, {w, X, i} = this;
	    // Update Weyl generator.
	    this.w = w = (w + 0x61c88647) | 0;
	    // Update xor generator.
	    v = X[(i + 34) & 127];
	    t = X[i = ((i + 1) & 127)];
	    v ^= v << 13;
	    t ^= t << 17;
	    v ^= v >>> 15;
	    t ^= t >>> 12;
	    // Update Xor generator array state.
	    v = X[i] = v ^ t;
	    this.i = i;
	    // Result is the combination.
	    return (v + (w ^ (w >>> 16))) | 0;
	  }

	  copy(f, t) {
	    t.i = f.i;
	    t.w = f.w;
	    t.X = [... f.X];
	    return t;
	  }
	}

	function t$4(t,n){return function(t,e){let n=()=>(t.next()>>>0)/4294967296;return n.double=()=>{let e,n,i;do{e=t.next()>>>11,n=(t.next()>>>0)/4294967296,i=(e+n)/(1<<21);}while(0===i);return i},n.int32=()=>0|t.next(),n.quick=n,function(t,e,n){let i=n&&n.state;i&&("object"==typeof i&&e.copy(i,e),t.state=()=>e.copy(e,{}));}(n,t,e),n}(new e$3(t),n)}class e$3{constructor(t){null==t&&(t=+new Date);let e,n,i,o,r,l=[],u=128;for(t===(0|t)?(n=t,t=null):(t+="\0",n=0,u=Math.max(u,t.length)),i=0,o=-32;o<u;++o)t&&(n^=t.charCodeAt((o+32)%t.length)),0===o&&(r=n),n^=n<<10,n^=n>>>15,n^=n<<4,n^=n>>>13,o>=0&&(r=r+1640531527|0,e=l[127&o]^=n+r,i=0==e?i+1:0);for(i>=128&&(l[127&(t&&t.length||0)]=-1),i=127,o=512;o>0;--o)n=l[i+34&127],e=l[i=i+1&127],n^=n<<13,e^=e<<17,n^=n>>>15,e^=e>>>12,l[i]=n^e;this.w=r,this.X=l,this.i=i;}next(){let t,e,{w:n,X:i,i:o}=this;return this.w=n=n+1640531527|0,e=i[o+34&127],t=i[o=o+1&127],e^=e<<13,t^=t<<17,e^=e>>>15,t^=t>>>12,e=i[o]=e^t,this.i=o,e+(n^n>>>16)|0}copy(t,e){return e.i=t.i,e.w=t.w,e.X=[...t.X],e}}

	const cjs_prng_xor4096 = require('seedrandom/lib/xor4096.js');

	describe('xor4096', () => {
	  let _ans_shared = [0.6993883652612567,0.2972783006262034,0.9184850819874555];
	  const snap = {
	    seed: 'an example seed string',
	    direct: _ans_shared,
	    quick: _ans_shared,
	    int32: [-1291117140, 1276800579, -350103907],
	    double: [0.6993881689445022,0.9184847710401316,0.39560491763906536],
	  };

	  describe('shared', () =>
	    test_prng_alg('xor4096', prng_xor4096, snap));

	  describe('isolated', () =>
	    test_prng_alg('xor4096', prng_xor4096$1, snap));

	  describe('isolated minified', () =>
	    test_prng_alg('xor4096', t$4, snap));

	  if (cjs_prng_xor4096)
	    describe('original seedrandom (CommonJS)', () =>
	      test_prng_alg('xor4096', cjs_prng_xor4096, snap));
	});

	function _prng_restore$6(prng, xg, opts) {
	  let state = opts && opts.state;
	  if (state) {
	    if (typeof(state) == 'object') xg.copy(state, xg);
	    prng.state = () => xg.copy(xg, {});
	  }
	}

	function _prng_xor_core$5(xg, opts) {
	  let prng = () => (xg.next() >>> 0) / 0x100000000;

	  prng.double = () => {
	    let top, bot, result;
	    do {
	      top = xg.next() >>> 11;
	      bot = (xg.next() >>> 0) / 0x100000000;
	      result = (top + bot) / (1 << 21);
	    } while (result === 0);
	    return result;
	  };

	  prng.int32 = () => xg.next() | 0;

	  prng.quick = prng;

	  _prng_restore$6(prng, xg, opts);
	  return prng;
	}

	// A Javascript implementaion of the "xorshift7" algorithm by
	function prng_xorshift7$1(seed, opts) {
	  let xg = new XorShift7Gen$1(seed);
	  return _prng_xor_core$5(xg, opts);
	}


	class XorShift7Gen$1 {
	  constructor(seed) {
	    if (seed == null) seed = +(new Date);

	    var j, w, x = [];

	    if (seed === (seed | 0)) {
	      // Seed state array using a 32-bit integer.
	      w = x[0] = seed;
	    } else {
	      // Seed state using a string.
	      seed = '' + seed;
	      for (j = 0; j < seed.length; ++j) {
	        x[j & 7] = (x[j & 7] << 15) ^
	            (seed.charCodeAt(j) + x[(j + 1) & 7] << 13);
	      }
	    }

	    // Enforce an array length of 8, not all zeroes.
	    while (x.length < 8) x.push(0);
	    for (j = 0; j < 8 && x[j] === 0; ++j);
	    if (j == 8) w = x[7] = -1; else w = x[j];

	    this.x = x;
	    this.i = 0;

	    // Discard an initial 256 values.
	    for (j = 256; j > 0; --j) {
	      this.next();
	    }
	  }

	  next() {
	    // Update xor generator.
	    let t, v, {x,i} = this;
	    t = x[i]; t ^= (t >>> 7); v = t ^ (t << 24);
	    t = x[(i + 1) & 7]; v ^= t ^ (t >>> 10);
	    t = x[(i + 3) & 7]; v ^= t ^ (t >>> 3);
	    t = x[(i + 4) & 7]; v ^= t ^ (t << 7);
	    t = x[(i + 7) & 7]; t = t ^ (t << 13); v ^= t ^ (t << 9);
	    x[i] = v;
	    this.i = (i + 1) & 7;
	    return v;
	  };

	  copy(f, t) {
	    t.x = [... f.x];
	    t.i = f.i;
	    return t;
	  }
	}

	function t$5(t,n){return function(t,e){let n=()=>(t.next()>>>0)/4294967296;return n.double=()=>{let e,n,r;do{e=t.next()>>>11,n=(t.next()>>>0)/4294967296,r=(e+n)/(1<<21);}while(0===r);return r},n.int32=()=>0|t.next(),n.quick=n,function(t,e,n){let r=n&&n.state;r&&("object"==typeof r&&e.copy(r,e),t.state=()=>e.copy(e,{}));}(n,t,e),n}(new e$4(t),n)}class e$4{constructor(t){null==t&&(t=+new Date);var e,n=[];if(t===(0|t))n[0]=t;else for(t=""+t,e=0;e<t.length;++e)n[7&e]=n[7&e]<<15^t.charCodeAt(e)+n[e+1&7]<<13;for(;n.length<8;)n.push(0);for(e=0;e<8&&0===n[e];++e);for(8==e?n[7]=-1:n[e],this.x=n,this.i=0,e=256;e>0;--e)this.next();}next(){let t,e,{x:n,i:r}=this;return t=n[r],t^=t>>>7,e=t^t<<24,t=n[r+1&7],e^=t^t>>>10,t=n[r+3&7],e^=t^t>>>3,t=n[r+4&7],e^=t^t<<7,t=n[r+7&7],t^=t<<13,e^=t^t<<9,n[r]=e,this.i=r+1&7,e}copy(t,e){return e.x=[...t.x],e.i=t.i,e}}

	const cjs_prng_xorshift7 = require('seedrandom/lib/xorshift7.js');

	describe('xorshift7', () => {
	  let _ans_shared = [0.2192698367871344,0.8553422808181494,0.2642597162630409];
	  const snap = {
	    seed: 'an example seed string',
	    direct: _ans_shared,
	    quick: _ans_shared,
	    int32: [ 941756778, -621300173, 1134986839 ],
	    double: [0.21927016036142388,0.2642595533104317,0.3881930901075237],
	  };

	  describe('shared', () =>
	    test_prng_alg('xorshift7', prng_xorshift7, snap));

	  describe('isolated', () =>
	    test_prng_alg('xorshift7', prng_xorshift7$1, snap));

	  describe('isolated minified', () =>
	    test_prng_alg('xorshift7', t$5, snap));

	  if (cjs_prng_xorshift7)
	    describe('original seedrandom (CommonJS)', () =>
	      test_prng_alg('xorshift7', cjs_prng_xorshift7, snap));
	});

	function _prng_restore$7(prng, xg, opts) {
	  let state = opts && opts.state;
	  if (state) {
	    if (typeof(state) == 'object') xg.copy(state, xg);
	    prng.state = () => xg.copy(xg, {});
	  }
	}

	/*
	Copyright 2019 David Bau.

	Permission is hereby granted, free of charge, to any person obtaining
	a copy of this software and associated documentation files (the
	"Software"), to deal in the Software without restriction, including
	without limitation the rights to use, copy, modify, merge, publish,
	distribute, sublicense, and/or sell copies of the Software, and to
	permit persons to whom the Software is furnished to do so, subject to
	the following conditions:

	The above copyright notice and this permission notice shall be
	included in all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
	EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
	IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
	CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
	TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
	SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

	*/
	function prng_arc4$1(seed, opts) {
	  let xg = new ARC4Gen$1(seed);
	  let prng = () => xg.next();

	  prng.double = prng;

	  prng.int32 = () => xg.g(4) | 0;

	  prng.quick = () => xg.g(4) / 0x100000000;

	  _prng_restore$7(prng, xg, opts);
	  return prng
	}


	//
	// ARC4
	//
	// An ARC4 implementation.  The constructor takes a key in the form of
	// an array of at most (width) integers that should be 0 <= x < (width).
	//
	// The g(count) method returns a pseudorandom integer that concatenates
	// the next (count) outputs from ARC4.  Its return value is a number x
	// that is in the range 0 <= x < (width ^ count).
	//

	//
	// The following constants are related to IEEE 754 limits.
	//

	// const width = 256 // each RC4 output is 0 <= x < 256
	// const chunks = 6 // at least six RC4 outputs for each double
	const _arc4_startdenom$1 = 281474976710656;     // 256 ** 6 == width ** chunks
	const _arc4_significance$1 = 4503599627370496;  // 2 ** 52 significant digits in a double
	const _arc4_overflow$1 = 9007199254740992;      // 2 ** 53 == significance * 2


	class ARC4Gen$1 {
	  constructor(seed) {
	    if (seed == null) seed = +(new Date);

	    let key = this.mixkey(seed, []);
	    let i,j,t, S=[], keylen = key.length;
	    this.i = this.j = i = j = 0;
	    this.S = S;

	    // The empty key [] is treated as [0].
	    if (!keylen) { key = [keylen++]; }

	    // Set up S using the standard key scheduling algorithm.
	    while (i <= 0xff) {
	      S[i] = i++;
	    }
	    for (i = 0; i <= 0xff; i++) {
	      S[i] = S[j = 0xff & (j + key[i % keylen] + (t = S[i]))];
	      S[j] = t;
	    }

	    // For robust unpredictability, the function call below automatically
	    // discards an initial batch of values.  This is called RC4-drop[256].
	    // See http://google.com/search?q=rsa+fluhrer+response&btnI
	    this.g(256);
	  }

	  next() {
	    // This function returns a random double in [0, 1) that contains
	    // randomness in every bit of the mantissa of the IEEE 754 value.

	    let n = this.g(6);                  // Start with a numerator n < 2 ^ 48
	    let d = _arc4_startdenom$1;           //   and denominator d = 2 ^ 48.
	    let x = 0;                          //   and no 'extra last byte'.

	    while (n < _arc4_significance$1) {    // Fill up all significant digits (2 ** 52)
	      n = (n + x) * 256;                //   by shifting numerator and
	      d *= 256;                         //   denominator and generating a
	      x = this.g(1);                    //   new least-significant-byte.
	    }
	    while (n >= _arc4_overflow$1) {       // To avoid rounding past overflow, before adding
	      n /= 2;                           //   last byte, shift everything
	      d /= 2;                           //   right using integer math until
	      x >>>= 1;                         //   we have exactly the desired bits.
	    }
	    return (n + x) / d;                 // Form the number within [0, 1).
	  }

	  g(count) {
	    // The "g" method returns the next (count) outputs as one number.
	    let t, r = 0, {i,j,S} = this;
	    while (count--) {
	      t = S[i = 0xff & (i + 1)];
	      r = r * 256 + S[0xff & ((S[i] = S[j = 0xff & (j + t)]) + (S[j] = t))];
	    }
	    this.i = i;
	    this.j = j;
	    return r;
	  }

	  copy(f, t) {
	    t.i = f.i;
	    t.j = f.j;
	    t.S = [... f.S];
	    return t;
	  }

	  mixkey(seed, key) {
	    seed = seed + '';
	    let smear=0, j=0;
	    while (j < seed.length) {
	      key[0xff & j] =
	        0xff & ((smear ^= key[0xff & j] * 19) + seed.charCodeAt(j++));
	    }
	    return key
	  }
	}

	function t$6(t,i){let r=new e$5(t),o=()=>r.next();return o.double=o,o.int32=()=>0|r.g(4),o.quick=()=>r.g(4)/4294967296,function(t,e,i){let r=i&&i.state;r&&("object"==typeof r&&e.copy(r,e),t.state=()=>e.copy(e,{}));}(o,r,i),o}class e$5{constructor(t){null==t&&(t=+new Date);let e,i,r,o=this.mixkey(t,[]),n=[],s=o.length;for(this.i=this.j=e=i=0,this.S=n,s||(o=[s++]);e<=255;)n[e]=e++;for(e=0;e<=255;e++)n[e]=n[i=255&i+o[e%s]+(r=n[e])],n[i]=r;this.g(256);}next(){let t=this.g(6),e=281474976710656,i=0;for(;t<4503599627370496;)t=256*(t+i),e*=256,i=this.g(1);for(;t>=9007199254740992;)t/=2,e/=2,i>>>=1;return (t+i)/e}g(t){let e,i=0,{i:r,j:o,S:n}=this;for(;t--;)e=n[r=255&r+1],i=256*i+n[255&(n[r]=n[o=255&o+e])+(n[o]=e)];return this.i=r,this.j=o,i}copy(t,e){return e.i=t.i,e.j=t.j,e.S=[...t.S],e}mixkey(t,e){t+="";let i=0,r=0;for(;r<t.length;)e[255&r]=255&(i^=19*e[255&r])+t.charCodeAt(r++);return e}}

	const cjs_prng_arc4 = require('seedrandom');

	describe('arc4', () => {
	  let _ans_shared =
	    [ 0.7396757600041567, 0.2125229710920903, 0.6653061318678898 ];
	  const snap = {
	    seed: 'an example seed string',
	    direct: _ans_shared,
	    quick: [0.7396757598035038,0.8617978817783296,0.4058805995155126],
	    int32: [-1118084098,-593573578,1743243901],
	    double: _ans_shared,
	  };

	  describe('shared', () =>
	    test_prng_alg('arc4', prng_arc4, snap));

	  describe('isolated', () =>
	    test_prng_alg('arc4', prng_arc4$1, snap));

	  describe('isolated minified', () =>
	    test_prng_alg('arc4', t$6, snap));

	  if (cjs_prng_arc4)
	    describe('original seedrandom (CommonJS)', () =>
	      test_prng_alg('arc4', cjs_prng_arc4, snap));
	});

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiX191bml0dGVzdC5paWZlLmpzIiwic291cmNlcyI6WyJub2RlX21vZHVsZXMva2xldXIvaW5kZXgubWpzIiwibm9kZV9tb2R1bGVzL3V2dS9ub2RlX21vZHVsZXMvZGlmZi9saWIvaW5kZXgubWpzIiwibm9kZV9tb2R1bGVzL3V2dS9kaWZmL2luZGV4Lm1qcyIsIm5vZGVfbW9kdWxlcy91dnUvYXNzZXJ0L2luZGV4Lm1qcyIsInVuaXQvX2NvbW1vbi5tanMiLCIuLi9lc20vaW5kZXgubWpzIiwiLi4vZXNtL2FsZWEubWpzIiwiLi4vZXNtL2FsZWEubWluLm1qcyIsInVuaXQvYWxlYS5tanMiLCIuLi9lc20veG9yMTI4Lm1qcyIsIi4uL2VzbS94b3IxMjgubWluLm1qcyIsInVuaXQveG9yMTI4Lm1qcyIsIi4uL2VzbS90eWNoZWkubWpzIiwiLi4vZXNtL3R5Y2hlaS5taW4ubWpzIiwidW5pdC90eWNoZWkubWpzIiwiLi4vZXNtL3hvcndvdy5tanMiLCIuLi9lc20veG9yd293Lm1pbi5tanMiLCJ1bml0L3hvcndvdy5tanMiLCIuLi9lc20veG9yNDA5Ni5tanMiLCIuLi9lc20veG9yNDA5Ni5taW4ubWpzIiwidW5pdC94b3I0MDk2Lm1qcyIsIi4uL2VzbS94b3JzaGlmdDcubWpzIiwiLi4vZXNtL3hvcnNoaWZ0Ny5taW4ubWpzIiwidW5pdC94b3JzaGlmdDcubWpzIiwiLi4vZXNtL2FyYzQubWpzIiwiLi4vZXNtL2FyYzQubWluLm1qcyIsInVuaXQvYXJjNC5tanMiXSwic291cmNlc0NvbnRlbnQiOlsiJ3VzZSBzdHJpY3QnO1xuXG5sZXQgRk9SQ0VfQ09MT1IsIE5PREVfRElTQUJMRV9DT0xPUlMsIE5PX0NPTE9SLCBURVJNLCBpc1RUWT10cnVlO1xuaWYgKHR5cGVvZiBwcm9jZXNzICE9PSAndW5kZWZpbmVkJykge1xuXHQoeyBGT1JDRV9DT0xPUiwgTk9ERV9ESVNBQkxFX0NPTE9SUywgTk9fQ09MT1IsIFRFUk0gfSA9IHByb2Nlc3MuZW52KTtcblx0aXNUVFkgPSBwcm9jZXNzLnN0ZG91dCAmJiBwcm9jZXNzLnN0ZG91dC5pc1RUWTtcbn1cblxuY29uc3QgJCA9IHtcblx0ZW5hYmxlZDogIU5PREVfRElTQUJMRV9DT0xPUlMgJiYgTk9fQ09MT1IgPT0gbnVsbCAmJiBURVJNICE9PSAnZHVtYicgJiYgKFxuXHRcdEZPUkNFX0NPTE9SICE9IG51bGwgJiYgRk9SQ0VfQ09MT1IgIT09ICcwJyB8fCBpc1RUWVxuXHQpLFxuXG5cdC8vIG1vZGlmaWVyc1xuXHRyZXNldDogaW5pdCgwLCAwKSxcblx0Ym9sZDogaW5pdCgxLCAyMiksXG5cdGRpbTogaW5pdCgyLCAyMiksXG5cdGl0YWxpYzogaW5pdCgzLCAyMyksXG5cdHVuZGVybGluZTogaW5pdCg0LCAyNCksXG5cdGludmVyc2U6IGluaXQoNywgMjcpLFxuXHRoaWRkZW46IGluaXQoOCwgMjgpLFxuXHRzdHJpa2V0aHJvdWdoOiBpbml0KDksIDI5KSxcblxuXHQvLyBjb2xvcnNcblx0YmxhY2s6IGluaXQoMzAsIDM5KSxcblx0cmVkOiBpbml0KDMxLCAzOSksXG5cdGdyZWVuOiBpbml0KDMyLCAzOSksXG5cdHllbGxvdzogaW5pdCgzMywgMzkpLFxuXHRibHVlOiBpbml0KDM0LCAzOSksXG5cdG1hZ2VudGE6IGluaXQoMzUsIDM5KSxcblx0Y3lhbjogaW5pdCgzNiwgMzkpLFxuXHR3aGl0ZTogaW5pdCgzNywgMzkpLFxuXHRncmF5OiBpbml0KDkwLCAzOSksXG5cdGdyZXk6IGluaXQoOTAsIDM5KSxcblxuXHQvLyBiYWNrZ3JvdW5kIGNvbG9yc1xuXHRiZ0JsYWNrOiBpbml0KDQwLCA0OSksXG5cdGJnUmVkOiBpbml0KDQxLCA0OSksXG5cdGJnR3JlZW46IGluaXQoNDIsIDQ5KSxcblx0YmdZZWxsb3c6IGluaXQoNDMsIDQ5KSxcblx0YmdCbHVlOiBpbml0KDQ0LCA0OSksXG5cdGJnTWFnZW50YTogaW5pdCg0NSwgNDkpLFxuXHRiZ0N5YW46IGluaXQoNDYsIDQ5KSxcblx0YmdXaGl0ZTogaW5pdCg0NywgNDkpXG59O1xuXG5mdW5jdGlvbiBydW4oYXJyLCBzdHIpIHtcblx0bGV0IGk9MCwgdG1wLCBiZWc9JycsIGVuZD0nJztcblx0Zm9yICg7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcblx0XHR0bXAgPSBhcnJbaV07XG5cdFx0YmVnICs9IHRtcC5vcGVuO1xuXHRcdGVuZCArPSB0bXAuY2xvc2U7XG5cdFx0aWYgKHN0ci5pbmNsdWRlcyh0bXAuY2xvc2UpKSB7XG5cdFx0XHRzdHIgPSBzdHIucmVwbGFjZSh0bXAucmd4LCB0bXAuY2xvc2UgKyB0bXAub3Blbik7XG5cdFx0fVxuXHR9XG5cdHJldHVybiBiZWcgKyBzdHIgKyBlbmQ7XG59XG5cbmZ1bmN0aW9uIGNoYWluKGhhcywga2V5cykge1xuXHRsZXQgY3R4ID0geyBoYXMsIGtleXMgfTtcblxuXHRjdHgucmVzZXQgPSAkLnJlc2V0LmJpbmQoY3R4KTtcblx0Y3R4LmJvbGQgPSAkLmJvbGQuYmluZChjdHgpO1xuXHRjdHguZGltID0gJC5kaW0uYmluZChjdHgpO1xuXHRjdHguaXRhbGljID0gJC5pdGFsaWMuYmluZChjdHgpO1xuXHRjdHgudW5kZXJsaW5lID0gJC51bmRlcmxpbmUuYmluZChjdHgpO1xuXHRjdHguaW52ZXJzZSA9ICQuaW52ZXJzZS5iaW5kKGN0eCk7XG5cdGN0eC5oaWRkZW4gPSAkLmhpZGRlbi5iaW5kKGN0eCk7XG5cdGN0eC5zdHJpa2V0aHJvdWdoID0gJC5zdHJpa2V0aHJvdWdoLmJpbmQoY3R4KTtcblxuXHRjdHguYmxhY2sgPSAkLmJsYWNrLmJpbmQoY3R4KTtcblx0Y3R4LnJlZCA9ICQucmVkLmJpbmQoY3R4KTtcblx0Y3R4LmdyZWVuID0gJC5ncmVlbi5iaW5kKGN0eCk7XG5cdGN0eC55ZWxsb3cgPSAkLnllbGxvdy5iaW5kKGN0eCk7XG5cdGN0eC5ibHVlID0gJC5ibHVlLmJpbmQoY3R4KTtcblx0Y3R4Lm1hZ2VudGEgPSAkLm1hZ2VudGEuYmluZChjdHgpO1xuXHRjdHguY3lhbiA9ICQuY3lhbi5iaW5kKGN0eCk7XG5cdGN0eC53aGl0ZSA9ICQud2hpdGUuYmluZChjdHgpO1xuXHRjdHguZ3JheSA9ICQuZ3JheS5iaW5kKGN0eCk7XG5cdGN0eC5ncmV5ID0gJC5ncmV5LmJpbmQoY3R4KTtcblxuXHRjdHguYmdCbGFjayA9ICQuYmdCbGFjay5iaW5kKGN0eCk7XG5cdGN0eC5iZ1JlZCA9ICQuYmdSZWQuYmluZChjdHgpO1xuXHRjdHguYmdHcmVlbiA9ICQuYmdHcmVlbi5iaW5kKGN0eCk7XG5cdGN0eC5iZ1llbGxvdyA9ICQuYmdZZWxsb3cuYmluZChjdHgpO1xuXHRjdHguYmdCbHVlID0gJC5iZ0JsdWUuYmluZChjdHgpO1xuXHRjdHguYmdNYWdlbnRhID0gJC5iZ01hZ2VudGEuYmluZChjdHgpO1xuXHRjdHguYmdDeWFuID0gJC5iZ0N5YW4uYmluZChjdHgpO1xuXHRjdHguYmdXaGl0ZSA9ICQuYmdXaGl0ZS5iaW5kKGN0eCk7XG5cblx0cmV0dXJuIGN0eDtcbn1cblxuZnVuY3Rpb24gaW5pdChvcGVuLCBjbG9zZSkge1xuXHRsZXQgYmxrID0ge1xuXHRcdG9wZW46IGBcXHgxYlske29wZW59bWAsXG5cdFx0Y2xvc2U6IGBcXHgxYlske2Nsb3NlfW1gLFxuXHRcdHJneDogbmV3IFJlZ0V4cChgXFxcXHgxYlxcXFxbJHtjbG9zZX1tYCwgJ2cnKVxuXHR9O1xuXHRyZXR1cm4gZnVuY3Rpb24gKHR4dCkge1xuXHRcdGlmICh0aGlzICE9PSB2b2lkIDAgJiYgdGhpcy5oYXMgIT09IHZvaWQgMCkge1xuXHRcdFx0dGhpcy5oYXMuaW5jbHVkZXMob3BlbikgfHwgKHRoaXMuaGFzLnB1c2gob3BlbiksdGhpcy5rZXlzLnB1c2goYmxrKSk7XG5cdFx0XHRyZXR1cm4gdHh0ID09PSB2b2lkIDAgPyB0aGlzIDogJC5lbmFibGVkID8gcnVuKHRoaXMua2V5cywgdHh0KycnKSA6IHR4dCsnJztcblx0XHR9XG5cdFx0cmV0dXJuIHR4dCA9PT0gdm9pZCAwID8gY2hhaW4oW29wZW5dLCBbYmxrXSkgOiAkLmVuYWJsZWQgPyBydW4oW2Jsa10sIHR4dCsnJykgOiB0eHQrJyc7XG5cdH07XG59XG5cbmV4cG9ydCBkZWZhdWx0ICQ7XG4iLCJmdW5jdGlvbiBEaWZmKCkge31cbkRpZmYucHJvdG90eXBlID0ge1xuICBkaWZmOiBmdW5jdGlvbiBkaWZmKG9sZFN0cmluZywgbmV3U3RyaW5nKSB7XG4gICAgdmFyIG9wdGlvbnMgPSBhcmd1bWVudHMubGVuZ3RoID4gMiAmJiBhcmd1bWVudHNbMl0gIT09IHVuZGVmaW5lZCA/IGFyZ3VtZW50c1syXSA6IHt9O1xuICAgIHZhciBjYWxsYmFjayA9IG9wdGlvbnMuY2FsbGJhY2s7XG5cbiAgICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgIGNhbGxiYWNrID0gb3B0aW9ucztcbiAgICAgIG9wdGlvbnMgPSB7fTtcbiAgICB9XG5cbiAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGRvbmUodmFsdWUpIHtcbiAgICAgIGlmIChjYWxsYmFjaykge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBjYWxsYmFjayh1bmRlZmluZWQsIHZhbHVlKTtcbiAgICAgICAgfSwgMCk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHZhbHVlO1xuICAgICAgfVxuICAgIH0gLy8gQWxsb3cgc3ViY2xhc3NlcyB0byBtYXNzYWdlIHRoZSBpbnB1dCBwcmlvciB0byBydW5uaW5nXG5cblxuICAgIG9sZFN0cmluZyA9IHRoaXMuY2FzdElucHV0KG9sZFN0cmluZyk7XG4gICAgbmV3U3RyaW5nID0gdGhpcy5jYXN0SW5wdXQobmV3U3RyaW5nKTtcbiAgICBvbGRTdHJpbmcgPSB0aGlzLnJlbW92ZUVtcHR5KHRoaXMudG9rZW5pemUob2xkU3RyaW5nKSk7XG4gICAgbmV3U3RyaW5nID0gdGhpcy5yZW1vdmVFbXB0eSh0aGlzLnRva2VuaXplKG5ld1N0cmluZykpO1xuICAgIHZhciBuZXdMZW4gPSBuZXdTdHJpbmcubGVuZ3RoLFxuICAgICAgICBvbGRMZW4gPSBvbGRTdHJpbmcubGVuZ3RoO1xuICAgIHZhciBlZGl0TGVuZ3RoID0gMTtcbiAgICB2YXIgbWF4RWRpdExlbmd0aCA9IG5ld0xlbiArIG9sZExlbjtcbiAgICB2YXIgYmVzdFBhdGggPSBbe1xuICAgICAgbmV3UG9zOiAtMSxcbiAgICAgIGNvbXBvbmVudHM6IFtdXG4gICAgfV07IC8vIFNlZWQgZWRpdExlbmd0aCA9IDAsIGkuZS4gdGhlIGNvbnRlbnQgc3RhcnRzIHdpdGggdGhlIHNhbWUgdmFsdWVzXG5cbiAgICB2YXIgb2xkUG9zID0gdGhpcy5leHRyYWN0Q29tbW9uKGJlc3RQYXRoWzBdLCBuZXdTdHJpbmcsIG9sZFN0cmluZywgMCk7XG5cbiAgICBpZiAoYmVzdFBhdGhbMF0ubmV3UG9zICsgMSA+PSBuZXdMZW4gJiYgb2xkUG9zICsgMSA+PSBvbGRMZW4pIHtcbiAgICAgIC8vIElkZW50aXR5IHBlciB0aGUgZXF1YWxpdHkgYW5kIHRva2VuaXplclxuICAgICAgcmV0dXJuIGRvbmUoW3tcbiAgICAgICAgdmFsdWU6IHRoaXMuam9pbihuZXdTdHJpbmcpLFxuICAgICAgICBjb3VudDogbmV3U3RyaW5nLmxlbmd0aFxuICAgICAgfV0pO1xuICAgIH0gLy8gTWFpbiB3b3JrZXIgbWV0aG9kLiBjaGVja3MgYWxsIHBlcm11dGF0aW9ucyBvZiBhIGdpdmVuIGVkaXQgbGVuZ3RoIGZvciBhY2NlcHRhbmNlLlxuXG5cbiAgICBmdW5jdGlvbiBleGVjRWRpdExlbmd0aCgpIHtcbiAgICAgIGZvciAodmFyIGRpYWdvbmFsUGF0aCA9IC0xICogZWRpdExlbmd0aDsgZGlhZ29uYWxQYXRoIDw9IGVkaXRMZW5ndGg7IGRpYWdvbmFsUGF0aCArPSAyKSB7XG4gICAgICAgIHZhciBiYXNlUGF0aCA9IHZvaWQgMDtcblxuICAgICAgICB2YXIgYWRkUGF0aCA9IGJlc3RQYXRoW2RpYWdvbmFsUGF0aCAtIDFdLFxuICAgICAgICAgICAgcmVtb3ZlUGF0aCA9IGJlc3RQYXRoW2RpYWdvbmFsUGF0aCArIDFdLFxuICAgICAgICAgICAgX29sZFBvcyA9IChyZW1vdmVQYXRoID8gcmVtb3ZlUGF0aC5uZXdQb3MgOiAwKSAtIGRpYWdvbmFsUGF0aDtcblxuICAgICAgICBpZiAoYWRkUGF0aCkge1xuICAgICAgICAgIC8vIE5vIG9uZSBlbHNlIGlzIGdvaW5nIHRvIGF0dGVtcHQgdG8gdXNlIHRoaXMgdmFsdWUsIGNsZWFyIGl0XG4gICAgICAgICAgYmVzdFBhdGhbZGlhZ29uYWxQYXRoIC0gMV0gPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgY2FuQWRkID0gYWRkUGF0aCAmJiBhZGRQYXRoLm5ld1BvcyArIDEgPCBuZXdMZW4sXG4gICAgICAgICAgICBjYW5SZW1vdmUgPSByZW1vdmVQYXRoICYmIDAgPD0gX29sZFBvcyAmJiBfb2xkUG9zIDwgb2xkTGVuO1xuXG4gICAgICAgIGlmICghY2FuQWRkICYmICFjYW5SZW1vdmUpIHtcbiAgICAgICAgICAvLyBJZiB0aGlzIHBhdGggaXMgYSB0ZXJtaW5hbCB0aGVuIHBydW5lXG4gICAgICAgICAgYmVzdFBhdGhbZGlhZ29uYWxQYXRoXSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSAvLyBTZWxlY3QgdGhlIGRpYWdvbmFsIHRoYXQgd2Ugd2FudCB0byBicmFuY2ggZnJvbS4gV2Ugc2VsZWN0IHRoZSBwcmlvclxuICAgICAgICAvLyBwYXRoIHdob3NlIHBvc2l0aW9uIGluIHRoZSBuZXcgc3RyaW5nIGlzIHRoZSBmYXJ0aGVzdCBmcm9tIHRoZSBvcmlnaW5cbiAgICAgICAgLy8gYW5kIGRvZXMgbm90IHBhc3MgdGhlIGJvdW5kcyBvZiB0aGUgZGlmZiBncmFwaFxuXG5cbiAgICAgICAgaWYgKCFjYW5BZGQgfHwgY2FuUmVtb3ZlICYmIGFkZFBhdGgubmV3UG9zIDwgcmVtb3ZlUGF0aC5uZXdQb3MpIHtcbiAgICAgICAgICBiYXNlUGF0aCA9IGNsb25lUGF0aChyZW1vdmVQYXRoKTtcbiAgICAgICAgICBzZWxmLnB1c2hDb21wb25lbnQoYmFzZVBhdGguY29tcG9uZW50cywgdW5kZWZpbmVkLCB0cnVlKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBiYXNlUGF0aCA9IGFkZFBhdGg7IC8vIE5vIG5lZWQgdG8gY2xvbmUsIHdlJ3ZlIHB1bGxlZCBpdCBmcm9tIHRoZSBsaXN0XG5cbiAgICAgICAgICBiYXNlUGF0aC5uZXdQb3MrKztcbiAgICAgICAgICBzZWxmLnB1c2hDb21wb25lbnQoYmFzZVBhdGguY29tcG9uZW50cywgdHJ1ZSwgdW5kZWZpbmVkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIF9vbGRQb3MgPSBzZWxmLmV4dHJhY3RDb21tb24oYmFzZVBhdGgsIG5ld1N0cmluZywgb2xkU3RyaW5nLCBkaWFnb25hbFBhdGgpOyAvLyBJZiB3ZSBoYXZlIGhpdCB0aGUgZW5kIG9mIGJvdGggc3RyaW5ncywgdGhlbiB3ZSBhcmUgZG9uZVxuXG4gICAgICAgIGlmIChiYXNlUGF0aC5uZXdQb3MgKyAxID49IG5ld0xlbiAmJiBfb2xkUG9zICsgMSA+PSBvbGRMZW4pIHtcbiAgICAgICAgICByZXR1cm4gZG9uZShidWlsZFZhbHVlcyhzZWxmLCBiYXNlUGF0aC5jb21wb25lbnRzLCBuZXdTdHJpbmcsIG9sZFN0cmluZywgc2VsZi51c2VMb25nZXN0VG9rZW4pKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBPdGhlcndpc2UgdHJhY2sgdGhpcyBwYXRoIGFzIGEgcG90ZW50aWFsIGNhbmRpZGF0ZSBhbmQgY29udGludWUuXG4gICAgICAgICAgYmVzdFBhdGhbZGlhZ29uYWxQYXRoXSA9IGJhc2VQYXRoO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGVkaXRMZW5ndGgrKztcbiAgICB9IC8vIFBlcmZvcm1zIHRoZSBsZW5ndGggb2YgZWRpdCBpdGVyYXRpb24uIElzIGEgYml0IGZ1Z2x5IGFzIHRoaXMgaGFzIHRvIHN1cHBvcnQgdGhlXG4gICAgLy8gc3luYyBhbmQgYXN5bmMgbW9kZSB3aGljaCBpcyBuZXZlciBmdW4uIExvb3BzIG92ZXIgZXhlY0VkaXRMZW5ndGggdW50aWwgYSB2YWx1ZVxuICAgIC8vIGlzIHByb2R1Y2VkLlxuXG5cbiAgICBpZiAoY2FsbGJhY2spIHtcbiAgICAgIChmdW5jdGlvbiBleGVjKCkge1xuICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAvLyBUaGlzIHNob3VsZCBub3QgaGFwcGVuLCBidXQgd2Ugd2FudCB0byBiZSBzYWZlLlxuXG4gICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgICAgICAgICBpZiAoZWRpdExlbmd0aCA+IG1heEVkaXRMZW5ndGgpIHtcbiAgICAgICAgICAgIHJldHVybiBjYWxsYmFjaygpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICghZXhlY0VkaXRMZW5ndGgoKSkge1xuICAgICAgICAgICAgZXhlYygpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSwgMCk7XG4gICAgICB9KSgpO1xuICAgIH0gZWxzZSB7XG4gICAgICB3aGlsZSAoZWRpdExlbmd0aCA8PSBtYXhFZGl0TGVuZ3RoKSB7XG4gICAgICAgIHZhciByZXQgPSBleGVjRWRpdExlbmd0aCgpO1xuXG4gICAgICAgIGlmIChyZXQpIHtcbiAgICAgICAgICByZXR1cm4gcmV0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBwdXNoQ29tcG9uZW50OiBmdW5jdGlvbiBwdXNoQ29tcG9uZW50KGNvbXBvbmVudHMsIGFkZGVkLCByZW1vdmVkKSB7XG4gICAgdmFyIGxhc3QgPSBjb21wb25lbnRzW2NvbXBvbmVudHMubGVuZ3RoIC0gMV07XG5cbiAgICBpZiAobGFzdCAmJiBsYXN0LmFkZGVkID09PSBhZGRlZCAmJiBsYXN0LnJlbW92ZWQgPT09IHJlbW92ZWQpIHtcbiAgICAgIC8vIFdlIG5lZWQgdG8gY2xvbmUgaGVyZSBhcyB0aGUgY29tcG9uZW50IGNsb25lIG9wZXJhdGlvbiBpcyBqdXN0XG4gICAgICAvLyBhcyBzaGFsbG93IGFycmF5IGNsb25lXG4gICAgICBjb21wb25lbnRzW2NvbXBvbmVudHMubGVuZ3RoIC0gMV0gPSB7XG4gICAgICAgIGNvdW50OiBsYXN0LmNvdW50ICsgMSxcbiAgICAgICAgYWRkZWQ6IGFkZGVkLFxuICAgICAgICByZW1vdmVkOiByZW1vdmVkXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBjb21wb25lbnRzLnB1c2goe1xuICAgICAgICBjb3VudDogMSxcbiAgICAgICAgYWRkZWQ6IGFkZGVkLFxuICAgICAgICByZW1vdmVkOiByZW1vdmVkXG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG4gIGV4dHJhY3RDb21tb246IGZ1bmN0aW9uIGV4dHJhY3RDb21tb24oYmFzZVBhdGgsIG5ld1N0cmluZywgb2xkU3RyaW5nLCBkaWFnb25hbFBhdGgpIHtcbiAgICB2YXIgbmV3TGVuID0gbmV3U3RyaW5nLmxlbmd0aCxcbiAgICAgICAgb2xkTGVuID0gb2xkU3RyaW5nLmxlbmd0aCxcbiAgICAgICAgbmV3UG9zID0gYmFzZVBhdGgubmV3UG9zLFxuICAgICAgICBvbGRQb3MgPSBuZXdQb3MgLSBkaWFnb25hbFBhdGgsXG4gICAgICAgIGNvbW1vbkNvdW50ID0gMDtcblxuICAgIHdoaWxlIChuZXdQb3MgKyAxIDwgbmV3TGVuICYmIG9sZFBvcyArIDEgPCBvbGRMZW4gJiYgdGhpcy5lcXVhbHMobmV3U3RyaW5nW25ld1BvcyArIDFdLCBvbGRTdHJpbmdbb2xkUG9zICsgMV0pKSB7XG4gICAgICBuZXdQb3MrKztcbiAgICAgIG9sZFBvcysrO1xuICAgICAgY29tbW9uQ291bnQrKztcbiAgICB9XG5cbiAgICBpZiAoY29tbW9uQ291bnQpIHtcbiAgICAgIGJhc2VQYXRoLmNvbXBvbmVudHMucHVzaCh7XG4gICAgICAgIGNvdW50OiBjb21tb25Db3VudFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgYmFzZVBhdGgubmV3UG9zID0gbmV3UG9zO1xuICAgIHJldHVybiBvbGRQb3M7XG4gIH0sXG4gIGVxdWFsczogZnVuY3Rpb24gZXF1YWxzKGxlZnQsIHJpZ2h0KSB7XG4gICAgaWYgKHRoaXMub3B0aW9ucy5jb21wYXJhdG9yKSB7XG4gICAgICByZXR1cm4gdGhpcy5vcHRpb25zLmNvbXBhcmF0b3IobGVmdCwgcmlnaHQpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbGVmdCA9PT0gcmlnaHQgfHwgdGhpcy5vcHRpb25zLmlnbm9yZUNhc2UgJiYgbGVmdC50b0xvd2VyQ2FzZSgpID09PSByaWdodC50b0xvd2VyQ2FzZSgpO1xuICAgIH1cbiAgfSxcbiAgcmVtb3ZlRW1wdHk6IGZ1bmN0aW9uIHJlbW92ZUVtcHR5KGFycmF5KSB7XG4gICAgdmFyIHJldCA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheS5sZW5ndGg7IGkrKykge1xuICAgICAgaWYgKGFycmF5W2ldKSB7XG4gICAgICAgIHJldC5wdXNoKGFycmF5W2ldKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gcmV0O1xuICB9LFxuICBjYXN0SW5wdXQ6IGZ1bmN0aW9uIGNhc3RJbnB1dCh2YWx1ZSkge1xuICAgIHJldHVybiB2YWx1ZTtcbiAgfSxcbiAgdG9rZW5pemU6IGZ1bmN0aW9uIHRva2VuaXplKHZhbHVlKSB7XG4gICAgcmV0dXJuIHZhbHVlLnNwbGl0KCcnKTtcbiAgfSxcbiAgam9pbjogZnVuY3Rpb24gam9pbihjaGFycykge1xuICAgIHJldHVybiBjaGFycy5qb2luKCcnKTtcbiAgfVxufTtcblxuZnVuY3Rpb24gYnVpbGRWYWx1ZXMoZGlmZiwgY29tcG9uZW50cywgbmV3U3RyaW5nLCBvbGRTdHJpbmcsIHVzZUxvbmdlc3RUb2tlbikge1xuICB2YXIgY29tcG9uZW50UG9zID0gMCxcbiAgICAgIGNvbXBvbmVudExlbiA9IGNvbXBvbmVudHMubGVuZ3RoLFxuICAgICAgbmV3UG9zID0gMCxcbiAgICAgIG9sZFBvcyA9IDA7XG5cbiAgZm9yICg7IGNvbXBvbmVudFBvcyA8IGNvbXBvbmVudExlbjsgY29tcG9uZW50UG9zKyspIHtcbiAgICB2YXIgY29tcG9uZW50ID0gY29tcG9uZW50c1tjb21wb25lbnRQb3NdO1xuXG4gICAgaWYgKCFjb21wb25lbnQucmVtb3ZlZCkge1xuICAgICAgaWYgKCFjb21wb25lbnQuYWRkZWQgJiYgdXNlTG9uZ2VzdFRva2VuKSB7XG4gICAgICAgIHZhciB2YWx1ZSA9IG5ld1N0cmluZy5zbGljZShuZXdQb3MsIG5ld1BvcyArIGNvbXBvbmVudC5jb3VudCk7XG4gICAgICAgIHZhbHVlID0gdmFsdWUubWFwKGZ1bmN0aW9uICh2YWx1ZSwgaSkge1xuICAgICAgICAgIHZhciBvbGRWYWx1ZSA9IG9sZFN0cmluZ1tvbGRQb3MgKyBpXTtcbiAgICAgICAgICByZXR1cm4gb2xkVmFsdWUubGVuZ3RoID4gdmFsdWUubGVuZ3RoID8gb2xkVmFsdWUgOiB2YWx1ZTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNvbXBvbmVudC52YWx1ZSA9IGRpZmYuam9pbih2YWx1ZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb21wb25lbnQudmFsdWUgPSBkaWZmLmpvaW4obmV3U3RyaW5nLnNsaWNlKG5ld1BvcywgbmV3UG9zICsgY29tcG9uZW50LmNvdW50KSk7XG4gICAgICB9XG5cbiAgICAgIG5ld1BvcyArPSBjb21wb25lbnQuY291bnQ7IC8vIENvbW1vbiBjYXNlXG5cbiAgICAgIGlmICghY29tcG9uZW50LmFkZGVkKSB7XG4gICAgICAgIG9sZFBvcyArPSBjb21wb25lbnQuY291bnQ7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbXBvbmVudC52YWx1ZSA9IGRpZmYuam9pbihvbGRTdHJpbmcuc2xpY2Uob2xkUG9zLCBvbGRQb3MgKyBjb21wb25lbnQuY291bnQpKTtcbiAgICAgIG9sZFBvcyArPSBjb21wb25lbnQuY291bnQ7IC8vIFJldmVyc2UgYWRkIGFuZCByZW1vdmUgc28gcmVtb3ZlcyBhcmUgb3V0cHV0IGZpcnN0IHRvIG1hdGNoIGNvbW1vbiBjb252ZW50aW9uXG4gICAgICAvLyBUaGUgZGlmZmluZyBhbGdvcml0aG0gaXMgdGllZCB0byBhZGQgdGhlbiByZW1vdmUgb3V0cHV0IGFuZCB0aGlzIGlzIHRoZSBzaW1wbGVzdFxuICAgICAgLy8gcm91dGUgdG8gZ2V0IHRoZSBkZXNpcmVkIG91dHB1dCB3aXRoIG1pbmltYWwgb3ZlcmhlYWQuXG5cbiAgICAgIGlmIChjb21wb25lbnRQb3MgJiYgY29tcG9uZW50c1tjb21wb25lbnRQb3MgLSAxXS5hZGRlZCkge1xuICAgICAgICB2YXIgdG1wID0gY29tcG9uZW50c1tjb21wb25lbnRQb3MgLSAxXTtcbiAgICAgICAgY29tcG9uZW50c1tjb21wb25lbnRQb3MgLSAxXSA9IGNvbXBvbmVudHNbY29tcG9uZW50UG9zXTtcbiAgICAgICAgY29tcG9uZW50c1tjb21wb25lbnRQb3NdID0gdG1wO1xuICAgICAgfVxuICAgIH1cbiAgfSAvLyBTcGVjaWFsIGNhc2UgaGFuZGxlIGZvciB3aGVuIG9uZSB0ZXJtaW5hbCBpcyBpZ25vcmVkIChpLmUuIHdoaXRlc3BhY2UpLlxuICAvLyBGb3IgdGhpcyBjYXNlIHdlIG1lcmdlIHRoZSB0ZXJtaW5hbCBpbnRvIHRoZSBwcmlvciBzdHJpbmcgYW5kIGRyb3AgdGhlIGNoYW5nZS5cbiAgLy8gVGhpcyBpcyBvbmx5IGF2YWlsYWJsZSBmb3Igc3RyaW5nIG1vZGUuXG5cblxuICB2YXIgbGFzdENvbXBvbmVudCA9IGNvbXBvbmVudHNbY29tcG9uZW50TGVuIC0gMV07XG5cbiAgaWYgKGNvbXBvbmVudExlbiA+IDEgJiYgdHlwZW9mIGxhc3RDb21wb25lbnQudmFsdWUgPT09ICdzdHJpbmcnICYmIChsYXN0Q29tcG9uZW50LmFkZGVkIHx8IGxhc3RDb21wb25lbnQucmVtb3ZlZCkgJiYgZGlmZi5lcXVhbHMoJycsIGxhc3RDb21wb25lbnQudmFsdWUpKSB7XG4gICAgY29tcG9uZW50c1tjb21wb25lbnRMZW4gLSAyXS52YWx1ZSArPSBsYXN0Q29tcG9uZW50LnZhbHVlO1xuICAgIGNvbXBvbmVudHMucG9wKCk7XG4gIH1cblxuICByZXR1cm4gY29tcG9uZW50cztcbn1cblxuZnVuY3Rpb24gY2xvbmVQYXRoKHBhdGgpIHtcbiAgcmV0dXJuIHtcbiAgICBuZXdQb3M6IHBhdGgubmV3UG9zLFxuICAgIGNvbXBvbmVudHM6IHBhdGguY29tcG9uZW50cy5zbGljZSgwKVxuICB9O1xufVxuXG52YXIgY2hhcmFjdGVyRGlmZiA9IG5ldyBEaWZmKCk7XG5mdW5jdGlvbiBkaWZmQ2hhcnMob2xkU3RyLCBuZXdTdHIsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIGNoYXJhY3RlckRpZmYuZGlmZihvbGRTdHIsIG5ld1N0ciwgb3B0aW9ucyk7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlT3B0aW9ucyhvcHRpb25zLCBkZWZhdWx0cykge1xuICBpZiAodHlwZW9mIG9wdGlvbnMgPT09ICdmdW5jdGlvbicpIHtcbiAgICBkZWZhdWx0cy5jYWxsYmFjayA9IG9wdGlvbnM7XG4gIH0gZWxzZSBpZiAob3B0aW9ucykge1xuICAgIGZvciAodmFyIG5hbWUgaW4gb3B0aW9ucykge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgICAgIGlmIChvcHRpb25zLmhhc093blByb3BlcnR5KG5hbWUpKSB7XG4gICAgICAgIGRlZmF1bHRzW25hbWVdID0gb3B0aW9uc1tuYW1lXTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gZGVmYXVsdHM7XG59XG5cbi8vXG4vLyBSYW5nZXMgYW5kIGV4Y2VwdGlvbnM6XG4vLyBMYXRpbi0xIFN1cHBsZW1lbnQsIDAwODDigJMwMEZGXG4vLyAgLSBVKzAwRDcgIMOXIE11bHRpcGxpY2F0aW9uIHNpZ25cbi8vICAtIFUrMDBGNyAgw7cgRGl2aXNpb24gc2lnblxuLy8gTGF0aW4gRXh0ZW5kZWQtQSwgMDEwMOKAkzAxN0Zcbi8vIExhdGluIEV4dGVuZGVkLUIsIDAxODDigJMwMjRGXG4vLyBJUEEgRXh0ZW5zaW9ucywgMDI1MOKAkzAyQUZcbi8vIFNwYWNpbmcgTW9kaWZpZXIgTGV0dGVycywgMDJCMOKAkzAyRkZcbi8vICAtIFUrMDJDNyAgy4cgJiM3MTE7ICBDYXJvblxuLy8gIC0gVSswMkQ4ICDLmCAmIzcyODsgIEJyZXZlXG4vLyAgLSBVKzAyRDkgIMuZICYjNzI5OyAgRG90IEFib3ZlXG4vLyAgLSBVKzAyREEgIMuaICYjNzMwOyAgUmluZyBBYm92ZVxuLy8gIC0gVSswMkRCICDLmyAmIzczMTsgIE9nb25la1xuLy8gIC0gVSswMkRDICDLnCAmIzczMjsgIFNtYWxsIFRpbGRlXG4vLyAgLSBVKzAyREQgIMudICYjNzMzOyAgRG91YmxlIEFjdXRlIEFjY2VudFxuLy8gTGF0aW4gRXh0ZW5kZWQgQWRkaXRpb25hbCwgMUUwMOKAkzFFRkZcblxudmFyIGV4dGVuZGVkV29yZENoYXJzID0gL15bQS1aYS16XFx4QzAtXFx1MDJDNlxcdTAyQzgtXFx1MDJEN1xcdTAyREUtXFx1MDJGRlxcdTFFMDAtXFx1MUVGRl0rJC87XG52YXIgcmVXaGl0ZXNwYWNlID0gL1xcUy87XG52YXIgd29yZERpZmYgPSBuZXcgRGlmZigpO1xuXG53b3JkRGlmZi5lcXVhbHMgPSBmdW5jdGlvbiAobGVmdCwgcmlnaHQpIHtcbiAgaWYgKHRoaXMub3B0aW9ucy5pZ25vcmVDYXNlKSB7XG4gICAgbGVmdCA9IGxlZnQudG9Mb3dlckNhc2UoKTtcbiAgICByaWdodCA9IHJpZ2h0LnRvTG93ZXJDYXNlKCk7XG4gIH1cblxuICByZXR1cm4gbGVmdCA9PT0gcmlnaHQgfHwgdGhpcy5vcHRpb25zLmlnbm9yZVdoaXRlc3BhY2UgJiYgIXJlV2hpdGVzcGFjZS50ZXN0KGxlZnQpICYmICFyZVdoaXRlc3BhY2UudGVzdChyaWdodCk7XG59O1xuXG53b3JkRGlmZi50b2tlbml6ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAvLyBBbGwgd2hpdGVzcGFjZSBzeW1ib2xzIGV4Y2VwdCBuZXdsaW5lIGdyb3VwIGludG8gb25lIHRva2VuLCBlYWNoIG5ld2xpbmUgLSBpbiBzZXBhcmF0ZSB0b2tlblxuICB2YXIgdG9rZW5zID0gdmFsdWUuc3BsaXQoLyhbXlxcU1xcclxcbl0rfFsoKVtcXF17fSdcIlxcclxcbl18XFxiKS8pOyAvLyBKb2luIHRoZSBib3VuZGFyeSBzcGxpdHMgdGhhdCB3ZSBkbyBub3QgY29uc2lkZXIgdG8gYmUgYm91bmRhcmllcy4gVGhpcyBpcyBwcmltYXJpbHkgdGhlIGV4dGVuZGVkIExhdGluIGNoYXJhY3RlciBzZXQuXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0b2tlbnMubGVuZ3RoIC0gMTsgaSsrKSB7XG4gICAgLy8gSWYgd2UgaGF2ZSBhbiBlbXB0eSBzdHJpbmcgaW4gdGhlIG5leHQgZmllbGQgYW5kIHdlIGhhdmUgb25seSB3b3JkIGNoYXJzIGJlZm9yZSBhbmQgYWZ0ZXIsIG1lcmdlXG4gICAgaWYgKCF0b2tlbnNbaSArIDFdICYmIHRva2Vuc1tpICsgMl0gJiYgZXh0ZW5kZWRXb3JkQ2hhcnMudGVzdCh0b2tlbnNbaV0pICYmIGV4dGVuZGVkV29yZENoYXJzLnRlc3QodG9rZW5zW2kgKyAyXSkpIHtcbiAgICAgIHRva2Vuc1tpXSArPSB0b2tlbnNbaSArIDJdO1xuICAgICAgdG9rZW5zLnNwbGljZShpICsgMSwgMik7XG4gICAgICBpLS07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRva2Vucztcbn07XG5cbmZ1bmN0aW9uIGRpZmZXb3JkcyhvbGRTdHIsIG5ld1N0ciwgb3B0aW9ucykge1xuICBvcHRpb25zID0gZ2VuZXJhdGVPcHRpb25zKG9wdGlvbnMsIHtcbiAgICBpZ25vcmVXaGl0ZXNwYWNlOiB0cnVlXG4gIH0pO1xuICByZXR1cm4gd29yZERpZmYuZGlmZihvbGRTdHIsIG5ld1N0ciwgb3B0aW9ucyk7XG59XG5mdW5jdGlvbiBkaWZmV29yZHNXaXRoU3BhY2Uob2xkU3RyLCBuZXdTdHIsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIHdvcmREaWZmLmRpZmYob2xkU3RyLCBuZXdTdHIsIG9wdGlvbnMpO1xufVxuXG52YXIgbGluZURpZmYgPSBuZXcgRGlmZigpO1xuXG5saW5lRGlmZi50b2tlbml6ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICB2YXIgcmV0TGluZXMgPSBbXSxcbiAgICAgIGxpbmVzQW5kTmV3bGluZXMgPSB2YWx1ZS5zcGxpdCgvKFxcbnxcXHJcXG4pLyk7IC8vIElnbm9yZSB0aGUgZmluYWwgZW1wdHkgdG9rZW4gdGhhdCBvY2N1cnMgaWYgdGhlIHN0cmluZyBlbmRzIHdpdGggYSBuZXcgbGluZVxuXG4gIGlmICghbGluZXNBbmROZXdsaW5lc1tsaW5lc0FuZE5ld2xpbmVzLmxlbmd0aCAtIDFdKSB7XG4gICAgbGluZXNBbmROZXdsaW5lcy5wb3AoKTtcbiAgfSAvLyBNZXJnZSB0aGUgY29udGVudCBhbmQgbGluZSBzZXBhcmF0b3JzIGludG8gc2luZ2xlIHRva2Vuc1xuXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBsaW5lc0FuZE5ld2xpbmVzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGxpbmUgPSBsaW5lc0FuZE5ld2xpbmVzW2ldO1xuXG4gICAgaWYgKGkgJSAyICYmICF0aGlzLm9wdGlvbnMubmV3bGluZUlzVG9rZW4pIHtcbiAgICAgIHJldExpbmVzW3JldExpbmVzLmxlbmd0aCAtIDFdICs9IGxpbmU7XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmICh0aGlzLm9wdGlvbnMuaWdub3JlV2hpdGVzcGFjZSkge1xuICAgICAgICBsaW5lID0gbGluZS50cmltKCk7XG4gICAgICB9XG5cbiAgICAgIHJldExpbmVzLnB1c2gobGluZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJldExpbmVzO1xufTtcblxuZnVuY3Rpb24gZGlmZkxpbmVzKG9sZFN0ciwgbmV3U3RyLCBjYWxsYmFjaykge1xuICByZXR1cm4gbGluZURpZmYuZGlmZihvbGRTdHIsIG5ld1N0ciwgY2FsbGJhY2spO1xufVxuZnVuY3Rpb24gZGlmZlRyaW1tZWRMaW5lcyhvbGRTdHIsIG5ld1N0ciwgY2FsbGJhY2spIHtcbiAgdmFyIG9wdGlvbnMgPSBnZW5lcmF0ZU9wdGlvbnMoY2FsbGJhY2ssIHtcbiAgICBpZ25vcmVXaGl0ZXNwYWNlOiB0cnVlXG4gIH0pO1xuICByZXR1cm4gbGluZURpZmYuZGlmZihvbGRTdHIsIG5ld1N0ciwgb3B0aW9ucyk7XG59XG5cbnZhciBzZW50ZW5jZURpZmYgPSBuZXcgRGlmZigpO1xuXG5zZW50ZW5jZURpZmYudG9rZW5pemUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlLnNwbGl0KC8oXFxTLis/Wy4hP10pKD89XFxzK3wkKS8pO1xufTtcblxuZnVuY3Rpb24gZGlmZlNlbnRlbmNlcyhvbGRTdHIsIG5ld1N0ciwgY2FsbGJhY2spIHtcbiAgcmV0dXJuIHNlbnRlbmNlRGlmZi5kaWZmKG9sZFN0ciwgbmV3U3RyLCBjYWxsYmFjayk7XG59XG5cbnZhciBjc3NEaWZmID0gbmV3IERpZmYoKTtcblxuY3NzRGlmZi50b2tlbml6ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWUuc3BsaXQoLyhbe306OyxdfFxccyspLyk7XG59O1xuXG5mdW5jdGlvbiBkaWZmQ3NzKG9sZFN0ciwgbmV3U3RyLCBjYWxsYmFjaykge1xuICByZXR1cm4gY3NzRGlmZi5kaWZmKG9sZFN0ciwgbmV3U3RyLCBjYWxsYmFjayk7XG59XG5cbmZ1bmN0aW9uIF90eXBlb2Yob2JqKSB7XG4gIFwiQGJhYmVsL2hlbHBlcnMgLSB0eXBlb2ZcIjtcblxuICBpZiAodHlwZW9mIFN5bWJvbCA9PT0gXCJmdW5jdGlvblwiICYmIHR5cGVvZiBTeW1ib2wuaXRlcmF0b3IgPT09IFwic3ltYm9sXCIpIHtcbiAgICBfdHlwZW9mID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIHR5cGVvZiBvYmo7XG4gICAgfTtcbiAgfSBlbHNlIHtcbiAgICBfdHlwZW9mID0gZnVuY3Rpb24gKG9iaikge1xuICAgICAgcmV0dXJuIG9iaiAmJiB0eXBlb2YgU3ltYm9sID09PSBcImZ1bmN0aW9uXCIgJiYgb2JqLmNvbnN0cnVjdG9yID09PSBTeW1ib2wgJiYgb2JqICE9PSBTeW1ib2wucHJvdG90eXBlID8gXCJzeW1ib2xcIiA6IHR5cGVvZiBvYmo7XG4gICAgfTtcbiAgfVxuXG4gIHJldHVybiBfdHlwZW9mKG9iaik7XG59XG5cbmZ1bmN0aW9uIF90b0NvbnN1bWFibGVBcnJheShhcnIpIHtcbiAgcmV0dXJuIF9hcnJheVdpdGhvdXRIb2xlcyhhcnIpIHx8IF9pdGVyYWJsZVRvQXJyYXkoYXJyKSB8fCBfdW5zdXBwb3J0ZWRJdGVyYWJsZVRvQXJyYXkoYXJyKSB8fCBfbm9uSXRlcmFibGVTcHJlYWQoKTtcbn1cblxuZnVuY3Rpb24gX2FycmF5V2l0aG91dEhvbGVzKGFycikge1xuICBpZiAoQXJyYXkuaXNBcnJheShhcnIpKSByZXR1cm4gX2FycmF5TGlrZVRvQXJyYXkoYXJyKTtcbn1cblxuZnVuY3Rpb24gX2l0ZXJhYmxlVG9BcnJheShpdGVyKSB7XG4gIGlmICh0eXBlb2YgU3ltYm9sICE9PSBcInVuZGVmaW5lZFwiICYmIFN5bWJvbC5pdGVyYXRvciBpbiBPYmplY3QoaXRlcikpIHJldHVybiBBcnJheS5mcm9tKGl0ZXIpO1xufVxuXG5mdW5jdGlvbiBfdW5zdXBwb3J0ZWRJdGVyYWJsZVRvQXJyYXkobywgbWluTGVuKSB7XG4gIGlmICghbykgcmV0dXJuO1xuICBpZiAodHlwZW9mIG8gPT09IFwic3RyaW5nXCIpIHJldHVybiBfYXJyYXlMaWtlVG9BcnJheShvLCBtaW5MZW4pO1xuICB2YXIgbiA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvKS5zbGljZSg4LCAtMSk7XG4gIGlmIChuID09PSBcIk9iamVjdFwiICYmIG8uY29uc3RydWN0b3IpIG4gPSBvLmNvbnN0cnVjdG9yLm5hbWU7XG4gIGlmIChuID09PSBcIk1hcFwiIHx8IG4gPT09IFwiU2V0XCIpIHJldHVybiBBcnJheS5mcm9tKG8pO1xuICBpZiAobiA9PT0gXCJBcmd1bWVudHNcIiB8fCAvXig/OlVpfEkpbnQoPzo4fDE2fDMyKSg/OkNsYW1wZWQpP0FycmF5JC8udGVzdChuKSkgcmV0dXJuIF9hcnJheUxpa2VUb0FycmF5KG8sIG1pbkxlbik7XG59XG5cbmZ1bmN0aW9uIF9hcnJheUxpa2VUb0FycmF5KGFyciwgbGVuKSB7XG4gIGlmIChsZW4gPT0gbnVsbCB8fCBsZW4gPiBhcnIubGVuZ3RoKSBsZW4gPSBhcnIubGVuZ3RoO1xuXG4gIGZvciAodmFyIGkgPSAwLCBhcnIyID0gbmV3IEFycmF5KGxlbik7IGkgPCBsZW47IGkrKykgYXJyMltpXSA9IGFycltpXTtcblxuICByZXR1cm4gYXJyMjtcbn1cblxuZnVuY3Rpb24gX25vbkl0ZXJhYmxlU3ByZWFkKCkge1xuICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiSW52YWxpZCBhdHRlbXB0IHRvIHNwcmVhZCBub24taXRlcmFibGUgaW5zdGFuY2UuXFxuSW4gb3JkZXIgdG8gYmUgaXRlcmFibGUsIG5vbi1hcnJheSBvYmplY3RzIG11c3QgaGF2ZSBhIFtTeW1ib2wuaXRlcmF0b3JdKCkgbWV0aG9kLlwiKTtcbn1cblxudmFyIG9iamVjdFByb3RvdHlwZVRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbnZhciBqc29uRGlmZiA9IG5ldyBEaWZmKCk7IC8vIERpc2NyaW1pbmF0ZSBiZXR3ZWVuIHR3byBsaW5lcyBvZiBwcmV0dHktcHJpbnRlZCwgc2VyaWFsaXplZCBKU09OIHdoZXJlIG9uZSBvZiB0aGVtIGhhcyBhXG4vLyBkYW5nbGluZyBjb21tYSBhbmQgdGhlIG90aGVyIGRvZXNuJ3QuIFR1cm5zIG91dCBpbmNsdWRpbmcgdGhlIGRhbmdsaW5nIGNvbW1hIHlpZWxkcyB0aGUgbmljZXN0IG91dHB1dDpcblxuanNvbkRpZmYudXNlTG9uZ2VzdFRva2VuID0gdHJ1ZTtcbmpzb25EaWZmLnRva2VuaXplID0gbGluZURpZmYudG9rZW5pemU7XG5cbmpzb25EaWZmLmNhc3RJbnB1dCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICB2YXIgX3RoaXMkb3B0aW9ucyA9IHRoaXMub3B0aW9ucyxcbiAgICAgIHVuZGVmaW5lZFJlcGxhY2VtZW50ID0gX3RoaXMkb3B0aW9ucy51bmRlZmluZWRSZXBsYWNlbWVudCxcbiAgICAgIF90aGlzJG9wdGlvbnMkc3RyaW5naSA9IF90aGlzJG9wdGlvbnMuc3RyaW5naWZ5UmVwbGFjZXIsXG4gICAgICBzdHJpbmdpZnlSZXBsYWNlciA9IF90aGlzJG9wdGlvbnMkc3RyaW5naSA9PT0gdm9pZCAwID8gZnVuY3Rpb24gKGssIHYpIHtcbiAgICByZXR1cm4gdHlwZW9mIHYgPT09ICd1bmRlZmluZWQnID8gdW5kZWZpbmVkUmVwbGFjZW1lbnQgOiB2O1xuICB9IDogX3RoaXMkb3B0aW9ucyRzdHJpbmdpO1xuICByZXR1cm4gdHlwZW9mIHZhbHVlID09PSAnc3RyaW5nJyA/IHZhbHVlIDogSlNPTi5zdHJpbmdpZnkoY2Fub25pY2FsaXplKHZhbHVlLCBudWxsLCBudWxsLCBzdHJpbmdpZnlSZXBsYWNlciksIHN0cmluZ2lmeVJlcGxhY2VyLCAnICAnKTtcbn07XG5cbmpzb25EaWZmLmVxdWFscyA9IGZ1bmN0aW9uIChsZWZ0LCByaWdodCkge1xuICByZXR1cm4gRGlmZi5wcm90b3R5cGUuZXF1YWxzLmNhbGwoanNvbkRpZmYsIGxlZnQucmVwbGFjZSgvLChbXFxyXFxuXSkvZywgJyQxJyksIHJpZ2h0LnJlcGxhY2UoLywoW1xcclxcbl0pL2csICckMScpKTtcbn07XG5cbmZ1bmN0aW9uIGRpZmZKc29uKG9sZE9iaiwgbmV3T2JqLCBvcHRpb25zKSB7XG4gIHJldHVybiBqc29uRGlmZi5kaWZmKG9sZE9iaiwgbmV3T2JqLCBvcHRpb25zKTtcbn0gLy8gVGhpcyBmdW5jdGlvbiBoYW5kbGVzIHRoZSBwcmVzZW5jZSBvZiBjaXJjdWxhciByZWZlcmVuY2VzIGJ5IGJhaWxpbmcgb3V0IHdoZW4gZW5jb3VudGVyaW5nIGFuXG4vLyBvYmplY3QgdGhhdCBpcyBhbHJlYWR5IG9uIHRoZSBcInN0YWNrXCIgb2YgaXRlbXMgYmVpbmcgcHJvY2Vzc2VkLiBBY2NlcHRzIGFuIG9wdGlvbmFsIHJlcGxhY2VyXG5cbmZ1bmN0aW9uIGNhbm9uaWNhbGl6ZShvYmosIHN0YWNrLCByZXBsYWNlbWVudFN0YWNrLCByZXBsYWNlciwga2V5KSB7XG4gIHN0YWNrID0gc3RhY2sgfHwgW107XG4gIHJlcGxhY2VtZW50U3RhY2sgPSByZXBsYWNlbWVudFN0YWNrIHx8IFtdO1xuXG4gIGlmIChyZXBsYWNlcikge1xuICAgIG9iaiA9IHJlcGxhY2VyKGtleSwgb2JqKTtcbiAgfVxuXG4gIHZhciBpO1xuXG4gIGZvciAoaSA9IDA7IGkgPCBzdGFjay5sZW5ndGg7IGkgKz0gMSkge1xuICAgIGlmIChzdGFja1tpXSA9PT0gb2JqKSB7XG4gICAgICByZXR1cm4gcmVwbGFjZW1lbnRTdGFja1tpXTtcbiAgICB9XG4gIH1cblxuICB2YXIgY2Fub25pY2FsaXplZE9iajtcblxuICBpZiAoJ1tvYmplY3QgQXJyYXldJyA9PT0gb2JqZWN0UHJvdG90eXBlVG9TdHJpbmcuY2FsbChvYmopKSB7XG4gICAgc3RhY2sucHVzaChvYmopO1xuICAgIGNhbm9uaWNhbGl6ZWRPYmogPSBuZXcgQXJyYXkob2JqLmxlbmd0aCk7XG4gICAgcmVwbGFjZW1lbnRTdGFjay5wdXNoKGNhbm9uaWNhbGl6ZWRPYmopO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IG9iai5sZW5ndGg7IGkgKz0gMSkge1xuICAgICAgY2Fub25pY2FsaXplZE9ialtpXSA9IGNhbm9uaWNhbGl6ZShvYmpbaV0sIHN0YWNrLCByZXBsYWNlbWVudFN0YWNrLCByZXBsYWNlciwga2V5KTtcbiAgICB9XG5cbiAgICBzdGFjay5wb3AoKTtcbiAgICByZXBsYWNlbWVudFN0YWNrLnBvcCgpO1xuICAgIHJldHVybiBjYW5vbmljYWxpemVkT2JqO1xuICB9XG5cbiAgaWYgKG9iaiAmJiBvYmoudG9KU09OKSB7XG4gICAgb2JqID0gb2JqLnRvSlNPTigpO1xuICB9XG5cbiAgaWYgKF90eXBlb2Yob2JqKSA9PT0gJ29iamVjdCcgJiYgb2JqICE9PSBudWxsKSB7XG4gICAgc3RhY2sucHVzaChvYmopO1xuICAgIGNhbm9uaWNhbGl6ZWRPYmogPSB7fTtcbiAgICByZXBsYWNlbWVudFN0YWNrLnB1c2goY2Fub25pY2FsaXplZE9iaik7XG5cbiAgICB2YXIgc29ydGVkS2V5cyA9IFtdLFxuICAgICAgICBfa2V5O1xuXG4gICAgZm9yIChfa2V5IGluIG9iaikge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgICAgIGlmIChvYmouaGFzT3duUHJvcGVydHkoX2tleSkpIHtcbiAgICAgICAgc29ydGVkS2V5cy5wdXNoKF9rZXkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHNvcnRlZEtleXMuc29ydCgpO1xuXG4gICAgZm9yIChpID0gMDsgaSA8IHNvcnRlZEtleXMubGVuZ3RoOyBpICs9IDEpIHtcbiAgICAgIF9rZXkgPSBzb3J0ZWRLZXlzW2ldO1xuICAgICAgY2Fub25pY2FsaXplZE9ialtfa2V5XSA9IGNhbm9uaWNhbGl6ZShvYmpbX2tleV0sIHN0YWNrLCByZXBsYWNlbWVudFN0YWNrLCByZXBsYWNlciwgX2tleSk7XG4gICAgfVxuXG4gICAgc3RhY2sucG9wKCk7XG4gICAgcmVwbGFjZW1lbnRTdGFjay5wb3AoKTtcbiAgfSBlbHNlIHtcbiAgICBjYW5vbmljYWxpemVkT2JqID0gb2JqO1xuICB9XG5cbiAgcmV0dXJuIGNhbm9uaWNhbGl6ZWRPYmo7XG59XG5cbnZhciBhcnJheURpZmYgPSBuZXcgRGlmZigpO1xuXG5hcnJheURpZmYudG9rZW5pemUgPSBmdW5jdGlvbiAodmFsdWUpIHtcbiAgcmV0dXJuIHZhbHVlLnNsaWNlKCk7XG59O1xuXG5hcnJheURpZmYuam9pbiA9IGFycmF5RGlmZi5yZW1vdmVFbXB0eSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICByZXR1cm4gdmFsdWU7XG59O1xuXG5mdW5jdGlvbiBkaWZmQXJyYXlzKG9sZEFyciwgbmV3QXJyLCBjYWxsYmFjaykge1xuICByZXR1cm4gYXJyYXlEaWZmLmRpZmYob2xkQXJyLCBuZXdBcnIsIGNhbGxiYWNrKTtcbn1cblxuZnVuY3Rpb24gcGFyc2VQYXRjaCh1bmlEaWZmKSB7XG4gIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDEgJiYgYXJndW1lbnRzWzFdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMV0gOiB7fTtcbiAgdmFyIGRpZmZzdHIgPSB1bmlEaWZmLnNwbGl0KC9cXHJcXG58W1xcblxcdlxcZlxcclxceDg1XS8pLFxuICAgICAgZGVsaW1pdGVycyA9IHVuaURpZmYubWF0Y2goL1xcclxcbnxbXFxuXFx2XFxmXFxyXFx4ODVdL2cpIHx8IFtdLFxuICAgICAgbGlzdCA9IFtdLFxuICAgICAgaSA9IDA7XG5cbiAgZnVuY3Rpb24gcGFyc2VJbmRleCgpIHtcbiAgICB2YXIgaW5kZXggPSB7fTtcbiAgICBsaXN0LnB1c2goaW5kZXgpOyAvLyBQYXJzZSBkaWZmIG1ldGFkYXRhXG5cbiAgICB3aGlsZSAoaSA8IGRpZmZzdHIubGVuZ3RoKSB7XG4gICAgICB2YXIgbGluZSA9IGRpZmZzdHJbaV07IC8vIEZpbGUgaGVhZGVyIGZvdW5kLCBlbmQgcGFyc2luZyBkaWZmIG1ldGFkYXRhXG5cbiAgICAgIGlmICgvXihcXC1cXC1cXC18XFwrXFwrXFwrfEBAKVxccy8udGVzdChsaW5lKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH0gLy8gRGlmZiBpbmRleFxuXG5cbiAgICAgIHZhciBoZWFkZXIgPSAvXig/OkluZGV4OnxkaWZmKD86IC1yIFxcdyspKylcXHMrKC4rPylcXHMqJC8uZXhlYyhsaW5lKTtcblxuICAgICAgaWYgKGhlYWRlcikge1xuICAgICAgICBpbmRleC5pbmRleCA9IGhlYWRlclsxXTtcbiAgICAgIH1cblxuICAgICAgaSsrO1xuICAgIH0gLy8gUGFyc2UgZmlsZSBoZWFkZXJzIGlmIHRoZXkgYXJlIGRlZmluZWQuIFVuaWZpZWQgZGlmZiByZXF1aXJlcyB0aGVtLCBidXRcbiAgICAvLyB0aGVyZSdzIG5vIHRlY2huaWNhbCBpc3N1ZXMgdG8gaGF2ZSBhbiBpc29sYXRlZCBodW5rIHdpdGhvdXQgZmlsZSBoZWFkZXJcblxuXG4gICAgcGFyc2VGaWxlSGVhZGVyKGluZGV4KTtcbiAgICBwYXJzZUZpbGVIZWFkZXIoaW5kZXgpOyAvLyBQYXJzZSBodW5rc1xuXG4gICAgaW5kZXguaHVua3MgPSBbXTtcblxuICAgIHdoaWxlIChpIDwgZGlmZnN0ci5sZW5ndGgpIHtcbiAgICAgIHZhciBfbGluZSA9IGRpZmZzdHJbaV07XG5cbiAgICAgIGlmICgvXihJbmRleDp8ZGlmZnxcXC1cXC1cXC18XFwrXFwrXFwrKVxccy8udGVzdChfbGluZSkpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9IGVsc2UgaWYgKC9eQEAvLnRlc3QoX2xpbmUpKSB7XG4gICAgICAgIGluZGV4Lmh1bmtzLnB1c2gocGFyc2VIdW5rKCkpO1xuICAgICAgfSBlbHNlIGlmIChfbGluZSAmJiBvcHRpb25zLnN0cmljdCkge1xuICAgICAgICAvLyBJZ25vcmUgdW5leHBlY3RlZCBjb250ZW50IHVubGVzcyBpbiBzdHJpY3QgbW9kZVxuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1Vua25vd24gbGluZSAnICsgKGkgKyAxKSArICcgJyArIEpTT04uc3RyaW5naWZ5KF9saW5lKSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBpKys7XG4gICAgICB9XG4gICAgfVxuICB9IC8vIFBhcnNlcyB0aGUgLS0tIGFuZCArKysgaGVhZGVycywgaWYgbm9uZSBhcmUgZm91bmQsIG5vIGxpbmVzXG4gIC8vIGFyZSBjb25zdW1lZC5cblxuXG4gIGZ1bmN0aW9uIHBhcnNlRmlsZUhlYWRlcihpbmRleCkge1xuICAgIHZhciBmaWxlSGVhZGVyID0gL14oLS0tfFxcK1xcK1xcKylcXHMrKC4qKSQvLmV4ZWMoZGlmZnN0cltpXSk7XG5cbiAgICBpZiAoZmlsZUhlYWRlcikge1xuICAgICAgdmFyIGtleVByZWZpeCA9IGZpbGVIZWFkZXJbMV0gPT09ICctLS0nID8gJ29sZCcgOiAnbmV3JztcbiAgICAgIHZhciBkYXRhID0gZmlsZUhlYWRlclsyXS5zcGxpdCgnXFx0JywgMik7XG4gICAgICB2YXIgZmlsZU5hbWUgPSBkYXRhWzBdLnJlcGxhY2UoL1xcXFxcXFxcL2csICdcXFxcJyk7XG5cbiAgICAgIGlmICgvXlwiLipcIiQvLnRlc3QoZmlsZU5hbWUpKSB7XG4gICAgICAgIGZpbGVOYW1lID0gZmlsZU5hbWUuc3Vic3RyKDEsIGZpbGVOYW1lLmxlbmd0aCAtIDIpO1xuICAgICAgfVxuXG4gICAgICBpbmRleFtrZXlQcmVmaXggKyAnRmlsZU5hbWUnXSA9IGZpbGVOYW1lO1xuICAgICAgaW5kZXhba2V5UHJlZml4ICsgJ0hlYWRlciddID0gKGRhdGFbMV0gfHwgJycpLnRyaW0oKTtcbiAgICAgIGkrKztcbiAgICB9XG4gIH0gLy8gUGFyc2VzIGEgaHVua1xuICAvLyBUaGlzIGFzc3VtZXMgdGhhdCB3ZSBhcmUgYXQgdGhlIHN0YXJ0IG9mIGEgaHVuay5cblxuXG4gIGZ1bmN0aW9uIHBhcnNlSHVuaygpIHtcbiAgICB2YXIgY2h1bmtIZWFkZXJJbmRleCA9IGksXG4gICAgICAgIGNodW5rSGVhZGVyTGluZSA9IGRpZmZzdHJbaSsrXSxcbiAgICAgICAgY2h1bmtIZWFkZXIgPSBjaHVua0hlYWRlckxpbmUuc3BsaXQoL0BAIC0oXFxkKykoPzosKFxcZCspKT8gXFwrKFxcZCspKD86LChcXGQrKSk/IEBALyk7XG4gICAgdmFyIGh1bmsgPSB7XG4gICAgICBvbGRTdGFydDogK2NodW5rSGVhZGVyWzFdLFxuICAgICAgb2xkTGluZXM6IHR5cGVvZiBjaHVua0hlYWRlclsyXSA9PT0gJ3VuZGVmaW5lZCcgPyAxIDogK2NodW5rSGVhZGVyWzJdLFxuICAgICAgbmV3U3RhcnQ6ICtjaHVua0hlYWRlclszXSxcbiAgICAgIG5ld0xpbmVzOiB0eXBlb2YgY2h1bmtIZWFkZXJbNF0gPT09ICd1bmRlZmluZWQnID8gMSA6ICtjaHVua0hlYWRlcls0XSxcbiAgICAgIGxpbmVzOiBbXSxcbiAgICAgIGxpbmVkZWxpbWl0ZXJzOiBbXVxuICAgIH07IC8vIFVuaWZpZWQgRGlmZiBGb3JtYXQgcXVpcms6IElmIHRoZSBjaHVuayBzaXplIGlzIDAsXG4gICAgLy8gdGhlIGZpcnN0IG51bWJlciBpcyBvbmUgbG93ZXIgdGhhbiBvbmUgd291bGQgZXhwZWN0LlxuICAgIC8vIGh0dHBzOi8vd3d3LmFydGltYS5jb20vd2VibG9ncy92aWV3cG9zdC5qc3A/dGhyZWFkPTE2NDI5M1xuXG4gICAgaWYgKGh1bmsub2xkTGluZXMgPT09IDApIHtcbiAgICAgIGh1bmsub2xkU3RhcnQgKz0gMTtcbiAgICB9XG5cbiAgICBpZiAoaHVuay5uZXdMaW5lcyA9PT0gMCkge1xuICAgICAgaHVuay5uZXdTdGFydCArPSAxO1xuICAgIH1cblxuICAgIHZhciBhZGRDb3VudCA9IDAsXG4gICAgICAgIHJlbW92ZUNvdW50ID0gMDtcblxuICAgIGZvciAoOyBpIDwgZGlmZnN0ci5sZW5ndGg7IGkrKykge1xuICAgICAgLy8gTGluZXMgc3RhcnRpbmcgd2l0aCAnLS0tJyBjb3VsZCBiZSBtaXN0YWtlbiBmb3IgdGhlIFwicmVtb3ZlIGxpbmVcIiBvcGVyYXRpb25cbiAgICAgIC8vIEJ1dCB0aGV5IGNvdWxkIGJlIHRoZSBoZWFkZXIgZm9yIHRoZSBuZXh0IGZpbGUuIFRoZXJlZm9yZSBwcnVuZSBzdWNoIGNhc2VzIG91dC5cbiAgICAgIGlmIChkaWZmc3RyW2ldLmluZGV4T2YoJy0tLSAnKSA9PT0gMCAmJiBpICsgMiA8IGRpZmZzdHIubGVuZ3RoICYmIGRpZmZzdHJbaSArIDFdLmluZGV4T2YoJysrKyAnKSA9PT0gMCAmJiBkaWZmc3RyW2kgKyAyXS5pbmRleE9mKCdAQCcpID09PSAwKSB7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICB2YXIgb3BlcmF0aW9uID0gZGlmZnN0cltpXS5sZW5ndGggPT0gMCAmJiBpICE9IGRpZmZzdHIubGVuZ3RoIC0gMSA/ICcgJyA6IGRpZmZzdHJbaV1bMF07XG5cbiAgICAgIGlmIChvcGVyYXRpb24gPT09ICcrJyB8fCBvcGVyYXRpb24gPT09ICctJyB8fCBvcGVyYXRpb24gPT09ICcgJyB8fCBvcGVyYXRpb24gPT09ICdcXFxcJykge1xuICAgICAgICBodW5rLmxpbmVzLnB1c2goZGlmZnN0cltpXSk7XG4gICAgICAgIGh1bmsubGluZWRlbGltaXRlcnMucHVzaChkZWxpbWl0ZXJzW2ldIHx8ICdcXG4nKTtcblxuICAgICAgICBpZiAob3BlcmF0aW9uID09PSAnKycpIHtcbiAgICAgICAgICBhZGRDb3VudCsrO1xuICAgICAgICB9IGVsc2UgaWYgKG9wZXJhdGlvbiA9PT0gJy0nKSB7XG4gICAgICAgICAgcmVtb3ZlQ291bnQrKztcbiAgICAgICAgfSBlbHNlIGlmIChvcGVyYXRpb24gPT09ICcgJykge1xuICAgICAgICAgIGFkZENvdW50Kys7XG4gICAgICAgICAgcmVtb3ZlQ291bnQrKztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSAvLyBIYW5kbGUgdGhlIGVtcHR5IGJsb2NrIGNvdW50IGNhc2VcblxuXG4gICAgaWYgKCFhZGRDb3VudCAmJiBodW5rLm5ld0xpbmVzID09PSAxKSB7XG4gICAgICBodW5rLm5ld0xpbmVzID0gMDtcbiAgICB9XG5cbiAgICBpZiAoIXJlbW92ZUNvdW50ICYmIGh1bmsub2xkTGluZXMgPT09IDEpIHtcbiAgICAgIGh1bmsub2xkTGluZXMgPSAwO1xuICAgIH0gLy8gUGVyZm9ybSBvcHRpb25hbCBzYW5pdHkgY2hlY2tpbmdcblxuXG4gICAgaWYgKG9wdGlvbnMuc3RyaWN0KSB7XG4gICAgICBpZiAoYWRkQ291bnQgIT09IGh1bmsubmV3TGluZXMpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdBZGRlZCBsaW5lIGNvdW50IGRpZCBub3QgbWF0Y2ggZm9yIGh1bmsgYXQgbGluZSAnICsgKGNodW5rSGVhZGVySW5kZXggKyAxKSk7XG4gICAgICB9XG5cbiAgICAgIGlmIChyZW1vdmVDb3VudCAhPT0gaHVuay5vbGRMaW5lcykge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1JlbW92ZWQgbGluZSBjb3VudCBkaWQgbm90IG1hdGNoIGZvciBodW5rIGF0IGxpbmUgJyArIChjaHVua0hlYWRlckluZGV4ICsgMSkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBodW5rO1xuICB9XG5cbiAgd2hpbGUgKGkgPCBkaWZmc3RyLmxlbmd0aCkge1xuICAgIHBhcnNlSW5kZXgoKTtcbiAgfVxuXG4gIHJldHVybiBsaXN0O1xufVxuXG4vLyBJdGVyYXRvciB0aGF0IHRyYXZlcnNlcyBpbiB0aGUgcmFuZ2Ugb2YgW21pbiwgbWF4XSwgc3RlcHBpbmdcbi8vIGJ5IGRpc3RhbmNlIGZyb20gYSBnaXZlbiBzdGFydCBwb3NpdGlvbi4gSS5lLiBmb3IgWzAsIDRdLCB3aXRoXG4vLyBzdGFydCBvZiAyLCB0aGlzIHdpbGwgaXRlcmF0ZSAyLCAzLCAxLCA0LCAwLlxuZnVuY3Rpb24gZGlzdGFuY2VJdGVyYXRvciAoc3RhcnQsIG1pbkxpbmUsIG1heExpbmUpIHtcbiAgdmFyIHdhbnRGb3J3YXJkID0gdHJ1ZSxcbiAgICAgIGJhY2t3YXJkRXhoYXVzdGVkID0gZmFsc2UsXG4gICAgICBmb3J3YXJkRXhoYXVzdGVkID0gZmFsc2UsXG4gICAgICBsb2NhbE9mZnNldCA9IDE7XG4gIHJldHVybiBmdW5jdGlvbiBpdGVyYXRvcigpIHtcbiAgICBpZiAod2FudEZvcndhcmQgJiYgIWZvcndhcmRFeGhhdXN0ZWQpIHtcbiAgICAgIGlmIChiYWNrd2FyZEV4aGF1c3RlZCkge1xuICAgICAgICBsb2NhbE9mZnNldCsrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd2FudEZvcndhcmQgPSBmYWxzZTtcbiAgICAgIH0gLy8gQ2hlY2sgaWYgdHJ5aW5nIHRvIGZpdCBiZXlvbmQgdGV4dCBsZW5ndGgsIGFuZCBpZiBub3QsIGNoZWNrIGl0IGZpdHNcbiAgICAgIC8vIGFmdGVyIG9mZnNldCBsb2NhdGlvbiAob3IgZGVzaXJlZCBsb2NhdGlvbiBvbiBmaXJzdCBpdGVyYXRpb24pXG5cblxuICAgICAgaWYgKHN0YXJ0ICsgbG9jYWxPZmZzZXQgPD0gbWF4TGluZSkge1xuICAgICAgICByZXR1cm4gbG9jYWxPZmZzZXQ7XG4gICAgICB9XG5cbiAgICAgIGZvcndhcmRFeGhhdXN0ZWQgPSB0cnVlO1xuICAgIH1cblxuICAgIGlmICghYmFja3dhcmRFeGhhdXN0ZWQpIHtcbiAgICAgIGlmICghZm9yd2FyZEV4aGF1c3RlZCkge1xuICAgICAgICB3YW50Rm9yd2FyZCA9IHRydWU7XG4gICAgICB9IC8vIENoZWNrIGlmIHRyeWluZyB0byBmaXQgYmVmb3JlIHRleHQgYmVnaW5uaW5nLCBhbmQgaWYgbm90LCBjaGVjayBpdCBmaXRzXG4gICAgICAvLyBiZWZvcmUgb2Zmc2V0IGxvY2F0aW9uXG5cblxuICAgICAgaWYgKG1pbkxpbmUgPD0gc3RhcnQgLSBsb2NhbE9mZnNldCkge1xuICAgICAgICByZXR1cm4gLWxvY2FsT2Zmc2V0Kys7XG4gICAgICB9XG5cbiAgICAgIGJhY2t3YXJkRXhoYXVzdGVkID0gdHJ1ZTtcbiAgICAgIHJldHVybiBpdGVyYXRvcigpO1xuICAgIH0gLy8gV2UgdHJpZWQgdG8gZml0IGh1bmsgYmVmb3JlIHRleHQgYmVnaW5uaW5nIGFuZCBiZXlvbmQgdGV4dCBsZW5ndGgsIHRoZW5cbiAgICAvLyBodW5rIGNhbid0IGZpdCBvbiB0aGUgdGV4dC4gUmV0dXJuIHVuZGVmaW5lZFxuXG4gIH07XG59XG5cbmZ1bmN0aW9uIGFwcGx5UGF0Y2goc291cmNlLCB1bmlEaWZmKSB7XG4gIHZhciBvcHRpb25zID0gYXJndW1lbnRzLmxlbmd0aCA+IDIgJiYgYXJndW1lbnRzWzJdICE9PSB1bmRlZmluZWQgPyBhcmd1bWVudHNbMl0gOiB7fTtcblxuICBpZiAodHlwZW9mIHVuaURpZmYgPT09ICdzdHJpbmcnKSB7XG4gICAgdW5pRGlmZiA9IHBhcnNlUGF0Y2godW5pRGlmZik7XG4gIH1cblxuICBpZiAoQXJyYXkuaXNBcnJheSh1bmlEaWZmKSkge1xuICAgIGlmICh1bmlEaWZmLmxlbmd0aCA+IDEpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignYXBwbHlQYXRjaCBvbmx5IHdvcmtzIHdpdGggYSBzaW5nbGUgaW5wdXQuJyk7XG4gICAgfVxuXG4gICAgdW5pRGlmZiA9IHVuaURpZmZbMF07XG4gIH0gLy8gQXBwbHkgdGhlIGRpZmYgdG8gdGhlIGlucHV0XG5cblxuICB2YXIgbGluZXMgPSBzb3VyY2Uuc3BsaXQoL1xcclxcbnxbXFxuXFx2XFxmXFxyXFx4ODVdLyksXG4gICAgICBkZWxpbWl0ZXJzID0gc291cmNlLm1hdGNoKC9cXHJcXG58W1xcblxcdlxcZlxcclxceDg1XS9nKSB8fCBbXSxcbiAgICAgIGh1bmtzID0gdW5pRGlmZi5odW5rcyxcbiAgICAgIGNvbXBhcmVMaW5lID0gb3B0aW9ucy5jb21wYXJlTGluZSB8fCBmdW5jdGlvbiAobGluZU51bWJlciwgbGluZSwgb3BlcmF0aW9uLCBwYXRjaENvbnRlbnQpIHtcbiAgICByZXR1cm4gbGluZSA9PT0gcGF0Y2hDb250ZW50O1xuICB9LFxuICAgICAgZXJyb3JDb3VudCA9IDAsXG4gICAgICBmdXp6RmFjdG9yID0gb3B0aW9ucy5mdXp6RmFjdG9yIHx8IDAsXG4gICAgICBtaW5MaW5lID0gMCxcbiAgICAgIG9mZnNldCA9IDAsXG4gICAgICByZW1vdmVFT0ZOTCxcbiAgICAgIGFkZEVPRk5MO1xuICAvKipcbiAgICogQ2hlY2tzIGlmIHRoZSBodW5rIGV4YWN0bHkgZml0cyBvbiB0aGUgcHJvdmlkZWQgbG9jYXRpb25cbiAgICovXG5cblxuICBmdW5jdGlvbiBodW5rRml0cyhodW5rLCB0b1Bvcykge1xuICAgIGZvciAodmFyIGogPSAwOyBqIDwgaHVuay5saW5lcy5sZW5ndGg7IGorKykge1xuICAgICAgdmFyIGxpbmUgPSBodW5rLmxpbmVzW2pdLFxuICAgICAgICAgIG9wZXJhdGlvbiA9IGxpbmUubGVuZ3RoID4gMCA/IGxpbmVbMF0gOiAnICcsXG4gICAgICAgICAgY29udGVudCA9IGxpbmUubGVuZ3RoID4gMCA/IGxpbmUuc3Vic3RyKDEpIDogbGluZTtcblxuICAgICAgaWYgKG9wZXJhdGlvbiA9PT0gJyAnIHx8IG9wZXJhdGlvbiA9PT0gJy0nKSB7XG4gICAgICAgIC8vIENvbnRleHQgc2FuaXR5IGNoZWNrXG4gICAgICAgIGlmICghY29tcGFyZUxpbmUodG9Qb3MgKyAxLCBsaW5lc1t0b1Bvc10sIG9wZXJhdGlvbiwgY29udGVudCkpIHtcbiAgICAgICAgICBlcnJvckNvdW50Kys7XG5cbiAgICAgICAgICBpZiAoZXJyb3JDb3VudCA+IGZ1enpGYWN0b3IpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB0b1BvcysrO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9IC8vIFNlYXJjaCBiZXN0IGZpdCBvZmZzZXRzIGZvciBlYWNoIGh1bmsgYmFzZWQgb24gdGhlIHByZXZpb3VzIG9uZXNcblxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgaHVua3MubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgaHVuayA9IGh1bmtzW2ldLFxuICAgICAgICBtYXhMaW5lID0gbGluZXMubGVuZ3RoIC0gaHVuay5vbGRMaW5lcyxcbiAgICAgICAgbG9jYWxPZmZzZXQgPSAwLFxuICAgICAgICB0b1BvcyA9IG9mZnNldCArIGh1bmsub2xkU3RhcnQgLSAxO1xuICAgIHZhciBpdGVyYXRvciA9IGRpc3RhbmNlSXRlcmF0b3IodG9Qb3MsIG1pbkxpbmUsIG1heExpbmUpO1xuXG4gICAgZm9yICg7IGxvY2FsT2Zmc2V0ICE9PSB1bmRlZmluZWQ7IGxvY2FsT2Zmc2V0ID0gaXRlcmF0b3IoKSkge1xuICAgICAgaWYgKGh1bmtGaXRzKGh1bmssIHRvUG9zICsgbG9jYWxPZmZzZXQpKSB7XG4gICAgICAgIGh1bmsub2Zmc2V0ID0gb2Zmc2V0ICs9IGxvY2FsT2Zmc2V0O1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAobG9jYWxPZmZzZXQgPT09IHVuZGVmaW5lZCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gLy8gU2V0IGxvd2VyIHRleHQgbGltaXQgdG8gZW5kIG9mIHRoZSBjdXJyZW50IGh1bmssIHNvIG5leHQgb25lcyBkb24ndCB0cnlcbiAgICAvLyB0byBmaXQgb3ZlciBhbHJlYWR5IHBhdGNoZWQgdGV4dFxuXG5cbiAgICBtaW5MaW5lID0gaHVuay5vZmZzZXQgKyBodW5rLm9sZFN0YXJ0ICsgaHVuay5vbGRMaW5lcztcbiAgfSAvLyBBcHBseSBwYXRjaCBodW5rc1xuXG5cbiAgdmFyIGRpZmZPZmZzZXQgPSAwO1xuXG4gIGZvciAodmFyIF9pID0gMDsgX2kgPCBodW5rcy5sZW5ndGg7IF9pKyspIHtcbiAgICB2YXIgX2h1bmsgPSBodW5rc1tfaV0sXG4gICAgICAgIF90b1BvcyA9IF9odW5rLm9sZFN0YXJ0ICsgX2h1bmsub2Zmc2V0ICsgZGlmZk9mZnNldCAtIDE7XG5cbiAgICBkaWZmT2Zmc2V0ICs9IF9odW5rLm5ld0xpbmVzIC0gX2h1bmsub2xkTGluZXM7XG5cbiAgICBmb3IgKHZhciBqID0gMDsgaiA8IF9odW5rLmxpbmVzLmxlbmd0aDsgaisrKSB7XG4gICAgICB2YXIgbGluZSA9IF9odW5rLmxpbmVzW2pdLFxuICAgICAgICAgIG9wZXJhdGlvbiA9IGxpbmUubGVuZ3RoID4gMCA/IGxpbmVbMF0gOiAnICcsXG4gICAgICAgICAgY29udGVudCA9IGxpbmUubGVuZ3RoID4gMCA/IGxpbmUuc3Vic3RyKDEpIDogbGluZSxcbiAgICAgICAgICBkZWxpbWl0ZXIgPSBfaHVuay5saW5lZGVsaW1pdGVyc1tqXTtcblxuICAgICAgaWYgKG9wZXJhdGlvbiA9PT0gJyAnKSB7XG4gICAgICAgIF90b1BvcysrO1xuICAgICAgfSBlbHNlIGlmIChvcGVyYXRpb24gPT09ICctJykge1xuICAgICAgICBsaW5lcy5zcGxpY2UoX3RvUG9zLCAxKTtcbiAgICAgICAgZGVsaW1pdGVycy5zcGxpY2UoX3RvUG9zLCAxKTtcbiAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgICAgIH0gZWxzZSBpZiAob3BlcmF0aW9uID09PSAnKycpIHtcbiAgICAgICAgbGluZXMuc3BsaWNlKF90b1BvcywgMCwgY29udGVudCk7XG4gICAgICAgIGRlbGltaXRlcnMuc3BsaWNlKF90b1BvcywgMCwgZGVsaW1pdGVyKTtcbiAgICAgICAgX3RvUG9zKys7XG4gICAgICB9IGVsc2UgaWYgKG9wZXJhdGlvbiA9PT0gJ1xcXFwnKSB7XG4gICAgICAgIHZhciBwcmV2aW91c09wZXJhdGlvbiA9IF9odW5rLmxpbmVzW2ogLSAxXSA/IF9odW5rLmxpbmVzW2ogLSAxXVswXSA6IG51bGw7XG5cbiAgICAgICAgaWYgKHByZXZpb3VzT3BlcmF0aW9uID09PSAnKycpIHtcbiAgICAgICAgICByZW1vdmVFT0ZOTCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAocHJldmlvdXNPcGVyYXRpb24gPT09ICctJykge1xuICAgICAgICAgIGFkZEVPRk5MID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSAvLyBIYW5kbGUgRU9GTkwgaW5zZXJ0aW9uL3JlbW92YWxcblxuXG4gIGlmIChyZW1vdmVFT0ZOTCkge1xuICAgIHdoaWxlICghbGluZXNbbGluZXMubGVuZ3RoIC0gMV0pIHtcbiAgICAgIGxpbmVzLnBvcCgpO1xuICAgICAgZGVsaW1pdGVycy5wb3AoKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoYWRkRU9GTkwpIHtcbiAgICBsaW5lcy5wdXNoKCcnKTtcbiAgICBkZWxpbWl0ZXJzLnB1c2goJ1xcbicpO1xuICB9XG5cbiAgZm9yICh2YXIgX2sgPSAwOyBfayA8IGxpbmVzLmxlbmd0aCAtIDE7IF9rKyspIHtcbiAgICBsaW5lc1tfa10gPSBsaW5lc1tfa10gKyBkZWxpbWl0ZXJzW19rXTtcbiAgfVxuXG4gIHJldHVybiBsaW5lcy5qb2luKCcnKTtcbn0gLy8gV3JhcHBlciB0aGF0IHN1cHBvcnRzIG11bHRpcGxlIGZpbGUgcGF0Y2hlcyB2aWEgY2FsbGJhY2tzLlxuXG5mdW5jdGlvbiBhcHBseVBhdGNoZXModW5pRGlmZiwgb3B0aW9ucykge1xuICBpZiAodHlwZW9mIHVuaURpZmYgPT09ICdzdHJpbmcnKSB7XG4gICAgdW5pRGlmZiA9IHBhcnNlUGF0Y2godW5pRGlmZik7XG4gIH1cblxuICB2YXIgY3VycmVudEluZGV4ID0gMDtcblxuICBmdW5jdGlvbiBwcm9jZXNzSW5kZXgoKSB7XG4gICAgdmFyIGluZGV4ID0gdW5pRGlmZltjdXJyZW50SW5kZXgrK107XG5cbiAgICBpZiAoIWluZGV4KSB7XG4gICAgICByZXR1cm4gb3B0aW9ucy5jb21wbGV0ZSgpO1xuICAgIH1cblxuICAgIG9wdGlvbnMubG9hZEZpbGUoaW5kZXgsIGZ1bmN0aW9uIChlcnIsIGRhdGEpIHtcbiAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMuY29tcGxldGUoZXJyKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHVwZGF0ZWRDb250ZW50ID0gYXBwbHlQYXRjaChkYXRhLCBpbmRleCwgb3B0aW9ucyk7XG4gICAgICBvcHRpb25zLnBhdGNoZWQoaW5kZXgsIHVwZGF0ZWRDb250ZW50LCBmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgIGlmIChlcnIpIHtcbiAgICAgICAgICByZXR1cm4gb3B0aW9ucy5jb21wbGV0ZShlcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvY2Vzc0luZGV4KCk7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuXG4gIHByb2Nlc3NJbmRleCgpO1xufVxuXG5mdW5jdGlvbiBzdHJ1Y3R1cmVkUGF0Y2gob2xkRmlsZU5hbWUsIG5ld0ZpbGVOYW1lLCBvbGRTdHIsIG5ld1N0ciwgb2xkSGVhZGVyLCBuZXdIZWFkZXIsIG9wdGlvbnMpIHtcbiAgaWYgKCFvcHRpb25zKSB7XG4gICAgb3B0aW9ucyA9IHt9O1xuICB9XG5cbiAgaWYgKHR5cGVvZiBvcHRpb25zLmNvbnRleHQgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgb3B0aW9ucy5jb250ZXh0ID0gNDtcbiAgfVxuXG4gIHZhciBkaWZmID0gZGlmZkxpbmVzKG9sZFN0ciwgbmV3U3RyLCBvcHRpb25zKTtcbiAgZGlmZi5wdXNoKHtcbiAgICB2YWx1ZTogJycsXG4gICAgbGluZXM6IFtdXG4gIH0pOyAvLyBBcHBlbmQgYW4gZW1wdHkgdmFsdWUgdG8gbWFrZSBjbGVhbnVwIGVhc2llclxuXG4gIGZ1bmN0aW9uIGNvbnRleHRMaW5lcyhsaW5lcykge1xuICAgIHJldHVybiBsaW5lcy5tYXAoZnVuY3Rpb24gKGVudHJ5KSB7XG4gICAgICByZXR1cm4gJyAnICsgZW50cnk7XG4gICAgfSk7XG4gIH1cblxuICB2YXIgaHVua3MgPSBbXTtcbiAgdmFyIG9sZFJhbmdlU3RhcnQgPSAwLFxuICAgICAgbmV3UmFuZ2VTdGFydCA9IDAsXG4gICAgICBjdXJSYW5nZSA9IFtdLFxuICAgICAgb2xkTGluZSA9IDEsXG4gICAgICBuZXdMaW5lID0gMTtcblxuICB2YXIgX2xvb3AgPSBmdW5jdGlvbiBfbG9vcChpKSB7XG4gICAgdmFyIGN1cnJlbnQgPSBkaWZmW2ldLFxuICAgICAgICBsaW5lcyA9IGN1cnJlbnQubGluZXMgfHwgY3VycmVudC52YWx1ZS5yZXBsYWNlKC9cXG4kLywgJycpLnNwbGl0KCdcXG4nKTtcbiAgICBjdXJyZW50LmxpbmVzID0gbGluZXM7XG5cbiAgICBpZiAoY3VycmVudC5hZGRlZCB8fCBjdXJyZW50LnJlbW92ZWQpIHtcbiAgICAgIHZhciBfY3VyUmFuZ2U7XG5cbiAgICAgIC8vIElmIHdlIGhhdmUgcHJldmlvdXMgY29udGV4dCwgc3RhcnQgd2l0aCB0aGF0XG4gICAgICBpZiAoIW9sZFJhbmdlU3RhcnQpIHtcbiAgICAgICAgdmFyIHByZXYgPSBkaWZmW2kgLSAxXTtcbiAgICAgICAgb2xkUmFuZ2VTdGFydCA9IG9sZExpbmU7XG4gICAgICAgIG5ld1JhbmdlU3RhcnQgPSBuZXdMaW5lO1xuXG4gICAgICAgIGlmIChwcmV2KSB7XG4gICAgICAgICAgY3VyUmFuZ2UgPSBvcHRpb25zLmNvbnRleHQgPiAwID8gY29udGV4dExpbmVzKHByZXYubGluZXMuc2xpY2UoLW9wdGlvbnMuY29udGV4dCkpIDogW107XG4gICAgICAgICAgb2xkUmFuZ2VTdGFydCAtPSBjdXJSYW5nZS5sZW5ndGg7XG4gICAgICAgICAgbmV3UmFuZ2VTdGFydCAtPSBjdXJSYW5nZS5sZW5ndGg7XG4gICAgICAgIH1cbiAgICAgIH0gLy8gT3V0cHV0IG91ciBjaGFuZ2VzXG5cblxuICAgICAgKF9jdXJSYW5nZSA9IGN1clJhbmdlKS5wdXNoLmFwcGx5KF9jdXJSYW5nZSwgX3RvQ29uc3VtYWJsZUFycmF5KGxpbmVzLm1hcChmdW5jdGlvbiAoZW50cnkpIHtcbiAgICAgICAgcmV0dXJuIChjdXJyZW50LmFkZGVkID8gJysnIDogJy0nKSArIGVudHJ5O1xuICAgICAgfSkpKTsgLy8gVHJhY2sgdGhlIHVwZGF0ZWQgZmlsZSBwb3NpdGlvblxuXG5cbiAgICAgIGlmIChjdXJyZW50LmFkZGVkKSB7XG4gICAgICAgIG5ld0xpbmUgKz0gbGluZXMubGVuZ3RoO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgb2xkTGluZSArPSBsaW5lcy5sZW5ndGg7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIElkZW50aWNhbCBjb250ZXh0IGxpbmVzLiBUcmFjayBsaW5lIGNoYW5nZXNcbiAgICAgIGlmIChvbGRSYW5nZVN0YXJ0KSB7XG4gICAgICAgIC8vIENsb3NlIG91dCBhbnkgY2hhbmdlcyB0aGF0IGhhdmUgYmVlbiBvdXRwdXQgKG9yIGpvaW4gb3ZlcmxhcHBpbmcpXG4gICAgICAgIGlmIChsaW5lcy5sZW5ndGggPD0gb3B0aW9ucy5jb250ZXh0ICogMiAmJiBpIDwgZGlmZi5sZW5ndGggLSAyKSB7XG4gICAgICAgICAgdmFyIF9jdXJSYW5nZTI7XG5cbiAgICAgICAgICAvLyBPdmVybGFwcGluZ1xuICAgICAgICAgIChfY3VyUmFuZ2UyID0gY3VyUmFuZ2UpLnB1c2guYXBwbHkoX2N1clJhbmdlMiwgX3RvQ29uc3VtYWJsZUFycmF5KGNvbnRleHRMaW5lcyhsaW5lcykpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YXIgX2N1clJhbmdlMztcblxuICAgICAgICAgIC8vIGVuZCB0aGUgcmFuZ2UgYW5kIG91dHB1dFxuICAgICAgICAgIHZhciBjb250ZXh0U2l6ZSA9IE1hdGgubWluKGxpbmVzLmxlbmd0aCwgb3B0aW9ucy5jb250ZXh0KTtcblxuICAgICAgICAgIChfY3VyUmFuZ2UzID0gY3VyUmFuZ2UpLnB1c2guYXBwbHkoX2N1clJhbmdlMywgX3RvQ29uc3VtYWJsZUFycmF5KGNvbnRleHRMaW5lcyhsaW5lcy5zbGljZSgwLCBjb250ZXh0U2l6ZSkpKSk7XG5cbiAgICAgICAgICB2YXIgaHVuayA9IHtcbiAgICAgICAgICAgIG9sZFN0YXJ0OiBvbGRSYW5nZVN0YXJ0LFxuICAgICAgICAgICAgb2xkTGluZXM6IG9sZExpbmUgLSBvbGRSYW5nZVN0YXJ0ICsgY29udGV4dFNpemUsXG4gICAgICAgICAgICBuZXdTdGFydDogbmV3UmFuZ2VTdGFydCxcbiAgICAgICAgICAgIG5ld0xpbmVzOiBuZXdMaW5lIC0gbmV3UmFuZ2VTdGFydCArIGNvbnRleHRTaXplLFxuICAgICAgICAgICAgbGluZXM6IGN1clJhbmdlXG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGlmIChpID49IGRpZmYubGVuZ3RoIC0gMiAmJiBsaW5lcy5sZW5ndGggPD0gb3B0aW9ucy5jb250ZXh0KSB7XG4gICAgICAgICAgICAvLyBFT0YgaXMgaW5zaWRlIHRoaXMgaHVua1xuICAgICAgICAgICAgdmFyIG9sZEVPRk5ld2xpbmUgPSAvXFxuJC8udGVzdChvbGRTdHIpO1xuICAgICAgICAgICAgdmFyIG5ld0VPRk5ld2xpbmUgPSAvXFxuJC8udGVzdChuZXdTdHIpO1xuICAgICAgICAgICAgdmFyIG5vTmxCZWZvcmVBZGRzID0gbGluZXMubGVuZ3RoID09IDAgJiYgY3VyUmFuZ2UubGVuZ3RoID4gaHVuay5vbGRMaW5lcztcblxuICAgICAgICAgICAgaWYgKCFvbGRFT0ZOZXdsaW5lICYmIG5vTmxCZWZvcmVBZGRzICYmIG9sZFN0ci5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgIC8vIHNwZWNpYWwgY2FzZTogb2xkIGhhcyBubyBlb2wgYW5kIG5vIHRyYWlsaW5nIGNvbnRleHQ7IG5vLW5sIGNhbiBlbmQgdXAgYmVmb3JlIGFkZHNcbiAgICAgICAgICAgICAgLy8gaG93ZXZlciwgaWYgdGhlIG9sZCBmaWxlIGlzIGVtcHR5LCBkbyBub3Qgb3V0cHV0IHRoZSBuby1ubCBsaW5lXG4gICAgICAgICAgICAgIGN1clJhbmdlLnNwbGljZShodW5rLm9sZExpbmVzLCAwLCAnXFxcXCBObyBuZXdsaW5lIGF0IGVuZCBvZiBmaWxlJyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICghb2xkRU9GTmV3bGluZSAmJiAhbm9ObEJlZm9yZUFkZHMgfHwgIW5ld0VPRk5ld2xpbmUpIHtcbiAgICAgICAgICAgICAgY3VyUmFuZ2UucHVzaCgnXFxcXCBObyBuZXdsaW5lIGF0IGVuZCBvZiBmaWxlJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaHVua3MucHVzaChodW5rKTtcbiAgICAgICAgICBvbGRSYW5nZVN0YXJ0ID0gMDtcbiAgICAgICAgICBuZXdSYW5nZVN0YXJ0ID0gMDtcbiAgICAgICAgICBjdXJSYW5nZSA9IFtdO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIG9sZExpbmUgKz0gbGluZXMubGVuZ3RoO1xuICAgICAgbmV3TGluZSArPSBsaW5lcy5sZW5ndGg7XG4gICAgfVxuICB9O1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZGlmZi5sZW5ndGg7IGkrKykge1xuICAgIF9sb29wKGkpO1xuICB9XG5cbiAgcmV0dXJuIHtcbiAgICBvbGRGaWxlTmFtZTogb2xkRmlsZU5hbWUsXG4gICAgbmV3RmlsZU5hbWU6IG5ld0ZpbGVOYW1lLFxuICAgIG9sZEhlYWRlcjogb2xkSGVhZGVyLFxuICAgIG5ld0hlYWRlcjogbmV3SGVhZGVyLFxuICAgIGh1bmtzOiBodW5rc1xuICB9O1xufVxuZnVuY3Rpb24gZm9ybWF0UGF0Y2goZGlmZikge1xuICB2YXIgcmV0ID0gW107XG5cbiAgaWYgKGRpZmYub2xkRmlsZU5hbWUgPT0gZGlmZi5uZXdGaWxlTmFtZSkge1xuICAgIHJldC5wdXNoKCdJbmRleDogJyArIGRpZmYub2xkRmlsZU5hbWUpO1xuICB9XG5cbiAgcmV0LnB1c2goJz09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0nKTtcbiAgcmV0LnB1c2goJy0tLSAnICsgZGlmZi5vbGRGaWxlTmFtZSArICh0eXBlb2YgZGlmZi5vbGRIZWFkZXIgPT09ICd1bmRlZmluZWQnID8gJycgOiAnXFx0JyArIGRpZmYub2xkSGVhZGVyKSk7XG4gIHJldC5wdXNoKCcrKysgJyArIGRpZmYubmV3RmlsZU5hbWUgKyAodHlwZW9mIGRpZmYubmV3SGVhZGVyID09PSAndW5kZWZpbmVkJyA/ICcnIDogJ1xcdCcgKyBkaWZmLm5ld0hlYWRlcikpO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgZGlmZi5odW5rcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBodW5rID0gZGlmZi5odW5rc1tpXTsgLy8gVW5pZmllZCBEaWZmIEZvcm1hdCBxdWlyazogSWYgdGhlIGNodW5rIHNpemUgaXMgMCxcbiAgICAvLyB0aGUgZmlyc3QgbnVtYmVyIGlzIG9uZSBsb3dlciB0aGFuIG9uZSB3b3VsZCBleHBlY3QuXG4gICAgLy8gaHR0cHM6Ly93d3cuYXJ0aW1hLmNvbS93ZWJsb2dzL3ZpZXdwb3N0LmpzcD90aHJlYWQ9MTY0MjkzXG5cbiAgICBpZiAoaHVuay5vbGRMaW5lcyA9PT0gMCkge1xuICAgICAgaHVuay5vbGRTdGFydCAtPSAxO1xuICAgIH1cblxuICAgIGlmIChodW5rLm5ld0xpbmVzID09PSAwKSB7XG4gICAgICBodW5rLm5ld1N0YXJ0IC09IDE7XG4gICAgfVxuXG4gICAgcmV0LnB1c2goJ0BAIC0nICsgaHVuay5vbGRTdGFydCArICcsJyArIGh1bmsub2xkTGluZXMgKyAnICsnICsgaHVuay5uZXdTdGFydCArICcsJyArIGh1bmsubmV3TGluZXMgKyAnIEBAJyk7XG4gICAgcmV0LnB1c2guYXBwbHkocmV0LCBodW5rLmxpbmVzKTtcbiAgfVxuXG4gIHJldHVybiByZXQuam9pbignXFxuJykgKyAnXFxuJztcbn1cbmZ1bmN0aW9uIGNyZWF0ZVR3b0ZpbGVzUGF0Y2gob2xkRmlsZU5hbWUsIG5ld0ZpbGVOYW1lLCBvbGRTdHIsIG5ld1N0ciwgb2xkSGVhZGVyLCBuZXdIZWFkZXIsIG9wdGlvbnMpIHtcbiAgcmV0dXJuIGZvcm1hdFBhdGNoKHN0cnVjdHVyZWRQYXRjaChvbGRGaWxlTmFtZSwgbmV3RmlsZU5hbWUsIG9sZFN0ciwgbmV3U3RyLCBvbGRIZWFkZXIsIG5ld0hlYWRlciwgb3B0aW9ucykpO1xufVxuZnVuY3Rpb24gY3JlYXRlUGF0Y2goZmlsZU5hbWUsIG9sZFN0ciwgbmV3U3RyLCBvbGRIZWFkZXIsIG5ld0hlYWRlciwgb3B0aW9ucykge1xuICByZXR1cm4gY3JlYXRlVHdvRmlsZXNQYXRjaChmaWxlTmFtZSwgZmlsZU5hbWUsIG9sZFN0ciwgbmV3U3RyLCBvbGRIZWFkZXIsIG5ld0hlYWRlciwgb3B0aW9ucyk7XG59XG5cbmZ1bmN0aW9uIGFycmF5RXF1YWwoYSwgYikge1xuICBpZiAoYS5sZW5ndGggIT09IGIubGVuZ3RoKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIGFycmF5U3RhcnRzV2l0aChhLCBiKTtcbn1cbmZ1bmN0aW9uIGFycmF5U3RhcnRzV2l0aChhcnJheSwgc3RhcnQpIHtcbiAgaWYgKHN0YXJ0Lmxlbmd0aCA+IGFycmF5Lmxlbmd0aCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgc3RhcnQubGVuZ3RoOyBpKyspIHtcbiAgICBpZiAoc3RhcnRbaV0gIT09IGFycmF5W2ldKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIGNhbGNMaW5lQ291bnQoaHVuaykge1xuICB2YXIgX2NhbGNPbGROZXdMaW5lQ291bnQgPSBjYWxjT2xkTmV3TGluZUNvdW50KGh1bmsubGluZXMpLFxuICAgICAgb2xkTGluZXMgPSBfY2FsY09sZE5ld0xpbmVDb3VudC5vbGRMaW5lcyxcbiAgICAgIG5ld0xpbmVzID0gX2NhbGNPbGROZXdMaW5lQ291bnQubmV3TGluZXM7XG5cbiAgaWYgKG9sZExpbmVzICE9PSB1bmRlZmluZWQpIHtcbiAgICBodW5rLm9sZExpbmVzID0gb2xkTGluZXM7XG4gIH0gZWxzZSB7XG4gICAgZGVsZXRlIGh1bmsub2xkTGluZXM7XG4gIH1cblxuICBpZiAobmV3TGluZXMgIT09IHVuZGVmaW5lZCkge1xuICAgIGh1bmsubmV3TGluZXMgPSBuZXdMaW5lcztcbiAgfSBlbHNlIHtcbiAgICBkZWxldGUgaHVuay5uZXdMaW5lcztcbiAgfVxufVxuZnVuY3Rpb24gbWVyZ2UobWluZSwgdGhlaXJzLCBiYXNlKSB7XG4gIG1pbmUgPSBsb2FkUGF0Y2gobWluZSwgYmFzZSk7XG4gIHRoZWlycyA9IGxvYWRQYXRjaCh0aGVpcnMsIGJhc2UpO1xuICB2YXIgcmV0ID0ge307IC8vIEZvciBpbmRleCB3ZSBqdXN0IGxldCBpdCBwYXNzIHRocm91Z2ggYXMgaXQgZG9lc24ndCBoYXZlIGFueSBuZWNlc3NhcnkgbWVhbmluZy5cbiAgLy8gTGVhdmluZyBzYW5pdHkgY2hlY2tzIG9uIHRoaXMgdG8gdGhlIEFQSSBjb25zdW1lciB0aGF0IG1heSBrbm93IG1vcmUgYWJvdXQgdGhlXG4gIC8vIG1lYW5pbmcgaW4gdGhlaXIgb3duIGNvbnRleHQuXG5cbiAgaWYgKG1pbmUuaW5kZXggfHwgdGhlaXJzLmluZGV4KSB7XG4gICAgcmV0LmluZGV4ID0gbWluZS5pbmRleCB8fCB0aGVpcnMuaW5kZXg7XG4gIH1cblxuICBpZiAobWluZS5uZXdGaWxlTmFtZSB8fCB0aGVpcnMubmV3RmlsZU5hbWUpIHtcbiAgICBpZiAoIWZpbGVOYW1lQ2hhbmdlZChtaW5lKSkge1xuICAgICAgLy8gTm8gaGVhZGVyIG9yIG5vIGNoYW5nZSBpbiBvdXJzLCB1c2UgdGhlaXJzIChhbmQgb3VycyBpZiB0aGVpcnMgZG9lcyBub3QgZXhpc3QpXG4gICAgICByZXQub2xkRmlsZU5hbWUgPSB0aGVpcnMub2xkRmlsZU5hbWUgfHwgbWluZS5vbGRGaWxlTmFtZTtcbiAgICAgIHJldC5uZXdGaWxlTmFtZSA9IHRoZWlycy5uZXdGaWxlTmFtZSB8fCBtaW5lLm5ld0ZpbGVOYW1lO1xuICAgICAgcmV0Lm9sZEhlYWRlciA9IHRoZWlycy5vbGRIZWFkZXIgfHwgbWluZS5vbGRIZWFkZXI7XG4gICAgICByZXQubmV3SGVhZGVyID0gdGhlaXJzLm5ld0hlYWRlciB8fCBtaW5lLm5ld0hlYWRlcjtcbiAgICB9IGVsc2UgaWYgKCFmaWxlTmFtZUNoYW5nZWQodGhlaXJzKSkge1xuICAgICAgLy8gTm8gaGVhZGVyIG9yIG5vIGNoYW5nZSBpbiB0aGVpcnMsIHVzZSBvdXJzXG4gICAgICByZXQub2xkRmlsZU5hbWUgPSBtaW5lLm9sZEZpbGVOYW1lO1xuICAgICAgcmV0Lm5ld0ZpbGVOYW1lID0gbWluZS5uZXdGaWxlTmFtZTtcbiAgICAgIHJldC5vbGRIZWFkZXIgPSBtaW5lLm9sZEhlYWRlcjtcbiAgICAgIHJldC5uZXdIZWFkZXIgPSBtaW5lLm5ld0hlYWRlcjtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gQm90aCBjaGFuZ2VkLi4uIGZpZ3VyZSBpdCBvdXRcbiAgICAgIHJldC5vbGRGaWxlTmFtZSA9IHNlbGVjdEZpZWxkKHJldCwgbWluZS5vbGRGaWxlTmFtZSwgdGhlaXJzLm9sZEZpbGVOYW1lKTtcbiAgICAgIHJldC5uZXdGaWxlTmFtZSA9IHNlbGVjdEZpZWxkKHJldCwgbWluZS5uZXdGaWxlTmFtZSwgdGhlaXJzLm5ld0ZpbGVOYW1lKTtcbiAgICAgIHJldC5vbGRIZWFkZXIgPSBzZWxlY3RGaWVsZChyZXQsIG1pbmUub2xkSGVhZGVyLCB0aGVpcnMub2xkSGVhZGVyKTtcbiAgICAgIHJldC5uZXdIZWFkZXIgPSBzZWxlY3RGaWVsZChyZXQsIG1pbmUubmV3SGVhZGVyLCB0aGVpcnMubmV3SGVhZGVyKTtcbiAgICB9XG4gIH1cblxuICByZXQuaHVua3MgPSBbXTtcbiAgdmFyIG1pbmVJbmRleCA9IDAsXG4gICAgICB0aGVpcnNJbmRleCA9IDAsXG4gICAgICBtaW5lT2Zmc2V0ID0gMCxcbiAgICAgIHRoZWlyc09mZnNldCA9IDA7XG5cbiAgd2hpbGUgKG1pbmVJbmRleCA8IG1pbmUuaHVua3MubGVuZ3RoIHx8IHRoZWlyc0luZGV4IDwgdGhlaXJzLmh1bmtzLmxlbmd0aCkge1xuICAgIHZhciBtaW5lQ3VycmVudCA9IG1pbmUuaHVua3NbbWluZUluZGV4XSB8fCB7XG4gICAgICBvbGRTdGFydDogSW5maW5pdHlcbiAgICB9LFxuICAgICAgICB0aGVpcnNDdXJyZW50ID0gdGhlaXJzLmh1bmtzW3RoZWlyc0luZGV4XSB8fCB7XG4gICAgICBvbGRTdGFydDogSW5maW5pdHlcbiAgICB9O1xuXG4gICAgaWYgKGh1bmtCZWZvcmUobWluZUN1cnJlbnQsIHRoZWlyc0N1cnJlbnQpKSB7XG4gICAgICAvLyBUaGlzIHBhdGNoIGRvZXMgbm90IG92ZXJsYXAgd2l0aCBhbnkgb2YgdGhlIG90aGVycywgeWF5LlxuICAgICAgcmV0Lmh1bmtzLnB1c2goY2xvbmVIdW5rKG1pbmVDdXJyZW50LCBtaW5lT2Zmc2V0KSk7XG4gICAgICBtaW5lSW5kZXgrKztcbiAgICAgIHRoZWlyc09mZnNldCArPSBtaW5lQ3VycmVudC5uZXdMaW5lcyAtIG1pbmVDdXJyZW50Lm9sZExpbmVzO1xuICAgIH0gZWxzZSBpZiAoaHVua0JlZm9yZSh0aGVpcnNDdXJyZW50LCBtaW5lQ3VycmVudCkpIHtcbiAgICAgIC8vIFRoaXMgcGF0Y2ggZG9lcyBub3Qgb3ZlcmxhcCB3aXRoIGFueSBvZiB0aGUgb3RoZXJzLCB5YXkuXG4gICAgICByZXQuaHVua3MucHVzaChjbG9uZUh1bmsodGhlaXJzQ3VycmVudCwgdGhlaXJzT2Zmc2V0KSk7XG4gICAgICB0aGVpcnNJbmRleCsrO1xuICAgICAgbWluZU9mZnNldCArPSB0aGVpcnNDdXJyZW50Lm5ld0xpbmVzIC0gdGhlaXJzQ3VycmVudC5vbGRMaW5lcztcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gT3ZlcmxhcCwgbWVyZ2UgYXMgYmVzdCB3ZSBjYW5cbiAgICAgIHZhciBtZXJnZWRIdW5rID0ge1xuICAgICAgICBvbGRTdGFydDogTWF0aC5taW4obWluZUN1cnJlbnQub2xkU3RhcnQsIHRoZWlyc0N1cnJlbnQub2xkU3RhcnQpLFxuICAgICAgICBvbGRMaW5lczogMCxcbiAgICAgICAgbmV3U3RhcnQ6IE1hdGgubWluKG1pbmVDdXJyZW50Lm5ld1N0YXJ0ICsgbWluZU9mZnNldCwgdGhlaXJzQ3VycmVudC5vbGRTdGFydCArIHRoZWlyc09mZnNldCksXG4gICAgICAgIG5ld0xpbmVzOiAwLFxuICAgICAgICBsaW5lczogW11cbiAgICAgIH07XG4gICAgICBtZXJnZUxpbmVzKG1lcmdlZEh1bmssIG1pbmVDdXJyZW50Lm9sZFN0YXJ0LCBtaW5lQ3VycmVudC5saW5lcywgdGhlaXJzQ3VycmVudC5vbGRTdGFydCwgdGhlaXJzQ3VycmVudC5saW5lcyk7XG4gICAgICB0aGVpcnNJbmRleCsrO1xuICAgICAgbWluZUluZGV4Kys7XG4gICAgICByZXQuaHVua3MucHVzaChtZXJnZWRIdW5rKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBsb2FkUGF0Y2gocGFyYW0sIGJhc2UpIHtcbiAgaWYgKHR5cGVvZiBwYXJhbSA9PT0gJ3N0cmluZycpIHtcbiAgICBpZiAoL15AQC9tLnRlc3QocGFyYW0pIHx8IC9eSW5kZXg6L20udGVzdChwYXJhbSkpIHtcbiAgICAgIHJldHVybiBwYXJzZVBhdGNoKHBhcmFtKVswXTtcbiAgICB9XG5cbiAgICBpZiAoIWJhc2UpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcignTXVzdCBwcm92aWRlIGEgYmFzZSByZWZlcmVuY2Ugb3IgcGFzcyBpbiBhIHBhdGNoJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHN0cnVjdHVyZWRQYXRjaCh1bmRlZmluZWQsIHVuZGVmaW5lZCwgYmFzZSwgcGFyYW0pO1xuICB9XG5cbiAgcmV0dXJuIHBhcmFtO1xufVxuXG5mdW5jdGlvbiBmaWxlTmFtZUNoYW5nZWQocGF0Y2gpIHtcbiAgcmV0dXJuIHBhdGNoLm5ld0ZpbGVOYW1lICYmIHBhdGNoLm5ld0ZpbGVOYW1lICE9PSBwYXRjaC5vbGRGaWxlTmFtZTtcbn1cblxuZnVuY3Rpb24gc2VsZWN0RmllbGQoaW5kZXgsIG1pbmUsIHRoZWlycykge1xuICBpZiAobWluZSA9PT0gdGhlaXJzKSB7XG4gICAgcmV0dXJuIG1pbmU7XG4gIH0gZWxzZSB7XG4gICAgaW5kZXguY29uZmxpY3QgPSB0cnVlO1xuICAgIHJldHVybiB7XG4gICAgICBtaW5lOiBtaW5lLFxuICAgICAgdGhlaXJzOiB0aGVpcnNcbiAgICB9O1xuICB9XG59XG5cbmZ1bmN0aW9uIGh1bmtCZWZvcmUodGVzdCwgY2hlY2spIHtcbiAgcmV0dXJuIHRlc3Qub2xkU3RhcnQgPCBjaGVjay5vbGRTdGFydCAmJiB0ZXN0Lm9sZFN0YXJ0ICsgdGVzdC5vbGRMaW5lcyA8IGNoZWNrLm9sZFN0YXJ0O1xufVxuXG5mdW5jdGlvbiBjbG9uZUh1bmsoaHVuaywgb2Zmc2V0KSB7XG4gIHJldHVybiB7XG4gICAgb2xkU3RhcnQ6IGh1bmsub2xkU3RhcnQsXG4gICAgb2xkTGluZXM6IGh1bmsub2xkTGluZXMsXG4gICAgbmV3U3RhcnQ6IGh1bmsubmV3U3RhcnQgKyBvZmZzZXQsXG4gICAgbmV3TGluZXM6IGh1bmsubmV3TGluZXMsXG4gICAgbGluZXM6IGh1bmsubGluZXNcbiAgfTtcbn1cblxuZnVuY3Rpb24gbWVyZ2VMaW5lcyhodW5rLCBtaW5lT2Zmc2V0LCBtaW5lTGluZXMsIHRoZWlyT2Zmc2V0LCB0aGVpckxpbmVzKSB7XG4gIC8vIFRoaXMgd2lsbCBnZW5lcmFsbHkgcmVzdWx0IGluIGEgY29uZmxpY3RlZCBodW5rLCBidXQgdGhlcmUgYXJlIGNhc2VzIHdoZXJlIHRoZSBjb250ZXh0XG4gIC8vIGlzIHRoZSBvbmx5IG92ZXJsYXAgd2hlcmUgd2UgY2FuIHN1Y2Nlc3NmdWxseSBtZXJnZSB0aGUgY29udGVudCBoZXJlLlxuICB2YXIgbWluZSA9IHtcbiAgICBvZmZzZXQ6IG1pbmVPZmZzZXQsXG4gICAgbGluZXM6IG1pbmVMaW5lcyxcbiAgICBpbmRleDogMFxuICB9LFxuICAgICAgdGhlaXIgPSB7XG4gICAgb2Zmc2V0OiB0aGVpck9mZnNldCxcbiAgICBsaW5lczogdGhlaXJMaW5lcyxcbiAgICBpbmRleDogMFxuICB9OyAvLyBIYW5kbGUgYW55IGxlYWRpbmcgY29udGVudFxuXG4gIGluc2VydExlYWRpbmcoaHVuaywgbWluZSwgdGhlaXIpO1xuICBpbnNlcnRMZWFkaW5nKGh1bmssIHRoZWlyLCBtaW5lKTsgLy8gTm93IGluIHRoZSBvdmVybGFwIGNvbnRlbnQuIFNjYW4gdGhyb3VnaCBhbmQgc2VsZWN0IHRoZSBiZXN0IGNoYW5nZXMgZnJvbSBlYWNoLlxuXG4gIHdoaWxlIChtaW5lLmluZGV4IDwgbWluZS5saW5lcy5sZW5ndGggJiYgdGhlaXIuaW5kZXggPCB0aGVpci5saW5lcy5sZW5ndGgpIHtcbiAgICB2YXIgbWluZUN1cnJlbnQgPSBtaW5lLmxpbmVzW21pbmUuaW5kZXhdLFxuICAgICAgICB0aGVpckN1cnJlbnQgPSB0aGVpci5saW5lc1t0aGVpci5pbmRleF07XG5cbiAgICBpZiAoKG1pbmVDdXJyZW50WzBdID09PSAnLScgfHwgbWluZUN1cnJlbnRbMF0gPT09ICcrJykgJiYgKHRoZWlyQ3VycmVudFswXSA9PT0gJy0nIHx8IHRoZWlyQ3VycmVudFswXSA9PT0gJysnKSkge1xuICAgICAgLy8gQm90aCBtb2RpZmllZCAuLi5cbiAgICAgIG11dHVhbENoYW5nZShodW5rLCBtaW5lLCB0aGVpcik7XG4gICAgfSBlbHNlIGlmIChtaW5lQ3VycmVudFswXSA9PT0gJysnICYmIHRoZWlyQ3VycmVudFswXSA9PT0gJyAnKSB7XG4gICAgICB2YXIgX2h1bmskbGluZXM7XG5cbiAgICAgIC8vIE1pbmUgaW5zZXJ0ZWRcbiAgICAgIChfaHVuayRsaW5lcyA9IGh1bmsubGluZXMpLnB1c2guYXBwbHkoX2h1bmskbGluZXMsIF90b0NvbnN1bWFibGVBcnJheShjb2xsZWN0Q2hhbmdlKG1pbmUpKSk7XG4gICAgfSBlbHNlIGlmICh0aGVpckN1cnJlbnRbMF0gPT09ICcrJyAmJiBtaW5lQ3VycmVudFswXSA9PT0gJyAnKSB7XG4gICAgICB2YXIgX2h1bmskbGluZXMyO1xuXG4gICAgICAvLyBUaGVpcnMgaW5zZXJ0ZWRcbiAgICAgIChfaHVuayRsaW5lczIgPSBodW5rLmxpbmVzKS5wdXNoLmFwcGx5KF9odW5rJGxpbmVzMiwgX3RvQ29uc3VtYWJsZUFycmF5KGNvbGxlY3RDaGFuZ2UodGhlaXIpKSk7XG4gICAgfSBlbHNlIGlmIChtaW5lQ3VycmVudFswXSA9PT0gJy0nICYmIHRoZWlyQ3VycmVudFswXSA9PT0gJyAnKSB7XG4gICAgICAvLyBNaW5lIHJlbW92ZWQgb3IgZWRpdGVkXG4gICAgICByZW1vdmFsKGh1bmssIG1pbmUsIHRoZWlyKTtcbiAgICB9IGVsc2UgaWYgKHRoZWlyQ3VycmVudFswXSA9PT0gJy0nICYmIG1pbmVDdXJyZW50WzBdID09PSAnICcpIHtcbiAgICAgIC8vIFRoZWlyIHJlbW92ZWQgb3IgZWRpdGVkXG4gICAgICByZW1vdmFsKGh1bmssIHRoZWlyLCBtaW5lLCB0cnVlKTtcbiAgICB9IGVsc2UgaWYgKG1pbmVDdXJyZW50ID09PSB0aGVpckN1cnJlbnQpIHtcbiAgICAgIC8vIENvbnRleHQgaWRlbnRpdHlcbiAgICAgIGh1bmsubGluZXMucHVzaChtaW5lQ3VycmVudCk7XG4gICAgICBtaW5lLmluZGV4Kys7XG4gICAgICB0aGVpci5pbmRleCsrO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBDb250ZXh0IG1pc21hdGNoXG4gICAgICBjb25mbGljdChodW5rLCBjb2xsZWN0Q2hhbmdlKG1pbmUpLCBjb2xsZWN0Q2hhbmdlKHRoZWlyKSk7XG4gICAgfVxuICB9IC8vIE5vdyBwdXNoIGFueXRoaW5nIHRoYXQgbWF5IGJlIHJlbWFpbmluZ1xuXG5cbiAgaW5zZXJ0VHJhaWxpbmcoaHVuaywgbWluZSk7XG4gIGluc2VydFRyYWlsaW5nKGh1bmssIHRoZWlyKTtcbiAgY2FsY0xpbmVDb3VudChodW5rKTtcbn1cblxuZnVuY3Rpb24gbXV0dWFsQ2hhbmdlKGh1bmssIG1pbmUsIHRoZWlyKSB7XG4gIHZhciBteUNoYW5nZXMgPSBjb2xsZWN0Q2hhbmdlKG1pbmUpLFxuICAgICAgdGhlaXJDaGFuZ2VzID0gY29sbGVjdENoYW5nZSh0aGVpcik7XG5cbiAgaWYgKGFsbFJlbW92ZXMobXlDaGFuZ2VzKSAmJiBhbGxSZW1vdmVzKHRoZWlyQ2hhbmdlcykpIHtcbiAgICAvLyBTcGVjaWFsIGNhc2UgZm9yIHJlbW92ZSBjaGFuZ2VzIHRoYXQgYXJlIHN1cGVyc2V0cyBvZiBvbmUgYW5vdGhlclxuICAgIGlmIChhcnJheVN0YXJ0c1dpdGgobXlDaGFuZ2VzLCB0aGVpckNoYW5nZXMpICYmIHNraXBSZW1vdmVTdXBlcnNldCh0aGVpciwgbXlDaGFuZ2VzLCBteUNoYW5nZXMubGVuZ3RoIC0gdGhlaXJDaGFuZ2VzLmxlbmd0aCkpIHtcbiAgICAgIHZhciBfaHVuayRsaW5lczM7XG5cbiAgICAgIChfaHVuayRsaW5lczMgPSBodW5rLmxpbmVzKS5wdXNoLmFwcGx5KF9odW5rJGxpbmVzMywgX3RvQ29uc3VtYWJsZUFycmF5KG15Q2hhbmdlcykpO1xuXG4gICAgICByZXR1cm47XG4gICAgfSBlbHNlIGlmIChhcnJheVN0YXJ0c1dpdGgodGhlaXJDaGFuZ2VzLCBteUNoYW5nZXMpICYmIHNraXBSZW1vdmVTdXBlcnNldChtaW5lLCB0aGVpckNoYW5nZXMsIHRoZWlyQ2hhbmdlcy5sZW5ndGggLSBteUNoYW5nZXMubGVuZ3RoKSkge1xuICAgICAgdmFyIF9odW5rJGxpbmVzNDtcblxuICAgICAgKF9odW5rJGxpbmVzNCA9IGh1bmsubGluZXMpLnB1c2guYXBwbHkoX2h1bmskbGluZXM0LCBfdG9Db25zdW1hYmxlQXJyYXkodGhlaXJDaGFuZ2VzKSk7XG5cbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH0gZWxzZSBpZiAoYXJyYXlFcXVhbChteUNoYW5nZXMsIHRoZWlyQ2hhbmdlcykpIHtcbiAgICB2YXIgX2h1bmskbGluZXM1O1xuXG4gICAgKF9odW5rJGxpbmVzNSA9IGh1bmsubGluZXMpLnB1c2guYXBwbHkoX2h1bmskbGluZXM1LCBfdG9Db25zdW1hYmxlQXJyYXkobXlDaGFuZ2VzKSk7XG5cbiAgICByZXR1cm47XG4gIH1cblxuICBjb25mbGljdChodW5rLCBteUNoYW5nZXMsIHRoZWlyQ2hhbmdlcyk7XG59XG5cbmZ1bmN0aW9uIHJlbW92YWwoaHVuaywgbWluZSwgdGhlaXIsIHN3YXApIHtcbiAgdmFyIG15Q2hhbmdlcyA9IGNvbGxlY3RDaGFuZ2UobWluZSksXG4gICAgICB0aGVpckNoYW5nZXMgPSBjb2xsZWN0Q29udGV4dCh0aGVpciwgbXlDaGFuZ2VzKTtcblxuICBpZiAodGhlaXJDaGFuZ2VzLm1lcmdlZCkge1xuICAgIHZhciBfaHVuayRsaW5lczY7XG5cbiAgICAoX2h1bmskbGluZXM2ID0gaHVuay5saW5lcykucHVzaC5hcHBseShfaHVuayRsaW5lczYsIF90b0NvbnN1bWFibGVBcnJheSh0aGVpckNoYW5nZXMubWVyZ2VkKSk7XG4gIH0gZWxzZSB7XG4gICAgY29uZmxpY3QoaHVuaywgc3dhcCA/IHRoZWlyQ2hhbmdlcyA6IG15Q2hhbmdlcywgc3dhcCA/IG15Q2hhbmdlcyA6IHRoZWlyQ2hhbmdlcyk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY29uZmxpY3QoaHVuaywgbWluZSwgdGhlaXIpIHtcbiAgaHVuay5jb25mbGljdCA9IHRydWU7XG4gIGh1bmsubGluZXMucHVzaCh7XG4gICAgY29uZmxpY3Q6IHRydWUsXG4gICAgbWluZTogbWluZSxcbiAgICB0aGVpcnM6IHRoZWlyXG4gIH0pO1xufVxuXG5mdW5jdGlvbiBpbnNlcnRMZWFkaW5nKGh1bmssIGluc2VydCwgdGhlaXIpIHtcbiAgd2hpbGUgKGluc2VydC5vZmZzZXQgPCB0aGVpci5vZmZzZXQgJiYgaW5zZXJ0LmluZGV4IDwgaW5zZXJ0LmxpbmVzLmxlbmd0aCkge1xuICAgIHZhciBsaW5lID0gaW5zZXJ0LmxpbmVzW2luc2VydC5pbmRleCsrXTtcbiAgICBodW5rLmxpbmVzLnB1c2gobGluZSk7XG4gICAgaW5zZXJ0Lm9mZnNldCsrO1xuICB9XG59XG5cbmZ1bmN0aW9uIGluc2VydFRyYWlsaW5nKGh1bmssIGluc2VydCkge1xuICB3aGlsZSAoaW5zZXJ0LmluZGV4IDwgaW5zZXJ0LmxpbmVzLmxlbmd0aCkge1xuICAgIHZhciBsaW5lID0gaW5zZXJ0LmxpbmVzW2luc2VydC5pbmRleCsrXTtcbiAgICBodW5rLmxpbmVzLnB1c2gobGluZSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gY29sbGVjdENoYW5nZShzdGF0ZSkge1xuICB2YXIgcmV0ID0gW10sXG4gICAgICBvcGVyYXRpb24gPSBzdGF0ZS5saW5lc1tzdGF0ZS5pbmRleF1bMF07XG5cbiAgd2hpbGUgKHN0YXRlLmluZGV4IDwgc3RhdGUubGluZXMubGVuZ3RoKSB7XG4gICAgdmFyIGxpbmUgPSBzdGF0ZS5saW5lc1tzdGF0ZS5pbmRleF07IC8vIEdyb3VwIGFkZGl0aW9ucyB0aGF0IGFyZSBpbW1lZGlhdGVseSBhZnRlciBzdWJ0cmFjdGlvbnMgYW5kIHRyZWF0IHRoZW0gYXMgb25lIFwiYXRvbWljXCIgbW9kaWZ5IGNoYW5nZS5cblxuICAgIGlmIChvcGVyYXRpb24gPT09ICctJyAmJiBsaW5lWzBdID09PSAnKycpIHtcbiAgICAgIG9wZXJhdGlvbiA9ICcrJztcbiAgICB9XG5cbiAgICBpZiAob3BlcmF0aW9uID09PSBsaW5lWzBdKSB7XG4gICAgICByZXQucHVzaChsaW5lKTtcbiAgICAgIHN0YXRlLmluZGV4Kys7XG4gICAgfSBlbHNlIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiByZXQ7XG59XG5cbmZ1bmN0aW9uIGNvbGxlY3RDb250ZXh0KHN0YXRlLCBtYXRjaENoYW5nZXMpIHtcbiAgdmFyIGNoYW5nZXMgPSBbXSxcbiAgICAgIG1lcmdlZCA9IFtdLFxuICAgICAgbWF0Y2hJbmRleCA9IDAsXG4gICAgICBjb250ZXh0Q2hhbmdlcyA9IGZhbHNlLFxuICAgICAgY29uZmxpY3RlZCA9IGZhbHNlO1xuXG4gIHdoaWxlIChtYXRjaEluZGV4IDwgbWF0Y2hDaGFuZ2VzLmxlbmd0aCAmJiBzdGF0ZS5pbmRleCA8IHN0YXRlLmxpbmVzLmxlbmd0aCkge1xuICAgIHZhciBjaGFuZ2UgPSBzdGF0ZS5saW5lc1tzdGF0ZS5pbmRleF0sXG4gICAgICAgIG1hdGNoID0gbWF0Y2hDaGFuZ2VzW21hdGNoSW5kZXhdOyAvLyBPbmNlIHdlJ3ZlIGhpdCBvdXIgYWRkLCB0aGVuIHdlIGFyZSBkb25lXG5cbiAgICBpZiAobWF0Y2hbMF0gPT09ICcrJykge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgY29udGV4dENoYW5nZXMgPSBjb250ZXh0Q2hhbmdlcyB8fCBjaGFuZ2VbMF0gIT09ICcgJztcbiAgICBtZXJnZWQucHVzaChtYXRjaCk7XG4gICAgbWF0Y2hJbmRleCsrOyAvLyBDb25zdW1lIGFueSBhZGRpdGlvbnMgaW4gdGhlIG90aGVyIGJsb2NrIGFzIGEgY29uZmxpY3QgdG8gYXR0ZW1wdFxuICAgIC8vIHRvIHB1bGwgaW4gdGhlIHJlbWFpbmluZyBjb250ZXh0IGFmdGVyIHRoaXNcblxuICAgIGlmIChjaGFuZ2VbMF0gPT09ICcrJykge1xuICAgICAgY29uZmxpY3RlZCA9IHRydWU7XG5cbiAgICAgIHdoaWxlIChjaGFuZ2VbMF0gPT09ICcrJykge1xuICAgICAgICBjaGFuZ2VzLnB1c2goY2hhbmdlKTtcbiAgICAgICAgY2hhbmdlID0gc3RhdGUubGluZXNbKytzdGF0ZS5pbmRleF07XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKG1hdGNoLnN1YnN0cigxKSA9PT0gY2hhbmdlLnN1YnN0cigxKSkge1xuICAgICAgY2hhbmdlcy5wdXNoKGNoYW5nZSk7XG4gICAgICBzdGF0ZS5pbmRleCsrO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25mbGljdGVkID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICBpZiAoKG1hdGNoQ2hhbmdlc1ttYXRjaEluZGV4XSB8fCAnJylbMF0gPT09ICcrJyAmJiBjb250ZXh0Q2hhbmdlcykge1xuICAgIGNvbmZsaWN0ZWQgPSB0cnVlO1xuICB9XG5cbiAgaWYgKGNvbmZsaWN0ZWQpIHtcbiAgICByZXR1cm4gY2hhbmdlcztcbiAgfVxuXG4gIHdoaWxlIChtYXRjaEluZGV4IDwgbWF0Y2hDaGFuZ2VzLmxlbmd0aCkge1xuICAgIG1lcmdlZC5wdXNoKG1hdGNoQ2hhbmdlc1ttYXRjaEluZGV4KytdKTtcbiAgfVxuXG4gIHJldHVybiB7XG4gICAgbWVyZ2VkOiBtZXJnZWQsXG4gICAgY2hhbmdlczogY2hhbmdlc1xuICB9O1xufVxuXG5mdW5jdGlvbiBhbGxSZW1vdmVzKGNoYW5nZXMpIHtcbiAgcmV0dXJuIGNoYW5nZXMucmVkdWNlKGZ1bmN0aW9uIChwcmV2LCBjaGFuZ2UpIHtcbiAgICByZXR1cm4gcHJldiAmJiBjaGFuZ2VbMF0gPT09ICctJztcbiAgfSwgdHJ1ZSk7XG59XG5cbmZ1bmN0aW9uIHNraXBSZW1vdmVTdXBlcnNldChzdGF0ZSwgcmVtb3ZlQ2hhbmdlcywgZGVsdGEpIHtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZWx0YTsgaSsrKSB7XG4gICAgdmFyIGNoYW5nZUNvbnRlbnQgPSByZW1vdmVDaGFuZ2VzW3JlbW92ZUNoYW5nZXMubGVuZ3RoIC0gZGVsdGEgKyBpXS5zdWJzdHIoMSk7XG5cbiAgICBpZiAoc3RhdGUubGluZXNbc3RhdGUuaW5kZXggKyBpXSAhPT0gJyAnICsgY2hhbmdlQ29udGVudCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRlLmluZGV4ICs9IGRlbHRhO1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gY2FsY09sZE5ld0xpbmVDb3VudChsaW5lcykge1xuICB2YXIgb2xkTGluZXMgPSAwO1xuICB2YXIgbmV3TGluZXMgPSAwO1xuICBsaW5lcy5mb3JFYWNoKGZ1bmN0aW9uIChsaW5lKSB7XG4gICAgaWYgKHR5cGVvZiBsaW5lICE9PSAnc3RyaW5nJykge1xuICAgICAgdmFyIG15Q291bnQgPSBjYWxjT2xkTmV3TGluZUNvdW50KGxpbmUubWluZSk7XG4gICAgICB2YXIgdGhlaXJDb3VudCA9IGNhbGNPbGROZXdMaW5lQ291bnQobGluZS50aGVpcnMpO1xuXG4gICAgICBpZiAob2xkTGluZXMgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICBpZiAobXlDb3VudC5vbGRMaW5lcyA9PT0gdGhlaXJDb3VudC5vbGRMaW5lcykge1xuICAgICAgICAgIG9sZExpbmVzICs9IG15Q291bnQub2xkTGluZXM7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb2xkTGluZXMgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKG5ld0xpbmVzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgaWYgKG15Q291bnQubmV3TGluZXMgPT09IHRoZWlyQ291bnQubmV3TGluZXMpIHtcbiAgICAgICAgICBuZXdMaW5lcyArPSBteUNvdW50Lm5ld0xpbmVzO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG5ld0xpbmVzID0gdW5kZWZpbmVkO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGlmIChuZXdMaW5lcyAhPT0gdW5kZWZpbmVkICYmIChsaW5lWzBdID09PSAnKycgfHwgbGluZVswXSA9PT0gJyAnKSkge1xuICAgICAgICBuZXdMaW5lcysrO1xuICAgICAgfVxuXG4gICAgICBpZiAob2xkTGluZXMgIT09IHVuZGVmaW5lZCAmJiAobGluZVswXSA9PT0gJy0nIHx8IGxpbmVbMF0gPT09ICcgJykpIHtcbiAgICAgICAgb2xkTGluZXMrKztcbiAgICAgIH1cbiAgICB9XG4gIH0pO1xuICByZXR1cm4ge1xuICAgIG9sZExpbmVzOiBvbGRMaW5lcyxcbiAgICBuZXdMaW5lczogbmV3TGluZXNcbiAgfTtcbn1cblxuLy8gU2VlOiBodHRwOi8vY29kZS5nb29nbGUuY29tL3AvZ29vZ2xlLWRpZmYtbWF0Y2gtcGF0Y2gvd2lraS9BUElcbmZ1bmN0aW9uIGNvbnZlcnRDaGFuZ2VzVG9ETVAoY2hhbmdlcykge1xuICB2YXIgcmV0ID0gW10sXG4gICAgICBjaGFuZ2UsXG4gICAgICBvcGVyYXRpb247XG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBjaGFuZ2VzLmxlbmd0aDsgaSsrKSB7XG4gICAgY2hhbmdlID0gY2hhbmdlc1tpXTtcblxuICAgIGlmIChjaGFuZ2UuYWRkZWQpIHtcbiAgICAgIG9wZXJhdGlvbiA9IDE7XG4gICAgfSBlbHNlIGlmIChjaGFuZ2UucmVtb3ZlZCkge1xuICAgICAgb3BlcmF0aW9uID0gLTE7XG4gICAgfSBlbHNlIHtcbiAgICAgIG9wZXJhdGlvbiA9IDA7XG4gICAgfVxuXG4gICAgcmV0LnB1c2goW29wZXJhdGlvbiwgY2hhbmdlLnZhbHVlXSk7XG4gIH1cblxuICByZXR1cm4gcmV0O1xufVxuXG5mdW5jdGlvbiBjb252ZXJ0Q2hhbmdlc1RvWE1MKGNoYW5nZXMpIHtcbiAgdmFyIHJldCA9IFtdO1xuXG4gIGZvciAodmFyIGkgPSAwOyBpIDwgY2hhbmdlcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBjaGFuZ2UgPSBjaGFuZ2VzW2ldO1xuXG4gICAgaWYgKGNoYW5nZS5hZGRlZCkge1xuICAgICAgcmV0LnB1c2goJzxpbnM+Jyk7XG4gICAgfSBlbHNlIGlmIChjaGFuZ2UucmVtb3ZlZCkge1xuICAgICAgcmV0LnB1c2goJzxkZWw+Jyk7XG4gICAgfVxuXG4gICAgcmV0LnB1c2goZXNjYXBlSFRNTChjaGFuZ2UudmFsdWUpKTtcblxuICAgIGlmIChjaGFuZ2UuYWRkZWQpIHtcbiAgICAgIHJldC5wdXNoKCc8L2lucz4nKTtcbiAgICB9IGVsc2UgaWYgKGNoYW5nZS5yZW1vdmVkKSB7XG4gICAgICByZXQucHVzaCgnPC9kZWw+Jyk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHJldC5qb2luKCcnKTtcbn1cblxuZnVuY3Rpb24gZXNjYXBlSFRNTChzKSB7XG4gIHZhciBuID0gcztcbiAgbiA9IG4ucmVwbGFjZSgvJi9nLCAnJmFtcDsnKTtcbiAgbiA9IG4ucmVwbGFjZSgvPC9nLCAnJmx0OycpO1xuICBuID0gbi5yZXBsYWNlKC8+L2csICcmZ3Q7Jyk7XG4gIG4gPSBuLnJlcGxhY2UoL1wiL2csICcmcXVvdDsnKTtcbiAgcmV0dXJuIG47XG59XG5cbmV4cG9ydCB7IERpZmYsIGFwcGx5UGF0Y2gsIGFwcGx5UGF0Y2hlcywgY2Fub25pY2FsaXplLCBjb252ZXJ0Q2hhbmdlc1RvRE1QLCBjb252ZXJ0Q2hhbmdlc1RvWE1MLCBjcmVhdGVQYXRjaCwgY3JlYXRlVHdvRmlsZXNQYXRjaCwgZGlmZkFycmF5cywgZGlmZkNoYXJzLCBkaWZmQ3NzLCBkaWZmSnNvbiwgZGlmZkxpbmVzLCBkaWZmU2VudGVuY2VzLCBkaWZmVHJpbW1lZExpbmVzLCBkaWZmV29yZHMsIGRpZmZXb3Jkc1dpdGhTcGFjZSwgbWVyZ2UsIHBhcnNlUGF0Y2gsIHN0cnVjdHVyZWRQYXRjaCB9O1xuIiwiaW1wb3J0IGtsZXVyIGZyb20gJ2tsZXVyJztcbmltcG9ydCAqIGFzIGRpZmYgZnJvbSAnZGlmZic7XG5cbmNvbnN0IGNvbG9ycyA9IHtcblx0Jy0tJzoga2xldXIucmVkLFxuXHQnwrfCtyc6IGtsZXVyLmdyZXksXG5cdCcrKyc6IGtsZXVyLmdyZWVuLFxufTtcblxuY29uc3QgVElUTEUgPSBrbGV1ci5kaW0oKS5pdGFsaWM7XG5jb25zdCBUQUI9a2xldXIuZGltKCfihpInKSwgU1BBQ0U9a2xldXIuZGltKCfCtycpLCBOTD1rbGV1ci5kaW0oJ+KGtScpO1xuY29uc3QgTE9HID0gKHN5bSwgc3RyKSA9PiBjb2xvcnNbc3ltXShzeW0gKyBQUkVUVFkoc3RyKSkgKyAnXFxuJztcbmNvbnN0IExJTkUgPSAobnVtLCB4KSA9PiBrbGV1ci5kaW0oJ0wnICsgU3RyaW5nKG51bSkucGFkU3RhcnQoeCwgJzAnKSArICcgJyk7XG5jb25zdCBQUkVUVFkgPSBzdHIgPT4gc3RyLnJlcGxhY2UoL1sgXS9nLCBTUEFDRSkucmVwbGFjZSgvXFx0L2csIFRBQikucmVwbGFjZSgvKFxccj9cXG4pL2csIE5MKTtcblxuZnVuY3Rpb24gbGluZShvYmosIHByZXYsIHBhZCkge1xuXHRsZXQgY2hhciA9IG9iai5yZW1vdmVkID8gJy0tJyA6IG9iai5hZGRlZCA/ICcrKycgOiAnwrfCtyc7XG5cdGxldCBhcnIgPSBvYmoudmFsdWUucmVwbGFjZSgvXFxyP1xcbiQvLCAnJykuc3BsaXQoJ1xcbicpO1xuXHRsZXQgaT0wLCB0bXAsIG91dD0nJztcblxuXHRpZiAob2JqLmFkZGVkKSBvdXQgKz0gY29sb3JzW2NoYXJdKCkudW5kZXJsaW5lKFRJVExFKCdFeHBlY3RlZDonKSkgKyAnXFxuJztcblx0ZWxzZSBpZiAob2JqLnJlbW92ZWQpIG91dCArPSBjb2xvcnNbY2hhcl0oKS51bmRlcmxpbmUoVElUTEUoJ0FjdHVhbDonKSkgKyAnXFxuJztcblxuXHRmb3IgKDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuXHRcdHRtcCA9IGFycltpXTtcblx0XHRpZiAodG1wICE9IG51bGwpIHtcblx0XHRcdGlmIChwcmV2KSBvdXQgKz0gTElORShwcmV2ICsgaSwgcGFkKTtcblx0XHRcdG91dCArPSBMT0coY2hhciwgdG1wIHx8ICdcXG4nKTtcblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gb3V0O1xufVxuXG4vLyBUT0RPOiB3YW50IGJldHRlciBkaWZmaW5nXG4vL34+IGNvbXBsZXggaXRlbXMgYmFpbCBvdXRyaWdodFxuZXhwb3J0IGZ1bmN0aW9uIGFycmF5cyhpbnB1dCwgZXhwZWN0KSB7XG5cdGxldCBhcnIgPSBkaWZmLmRpZmZBcnJheXMoaW5wdXQsIGV4cGVjdCk7XG5cdGxldCBpPTAsIGo9MCwgaz0wLCB0bXAsIHZhbCwgY2hhciwgaXNPYmosIHN0cjtcblx0bGV0IG91dCA9IExPRygnwrfCtycsICdbJyk7XG5cblx0Zm9yICg7IGkgPCBhcnIubGVuZ3RoOyBpKyspIHtcblx0XHRjaGFyID0gKHRtcCA9IGFycltpXSkucmVtb3ZlZCA/ICctLScgOiB0bXAuYWRkZWQgPyAnKysnIDogJ8K3wrcnO1xuXG5cdFx0aWYgKHRtcC5hZGRlZCkge1xuXHRcdFx0b3V0ICs9IGNvbG9yc1tjaGFyXSgpLnVuZGVybGluZShUSVRMRSgnRXhwZWN0ZWQ6JykpICsgJ1xcbic7XG5cdFx0fSBlbHNlIGlmICh0bXAucmVtb3ZlZCkge1xuXHRcdFx0b3V0ICs9IGNvbG9yc1tjaGFyXSgpLnVuZGVybGluZShUSVRMRSgnQWN0dWFsOicpKSArICdcXG4nO1xuXHRcdH1cblxuXHRcdGZvciAoaj0wOyBqIDwgdG1wLnZhbHVlLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRpc09iaiA9ICh0bXAudmFsdWVbal0gJiYgdHlwZW9mIHRtcC52YWx1ZVtqXSA9PT0gJ29iamVjdCcpO1xuXHRcdFx0dmFsID0gc3RyaW5naWZ5KHRtcC52YWx1ZVtqXSkuc3BsaXQoL1xccj9cXG4vZyk7XG5cdFx0XHRmb3IgKGs9MDsgayA8IHZhbC5sZW5ndGg7KSB7XG5cdFx0XHRcdHN0ciA9ICcgICcgKyB2YWxbaysrXSArIChpc09iaiA/ICcnIDogJywnKTtcblx0XHRcdFx0aWYgKGlzT2JqICYmIGsgPT09IHZhbC5sZW5ndGggJiYgKGogKyAxKSA8IHRtcC52YWx1ZS5sZW5ndGgpIHN0ciArPSAnLCc7XG5cdFx0XHRcdG91dCArPSBMT0coY2hhciwgc3RyKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gb3V0ICsgTE9HKCfCt8K3JywgJ10nKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGxpbmVzKGlucHV0LCBleHBlY3QsIGxpbmVudW0gPSAwKSB7XG5cdGxldCBpPTAsIHRtcCwgb3V0cHV0PScnO1xuXHRsZXQgYXJyID0gZGlmZi5kaWZmTGluZXMoaW5wdXQsIGV4cGVjdCk7XG5cdGxldCBwYWQgPSBTdHJpbmcoZXhwZWN0LnNwbGl0KC9cXHI/XFxuL2cpLmxlbmd0aCAtIGxpbmVudW0pLmxlbmd0aDtcblxuXHRmb3IgKDsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuXHRcdG91dHB1dCArPSBsaW5lKHRtcCA9IGFycltpXSwgbGluZW51bSwgcGFkKTtcblx0XHRpZiAobGluZW51bSAmJiAhdG1wLnJlbW92ZWQpIGxpbmVudW0gKz0gdG1wLmNvdW50O1xuXHR9XG5cblx0cmV0dXJuIG91dHB1dDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoYXJzKGlucHV0LCBleHBlY3QpIHtcblx0bGV0IGFyciA9IGRpZmYuZGlmZkNoYXJzKGlucHV0LCBleHBlY3QpO1xuXHRsZXQgaT0wLCBvdXRwdXQ9JycsIHRtcDtcblxuXHRsZXQgbDEgPSBpbnB1dC5sZW5ndGg7XG5cdGxldCBsMiA9IGV4cGVjdC5sZW5ndGg7XG5cblx0bGV0IHAxID0gUFJFVFRZKGlucHV0KTtcblx0bGV0IHAyID0gUFJFVFRZKGV4cGVjdCk7XG5cblx0dG1wID0gYXJyW2ldO1xuXG5cdGlmIChsMSA9PT0gbDIpIHtcblx0XHQvLyBubyBsZW5ndGggb2Zmc2V0c1xuXHR9IGVsc2UgaWYgKHRtcC5yZW1vdmVkICYmIGFycltpICsgMV0pIHtcblx0XHRsZXQgZGVsID0gdG1wLmNvdW50IC0gYXJyW2kgKyAxXS5jb3VudDtcblx0XHRpZiAoZGVsID09IDApIHtcblx0XHRcdC8vIHdhc2h+XG5cdFx0fSBlbHNlIGlmIChkZWwgPiAwKSB7XG5cdFx0XHRleHBlY3QgPSAnICcucmVwZWF0KGRlbCkgKyBleHBlY3Q7XG5cdFx0XHRwMiA9ICcgJy5yZXBlYXQoZGVsKSArIHAyO1xuXHRcdFx0bDIgKz0gZGVsO1xuXHRcdH0gZWxzZSBpZiAoZGVsIDwgMCkge1xuXHRcdFx0aW5wdXQgPSAnICcucmVwZWF0KC1kZWwpICsgaW5wdXQ7XG5cdFx0XHRwMSA9ICcgJy5yZXBlYXQoLWRlbCkgKyBwMTtcblx0XHRcdGwxICs9IC1kZWw7XG5cdFx0fVxuXHR9XG5cblx0b3V0cHV0ICs9IGRpcmVjdChwMSwgcDIsIGwxLCBsMik7XG5cblx0aWYgKGwxID09PSBsMikge1xuXHRcdGZvciAodG1wPScgICc7IGkgPCBsMTsgaSsrKSB7XG5cdFx0XHR0bXAgKz0gaW5wdXRbaV0gPT09IGV4cGVjdFtpXSA/ICcgJyA6ICdeJztcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0Zm9yICh0bXA9JyAgJzsgaSA8IGFyci5sZW5ndGg7IGkrKykge1xuXHRcdFx0dG1wICs9ICgoYXJyW2ldLmFkZGVkIHx8IGFycltpXS5yZW1vdmVkKSA/ICdeJyA6ICcgJykucmVwZWF0KE1hdGgubWF4KGFycltpXS5jb3VudCwgMCkpO1xuXHRcdFx0aWYgKGkgKyAxIDwgYXJyLmxlbmd0aCAmJiAoKGFycltpXS5hZGRlZCAmJiBhcnJbaSsxXS5yZW1vdmVkKSB8fCAoYXJyW2ldLnJlbW92ZWQgJiYgYXJyW2krMV0uYWRkZWQpKSkge1xuXHRcdFx0XHRhcnJbaSArIDFdLmNvdW50IC09IGFycltpXS5jb3VudDtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRyZXR1cm4gb3V0cHV0ICsga2xldXIucmVkKHRtcCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkaXJlY3QoaW5wdXQsIGV4cGVjdCwgbGVuQSA9IFN0cmluZyhpbnB1dCkubGVuZ3RoLCBsZW5CID0gU3RyaW5nKGV4cGVjdCkubGVuZ3RoKSB7XG5cdGxldCBndXR0ZXIgPSA0O1xuXHRsZXQgbGVuQyA9IE1hdGgubWF4KGxlbkEsIGxlbkIpO1xuXHRsZXQgdHlwZUE9dHlwZW9mIGlucHV0LCB0eXBlQj10eXBlb2YgZXhwZWN0O1xuXG5cdGlmICh0eXBlQSAhPT0gdHlwZUIpIHtcblx0XHRndXR0ZXIgPSAyO1xuXG5cdFx0bGV0IGRlbEEgPSBndXR0ZXIgKyBsZW5DIC0gbGVuQTtcblx0XHRsZXQgZGVsQiA9IGd1dHRlciArIGxlbkMgLSBsZW5CO1xuXG5cdFx0aW5wdXQgKz0gJyAnLnJlcGVhdChkZWxBKSArIGtsZXVyLmRpbShgWyR7dHlwZUF9XWApO1xuXHRcdGV4cGVjdCArPSAnICcucmVwZWF0KGRlbEIpICsga2xldXIuZGltKGBbJHt0eXBlQn1dYCk7XG5cblx0XHRsZW5BICs9IGRlbEEgKyB0eXBlQS5sZW5ndGggKyAyO1xuXHRcdGxlbkIgKz0gZGVsQiArIHR5cGVCLmxlbmd0aCArIDI7XG5cdFx0bGVuQyA9IE1hdGgubWF4KGxlbkEsIGxlbkIpO1xuXHR9XG5cblx0bGV0IG91dHB1dCA9IGNvbG9yc1snKysnXSgnKysnICsgZXhwZWN0ICsgJyAnLnJlcGVhdChndXR0ZXIgKyBsZW5DIC0gbGVuQikgKyBUSVRMRSgnKEV4cGVjdGVkKScpKSArICdcXG4nO1xuXHRyZXR1cm4gb3V0cHV0ICsgY29sb3JzWyctLSddKCctLScgKyBpbnB1dCArICcgJy5yZXBlYXQoZ3V0dGVyICsgbGVuQyAtIGxlbkEpICsgVElUTEUoJyhBY3R1YWwpJykpICsgJ1xcbic7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzb3J0KGlucHV0LCBleHBlY3QpIHtcblx0dmFyIGssIGk9MCwgdG1wLCBpc0FyciA9IEFycmF5LmlzQXJyYXkoaW5wdXQpO1xuXHR2YXIga2V5cz1bXSwgb3V0PWlzQXJyID8gQXJyYXkoaW5wdXQubGVuZ3RoKSA6IHt9O1xuXG5cdGlmIChpc0Fycikge1xuXHRcdGZvciAoaT0wOyBpIDwgb3V0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR0bXAgPSBpbnB1dFtpXTtcblx0XHRcdGlmICghdG1wIHx8IHR5cGVvZiB0bXAgIT09ICdvYmplY3QnKSBvdXRbaV0gPSB0bXA7XG5cdFx0XHRlbHNlIG91dFtpXSA9IHNvcnQodG1wLCBleHBlY3RbaV0pOyAvLyBtaWdodCBub3QgYmUgcmlnaHRcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0Zm9yIChrIGluIGV4cGVjdClcblx0XHRcdGtleXMucHVzaChrKTtcblxuXHRcdGZvciAoOyBpIDwga2V5cy5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChpbnB1dCwgayA9IGtleXNbaV0pKSB7XG5cdFx0XHRcdGlmICghKHRtcCA9IGlucHV0W2tdKSB8fCB0eXBlb2YgdG1wICE9PSAnb2JqZWN0Jykgb3V0W2tdID0gdG1wO1xuXHRcdFx0XHRlbHNlIG91dFtrXSA9IHNvcnQodG1wLCBleHBlY3Rba10pO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdGZvciAoayBpbiBpbnB1dCkge1xuXHRcdFx0aWYgKCFvdXQuaGFzT3duUHJvcGVydHkoaykpIHtcblx0XHRcdFx0b3V0W2tdID0gaW5wdXRba107IC8vIGV4cGVjdCBkaWRudCBoYXZlXG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0cmV0dXJuIG91dDtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNpcmN1bGFyKCkge1xuXHR2YXIgY2FjaGUgPSBuZXcgU2V0O1xuXHRyZXR1cm4gZnVuY3Rpb24gcHJpbnQoa2V5LCB2YWwpIHtcblx0XHRpZiAodmFsID09PSB2b2lkIDApIHJldHVybiAnW19fVk9JRF9fXSc7XG5cdFx0aWYgKHR5cGVvZiB2YWwgPT09ICdudW1iZXInICYmIHZhbCAhPT0gdmFsKSByZXR1cm4gJ1tfX05BTl9fXSc7XG5cdFx0aWYgKCF2YWwgfHwgdHlwZW9mIHZhbCAhPT0gJ29iamVjdCcpIHJldHVybiB2YWw7XG5cdFx0aWYgKGNhY2hlLmhhcyh2YWwpKSByZXR1cm4gJ1tDaXJjdWxhcl0nO1xuXHRcdGNhY2hlLmFkZCh2YWwpOyByZXR1cm4gdmFsO1xuXHR9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBzdHJpbmdpZnkoaW5wdXQpIHtcblx0cmV0dXJuIEpTT04uc3RyaW5naWZ5KGlucHV0LCBjaXJjdWxhcigpLCAyKS5yZXBsYWNlKC9cIlxcW19fTkFOX19cXF1cIi9nLCAnTmFOJykucmVwbGFjZSgvXCJcXFtfX1ZPSURfX1xcXVwiL2csICd1bmRlZmluZWQnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNvbXBhcmUoaW5wdXQsIGV4cGVjdCkge1xuXHRpZiAoQXJyYXkuaXNBcnJheShleHBlY3QpKSByZXR1cm4gYXJyYXlzKGlucHV0LCBleHBlY3QpO1xuXHRpZiAoZXhwZWN0IGluc3RhbmNlb2YgUmVnRXhwKSByZXR1cm4gY2hhcnMoJycraW5wdXQsICcnK2V4cGVjdCk7XG5cblx0aWYgKGV4cGVjdCAmJiB0eXBlb2YgZXhwZWN0ID09ICdvYmplY3QnKSB7XG5cdFx0aW5wdXQgPSBzdHJpbmdpZnkoc29ydChpbnB1dCwgZXhwZWN0KSk7XG5cdFx0ZXhwZWN0ID0gc3RyaW5naWZ5KGV4cGVjdCk7XG5cdH1cblxuXHRsZXQgaXNBID0gdHlwZW9mIGlucHV0ID09ICdzdHJpbmcnO1xuXHRsZXQgaXNCID0gdHlwZW9mIGV4cGVjdCA9PSAnc3RyaW5nJztcblxuXHRpZiAoaXNBICYmIC9cXHI/XFxuLy50ZXN0KGlucHV0KSkgcmV0dXJuIGxpbmVzKGlucHV0LCAnJytleHBlY3QpO1xuXHRpZiAoaXNCICYmIC9cXHI/XFxuLy50ZXN0KGV4cGVjdCkpIHJldHVybiBsaW5lcygnJytpbnB1dCwgZXhwZWN0KTtcblx0aWYgKGlzQSAmJiBpc0IpIHJldHVybiBjaGFycyhpbnB1dCwgZXhwZWN0KTtcblxuXHRyZXR1cm4gZGlyZWN0KGlucHV0LCBleHBlY3QpO1xufVxuIiwiaW1wb3J0IHsgZGVxdWFswqB9IGZyb20gJ2RlcXVhbCc7XG5pbXBvcnQgeyBjb21wYXJlLCBsaW5lcyB9IGZyb20gJ3V2dS9kaWZmJztcblxuZnVuY3Rpb24gZGVkZW50KHN0cikge1xuXHRsZXQgYXJyID0gc3RyLm1hdGNoKC9eWyBcXHRdKig/PVxcUykvZ20pO1xuXHRsZXQgbWluID0gISFhcnIgJiYgTWF0aC5taW4oLi4uYXJyLm1hcCh4ID0+IHgubGVuZ3RoKSk7XG5cdHJldHVybiAoIWFyciB8fCAhbWluKSA/IHN0ciA6IHN0ci5yZXBsYWNlKG5ldyBSZWdFeHAoYF5bIFxcXFx0XXske21pbn19YCwgJ2dtJyksICcnKTtcbn1cblxuZXhwb3J0IGNsYXNzIEFzc2VydGlvbiBleHRlbmRzIEVycm9yIHtcblx0Y29uc3RydWN0b3Iob3B0cz17fSkge1xuXHRcdHN1cGVyKG9wdHMubWVzc2FnZSk7XG5cdFx0dGhpcy5uYW1lID0gJ0Fzc2VydGlvbic7XG5cdFx0dGhpcy5jb2RlID0gJ0VSUl9BU1NFUlRJT04nO1xuXHRcdGlmIChFcnJvci5jYXB0dXJlU3RhY2tUcmFjZSkge1xuXHRcdFx0RXJyb3IuY2FwdHVyZVN0YWNrVHJhY2UodGhpcywgdGhpcy5jb25zdHJ1Y3Rvcik7XG5cdFx0fVxuXHRcdHRoaXMuZGV0YWlscyA9IG9wdHMuZGV0YWlscyB8fCBmYWxzZTtcblx0XHR0aGlzLmdlbmVyYXRlZCA9ICEhb3B0cy5nZW5lcmF0ZWQ7XG5cdFx0dGhpcy5vcGVyYXRvciA9IG9wdHMub3BlcmF0b3I7XG5cdFx0dGhpcy5leHBlY3RzID0gb3B0cy5leHBlY3RzO1xuXHRcdHRoaXMuYWN0dWFsID0gb3B0cy5hY3R1YWw7XG5cdH1cbn1cblxuZnVuY3Rpb24gYXNzZXJ0KGJvb2wsIGFjdHVhbCwgZXhwZWN0cywgb3BlcmF0b3IsIGRldGFpbGVyLCBiYWNrdXAsIG1zZykge1xuXHRpZiAoYm9vbCkgcmV0dXJuO1xuXHRsZXQgbWVzc2FnZSA9IG1zZyB8fCBiYWNrdXA7XG5cdGlmIChtc2cgaW5zdGFuY2VvZiBFcnJvcikgdGhyb3cgbXNnO1xuXHRsZXQgZGV0YWlscyA9IGRldGFpbGVyICYmIGRldGFpbGVyKGFjdHVhbCwgZXhwZWN0cyk7XG5cdHRocm93IG5ldyBBc3NlcnRpb24oeyBhY3R1YWwsIGV4cGVjdHMsIG9wZXJhdG9yLCBtZXNzYWdlLCBkZXRhaWxzLCBnZW5lcmF0ZWQ6ICFtc2cgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvayh2YWwsIG1zZykge1xuXHRhc3NlcnQoISF2YWwsIGZhbHNlLCB0cnVlLCAnb2snLCBmYWxzZSwgJ0V4cGVjdGVkIHZhbHVlIHRvIGJlIHRydXRoeScsIG1zZyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpcyh2YWwsIGV4cCwgbXNnKSB7XG5cdGFzc2VydCh2YWwgPT09IGV4cCwgdmFsLCBleHAsICdpcycsIGNvbXBhcmUsICdFeHBlY3RlZCB2YWx1ZXMgdG8gYmUgc3RyaWN0bHkgZXF1YWw6JywgbXNnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGVxdWFsKHZhbCwgZXhwLCBtc2cpIHtcblx0YXNzZXJ0KGRlcXVhbCh2YWwsIGV4cCksIHZhbCwgZXhwLCAnZXF1YWwnLCBjb21wYXJlLCAnRXhwZWN0ZWQgdmFsdWVzIHRvIGJlIGRlZXBseSBlcXVhbDonLCBtc2cpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdW5yZWFjaGFibGUobXNnKSB7XG5cdGFzc2VydChmYWxzZSwgdHJ1ZSwgZmFsc2UsICd1bnJlYWNoYWJsZScsIGZhbHNlLCAnRXhwZWN0ZWQgbm90IHRvIGJlIHJlYWNoZWQhJywgbXNnKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHR5cGUodmFsLCBleHAsIG1zZykge1xuXHRsZXQgdG1wID0gdHlwZW9mIHZhbDtcblx0YXNzZXJ0KHRtcCA9PT0gZXhwLCB0bXAsIGV4cCwgJ3R5cGUnLCBmYWxzZSwgYEV4cGVjdGVkIFwiJHt0bXB9XCIgdG8gYmUgXCIke2V4cH1cImAsIG1zZyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpbnN0YW5jZSh2YWwsIGV4cCwgbXNnKSB7XG5cdGxldCBuYW1lID0gJ2AnICsgKGV4cC5uYW1lIHx8IGV4cC5jb25zdHJ1Y3Rvci5uYW1lKSArICdgJztcblx0YXNzZXJ0KHZhbCBpbnN0YW5jZW9mIGV4cCwgdmFsLCBleHAsICdpbnN0YW5jZScsIGZhbHNlLCBgRXhwZWN0ZWQgdmFsdWUgdG8gYmUgYW4gaW5zdGFuY2Ugb2YgJHtuYW1lfWAsIG1zZyk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBtYXRjaCh2YWwsIGV4cCwgbXNnKSB7XG5cdGlmICh0eXBlb2YgZXhwID09PSAnc3RyaW5nJykge1xuXHRcdGFzc2VydCh2YWwuaW5jbHVkZXMoZXhwKSwgdmFsLCBleHAsICdtYXRjaCcsIGZhbHNlLCBgRXhwZWN0ZWQgdmFsdWUgdG8gaW5jbHVkZSBcIiR7ZXhwfVwiIHN1YnN0cmluZ2AsIG1zZyk7XG5cdH0gZWxzZSB7XG5cdFx0bGV0IHRtcCA9ICdgJyArIFN0cmluZyhleHApICsgJ2AnO1xuXHRcdGFzc2VydChleHAudGVzdCh2YWwpLCB2YWwsIGV4cCwgJ21hdGNoJywgZmFsc2UsIGBFeHBlY3RlZCB2YWx1ZSB0byBtYXRjaCAke3RtcH0gcGF0dGVybmAsIG1zZyk7XG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHNuYXBzaG90KHZhbCwgZXhwLCBtc2cpIHtcblx0dmFsPWRlZGVudCh2YWwpOyBleHA9ZGVkZW50KGV4cCk7XG5cdGFzc2VydCh2YWwgPT09IGV4cCwgdmFsLCBleHAsICdzbmFwc2hvdCcsIGxpbmVzLCAnRXhwZWN0ZWQgdmFsdWUgdG8gbWF0Y2ggc25hcHNob3Q6JywgbXNnKTtcbn1cblxuY29uc3QgbGluZU51bXMgPSAoeCwgeSkgPT4gbGluZXMoeCwgeSwgMSk7XG5leHBvcnQgZnVuY3Rpb24gZml4dHVyZSh2YWwsIGV4cCwgbXNnKSB7XG5cdHZhbD1kZWRlbnQodmFsKTsgZXhwPWRlZGVudChleHApO1xuXHRhc3NlcnQodmFsID09PSBleHAsIHZhbCwgZXhwLCAnZml4dHVyZScsIGxpbmVOdW1zLCAnRXhwZWN0ZWQgdmFsdWUgdG8gbWF0Y2ggZml4dHVyZTonLCBtc2cpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gdGhyb3dzKGJsaywgZXhwLCBtc2cpIHtcblx0aWYgKCFtc2cgJiYgdHlwZW9mIGV4cCA9PT0gJ3N0cmluZycpIHtcblx0XHRtc2cgPSBleHA7IGV4cCA9IG51bGw7XG5cdH1cblxuXHR0cnkge1xuXHRcdGJsaygpO1xuXHRcdGFzc2VydChmYWxzZSwgZmFsc2UsIHRydWUsICd0aHJvd3MnLCBmYWxzZSwgJ0V4cGVjdGVkIGZ1bmN0aW9uIHRvIHRocm93JywgbXNnKTtcblx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0aWYgKGVyciBpbnN0YW5jZW9mIEFzc2VydGlvbikgdGhyb3cgZXJyO1xuXG5cdFx0aWYgKHR5cGVvZiBleHAgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdGFzc2VydChleHAoZXJyKSwgZmFsc2UsIHRydWUsICd0aHJvd3MnLCBmYWxzZSwgJ0V4cGVjdGVkIGZ1bmN0aW9uIHRvIHRocm93IG1hdGNoaW5nIGV4Y2VwdGlvbicsIG1zZyk7XG5cdFx0fSBlbHNlIGlmIChleHAgaW5zdGFuY2VvZiBSZWdFeHApIHtcblx0XHRcdGxldCB0bXAgPSAnYCcgKyBTdHJpbmcoZXhwKSArICdgJztcblx0XHRcdGFzc2VydChleHAudGVzdChlcnIubWVzc2FnZSksIGZhbHNlLCB0cnVlLCAndGhyb3dzJywgZmFsc2UsIGBFeHBlY3RlZCBmdW5jdGlvbiB0byB0aHJvdyBleGNlcHRpb24gbWF0Y2hpbmcgJHt0bXB9IHBhdHRlcm5gLCBtc2cpO1xuXHRcdH1cblx0fVxufVxuXG4vLyAtLS1cblxuZXhwb3J0IGZ1bmN0aW9uIG5vdCh2YWwsIG1zZykge1xuXHRhc3NlcnQoIXZhbCwgdHJ1ZSwgZmFsc2UsICdub3QnLCBmYWxzZSwgJ0V4cGVjdGVkIHZhbHVlIHRvIGJlIGZhbHNleScsIG1zZyk7XG59XG5cbm5vdC5vayA9IG5vdDtcblxuaXMubm90ID0gZnVuY3Rpb24gKHZhbCwgZXhwLCBtc2cpIHtcblx0YXNzZXJ0KHZhbCAhPT0gZXhwLCB2YWwsIGV4cCwgJ2lzLm5vdCcsIGZhbHNlLCAnRXhwZWN0ZWQgdmFsdWVzIG5vdCB0byBiZSBzdHJpY3RseSBlcXVhbCcsIG1zZyk7XG59XG5cbm5vdC5lcXVhbCA9IGZ1bmN0aW9uICh2YWwsIGV4cCwgbXNnKSB7XG5cdGFzc2VydCghZGVxdWFsKHZhbCwgZXhwKSwgdmFsLCBleHAsICdub3QuZXF1YWwnLCBmYWxzZSwgJ0V4cGVjdGVkIHZhbHVlcyBub3QgdG8gYmUgZGVlcGx5IGVxdWFsJywgbXNnKTtcbn1cblxubm90LnR5cGUgPSBmdW5jdGlvbiAodmFsLCBleHAsIG1zZykge1xuXHRsZXQgdG1wID0gdHlwZW9mIHZhbDtcblx0YXNzZXJ0KHRtcCAhPT0gZXhwLCB0bXAsIGV4cCwgJ25vdC50eXBlJywgZmFsc2UsIGBFeHBlY3RlZCBcIiR7dG1wfVwiIG5vdCB0byBiZSBcIiR7ZXhwfVwiYCwgbXNnKTtcbn1cblxubm90Lmluc3RhbmNlID0gZnVuY3Rpb24gKHZhbCwgZXhwLCBtc2cpIHtcblx0bGV0IG5hbWUgPSAnYCcgKyAoZXhwLm5hbWUgfHwgZXhwLmNvbnN0cnVjdG9yLm5hbWUpICsgJ2AnO1xuXHRhc3NlcnQoISh2YWwgaW5zdGFuY2VvZiBleHApLCB2YWwsIGV4cCwgJ25vdC5pbnN0YW5jZScsIGZhbHNlLCBgRXhwZWN0ZWQgdmFsdWUgbm90IHRvIGJlIGFuIGluc3RhbmNlIG9mICR7bmFtZX1gLCBtc2cpO1xufVxuXG5ub3Quc25hcHNob3QgPSBmdW5jdGlvbiAodmFsLCBleHAsIG1zZykge1xuXHR2YWw9ZGVkZW50KHZhbCk7IGV4cD1kZWRlbnQoZXhwKTtcblx0YXNzZXJ0KHZhbCAhPT0gZXhwLCB2YWwsIGV4cCwgJ25vdC5zbmFwc2hvdCcsIGZhbHNlLCAnRXhwZWN0ZWQgdmFsdWUgbm90IHRvIG1hdGNoIHNuYXBzaG90JywgbXNnKTtcbn1cblxubm90LmZpeHR1cmUgPSBmdW5jdGlvbiAodmFsLCBleHAsIG1zZykge1xuXHR2YWw9ZGVkZW50KHZhbCk7IGV4cD1kZWRlbnQoZXhwKTtcblx0YXNzZXJ0KHZhbCAhPT0gZXhwLCB2YWwsIGV4cCwgJ25vdC5maXh0dXJlJywgZmFsc2UsICdFeHBlY3RlZCB2YWx1ZSBub3QgdG8gbWF0Y2ggZml4dHVyZScsIG1zZyk7XG59XG5cbm5vdC5tYXRjaCA9IGZ1bmN0aW9uICh2YWwsIGV4cCwgbXNnKSB7XG5cdGlmICh0eXBlb2YgZXhwID09PSAnc3RyaW5nJykge1xuXHRcdGFzc2VydCghdmFsLmluY2x1ZGVzKGV4cCksIHZhbCwgZXhwLCAnbm90Lm1hdGNoJywgZmFsc2UsIGBFeHBlY3RlZCB2YWx1ZSBub3QgdG8gaW5jbHVkZSBcIiR7ZXhwfVwiIHN1YnN0cmluZ2AsIG1zZyk7XG5cdH0gZWxzZSB7XG5cdFx0bGV0IHRtcCA9ICdgJyArIFN0cmluZyhleHApICsgJ2AnO1xuXHRcdGFzc2VydCghZXhwLnRlc3QodmFsKSwgdmFsLCBleHAsICdub3QubWF0Y2gnLCBmYWxzZSwgYEV4cGVjdGVkIHZhbHVlIG5vdCB0byBtYXRjaCAke3RtcH0gcGF0dGVybmAsIG1zZyk7XG5cdH1cbn1cblxubm90LnRocm93cyA9IGZ1bmN0aW9uIChibGssIGV4cCwgbXNnKSB7XG5cdGlmICghbXNnICYmIHR5cGVvZiBleHAgPT09ICdzdHJpbmcnKSB7XG5cdFx0bXNnID0gZXhwOyBleHAgPSBudWxsO1xuXHR9XG5cblx0dHJ5IHtcblx0XHRibGsoKTtcblx0fSBjYXRjaCAoZXJyKSB7XG5cdFx0aWYgKHR5cGVvZiBleHAgPT09ICdmdW5jdGlvbicpIHtcblx0XHRcdGFzc2VydCghZXhwKGVyciksIHRydWUsIGZhbHNlLCAnbm90LnRocm93cycsIGZhbHNlLCAnRXhwZWN0ZWQgZnVuY3Rpb24gbm90IHRvIHRocm93IG1hdGNoaW5nIGV4Y2VwdGlvbicsIG1zZyk7XG5cdFx0fSBlbHNlIGlmIChleHAgaW5zdGFuY2VvZiBSZWdFeHApIHtcblx0XHRcdGxldCB0bXAgPSAnYCcgKyBTdHJpbmcoZXhwKSArICdgJztcblx0XHRcdGFzc2VydCghZXhwLnRlc3QoZXJyLm1lc3NhZ2UpLCB0cnVlLCBmYWxzZSwgJ25vdC50aHJvd3MnLCBmYWxzZSwgYEV4cGVjdGVkIGZ1bmN0aW9uIG5vdCB0byB0aHJvdyBleGNlcHRpb24gbWF0Y2hpbmcgJHt0bXB9IHBhdHRlcm5gLCBtc2cpO1xuXHRcdH0gZWxzZSBpZiAoIWV4cCkge1xuXHRcdFx0YXNzZXJ0KGZhbHNlLCB0cnVlLCBmYWxzZSwgJ25vdC50aHJvd3MnLCBmYWxzZSwgJ0V4cGVjdGVkIGZ1bmN0aW9uIG5vdCB0byB0aHJvdycsIG1zZyk7XG5cdFx0fVxuXHR9XG59XG4iLCJpbXBvcnQgKiBhcyBhc3NlcnQgZnJvbSAndXZ1L2Fzc2VydCdcblxuZnVuY3Rpb24gdGVzdF9zbmFwKGFjdHVhbCwgZXhwZWN0ZWQsIHNuYXBfbmFtZSkge1xuICBsZXQgc3pfYWN0dWFsID0gSlNPTi5zdHJpbmdpZnkoYWN0dWFsLCBudWxsLCAyKVxuICBsZXQgc3pfZXhwZWN0ZWQgPSBKU09OLnN0cmluZ2lmeShleHBlY3RlZCwgbnVsbCwgMilcbiAgdHJ5IHtcbiAgICByZXR1cm4gYXNzZXJ0LnNuYXBzaG90KHN6X2FjdHVhbCwgc3pfZXhwZWN0ZWQpXG5cbiAgfSBjYXRjaCAoZXJyKSB7XG4gICAgY29uc29sZS5lcnJvcihlcnIuZGV0YWlscylcbiAgICBjb25zb2xlLmVycm9yKHtbc25hcF9uYW1lXTogYWN0dWFsfSlcbiAgICB0aHJvdyBlcnJcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gdGVzdF9wcm5nX2FsZyhuYW1lLCBwcm5nX2FsZywgc25hcCkge1xuICBpdChgJHtuYW1lfSBkaXJlY3RgLCAoKSA9PiB7XG4gICAgbGV0IHBybmcgPSBwcm5nX2FsZyhzbmFwLnNlZWQpXG4gICAgbGV0IHJlcyA9IEFycmF5LmZyb20oe2xlbmd0aDozfSwgKCkgPT4gcHJuZygpKVxuICAgIHRlc3Rfc25hcChyZXMsIHNuYXAuZGlyZWN0LCAnZGlyZWN0JylcbiAgfSlcblxuICBpdChgJHtuYW1lfS5xdWljaygpYCwgKCkgPT4ge1xuICAgIGxldCBwcm5nID0gcHJuZ19hbGcoc25hcC5zZWVkKVxuICAgIGxldCByZXMgPSBBcnJheS5mcm9tKHtsZW5ndGg6M30sICgpID0+IHBybmcucXVpY2soKSlcbiAgICB0ZXN0X3NuYXAocmVzLCBzbmFwLnF1aWNrLCAncXVpY2snKVxuICB9KVxuXG4gIGl0KGAke25hbWV9LmludDMyKClgLCAoKSA9PiB7XG4gICAgbGV0IHBybmcgPSBwcm5nX2FsZyhzbmFwLnNlZWQpXG4gICAgbGV0IHJlcyA9IEFycmF5LmZyb20oe2xlbmd0aDozfSwgKCkgPT4gcHJuZy5pbnQzMigpKVxuICAgIHRlc3Rfc25hcChyZXMsIHNuYXAuaW50MzIsICdpbnQzMicpXG4gIH0pXG5cbiAgaXQoYCR7bmFtZX0uZG91YmxlKClgLCAoKSA9PiB7XG4gICAgbGV0IHBybmcgPSBwcm5nX2FsZyhzbmFwLnNlZWQpXG4gICAgbGV0IHJlcyA9IEFycmF5LmZyb20oe2xlbmd0aDozfSwgKCkgPT4gcHJuZy5kb3VibGUoKSlcbiAgICB0ZXN0X3NuYXAocmVzLCBzbmFwLmRvdWJsZSwgJ2RvdWJsZScpXG4gIH0pXG5cbn1cbiIsImZ1bmN0aW9uIF9wcm5nX3Jlc3RvcmUocHJuZywgeGcsIG9wdHMpIHtcbiAgbGV0IHN0YXRlID0gb3B0cyAmJiBvcHRzLnN0YXRlO1xuICBpZiAoc3RhdGUpIHtcbiAgICBpZiAodHlwZW9mKHN0YXRlKSA9PSAnb2JqZWN0JykgeGcuY29weShzdGF0ZSwgeGcpO1xuICAgIHBybmcuc3RhdGUgPSAoKSA9PiB4Zy5jb3B5KHhnLCB7fSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gX3BybmdfeG9yX2NvcmUoeGcsIG9wdHMpIHtcbiAgbGV0IHBybmcgPSAoKSA9PiAoeGcubmV4dCgpID4+PiAwKSAvIDB4MTAwMDAwMDAwO1xuXG4gIHBybmcuZG91YmxlID0gKCkgPT4ge1xuICAgIGxldCB0b3AsIGJvdCwgcmVzdWx0O1xuICAgIGRvIHtcbiAgICAgIHRvcCA9IHhnLm5leHQoKSA+Pj4gMTE7XG4gICAgICBib3QgPSAoeGcubmV4dCgpID4+PiAwKSAvIDB4MTAwMDAwMDAwO1xuICAgICAgcmVzdWx0ID0gKHRvcCArIGJvdCkgLyAoMSA8PCAyMSk7XG4gICAgfSB3aGlsZSAocmVzdWx0ID09PSAwKTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9O1xuXG4gIHBybmcuaW50MzIgPSAoKSA9PiB4Zy5uZXh0KCkgfCAwO1xuXG4gIHBybmcucXVpY2sgPSBwcm5nO1xuXG4gIF9wcm5nX3Jlc3RvcmUocHJuZywgeGcsIG9wdHMpO1xuICByZXR1cm4gcHJuZztcbn1cblxuLy8gQSBwb3J0IG9mIGFuIGFsZ29yaXRobSBieSBKb2hhbm5lcyBCYWFnw7hlIDxiYWFnb2VAYmFhZ29lLmNvbT4sIDIwMTBcbmZ1bmN0aW9uIHBybmdfYWxlYShzZWVkLCBvcHRzKSB7XG4gIGxldCB4ZyA9IG5ldyBBbGVhR2VuKHNlZWQpO1xuXG4gIGxldCBwcm5nID0gKCkgPT4geGcubmV4dCgpO1xuXG4gIHBybmcuZG91YmxlID0gKCkgPT5cbiAgICBwcm5nKCkgKyAocHJuZygpICogMHgyMDAwMDAgfCAwKSAqIDEuMTEwMjIzMDI0NjI1MTU2NWUtMTY7IC8vIDJeLTUzXG5cbiAgcHJuZy5pbnQzMiA9ICgpID0+ICh4Zy5uZXh0KCkgKiAweDEwMDAwMDAwMCkgfCAwO1xuXG4gIHBybmcucXVpY2sgPSBwcm5nO1xuXG4gIF9wcm5nX3Jlc3RvcmUocHJuZywgeGcsIG9wdHMpO1xuICByZXR1cm4gcHJuZ1xufVxuXG5jbGFzcyBBbGVhR2VuIHtcbiAgY29uc3RydWN0b3Ioc2VlZCkge1xuICAgIGlmIChzZWVkID09IG51bGwpIHNlZWQgPSArKG5ldyBEYXRlKTtcblxuICAgIGxldCBuID0gMHhlZmM4MjQ5ZDtcblxuICAgIC8vIEFwcGx5IHRoZSBzZWVkaW5nIGFsZ29yaXRobSBmcm9tIEJhYWdvZS5cbiAgICB0aGlzLmMgPSAxO1xuICAgIHRoaXMuczAgPSBtYXNoKCcgJyk7XG4gICAgdGhpcy5zMSA9IG1hc2goJyAnKTtcbiAgICB0aGlzLnMyID0gbWFzaCgnICcpO1xuICAgIHRoaXMuczAgLT0gbWFzaChzZWVkKTtcbiAgICBpZiAodGhpcy5zMCA8IDApIHsgdGhpcy5zMCArPSAxOyB9XG4gICAgdGhpcy5zMSAtPSBtYXNoKHNlZWQpO1xuICAgIGlmICh0aGlzLnMxIDwgMCkgeyB0aGlzLnMxICs9IDE7IH1cbiAgICB0aGlzLnMyIC09IG1hc2goc2VlZCk7XG4gICAgaWYgKHRoaXMuczIgPCAwKSB7IHRoaXMuczIgKz0gMTsgfVxuXG4gICAgZnVuY3Rpb24gbWFzaChkYXRhKSB7XG4gICAgICBkYXRhID0gU3RyaW5nKGRhdGEpO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIG4gKz0gZGF0YS5jaGFyQ29kZUF0KGkpO1xuICAgICAgICBsZXQgaCA9IDAuMDI1MTk2MDMyODI0MTY5MzggKiBuO1xuICAgICAgICBuID0gaCA+Pj4gMDtcbiAgICAgICAgaCAtPSBuO1xuICAgICAgICBoICo9IG47XG4gICAgICAgIG4gPSBoID4+PiAwO1xuICAgICAgICBoIC09IG47XG4gICAgICAgIG4gKz0gaCAqIDB4MTAwMDAwMDAwOyAvLyAyXjMyXG4gICAgICB9XG4gICAgICByZXR1cm4gKG4gPj4+IDApICogMi4zMjgzMDY0MzY1Mzg2OTYzZS0xMDsgLy8gMl4tMzJcbiAgICB9XG4gIH1cblxuICBuZXh0KCkge1xuICAgIGxldCB7YyxzMCxzMSxzMn0gPSB0aGlzO1xuICAgIGxldCB0ID0gMjA5MTYzOSAqIHMwICsgYyAqIDIuMzI4MzA2NDM2NTM4Njk2M2UtMTA7IC8vIDJeLTMyXG4gICAgdGhpcy5zMCA9IHMxO1xuICAgIHRoaXMuczEgPSBzMjtcbiAgICByZXR1cm4gdGhpcy5zMiA9IHQgLSAodGhpcy5jID0gdCB8IDApO1xuICB9XG5cbiAgY29weShmLCB0KSB7XG4gICAgdC5jID0gZi5jO1xuICAgIHQuczAgPSBmLnMwO1xuICAgIHQuczEgPSBmLnMxO1xuICAgIHQuczIgPSBmLnMyO1xuICAgIHJldHVybiB0O1xuICB9XG59XG5cbi8vIEEgSmF2YXNjcmlwdCBpbXBsZW1lbnRhaW9uIG9mIHRoZSBcInhvcjEyOFwiIHBybmcgYWxnb3JpdGhtIGJ5XG5mdW5jdGlvbiBwcm5nX3hvcjEyOChzZWVkLCBvcHRzKSB7XG4gIGxldCB4ZyA9IG5ldyBYb3IxMjhHZW4oc2VlZCk7XG4gIHJldHVybiBfcHJuZ194b3JfY29yZSh4Zywgb3B0cyk7XG59XG5cbmNsYXNzIFhvcjEyOEdlbiB7XG4gIGNvbnN0cnVjdG9yKHNlZWQpIHtcbiAgICBpZiAoc2VlZCA9PSBudWxsKSBzZWVkID0gKyhuZXcgRGF0ZSk7XG5cbiAgICBsZXQgc3Ryc2VlZCA9ICcnO1xuXG4gICAgdGhpcy54ID0gMDtcbiAgICB0aGlzLnkgPSAwO1xuICAgIHRoaXMueiA9IDA7XG4gICAgdGhpcy53ID0gMDtcblxuICAgIGlmIChzZWVkID09PSAoc2VlZCB8IDApKSB7XG4gICAgICAvLyBJbnRlZ2VyIHNlZWQuXG4gICAgICB0aGlzLnggPSBzZWVkO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBTdHJpbmcgc2VlZC5cbiAgICAgIHN0cnNlZWQgKz0gc2VlZDtcbiAgICB9XG5cbiAgICAvLyBNaXggaW4gc3RyaW5nIHNlZWQsIHRoZW4gZGlzY2FyZCBhbiBpbml0aWFsIGJhdGNoIG9mIDY0IHZhbHVlcy5cbiAgICBmb3IgKGxldCBrID0gMDsgayA8IHN0cnNlZWQubGVuZ3RoICsgNjQ7IGsrKykge1xuICAgICAgdGhpcy54IF49IHN0cnNlZWQuY2hhckNvZGVBdChrKSB8IDA7XG4gICAgICB0aGlzLm5leHQoKTtcbiAgICB9XG4gIH1cblxuICBuZXh0KCkge1xuICAgIGxldCB7eCx5LHosd30gPSB0aGlzO1xuICAgIGxldCB0ID0geCBeICh4IDw8IDExKTtcbiAgICB0aGlzLnggPSB5O1xuICAgIHRoaXMueSA9IHo7XG4gICAgdGhpcy56ID0gdztcbiAgICByZXR1cm4gdGhpcy53ID0gdyBeICgodyA+Pj4gMTkpIF4gdCBeICh0ID4+PiA4KSk7XG4gIH07XG5cbiAgY29weShmLCB0KSB7XG4gICAgdC54ID0gZi54O1xuICAgIHQueSA9IGYueTtcbiAgICB0LnogPSBmLno7XG4gICAgdC53ID0gZi53O1xuICAgIHJldHVybiB0O1xuICB9XG59XG5cbi8vIEEgSmF2YXNjcmlwdCBpbXBsZW1lbnRhaW9uIG9mIHRoZSBcInhvcndvd1wiIHBybmcgYWxnb3JpdGhtIGJ5XG5mdW5jdGlvbiBwcm5nX3hvcndvdyhzZWVkLCBvcHRzKSB7XG4gIGxldCB4ZyA9IG5ldyBYb3JXb3dHZW4oc2VlZCk7XG4gIHJldHVybiBfcHJuZ194b3JfY29yZSh4Zywgb3B0cyk7XG59XG5cbmNsYXNzIFhvcldvd0dlbiB7XG4gIGNvbnN0cnVjdG9yKHNlZWQpIHtcbiAgICBpZiAoc2VlZCA9PSBudWxsKSBzZWVkID0gKyhuZXcgRGF0ZSk7XG5cbiAgICBsZXQgc3Ryc2VlZCA9ICcnO1xuXG4gICAgdGhpcy54ID0gMDtcbiAgICB0aGlzLnkgPSAwO1xuICAgIHRoaXMueiA9IDA7XG4gICAgdGhpcy53ID0gMDtcbiAgICB0aGlzLnYgPSAwO1xuXG4gICAgaWYgKHNlZWQgPT09IChzZWVkIHwgMCkpIHtcbiAgICAgIC8vIEludGVnZXIgc2VlZC5cbiAgICAgIHRoaXMueCA9IHNlZWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFN0cmluZyBzZWVkLlxuICAgICAgc3Ryc2VlZCArPSBzZWVkO1xuICAgIH1cblxuICAgIC8vIE1peCBpbiBzdHJpbmcgc2VlZCwgdGhlbiBkaXNjYXJkIGFuIGluaXRpYWwgYmF0Y2ggb2YgNjQgdmFsdWVzLlxuICAgIGZvciAobGV0IGsgPSAwOyBrIDwgc3Ryc2VlZC5sZW5ndGggKyA2NDsgaysrKSB7XG4gICAgICB0aGlzLnggXj0gc3Ryc2VlZC5jaGFyQ29kZUF0KGspIHwgMDtcbiAgICAgIGlmIChrID09IHN0cnNlZWQubGVuZ3RoKSB7XG4gICAgICAgIHRoaXMuZCA9IHRoaXMueCA8PCAxMCBeIHRoaXMueCA+Pj4gNDtcbiAgICAgIH1cbiAgICAgIHRoaXMubmV4dCgpO1xuICAgIH1cbiAgfVxuXG4gIG5leHQoKSB7XG4gICAgbGV0IHt4LHkseix3LHYsZH0gPSB0aGlzO1xuICAgIGxldCB0ID0gKHggXiAoeCA+Pj4gMikpO1xuICAgIHRoaXMueCA9IHk7XG4gICAgdGhpcy55ID0gejtcbiAgICB0aGlzLnogPSB3O1xuICAgIHRoaXMudyA9IHY7XG4gICAgcmV0dXJuICh0aGlzLmQgPSAoZCArIDM2MjQzNyB8IDApKSArXG4gICAgICAgKHRoaXMudiA9ICh2IF4gKHYgPDwgNCkpIF4gKHQgXiAodCA8PCAxKSkpIHwgMDtcbiAgfTtcblxuICBjb3B5KGYsIHQpIHtcbiAgICB0LnggPSBmLng7XG4gICAgdC55ID0gZi55O1xuICAgIHQueiA9IGYuejtcbiAgICB0LncgPSBmLnc7XG4gICAgdC52ID0gZi52O1xuICAgIHQuZCA9IGYuZDtcbiAgICByZXR1cm4gdDtcbiAgfVxufVxuXG4vLyBBIEphdmFzY3JpcHQgaW1wbGVtZW50YWlvbiBvZiB0aGUgXCJ4b3JzaGlmdDdcIiBhbGdvcml0aG0gYnlcbmZ1bmN0aW9uIHBybmdfeG9yc2hpZnQ3KHNlZWQsIG9wdHMpIHtcbiAgbGV0IHhnID0gbmV3IFhvclNoaWZ0N0dlbihzZWVkKTtcbiAgcmV0dXJuIF9wcm5nX3hvcl9jb3JlKHhnLCBvcHRzKTtcbn1cblxuXG5jbGFzcyBYb3JTaGlmdDdHZW4ge1xuICBjb25zdHJ1Y3RvcihzZWVkKSB7XG4gICAgaWYgKHNlZWQgPT0gbnVsbCkgc2VlZCA9ICsobmV3IERhdGUpO1xuXG4gICAgdmFyIGosIHcsIHggPSBbXTtcblxuICAgIGlmIChzZWVkID09PSAoc2VlZCB8IDApKSB7XG4gICAgICAvLyBTZWVkIHN0YXRlIGFycmF5IHVzaW5nIGEgMzItYml0IGludGVnZXIuXG4gICAgICB3ID0geFswXSA9IHNlZWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFNlZWQgc3RhdGUgdXNpbmcgYSBzdHJpbmcuXG4gICAgICBzZWVkID0gJycgKyBzZWVkO1xuICAgICAgZm9yIChqID0gMDsgaiA8IHNlZWQubGVuZ3RoOyArK2opIHtcbiAgICAgICAgeFtqICYgN10gPSAoeFtqICYgN10gPDwgMTUpIF5cbiAgICAgICAgICAgIChzZWVkLmNoYXJDb2RlQXQoaikgKyB4WyhqICsgMSkgJiA3XSA8PCAxMyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gRW5mb3JjZSBhbiBhcnJheSBsZW5ndGggb2YgOCwgbm90IGFsbCB6ZXJvZXMuXG4gICAgd2hpbGUgKHgubGVuZ3RoIDwgOCkgeC5wdXNoKDApO1xuICAgIGZvciAoaiA9IDA7IGogPCA4ICYmIHhbal0gPT09IDA7ICsraik7XG4gICAgaWYgKGogPT0gOCkgdyA9IHhbN10gPSAtMTsgZWxzZSB3ID0geFtqXTtcblxuICAgIHRoaXMueCA9IHg7XG4gICAgdGhpcy5pID0gMDtcblxuICAgIC8vIERpc2NhcmQgYW4gaW5pdGlhbCAyNTYgdmFsdWVzLlxuICAgIGZvciAoaiA9IDI1NjsgaiA+IDA7IC0taikge1xuICAgICAgdGhpcy5uZXh0KCk7XG4gICAgfVxuICB9XG5cbiAgbmV4dCgpIHtcbiAgICAvLyBVcGRhdGUgeG9yIGdlbmVyYXRvci5cbiAgICBsZXQgdCwgdiwge3gsaX0gPSB0aGlzO1xuICAgIHQgPSB4W2ldOyB0IF49ICh0ID4+PiA3KTsgdiA9IHQgXiAodCA8PCAyNCk7XG4gICAgdCA9IHhbKGkgKyAxKSAmIDddOyB2IF49IHQgXiAodCA+Pj4gMTApO1xuICAgIHQgPSB4WyhpICsgMykgJiA3XTsgdiBePSB0IF4gKHQgPj4+IDMpO1xuICAgIHQgPSB4WyhpICsgNCkgJiA3XTsgdiBePSB0IF4gKHQgPDwgNyk7XG4gICAgdCA9IHhbKGkgKyA3KSAmIDddOyB0ID0gdCBeICh0IDw8IDEzKTsgdiBePSB0IF4gKHQgPDwgOSk7XG4gICAgeFtpXSA9IHY7XG4gICAgdGhpcy5pID0gKGkgKyAxKSAmIDc7XG4gICAgcmV0dXJuIHY7XG4gIH07XG5cbiAgY29weShmLCB0KSB7XG4gICAgdC54ID0gWy4uLiBmLnhdO1xuICAgIHQuaSA9IGYuaTtcbiAgICByZXR1cm4gdDtcbiAgfVxufVxuXG4vLyBBIEphdmFzY3JpcHQgaW1wbGVtZW50YWlvbiBvZiBSaWNoYXJkIEJyZW50J3MgWG9yZ2VucyB4b3I0MDk2IGFsZ29yaXRobS5cbmZ1bmN0aW9uIHBybmdfeG9yNDA5NihzZWVkLCBvcHRzKSB7XG4gIGxldCB4ZyA9IG5ldyBYb3I0MDk2R2VuKHNlZWQpO1xuICByZXR1cm4gX3BybmdfeG9yX2NvcmUoeGcsIG9wdHMpO1xufVxuXG5cbmNsYXNzIFhvcjQwOTZHZW4ge1xuICBjb25zdHJ1Y3RvcihzZWVkKSB7XG4gICAgaWYgKHNlZWQgPT0gbnVsbCkgc2VlZCA9ICsobmV3IERhdGUpO1xuXG4gICAgbGV0IHQsIHYsIGksIGosIHcsIFggPSBbXSwgbGltaXQgPSAxMjg7XG4gICAgaWYgKHNlZWQgPT09IChzZWVkIHwgMCkpIHtcbiAgICAgIC8vIE51bWVyaWMgc2VlZHMgaW5pdGlhbGl6ZSB2LCB3aGljaCBpcyB1c2VkIHRvIGdlbmVyYXRlcyBYLlxuICAgICAgdiA9IHNlZWQ7XG4gICAgICBzZWVkID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gU3RyaW5nIHNlZWRzIGFyZSBtaXhlZCBpbnRvIHYgYW5kIFggb25lIGNoYXJhY3RlciBhdCBhIHRpbWUuXG4gICAgICBzZWVkID0gc2VlZCArICdcXDAnO1xuICAgICAgdiA9IDA7XG4gICAgICBsaW1pdCA9IE1hdGgubWF4KGxpbWl0LCBzZWVkLmxlbmd0aCk7XG4gICAgfVxuICAgIC8vIEluaXRpYWxpemUgY2lyY3VsYXIgYXJyYXkgYW5kIHdleWwgdmFsdWUuXG4gICAgZm9yIChpID0gMCwgaiA9IC0zMjsgaiA8IGxpbWl0OyArK2opIHtcbiAgICAgIC8vIFB1dCB0aGUgdW5pY29kZSBjaGFyYWN0ZXJzIGludG8gdGhlIGFycmF5LCBhbmQgc2h1ZmZsZSB0aGVtLlxuICAgICAgaWYgKHNlZWQpIHYgXj0gc2VlZC5jaGFyQ29kZUF0KChqICsgMzIpICUgc2VlZC5sZW5ndGgpO1xuICAgICAgLy8gQWZ0ZXIgMzIgc2h1ZmZsZXMsIHRha2UgdiBhcyB0aGUgc3RhcnRpbmcgdyB2YWx1ZS5cbiAgICAgIGlmIChqID09PSAwKSB3ID0gdjtcbiAgICAgIHYgXj0gdiA8PCAxMDtcbiAgICAgIHYgXj0gdiA+Pj4gMTU7XG4gICAgICB2IF49IHYgPDwgNDtcbiAgICAgIHYgXj0gdiA+Pj4gMTM7XG4gICAgICBpZiAoaiA+PSAwKSB7XG4gICAgICAgIHcgPSAodyArIDB4NjFjODg2NDcpIHwgMDsgICAgIC8vIFdleWwuXG4gICAgICAgIHQgPSAoWFtqICYgMTI3XSBePSAodiArIHcpKTsgIC8vIENvbWJpbmUgeG9yIGFuZCB3ZXlsIHRvIGluaXQgYXJyYXkuXG4gICAgICAgIGkgPSAoMCA9PSB0KSA/IGkgKyAxIDogMDsgICAgIC8vIENvdW50IHplcm9lcy5cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gV2UgaGF2ZSBkZXRlY3RlZCBhbGwgemVyb2VzOyBtYWtlIHRoZSBrZXkgbm9uemVyby5cbiAgICBpZiAoaSA+PSAxMjgpIHtcbiAgICAgIFhbKHNlZWQgJiYgc2VlZC5sZW5ndGggfHwgMCkgJiAxMjddID0gLTE7XG4gICAgfVxuICAgIC8vIFJ1biB0aGUgZ2VuZXJhdG9yIDUxMiB0aW1lcyB0byBmdXJ0aGVyIG1peCB0aGUgc3RhdGUgYmVmb3JlIHVzaW5nIGl0LlxuICAgIC8vIEZhY3RvcmluZyB0aGlzIGFzIGEgZnVuY3Rpb24gc2xvd3MgdGhlIG1haW4gZ2VuZXJhdG9yLCBzbyBpdCBpcyBqdXN0XG4gICAgLy8gdW5yb2xsZWQgaGVyZS4gIFRoZSB3ZXlsIGdlbmVyYXRvciBpcyBub3QgYWR2YW5jZWQgd2hpbGUgd2FybWluZyB1cC5cbiAgICBpID0gMTI3O1xuICAgIGZvciAoaiA9IDQgKiAxMjg7IGogPiAwOyAtLWopIHtcbiAgICAgIHYgPSBYWyhpICsgMzQpICYgMTI3XTtcbiAgICAgIHQgPSBYW2kgPSAoKGkgKyAxKSAmIDEyNyldO1xuICAgICAgdiBePSB2IDw8IDEzO1xuICAgICAgdCBePSB0IDw8IDE3O1xuICAgICAgdiBePSB2ID4+PiAxNTtcbiAgICAgIHQgXj0gdCA+Pj4gMTI7XG4gICAgICBYW2ldID0gdiBeIHQ7XG4gICAgfVxuICAgIC8vIFN0b3Jpbmcgc3RhdGUgYXMgb2JqZWN0IG1lbWJlcnMgaXMgZmFzdGVyIHRoYW4gdXNpbmcgY2xvc3VyZSB2YXJpYWJsZXMuXG4gICAgdGhpcy53ID0gdztcbiAgICB0aGlzLlggPSBYO1xuICAgIHRoaXMuaSA9IGk7XG4gIH1cblxuICBuZXh0KCkge1xuICAgIGxldCB0LCB2LCB7dywgWCwgaX0gPSB0aGlzO1xuICAgIC8vIFVwZGF0ZSBXZXlsIGdlbmVyYXRvci5cbiAgICB0aGlzLncgPSB3ID0gKHcgKyAweDYxYzg4NjQ3KSB8IDA7XG4gICAgLy8gVXBkYXRlIHhvciBnZW5lcmF0b3IuXG4gICAgdiA9IFhbKGkgKyAzNCkgJiAxMjddO1xuICAgIHQgPSBYW2kgPSAoKGkgKyAxKSAmIDEyNyldO1xuICAgIHYgXj0gdiA8PCAxMztcbiAgICB0IF49IHQgPDwgMTc7XG4gICAgdiBePSB2ID4+PiAxNTtcbiAgICB0IF49IHQgPj4+IDEyO1xuICAgIC8vIFVwZGF0ZSBYb3IgZ2VuZXJhdG9yIGFycmF5IHN0YXRlLlxuICAgIHYgPSBYW2ldID0gdiBeIHQ7XG4gICAgdGhpcy5pID0gaTtcbiAgICAvLyBSZXN1bHQgaXMgdGhlIGNvbWJpbmF0aW9uLlxuICAgIHJldHVybiAodiArICh3IF4gKHcgPj4+IDE2KSkpIHwgMDtcbiAgfVxuXG4gIGNvcHkoZiwgdCkge1xuICAgIHQuaSA9IGYuaTtcbiAgICB0LncgPSBmLnc7XG4gICAgdC5YID0gWy4uLiBmLlhdO1xuICAgIHJldHVybiB0O1xuICB9XG59XG5cbi8vIEEgSmF2YXNjcmlwdCBpbXBsZW1lbnRhaW9uIG9mIHRoZSBcIlR5Y2hlLWlcIiBwcm5nIGFsZ29yaXRobSBieVxuZnVuY3Rpb24gcHJuZ190eWNoZWkoc2VlZCwgb3B0cykge1xuICBsZXQgeGcgPSBuZXcgVHljaGVpR2VuKHNlZWQpO1xuICByZXR1cm4gX3BybmdfeG9yX2NvcmUoeGcsIG9wdHMpO1xufVxuXG5jbGFzcyBUeWNoZWlHZW4ge1xuICBjb25zdHJ1Y3RvcihzZWVkKSB7XG4gICAgaWYgKHNlZWQgPT0gbnVsbCkgc2VlZCA9ICsobmV3IERhdGUpO1xuXG4gICAgbGV0IHN0cnNlZWQgPSAnJztcblxuICAgIHRoaXMuYSA9IDA7XG4gICAgdGhpcy5iID0gMDtcbiAgICB0aGlzLmMgPSAyNjU0NDM1NzY5IHwgMDtcbiAgICB0aGlzLmQgPSAxMzY3MTMwNTUxO1xuXG4gICAgaWYgKHNlZWQgPT09IE1hdGguZmxvb3Ioc2VlZCkpIHtcbiAgICAgIC8vIEludGVnZXIgc2VlZC5cbiAgICAgIHRoaXMuYSA9IChzZWVkIC8gMHgxMDAwMDAwMDApIHwgMDtcbiAgICAgIHRoaXMuYiA9IHNlZWQgfCAwO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBTdHJpbmcgc2VlZC5cbiAgICAgIHN0cnNlZWQgKz0gc2VlZDtcbiAgICB9XG5cbiAgICAvLyBNaXggaW4gc3RyaW5nIHNlZWQsIHRoZW4gZGlzY2FyZCBhbiBpbml0aWFsIGJhdGNoIG9mIDY0IHZhbHVlcy5cbiAgICBmb3IgKGxldCBrID0gMDsgayA8IHN0cnNlZWQubGVuZ3RoICsgMjA7IGsrKykge1xuICAgICAgdGhpcy5iIF49IHN0cnNlZWQuY2hhckNvZGVBdChrKSB8IDA7XG4gICAgICB0aGlzLm5leHQoKTtcbiAgICB9XG4gIH1cblxuICBuZXh0KCkge1xuICAgIGxldCB7YSxiLGMsZH0gPSB0aGlzO1xuICAgIGIgPSAoYiA8PCAyNSkgXiAoYiA+Pj4gNykgXiBjO1xuICAgIGMgPSAoYyAtIGQpIHwgMDtcbiAgICBkID0gKGQgPDwgMjQpIF4gKGQgPj4+IDgpIF4gYTtcbiAgICBhID0gKGEgLSBiKSB8IDA7XG4gICAgdGhpcy5iID0gYiA9IChiIDw8IDIwKSBeIChiID4+PiAxMikgXiBjO1xuICAgIHRoaXMuYyA9IGMgPSAoYyAtIGQpIHwgMDtcbiAgICB0aGlzLmQgPSAoZCA8PCAxNikgXiAoYyA+Pj4gMTYpIF4gYTtcbiAgICByZXR1cm4gdGhpcy5hID0gKGEgLSBiKSB8IDA7XG4gIH07XG5cbiAgY29weShmLCB0KSB7XG4gICAgdC5hID0gZi5hO1xuICAgIHQuYiA9IGYuYjtcbiAgICB0LmMgPSBmLmM7XG4gICAgdC5kID0gZi5kO1xuICAgIHJldHVybiB0O1xuICB9XG59XG5cblxuLyogVGhlIGZvbGxvd2luZyBpcyBub24taW52ZXJ0ZWQgdHljaGUsIHdoaWNoIGhhcyBiZXR0ZXIgaW50ZXJuYWxcbiAqIGJpdCBkaWZmdXNpb24sIGJ1dCB3aGljaCBpcyBhYm91dCAyNSUgc2xvd2VyIHRoYW4gdHljaGUtaSBpbiBKUy5cbiAqXG5cbmNsYXNzIFR5Y2hlaUdlbkFsdCBleHRlbmRzIFR5Y2hlaUdlbiB7XG4gIG5leHQoKSB7XG4gICAgbGV0IHthLGIsYyxkfSA9IHRoaXNcbiAgICBhID0gKGEgKyBiIHwgMCkgPj4+IDA7XG4gICAgZCA9IGQgXiBhOyBkID0gZCA8PCAxNiBeIGQgPj4+IDE2O1xuICAgIGMgPSBjICsgZCB8IDA7XG4gICAgYiA9IGIgXiBjOyBiID0gYiA8PCAxMiBeIGQgPj4+IDIwO1xuICAgIHRoaXMuYSA9IGEgPSBhICsgYiB8IDA7XG4gICAgZCA9IGQgXiBhOyB0aGlzLmQgPSBkID0gZCA8PCA4IF4gZCA+Pj4gMjQ7XG4gICAgdGhpcy5jID0gYyA9IGMgKyBkIHwgMDtcbiAgICBiID0gYiBeIGM7XG4gICAgcmV0dXJuIHRoaXMuYiA9IChiIDw8IDcgXiBiID4+PiAyNSk7XG4gIH1cbn1cbiovXG5cbi8qXG5Db3B5cmlnaHQgMjAxOSBEYXZpZCBCYXUuXG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZ1xuYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG5cIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbndpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbmRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0b1xucGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvXG50aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlXG5pbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCxcbkVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULlxuSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTllcbkNMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsXG5UT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRVxuU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbiovXG5mdW5jdGlvbiBwcm5nX2FyYzQoc2VlZCwgb3B0cykge1xuICBsZXQgeGcgPSBuZXcgQVJDNEdlbihzZWVkKTtcbiAgbGV0IHBybmcgPSAoKSA9PiB4Zy5uZXh0KCk7XG5cbiAgcHJuZy5kb3VibGUgPSBwcm5nO1xuXG4gIHBybmcuaW50MzIgPSAoKSA9PiB4Zy5nKDQpIHwgMDtcblxuICBwcm5nLnF1aWNrID0gKCkgPT4geGcuZyg0KSAvIDB4MTAwMDAwMDAwO1xuXG4gIF9wcm5nX3Jlc3RvcmUocHJuZywgeGcsIG9wdHMpO1xuICByZXR1cm4gcHJuZ1xufVxuXG5cbi8vXG4vLyBBUkM0XG4vL1xuLy8gQW4gQVJDNCBpbXBsZW1lbnRhdGlvbi4gIFRoZSBjb25zdHJ1Y3RvciB0YWtlcyBhIGtleSBpbiB0aGUgZm9ybSBvZlxuLy8gYW4gYXJyYXkgb2YgYXQgbW9zdCAod2lkdGgpIGludGVnZXJzIHRoYXQgc2hvdWxkIGJlIDAgPD0geCA8ICh3aWR0aCkuXG4vL1xuLy8gVGhlIGcoY291bnQpIG1ldGhvZCByZXR1cm5zIGEgcHNldWRvcmFuZG9tIGludGVnZXIgdGhhdCBjb25jYXRlbmF0ZXNcbi8vIHRoZSBuZXh0IChjb3VudCkgb3V0cHV0cyBmcm9tIEFSQzQuICBJdHMgcmV0dXJuIHZhbHVlIGlzIGEgbnVtYmVyIHhcbi8vIHRoYXQgaXMgaW4gdGhlIHJhbmdlIDAgPD0geCA8ICh3aWR0aCBeIGNvdW50KS5cbi8vXG5cbi8vXG4vLyBUaGUgZm9sbG93aW5nIGNvbnN0YW50cyBhcmUgcmVsYXRlZCB0byBJRUVFIDc1NCBsaW1pdHMuXG4vL1xuXG4vLyBjb25zdCB3aWR0aCA9IDI1NiAvLyBlYWNoIFJDNCBvdXRwdXQgaXMgMCA8PSB4IDwgMjU2XG4vLyBjb25zdCBjaHVua3MgPSA2IC8vIGF0IGxlYXN0IHNpeCBSQzQgb3V0cHV0cyBmb3IgZWFjaCBkb3VibGVcbmNvbnN0IF9hcmM0X3N0YXJ0ZGVub20gPSAyODE0NzQ5NzY3MTA2NTY7ICAgICAvLyAyNTYgKiogNiA9PSB3aWR0aCAqKiBjaHVua3NcbmNvbnN0IF9hcmM0X3NpZ25pZmljYW5jZSA9IDQ1MDM1OTk2MjczNzA0OTY7ICAvLyAyICoqIDUyIHNpZ25pZmljYW50IGRpZ2l0cyBpbiBhIGRvdWJsZVxuY29uc3QgX2FyYzRfb3ZlcmZsb3cgPSA5MDA3MTk5MjU0NzQwOTkyOyAgICAgIC8vIDIgKiogNTMgPT0gc2lnbmlmaWNhbmNlICogMlxuXG5cbmNsYXNzIEFSQzRHZW4ge1xuICBjb25zdHJ1Y3RvcihzZWVkKSB7XG4gICAgaWYgKHNlZWQgPT0gbnVsbCkgc2VlZCA9ICsobmV3IERhdGUpO1xuXG4gICAgbGV0IGtleSA9IHRoaXMubWl4a2V5KHNlZWQsIFtdKTtcbiAgICBsZXQgaSxqLHQsIFM9W10sIGtleWxlbiA9IGtleS5sZW5ndGg7XG4gICAgdGhpcy5pID0gdGhpcy5qID0gaSA9IGogPSAwO1xuICAgIHRoaXMuUyA9IFM7XG5cbiAgICAvLyBUaGUgZW1wdHkga2V5IFtdIGlzIHRyZWF0ZWQgYXMgWzBdLlxuICAgIGlmICgha2V5bGVuKSB7IGtleSA9IFtrZXlsZW4rK107IH1cblxuICAgIC8vIFNldCB1cCBTIHVzaW5nIHRoZSBzdGFuZGFyZCBrZXkgc2NoZWR1bGluZyBhbGdvcml0aG0uXG4gICAgd2hpbGUgKGkgPD0gMHhmZikge1xuICAgICAgU1tpXSA9IGkrKztcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8PSAweGZmOyBpKyspIHtcbiAgICAgIFNbaV0gPSBTW2ogPSAweGZmICYgKGogKyBrZXlbaSAlIGtleWxlbl0gKyAodCA9IFNbaV0pKV07XG4gICAgICBTW2pdID0gdDtcbiAgICB9XG5cbiAgICAvLyBGb3Igcm9idXN0IHVucHJlZGljdGFiaWxpdHksIHRoZSBmdW5jdGlvbiBjYWxsIGJlbG93IGF1dG9tYXRpY2FsbHlcbiAgICAvLyBkaXNjYXJkcyBhbiBpbml0aWFsIGJhdGNoIG9mIHZhbHVlcy4gIFRoaXMgaXMgY2FsbGVkIFJDNC1kcm9wWzI1Nl0uXG4gICAgLy8gU2VlIGh0dHA6Ly9nb29nbGUuY29tL3NlYXJjaD9xPXJzYStmbHVocmVyK3Jlc3BvbnNlJmJ0bklcbiAgICB0aGlzLmcoMjU2KTtcbiAgfVxuXG4gIG5leHQoKSB7XG4gICAgLy8gVGhpcyBmdW5jdGlvbiByZXR1cm5zIGEgcmFuZG9tIGRvdWJsZSBpbiBbMCwgMSkgdGhhdCBjb250YWluc1xuICAgIC8vIHJhbmRvbW5lc3MgaW4gZXZlcnkgYml0IG9mIHRoZSBtYW50aXNzYSBvZiB0aGUgSUVFRSA3NTQgdmFsdWUuXG5cbiAgICBsZXQgbiA9IHRoaXMuZyg2KTsgICAgICAgICAgICAgICAgICAvLyBTdGFydCB3aXRoIGEgbnVtZXJhdG9yIG4gPCAyIF4gNDhcbiAgICBsZXQgZCA9IF9hcmM0X3N0YXJ0ZGVub207ICAgICAgICAgICAvLyAgIGFuZCBkZW5vbWluYXRvciBkID0gMiBeIDQ4LlxuICAgIGxldCB4ID0gMDsgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgYW5kIG5vICdleHRyYSBsYXN0IGJ5dGUnLlxuXG4gICAgd2hpbGUgKG4gPCBfYXJjNF9zaWduaWZpY2FuY2UpIHsgICAgLy8gRmlsbCB1cCBhbGwgc2lnbmlmaWNhbnQgZGlnaXRzICgyICoqIDUyKVxuICAgICAgbiA9IChuICsgeCkgKiAyNTY7ICAgICAgICAgICAgICAgIC8vICAgYnkgc2hpZnRpbmcgbnVtZXJhdG9yIGFuZFxuICAgICAgZCAqPSAyNTY7ICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgZGVub21pbmF0b3IgYW5kIGdlbmVyYXRpbmcgYVxuICAgICAgeCA9IHRoaXMuZygxKTsgICAgICAgICAgICAgICAgICAgIC8vICAgbmV3IGxlYXN0LXNpZ25pZmljYW50LWJ5dGUuXG4gICAgfVxuICAgIHdoaWxlIChuID49IF9hcmM0X292ZXJmbG93KSB7ICAgICAgIC8vIFRvIGF2b2lkIHJvdW5kaW5nIHBhc3Qgb3ZlcmZsb3csIGJlZm9yZSBhZGRpbmdcbiAgICAgIG4gLz0gMjsgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgIGxhc3QgYnl0ZSwgc2hpZnQgZXZlcnl0aGluZ1xuICAgICAgZCAvPSAyOyAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgcmlnaHQgdXNpbmcgaW50ZWdlciBtYXRoIHVudGlsXG4gICAgICB4ID4+Pj0gMTsgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICB3ZSBoYXZlIGV4YWN0bHkgdGhlIGRlc2lyZWQgYml0cy5cbiAgICB9XG4gICAgcmV0dXJuIChuICsgeCkgLyBkOyAgICAgICAgICAgICAgICAgLy8gRm9ybSB0aGUgbnVtYmVyIHdpdGhpbiBbMCwgMSkuXG4gIH1cblxuICBnKGNvdW50KSB7XG4gICAgLy8gVGhlIFwiZ1wiIG1ldGhvZCByZXR1cm5zIHRoZSBuZXh0IChjb3VudCkgb3V0cHV0cyBhcyBvbmUgbnVtYmVyLlxuICAgIGxldCB0LCByID0gMCwge2ksaixTfSA9IHRoaXM7XG4gICAgd2hpbGUgKGNvdW50LS0pIHtcbiAgICAgIHQgPSBTW2kgPSAweGZmICYgKGkgKyAxKV07XG4gICAgICByID0gciAqIDI1NiArIFNbMHhmZiAmICgoU1tpXSA9IFNbaiA9IDB4ZmYgJiAoaiArIHQpXSkgKyAoU1tqXSA9IHQpKV07XG4gICAgfVxuICAgIHRoaXMuaSA9IGk7XG4gICAgdGhpcy5qID0gajtcbiAgICByZXR1cm4gcjtcbiAgfVxuXG4gIGNvcHkoZiwgdCkge1xuICAgIHQuaSA9IGYuaTtcbiAgICB0LmogPSBmLmo7XG4gICAgdC5TID0gWy4uLiBmLlNdO1xuICAgIHJldHVybiB0O1xuICB9XG5cbiAgbWl4a2V5KHNlZWQsIGtleSkge1xuICAgIHNlZWQgPSBzZWVkICsgJyc7XG4gICAgbGV0IHNtZWFyPTAsIGo9MDtcbiAgICB3aGlsZSAoaiA8IHNlZWQubGVuZ3RoKSB7XG4gICAgICBrZXlbMHhmZiAmIGpdID1cbiAgICAgICAgMHhmZiAmICgoc21lYXIgXj0ga2V5WzB4ZmYgJiBqXSAqIDE5KSArIHNlZWQuY2hhckNvZGVBdChqKyspKTtcbiAgICB9XG4gICAgcmV0dXJuIGtleVxuICB9XG59XG5cbmV4cG9ydCB7IHBybmdfYWxlYSwgcHJuZ19hcmM0LCBwcm5nX3R5Y2hlaSwgcHJuZ194b3IxMjgsIHBybmdfeG9yNDA5NiwgcHJuZ194b3JzaGlmdDcsIHBybmdfeG9yd293IH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD1pbmRleC5tanMubWFwXG4iLCJmdW5jdGlvbiBfcHJuZ19yZXN0b3JlKHBybmcsIHhnLCBvcHRzKSB7XG4gIGxldCBzdGF0ZSA9IG9wdHMgJiYgb3B0cy5zdGF0ZTtcbiAgaWYgKHN0YXRlKSB7XG4gICAgaWYgKHR5cGVvZihzdGF0ZSkgPT0gJ29iamVjdCcpIHhnLmNvcHkoc3RhdGUsIHhnKTtcbiAgICBwcm5nLnN0YXRlID0gKCkgPT4geGcuY29weSh4Zywge30pO1xuICB9XG59XG5cbi8vIEEgcG9ydCBvZiBhbiBhbGdvcml0aG0gYnkgSm9oYW5uZXMgQmFhZ8O4ZSA8YmFhZ29lQGJhYWdvZS5jb20+LCAyMDEwXG5mdW5jdGlvbiBwcm5nX2FsZWEoc2VlZCwgb3B0cykge1xuICBsZXQgeGcgPSBuZXcgQWxlYUdlbihzZWVkKTtcblxuICBsZXQgcHJuZyA9ICgpID0+IHhnLm5leHQoKTtcblxuICBwcm5nLmRvdWJsZSA9ICgpID0+XG4gICAgcHJuZygpICsgKHBybmcoKSAqIDB4MjAwMDAwIHwgMCkgKiAxLjExMDIyMzAyNDYyNTE1NjVlLTE2OyAvLyAyXi01M1xuXG4gIHBybmcuaW50MzIgPSAoKSA9PiAoeGcubmV4dCgpICogMHgxMDAwMDAwMDApIHwgMDtcblxuICBwcm5nLnF1aWNrID0gcHJuZztcblxuICBfcHJuZ19yZXN0b3JlKHBybmcsIHhnLCBvcHRzKTtcbiAgcmV0dXJuIHBybmdcbn1cblxuY2xhc3MgQWxlYUdlbiB7XG4gIGNvbnN0cnVjdG9yKHNlZWQpIHtcbiAgICBpZiAoc2VlZCA9PSBudWxsKSBzZWVkID0gKyhuZXcgRGF0ZSk7XG5cbiAgICBsZXQgbiA9IDB4ZWZjODI0OWQ7XG5cbiAgICAvLyBBcHBseSB0aGUgc2VlZGluZyBhbGdvcml0aG0gZnJvbSBCYWFnb2UuXG4gICAgdGhpcy5jID0gMTtcbiAgICB0aGlzLnMwID0gbWFzaCgnICcpO1xuICAgIHRoaXMuczEgPSBtYXNoKCcgJyk7XG4gICAgdGhpcy5zMiA9IG1hc2goJyAnKTtcbiAgICB0aGlzLnMwIC09IG1hc2goc2VlZCk7XG4gICAgaWYgKHRoaXMuczAgPCAwKSB7IHRoaXMuczAgKz0gMTsgfVxuICAgIHRoaXMuczEgLT0gbWFzaChzZWVkKTtcbiAgICBpZiAodGhpcy5zMSA8IDApIHsgdGhpcy5zMSArPSAxOyB9XG4gICAgdGhpcy5zMiAtPSBtYXNoKHNlZWQpO1xuICAgIGlmICh0aGlzLnMyIDwgMCkgeyB0aGlzLnMyICs9IDE7IH1cblxuICAgIGZ1bmN0aW9uIG1hc2goZGF0YSkge1xuICAgICAgZGF0YSA9IFN0cmluZyhkYXRhKTtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICBuICs9IGRhdGEuY2hhckNvZGVBdChpKTtcbiAgICAgICAgbGV0IGggPSAwLjAyNTE5NjAzMjgyNDE2OTM4ICogbjtcbiAgICAgICAgbiA9IGggPj4+IDA7XG4gICAgICAgIGggLT0gbjtcbiAgICAgICAgaCAqPSBuO1xuICAgICAgICBuID0gaCA+Pj4gMDtcbiAgICAgICAgaCAtPSBuO1xuICAgICAgICBuICs9IGggKiAweDEwMDAwMDAwMDsgLy8gMl4zMlxuICAgICAgfVxuICAgICAgcmV0dXJuIChuID4+PiAwKSAqIDIuMzI4MzA2NDM2NTM4Njk2M2UtMTA7IC8vIDJeLTMyXG4gICAgfVxuICB9XG5cbiAgbmV4dCgpIHtcbiAgICBsZXQge2MsczAsczEsczJ9ID0gdGhpcztcbiAgICBsZXQgdCA9IDIwOTE2MzkgKiBzMCArIGMgKiAyLjMyODMwNjQzNjUzODY5NjNlLTEwOyAvLyAyXi0zMlxuICAgIHRoaXMuczAgPSBzMTtcbiAgICB0aGlzLnMxID0gczI7XG4gICAgcmV0dXJuIHRoaXMuczIgPSB0IC0gKHRoaXMuYyA9IHQgfCAwKTtcbiAgfVxuXG4gIGNvcHkoZiwgdCkge1xuICAgIHQuYyA9IGYuYztcbiAgICB0LnMwID0gZi5zMDtcbiAgICB0LnMxID0gZi5zMTtcbiAgICB0LnMyID0gZi5zMjtcbiAgICByZXR1cm4gdDtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBwcm5nX2FsZWE7XG5leHBvcnQgeyBwcm5nX2FsZWEgfTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWFsZWEubWpzLm1hcFxuIiwiZnVuY3Rpb24gdCh0LGUpe2xldCBpPW5ldyBzKHQpLGg9KCk9PmkubmV4dCgpO3JldHVybiBoLmRvdWJsZT0oKT0+aCgpKzExMTAyMjMwMjQ2MjUxNTY1ZS0zMiooMjA5NzE1MipoKCl8MCksaC5pbnQzMj0oKT0+NDI5NDk2NzI5NippLm5leHQoKXwwLGgucXVpY2s9aCxmdW5jdGlvbih0LHMsZSl7bGV0IGk9ZSYmZS5zdGF0ZTtpJiYoXCJvYmplY3RcIj09dHlwZW9mIGkmJnMuY29weShpLHMpLHQuc3RhdGU9KCk9PnMuY29weShzLHt9KSl9KGgsaSxlKSxofWNsYXNzIHN7Y29uc3RydWN0b3IodCl7bnVsbD09dCYmKHQ9K25ldyBEYXRlKTtsZXQgcz00MDIyODcxMTk3O2Z1bmN0aW9uIGUodCl7dD1TdHJpbmcodCk7Zm9yKGxldCBlPTA7ZTx0Lmxlbmd0aDtlKyspe3MrPXQuY2hhckNvZGVBdChlKTtsZXQgaT0uMDI1MTk2MDMyODI0MTY5MzgqcztzPWk+Pj4wLGktPXMsaSo9cyxzPWk+Pj4wLGktPXMscys9NDI5NDk2NzI5NippfXJldHVybiAyLjMyODMwNjQzNjUzODY5NjNlLTEwKihzPj4+MCl9dGhpcy5jPTEsdGhpcy5zMD1lKFwiIFwiKSx0aGlzLnMxPWUoXCIgXCIpLHRoaXMuczI9ZShcIiBcIiksdGhpcy5zMC09ZSh0KSx0aGlzLnMwPDAmJih0aGlzLnMwKz0xKSx0aGlzLnMxLT1lKHQpLHRoaXMuczE8MCYmKHRoaXMuczErPTEpLHRoaXMuczItPWUodCksdGhpcy5zMjwwJiYodGhpcy5zMis9MSl9bmV4dCgpe2xldHtjOnQsczA6cyxzMTplLHMyOml9PXRoaXMsaD0yMDkxNjM5KnMrMi4zMjgzMDY0MzY1Mzg2OTYzZS0xMCp0O3JldHVybiB0aGlzLnMwPWUsdGhpcy5zMT1pLHRoaXMuczI9aC0odGhpcy5jPTB8aCl9Y29weSh0LHMpe3JldHVybiBzLmM9dC5jLHMuczA9dC5zMCxzLnMxPXQuczEscy5zMj10LnMyLHN9fWV4cG9ydCBkZWZhdWx0IHQ7ZXhwb3J0e3QgYXMgcHJuZ19hbGVhfTtcbiIsImltcG9ydCAqIGFzIGFzc2VydCBmcm9tICd1dnUvYXNzZXJ0J1xuaW1wb3J0IHt0ZXN0X3BybmdfYWxnfSBmcm9tICcuL19jb21tb24ubWpzJ1xuXG5pbXBvcnQgeyBwcm5nX2FsZWEgfSBmcm9tICdlc20tc2VlZHJhbmRvbSdcbmltcG9ydCB7IHBybmdfYWxlYSBhcyBwcm5nX2FsZWFfaXNvbGF0ZWQgfSBmcm9tICdlc20tc2VlZHJhbmRvbS9lc20vYWxlYS5tanMnXG5pbXBvcnQgeyBwcm5nX2FsZWEgYXMgcHJuZ19hbGVhX21pbmlmeSB9IGZyb20gJ2VzbS1zZWVkcmFuZG9tL2VzbS9hbGVhLm1pbi5tanMnXG5cbmNvbnN0IGNqc19wcm5nX2FsZWEgPSByZXF1aXJlKCdzZWVkcmFuZG9tL2xpYi9hbGVhLmpzJylcblxuZGVzY3JpYmUoJ2FsZWEnLCAoKSA9PiB7XG4gIGxldCBfYW5zX3NoYXJlZCA9IFsgMC4yNTk0NDUyOTgyMzAyNzU1LCAwLjgyNTMyNjM0MDk3MTUxNDYsIDAuNDIyODAzMDExOTU1NjkzMzYgXVxuICBjb25zdCBzbmFwID0ge1xuICAgIHNlZWQ6ICdhbiBleGFtcGxlIHNlZWQgc3RyaW5nJyxcbiAgICBkaXJlY3Q6IF9hbnNfc2hhcmVkLFxuICAgIHF1aWNrOiBfYW5zX3NoYXJlZCxcbiAgICBpbnQzMjogWyAxMTE0MzA5MDcxLCAtNzUwMjE3NjUzLCAxODE1OTI1MTA5IF0sXG4gICAgZG91YmxlOiBbIDAuMjU5NDQ1Mjk4NDIyNDM2NywgMC40MjI4MDMwMTIxNjYyODk3LCAwLjc2MjYyOTY2Njg5NDA5ODIgXSxcbiAgfVxuXG4gIGRlc2NyaWJlKCdzaGFyZWQnLCAoKSA9PlxuICAgIHRlc3RfcHJuZ19hbGcoJ2FsZWEnLCBwcm5nX2FsZWEsIHNuYXApKVxuXG4gIGRlc2NyaWJlKCdpc29sYXRlZCcsICgpID0+XG4gICAgdGVzdF9wcm5nX2FsZygnYWxlYScsIHBybmdfYWxlYV9pc29sYXRlZCwgc25hcCkpXG5cbiAgZGVzY3JpYmUoJ2lzb2xhdGVkIG1pbmlmaWVkJywgKCkgPT5cbiAgICB0ZXN0X3BybmdfYWxnKCdhbGVhJywgcHJuZ19hbGVhX21pbmlmeSwgc25hcCkpXG5cbiAgaWYgKGNqc19wcm5nX2FsZWEpXG4gICAgZGVzY3JpYmUoJ29yaWdpbmFsIHNlZWRyYW5kb20gKENvbW1vbkpTKScsICgpID0+XG4gICAgICB0ZXN0X3BybmdfYWxnKCdhbGVhJywgY2pzX3BybmdfYWxlYSwgc25hcCkpXG59KVxuIiwiZnVuY3Rpb24gX3BybmdfcmVzdG9yZShwcm5nLCB4Zywgb3B0cykge1xuICBsZXQgc3RhdGUgPSBvcHRzICYmIG9wdHMuc3RhdGU7XG4gIGlmIChzdGF0ZSkge1xuICAgIGlmICh0eXBlb2Yoc3RhdGUpID09ICdvYmplY3QnKSB4Zy5jb3B5KHN0YXRlLCB4Zyk7XG4gICAgcHJuZy5zdGF0ZSA9ICgpID0+IHhnLmNvcHkoeGcsIHt9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfcHJuZ194b3JfY29yZSh4Zywgb3B0cykge1xuICBsZXQgcHJuZyA9ICgpID0+ICh4Zy5uZXh0KCkgPj4+IDApIC8gMHgxMDAwMDAwMDA7XG5cbiAgcHJuZy5kb3VibGUgPSAoKSA9PiB7XG4gICAgbGV0IHRvcCwgYm90LCByZXN1bHQ7XG4gICAgZG8ge1xuICAgICAgdG9wID0geGcubmV4dCgpID4+PiAxMTtcbiAgICAgIGJvdCA9ICh4Zy5uZXh0KCkgPj4+IDApIC8gMHgxMDAwMDAwMDA7XG4gICAgICByZXN1bHQgPSAodG9wICsgYm90KSAvICgxIDw8IDIxKTtcbiAgICB9IHdoaWxlIChyZXN1bHQgPT09IDApO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgcHJuZy5pbnQzMiA9ICgpID0+IHhnLm5leHQoKSB8IDA7XG5cbiAgcHJuZy5xdWljayA9IHBybmc7XG5cbiAgX3BybmdfcmVzdG9yZShwcm5nLCB4Zywgb3B0cyk7XG4gIHJldHVybiBwcm5nO1xufVxuXG4vLyBBIEphdmFzY3JpcHQgaW1wbGVtZW50YWlvbiBvZiB0aGUgXCJ4b3IxMjhcIiBwcm5nIGFsZ29yaXRobSBieVxuZnVuY3Rpb24gcHJuZ194b3IxMjgoc2VlZCwgb3B0cykge1xuICBsZXQgeGcgPSBuZXcgWG9yMTI4R2VuKHNlZWQpO1xuICByZXR1cm4gX3BybmdfeG9yX2NvcmUoeGcsIG9wdHMpO1xufVxuXG5jbGFzcyBYb3IxMjhHZW4ge1xuICBjb25zdHJ1Y3RvcihzZWVkKSB7XG4gICAgaWYgKHNlZWQgPT0gbnVsbCkgc2VlZCA9ICsobmV3IERhdGUpO1xuXG4gICAgbGV0IHN0cnNlZWQgPSAnJztcblxuICAgIHRoaXMueCA9IDA7XG4gICAgdGhpcy55ID0gMDtcbiAgICB0aGlzLnogPSAwO1xuICAgIHRoaXMudyA9IDA7XG5cbiAgICBpZiAoc2VlZCA9PT0gKHNlZWQgfCAwKSkge1xuICAgICAgLy8gSW50ZWdlciBzZWVkLlxuICAgICAgdGhpcy54ID0gc2VlZDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gU3RyaW5nIHNlZWQuXG4gICAgICBzdHJzZWVkICs9IHNlZWQ7XG4gICAgfVxuXG4gICAgLy8gTWl4IGluIHN0cmluZyBzZWVkLCB0aGVuIGRpc2NhcmQgYW4gaW5pdGlhbCBiYXRjaCBvZiA2NCB2YWx1ZXMuXG4gICAgZm9yIChsZXQgayA9IDA7IGsgPCBzdHJzZWVkLmxlbmd0aCArIDY0OyBrKyspIHtcbiAgICAgIHRoaXMueCBePSBzdHJzZWVkLmNoYXJDb2RlQXQoaykgfCAwO1xuICAgICAgdGhpcy5uZXh0KCk7XG4gICAgfVxuICB9XG5cbiAgbmV4dCgpIHtcbiAgICBsZXQge3gseSx6LHd9ID0gdGhpcztcbiAgICBsZXQgdCA9IHggXiAoeCA8PCAxMSk7XG4gICAgdGhpcy54ID0geTtcbiAgICB0aGlzLnkgPSB6O1xuICAgIHRoaXMueiA9IHc7XG4gICAgcmV0dXJuIHRoaXMudyA9IHcgXiAoKHcgPj4+IDE5KSBeIHQgXiAodCA+Pj4gOCkpO1xuICB9O1xuXG4gIGNvcHkoZiwgdCkge1xuICAgIHQueCA9IGYueDtcbiAgICB0LnkgPSBmLnk7XG4gICAgdC56ID0gZi56O1xuICAgIHQudyA9IGYudztcbiAgICByZXR1cm4gdDtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBwcm5nX3hvcjEyODtcbmV4cG9ydCB7IHBybmdfeG9yMTI4IH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD14b3IxMjgubWpzLm1hcFxuIiwiZnVuY3Rpb24gdCh0LG4pe3JldHVybiBmdW5jdGlvbih0LGUpe2xldCBuPSgpPT4odC5uZXh0KCk+Pj4wKS80Mjk0OTY3Mjk2O3JldHVybiBuLmRvdWJsZT0oKT0+e2xldCBlLG4saTtkb3tlPXQubmV4dCgpPj4+MTEsbj0odC5uZXh0KCk+Pj4wKS80Mjk0OTY3Mjk2LGk9KGUrbikvKDE8PDIxKX13aGlsZSgwPT09aSk7cmV0dXJuIGl9LG4uaW50MzI9KCk9PjB8dC5uZXh0KCksbi5xdWljaz1uLGZ1bmN0aW9uKHQsZSxuKXtsZXQgaT1uJiZuLnN0YXRlO2kmJihcIm9iamVjdFwiPT10eXBlb2YgaSYmZS5jb3B5KGksZSksdC5zdGF0ZT0oKT0+ZS5jb3B5KGUse30pKX0obix0LGUpLG59KG5ldyBlKHQpLG4pfWNsYXNzIGV7Y29uc3RydWN0b3IodCl7bnVsbD09dCYmKHQ9K25ldyBEYXRlKTtsZXQgZT1cIlwiO3RoaXMueD0wLHRoaXMueT0wLHRoaXMuej0wLHRoaXMudz0wLHQ9PT0oMHx0KT90aGlzLng9dDplKz10O2ZvcihsZXQgdD0wO3Q8ZS5sZW5ndGgrNjQ7dCsrKXRoaXMueF49MHxlLmNoYXJDb2RlQXQodCksdGhpcy5uZXh0KCl9bmV4dCgpe2xldHt4OnQseTplLHo6bix3Oml9PXRoaXMscz10XnQ8PDExO3JldHVybiB0aGlzLng9ZSx0aGlzLnk9bix0aGlzLno9aSx0aGlzLnc9aV5pPj4+MTlec15zPj4+OH1jb3B5KHQsZSl7cmV0dXJuIGUueD10LngsZS55PXQueSxlLno9dC56LGUudz10LncsZX19ZXhwb3J0IGRlZmF1bHQgdDtleHBvcnR7dCBhcyBwcm5nX3hvcjEyOH07XG4iLCJpbXBvcnQgKiBhcyBhc3NlcnQgZnJvbSAndXZ1L2Fzc2VydCdcbmltcG9ydCB7dGVzdF9wcm5nX2FsZ30gZnJvbSAnLi9fY29tbW9uLm1qcydcblxuaW1wb3J0IHsgcHJuZ194b3IxMjggfSBmcm9tICdlc20tc2VlZHJhbmRvbSdcbmltcG9ydCB7IHBybmdfeG9yMTI4IGFzIHBybmdfeG9yMTI4X2lzb2xhdGVkIH0gZnJvbSAnZXNtLXNlZWRyYW5kb20vZXNtL3hvcjEyOC5tanMnXG5pbXBvcnQgeyBwcm5nX3hvcjEyOCBhcyBwcm5nX3hvcjEyOF9taW5pZnkgfSBmcm9tICdlc20tc2VlZHJhbmRvbS9lc20veG9yMTI4Lm1pbi5tanMnXG5cbmNvbnN0IGNqc19wcm5nX3hvcjEyOCA9IHJlcXVpcmUoJ3NlZWRyYW5kb20vbGliL3hvcjEyOC5qcycpXG5cbmRlc2NyaWJlKCd4b3IxMjgnLCAoKSA9PiB7XG4gIGxldCBfYW5zX3NoYXJlZCA9IFswLjk1NjAyNTc3MzE5MzY4NzIsMC42NDYxMjc2OTI4ODk0MjIyLDAuMzc3NDY1MDU5NTE1MDg4OF1cbiAgY29uc3Qgc25hcCA9IHtcbiAgICBzZWVkOiAnYW4gZXhhbXBsZSBzZWVkIHN0cmluZycsXG4gICAgZGlyZWN0OiBfYW5zX3NoYXJlZCxcbiAgICBxdWljazogX2Fuc19zaGFyZWQsXG4gICAgaW50MzI6IFstMTg4ODY3ODY2LCAtMTUxOTg2OTk4NiwgMTYyMTIwMDA4Nl0sXG4gICAgZG91YmxlOiBbMC45NTYwMjU5MDg1MzEwNDI1LDAuMzc3NDY1MTMwNTI2MzQ4NTYsMC43NjgzNTQ5NjMwODIyOTk0XSxcbiAgfVxuXG4gIGRlc2NyaWJlKCdzaGFyZWQnLCAoKSA9PlxuICAgIHRlc3RfcHJuZ19hbGcoJ3hvcjEyOCcsIHBybmdfeG9yMTI4LCBzbmFwKSlcblxuICBkZXNjcmliZSgnaXNvbGF0ZWQnLCAoKSA9PlxuICAgIHRlc3RfcHJuZ19hbGcoJ3hvcjEyOCcsIHBybmdfeG9yMTI4X2lzb2xhdGVkLCBzbmFwKSlcblxuICBkZXNjcmliZSgnaXNvbGF0ZWQgbWluaWZpZWQnLCAoKSA9PlxuICAgIHRlc3RfcHJuZ19hbGcoJ3hvcjEyOCcsIHBybmdfeG9yMTI4X21pbmlmeSwgc25hcCkpXG5cbiAgaWYgKGNqc19wcm5nX3hvcjEyOClcbiAgICBkZXNjcmliZSgnb3JpZ2luYWwgc2VlZHJhbmRvbSAoQ29tbW9uSlMpJywgKCkgPT5cbiAgICAgIHRlc3RfcHJuZ19hbGcoJ3hvcjEyOCcsIGNqc19wcm5nX3hvcjEyOCwgc25hcCkpXG59KVxuIiwiZnVuY3Rpb24gX3BybmdfcmVzdG9yZShwcm5nLCB4Zywgb3B0cykge1xuICBsZXQgc3RhdGUgPSBvcHRzICYmIG9wdHMuc3RhdGU7XG4gIGlmIChzdGF0ZSkge1xuICAgIGlmICh0eXBlb2Yoc3RhdGUpID09ICdvYmplY3QnKSB4Zy5jb3B5KHN0YXRlLCB4Zyk7XG4gICAgcHJuZy5zdGF0ZSA9ICgpID0+IHhnLmNvcHkoeGcsIHt9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfcHJuZ194b3JfY29yZSh4Zywgb3B0cykge1xuICBsZXQgcHJuZyA9ICgpID0+ICh4Zy5uZXh0KCkgPj4+IDApIC8gMHgxMDAwMDAwMDA7XG5cbiAgcHJuZy5kb3VibGUgPSAoKSA9PiB7XG4gICAgbGV0IHRvcCwgYm90LCByZXN1bHQ7XG4gICAgZG8ge1xuICAgICAgdG9wID0geGcubmV4dCgpID4+PiAxMTtcbiAgICAgIGJvdCA9ICh4Zy5uZXh0KCkgPj4+IDApIC8gMHgxMDAwMDAwMDA7XG4gICAgICByZXN1bHQgPSAodG9wICsgYm90KSAvICgxIDw8IDIxKTtcbiAgICB9IHdoaWxlIChyZXN1bHQgPT09IDApO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgcHJuZy5pbnQzMiA9ICgpID0+IHhnLm5leHQoKSB8IDA7XG5cbiAgcHJuZy5xdWljayA9IHBybmc7XG5cbiAgX3BybmdfcmVzdG9yZShwcm5nLCB4Zywgb3B0cyk7XG4gIHJldHVybiBwcm5nO1xufVxuXG4vLyBBIEphdmFzY3JpcHQgaW1wbGVtZW50YWlvbiBvZiB0aGUgXCJUeWNoZS1pXCIgcHJuZyBhbGdvcml0aG0gYnlcbmZ1bmN0aW9uIHBybmdfdHljaGVpKHNlZWQsIG9wdHMpIHtcbiAgbGV0IHhnID0gbmV3IFR5Y2hlaUdlbihzZWVkKTtcbiAgcmV0dXJuIF9wcm5nX3hvcl9jb3JlKHhnLCBvcHRzKTtcbn1cblxuY2xhc3MgVHljaGVpR2VuIHtcbiAgY29uc3RydWN0b3Ioc2VlZCkge1xuICAgIGlmIChzZWVkID09IG51bGwpIHNlZWQgPSArKG5ldyBEYXRlKTtcblxuICAgIGxldCBzdHJzZWVkID0gJyc7XG5cbiAgICB0aGlzLmEgPSAwO1xuICAgIHRoaXMuYiA9IDA7XG4gICAgdGhpcy5jID0gMjY1NDQzNTc2OSB8IDA7XG4gICAgdGhpcy5kID0gMTM2NzEzMDU1MTtcblxuICAgIGlmIChzZWVkID09PSBNYXRoLmZsb29yKHNlZWQpKSB7XG4gICAgICAvLyBJbnRlZ2VyIHNlZWQuXG4gICAgICB0aGlzLmEgPSAoc2VlZCAvIDB4MTAwMDAwMDAwKSB8IDA7XG4gICAgICB0aGlzLmIgPSBzZWVkIHwgMDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gU3RyaW5nIHNlZWQuXG4gICAgICBzdHJzZWVkICs9IHNlZWQ7XG4gICAgfVxuXG4gICAgLy8gTWl4IGluIHN0cmluZyBzZWVkLCB0aGVuIGRpc2NhcmQgYW4gaW5pdGlhbCBiYXRjaCBvZiA2NCB2YWx1ZXMuXG4gICAgZm9yIChsZXQgayA9IDA7IGsgPCBzdHJzZWVkLmxlbmd0aCArIDIwOyBrKyspIHtcbiAgICAgIHRoaXMuYiBePSBzdHJzZWVkLmNoYXJDb2RlQXQoaykgfCAwO1xuICAgICAgdGhpcy5uZXh0KCk7XG4gICAgfVxuICB9XG5cbiAgbmV4dCgpIHtcbiAgICBsZXQge2EsYixjLGR9ID0gdGhpcztcbiAgICBiID0gKGIgPDwgMjUpIF4gKGIgPj4+IDcpIF4gYztcbiAgICBjID0gKGMgLSBkKSB8IDA7XG4gICAgZCA9IChkIDw8IDI0KSBeIChkID4+PiA4KSBeIGE7XG4gICAgYSA9IChhIC0gYikgfCAwO1xuICAgIHRoaXMuYiA9IGIgPSAoYiA8PCAyMCkgXiAoYiA+Pj4gMTIpIF4gYztcbiAgICB0aGlzLmMgPSBjID0gKGMgLSBkKSB8IDA7XG4gICAgdGhpcy5kID0gKGQgPDwgMTYpIF4gKGMgPj4+IDE2KSBeIGE7XG4gICAgcmV0dXJuIHRoaXMuYSA9IChhIC0gYikgfCAwO1xuICB9O1xuXG4gIGNvcHkoZiwgdCkge1xuICAgIHQuYSA9IGYuYTtcbiAgICB0LmIgPSBmLmI7XG4gICAgdC5jID0gZi5jO1xuICAgIHQuZCA9IGYuZDtcbiAgICByZXR1cm4gdDtcbiAgfVxufVxuXG5cbi8qIFRoZSBmb2xsb3dpbmcgaXMgbm9uLWludmVydGVkIHR5Y2hlLCB3aGljaCBoYXMgYmV0dGVyIGludGVybmFsXG4gKiBiaXQgZGlmZnVzaW9uLCBidXQgd2hpY2ggaXMgYWJvdXQgMjUlIHNsb3dlciB0aGFuIHR5Y2hlLWkgaW4gSlMuXG4gKlxuXG5jbGFzcyBUeWNoZWlHZW5BbHQgZXh0ZW5kcyBUeWNoZWlHZW4ge1xuICBuZXh0KCkge1xuICAgIGxldCB7YSxiLGMsZH0gPSB0aGlzXG4gICAgYSA9IChhICsgYiB8IDApID4+PiAwO1xuICAgIGQgPSBkIF4gYTsgZCA9IGQgPDwgMTYgXiBkID4+PiAxNjtcbiAgICBjID0gYyArIGQgfCAwO1xuICAgIGIgPSBiIF4gYzsgYiA9IGIgPDwgMTIgXiBkID4+PiAyMDtcbiAgICB0aGlzLmEgPSBhID0gYSArIGIgfCAwO1xuICAgIGQgPSBkIF4gYTsgdGhpcy5kID0gZCA9IGQgPDwgOCBeIGQgPj4+IDI0O1xuICAgIHRoaXMuYyA9IGMgPSBjICsgZCB8IDA7XG4gICAgYiA9IGIgXiBjO1xuICAgIHJldHVybiB0aGlzLmIgPSAoYiA8PCA3IF4gYiA+Pj4gMjUpO1xuICB9XG59XG4qL1xuXG5leHBvcnQgZGVmYXVsdCBwcm5nX3R5Y2hlaTtcbmV4cG9ydCB7IHBybmdfdHljaGVpIH07XG4vLyMgc291cmNlTWFwcGluZ1VSTD10eWNoZWkubWpzLm1hcFxuIiwiZnVuY3Rpb24gdCh0LG4pe3JldHVybiBmdW5jdGlvbih0LGUpe2xldCBuPSgpPT4odC5uZXh0KCk+Pj4wKS80Mjk0OTY3Mjk2O3JldHVybiBuLmRvdWJsZT0oKT0+e2xldCBlLG4saTtkb3tlPXQubmV4dCgpPj4+MTEsbj0odC5uZXh0KCk+Pj4wKS80Mjk0OTY3Mjk2LGk9KGUrbikvKDE8PDIxKX13aGlsZSgwPT09aSk7cmV0dXJuIGl9LG4uaW50MzI9KCk9PjB8dC5uZXh0KCksbi5xdWljaz1uLGZ1bmN0aW9uKHQsZSxuKXtsZXQgaT1uJiZuLnN0YXRlO2kmJihcIm9iamVjdFwiPT10eXBlb2YgaSYmZS5jb3B5KGksZSksdC5zdGF0ZT0oKT0+ZS5jb3B5KGUse30pKX0obix0LGUpLG59KG5ldyBlKHQpLG4pfWNsYXNzIGV7Y29uc3RydWN0b3IodCl7bnVsbD09dCYmKHQ9K25ldyBEYXRlKTtsZXQgZT1cIlwiO3RoaXMuYT0wLHRoaXMuYj0wLHRoaXMuYz0tMTY0MDUzMTUyNyx0aGlzLmQ9MTM2NzEzMDU1MSx0PT09TWF0aC5mbG9vcih0KT8odGhpcy5hPXQvNDI5NDk2NzI5NnwwLHRoaXMuYj0wfHQpOmUrPXQ7Zm9yKGxldCB0PTA7dDxlLmxlbmd0aCsyMDt0KyspdGhpcy5iXj0wfGUuY2hhckNvZGVBdCh0KSx0aGlzLm5leHQoKX1uZXh0KCl7bGV0e2E6dCxiOmUsYzpuLGQ6aX09dGhpcztyZXR1cm4gZT1lPDwyNV5lPj4+N15uLG49bi1pfDAsaT1pPDwyNF5pPj4+OF50LHQ9dC1lfDAsdGhpcy5iPWU9ZTw8MjBeZT4+PjEyXm4sdGhpcy5jPW49bi1pfDAsdGhpcy5kPWk8PDE2Xm4+Pj4xNl50LHRoaXMuYT10LWV8MH1jb3B5KHQsZSl7cmV0dXJuIGUuYT10LmEsZS5iPXQuYixlLmM9dC5jLGUuZD10LmQsZX19ZXhwb3J0IGRlZmF1bHQgdDtleHBvcnR7dCBhcyBwcm5nX3R5Y2hlaX07XG4iLCJpbXBvcnQgKiBhcyBhc3NlcnQgZnJvbSAndXZ1L2Fzc2VydCdcbmltcG9ydCB7dGVzdF9wcm5nX2FsZ30gZnJvbSAnLi9fY29tbW9uLm1qcydcblxuaW1wb3J0IHsgcHJuZ190eWNoZWkgfSBmcm9tICdlc20tc2VlZHJhbmRvbSdcbmltcG9ydCB7IHBybmdfdHljaGVpIGFzIHBybmdfdHljaGVpX2lzb2xhdGVkIH0gZnJvbSAnZXNtLXNlZWRyYW5kb20vZXNtL3R5Y2hlaS5tanMnXG5pbXBvcnQgeyBwcm5nX3R5Y2hlaSBhcyBwcm5nX3R5Y2hlaV9taW5pZnkgfSBmcm9tICdlc20tc2VlZHJhbmRvbS9lc20vdHljaGVpLm1pbi5tanMnXG5cbmNvbnN0IGNqc19wcm5nX3R5Y2hlaSA9IHJlcXVpcmUoJ3NlZWRyYW5kb20vbGliL3R5Y2hlaS5qcycpXG5cbmRlc2NyaWJlKCd0eWNoZWknLCAoKSA9PiB7XG4gIGxldCBfYW5zX3NoYXJlZCA9IFswLjgwNDM2MjI4MDUyNzEyOTgsMC4zMjUzNzg5Mzk3NDIyMjI0MywwLjM0ODEyNzM4MjgwNzQzMzZdXG4gIGNvbnN0IHNuYXAgPSB7XG4gICAgc2VlZDogJ2FuIGV4YW1wbGUgc2VlZCBzdHJpbmcnLFxuICAgIGRpcmVjdDogX2Fuc19zaGFyZWQsXG4gICAgcXVpY2s6IF9hbnNfc2hhcmVkLFxuICAgIGludDMyOiBbLTg0MDI1NzYwNywxMzk3NDkxOTA1LDE0OTUxOTU3MjRdLFxuICAgIGRvdWJsZTogWzAuODA0MzYxOTc1MzczNzE2MiwwLjM0ODEyNzQwMzY1NjAzNDgsMC4xMjY4NDAzODY0MTkxMDU3OF0sXG4gIH1cblxuXG4gIGRlc2NyaWJlKCdzaGFyZWQnLCAoKSA9PlxuICAgIHRlc3RfcHJuZ19hbGcoJ3R5Y2hlaScsIHBybmdfdHljaGVpLCBzbmFwKSlcblxuICBkZXNjcmliZSgnaXNvbGF0ZWQnLCAoKSA9PlxuICAgIHRlc3RfcHJuZ19hbGcoJ3R5Y2hlaScsIHBybmdfdHljaGVpX2lzb2xhdGVkLCBzbmFwKSlcblxuICBkZXNjcmliZSgnaXNvbGF0ZWQgbWluaWZpZWQnLCAoKSA9PlxuICAgIHRlc3RfcHJuZ19hbGcoJ3R5Y2hlaScsIHBybmdfdHljaGVpX21pbmlmeSwgc25hcCkpXG5cbiAgaWYgKGNqc19wcm5nX3R5Y2hlaSlcbiAgICBkZXNjcmliZSgnb3JpZ2luYWwgc2VlZHJhbmRvbSAoQ29tbW9uSlMpJywgKCkgPT5cbiAgICAgIHRlc3RfcHJuZ19hbGcoJ3R5Y2hlaScsIGNqc19wcm5nX3R5Y2hlaSwgc25hcCkpXG59KVxuIiwiZnVuY3Rpb24gX3BybmdfcmVzdG9yZShwcm5nLCB4Zywgb3B0cykge1xuICBsZXQgc3RhdGUgPSBvcHRzICYmIG9wdHMuc3RhdGU7XG4gIGlmIChzdGF0ZSkge1xuICAgIGlmICh0eXBlb2Yoc3RhdGUpID09ICdvYmplY3QnKSB4Zy5jb3B5KHN0YXRlLCB4Zyk7XG4gICAgcHJuZy5zdGF0ZSA9ICgpID0+IHhnLmNvcHkoeGcsIHt9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfcHJuZ194b3JfY29yZSh4Zywgb3B0cykge1xuICBsZXQgcHJuZyA9ICgpID0+ICh4Zy5uZXh0KCkgPj4+IDApIC8gMHgxMDAwMDAwMDA7XG5cbiAgcHJuZy5kb3VibGUgPSAoKSA9PiB7XG4gICAgbGV0IHRvcCwgYm90LCByZXN1bHQ7XG4gICAgZG8ge1xuICAgICAgdG9wID0geGcubmV4dCgpID4+PiAxMTtcbiAgICAgIGJvdCA9ICh4Zy5uZXh0KCkgPj4+IDApIC8gMHgxMDAwMDAwMDA7XG4gICAgICByZXN1bHQgPSAodG9wICsgYm90KSAvICgxIDw8IDIxKTtcbiAgICB9IHdoaWxlIChyZXN1bHQgPT09IDApO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgcHJuZy5pbnQzMiA9ICgpID0+IHhnLm5leHQoKSB8IDA7XG5cbiAgcHJuZy5xdWljayA9IHBybmc7XG5cbiAgX3BybmdfcmVzdG9yZShwcm5nLCB4Zywgb3B0cyk7XG4gIHJldHVybiBwcm5nO1xufVxuXG4vLyBBIEphdmFzY3JpcHQgaW1wbGVtZW50YWlvbiBvZiB0aGUgXCJ4b3J3b3dcIiBwcm5nIGFsZ29yaXRobSBieVxuZnVuY3Rpb24gcHJuZ194b3J3b3coc2VlZCwgb3B0cykge1xuICBsZXQgeGcgPSBuZXcgWG9yV293R2VuKHNlZWQpO1xuICByZXR1cm4gX3BybmdfeG9yX2NvcmUoeGcsIG9wdHMpO1xufVxuXG5jbGFzcyBYb3JXb3dHZW4ge1xuICBjb25zdHJ1Y3RvcihzZWVkKSB7XG4gICAgaWYgKHNlZWQgPT0gbnVsbCkgc2VlZCA9ICsobmV3IERhdGUpO1xuXG4gICAgbGV0IHN0cnNlZWQgPSAnJztcblxuICAgIHRoaXMueCA9IDA7XG4gICAgdGhpcy55ID0gMDtcbiAgICB0aGlzLnogPSAwO1xuICAgIHRoaXMudyA9IDA7XG4gICAgdGhpcy52ID0gMDtcblxuICAgIGlmIChzZWVkID09PSAoc2VlZCB8IDApKSB7XG4gICAgICAvLyBJbnRlZ2VyIHNlZWQuXG4gICAgICB0aGlzLnggPSBzZWVkO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBTdHJpbmcgc2VlZC5cbiAgICAgIHN0cnNlZWQgKz0gc2VlZDtcbiAgICB9XG5cbiAgICAvLyBNaXggaW4gc3RyaW5nIHNlZWQsIHRoZW4gZGlzY2FyZCBhbiBpbml0aWFsIGJhdGNoIG9mIDY0IHZhbHVlcy5cbiAgICBmb3IgKGxldCBrID0gMDsgayA8IHN0cnNlZWQubGVuZ3RoICsgNjQ7IGsrKykge1xuICAgICAgdGhpcy54IF49IHN0cnNlZWQuY2hhckNvZGVBdChrKSB8IDA7XG4gICAgICBpZiAoayA9PSBzdHJzZWVkLmxlbmd0aCkge1xuICAgICAgICB0aGlzLmQgPSB0aGlzLnggPDwgMTAgXiB0aGlzLnggPj4+IDQ7XG4gICAgICB9XG4gICAgICB0aGlzLm5leHQoKTtcbiAgICB9XG4gIH1cblxuICBuZXh0KCkge1xuICAgIGxldCB7eCx5LHosdyx2LGR9ID0gdGhpcztcbiAgICBsZXQgdCA9ICh4IF4gKHggPj4+IDIpKTtcbiAgICB0aGlzLnggPSB5O1xuICAgIHRoaXMueSA9IHo7XG4gICAgdGhpcy56ID0gdztcbiAgICB0aGlzLncgPSB2O1xuICAgIHJldHVybiAodGhpcy5kID0gKGQgKyAzNjI0MzcgfCAwKSkgK1xuICAgICAgICh0aGlzLnYgPSAodiBeICh2IDw8IDQpKSBeICh0IF4gKHQgPDwgMSkpKSB8IDA7XG4gIH07XG5cbiAgY29weShmLCB0KSB7XG4gICAgdC54ID0gZi54O1xuICAgIHQueSA9IGYueTtcbiAgICB0LnogPSBmLno7XG4gICAgdC53ID0gZi53O1xuICAgIHQudiA9IGYudjtcbiAgICB0LmQgPSBmLmQ7XG4gICAgcmV0dXJuIHQ7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgcHJuZ194b3J3b3c7XG5leHBvcnQgeyBwcm5nX3hvcndvdyB9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9eG9yd293Lm1qcy5tYXBcbiIsImZ1bmN0aW9uIHQodCxpKXtyZXR1cm4gZnVuY3Rpb24odCxlKXtsZXQgaT0oKT0+KHQubmV4dCgpPj4+MCkvNDI5NDk2NzI5NjtyZXR1cm4gaS5kb3VibGU9KCk9PntsZXQgZSxpLG47ZG97ZT10Lm5leHQoKT4+PjExLGk9KHQubmV4dCgpPj4+MCkvNDI5NDk2NzI5NixuPShlK2kpLygxPDwyMSl9d2hpbGUoMD09PW4pO3JldHVybiBufSxpLmludDMyPSgpPT4wfHQubmV4dCgpLGkucXVpY2s9aSxmdW5jdGlvbih0LGUsaSl7bGV0IG49aSYmaS5zdGF0ZTtuJiYoXCJvYmplY3RcIj09dHlwZW9mIG4mJmUuY29weShuLGUpLHQuc3RhdGU9KCk9PmUuY29weShlLHt9KSl9KGksdCxlKSxpfShuZXcgZSh0KSxpKX1jbGFzcyBle2NvbnN0cnVjdG9yKHQpe251bGw9PXQmJih0PStuZXcgRGF0ZSk7bGV0IGU9XCJcIjt0aGlzLng9MCx0aGlzLnk9MCx0aGlzLno9MCx0aGlzLnc9MCx0aGlzLnY9MCx0PT09KDB8dCk/dGhpcy54PXQ6ZSs9dDtmb3IobGV0IHQ9MDt0PGUubGVuZ3RoKzY0O3QrKyl0aGlzLnhePTB8ZS5jaGFyQ29kZUF0KHQpLHQ9PWUubGVuZ3RoJiYodGhpcy5kPXRoaXMueDw8MTBedGhpcy54Pj4+NCksdGhpcy5uZXh0KCl9bmV4dCgpe2xldHt4OnQseTplLHo6aSx3Om4sdjpzLGQ6aH09dGhpcyx4PXRedD4+PjI7cmV0dXJuIHRoaXMueD1lLHRoaXMueT1pLHRoaXMuej1uLHRoaXMudz1zLCh0aGlzLmQ9aCszNjI0Mzd8MCkrKHRoaXMudj1zXnM8PDReeF54PDwxKXwwfWNvcHkodCxlKXtyZXR1cm4gZS54PXQueCxlLnk9dC55LGUuej10LnosZS53PXQudyxlLnY9dC52LGUuZD10LmQsZX19ZXhwb3J0IGRlZmF1bHQgdDtleHBvcnR7dCBhcyBwcm5nX3hvcndvd307XG4iLCJpbXBvcnQgKiBhcyBhc3NlcnQgZnJvbSAndXZ1L2Fzc2VydCdcbmltcG9ydCB7dGVzdF9wcm5nX2FsZ30gZnJvbSAnLi9fY29tbW9uLm1qcydcblxuaW1wb3J0IHsgcHJuZ194b3J3b3cgfSBmcm9tICdlc20tc2VlZHJhbmRvbSdcbmltcG9ydCB7IHBybmdfeG9yd293IGFzIHBybmdfeG9yd293X2lzb2xhdGVkIH0gZnJvbSAnZXNtLXNlZWRyYW5kb20vZXNtL3hvcndvdy5tanMnXG5pbXBvcnQgeyBwcm5nX3hvcndvdyBhcyBwcm5nX3hvcndvd19taW5pZnkgfSBmcm9tICdlc20tc2VlZHJhbmRvbS9lc20veG9yd293Lm1pbi5tanMnXG5cbmNvbnN0IGNqc19wcm5nX3hvcndvdyA9IHJlcXVpcmUoJ3NlZWRyYW5kb20vbGliL3hvcndvdy5qcycpXG5cbmRlc2NyaWJlKCd4b3J3b3cnLCAoKSA9PiB7XG4gIGxldCBfYW5zX3NoYXJlZCA9IFswLjU3NTg2NDk3Mjc3OTUyNzMsMC4yMzcyNzgzMzQ1NjM1OTgwNCwwLjM3MTU5NDU1NzMwNTc5NzkzXVxuXG4gIGNvbnN0IHNuYXAgPSB7XG4gICAgc2VlZDogJ2FuIGV4YW1wbGUgc2VlZCBzdHJpbmcnLFxuICAgIGRpcmVjdDogX2Fuc19zaGFyZWQsXG4gICAgcXVpY2s6IF9hbnNfc2hhcmVkLFxuICAgIGludDMyOiBbIC0xODIxNjQ2MDcxLCAxMDE5MTAyNjg3LCAxNTk1OTg2NDcxIF0sXG4gICAgZG91YmxlOiBbMC41NzU4NjQ5MDUwMTMyNDM5LDAuMzcxNTk0Njg5ODgxOTM0NjcsMC45MTgzOTAxODc1ODY2MTg0XSxcbiAgfVxuXG4gIGRlc2NyaWJlKCdzaGFyZWQnLCAoKSA9PlxuICAgIHRlc3RfcHJuZ19hbGcoJ3hvcndvdycsIHBybmdfeG9yd293LCBzbmFwKSlcblxuICBkZXNjcmliZSgnaXNvbGF0ZWQnLCAoKSA9PlxuICAgIHRlc3RfcHJuZ19hbGcoJ3hvcndvdycsIHBybmdfeG9yd293X2lzb2xhdGVkLCBzbmFwKSlcblxuICBkZXNjcmliZSgnaXNvbGF0ZWQgbWluaWZpZWQnLCAoKSA9PlxuICAgIHRlc3RfcHJuZ19hbGcoJ3hvcndvdycsIHBybmdfeG9yd293X21pbmlmeSwgc25hcCkpXG5cbiAgaWYgKGNqc19wcm5nX3hvcndvdylcbiAgICBkZXNjcmliZSgnb3JpZ2luYWwgc2VlZHJhbmRvbSAoQ29tbW9uSlMpJywgKCkgPT5cbiAgICAgIHRlc3RfcHJuZ19hbGcoJ3hvcndvdycsIGNqc19wcm5nX3hvcndvdywgc25hcCkpXG59KVxuIiwiZnVuY3Rpb24gX3BybmdfcmVzdG9yZShwcm5nLCB4Zywgb3B0cykge1xuICBsZXQgc3RhdGUgPSBvcHRzICYmIG9wdHMuc3RhdGU7XG4gIGlmIChzdGF0ZSkge1xuICAgIGlmICh0eXBlb2Yoc3RhdGUpID09ICdvYmplY3QnKSB4Zy5jb3B5KHN0YXRlLCB4Zyk7XG4gICAgcHJuZy5zdGF0ZSA9ICgpID0+IHhnLmNvcHkoeGcsIHt9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfcHJuZ194b3JfY29yZSh4Zywgb3B0cykge1xuICBsZXQgcHJuZyA9ICgpID0+ICh4Zy5uZXh0KCkgPj4+IDApIC8gMHgxMDAwMDAwMDA7XG5cbiAgcHJuZy5kb3VibGUgPSAoKSA9PiB7XG4gICAgbGV0IHRvcCwgYm90LCByZXN1bHQ7XG4gICAgZG8ge1xuICAgICAgdG9wID0geGcubmV4dCgpID4+PiAxMTtcbiAgICAgIGJvdCA9ICh4Zy5uZXh0KCkgPj4+IDApIC8gMHgxMDAwMDAwMDA7XG4gICAgICByZXN1bHQgPSAodG9wICsgYm90KSAvICgxIDw8IDIxKTtcbiAgICB9IHdoaWxlIChyZXN1bHQgPT09IDApO1xuICAgIHJldHVybiByZXN1bHQ7XG4gIH07XG5cbiAgcHJuZy5pbnQzMiA9ICgpID0+IHhnLm5leHQoKSB8IDA7XG5cbiAgcHJuZy5xdWljayA9IHBybmc7XG5cbiAgX3BybmdfcmVzdG9yZShwcm5nLCB4Zywgb3B0cyk7XG4gIHJldHVybiBwcm5nO1xufVxuXG4vLyBBIEphdmFzY3JpcHQgaW1wbGVtZW50YWlvbiBvZiBSaWNoYXJkIEJyZW50J3MgWG9yZ2VucyB4b3I0MDk2IGFsZ29yaXRobS5cbmZ1bmN0aW9uIHBybmdfeG9yNDA5NihzZWVkLCBvcHRzKSB7XG4gIGxldCB4ZyA9IG5ldyBYb3I0MDk2R2VuKHNlZWQpO1xuICByZXR1cm4gX3BybmdfeG9yX2NvcmUoeGcsIG9wdHMpO1xufVxuXG5cbmNsYXNzIFhvcjQwOTZHZW4ge1xuICBjb25zdHJ1Y3RvcihzZWVkKSB7XG4gICAgaWYgKHNlZWQgPT0gbnVsbCkgc2VlZCA9ICsobmV3IERhdGUpO1xuXG4gICAgbGV0IHQsIHYsIGksIGosIHcsIFggPSBbXSwgbGltaXQgPSAxMjg7XG4gICAgaWYgKHNlZWQgPT09IChzZWVkIHwgMCkpIHtcbiAgICAgIC8vIE51bWVyaWMgc2VlZHMgaW5pdGlhbGl6ZSB2LCB3aGljaCBpcyB1c2VkIHRvIGdlbmVyYXRlcyBYLlxuICAgICAgdiA9IHNlZWQ7XG4gICAgICBzZWVkID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gU3RyaW5nIHNlZWRzIGFyZSBtaXhlZCBpbnRvIHYgYW5kIFggb25lIGNoYXJhY3RlciBhdCBhIHRpbWUuXG4gICAgICBzZWVkID0gc2VlZCArICdcXDAnO1xuICAgICAgdiA9IDA7XG4gICAgICBsaW1pdCA9IE1hdGgubWF4KGxpbWl0LCBzZWVkLmxlbmd0aCk7XG4gICAgfVxuICAgIC8vIEluaXRpYWxpemUgY2lyY3VsYXIgYXJyYXkgYW5kIHdleWwgdmFsdWUuXG4gICAgZm9yIChpID0gMCwgaiA9IC0zMjsgaiA8IGxpbWl0OyArK2opIHtcbiAgICAgIC8vIFB1dCB0aGUgdW5pY29kZSBjaGFyYWN0ZXJzIGludG8gdGhlIGFycmF5LCBhbmQgc2h1ZmZsZSB0aGVtLlxuICAgICAgaWYgKHNlZWQpIHYgXj0gc2VlZC5jaGFyQ29kZUF0KChqICsgMzIpICUgc2VlZC5sZW5ndGgpO1xuICAgICAgLy8gQWZ0ZXIgMzIgc2h1ZmZsZXMsIHRha2UgdiBhcyB0aGUgc3RhcnRpbmcgdyB2YWx1ZS5cbiAgICAgIGlmIChqID09PSAwKSB3ID0gdjtcbiAgICAgIHYgXj0gdiA8PCAxMDtcbiAgICAgIHYgXj0gdiA+Pj4gMTU7XG4gICAgICB2IF49IHYgPDwgNDtcbiAgICAgIHYgXj0gdiA+Pj4gMTM7XG4gICAgICBpZiAoaiA+PSAwKSB7XG4gICAgICAgIHcgPSAodyArIDB4NjFjODg2NDcpIHwgMDsgICAgIC8vIFdleWwuXG4gICAgICAgIHQgPSAoWFtqICYgMTI3XSBePSAodiArIHcpKTsgIC8vIENvbWJpbmUgeG9yIGFuZCB3ZXlsIHRvIGluaXQgYXJyYXkuXG4gICAgICAgIGkgPSAoMCA9PSB0KSA/IGkgKyAxIDogMDsgICAgIC8vIENvdW50IHplcm9lcy5cbiAgICAgIH1cbiAgICB9XG4gICAgLy8gV2UgaGF2ZSBkZXRlY3RlZCBhbGwgemVyb2VzOyBtYWtlIHRoZSBrZXkgbm9uemVyby5cbiAgICBpZiAoaSA+PSAxMjgpIHtcbiAgICAgIFhbKHNlZWQgJiYgc2VlZC5sZW5ndGggfHwgMCkgJiAxMjddID0gLTE7XG4gICAgfVxuICAgIC8vIFJ1biB0aGUgZ2VuZXJhdG9yIDUxMiB0aW1lcyB0byBmdXJ0aGVyIG1peCB0aGUgc3RhdGUgYmVmb3JlIHVzaW5nIGl0LlxuICAgIC8vIEZhY3RvcmluZyB0aGlzIGFzIGEgZnVuY3Rpb24gc2xvd3MgdGhlIG1haW4gZ2VuZXJhdG9yLCBzbyBpdCBpcyBqdXN0XG4gICAgLy8gdW5yb2xsZWQgaGVyZS4gIFRoZSB3ZXlsIGdlbmVyYXRvciBpcyBub3QgYWR2YW5jZWQgd2hpbGUgd2FybWluZyB1cC5cbiAgICBpID0gMTI3O1xuICAgIGZvciAoaiA9IDQgKiAxMjg7IGogPiAwOyAtLWopIHtcbiAgICAgIHYgPSBYWyhpICsgMzQpICYgMTI3XTtcbiAgICAgIHQgPSBYW2kgPSAoKGkgKyAxKSAmIDEyNyldO1xuICAgICAgdiBePSB2IDw8IDEzO1xuICAgICAgdCBePSB0IDw8IDE3O1xuICAgICAgdiBePSB2ID4+PiAxNTtcbiAgICAgIHQgXj0gdCA+Pj4gMTI7XG4gICAgICBYW2ldID0gdiBeIHQ7XG4gICAgfVxuICAgIC8vIFN0b3Jpbmcgc3RhdGUgYXMgb2JqZWN0IG1lbWJlcnMgaXMgZmFzdGVyIHRoYW4gdXNpbmcgY2xvc3VyZSB2YXJpYWJsZXMuXG4gICAgdGhpcy53ID0gdztcbiAgICB0aGlzLlggPSBYO1xuICAgIHRoaXMuaSA9IGk7XG4gIH1cblxuICBuZXh0KCkge1xuICAgIGxldCB0LCB2LCB7dywgWCwgaX0gPSB0aGlzO1xuICAgIC8vIFVwZGF0ZSBXZXlsIGdlbmVyYXRvci5cbiAgICB0aGlzLncgPSB3ID0gKHcgKyAweDYxYzg4NjQ3KSB8IDA7XG4gICAgLy8gVXBkYXRlIHhvciBnZW5lcmF0b3IuXG4gICAgdiA9IFhbKGkgKyAzNCkgJiAxMjddO1xuICAgIHQgPSBYW2kgPSAoKGkgKyAxKSAmIDEyNyldO1xuICAgIHYgXj0gdiA8PCAxMztcbiAgICB0IF49IHQgPDwgMTc7XG4gICAgdiBePSB2ID4+PiAxNTtcbiAgICB0IF49IHQgPj4+IDEyO1xuICAgIC8vIFVwZGF0ZSBYb3IgZ2VuZXJhdG9yIGFycmF5IHN0YXRlLlxuICAgIHYgPSBYW2ldID0gdiBeIHQ7XG4gICAgdGhpcy5pID0gaTtcbiAgICAvLyBSZXN1bHQgaXMgdGhlIGNvbWJpbmF0aW9uLlxuICAgIHJldHVybiAodiArICh3IF4gKHcgPj4+IDE2KSkpIHwgMDtcbiAgfVxuXG4gIGNvcHkoZiwgdCkge1xuICAgIHQuaSA9IGYuaTtcbiAgICB0LncgPSBmLnc7XG4gICAgdC5YID0gWy4uLiBmLlhdO1xuICAgIHJldHVybiB0O1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHBybmdfeG9yNDA5NjtcbmV4cG9ydCB7IHBybmdfeG9yNDA5NiB9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9eG9yNDA5Ni5tanMubWFwXG4iLCJmdW5jdGlvbiB0KHQsbil7cmV0dXJuIGZ1bmN0aW9uKHQsZSl7bGV0IG49KCk9Pih0Lm5leHQoKT4+PjApLzQyOTQ5NjcyOTY7cmV0dXJuIG4uZG91YmxlPSgpPT57bGV0IGUsbixpO2Rve2U9dC5uZXh0KCk+Pj4xMSxuPSh0Lm5leHQoKT4+PjApLzQyOTQ5NjcyOTYsaT0oZStuKS8oMTw8MjEpfXdoaWxlKDA9PT1pKTtyZXR1cm4gaX0sbi5pbnQzMj0oKT0+MHx0Lm5leHQoKSxuLnF1aWNrPW4sZnVuY3Rpb24odCxlLG4pe2xldCBpPW4mJm4uc3RhdGU7aSYmKFwib2JqZWN0XCI9PXR5cGVvZiBpJiZlLmNvcHkoaSxlKSx0LnN0YXRlPSgpPT5lLmNvcHkoZSx7fSkpfShuLHQsZSksbn0obmV3IGUodCksbil9Y2xhc3MgZXtjb25zdHJ1Y3Rvcih0KXtudWxsPT10JiYodD0rbmV3IERhdGUpO2xldCBlLG4saSxvLHIsbD1bXSx1PTEyODtmb3IodD09PSgwfHQpPyhuPXQsdD1udWxsKToodCs9XCJcXDBcIixuPTAsdT1NYXRoLm1heCh1LHQubGVuZ3RoKSksaT0wLG89LTMyO288dTsrK28pdCYmKG5ePXQuY2hhckNvZGVBdCgobyszMikldC5sZW5ndGgpKSwwPT09byYmKHI9biksbl49bjw8MTAsbl49bj4+PjE1LG5ePW48PDQsbl49bj4+PjEzLG8+PTAmJihyPXIrMTY0MDUzMTUyN3wwLGU9bFsxMjcmb11ePW4rcixpPTA9PWU/aSsxOjApO2ZvcihpPj0xMjgmJihsWzEyNyYodCYmdC5sZW5ndGh8fDApXT0tMSksaT0xMjcsbz01MTI7bz4wOy0tbyluPWxbaSszNCYxMjddLGU9bFtpPWkrMSYxMjddLG5ePW48PDEzLGVePWU8PDE3LG5ePW4+Pj4xNSxlXj1lPj4+MTIsbFtpXT1uXmU7dGhpcy53PXIsdGhpcy5YPWwsdGhpcy5pPWl9bmV4dCgpe2xldCB0LGUse3c6bixYOmksaTpvfT10aGlzO3JldHVybiB0aGlzLnc9bj1uKzE2NDA1MzE1Mjd8MCxlPWlbbyszNCYxMjddLHQ9aVtvPW8rMSYxMjddLGVePWU8PDEzLHRePXQ8PDE3LGVePWU+Pj4xNSx0Xj10Pj4+MTIsZT1pW29dPWVedCx0aGlzLmk9byxlKyhuXm4+Pj4xNil8MH1jb3B5KHQsZSl7cmV0dXJuIGUuaT10LmksZS53PXQudyxlLlg9Wy4uLnQuWF0sZX19ZXhwb3J0IGRlZmF1bHQgdDtleHBvcnR7dCBhcyBwcm5nX3hvcjQwOTZ9O1xuIiwiaW1wb3J0ICogYXMgYXNzZXJ0IGZyb20gJ3V2dS9hc3NlcnQnXG5pbXBvcnQge3Rlc3RfcHJuZ19hbGd9IGZyb20gJy4vX2NvbW1vbi5tanMnXG5cbmltcG9ydCB7IHBybmdfeG9yNDA5NiB9IGZyb20gJ2VzbS1zZWVkcmFuZG9tJ1xuaW1wb3J0IHsgcHJuZ194b3I0MDk2IGFzIHBybmdfeG9yNDA5Nl9pc29sYXRlZCB9IGZyb20gJ2VzbS1zZWVkcmFuZG9tL2VzbS94b3I0MDk2Lm1qcydcbmltcG9ydCB7IHBybmdfeG9yNDA5NiBhcyBwcm5nX3hvcjQwOTZfbWluaWZ5IH0gZnJvbSAnZXNtLXNlZWRyYW5kb20vZXNtL3hvcjQwOTYubWluLm1qcydcblxuY29uc3QgY2pzX3BybmdfeG9yNDA5NiA9IHJlcXVpcmUoJ3NlZWRyYW5kb20vbGliL3hvcjQwOTYuanMnKVxuXG5kZXNjcmliZSgneG9yNDA5NicsICgpID0+IHtcbiAgbGV0IF9hbnNfc2hhcmVkID0gWzAuNjk5Mzg4MzY1MjYxMjU2NywwLjI5NzI3ODMwMDYyNjIwMzQsMC45MTg0ODUwODE5ODc0NTU1XVxuICBjb25zdCBzbmFwID0ge1xuICAgIHNlZWQ6ICdhbiBleGFtcGxlIHNlZWQgc3RyaW5nJyxcbiAgICBkaXJlY3Q6IF9hbnNfc2hhcmVkLFxuICAgIHF1aWNrOiBfYW5zX3NoYXJlZCxcbiAgICBpbnQzMjogWy0xMjkxMTE3MTQwLCAxMjc2ODAwNTc5LCAtMzUwMTAzOTA3XSxcbiAgICBkb3VibGU6IFswLjY5OTM4ODE2ODk0NDUwMjIsMC45MTg0ODQ3NzEwNDAxMzE2LDAuMzk1NjA0OTE3NjM5MDY1MzZdLFxuICB9XG5cbiAgZGVzY3JpYmUoJ3NoYXJlZCcsICgpID0+XG4gICAgdGVzdF9wcm5nX2FsZygneG9yNDA5NicsIHBybmdfeG9yNDA5Niwgc25hcCkpXG5cbiAgZGVzY3JpYmUoJ2lzb2xhdGVkJywgKCkgPT5cbiAgICB0ZXN0X3BybmdfYWxnKCd4b3I0MDk2JywgcHJuZ194b3I0MDk2X2lzb2xhdGVkLCBzbmFwKSlcblxuICBkZXNjcmliZSgnaXNvbGF0ZWQgbWluaWZpZWQnLCAoKSA9PlxuICAgIHRlc3RfcHJuZ19hbGcoJ3hvcjQwOTYnLCBwcm5nX3hvcjQwOTZfbWluaWZ5LCBzbmFwKSlcblxuICBpZiAoY2pzX3BybmdfeG9yNDA5NilcbiAgICBkZXNjcmliZSgnb3JpZ2luYWwgc2VlZHJhbmRvbSAoQ29tbW9uSlMpJywgKCkgPT5cbiAgICAgIHRlc3RfcHJuZ19hbGcoJ3hvcjQwOTYnLCBjanNfcHJuZ194b3I0MDk2LCBzbmFwKSlcbn0pXG4iLCJmdW5jdGlvbiBfcHJuZ19yZXN0b3JlKHBybmcsIHhnLCBvcHRzKSB7XG4gIGxldCBzdGF0ZSA9IG9wdHMgJiYgb3B0cy5zdGF0ZTtcbiAgaWYgKHN0YXRlKSB7XG4gICAgaWYgKHR5cGVvZihzdGF0ZSkgPT0gJ29iamVjdCcpIHhnLmNvcHkoc3RhdGUsIHhnKTtcbiAgICBwcm5nLnN0YXRlID0gKCkgPT4geGcuY29weSh4Zywge30pO1xuICB9XG59XG5cbmZ1bmN0aW9uIF9wcm5nX3hvcl9jb3JlKHhnLCBvcHRzKSB7XG4gIGxldCBwcm5nID0gKCkgPT4gKHhnLm5leHQoKSA+Pj4gMCkgLyAweDEwMDAwMDAwMDtcblxuICBwcm5nLmRvdWJsZSA9ICgpID0+IHtcbiAgICBsZXQgdG9wLCBib3QsIHJlc3VsdDtcbiAgICBkbyB7XG4gICAgICB0b3AgPSB4Zy5uZXh0KCkgPj4+IDExO1xuICAgICAgYm90ID0gKHhnLm5leHQoKSA+Pj4gMCkgLyAweDEwMDAwMDAwMDtcbiAgICAgIHJlc3VsdCA9ICh0b3AgKyBib3QpIC8gKDEgPDwgMjEpO1xuICAgIH0gd2hpbGUgKHJlc3VsdCA9PT0gMCk7XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfTtcblxuICBwcm5nLmludDMyID0gKCkgPT4geGcubmV4dCgpIHwgMDtcblxuICBwcm5nLnF1aWNrID0gcHJuZztcblxuICBfcHJuZ19yZXN0b3JlKHBybmcsIHhnLCBvcHRzKTtcbiAgcmV0dXJuIHBybmc7XG59XG5cbi8vIEEgSmF2YXNjcmlwdCBpbXBsZW1lbnRhaW9uIG9mIHRoZSBcInhvcnNoaWZ0N1wiIGFsZ29yaXRobSBieVxuZnVuY3Rpb24gcHJuZ194b3JzaGlmdDcoc2VlZCwgb3B0cykge1xuICBsZXQgeGcgPSBuZXcgWG9yU2hpZnQ3R2VuKHNlZWQpO1xuICByZXR1cm4gX3BybmdfeG9yX2NvcmUoeGcsIG9wdHMpO1xufVxuXG5cbmNsYXNzIFhvclNoaWZ0N0dlbiB7XG4gIGNvbnN0cnVjdG9yKHNlZWQpIHtcbiAgICBpZiAoc2VlZCA9PSBudWxsKSBzZWVkID0gKyhuZXcgRGF0ZSk7XG5cbiAgICB2YXIgaiwgdywgeCA9IFtdO1xuXG4gICAgaWYgKHNlZWQgPT09IChzZWVkIHwgMCkpIHtcbiAgICAgIC8vIFNlZWQgc3RhdGUgYXJyYXkgdXNpbmcgYSAzMi1iaXQgaW50ZWdlci5cbiAgICAgIHcgPSB4WzBdID0gc2VlZDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gU2VlZCBzdGF0ZSB1c2luZyBhIHN0cmluZy5cbiAgICAgIHNlZWQgPSAnJyArIHNlZWQ7XG4gICAgICBmb3IgKGogPSAwOyBqIDwgc2VlZC5sZW5ndGg7ICsraikge1xuICAgICAgICB4W2ogJiA3XSA9ICh4W2ogJiA3XSA8PCAxNSkgXlxuICAgICAgICAgICAgKHNlZWQuY2hhckNvZGVBdChqKSArIHhbKGogKyAxKSAmIDddIDw8IDEzKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBFbmZvcmNlIGFuIGFycmF5IGxlbmd0aCBvZiA4LCBub3QgYWxsIHplcm9lcy5cbiAgICB3aGlsZSAoeC5sZW5ndGggPCA4KSB4LnB1c2goMCk7XG4gICAgZm9yIChqID0gMDsgaiA8IDggJiYgeFtqXSA9PT0gMDsgKytqKTtcbiAgICBpZiAoaiA9PSA4KSB3ID0geFs3XSA9IC0xOyBlbHNlIHcgPSB4W2pdO1xuXG4gICAgdGhpcy54ID0geDtcbiAgICB0aGlzLmkgPSAwO1xuXG4gICAgLy8gRGlzY2FyZCBhbiBpbml0aWFsIDI1NiB2YWx1ZXMuXG4gICAgZm9yIChqID0gMjU2OyBqID4gMDsgLS1qKSB7XG4gICAgICB0aGlzLm5leHQoKTtcbiAgICB9XG4gIH1cblxuICBuZXh0KCkge1xuICAgIC8vIFVwZGF0ZSB4b3IgZ2VuZXJhdG9yLlxuICAgIGxldCB0LCB2LCB7eCxpfSA9IHRoaXM7XG4gICAgdCA9IHhbaV07IHQgXj0gKHQgPj4+IDcpOyB2ID0gdCBeICh0IDw8IDI0KTtcbiAgICB0ID0geFsoaSArIDEpICYgN107IHYgXj0gdCBeICh0ID4+PiAxMCk7XG4gICAgdCA9IHhbKGkgKyAzKSAmIDddOyB2IF49IHQgXiAodCA+Pj4gMyk7XG4gICAgdCA9IHhbKGkgKyA0KSAmIDddOyB2IF49IHQgXiAodCA8PCA3KTtcbiAgICB0ID0geFsoaSArIDcpICYgN107IHQgPSB0IF4gKHQgPDwgMTMpOyB2IF49IHQgXiAodCA8PCA5KTtcbiAgICB4W2ldID0gdjtcbiAgICB0aGlzLmkgPSAoaSArIDEpICYgNztcbiAgICByZXR1cm4gdjtcbiAgfTtcblxuICBjb3B5KGYsIHQpIHtcbiAgICB0LnggPSBbLi4uIGYueF07XG4gICAgdC5pID0gZi5pO1xuICAgIHJldHVybiB0O1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHBybmdfeG9yc2hpZnQ3O1xuZXhwb3J0IHsgcHJuZ194b3JzaGlmdDcgfTtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPXhvcnNoaWZ0Ny5tanMubWFwXG4iLCJmdW5jdGlvbiB0KHQsbil7cmV0dXJuIGZ1bmN0aW9uKHQsZSl7bGV0IG49KCk9Pih0Lm5leHQoKT4+PjApLzQyOTQ5NjcyOTY7cmV0dXJuIG4uZG91YmxlPSgpPT57bGV0IGUsbixyO2Rve2U9dC5uZXh0KCk+Pj4xMSxuPSh0Lm5leHQoKT4+PjApLzQyOTQ5NjcyOTYscj0oZStuKS8oMTw8MjEpfXdoaWxlKDA9PT1yKTtyZXR1cm4gcn0sbi5pbnQzMj0oKT0+MHx0Lm5leHQoKSxuLnF1aWNrPW4sZnVuY3Rpb24odCxlLG4pe2xldCByPW4mJm4uc3RhdGU7ciYmKFwib2JqZWN0XCI9PXR5cGVvZiByJiZlLmNvcHkocixlKSx0LnN0YXRlPSgpPT5lLmNvcHkoZSx7fSkpfShuLHQsZSksbn0obmV3IGUodCksbil9Y2xhc3MgZXtjb25zdHJ1Y3Rvcih0KXtudWxsPT10JiYodD0rbmV3IERhdGUpO3ZhciBlLG49W107aWYodD09PSgwfHQpKW5bMF09dDtlbHNlIGZvcih0PVwiXCIrdCxlPTA7ZTx0Lmxlbmd0aDsrK2Upbls3JmVdPW5bNyZlXTw8MTVedC5jaGFyQ29kZUF0KGUpK25bZSsxJjddPDwxMztmb3IoO24ubGVuZ3RoPDg7KW4ucHVzaCgwKTtmb3IoZT0wO2U8OCYmMD09PW5bZV07KytlKTtmb3IoOD09ZT9uWzddPS0xOm5bZV0sdGhpcy54PW4sdGhpcy5pPTAsZT0yNTY7ZT4wOy0tZSl0aGlzLm5leHQoKX1uZXh0KCl7bGV0IHQsZSx7eDpuLGk6cn09dGhpcztyZXR1cm4gdD1uW3JdLHRePXQ+Pj43LGU9dF50PDwyNCx0PW5bcisxJjddLGVePXRedD4+PjEwLHQ9bltyKzMmN10sZV49dF50Pj4+Myx0PW5bcis0JjddLGVePXRedDw8Nyx0PW5bcis3JjddLHRePXQ8PDEzLGVePXRedDw8OSxuW3JdPWUsdGhpcy5pPXIrMSY3LGV9Y29weSh0LGUpe3JldHVybiBlLng9Wy4uLnQueF0sZS5pPXQuaSxlfX1leHBvcnQgZGVmYXVsdCB0O2V4cG9ydHt0IGFzIHBybmdfeG9yc2hpZnQ3fTtcbiIsImltcG9ydCAqIGFzIGFzc2VydCBmcm9tICd1dnUvYXNzZXJ0J1xuaW1wb3J0IHt0ZXN0X3BybmdfYWxnfSBmcm9tICcuL19jb21tb24ubWpzJ1xuXG5pbXBvcnQgeyBwcm5nX3hvcnNoaWZ0NyB9IGZyb20gJ2VzbS1zZWVkcmFuZG9tJ1xuaW1wb3J0IHsgcHJuZ194b3JzaGlmdDcgYXMgcHJuZ194b3JzaGlmdDdfaXNvbGF0ZWQgfSBmcm9tICdlc20tc2VlZHJhbmRvbS9lc20veG9yc2hpZnQ3Lm1qcydcbmltcG9ydCB7IHBybmdfeG9yc2hpZnQ3IGFzIHBybmdfeG9yc2hpZnQ3X21pbmlmeSB9IGZyb20gJ2VzbS1zZWVkcmFuZG9tL2VzbS94b3JzaGlmdDcubWluLm1qcydcblxuY29uc3QgY2pzX3BybmdfeG9yc2hpZnQ3ID0gcmVxdWlyZSgnc2VlZHJhbmRvbS9saWIveG9yc2hpZnQ3LmpzJylcblxuZGVzY3JpYmUoJ3hvcnNoaWZ0NycsICgpID0+IHtcbiAgbGV0IF9hbnNfc2hhcmVkID0gWzAuMjE5MjY5ODM2Nzg3MTM0NCwwLjg1NTM0MjI4MDgxODE0OTQsMC4yNjQyNTk3MTYyNjMwNDA5XVxuICBjb25zdCBzbmFwID0ge1xuICAgIHNlZWQ6ICdhbiBleGFtcGxlIHNlZWQgc3RyaW5nJyxcbiAgICBkaXJlY3Q6IF9hbnNfc2hhcmVkLFxuICAgIHF1aWNrOiBfYW5zX3NoYXJlZCxcbiAgICBpbnQzMjogWyA5NDE3NTY3NzgsIC02MjEzMDAxNzMsIDExMzQ5ODY4MzkgXSxcbiAgICBkb3VibGU6IFswLjIxOTI3MDE2MDM2MTQyMzg4LDAuMjY0MjU5NTUzMzEwNDMxNywwLjM4ODE5MzA5MDEwNzUyMzddLFxuICB9XG5cbiAgZGVzY3JpYmUoJ3NoYXJlZCcsICgpID0+XG4gICAgdGVzdF9wcm5nX2FsZygneG9yc2hpZnQ3JywgcHJuZ194b3JzaGlmdDcsIHNuYXApKVxuXG4gIGRlc2NyaWJlKCdpc29sYXRlZCcsICgpID0+XG4gICAgdGVzdF9wcm5nX2FsZygneG9yc2hpZnQ3JywgcHJuZ194b3JzaGlmdDdfaXNvbGF0ZWQsIHNuYXApKVxuXG4gIGRlc2NyaWJlKCdpc29sYXRlZCBtaW5pZmllZCcsICgpID0+XG4gICAgdGVzdF9wcm5nX2FsZygneG9yc2hpZnQ3JywgcHJuZ194b3JzaGlmdDdfbWluaWZ5LCBzbmFwKSlcblxuICBpZiAoY2pzX3BybmdfeG9yc2hpZnQ3KVxuICAgIGRlc2NyaWJlKCdvcmlnaW5hbCBzZWVkcmFuZG9tIChDb21tb25KUyknLCAoKSA9PlxuICAgICAgdGVzdF9wcm5nX2FsZygneG9yc2hpZnQ3JywgY2pzX3BybmdfeG9yc2hpZnQ3LCBzbmFwKSlcbn0pXG4iLCJmdW5jdGlvbiBfcHJuZ19yZXN0b3JlKHBybmcsIHhnLCBvcHRzKSB7XG4gIGxldCBzdGF0ZSA9IG9wdHMgJiYgb3B0cy5zdGF0ZTtcbiAgaWYgKHN0YXRlKSB7XG4gICAgaWYgKHR5cGVvZihzdGF0ZSkgPT0gJ29iamVjdCcpIHhnLmNvcHkoc3RhdGUsIHhnKTtcbiAgICBwcm5nLnN0YXRlID0gKCkgPT4geGcuY29weSh4Zywge30pO1xuICB9XG59XG5cbi8qXG5Db3B5cmlnaHQgMjAxOSBEYXZpZCBCYXUuXG5cblBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZ1xuYSBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG5cIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbndpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbmRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0b1xucGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvXG50aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cblRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlXG5pbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cblxuVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCxcbkVYUFJFU1MgT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULlxuSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTllcbkNMQUlNLCBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsXG5UT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRVxuU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbiovXG5mdW5jdGlvbiBwcm5nX2FyYzQoc2VlZCwgb3B0cykge1xuICBsZXQgeGcgPSBuZXcgQVJDNEdlbihzZWVkKTtcbiAgbGV0IHBybmcgPSAoKSA9PiB4Zy5uZXh0KCk7XG5cbiAgcHJuZy5kb3VibGUgPSBwcm5nO1xuXG4gIHBybmcuaW50MzIgPSAoKSA9PiB4Zy5nKDQpIHwgMDtcblxuICBwcm5nLnF1aWNrID0gKCkgPT4geGcuZyg0KSAvIDB4MTAwMDAwMDAwO1xuXG4gIF9wcm5nX3Jlc3RvcmUocHJuZywgeGcsIG9wdHMpO1xuICByZXR1cm4gcHJuZ1xufVxuXG5cbi8vXG4vLyBBUkM0XG4vL1xuLy8gQW4gQVJDNCBpbXBsZW1lbnRhdGlvbi4gIFRoZSBjb25zdHJ1Y3RvciB0YWtlcyBhIGtleSBpbiB0aGUgZm9ybSBvZlxuLy8gYW4gYXJyYXkgb2YgYXQgbW9zdCAod2lkdGgpIGludGVnZXJzIHRoYXQgc2hvdWxkIGJlIDAgPD0geCA8ICh3aWR0aCkuXG4vL1xuLy8gVGhlIGcoY291bnQpIG1ldGhvZCByZXR1cm5zIGEgcHNldWRvcmFuZG9tIGludGVnZXIgdGhhdCBjb25jYXRlbmF0ZXNcbi8vIHRoZSBuZXh0IChjb3VudCkgb3V0cHV0cyBmcm9tIEFSQzQuICBJdHMgcmV0dXJuIHZhbHVlIGlzIGEgbnVtYmVyIHhcbi8vIHRoYXQgaXMgaW4gdGhlIHJhbmdlIDAgPD0geCA8ICh3aWR0aCBeIGNvdW50KS5cbi8vXG5cbi8vXG4vLyBUaGUgZm9sbG93aW5nIGNvbnN0YW50cyBhcmUgcmVsYXRlZCB0byBJRUVFIDc1NCBsaW1pdHMuXG4vL1xuXG4vLyBjb25zdCB3aWR0aCA9IDI1NiAvLyBlYWNoIFJDNCBvdXRwdXQgaXMgMCA8PSB4IDwgMjU2XG4vLyBjb25zdCBjaHVua3MgPSA2IC8vIGF0IGxlYXN0IHNpeCBSQzQgb3V0cHV0cyBmb3IgZWFjaCBkb3VibGVcbmNvbnN0IF9hcmM0X3N0YXJ0ZGVub20gPSAyODE0NzQ5NzY3MTA2NTY7ICAgICAvLyAyNTYgKiogNiA9PSB3aWR0aCAqKiBjaHVua3NcbmNvbnN0IF9hcmM0X3NpZ25pZmljYW5jZSA9IDQ1MDM1OTk2MjczNzA0OTY7ICAvLyAyICoqIDUyIHNpZ25pZmljYW50IGRpZ2l0cyBpbiBhIGRvdWJsZVxuY29uc3QgX2FyYzRfb3ZlcmZsb3cgPSA5MDA3MTk5MjU0NzQwOTkyOyAgICAgIC8vIDIgKiogNTMgPT0gc2lnbmlmaWNhbmNlICogMlxuXG5cbmNsYXNzIEFSQzRHZW4ge1xuICBjb25zdHJ1Y3RvcihzZWVkKSB7XG4gICAgaWYgKHNlZWQgPT0gbnVsbCkgc2VlZCA9ICsobmV3IERhdGUpO1xuXG4gICAgbGV0IGtleSA9IHRoaXMubWl4a2V5KHNlZWQsIFtdKTtcbiAgICBsZXQgaSxqLHQsIFM9W10sIGtleWxlbiA9IGtleS5sZW5ndGg7XG4gICAgdGhpcy5pID0gdGhpcy5qID0gaSA9IGogPSAwO1xuICAgIHRoaXMuUyA9IFM7XG5cbiAgICAvLyBUaGUgZW1wdHkga2V5IFtdIGlzIHRyZWF0ZWQgYXMgWzBdLlxuICAgIGlmICgha2V5bGVuKSB7IGtleSA9IFtrZXlsZW4rK107IH1cblxuICAgIC8vIFNldCB1cCBTIHVzaW5nIHRoZSBzdGFuZGFyZCBrZXkgc2NoZWR1bGluZyBhbGdvcml0aG0uXG4gICAgd2hpbGUgKGkgPD0gMHhmZikge1xuICAgICAgU1tpXSA9IGkrKztcbiAgICB9XG4gICAgZm9yIChpID0gMDsgaSA8PSAweGZmOyBpKyspIHtcbiAgICAgIFNbaV0gPSBTW2ogPSAweGZmICYgKGogKyBrZXlbaSAlIGtleWxlbl0gKyAodCA9IFNbaV0pKV07XG4gICAgICBTW2pdID0gdDtcbiAgICB9XG5cbiAgICAvLyBGb3Igcm9idXN0IHVucHJlZGljdGFiaWxpdHksIHRoZSBmdW5jdGlvbiBjYWxsIGJlbG93IGF1dG9tYXRpY2FsbHlcbiAgICAvLyBkaXNjYXJkcyBhbiBpbml0aWFsIGJhdGNoIG9mIHZhbHVlcy4gIFRoaXMgaXMgY2FsbGVkIFJDNC1kcm9wWzI1Nl0uXG4gICAgLy8gU2VlIGh0dHA6Ly9nb29nbGUuY29tL3NlYXJjaD9xPXJzYStmbHVocmVyK3Jlc3BvbnNlJmJ0bklcbiAgICB0aGlzLmcoMjU2KTtcbiAgfVxuXG4gIG5leHQoKSB7XG4gICAgLy8gVGhpcyBmdW5jdGlvbiByZXR1cm5zIGEgcmFuZG9tIGRvdWJsZSBpbiBbMCwgMSkgdGhhdCBjb250YWluc1xuICAgIC8vIHJhbmRvbW5lc3MgaW4gZXZlcnkgYml0IG9mIHRoZSBtYW50aXNzYSBvZiB0aGUgSUVFRSA3NTQgdmFsdWUuXG5cbiAgICBsZXQgbiA9IHRoaXMuZyg2KTsgICAgICAgICAgICAgICAgICAvLyBTdGFydCB3aXRoIGEgbnVtZXJhdG9yIG4gPCAyIF4gNDhcbiAgICBsZXQgZCA9IF9hcmM0X3N0YXJ0ZGVub207ICAgICAgICAgICAvLyAgIGFuZCBkZW5vbWluYXRvciBkID0gMiBeIDQ4LlxuICAgIGxldCB4ID0gMDsgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgYW5kIG5vICdleHRyYSBsYXN0IGJ5dGUnLlxuXG4gICAgd2hpbGUgKG4gPCBfYXJjNF9zaWduaWZpY2FuY2UpIHsgICAgLy8gRmlsbCB1cCBhbGwgc2lnbmlmaWNhbnQgZGlnaXRzICgyICoqIDUyKVxuICAgICAgbiA9IChuICsgeCkgKiAyNTY7ICAgICAgICAgICAgICAgIC8vICAgYnkgc2hpZnRpbmcgbnVtZXJhdG9yIGFuZFxuICAgICAgZCAqPSAyNTY7ICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgZGVub21pbmF0b3IgYW5kIGdlbmVyYXRpbmcgYVxuICAgICAgeCA9IHRoaXMuZygxKTsgICAgICAgICAgICAgICAgICAgIC8vICAgbmV3IGxlYXN0LXNpZ25pZmljYW50LWJ5dGUuXG4gICAgfVxuICAgIHdoaWxlIChuID49IF9hcmM0X292ZXJmbG93KSB7ICAgICAgIC8vIFRvIGF2b2lkIHJvdW5kaW5nIHBhc3Qgb3ZlcmZsb3csIGJlZm9yZSBhZGRpbmdcbiAgICAgIG4gLz0gMjsgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyAgIGxhc3QgYnl0ZSwgc2hpZnQgZXZlcnl0aGluZ1xuICAgICAgZCAvPSAyOyAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vICAgcmlnaHQgdXNpbmcgaW50ZWdlciBtYXRoIHVudGlsXG4gICAgICB4ID4+Pj0gMTsgICAgICAgICAgICAgICAgICAgICAgICAgLy8gICB3ZSBoYXZlIGV4YWN0bHkgdGhlIGRlc2lyZWQgYml0cy5cbiAgICB9XG4gICAgcmV0dXJuIChuICsgeCkgLyBkOyAgICAgICAgICAgICAgICAgLy8gRm9ybSB0aGUgbnVtYmVyIHdpdGhpbiBbMCwgMSkuXG4gIH1cblxuICBnKGNvdW50KSB7XG4gICAgLy8gVGhlIFwiZ1wiIG1ldGhvZCByZXR1cm5zIHRoZSBuZXh0IChjb3VudCkgb3V0cHV0cyBhcyBvbmUgbnVtYmVyLlxuICAgIGxldCB0LCByID0gMCwge2ksaixTfSA9IHRoaXM7XG4gICAgd2hpbGUgKGNvdW50LS0pIHtcbiAgICAgIHQgPSBTW2kgPSAweGZmICYgKGkgKyAxKV07XG4gICAgICByID0gciAqIDI1NiArIFNbMHhmZiAmICgoU1tpXSA9IFNbaiA9IDB4ZmYgJiAoaiArIHQpXSkgKyAoU1tqXSA9IHQpKV07XG4gICAgfVxuICAgIHRoaXMuaSA9IGk7XG4gICAgdGhpcy5qID0gajtcbiAgICByZXR1cm4gcjtcbiAgfVxuXG4gIGNvcHkoZiwgdCkge1xuICAgIHQuaSA9IGYuaTtcbiAgICB0LmogPSBmLmo7XG4gICAgdC5TID0gWy4uLiBmLlNdO1xuICAgIHJldHVybiB0O1xuICB9XG5cbiAgbWl4a2V5KHNlZWQsIGtleSkge1xuICAgIHNlZWQgPSBzZWVkICsgJyc7XG4gICAgbGV0IHNtZWFyPTAsIGo9MDtcbiAgICB3aGlsZSAoaiA8IHNlZWQubGVuZ3RoKSB7XG4gICAgICBrZXlbMHhmZiAmIGpdID1cbiAgICAgICAgMHhmZiAmICgoc21lYXIgXj0ga2V5WzB4ZmYgJiBqXSAqIDE5KSArIHNlZWQuY2hhckNvZGVBdChqKyspKTtcbiAgICB9XG4gICAgcmV0dXJuIGtleVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHBybmdfYXJjNDtcbmV4cG9ydCB7IHBybmdfYXJjNCB9O1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9YXJjNC5tanMubWFwXG4iLCJmdW5jdGlvbiB0KHQsaSl7bGV0IHI9bmV3IGUodCksbz0oKT0+ci5uZXh0KCk7cmV0dXJuIG8uZG91YmxlPW8sby5pbnQzMj0oKT0+MHxyLmcoNCksby5xdWljaz0oKT0+ci5nKDQpLzQyOTQ5NjcyOTYsZnVuY3Rpb24odCxlLGkpe2xldCByPWkmJmkuc3RhdGU7ciYmKFwib2JqZWN0XCI9PXR5cGVvZiByJiZlLmNvcHkocixlKSx0LnN0YXRlPSgpPT5lLmNvcHkoZSx7fSkpfShvLHIsaSksb31jbGFzcyBle2NvbnN0cnVjdG9yKHQpe251bGw9PXQmJih0PStuZXcgRGF0ZSk7bGV0IGUsaSxyLG89dGhpcy5taXhrZXkodCxbXSksbj1bXSxzPW8ubGVuZ3RoO2Zvcih0aGlzLmk9dGhpcy5qPWU9aT0wLHRoaXMuUz1uLHN8fChvPVtzKytdKTtlPD0yNTU7KW5bZV09ZSsrO2ZvcihlPTA7ZTw9MjU1O2UrKyluW2VdPW5baT0yNTUmaStvW2Ulc10rKHI9bltlXSldLG5baV09cjt0aGlzLmcoMjU2KX1uZXh0KCl7bGV0IHQ9dGhpcy5nKDYpLGU9MjgxNDc0OTc2NzEwNjU2LGk9MDtmb3IoO3Q8NDUwMzU5OTYyNzM3MDQ5NjspdD0yNTYqKHQraSksZSo9MjU2LGk9dGhpcy5nKDEpO2Zvcig7dD49OTAwNzE5OTI1NDc0MDk5MjspdC89MixlLz0yLGk+Pj49MTtyZXR1cm4odCtpKS9lfWcodCl7bGV0IGUsaT0wLHtpOnIsajpvLFM6bn09dGhpcztmb3IoO3QtLTspZT1uW3I9MjU1JnIrMV0saT0yNTYqaStuWzI1NSYobltyXT1uW289MjU1Jm8rZV0pKyhuW29dPWUpXTtyZXR1cm4gdGhpcy5pPXIsdGhpcy5qPW8saX1jb3B5KHQsZSl7cmV0dXJuIGUuaT10LmksZS5qPXQuaixlLlM9Wy4uLnQuU10sZX1taXhrZXkodCxlKXt0Kz1cIlwiO2xldCBpPTAscj0wO2Zvcig7cjx0Lmxlbmd0aDspZVsyNTUmcl09MjU1JihpXj0xOSplWzI1NSZyXSkrdC5jaGFyQ29kZUF0KHIrKyk7cmV0dXJuIGV9fWV4cG9ydCBkZWZhdWx0IHQ7ZXhwb3J0e3QgYXMgcHJuZ19hcmM0fTtcbiIsImltcG9ydCAqIGFzIGFzc2VydCBmcm9tICd1dnUvYXNzZXJ0J1xuaW1wb3J0IHt0ZXN0X3BybmdfYWxnfSBmcm9tICcuL19jb21tb24ubWpzJ1xuXG5pbXBvcnQgeyBwcm5nX2FyYzQgfSBmcm9tICdlc20tc2VlZHJhbmRvbSdcbmltcG9ydCB7IHBybmdfYXJjNCBhcyBwcm5nX2FyYzRfaXNvbGF0ZWQgfSBmcm9tICdlc20tc2VlZHJhbmRvbS9lc20vYXJjNC5tanMnXG5pbXBvcnQgeyBwcm5nX2FyYzQgYXMgcHJuZ19hcmM0X21pbmlmeSB9IGZyb20gJ2VzbS1zZWVkcmFuZG9tL2VzbS9hcmM0Lm1pbi5tanMnXG5cbmNvbnN0IGNqc19wcm5nX2FyYzQgPSByZXF1aXJlKCdzZWVkcmFuZG9tJylcblxuZGVzY3JpYmUoJ2FyYzQnLCAoKSA9PiB7XG4gIGxldCBfYW5zX3NoYXJlZCA9XG4gICAgWyAwLjczOTY3NTc2MDAwNDE1NjcsIDAuMjEyNTIyOTcxMDkyMDkwMywgMC42NjUzMDYxMzE4Njc4ODk4IF1cbiAgY29uc3Qgc25hcCA9IHtcbiAgICBzZWVkOiAnYW4gZXhhbXBsZSBzZWVkIHN0cmluZycsXG4gICAgZGlyZWN0OiBfYW5zX3NoYXJlZCxcbiAgICBxdWljazogWzAuNzM5Njc1NzU5ODAzNTAzOCwwLjg2MTc5Nzg4MTc3ODMyOTYsMC40MDU4ODA1OTk1MTU1MTI2XSxcbiAgICBpbnQzMjogWy0xMTE4MDg0MDk4LC01OTM1NzM1NzgsMTc0MzI0MzkwMV0sXG4gICAgZG91YmxlOiBfYW5zX3NoYXJlZCxcbiAgfVxuXG4gIGRlc2NyaWJlKCdzaGFyZWQnLCAoKSA9PlxuICAgIHRlc3RfcHJuZ19hbGcoJ2FyYzQnLCBwcm5nX2FyYzQsIHNuYXApKVxuXG4gIGRlc2NyaWJlKCdpc29sYXRlZCcsICgpID0+XG4gICAgdGVzdF9wcm5nX2FsZygnYXJjNCcsIHBybmdfYXJjNF9pc29sYXRlZCwgc25hcCkpXG5cbiAgZGVzY3JpYmUoJ2lzb2xhdGVkIG1pbmlmaWVkJywgKCkgPT5cbiAgICB0ZXN0X3BybmdfYWxnKCdhcmM0JywgcHJuZ19hcmM0X21pbmlmeSwgc25hcCkpXG5cbiAgaWYgKGNqc19wcm5nX2FyYzQpXG4gICAgZGVzY3JpYmUoJ29yaWdpbmFsIHNlZWRyYW5kb20gKENvbW1vbkpTKScsICgpID0+XG4gICAgICB0ZXN0X3BybmdfYWxnKCdhcmM0JywgY2pzX3BybmdfYXJjNCwgc25hcCkpXG59KVxuIl0sIm5hbWVzIjpbImtsZXVyIiwiZGlmZi5kaWZmTGluZXMiLCJhc3NlcnQuc25hcHNob3QiLCJfcHJuZ19yZXN0b3JlIiwicHJuZ19hbGVhIiwiQWxlYUdlbiIsInBybmdfYWxlYV9pc29sYXRlZCIsInBybmdfYWxlYV9taW5pZnkiLCJfcHJuZ194b3JfY29yZSIsInBybmdfeG9yMTI4IiwiWG9yMTI4R2VuIiwidCIsInBybmdfeG9yMTI4X2lzb2xhdGVkIiwicHJuZ194b3IxMjhfbWluaWZ5IiwicHJuZ190eWNoZWkiLCJUeWNoZWlHZW4iLCJlIiwicHJuZ190eWNoZWlfaXNvbGF0ZWQiLCJwcm5nX3R5Y2hlaV9taW5pZnkiLCJwcm5nX3hvcndvdyIsIlhvcldvd0dlbiIsInBybmdfeG9yd293X2lzb2xhdGVkIiwicHJuZ194b3J3b3dfbWluaWZ5IiwicHJuZ194b3I0MDk2IiwiWG9yNDA5NkdlbiIsInBybmdfeG9yNDA5Nl9pc29sYXRlZCIsInBybmdfeG9yNDA5Nl9taW5pZnkiLCJwcm5nX3hvcnNoaWZ0NyIsIlhvclNoaWZ0N0dlbiIsInBybmdfeG9yc2hpZnQ3X2lzb2xhdGVkIiwicHJuZ194b3JzaGlmdDdfbWluaWZ5IiwicHJuZ19hcmM0IiwiQVJDNEdlbiIsIl9hcmM0X3N0YXJ0ZGVub20iLCJfYXJjNF9zaWduaWZpY2FuY2UiLCJfYXJjNF9vdmVyZmxvdyIsInBybmdfYXJjNF9pc29sYXRlZCIsInBybmdfYXJjNF9taW5pZnkiXSwibWFwcGluZ3MiOiI7OztDQUVBLElBQUksV0FBVyxFQUFFLG1CQUFtQixFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQztDQUNqRSxJQUFJLE9BQU8sT0FBTyxLQUFLLFdBQVcsRUFBRTtDQUNwQyxDQUFDLENBQUMsRUFBRSxXQUFXLEVBQUUsbUJBQW1CLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxHQUFHLE9BQU8sQ0FBQyxHQUFHLEVBQUU7Q0FDdEUsQ0FBQyxLQUFLLEdBQUcsT0FBTyxDQUFDLE1BQU0sSUFBSSxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQztDQUNoRCxDQUFDO0FBQ0Q7Q0FDQSxNQUFNLENBQUMsR0FBRztDQUNWLENBQUMsT0FBTyxFQUFFLENBQUMsbUJBQW1CLElBQUksUUFBUSxJQUFJLElBQUksSUFBSSxJQUFJLEtBQUssTUFBTTtDQUNyRSxFQUFFLFdBQVcsSUFBSSxJQUFJLElBQUksV0FBVyxLQUFLLEdBQUcsSUFBSSxLQUFLO0NBQ3JELEVBQUU7QUFDRjtDQUNBO0NBQ0EsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7Q0FDbEIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7Q0FDbEIsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7Q0FDakIsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7Q0FDcEIsQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7Q0FDdkIsQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7Q0FDckIsQ0FBQyxNQUFNLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7Q0FDcEIsQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUM7QUFDM0I7Q0FDQTtDQUNBLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO0NBQ3BCLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO0NBQ2xCLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO0NBQ3BCLENBQUMsTUFBTSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO0NBQ3JCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO0NBQ25CLENBQUMsT0FBTyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO0NBQ3RCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO0NBQ25CLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO0NBQ3BCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO0NBQ25CLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDO0FBQ25CO0NBQ0E7Q0FDQSxDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQztDQUN0QixDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQztDQUNwQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQztDQUN0QixDQUFDLFFBQVEsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQztDQUN2QixDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQztDQUNyQixDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQztDQUN4QixDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQztDQUNyQixDQUFDLE9BQU8sRUFBRSxJQUFJLENBQUMsRUFBRSxFQUFFLEVBQUUsQ0FBQztDQUN0QixDQUFDLENBQUM7QUFDRjtDQUNBLFNBQVMsR0FBRyxDQUFDLEdBQUcsRUFBRSxHQUFHLEVBQUU7Q0FDdkIsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLEVBQUUsQ0FBQztDQUM5QixDQUFDLE9BQU8sQ0FBQyxHQUFHLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Q0FDN0IsRUFBRSxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2YsRUFBRSxHQUFHLElBQUksR0FBRyxDQUFDLElBQUksQ0FBQztDQUNsQixFQUFFLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDO0NBQ25CLEVBQUUsSUFBSSxHQUFHLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsRUFBRTtDQUMvQixHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Q0FDcEQsR0FBRztDQUNILEVBQUU7Q0FDRixDQUFDLE9BQU8sR0FBRyxHQUFHLEdBQUcsR0FBRyxHQUFHLENBQUM7Q0FDeEIsQ0FBQztBQUNEO0NBQ0EsU0FBUyxLQUFLLENBQUMsR0FBRyxFQUFFLElBQUksRUFBRTtDQUMxQixDQUFDLElBQUksR0FBRyxHQUFHLEVBQUUsR0FBRyxFQUFFLElBQUksRUFBRSxDQUFDO0FBQ3pCO0NBQ0EsQ0FBQyxHQUFHLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQy9CLENBQUMsR0FBRyxDQUFDLElBQUksR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUM3QixDQUFDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDM0IsQ0FBQyxHQUFHLENBQUMsTUFBTSxHQUFHLENB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Q0FBQztDQUN2QixNQUFNLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtDQUN4QyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUU7Q0FDbEMsYUFBYSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7Q0FDeEQsT0FBTztDQUNQLEtBQUs7QUFDTDtDQUNBO0NBQ0EsSUFBSSxPQUFPLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDbkMsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDMUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDN0M7Q0FDQSxJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ2YsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNmO0NBQ0E7Q0FDQSxJQUFJLEtBQUssQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0NBQzlCLE1BQU0sSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0NBQ2xCLEtBQUs7Q0FDTCxHQUFHO0FBQ0g7Q0FDQSxFQUFFLElBQUksR0FBRztDQUNUO0NBQ0EsSUFBSSxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO0NBQzNCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztDQUNoRCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7Q0FDNUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0NBQzNDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztDQUMxQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztDQUM3RCxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDYixJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztDQUN6QixJQUFJLE9BQU8sQ0FBQyxDQUFDO0NBQ2IsR0FBRztBQUNIO0NBQ0EsRUFBRSxJQUFJ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RyxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNsQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDO0NBQ3BCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ2xDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Q0FDcEIsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxLQUFLLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUM1QyxJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Q0FDN0IsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ3hDLElBQUksT0FBTyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Q0FDaEMsR0FBRztBQUNIO0NBQ0EsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRTtDQUNiLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2QsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDZCxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNkLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2QsSUFBSSxPQUFPLENBQUMsQ0FBQztDQUNiLEdBQUc7Q0FDSCxDQUFDO0FBQ0Q7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TUUsU0FBTyxDQUFDO0NBQ2QsRUFBRSxXQUFXLENBQUMsSUFBSSxFQUFFO0NBQ3BCLElBQUksSUFBSSxJQUFJLElBQUksSUFBSSxFQUFFLElBQUksR0FBRyxFQUFFLElBQUksSUFBSSxDQUFDLENBQUM7QUFDekM7Q0FDQSxJQUFJLElBQUksQ0FBQyxHQUFHLFVBQVUsQ0FBQztBQUN2QjtDQUNBO0NBQ0EsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNmLElBQUksSUFBSSxDQUFDLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDeEIsSUFBSSxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUN4QixJQUFJLElBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ3hCLElBQUksSUFBSSxDQUFDLEVBQUUsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7Q0FDMUIsSUFBSSxJQUFJLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRTtDQUN0QyxJQUFJLElBQUksQ0FBQyxFQUFFLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDO0NBQzFCLElBQUksSUFBSSxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUU7Q0FDdEMsSUFBSSxJQUFJLENBQUMsRUFBRSxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztDQUMxQixJQUFJLElBQUksSUFBSSxDQUFDLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFO0FBQ3RDO0NBQ0EsSUFBSSxTQUFTLElBQUksQ0FBQyxJQUFJLEVBQUU7Q0FDeEIsTUFBTSxJQUFJLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO0NBQzFCLE1BQU0sS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7Q0FDNUMsUUFBUSxDQUFDLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNoQyxRQUFRLElBQUksQ0FBQyxHQUFHLG1CQUFtQixHQUFHLENBQUMsQ0FBQztDQUN4QyxRQUFRLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO0NBQ3BCLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztDQUNmLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztDQUNmLFFBQVEsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDLENBQUM7Q0FDcEIsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDO0NBQ2YsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLFdBQVcsQ0FBQztDQUM3QixPQUFPO0NBQ1AsTUFBTSxPQUFPLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxzQkFBc0IsQ0FBQztDQUNoRCxLQUFLO0NBQ0wsR0FBRztBQUNIO0NBQ0EsRUFBRSxJQUFJLEdBQUc7Q0FDVCxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsR0FBRyxJQUFJLENBQUM7Q0FDNUIsSUFBSSxJQUFJLENBQUMsR0FBRyxPQUFPLEdBQUcsRUFBRSxHQUFHLENBQUMsR0FBRyxzQkFBc0IsQ0FBQztDQUN0RCxJQUFJLElBQUksQ0FBQyxFQUFFLEdBQUcsRUFBRSxDQUFDO0NBQ2pCLElBQUksSUFBSSxDQUFDLEVBQUUsR0FBRyxFQUFFLENBQUM7Q0FDakIsSUFBSSxPQUFPLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0NBQzFDLEdBQUc7QUFDSDtDQUNBLEVBQUUsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUU7Q0FDYixJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNkLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDO0NBQ2hCLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDO0NBQ2hCLElBQUksQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDO0NBQ2hCLElBQUksT0FBTyxDQUFDLENBQUM7Q0FDYixHQUFHO0NBQ0g7O0NDMUVBLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMscUJBQXFCLEVBQUUsT0FBTyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLFFBQVEsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxFQUFDLENBQUMsT0FBTyxzQkFBc0IsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsc0JBQXNCLENBQUMsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7O0NDT3IxQixNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsd0JBQXdCLEVBQUM7QUFDdkQ7Q0FDQSxRQUFRLENBQUMsTUFBTSxFQUFFLE1BQU07Q0FDdkIsRUFBRSxJQUFJLFdBQVcsR0FBRyxFQUFFLGtCQUFrQixFQUFFLGtCQUFrQixFQUFFLG1CQUFtQixHQUFFO0NBQ25GLEVBQUUsTUFBTSxJQUFJLEdBQUc7Q0FDZixJQUFJLElBQUksRUFBRSx3QkFBd0I7Q0FDbEMsSUFBSSxNQUFNLEVBQUUsV0FBVztDQUN2QixJQUFJLEtBQUssRUFBRSxXQUFXO0NBQ3RCLElBQUksS0FBSyxFQUFFLEVBQUUsVUFBVSxFQUFFLENBQUMsU0FBUyxFQUFFLFVBQVUsRUFBRTtDQUNqRCxJQUFJLE1BQU0sRUFBRSxFQUFFLGtCQUFrQixFQUFFLGtCQUFrQixFQUFFLGtCQUFrQixFQUFFO0NBQzFFLElBQUc7QUFDSDtDQUNBLEVBQUUsUUFBUSxDQUFDLFFBQVEsRUFBRTtDQUNyQixJQUFJLGFBQWEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxFQUFDO0FBQzNDO0NBQ0EsRUFBRSxRQUFRLENBQUMsVUFBVSxFQUFFO0NBQ3ZCLElBQUksYUFBYSxDQUFDLE1BQU0sRUFBRUMsV0FBa0IsRUFBRSxJQUFJLENBQUMsRUFBQztBQUNwRDtDQUNBLEVBQUUsUUFBUSxDQUFDLG1CQUFtQixFQUFFO0NBQ2hDLElBQUksYUFBYSxDQUFDLE1BQU0sRUFBRUMsQ0FBZ0IsRUFBRSxJQUFJLENBQUMsRUFBQztBQUNsRDtDQUNBLEVBQUUsSUFBSSxhQUFhO0NBQ25CLElBQUksUUFBUSxDQUFDLGdDQUFnQyxFQUFFO0NBQy9DLE1BQU0sYUFBYSxDQUFDLE1BQU0sRUFBRSxhQUFhLEVBQUUsSUFBSSxDQUFDLEVBQUM7Q0FDakQsQ0FBQzs7Q0MvQkQsU0FBU0osZUFBYSxDQUFDLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFO0NBQ3ZDLEVBQUUsSUFBSSxLQUFLLEdBQUcsSUFBSSxJQUFJLElBQUksQ0FBQyxLQUFLLENBQUM7Q0FDakMsRUFBRSxJQUFJLEtBQUssRUFBRTtDQUNiLElBQUksSUFBSSxPQUFPLEtBQUssQ0FBQyxJQUFJLFFBQVEsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztDQUN0RCxJQUFJLElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxFQUFFLENBQUMsQ0FBQztDQUN2QyxHQUFHO0NBQ0gsQ0FBQztBQUNEO0NBQ0EsU0FBU0ssZ0JBQWMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxFQUFFO0NBQ2xDLEVBQUUsSUFBSSxJQUFJLEdBQUcsTUFBTSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLElBQUksV0FBVyxDQUFDO0FBQ25EO0NBQ0EsRUFBRSxJQUFJLENBQUMsTUFBTSxHQUFHLE1BQU07Q0FDdEIsSUFBSSxJQUFJLEdBQUcsRUFBRSxHQUFHLEVBQUUsTUFBTSxDQUFDO0NBQ3pCLElBQUksR0FBRztDQUNQLE1BQU0sR0FBRyxHQUFHLEVBQUUsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFLENBQUM7Q0FDN0IsTUFBTSxHQUFHLEdBQUcsQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLFdBQVcsQ0FBQztDQUM1QyxNQUFNLE1BQU0sR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDO0NBQ3ZDLEtBQUssUUFBUSxNQUFNLEtBQUssQ0FBQyxFQUFFO0NBQzNCLElBQUksT0FBTyxNQUFNLENBQUM7Q0FDbEIsR0FBRyxDQUFDO0FBQ0o7Q0FDQSxFQUFFLElBQUksQ0FBQyxLQUFLLEdBQUcsTUFBTSxFQUFFLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxDQUFDO0FBQ25DO0NBQ0EsRUFBRSxJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksQ0FBQztBQUNwQjtDQUNBLEVBQUVMLGVBQWEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO0NBQ2hDLEVBQUUsT0FBTyxJQUFJLENBQUM7Q0FDZCxDQUFDO0FBQ0Q7Q0FDQTtDQUNBLFNBQVNNLGFBQVcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFO0NBQ2pDLEVBQUUsSUFBSSxFQUFFLEdBQUcsSUFBSUMsV0FBUyxDQUFDLElBQUksQ0FBQyxDQUFDO0NBQy9CLEVBQUUsT0FBT0YsZ0JBQWMsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7Q0FDbEMsQ0FBQztBQUNEO0NBQ0EsTUFBTUUsV0FBUyxDQUFDO0NBQ2hCLEVBQUUsV0FBVyxDQUFDLElBQUksRUFBRTtDQUNwQixJQUFJLElBQUksSUFBSSxJQUFJLElBQUksRUFBRSxJQUFJLEdBQUcsRUFBRSxJQUFJLElBQUksQ0FBQyxDQUFDO0FBQ3pDO0NBQ0EsSUFBSSxJQUFJLE9BQU8sR0FBRyxFQUFFLENBQUM7QUFDckI7Q0FDQSxJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ2YsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNmLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDZixJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2Y7Q0FDQSxJQUFJLElBQUksSUFBSSxNQUFNLElBQUksR0FBRyxDQUFDLENBQUMsRUFBRTtDQUM3QjtDQUNBLE1BQU0sSUFBSSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUM7Q0FDcEIsS0FBSyxNQUFNO0NBQ1g7Q0FDQSxNQUFNLE9BQU8sSUFBSSxJQUFJLENBQUM7Q0FDdEIsS0FBSztBQUNMO0NBQ0E7Q0FDQSxJQUFJLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRTtDQUNsRCxNQUFNLElBQUksQ0FBQyxDQUFDLElBQUksT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDMUMsTUFBTSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Q0FDbEIsS0FBSztDQUNMLEdBQUc7QUFDSDtDQUNBLEVBQUUsSUFBSSxHQUFHO0NBQ1QsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO0NBQ3pCLElBQUksSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztDQUMxQixJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ2YsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNmLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDZixJQUFJLE9BQU8sSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNyRCxHQUFHO0FBQ0g7Q0FDQSxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0NBQ2IsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDZCxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNkLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2QsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDZCxJQUFJLE9BQU8sQ0FBQyxDQUFDO0NBQ2IsR0FBRztDQUNIOztDQzdFQSxTQUFTQyxHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxRQUFRLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzs7Q0NPcHFCLE1BQU0sZUFBZSxHQUFHLE9BQU8sQ0FBQywwQkFBMEIsRUFBQztBQUMzRDtDQUNBLFFBQVEsQ0FBQyxRQUFRLEVBQUUsTUFBTTtDQUN6QixFQUFFLElBQUksV0FBVyxHQUFHLENBQUMsa0JBQWtCLENBQUMsa0JBQWtCLENBQUMsa0JBQWtCLEVBQUM7Q0FDOUUsRUFBRSxNQUFNLElBQUksR0FBRztDQUNmLElBQUksSUFBSSxFQUFFLHdCQUF3QjtDQUNsQyxJQUFJLE1BQU0sRUFBRSxXQUFXO0NBQ3ZCLElBQUksS0FBSyxFQUFFLFdBQVc7Q0FDdEIsSUFBSSxLQUFLLEVBQUUsQ0FBQyxDQUFDLFNBQVMsRUFBRSxDQUFDLFVBQVUsRUFBRSxVQUFVLENBQUM7Q0FDaEQsSUFBSSxNQUFNLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxtQkFBbUIsQ0FBQyxrQkFBa0IsQ0FBQztDQUN2RSxJQUFHO0FBQ0g7Q0FDQSxFQUFFLFFBQVEsQ0FBQyxRQUFRLEVBQUU7Q0FDckIsSUFBSSxhQUFhLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxJQUFJLENBQUMsRUFBQztBQUMvQztDQUNBLEVBQUUsUUFBUSxDQUFDLFVBQVUsRUFBRTtDQUN2QixJQUFJLGFBQWEsQ0FBQyxRQUFRLEVBQUVDLGFBQW9CLEVBQUUsSUFBSSxDQUFDLEVBQUM7QUFDeEQ7Q0FDQSxFQUFFLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRTtDQUNoQyxJQUFJLGFBQWEsQ0FBQyxRQUFRLEVBQUVDLEdBQWtCLEVBQUUsSUFBSSxDQUFDLEVBQUM7QUFDdEQ7Q0FDQSxFQUFFLElBQUksZUFBZTtDQUNyQixJQUFJLFFBQVEsQ0FBQyxnQ0FBZ0MsRUFBRTtDQUMvQyxNQUFNLGFBQWEsQ0FBQyxRQUFRLEVBQUUsZUFBZSxFQUFFLElBQUksQ0FBQyxFQUFDO0NBQ3JELENBQUM7O0NDL0JELFNBQVNWLGVBQWEsQ0FBQyxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRTtDQUN2QyxFQUFFLElBQUksS0FBSyxHQUFHLElBQUksSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDO0NBQ2pDLEVBQUUsSUFBSSxLQUFLLEVBQUU7Q0FDYixJQUFJLElBQUksT0FBTyxLQUFLLENBQUMsSUFBSSxRQUFRLEVBQUUsRUFBRSxDQUFDLElBQUksQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7Q0FDdEQsSUFBSSxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sRUFBRSxDQUFDLElBQUksQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7Q0FDdkMsR0FBRztDQUNILENBQUM7QUFDRDtDQUNBLFNBQVNLLGdCQUFjLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRTtDQUNsQyxFQUFFLElBQUksSUFBSSxHQUFHLE1BQU0sQ0FBQyxFQUFFLENBQUMsSUFBSSxFQUFFLEtBQUssQ0FBQyxJQUFJLFdBQVcsQ0FBQztBQUNuRDtDQUNBLEVBQUUsSUFBSSxDQUFDLE1BQU0sR0FBRyxNQUFNO0NBQ3RCLElBQUksSUFBSSxHQUFHLEVBQUUsR0FBRyxFQUFFLE1BQU0sQ0FBQztDQUN6QixJQUFJLEdBQUc7Q0FDUCxNQUFNLEdBQUcsR0FBRyxFQUFFLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxDQUFDO0NBQzdCLE1BQU0sR0FBRyxHQUFHLENBQUMsRUFBRSxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsSUFBSSxXQUFXLENBQUM7Q0FDNUMsTUFBTSxNQUFNLEdBQUcsQ0FBQyxHQUFHLEdBQUcsR0FBRyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztDQUN2QyxLQUFLLFFBQVEsTUFBTSxLQUFLLENBQUMsRUFBRTtDQUMzQixJQUFJLE9BQU8sTUFBTSxDQUFDO0NBQ2xCLEdBQUcsQ0FBQztBQUNKO0NBQ0EsRUFBRSxJQUFJLENBQUMsS0FBSyxHQUFHLE1BQU0sRUFBRSxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsQ0FBQztBQUNuQztDQUNBLEVBQUUsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUM7QUFDcEI7Q0FDQSxFQUFFTCxlQUFhLENBQUMsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztDQUNoQyxFQUFFLE9BQU8sSUFBSSxDQUFDO0NBQ2QsQ0FBQztBQUNEO0NBQ0E7Q0FDQSxTQUFTVyxhQUFXLENBQUMsSUFBSSxFQUFFLElBQUksRUFBRTtDQUNqQyxFQUFFLElBQUksRUFBRSxHQUFHLElBQUlDLFdBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQztDQUMvQixFQUFFLE9BQU9QLGdCQUFjLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO0NBQ2xDLENBQUM7QUFDRDtDQUNBLE1BQU1PLFdBQVMsQ0FBQztDQUNoQixFQUFFLFdBQVcsQ0FBQyxJQUFJLEVBQUU7Q0FDcEIsSUFBSSxJQUFJLElBQUksSUFBSSxJQUFJLEVBQUUsSUFBSSxHQUFHLEVBQUUsSUFBSSxJQUFJLENBQUMsQ0FBQztBQUN6QztDQUNBLElBQUksSUFBSSxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ3JCO0NBQ0EsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNmLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDZixJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUcsVUFBVSxHQUFHLENBQUMsQ0FBQztDQUM1QixJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUcsVUFBVSxDQUFDO0FBQ3hCO0NBQ0EsSUFBSSxJQUFJLElBQUksS0FBSyxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFO0NBQ25DO0NBQ0EsTUFBTSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxHQUFHLFdBQVcsSUFBSSxDQUFDLENBQUM7Q0FDeEMsTUFBTSxJQUFJLENBQUMsQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLENBQUM7Q0FDeEIsS0FBSyxNQUFNO0NBQ1g7Q0FDQSxNQUFNLE9BQU8sSUFBSSxJQUFJLENBQUM7Q0FDdEIsS0FBSztBQUNMO0NBQ0E7Q0FDQSxJQUFJLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxHQUFHLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRTtDQUNsRCxNQUFNLElBQUksQ0FBQyxDQUFDLElBQUksT0FBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDMUMsTUFBTSxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Q0FDbEIsS0FBSztDQUNMLEdBQUc7QUFDSDtDQUNBLEVBQUUsSUFBSSxHQUFHO0NBQ1QsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO0NBQ3pCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ2xDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7Q0FDcEIsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDbEMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztDQUNwQixJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLEtBQUssRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQzVDLElBQUksSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztDQUM3QixJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksRUFBRSxLQUFLLENBQUMsS0FBSyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDeEMsSUFBSSxPQUFPLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztDQUNoQyxHQUFHO0FBQ0g7Q0FDQSxFQUFFLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFO0NBQ2IsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDZCxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNkLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2QsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDZCxJQUFJLE9BQU8sQ0FBQyxDQUFDO0NBQ2IsR0FBRztDQUNIOztDQ2pGQSxTQUFTSixHQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE9BQU8sU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxDQUFDLEVBQUUsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxRQUFRLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUlLLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNQSxHQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxD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QUcsQ0FBQyxDQUFDO0NBQ2YsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUNmLElBQUksT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLE1BQU0sR0FBRyxDQUFDLENBQUM7Q0FDckMsUUFBUSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDdEQsR0FBRztBQUNIO0NBQ0EsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRTtDQUNiLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2QsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDZCxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNkLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2QsSUFBSSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDZCxJQUFJLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNkLElBQUksT0FBTyxDQUFDLENBQUM7Q0FDYixHQUFHO0NBQ0g7O0NDckZBLFNBQVNULEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLFFBQVEsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSUssR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU1BLEdBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxNQUFNLEdBQUcsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEdBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMs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Q0FBQyxDQUFDO0NBQ1osTUFBTSxLQUFLLEdBQUcsSUFBSSxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0NBQzNDLEtBQUs7Q0FDTDtDQUNBLElBQUksS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0NBQ3pDO0NBQ0EsTUFBTSxJQUFJLElBQUksRUFBRSxDQUFDLElBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO0NBQzdEO0NBQ0EsTUFBTSxJQUFJLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQztDQUN6QixNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0NBQ25CLE1BQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7Q0FDcEIsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztDQUNsQixNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO0NBQ3BCLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFO0NBQ2xCLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLFVBQVUsSUFBSSxDQUFDLENBQUM7Q0FDakMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztDQUNwQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDakMsT0FBTztDQUNQLEtBQUs7Q0FDTDtDQUNBLElBQUksSUFBSSxDQUFDLElBQUksR0FBRyxFQUFFO0NBQ2xCLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLElBQUksQ0FBQyxNQUFNLElB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LEVBQUUsR0FBRyxDQUFDLEVBQUUsVUFBVSxDQUFDLE9BQU8sQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxFQUFDLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsR0FBRyxRQUFRLEVBQUUsT0FBTyxDQUFDLEVBQUUsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUlLLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNQSxHQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENB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Q0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsRUFBRTtDQUN4QyxRQUFRLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLEVBQUU7Q0FDbEMsYUFBYSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUM7Q0FDeEQsT0FBTztDQUNQLEtBQUs7QUFDTDtDQUNBO0NBQ0EsSUFBSSxPQUFPLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7Q0FDbkMsSUFBSSxLQUFLLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUM7Q0FDMUMsSUFBSSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDN0M7Q0FDQSxJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0NBQ2YsSUFBSSxJQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNmO0NBQ0E7Q0FDQSxJQUFJLEtBQUssQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0NBQzlCLE1BQU0sSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0NBQ2xCLEtBQUs7Q0FDTCxHQUFHO0FBQ0g7Q0FDQSxFQUFFLElBQUksR0FBRztDQUNUO0NBQ0EsSUFBSSxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO0NBQzNCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztDQUNoRCxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDLENBQUM7Q0FDNUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0NBQzNDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztDQUMxQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztDQUM3RCxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7Q0FDYixJQUFJLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztDQUN6QixJQUFJLE9BQU8sQ0FBQyxDQUFDO0NBQ2IsR0FBRztBQUNIO0NBQ0EsRUFBRSxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRTtDQUNiLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ3BCLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0NBQ2QsSUFBSSxPQUFPLENBQUMsQ0FBQztDQUNiLEdBQUc7Q0FDSDs7Q0N0RkEsU0FBU2pCLEdBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLENBQUMsRUFBRSxVQUFVLENBQUMsT0FBTyxDQUFDLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxFQUFFLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEVBQUMsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxHQUFHLFFBQVEsRUFBRSxPQUFPLENBQUMsRUFBRSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSUssR0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU1BLEdBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFFLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FB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QUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFDLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRSxnQkFBZ0IsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxPQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsT0FBTyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUM7O0NDT3IzQixNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsWUFBWSxFQUFDO0FBQzNDO0NBQ0EsUUFBUSxDQUFDLE1BQU0sRUFBRSxNQUFNO0NBQ3ZCLEVBQUUsSUFBSSxXQUFXO0NBQ2pCLElBQUksRUFBRSxrQkFBa0IsRUFBRSxrQkFBa0IsRUFBRSxrQkFBa0IsR0FBRTtDQUNsRSxFQUFFLE1BQU0sSUFBSSxHQUFHO0NBQ2YsSUFBSSxJQUFJLEVBQUUsd0JBQXdCO0NBQ2xDLElBQUksTUFBTSxFQUFFLFdBQVc7Q0FDdkIsSUFBSSxLQUFLLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQyxrQkFBa0IsQ0FBQyxrQkFBa0IsQ0FBQztDQUNyRSxJQUFJLEtBQUssRUFBRSxDQUFDLENBQUMsVUFBVSxDQUFDLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQztDQUM5QyxJQUFJLE1BQU0sRUFBRSxXQUFXO0NBQ3ZCLElBQUc7QUFDSDtDQUNBLEVBQUUsUUFBUSxDQUFDLFFBQVEsRUFBRTtDQUNyQixJQUFJLGFBQWEsQ0FBQyxNQUFNLEVBQUUsU0FBUyxFQUFFLElBQUksQ0FBQyxFQUFDO0FBQzNDO0NBQ0EsRUFBRSxRQUFRLENBQUMsVUFBVSxFQUFFO0NBQ3ZCLElBQUksYUFBYSxDQUFDLE1BQU0sRUFBRW9CLFdBQWtCLEVBQUUsSUFBSSxDQUFDLEVBQUM7QUFDcEQ7Q0FDQSxFQUFFLFFBQVEsQ0FBQyxtQkFBbUIsRUFBRTtDQUNoQyxJQUFJLGFBQWEsQ0FBQyxNQUFNLEVBQUVDLEdBQWdCLEVBQUUsSUFBSSxDQUFDLEVBQUM7QUFDbEQ7Q0FDQSxFQUFFLElBQUksYUFBYTtDQUNuQixJQUFJLFFBQVEsQ0FBQyxnQ0FBZ0MsRUFBRTtDQUMvQyxNQUFNLGFBQWEsQ0FBQyxNQUFNLEVBQUUsYUFBYSxFQUFFLElBQUksQ0FBQyxFQUFDO0NBQ2pELENBQUM7Ozs7OzsifQ==
