(function () {
	'use strict';

	var has = Object.prototype.hasOwnProperty;

	function find(iter, tar, key) {
		for (key of iter.keys()) {
			if (dequal(key, tar)) return key;
		}
	}

	function dequal(foo, bar) {
		var ctor, len, tmp;
		if (foo === bar) return true;

		if (foo && bar && (ctor=foo.constructor) === bar.constructor) {
			if (ctor === Date) return foo.getTime() === bar.getTime();
			if (ctor === RegExp) return foo.toString() === bar.toString();

			if (ctor === Array) {
				if ((len=foo.length) === bar.length) {
					while (len-- && dequal(foo[len], bar[len]));
				}
				return len === -1;
			}

			if (ctor === Set) {
				if (foo.size !== bar.size) {
					return false;
				}
				for (len of foo) {
					tmp = len;
					if (tmp && typeof tmp === 'object') {
						tmp = find(bar, tmp);
						if (!tmp) return false;
					}
					if (!bar.has(tmp)) return false;
				}
				return true;
			}

			if (ctor === Map) {
				if (foo.size !== bar.size) {
					return false;
				}
				for (len of foo) {
					tmp = len[0];
					if (tmp && typeof tmp === 'object') {
						tmp = find(bar, tmp);
						if (!tmp) return false;
					}
					if (!dequal(len[1], bar.get(tmp))) {
						return false;
					}
				}
				return true;
			}

			if (ctor === ArrayBuffer) {
				foo = new Uint8Array(foo);
				bar = new Uint8Array(bar);
			} else if (ctor === DataView) {
				if ((len=foo.byteLength) === bar.byteLength) {
					while (len-- && foo.getInt8(len) === bar.getInt8(len));
				}
				return len === -1;
			}

			if (ArrayBuffer.isView(foo)) {
				if ((len=foo.byteLength) === bar.byteLength) {
					while (len-- && foo[len] === bar[len]);
				}
				return len === -1;
			}

			if (!ctor || typeof foo === 'object') {
				len = 0;
				for (ctor in foo) {
					if (has.call(foo, ctor) && ++len && !has.call(bar, ctor)) return false;
					if (!(ctor in bar) || !dequal(foo[ctor], bar[ctor])) return false;
				}
				return Object.keys(bar).length === len;
			}
		}

		return foo !== foo && bar !== bar;
	}

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

	var characterDiff = new Diff();
	function diffChars(oldStr, newStr, options) {
	  return characterDiff.diff(oldStr, newStr, options);
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

	function diffArrays(oldArr, newArr, callback) {
	  return arrayDiff.diff(oldArr, newArr, callback);
	}

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

	// TODO: want better diffing
	//~> complex items bail outright
	function arrays(input, expect) {
		let arr = diffArrays(input, expect);
		let i=0, j=0, k=0, tmp, val, char, isObj, str;
		let out = LOG('··', '[');

		for (; i < arr.length; i++) {
			char = (tmp = arr[i]).removed ? '--' : tmp.added ? '++' : '··';

			if (tmp.added) {
				out += colors[char]().underline(TITLE('Expected:')) + '\n';
			} else if (tmp.removed) {
				out += colors[char]().underline(TITLE('Actual:')) + '\n';
			}

			for (j=0; j < tmp.value.length; j++) {
				isObj = (tmp.value[j] && typeof tmp.value[j] === 'object');
				val = stringify(tmp.value[j]).split(/\r?\n/g);
				for (k=0; k < val.length;) {
					str = '  ' + val[k++] + (isObj ? '' : ',');
					if (isObj && k === val.length && (j + 1) < tmp.value.length) str += ',';
					out += LOG(char, str);
				}
			}
		}

		return out + LOG('··', ']');
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

	function chars(input, expect) {
		let arr = diffChars(input, expect);
		let i=0, output='', tmp;

		let l1 = input.length;
		let l2 = expect.length;

		let p1 = PRETTY(input);
		let p2 = PRETTY(expect);

		tmp = arr[i];

		if (l1 === l2) ; else if (tmp.removed && arr[i + 1]) {
			let del = tmp.count - arr[i + 1].count;
			if (del == 0) ; else if (del > 0) {
				expect = ' '.repeat(del) + expect;
				p2 = ' '.repeat(del) + p2;
				l2 += del;
			} else if (del < 0) {
				input = ' '.repeat(-del) + input;
				p1 = ' '.repeat(-del) + p1;
				l1 += -del;
			}
		}

		output += direct(p1, p2, l1, l2);

		if (l1 === l2) {
			for (tmp='  '; i < l1; i++) {
				tmp += input[i] === expect[i] ? ' ' : '^';
			}
		} else {
			for (tmp='  '; i < arr.length; i++) {
				tmp += ((arr[i].added || arr[i].removed) ? '^' : ' ').repeat(Math.max(arr[i].count, 0));
				if (i + 1 < arr.length && ((arr[i].added && arr[i+1].removed) || (arr[i].removed && arr[i+1].added))) {
					arr[i + 1].count -= arr[i].count;
				}
			}
		}

		return output + $.red(tmp);
	}

	function direct(input, expect, lenA = String(input).length, lenB = String(expect).length) {
		let gutter = 4;
		let lenC = Math.max(lenA, lenB);
		let typeA=typeof input, typeB=typeof expect;

		if (typeA !== typeB) {
			gutter = 2;

			let delA = gutter + lenC - lenA;
			let delB = gutter + lenC - lenB;

			input += ' '.repeat(delA) + $.dim(`[${typeA}]`);
			expect += ' '.repeat(delB) + $.dim(`[${typeB}]`);

			lenA += delA + typeA.length + 2;
			lenB += delB + typeB.length + 2;
			lenC = Math.max(lenA, lenB);
		}

		let output = colors['++']('++' + expect + ' '.repeat(gutter + lenC - lenB) + TITLE('(Expected)')) + '\n';
		return output + colors['--']('--' + input + ' '.repeat(gutter + lenC - lenA) + TITLE('(Actual)')) + '\n';
	}

	function sort(input, expect) {
		var k, i=0, tmp, isArr = Array.isArray(input);
		var keys=[], out=isArr ? Array(input.length) : {};

		if (isArr) {
			for (i=0; i < out.length; i++) {
				tmp = input[i];
				if (!tmp || typeof tmp !== 'object') out[i] = tmp;
				else out[i] = sort(tmp, expect[i]); // might not be right
			}
		} else {
			for (k in expect)
				keys.push(k);

			for (; i < keys.length; i++) {
				if (Object.prototype.hasOwnProperty.call(input, k = keys[i])) {
					if (!(tmp = input[k]) || typeof tmp !== 'object') out[k] = tmp;
					else out[k] = sort(tmp, expect[k]);
				}
			}

			for (k in input) {
				if (!out.hasOwnProperty(k)) {
					out[k] = input[k]; // expect didnt have
				}
			}
		}

		return out;
	}

	function circular() {
		var cache = new Set;
		return function print(key, val) {
			if (val === void 0) return '[__VOID__]';
			if (typeof val === 'number' && val !== val) return '[__NAN__]';
			if (!val || typeof val !== 'object') return val;
			if (cache.has(val)) return '[Circular]';
			cache.add(val); return val;
		}
	}

	function stringify(input) {
		return JSON.stringify(input, circular(), 2).replace(/"\[__NAN__\]"/g, 'NaN').replace(/"\[__VOID__\]"/g, 'undefined');
	}

	function compare(input, expect) {
		if (Array.isArray(expect)) return arrays(input, expect);
		if (expect instanceof RegExp) return chars(''+input, ''+expect);

		if (expect && typeof expect == 'object') {
			input = stringify(sort(input, expect));
			expect = stringify(expect);
		}

		let isA = typeof input == 'string';
		let isB = typeof expect == 'string';

		if (isA && /\r?\n/.test(input)) return lines(input, ''+expect);
		if (isB && /\r?\n/.test(expect)) return lines(''+input, expect);
		if (isA && isB) return chars(input, expect);

		return direct(input, expect);
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

	function equal(val, exp, msg) {
		assert(dequal(val, exp), val, exp, 'equal', compare, 'Expected values to be deeply equal:', msg);
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
	    //console.error(err.details)
	    console.error({[snap_name]: actual});
	    throw err
	  }
	}

	function test_prng_alg(name, prng_alg, snap) {
	  it(`${name} direct`, () => {
	    let prng = prng_alg(snap.seed, snap.opt);
	    let res = Array.from({length:3}, () => prng());
	    test_snap(res, snap.direct, 'direct');
	  });

	  it(`${name}.quick()`, () => {
	    let prng = prng_alg(snap.seed, snap.opt);
	    let res = Array.from({length:3}, () => prng.quick());
	    test_snap(res, snap.quick, 'quick');
	  });

	  it(`${name}.int32()`, () => {
	    let prng = prng_alg(snap.seed, snap.opt);
	    let res = Array.from({length:3}, () => prng.int32());
	    test_snap(res, snap.int32, 'int32');
	  });

	  it(`${name}.double()`, () => {
	    let prng = prng_alg(snap.seed, snap.opt);
	    let res = Array.from({length:3}, () => prng.double());
	    test_snap(res, snap.double, 'double');
	  });

	  it(`${name} state with 1024 iterations`, () => {
	    let prng = prng_alg(snap.seed, {...snap.opt, state: true});

	    for (let i=0; i<1024; i++) {
	      prng();
	      prng.quick();
	      prng.int32();
	      prng.double();
	    }

	    let state = JSON.parse(JSON.stringify(prng.state()));
	    let dup_prng = prng_alg('', {...snap.opt, state});

	    for (let i=0; i<5; i++) {
	      equal(dup_prng(), prng());
	      equal(dup_prng.quick(), prng.quick());
	      equal(dup_prng.int32(), prng.int32());
	      equal(dup_prng.double(), prng.double());
	    }
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

	describe('alea with state', () => {
	  let _ans_shared = [ 0.6605129039380699, 0.2608753452077508, 0.637230877764523 ];
	  const snap = {
	    opt: { state: { c: 223391, s0: 0.19618378719314933, s1: 0.2233675413299352, s2: 0.9835012815892696 }},

	    direct: _ans_shared,
	    quick: _ans_shared,
	    int32: [ -1458085975, 1120451076, -1558081516 ],
	    double: [ 0.6605129039988097, 0.6372308778926634, 0.046496662999518046 ]
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

	describe('xor128 with state', () => {
	  let _ans_shared = [ 0.1681680935434997, 0.5715856794267893, 0.9688262098934501 ];
	  const snap = {
	    opt: {state: {"x":2129486936,"y":1018211045,"z":-1036713708,"w":1054309448}},
	    direct: _ans_shared,
	    quick: _ans_shared,
	    int32: [ 722276462, -1840025496, -133890409 ],
	    double: [ 0.16816834048541995, 0.9688260512550894, 0.24403439393014414 ],
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

	describe('tychei with state', () => {
	  let _ans_shared = [ 0.9540062851738185, 0.14673241949640214, 0.15592244057916105 ];
	  const snap = {
	    opt: {state: {"a":1114141776,"b":1081436905,"c":2079925175,"d":1230677184}},

	    direct: _ans_shared,
	    quick: _ans_shared,
	    int32: [ -197541501, 630210943, 669681783 ],
	    double: [ 0.9540062650358293, 0.15592288850046654, 0.6584937794035384 ],
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

	describe('xorwow with state', () => {
	  let _ans_shared = [ 0.9834630433470011, 0.34372456138953567, 0.5046766495797783 ];
	  const snap = {
	    opt: {state: {"x":733911711,"y":1463434334,"z":-1393983784,"w":-1618969858,"v":-698200019,"d":671784302}},
	    direct: _ans_shared,
	    quick: _ans_shared,
	    int32: [ -71025688, 1476285750, -2127397591 ],
	    double: [ 0.9834629744170005, 0.5046764181761018, 0.31689916339742574 ],
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

	describe('xor4096 with state', () => {
	  let _ans_shared = [ 0.5910869480576366, 0.4439348168671131, 0.8686158978380263 ];
	  const snap = {
	    opt: {state: {"i":127,"w":-1777552588,"X":[-257799923,1406113259,1375561534,1532596805,1509840809,-1348605322,-1254322747,-1647634294,1321702170,1688648415,2143011051,2070557632,1427563947,-1912522375,1482709833,228717764,875099773,-81025456,749270504,-2063915448,2006827369,-192710701,800528103,-1987819366,-2104188427,992696610,-2070727171,1403673013,1656307029,-1727936959,1704606474,-1450207342,1594349482,-1682754632,-2022753359,1713822413,-1235769415,-566195523,1507698409,-2133788888,1810622117,-279989735,-1669035321,-2065088392,-727359429,-883176448,-465270756,-702833461,-1333148752,-965669287,1532434520,-177638986,-221201882,958765335,296186856,2032480663,-534741483,-1101374780,-611434991,-1776565680,-240327092,-1407954063,1936741697,1792640521,677639556,-1368051483,-1190958976,125668068,1280076544,1038572315,-1944891757,-363035801,139408245,-1912512970,1617681372,268929814,-23247734,1448073547,-1965512623,875199335,533545432,-27159931,-1662305229,1302349679,-629665445,375081342,1859322184,425055243,227277240,413125267,-917873087,-1120263347,-1213300338,-1459178021,1691464233,824853583,-155515193,-1894913238,-1002792824,-1372623340,1821168545,498227719,-75567295,952668218,1781920061,-1873995929,92998523,428831074,2043251958,-1952774412,-1040364735,1381392966,-85754804,1649531372,358812297,436037272,-988310603,-622053250,1524206658,680838942,433113176,1806270828,-925518775,-16246847,1505879177,804231832,68567600,2049015687]}},
	    direct: _ans_shared,
	    quick: _ans_shared,
	    int32: [ -1756268185, 1906685520, -564290422 ],
	    double: [ 0.591087076156052, 0.8686157961146537, 0.72138522418555 ],
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

	describe('xorshift7 with state', () => {
	  let _ans_shared = [ 0.5485894610174, 0.1137475436553359, 0.2735925179440528 ];
	  const snap = {
	    opt: { state: { i: 0, x: [ -1534938808, 2033299828, 2137027632, -1736997815, 1638824590, 466195994, -146690448, 1900193694 ]}},
	    direct: _ans_shared,
	    quick: _ans_shared,
	    int32: [ -1938793502, 488541980, 1175070917 ],
	    double: [ 0.5485892838227957, 0.27359278181790225, 0.27243765569291334 ]
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
	  let _ans_shared = [ 0.7396757600041567, 0.2125229710920903, 0.6653061318678898 ];
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

	describe('arc4 with state', () => {
	  let _ans_shared = [ 0.5468744446736922, 0.49507571990794474, 0.04433217638437844 ];
	  const snap = {
	    opt: {state: {i:122, j:135, S:[250,63,119,34,198,222,149,191,114,212,131,93,202,10,159,247,178,196,108,219,145,244,102,110,47,157,165,171,210,46,1,22,221,120,50,200,163,252,140,99,205,11,101,168,84,104,60,71,248,56,7,74,79,253,213,53,237,175,179,112,142,17,103,194,59,88,87,57,147,26,176,229,146,141,72,40,216,92,9,14,230,32,8,228,133,67,69,0,62,245,41,39,181,232,48,37,124,240,55,249,180,77,243,27,227,78,73,89,169,33,106,44,242,254,4,236,24,29,217,192,185,12,109,144,75,65,31,170,43,138,255,52,97,132,162,85,161,207,150,154,137,80,184,167,136,152,3,58,199,234,164,143,177,64,172,204,6,238,174,94,90,186,225,111,197,235,107,148,61,158,113,130,95,42,129,2,246,203,218,241,5,233,23,195,135,189,68,160,35,209,183,54,36,201,127,223,226,128,105,214,117,20,38,100,134,86,45,206,239,182,30,76,231,49,21,208,193,156,155,215,126,220,125,116,13,83,190,251,123,15,16,118,151,18,28,82,70,98,187,122,173,25,19,121,211,66,91,153,81,188,96,224,115,51,139,166]}},
	    direct: _ans_shared,
	    quick: [ 0.5468744444660842, 0.8916697199456394, 0.7393842963501811 ],
	    int32: [ -1946159442, -465275010, -1119335924 ],
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
