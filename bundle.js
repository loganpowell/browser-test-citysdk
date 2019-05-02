(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
'use strict'

exports.byteLength = byteLength
exports.toByteArray = toByteArray
exports.fromByteArray = fromByteArray

var lookup = []
var revLookup = []
var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array

var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
for (var i = 0, len = code.length; i < len; ++i) {
  lookup[i] = code[i]
  revLookup[code.charCodeAt(i)] = i
}

// Support decoding URL-safe base64 strings, as Node.js does.
// See: https://en.wikipedia.org/wiki/Base64#URL_applications
revLookup['-'.charCodeAt(0)] = 62
revLookup['_'.charCodeAt(0)] = 63

function getLens (b64) {
  var len = b64.length

  if (len % 4 > 0) {
    throw new Error('Invalid string. Length must be a multiple of 4')
  }

  // Trim off extra bytes after placeholder bytes are found
  // See: https://github.com/beatgammit/base64-js/issues/42
  var validLen = b64.indexOf('=')
  if (validLen === -1) validLen = len

  var placeHoldersLen = validLen === len
    ? 0
    : 4 - (validLen % 4)

  return [validLen, placeHoldersLen]
}

// base64 is 4/3 + up to two characters of the original data
function byteLength (b64) {
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function _byteLength (b64, validLen, placeHoldersLen) {
  return ((validLen + placeHoldersLen) * 3 / 4) - placeHoldersLen
}

function toByteArray (b64) {
  var tmp
  var lens = getLens(b64)
  var validLen = lens[0]
  var placeHoldersLen = lens[1]

  var arr = new Arr(_byteLength(b64, validLen, placeHoldersLen))

  var curByte = 0

  // if there are placeholders, only get up to the last complete 4 chars
  var len = placeHoldersLen > 0
    ? validLen - 4
    : validLen

  for (var i = 0; i < len; i += 4) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 18) |
      (revLookup[b64.charCodeAt(i + 1)] << 12) |
      (revLookup[b64.charCodeAt(i + 2)] << 6) |
      revLookup[b64.charCodeAt(i + 3)]
    arr[curByte++] = (tmp >> 16) & 0xFF
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 2) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 2) |
      (revLookup[b64.charCodeAt(i + 1)] >> 4)
    arr[curByte++] = tmp & 0xFF
  }

  if (placeHoldersLen === 1) {
    tmp =
      (revLookup[b64.charCodeAt(i)] << 10) |
      (revLookup[b64.charCodeAt(i + 1)] << 4) |
      (revLookup[b64.charCodeAt(i + 2)] >> 2)
    arr[curByte++] = (tmp >> 8) & 0xFF
    arr[curByte++] = tmp & 0xFF
  }

  return arr
}

function tripletToBase64 (num) {
  return lookup[num >> 18 & 0x3F] +
    lookup[num >> 12 & 0x3F] +
    lookup[num >> 6 & 0x3F] +
    lookup[num & 0x3F]
}

function encodeChunk (uint8, start, end) {
  var tmp
  var output = []
  for (var i = start; i < end; i += 3) {
    tmp =
      ((uint8[i] << 16) & 0xFF0000) +
      ((uint8[i + 1] << 8) & 0xFF00) +
      (uint8[i + 2] & 0xFF)
    output.push(tripletToBase64(tmp))
  }
  return output.join('')
}

function fromByteArray (uint8) {
  var tmp
  var len = uint8.length
  var extraBytes = len % 3 // if we have 1 byte left, pad 2 bytes
  var parts = []
  var maxChunkLength = 16383 // must be multiple of 3

  // go through the array every three bytes, we'll deal with trailing stuff later
  for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
    parts.push(encodeChunk(
      uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)
    ))
  }

  // pad the end with zeros, but make sure to not forget the extra bytes
  if (extraBytes === 1) {
    tmp = uint8[len - 1]
    parts.push(
      lookup[tmp >> 2] +
      lookup[(tmp << 4) & 0x3F] +
      '=='
    )
  } else if (extraBytes === 2) {
    tmp = (uint8[len - 2] << 8) + uint8[len - 1]
    parts.push(
      lookup[tmp >> 10] +
      lookup[(tmp >> 4) & 0x3F] +
      lookup[(tmp << 2) & 0x3F] +
      '='
    )
  }

  return parts.join('')
}

},{}],3:[function(require,module,exports){
arguments[4][1][0].apply(exports,arguments)
},{"dup":1}],4:[function(require,module,exports){
(function (Buffer){
/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */
/* eslint-disable no-proto */

'use strict'

var base64 = require('base64-js')
var ieee754 = require('ieee754')

exports.Buffer = Buffer
exports.SlowBuffer = SlowBuffer
exports.INSPECT_MAX_BYTES = 50

var K_MAX_LENGTH = 0x7fffffff
exports.kMaxLength = K_MAX_LENGTH

/**
 * If `Buffer.TYPED_ARRAY_SUPPORT`:
 *   === true    Use Uint8Array implementation (fastest)
 *   === false   Print warning and recommend using `buffer` v4.x which has an Object
 *               implementation (most compatible, even IE6)
 *
 * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
 * Opera 11.6+, iOS 4.2+.
 *
 * We report that the browser does not support typed arrays if the are not subclassable
 * using __proto__. Firefox 4-29 lacks support for adding new properties to `Uint8Array`
 * (See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438). IE 10 lacks support
 * for __proto__ and has a buggy typed array implementation.
 */
Buffer.TYPED_ARRAY_SUPPORT = typedArraySupport()

if (!Buffer.TYPED_ARRAY_SUPPORT && typeof console !== 'undefined' &&
    typeof console.error === 'function') {
  console.error(
    'This browser lacks typed array (Uint8Array) support which is required by ' +
    '`buffer` v5.x. Use `buffer` v4.x if you require old browser support.'
  )
}

function typedArraySupport () {
  // Can typed array instances can be augmented?
  try {
    var arr = new Uint8Array(1)
    arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function () { return 42 } }
    return arr.foo() === 42
  } catch (e) {
    return false
  }
}

Object.defineProperty(Buffer.prototype, 'parent', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.buffer
  }
})

Object.defineProperty(Buffer.prototype, 'offset', {
  enumerable: true,
  get: function () {
    if (!Buffer.isBuffer(this)) return undefined
    return this.byteOffset
  }
})

function createBuffer (length) {
  if (length > K_MAX_LENGTH) {
    throw new RangeError('The value "' + length + '" is invalid for option "size"')
  }
  // Return an augmented `Uint8Array` instance
  var buf = new Uint8Array(length)
  buf.__proto__ = Buffer.prototype
  return buf
}

/**
 * The Buffer constructor returns instances of `Uint8Array` that have their
 * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
 * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
 * and the `Uint8Array` methods. Square bracket notation works as expected -- it
 * returns a single octet.
 *
 * The `Uint8Array` prototype remains unmodified.
 */

function Buffer (arg, encodingOrOffset, length) {
  // Common case.
  if (typeof arg === 'number') {
    if (typeof encodingOrOffset === 'string') {
      throw new TypeError(
        'The "string" argument must be of type string. Received type number'
      )
    }
    return allocUnsafe(arg)
  }
  return from(arg, encodingOrOffset, length)
}

// Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
if (typeof Symbol !== 'undefined' && Symbol.species != null &&
    Buffer[Symbol.species] === Buffer) {
  Object.defineProperty(Buffer, Symbol.species, {
    value: null,
    configurable: true,
    enumerable: false,
    writable: false
  })
}

Buffer.poolSize = 8192 // not used by this implementation

function from (value, encodingOrOffset, length) {
  if (typeof value === 'string') {
    return fromString(value, encodingOrOffset)
  }

  if (ArrayBuffer.isView(value)) {
    return fromArrayLike(value)
  }

  if (value == null) {
    throw TypeError(
      'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
      'or Array-like Object. Received type ' + (typeof value)
    )
  }

  if (isInstance(value, ArrayBuffer) ||
      (value && isInstance(value.buffer, ArrayBuffer))) {
    return fromArrayBuffer(value, encodingOrOffset, length)
  }

  if (typeof value === 'number') {
    throw new TypeError(
      'The "value" argument must not be of type number. Received type number'
    )
  }

  var valueOf = value.valueOf && value.valueOf()
  if (valueOf != null && valueOf !== value) {
    return Buffer.from(valueOf, encodingOrOffset, length)
  }

  var b = fromObject(value)
  if (b) return b

  if (typeof Symbol !== 'undefined' && Symbol.toPrimitive != null &&
      typeof value[Symbol.toPrimitive] === 'function') {
    return Buffer.from(
      value[Symbol.toPrimitive]('string'), encodingOrOffset, length
    )
  }

  throw new TypeError(
    'The first argument must be one of type string, Buffer, ArrayBuffer, Array, ' +
    'or Array-like Object. Received type ' + (typeof value)
  )
}

/**
 * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
 * if value is a number.
 * Buffer.from(str[, encoding])
 * Buffer.from(array)
 * Buffer.from(buffer)
 * Buffer.from(arrayBuffer[, byteOffset[, length]])
 **/
Buffer.from = function (value, encodingOrOffset, length) {
  return from(value, encodingOrOffset, length)
}

// Note: Change prototype *after* Buffer.from is defined to workaround Chrome bug:
// https://github.com/feross/buffer/pull/148
Buffer.prototype.__proto__ = Uint8Array.prototype
Buffer.__proto__ = Uint8Array

function assertSize (size) {
  if (typeof size !== 'number') {
    throw new TypeError('"size" argument must be of type number')
  } else if (size < 0) {
    throw new RangeError('The value "' + size + '" is invalid for option "size"')
  }
}

function alloc (size, fill, encoding) {
  assertSize(size)
  if (size <= 0) {
    return createBuffer(size)
  }
  if (fill !== undefined) {
    // Only pay attention to encoding if it's a string. This
    // prevents accidentally sending in a number that would
    // be interpretted as a start offset.
    return typeof encoding === 'string'
      ? createBuffer(size).fill(fill, encoding)
      : createBuffer(size).fill(fill)
  }
  return createBuffer(size)
}

/**
 * Creates a new filled Buffer instance.
 * alloc(size[, fill[, encoding]])
 **/
Buffer.alloc = function (size, fill, encoding) {
  return alloc(size, fill, encoding)
}

function allocUnsafe (size) {
  assertSize(size)
  return createBuffer(size < 0 ? 0 : checked(size) | 0)
}

/**
 * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
 * */
Buffer.allocUnsafe = function (size) {
  return allocUnsafe(size)
}
/**
 * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
 */
Buffer.allocUnsafeSlow = function (size) {
  return allocUnsafe(size)
}

function fromString (string, encoding) {
  if (typeof encoding !== 'string' || encoding === '') {
    encoding = 'utf8'
  }

  if (!Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding)
  }

  var length = byteLength(string, encoding) | 0
  var buf = createBuffer(length)

  var actual = buf.write(string, encoding)

  if (actual !== length) {
    // Writing a hex string, for example, that contains invalid characters will
    // cause everything after the first invalid character to be ignored. (e.g.
    // 'abxxcd' will be treated as 'ab')
    buf = buf.slice(0, actual)
  }

  return buf
}

function fromArrayLike (array) {
  var length = array.length < 0 ? 0 : checked(array.length) | 0
  var buf = createBuffer(length)
  for (var i = 0; i < length; i += 1) {
    buf[i] = array[i] & 255
  }
  return buf
}

function fromArrayBuffer (array, byteOffset, length) {
  if (byteOffset < 0 || array.byteLength < byteOffset) {
    throw new RangeError('"offset" is outside of buffer bounds')
  }

  if (array.byteLength < byteOffset + (length || 0)) {
    throw new RangeError('"length" is outside of buffer bounds')
  }

  var buf
  if (byteOffset === undefined && length === undefined) {
    buf = new Uint8Array(array)
  } else if (length === undefined) {
    buf = new Uint8Array(array, byteOffset)
  } else {
    buf = new Uint8Array(array, byteOffset, length)
  }

  // Return an augmented `Uint8Array` instance
  buf.__proto__ = Buffer.prototype
  return buf
}

function fromObject (obj) {
  if (Buffer.isBuffer(obj)) {
    var len = checked(obj.length) | 0
    var buf = createBuffer(len)

    if (buf.length === 0) {
      return buf
    }

    obj.copy(buf, 0, 0, len)
    return buf
  }

  if (obj.length !== undefined) {
    if (typeof obj.length !== 'number' || numberIsNaN(obj.length)) {
      return createBuffer(0)
    }
    return fromArrayLike(obj)
  }

  if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
    return fromArrayLike(obj.data)
  }
}

function checked (length) {
  // Note: cannot use `length < K_MAX_LENGTH` here because that fails when
  // length is NaN (which is otherwise coerced to zero.)
  if (length >= K_MAX_LENGTH) {
    throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                         'size: 0x' + K_MAX_LENGTH.toString(16) + ' bytes')
  }
  return length | 0
}

function SlowBuffer (length) {
  if (+length != length) { // eslint-disable-line eqeqeq
    length = 0
  }
  return Buffer.alloc(+length)
}

Buffer.isBuffer = function isBuffer (b) {
  return b != null && b._isBuffer === true &&
    b !== Buffer.prototype // so Buffer.isBuffer(Buffer.prototype) will be false
}

Buffer.compare = function compare (a, b) {
  if (isInstance(a, Uint8Array)) a = Buffer.from(a, a.offset, a.byteLength)
  if (isInstance(b, Uint8Array)) b = Buffer.from(b, b.offset, b.byteLength)
  if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
    throw new TypeError(
      'The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array'
    )
  }

  if (a === b) return 0

  var x = a.length
  var y = b.length

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i]
      y = b[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

Buffer.isEncoding = function isEncoding (encoding) {
  switch (String(encoding).toLowerCase()) {
    case 'hex':
    case 'utf8':
    case 'utf-8':
    case 'ascii':
    case 'latin1':
    case 'binary':
    case 'base64':
    case 'ucs2':
    case 'ucs-2':
    case 'utf16le':
    case 'utf-16le':
      return true
    default:
      return false
  }
}

Buffer.concat = function concat (list, length) {
  if (!Array.isArray(list)) {
    throw new TypeError('"list" argument must be an Array of Buffers')
  }

  if (list.length === 0) {
    return Buffer.alloc(0)
  }

  var i
  if (length === undefined) {
    length = 0
    for (i = 0; i < list.length; ++i) {
      length += list[i].length
    }
  }

  var buffer = Buffer.allocUnsafe(length)
  var pos = 0
  for (i = 0; i < list.length; ++i) {
    var buf = list[i]
    if (isInstance(buf, Uint8Array)) {
      buf = Buffer.from(buf)
    }
    if (!Buffer.isBuffer(buf)) {
      throw new TypeError('"list" argument must be an Array of Buffers')
    }
    buf.copy(buffer, pos)
    pos += buf.length
  }
  return buffer
}

function byteLength (string, encoding) {
  if (Buffer.isBuffer(string)) {
    return string.length
  }
  if (ArrayBuffer.isView(string) || isInstance(string, ArrayBuffer)) {
    return string.byteLength
  }
  if (typeof string !== 'string') {
    throw new TypeError(
      'The "string" argument must be one of type string, Buffer, or ArrayBuffer. ' +
      'Received type ' + typeof string
    )
  }

  var len = string.length
  var mustMatch = (arguments.length > 2 && arguments[2] === true)
  if (!mustMatch && len === 0) return 0

  // Use a for loop to avoid recursion
  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'ascii':
      case 'latin1':
      case 'binary':
        return len
      case 'utf8':
      case 'utf-8':
        return utf8ToBytes(string).length
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return len * 2
      case 'hex':
        return len >>> 1
      case 'base64':
        return base64ToBytes(string).length
      default:
        if (loweredCase) {
          return mustMatch ? -1 : utf8ToBytes(string).length // assume utf8
        }
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}
Buffer.byteLength = byteLength

function slowToString (encoding, start, end) {
  var loweredCase = false

  // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
  // property of a typed array.

  // This behaves neither like String nor Uint8Array in that we set start/end
  // to their upper/lower bounds if the value passed is out of range.
  // undefined is handled specially as per ECMA-262 6th Edition,
  // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
  if (start === undefined || start < 0) {
    start = 0
  }
  // Return early if start > this.length. Done here to prevent potential uint32
  // coercion fail below.
  if (start > this.length) {
    return ''
  }

  if (end === undefined || end > this.length) {
    end = this.length
  }

  if (end <= 0) {
    return ''
  }

  // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
  end >>>= 0
  start >>>= 0

  if (end <= start) {
    return ''
  }

  if (!encoding) encoding = 'utf8'

  while (true) {
    switch (encoding) {
      case 'hex':
        return hexSlice(this, start, end)

      case 'utf8':
      case 'utf-8':
        return utf8Slice(this, start, end)

      case 'ascii':
        return asciiSlice(this, start, end)

      case 'latin1':
      case 'binary':
        return latin1Slice(this, start, end)

      case 'base64':
        return base64Slice(this, start, end)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return utf16leSlice(this, start, end)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = (encoding + '').toLowerCase()
        loweredCase = true
    }
  }
}

// This property is used by `Buffer.isBuffer` (and the `is-buffer` npm package)
// to detect a Buffer instance. It's not possible to use `instanceof Buffer`
// reliably in a browserify context because there could be multiple different
// copies of the 'buffer' package in use. This method works even for Buffer
// instances that were created from another copy of the `buffer` package.
// See: https://github.com/feross/buffer/issues/154
Buffer.prototype._isBuffer = true

function swap (b, n, m) {
  var i = b[n]
  b[n] = b[m]
  b[m] = i
}

Buffer.prototype.swap16 = function swap16 () {
  var len = this.length
  if (len % 2 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 16-bits')
  }
  for (var i = 0; i < len; i += 2) {
    swap(this, i, i + 1)
  }
  return this
}

Buffer.prototype.swap32 = function swap32 () {
  var len = this.length
  if (len % 4 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 32-bits')
  }
  for (var i = 0; i < len; i += 4) {
    swap(this, i, i + 3)
    swap(this, i + 1, i + 2)
  }
  return this
}

Buffer.prototype.swap64 = function swap64 () {
  var len = this.length
  if (len % 8 !== 0) {
    throw new RangeError('Buffer size must be a multiple of 64-bits')
  }
  for (var i = 0; i < len; i += 8) {
    swap(this, i, i + 7)
    swap(this, i + 1, i + 6)
    swap(this, i + 2, i + 5)
    swap(this, i + 3, i + 4)
  }
  return this
}

Buffer.prototype.toString = function toString () {
  var length = this.length
  if (length === 0) return ''
  if (arguments.length === 0) return utf8Slice(this, 0, length)
  return slowToString.apply(this, arguments)
}

Buffer.prototype.toLocaleString = Buffer.prototype.toString

Buffer.prototype.equals = function equals (b) {
  if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer')
  if (this === b) return true
  return Buffer.compare(this, b) === 0
}

Buffer.prototype.inspect = function inspect () {
  var str = ''
  var max = exports.INSPECT_MAX_BYTES
  str = this.toString('hex', 0, max).replace(/(.{2})/g, '$1 ').trim()
  if (this.length > max) str += ' ... '
  return '<Buffer ' + str + '>'
}

Buffer.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
  if (isInstance(target, Uint8Array)) {
    target = Buffer.from(target, target.offset, target.byteLength)
  }
  if (!Buffer.isBuffer(target)) {
    throw new TypeError(
      'The "target" argument must be one of type Buffer or Uint8Array. ' +
      'Received type ' + (typeof target)
    )
  }

  if (start === undefined) {
    start = 0
  }
  if (end === undefined) {
    end = target ? target.length : 0
  }
  if (thisStart === undefined) {
    thisStart = 0
  }
  if (thisEnd === undefined) {
    thisEnd = this.length
  }

  if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
    throw new RangeError('out of range index')
  }

  if (thisStart >= thisEnd && start >= end) {
    return 0
  }
  if (thisStart >= thisEnd) {
    return -1
  }
  if (start >= end) {
    return 1
  }

  start >>>= 0
  end >>>= 0
  thisStart >>>= 0
  thisEnd >>>= 0

  if (this === target) return 0

  var x = thisEnd - thisStart
  var y = end - start
  var len = Math.min(x, y)

  var thisCopy = this.slice(thisStart, thisEnd)
  var targetCopy = target.slice(start, end)

  for (var i = 0; i < len; ++i) {
    if (thisCopy[i] !== targetCopy[i]) {
      x = thisCopy[i]
      y = targetCopy[i]
      break
    }
  }

  if (x < y) return -1
  if (y < x) return 1
  return 0
}

// Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
// OR the last index of `val` in `buffer` at offset <= `byteOffset`.
//
// Arguments:
// - buffer - a Buffer to search
// - val - a string, Buffer, or number
// - byteOffset - an index into `buffer`; will be clamped to an int32
// - encoding - an optional encoding, relevant is val is a string
// - dir - true for indexOf, false for lastIndexOf
function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
  // Empty buffer means no match
  if (buffer.length === 0) return -1

  // Normalize byteOffset
  if (typeof byteOffset === 'string') {
    encoding = byteOffset
    byteOffset = 0
  } else if (byteOffset > 0x7fffffff) {
    byteOffset = 0x7fffffff
  } else if (byteOffset < -0x80000000) {
    byteOffset = -0x80000000
  }
  byteOffset = +byteOffset // Coerce to Number.
  if (numberIsNaN(byteOffset)) {
    // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
    byteOffset = dir ? 0 : (buffer.length - 1)
  }

  // Normalize byteOffset: negative offsets start from the end of the buffer
  if (byteOffset < 0) byteOffset = buffer.length + byteOffset
  if (byteOffset >= buffer.length) {
    if (dir) return -1
    else byteOffset = buffer.length - 1
  } else if (byteOffset < 0) {
    if (dir) byteOffset = 0
    else return -1
  }

  // Normalize val
  if (typeof val === 'string') {
    val = Buffer.from(val, encoding)
  }

  // Finally, search either indexOf (if dir is true) or lastIndexOf
  if (Buffer.isBuffer(val)) {
    // Special case: looking for empty string/buffer always fails
    if (val.length === 0) {
      return -1
    }
    return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
  } else if (typeof val === 'number') {
    val = val & 0xFF // Search for a byte value [0-255]
    if (typeof Uint8Array.prototype.indexOf === 'function') {
      if (dir) {
        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
      } else {
        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
      }
    }
    return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
  }

  throw new TypeError('val must be string, number or Buffer')
}

function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
  var indexSize = 1
  var arrLength = arr.length
  var valLength = val.length

  if (encoding !== undefined) {
    encoding = String(encoding).toLowerCase()
    if (encoding === 'ucs2' || encoding === 'ucs-2' ||
        encoding === 'utf16le' || encoding === 'utf-16le') {
      if (arr.length < 2 || val.length < 2) {
        return -1
      }
      indexSize = 2
      arrLength /= 2
      valLength /= 2
      byteOffset /= 2
    }
  }

  function read (buf, i) {
    if (indexSize === 1) {
      return buf[i]
    } else {
      return buf.readUInt16BE(i * indexSize)
    }
  }

  var i
  if (dir) {
    var foundIndex = -1
    for (i = byteOffset; i < arrLength; i++) {
      if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
        if (foundIndex === -1) foundIndex = i
        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
      } else {
        if (foundIndex !== -1) i -= i - foundIndex
        foundIndex = -1
      }
    }
  } else {
    if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength
    for (i = byteOffset; i >= 0; i--) {
      var found = true
      for (var j = 0; j < valLength; j++) {
        if (read(arr, i + j) !== read(val, j)) {
          found = false
          break
        }
      }
      if (found) return i
    }
  }

  return -1
}

Buffer.prototype.includes = function includes (val, byteOffset, encoding) {
  return this.indexOf(val, byteOffset, encoding) !== -1
}

Buffer.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
}

Buffer.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
  return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
}

function hexWrite (buf, string, offset, length) {
  offset = Number(offset) || 0
  var remaining = buf.length - offset
  if (!length) {
    length = remaining
  } else {
    length = Number(length)
    if (length > remaining) {
      length = remaining
    }
  }

  var strLen = string.length

  if (length > strLen / 2) {
    length = strLen / 2
  }
  for (var i = 0; i < length; ++i) {
    var parsed = parseInt(string.substr(i * 2, 2), 16)
    if (numberIsNaN(parsed)) return i
    buf[offset + i] = parsed
  }
  return i
}

function utf8Write (buf, string, offset, length) {
  return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
}

function asciiWrite (buf, string, offset, length) {
  return blitBuffer(asciiToBytes(string), buf, offset, length)
}

function latin1Write (buf, string, offset, length) {
  return asciiWrite(buf, string, offset, length)
}

function base64Write (buf, string, offset, length) {
  return blitBuffer(base64ToBytes(string), buf, offset, length)
}

function ucs2Write (buf, string, offset, length) {
  return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
}

Buffer.prototype.write = function write (string, offset, length, encoding) {
  // Buffer#write(string)
  if (offset === undefined) {
    encoding = 'utf8'
    length = this.length
    offset = 0
  // Buffer#write(string, encoding)
  } else if (length === undefined && typeof offset === 'string') {
    encoding = offset
    length = this.length
    offset = 0
  // Buffer#write(string, offset[, length][, encoding])
  } else if (isFinite(offset)) {
    offset = offset >>> 0
    if (isFinite(length)) {
      length = length >>> 0
      if (encoding === undefined) encoding = 'utf8'
    } else {
      encoding = length
      length = undefined
    }
  } else {
    throw new Error(
      'Buffer.write(string, encoding, offset[, length]) is no longer supported'
    )
  }

  var remaining = this.length - offset
  if (length === undefined || length > remaining) length = remaining

  if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
    throw new RangeError('Attempt to write outside buffer bounds')
  }

  if (!encoding) encoding = 'utf8'

  var loweredCase = false
  for (;;) {
    switch (encoding) {
      case 'hex':
        return hexWrite(this, string, offset, length)

      case 'utf8':
      case 'utf-8':
        return utf8Write(this, string, offset, length)

      case 'ascii':
        return asciiWrite(this, string, offset, length)

      case 'latin1':
      case 'binary':
        return latin1Write(this, string, offset, length)

      case 'base64':
        // Warning: maxLength not taken into account in base64Write
        return base64Write(this, string, offset, length)

      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return ucs2Write(this, string, offset, length)

      default:
        if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
        encoding = ('' + encoding).toLowerCase()
        loweredCase = true
    }
  }
}

Buffer.prototype.toJSON = function toJSON () {
  return {
    type: 'Buffer',
    data: Array.prototype.slice.call(this._arr || this, 0)
  }
}

function base64Slice (buf, start, end) {
  if (start === 0 && end === buf.length) {
    return base64.fromByteArray(buf)
  } else {
    return base64.fromByteArray(buf.slice(start, end))
  }
}

function utf8Slice (buf, start, end) {
  end = Math.min(buf.length, end)
  var res = []

  var i = start
  while (i < end) {
    var firstByte = buf[i]
    var codePoint = null
    var bytesPerSequence = (firstByte > 0xEF) ? 4
      : (firstByte > 0xDF) ? 3
        : (firstByte > 0xBF) ? 2
          : 1

    if (i + bytesPerSequence <= end) {
      var secondByte, thirdByte, fourthByte, tempCodePoint

      switch (bytesPerSequence) {
        case 1:
          if (firstByte < 0x80) {
            codePoint = firstByte
          }
          break
        case 2:
          secondByte = buf[i + 1]
          if ((secondByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F)
            if (tempCodePoint > 0x7F) {
              codePoint = tempCodePoint
            }
          }
          break
        case 3:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F)
            if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
              codePoint = tempCodePoint
            }
          }
          break
        case 4:
          secondByte = buf[i + 1]
          thirdByte = buf[i + 2]
          fourthByte = buf[i + 3]
          if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
            tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F)
            if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
              codePoint = tempCodePoint
            }
          }
      }
    }

    if (codePoint === null) {
      // we did not generate a valid codePoint so insert a
      // replacement char (U+FFFD) and advance only 1 byte
      codePoint = 0xFFFD
      bytesPerSequence = 1
    } else if (codePoint > 0xFFFF) {
      // encode to utf16 (surrogate pair dance)
      codePoint -= 0x10000
      res.push(codePoint >>> 10 & 0x3FF | 0xD800)
      codePoint = 0xDC00 | codePoint & 0x3FF
    }

    res.push(codePoint)
    i += bytesPerSequence
  }

  return decodeCodePointsArray(res)
}

// Based on http://stackoverflow.com/a/22747272/680742, the browser with
// the lowest limit is Chrome, with 0x10000 args.
// We go 1 magnitude less, for safety
var MAX_ARGUMENTS_LENGTH = 0x1000

function decodeCodePointsArray (codePoints) {
  var len = codePoints.length
  if (len <= MAX_ARGUMENTS_LENGTH) {
    return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
  }

  // Decode in chunks to avoid "call stack size exceeded".
  var res = ''
  var i = 0
  while (i < len) {
    res += String.fromCharCode.apply(
      String,
      codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
    )
  }
  return res
}

function asciiSlice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i] & 0x7F)
  }
  return ret
}

function latin1Slice (buf, start, end) {
  var ret = ''
  end = Math.min(buf.length, end)

  for (var i = start; i < end; ++i) {
    ret += String.fromCharCode(buf[i])
  }
  return ret
}

function hexSlice (buf, start, end) {
  var len = buf.length

  if (!start || start < 0) start = 0
  if (!end || end < 0 || end > len) end = len

  var out = ''
  for (var i = start; i < end; ++i) {
    out += toHex(buf[i])
  }
  return out
}

function utf16leSlice (buf, start, end) {
  var bytes = buf.slice(start, end)
  var res = ''
  for (var i = 0; i < bytes.length; i += 2) {
    res += String.fromCharCode(bytes[i] + (bytes[i + 1] * 256))
  }
  return res
}

Buffer.prototype.slice = function slice (start, end) {
  var len = this.length
  start = ~~start
  end = end === undefined ? len : ~~end

  if (start < 0) {
    start += len
    if (start < 0) start = 0
  } else if (start > len) {
    start = len
  }

  if (end < 0) {
    end += len
    if (end < 0) end = 0
  } else if (end > len) {
    end = len
  }

  if (end < start) end = start

  var newBuf = this.subarray(start, end)
  // Return an augmented `Uint8Array` instance
  newBuf.__proto__ = Buffer.prototype
  return newBuf
}

/*
 * Need to make sure that buffer isn't trying to write out of bounds.
 */
function checkOffset (offset, ext, length) {
  if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
  if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
}

Buffer.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }

  return val
}

Buffer.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    checkOffset(offset, byteLength, this.length)
  }

  var val = this[offset + --byteLength]
  var mul = 1
  while (byteLength > 0 && (mul *= 0x100)) {
    val += this[offset + --byteLength] * mul
  }

  return val
}

Buffer.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  return this[offset]
}

Buffer.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return this[offset] | (this[offset + 1] << 8)
}

Buffer.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  return (this[offset] << 8) | this[offset + 1]
}

Buffer.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return ((this[offset]) |
      (this[offset + 1] << 8) |
      (this[offset + 2] << 16)) +
      (this[offset + 3] * 0x1000000)
}

Buffer.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] * 0x1000000) +
    ((this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    this[offset + 3])
}

Buffer.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var val = this[offset]
  var mul = 1
  var i = 0
  while (++i < byteLength && (mul *= 0x100)) {
    val += this[offset + i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) checkOffset(offset, byteLength, this.length)

  var i = byteLength
  var mul = 1
  var val = this[offset + --i]
  while (i > 0 && (mul *= 0x100)) {
    val += this[offset + --i] * mul
  }
  mul *= 0x80

  if (val >= mul) val -= Math.pow(2, 8 * byteLength)

  return val
}

Buffer.prototype.readInt8 = function readInt8 (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 1, this.length)
  if (!(this[offset] & 0x80)) return (this[offset])
  return ((0xff - this[offset] + 1) * -1)
}

Buffer.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset] | (this[offset + 1] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 2, this.length)
  var val = this[offset + 1] | (this[offset] << 8)
  return (val & 0x8000) ? val | 0xFFFF0000 : val
}

Buffer.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset]) |
    (this[offset + 1] << 8) |
    (this[offset + 2] << 16) |
    (this[offset + 3] << 24)
}

Buffer.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)

  return (this[offset] << 24) |
    (this[offset + 1] << 16) |
    (this[offset + 2] << 8) |
    (this[offset + 3])
}

Buffer.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, true, 23, 4)
}

Buffer.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 4, this.length)
  return ieee754.read(this, offset, false, 23, 4)
}

Buffer.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, true, 52, 8)
}

Buffer.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
  offset = offset >>> 0
  if (!noAssert) checkOffset(offset, 8, this.length)
  return ieee754.read(this, offset, false, 52, 8)
}

function checkInt (buf, value, offset, ext, max, min) {
  if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
  if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
}

Buffer.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var mul = 1
  var i = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  byteLength = byteLength >>> 0
  if (!noAssert) {
    var maxBytes = Math.pow(2, 8 * byteLength) - 1
    checkInt(this, value, offset, byteLength, maxBytes, 0)
  }

  var i = byteLength - 1
  var mul = 1
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    this[offset + i] = (value / mul) & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0)
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset + 3] = (value >>> 24)
  this[offset + 2] = (value >>> 16)
  this[offset + 1] = (value >>> 8)
  this[offset] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0)
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

Buffer.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = 0
  var mul = 1
  var sub = 0
  this[offset] = value & 0xFF
  while (++i < byteLength && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    var limit = Math.pow(2, (8 * byteLength) - 1)

    checkInt(this, value, offset, byteLength, limit - 1, -limit)
  }

  var i = byteLength - 1
  var mul = 1
  var sub = 0
  this[offset + i] = value & 0xFF
  while (--i >= 0 && (mul *= 0x100)) {
    if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
      sub = 1
    }
    this[offset + i] = ((value / mul) >> 0) - sub & 0xFF
  }

  return offset + byteLength
}

Buffer.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80)
  if (value < 0) value = 0xff + value + 1
  this[offset] = (value & 0xff)
  return offset + 1
}

Buffer.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  return offset + 2
}

Buffer.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000)
  this[offset] = (value >>> 8)
  this[offset + 1] = (value & 0xff)
  return offset + 2
}

Buffer.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  this[offset] = (value & 0xff)
  this[offset + 1] = (value >>> 8)
  this[offset + 2] = (value >>> 16)
  this[offset + 3] = (value >>> 24)
  return offset + 4
}

Buffer.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000)
  if (value < 0) value = 0xffffffff + value + 1
  this[offset] = (value >>> 24)
  this[offset + 1] = (value >>> 16)
  this[offset + 2] = (value >>> 8)
  this[offset + 3] = (value & 0xff)
  return offset + 4
}

function checkIEEE754 (buf, value, offset, ext, max, min) {
  if (offset + ext > buf.length) throw new RangeError('Index out of range')
  if (offset < 0) throw new RangeError('Index out of range')
}

function writeFloat (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38)
  }
  ieee754.write(buf, value, offset, littleEndian, 23, 4)
  return offset + 4
}

Buffer.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
  return writeFloat(this, value, offset, true, noAssert)
}

Buffer.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
  return writeFloat(this, value, offset, false, noAssert)
}

function writeDouble (buf, value, offset, littleEndian, noAssert) {
  value = +value
  offset = offset >>> 0
  if (!noAssert) {
    checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308)
  }
  ieee754.write(buf, value, offset, littleEndian, 52, 8)
  return offset + 8
}

Buffer.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
  return writeDouble(this, value, offset, true, noAssert)
}

Buffer.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
  return writeDouble(this, value, offset, false, noAssert)
}

// copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
Buffer.prototype.copy = function copy (target, targetStart, start, end) {
  if (!Buffer.isBuffer(target)) throw new TypeError('argument should be a Buffer')
  if (!start) start = 0
  if (!end && end !== 0) end = this.length
  if (targetStart >= target.length) targetStart = target.length
  if (!targetStart) targetStart = 0
  if (end > 0 && end < start) end = start

  // Copy 0 bytes; we're done
  if (end === start) return 0
  if (target.length === 0 || this.length === 0) return 0

  // Fatal error conditions
  if (targetStart < 0) {
    throw new RangeError('targetStart out of bounds')
  }
  if (start < 0 || start >= this.length) throw new RangeError('Index out of range')
  if (end < 0) throw new RangeError('sourceEnd out of bounds')

  // Are we oob?
  if (end > this.length) end = this.length
  if (target.length - targetStart < end - start) {
    end = target.length - targetStart + start
  }

  var len = end - start

  if (this === target && typeof Uint8Array.prototype.copyWithin === 'function') {
    // Use built-in when available, missing from IE11
    this.copyWithin(targetStart, start, end)
  } else if (this === target && start < targetStart && targetStart < end) {
    // descending copy from end
    for (var i = len - 1; i >= 0; --i) {
      target[i + targetStart] = this[i + start]
    }
  } else {
    Uint8Array.prototype.set.call(
      target,
      this.subarray(start, end),
      targetStart
    )
  }

  return len
}

// Usage:
//    buffer.fill(number[, offset[, end]])
//    buffer.fill(buffer[, offset[, end]])
//    buffer.fill(string[, offset[, end]][, encoding])
Buffer.prototype.fill = function fill (val, start, end, encoding) {
  // Handle string cases:
  if (typeof val === 'string') {
    if (typeof start === 'string') {
      encoding = start
      start = 0
      end = this.length
    } else if (typeof end === 'string') {
      encoding = end
      end = this.length
    }
    if (encoding !== undefined && typeof encoding !== 'string') {
      throw new TypeError('encoding must be a string')
    }
    if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
      throw new TypeError('Unknown encoding: ' + encoding)
    }
    if (val.length === 1) {
      var code = val.charCodeAt(0)
      if ((encoding === 'utf8' && code < 128) ||
          encoding === 'latin1') {
        // Fast path: If `val` fits into a single byte, use that numeric value.
        val = code
      }
    }
  } else if (typeof val === 'number') {
    val = val & 255
  }

  // Invalid ranges are not set to a default, so can range check early.
  if (start < 0 || this.length < start || this.length < end) {
    throw new RangeError('Out of range index')
  }

  if (end <= start) {
    return this
  }

  start = start >>> 0
  end = end === undefined ? this.length : end >>> 0

  if (!val) val = 0

  var i
  if (typeof val === 'number') {
    for (i = start; i < end; ++i) {
      this[i] = val
    }
  } else {
    var bytes = Buffer.isBuffer(val)
      ? val
      : Buffer.from(val, encoding)
    var len = bytes.length
    if (len === 0) {
      throw new TypeError('The value "' + val +
        '" is invalid for argument "value"')
    }
    for (i = 0; i < end - start; ++i) {
      this[i + start] = bytes[i % len]
    }
  }

  return this
}

// HELPER FUNCTIONS
// ================

var INVALID_BASE64_RE = /[^+/0-9A-Za-z-_]/g

function base64clean (str) {
  // Node takes equal signs as end of the Base64 encoding
  str = str.split('=')[0]
  // Node strips out invalid characters like \n and \t from the string, base64-js does not
  str = str.trim().replace(INVALID_BASE64_RE, '')
  // Node converts strings with length < 2 to ''
  if (str.length < 2) return ''
  // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
  while (str.length % 4 !== 0) {
    str = str + '='
  }
  return str
}

function toHex (n) {
  if (n < 16) return '0' + n.toString(16)
  return n.toString(16)
}

function utf8ToBytes (string, units) {
  units = units || Infinity
  var codePoint
  var length = string.length
  var leadSurrogate = null
  var bytes = []

  for (var i = 0; i < length; ++i) {
    codePoint = string.charCodeAt(i)

    // is surrogate component
    if (codePoint > 0xD7FF && codePoint < 0xE000) {
      // last char was a lead
      if (!leadSurrogate) {
        // no lead yet
        if (codePoint > 0xDBFF) {
          // unexpected trail
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        } else if (i + 1 === length) {
          // unpaired lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
          continue
        }

        // valid lead
        leadSurrogate = codePoint

        continue
      }

      // 2 leads in a row
      if (codePoint < 0xDC00) {
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
        leadSurrogate = codePoint
        continue
      }

      // valid surrogate pair
      codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000
    } else if (leadSurrogate) {
      // valid bmp char, but last char was a lead
      if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD)
    }

    leadSurrogate = null

    // encode utf8
    if (codePoint < 0x80) {
      if ((units -= 1) < 0) break
      bytes.push(codePoint)
    } else if (codePoint < 0x800) {
      if ((units -= 2) < 0) break
      bytes.push(
        codePoint >> 0x6 | 0xC0,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x10000) {
      if ((units -= 3) < 0) break
      bytes.push(
        codePoint >> 0xC | 0xE0,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else if (codePoint < 0x110000) {
      if ((units -= 4) < 0) break
      bytes.push(
        codePoint >> 0x12 | 0xF0,
        codePoint >> 0xC & 0x3F | 0x80,
        codePoint >> 0x6 & 0x3F | 0x80,
        codePoint & 0x3F | 0x80
      )
    } else {
      throw new Error('Invalid code point')
    }
  }

  return bytes
}

function asciiToBytes (str) {
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    // Node's code seems to be doing this and not & 0x7F..
    byteArray.push(str.charCodeAt(i) & 0xFF)
  }
  return byteArray
}

function utf16leToBytes (str, units) {
  var c, hi, lo
  var byteArray = []
  for (var i = 0; i < str.length; ++i) {
    if ((units -= 2) < 0) break

    c = str.charCodeAt(i)
    hi = c >> 8
    lo = c % 256
    byteArray.push(lo)
    byteArray.push(hi)
  }

  return byteArray
}

function base64ToBytes (str) {
  return base64.toByteArray(base64clean(str))
}

function blitBuffer (src, dst, offset, length) {
  for (var i = 0; i < length; ++i) {
    if ((i + offset >= dst.length) || (i >= src.length)) break
    dst[i + offset] = src[i]
  }
  return i
}

// ArrayBuffer or Uint8Array objects from other contexts (i.e. iframes) do not pass
// the `instanceof` check but they should be treated as of that type.
// See: https://github.com/feross/buffer/issues/166
function isInstance (obj, type) {
  return obj instanceof type ||
    (obj != null && obj.constructor != null && obj.constructor.name != null &&
      obj.constructor.name === type.name)
}
function numberIsNaN (obj) {
  // For IE11 support
  return obj !== obj // eslint-disable-line no-self-compare
}

}).call(this,require("buffer").Buffer)
},{"base64-js":2,"buffer":4,"ieee754":9}],5:[function(require,module,exports){
module.exports = {
  "100": "Continue",
  "101": "Switching Protocols",
  "102": "Processing",
  "200": "OK",
  "201": "Created",
  "202": "Accepted",
  "203": "Non-Authoritative Information",
  "204": "No Content",
  "205": "Reset Content",
  "206": "Partial Content",
  "207": "Multi-Status",
  "208": "Already Reported",
  "226": "IM Used",
  "300": "Multiple Choices",
  "301": "Moved Permanently",
  "302": "Found",
  "303": "See Other",
  "304": "Not Modified",
  "305": "Use Proxy",
  "307": "Temporary Redirect",
  "308": "Permanent Redirect",
  "400": "Bad Request",
  "401": "Unauthorized",
  "402": "Payment Required",
  "403": "Forbidden",
  "404": "Not Found",
  "405": "Method Not Allowed",
  "406": "Not Acceptable",
  "407": "Proxy Authentication Required",
  "408": "Request Timeout",
  "409": "Conflict",
  "410": "Gone",
  "411": "Length Required",
  "412": "Precondition Failed",
  "413": "Payload Too Large",
  "414": "URI Too Long",
  "415": "Unsupported Media Type",
  "416": "Range Not Satisfiable",
  "417": "Expectation Failed",
  "418": "I'm a teapot",
  "421": "Misdirected Request",
  "422": "Unprocessable Entity",
  "423": "Locked",
  "424": "Failed Dependency",
  "425": "Unordered Collection",
  "426": "Upgrade Required",
  "428": "Precondition Required",
  "429": "Too Many Requests",
  "431": "Request Header Fields Too Large",
  "451": "Unavailable For Legal Reasons",
  "500": "Internal Server Error",
  "501": "Not Implemented",
  "502": "Bad Gateway",
  "503": "Service Unavailable",
  "504": "Gateway Timeout",
  "505": "HTTP Version Not Supported",
  "506": "Variant Also Negotiates",
  "507": "Insufficient Storage",
  "508": "Loop Detected",
  "509": "Bandwidth Limit Exceeded",
  "510": "Not Extended",
  "511": "Network Authentication Required"
}

},{}],6:[function(require,module,exports){
(function (Buffer){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.

function isArray(arg) {
  if (Array.isArray) {
    return Array.isArray(arg);
  }
  return objectToString(arg) === '[object Array]';
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = Buffer.isBuffer;

function objectToString(o) {
  return Object.prototype.toString.call(o);
}

}).call(this,{"isBuffer":require("../../is-buffer/index.js")})
},{"../../is-buffer/index.js":11}],7:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var objectCreate = Object.create || objectCreatePolyfill
var objectKeys = Object.keys || objectKeysPolyfill
var bind = Function.prototype.bind || functionBindPolyfill

function EventEmitter() {
  if (!this._events || !Object.prototype.hasOwnProperty.call(this, '_events')) {
    this._events = objectCreate(null);
    this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

var hasDefineProperty;
try {
  var o = {};
  if (Object.defineProperty) Object.defineProperty(o, 'x', { value: 0 });
  hasDefineProperty = o.x === 0;
} catch (err) { hasDefineProperty = false }
if (hasDefineProperty) {
  Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
    enumerable: true,
    get: function() {
      return defaultMaxListeners;
    },
    set: function(arg) {
      // check whether the input is a positive number (whose value is zero or
      // greater and not a NaN).
      if (typeof arg !== 'number' || arg < 0 || arg !== arg)
        throw new TypeError('"defaultMaxListeners" must be a positive number');
      defaultMaxListeners = arg;
    }
  });
} else {
  EventEmitter.defaultMaxListeners = defaultMaxListeners;
}

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || isNaN(n))
    throw new TypeError('"n" argument must be a positive number');
  this._maxListeners = n;
  return this;
};

function $getMaxListeners(that) {
  if (that._maxListeners === undefined)
    return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return $getMaxListeners(this);
};

// These standalone emit* functions are used to optimize calling of event
// handlers for fast cases because emit() itself often has a variable number of
// arguments and can be deoptimized because of that. These functions always have
// the same number of arguments and thus do not get deoptimized, so the code
// inside them can execute faster.
function emitNone(handler, isFn, self) {
  if (isFn)
    handler.call(self);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self);
  }
}
function emitOne(handler, isFn, self, arg1) {
  if (isFn)
    handler.call(self, arg1);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1);
  }
}
function emitTwo(handler, isFn, self, arg1, arg2) {
  if (isFn)
    handler.call(self, arg1, arg2);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2);
  }
}
function emitThree(handler, isFn, self, arg1, arg2, arg3) {
  if (isFn)
    handler.call(self, arg1, arg2, arg3);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].call(self, arg1, arg2, arg3);
  }
}

function emitMany(handler, isFn, self, args) {
  if (isFn)
    handler.apply(self, args);
  else {
    var len = handler.length;
    var listeners = arrayClone(handler, len);
    for (var i = 0; i < len; ++i)
      listeners[i].apply(self, args);
  }
}

EventEmitter.prototype.emit = function emit(type) {
  var er, handler, len, args, i, events;
  var doError = (type === 'error');

  events = this._events;
  if (events)
    doError = (doError && events.error == null);
  else if (!doError)
    return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
    if (arguments.length > 1)
      er = arguments[1];
    if (er instanceof Error) {
      throw er; // Unhandled 'error' event
    } else {
      // At least give some kind of context to the user
      var err = new Error('Unhandled "error" event. (' + er + ')');
      err.context = er;
      throw err;
    }
    return false;
  }

  handler = events[type];

  if (!handler)
    return false;

  var isFn = typeof handler === 'function';
  len = arguments.length;
  switch (len) {
      // fast cases
    case 1:
      emitNone(handler, isFn, this);
      break;
    case 2:
      emitOne(handler, isFn, this, arguments[1]);
      break;
    case 3:
      emitTwo(handler, isFn, this, arguments[1], arguments[2]);
      break;
    case 4:
      emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
      break;
      // slower
    default:
      args = new Array(len - 1);
      for (i = 1; i < len; i++)
        args[i - 1] = arguments[i];
      emitMany(handler, isFn, this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');

  events = target._events;
  if (!events) {
    events = target._events = objectCreate(null);
    target._eventsCount = 0;
  } else {
    // To avoid recursion in the case that type === "newListener"! Before
    // adding it to the listeners, first emit "newListener".
    if (events.newListener) {
      target.emit('newListener', type,
          listener.listener ? listener.listener : listener);

      // Re-assign `events` because a newListener handler could have caused the
      // this._events to be assigned to a new object
      events = target._events;
    }
    existing = events[type];
  }

  if (!existing) {
    // Optimize the case of one listener. Don't need the extra array object.
    existing = events[type] = listener;
    ++target._eventsCount;
  } else {
    if (typeof existing === 'function') {
      // Adding the second element, need to change to array.
      existing = events[type] =
          prepend ? [listener, existing] : [existing, listener];
    } else {
      // If we've already got an array, just append.
      if (prepend) {
        existing.unshift(listener);
      } else {
        existing.push(listener);
      }
    }

    // Check for listener leak
    if (!existing.warned) {
      m = $getMaxListeners(target);
      if (m && m > 0 && existing.length > m) {
        existing.warned = true;
        var w = new Error('Possible EventEmitter memory leak detected. ' +
            existing.length + ' "' + String(type) + '" listeners ' +
            'added. Use emitter.setMaxListeners() to ' +
            'increase limit.');
        w.name = 'MaxListenersExceededWarning';
        w.emitter = target;
        w.type = type;
        w.count = existing.length;
        if (typeof console === 'object' && console.warn) {
          console.warn('%s: %s', w.name, w.message);
        }
      }
    }
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
    function prependListener(type, listener) {
      return _addListener(this, type, listener, true);
    };

function onceWrapper() {
  if (!this.fired) {
    this.target.removeListener(this.type, this.wrapFn);
    this.fired = true;
    switch (arguments.length) {
      case 0:
        return this.listener.call(this.target);
      case 1:
        return this.listener.call(this.target, arguments[0]);
      case 2:
        return this.listener.call(this.target, arguments[0], arguments[1]);
      case 3:
        return this.listener.call(this.target, arguments[0], arguments[1],
            arguments[2]);
      default:
        var args = new Array(arguments.length);
        for (var i = 0; i < args.length; ++i)
          args[i] = arguments[i];
        this.listener.apply(this.target, args);
    }
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = bind.call(onceWrapper, state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  if (typeof listener !== 'function')
    throw new TypeError('"listener" argument must be a function');
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
    function prependOnceListener(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.prependListener(type, _onceWrap(this, type, listener));
      return this;
    };

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
    function removeListener(type, listener) {
      var list, events, position, i, originalListener;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = this._events;
      if (!events)
        return this;

      list = events[type];
      if (!list)
        return this;

      if (list === listener || list.listener === listener) {
        if (--this._eventsCount === 0)
          this._events = objectCreate(null);
        else {
          delete events[type];
          if (events.removeListener)
            this.emit('removeListener', type, list.listener || listener);
        }
      } else if (typeof list !== 'function') {
        position = -1;

        for (i = list.length - 1; i >= 0; i--) {
          if (list[i] === listener || list[i].listener === listener) {
            originalListener = list[i].listener;
            position = i;
            break;
          }
        }

        if (position < 0)
          return this;

        if (position === 0)
          list.shift();
        else
          spliceOne(list, position);

        if (list.length === 1)
          events[type] = list[0];

        if (events.removeListener)
          this.emit('removeListener', type, originalListener || listener);
      }

      return this;
    };

EventEmitter.prototype.removeAllListeners =
    function removeAllListeners(type) {
      var listeners, events, i;

      events = this._events;
      if (!events)
        return this;

      // not listening for removeListener, no need to emit
      if (!events.removeListener) {
        if (arguments.length === 0) {
          this._events = objectCreate(null);
          this._eventsCount = 0;
        } else if (events[type]) {
          if (--this._eventsCount === 0)
            this._events = objectCreate(null);
          else
            delete events[type];
        }
        return this;
      }

      // emit removeListener for all listeners on all events
      if (arguments.length === 0) {
        var keys = objectKeys(events);
        var key;
        for (i = 0; i < keys.length; ++i) {
          key = keys[i];
          if (key === 'removeListener') continue;
          this.removeAllListeners(key);
        }
        this.removeAllListeners('removeListener');
        this._events = objectCreate(null);
        this._eventsCount = 0;
        return this;
      }

      listeners = events[type];

      if (typeof listeners === 'function') {
        this.removeListener(type, listeners);
      } else if (listeners) {
        // LIFO order
        for (i = listeners.length - 1; i >= 0; i--) {
          this.removeListener(type, listeners[i]);
        }
      }

      return this;
    };

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (!events)
    return [];

  var evlistener = events[type];
  if (!evlistener)
    return [];

  if (typeof evlistener === 'function')
    return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ? unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
    return emitter.listenerCount(type);
  } else {
    return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events) {
    var evlistener = events[type];

    if (typeof evlistener === 'function') {
      return 1;
    } else if (evlistener) {
      return evlistener.length;
    }
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
};

// About 1.5x faster than the two-arg version of Array#splice().
function spliceOne(list, index) {
  for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
    list[i] = list[k];
  list.pop();
}

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
    copy[i] = arr[i];
  return copy;
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
    ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function objectCreatePolyfill(proto) {
  var F = function() {};
  F.prototype = proto;
  return new F;
}
function objectKeysPolyfill(obj) {
  var keys = [];
  for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k)) {
    keys.push(k);
  }
  return k;
}
function functionBindPolyfill(context) {
  var fn = this;
  return function () {
    return fn.apply(context, arguments);
  };
}

},{}],8:[function(require,module,exports){
var http = require('http')
var url = require('url')

var https = module.exports

for (var key in http) {
  if (http.hasOwnProperty(key)) https[key] = http[key]
}

https.request = function (params, cb) {
  params = validateParams(params)
  return http.request.call(this, params, cb)
}

https.get = function (params, cb) {
  params = validateParams(params)
  return http.get.call(this, params, cb)
}

function validateParams (params) {
  if (typeof params === 'string') {
    params = url.parse(params)
  }
  if (!params.protocol) {
    params.protocol = 'https:'
  }
  if (params.protocol !== 'https:') {
    throw new Error('Protocol "' + params.protocol + '" not supported. Expected "https:"')
  }
  return params
}

},{"http":30,"url":36}],9:[function(require,module,exports){
exports.read = function (buffer, offset, isLE, mLen, nBytes) {
  var e, m
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var nBits = -7
  var i = isLE ? (nBytes - 1) : 0
  var d = isLE ? -1 : 1
  var s = buffer[offset + i]

  i += d

  e = s & ((1 << (-nBits)) - 1)
  s >>= (-nBits)
  nBits += eLen
  for (; nBits > 0; e = (e * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  m = e & ((1 << (-nBits)) - 1)
  e >>= (-nBits)
  nBits += mLen
  for (; nBits > 0; m = (m * 256) + buffer[offset + i], i += d, nBits -= 8) {}

  if (e === 0) {
    e = 1 - eBias
  } else if (e === eMax) {
    return m ? NaN : ((s ? -1 : 1) * Infinity)
  } else {
    m = m + Math.pow(2, mLen)
    e = e - eBias
  }
  return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
}

exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
  var e, m, c
  var eLen = (nBytes * 8) - mLen - 1
  var eMax = (1 << eLen) - 1
  var eBias = eMax >> 1
  var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0)
  var i = isLE ? 0 : (nBytes - 1)
  var d = isLE ? 1 : -1
  var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0

  value = Math.abs(value)

  if (isNaN(value) || value === Infinity) {
    m = isNaN(value) ? 1 : 0
    e = eMax
  } else {
    e = Math.floor(Math.log(value) / Math.LN2)
    if (value * (c = Math.pow(2, -e)) < 1) {
      e--
      c *= 2
    }
    if (e + eBias >= 1) {
      value += rt / c
    } else {
      value += rt * Math.pow(2, 1 - eBias)
    }
    if (value * c >= 2) {
      e++
      c /= 2
    }

    if (e + eBias >= eMax) {
      m = 0
      e = eMax
    } else if (e + eBias >= 1) {
      m = ((value * c) - 1) * Math.pow(2, mLen)
      e = e + eBias
    } else {
      m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen)
      e = 0
    }
  }

  for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

  e = (e << mLen) | m
  eLen += mLen
  for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

  buffer[offset + i - d] |= s * 128
}

},{}],10:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],11:[function(require,module,exports){
/*!
 * Determine if an object is a Buffer
 *
 * @author   Feross Aboukhadijeh <https://feross.org>
 * @license  MIT
 */

// The _isBuffer check is for Safari 5-7 support, because it's missing
// Object.prototype.constructor. Remove this eventually
module.exports = function (obj) {
  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
}

function isBuffer (obj) {
  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
}

// For Node v0.10 support. Remove this eventually.
function isSlowBuffer (obj) {
  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
}

},{}],12:[function(require,module,exports){
var toString = {}.toString;

module.exports = Array.isArray || function (arr) {
  return toString.call(arr) == '[object Array]';
};

},{}],13:[function(require,module,exports){
(function (process){
'use strict';

if (!process.version ||
    process.version.indexOf('v0.') === 0 ||
    process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
  module.exports = { nextTick: nextTick };
} else {
  module.exports = process
}

function nextTick(fn, arg1, arg2, arg3) {
  if (typeof fn !== 'function') {
    throw new TypeError('"callback" argument must be a function');
  }
  var len = arguments.length;
  var args, i;
  switch (len) {
  case 0:
  case 1:
    return process.nextTick(fn);
  case 2:
    return process.nextTick(function afterTickOne() {
      fn.call(null, arg1);
    });
  case 3:
    return process.nextTick(function afterTickTwo() {
      fn.call(null, arg1, arg2);
    });
  case 4:
    return process.nextTick(function afterTickThree() {
      fn.call(null, arg1, arg2, arg3);
    });
  default:
    args = new Array(len - 1);
    i = 0;
    while (i < args.length) {
      args[i++] = arguments[i];
    }
    return process.nextTick(function afterTick() {
      fn.apply(null, args);
    });
  }
}


}).call(this,require('_process'))
},{"_process":14}],14:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],15:[function(require,module,exports){
(function (global){
/*! https://mths.be/punycode v1.4.1 by @mathias */
;(function(root) {

	/** Detect free variables */
	var freeExports = typeof exports == 'object' && exports &&
		!exports.nodeType && exports;
	var freeModule = typeof module == 'object' && module &&
		!module.nodeType && module;
	var freeGlobal = typeof global == 'object' && global;
	if (
		freeGlobal.global === freeGlobal ||
		freeGlobal.window === freeGlobal ||
		freeGlobal.self === freeGlobal
	) {
		root = freeGlobal;
	}

	/**
	 * The `punycode` object.
	 * @name punycode
	 * @type Object
	 */
	var punycode,

	/** Highest positive signed 32-bit float value */
	maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1

	/** Bootstring parameters */
	base = 36,
	tMin = 1,
	tMax = 26,
	skew = 38,
	damp = 700,
	initialBias = 72,
	initialN = 128, // 0x80
	delimiter = '-', // '\x2D'

	/** Regular expressions */
	regexPunycode = /^xn--/,
	regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
	regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators

	/** Error messages */
	errors = {
		'overflow': 'Overflow: input needs wider integers to process',
		'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
		'invalid-input': 'Invalid input'
	},

	/** Convenience shortcuts */
	baseMinusTMin = base - tMin,
	floor = Math.floor,
	stringFromCharCode = String.fromCharCode,

	/** Temporary variable */
	key;

	/*--------------------------------------------------------------------------*/

	/**
	 * A generic error utility function.
	 * @private
	 * @param {String} type The error type.
	 * @returns {Error} Throws a `RangeError` with the applicable error message.
	 */
	function error(type) {
		throw new RangeError(errors[type]);
	}

	/**
	 * A generic `Array#map` utility function.
	 * @private
	 * @param {Array} array The array to iterate over.
	 * @param {Function} callback The function that gets called for every array
	 * item.
	 * @returns {Array} A new array of values returned by the callback function.
	 */
	function map(array, fn) {
		var length = array.length;
		var result = [];
		while (length--) {
			result[length] = fn(array[length]);
		}
		return result;
	}

	/**
	 * A simple `Array#map`-like wrapper to work with domain name strings or email
	 * addresses.
	 * @private
	 * @param {String} domain The domain name or email address.
	 * @param {Function} callback The function that gets called for every
	 * character.
	 * @returns {Array} A new string of characters returned by the callback
	 * function.
	 */
	function mapDomain(string, fn) {
		var parts = string.split('@');
		var result = '';
		if (parts.length > 1) {
			// In email addresses, only the domain name should be punycoded. Leave
			// the local part (i.e. everything up to `@`) intact.
			result = parts[0] + '@';
			string = parts[1];
		}
		// Avoid `split(regex)` for IE8 compatibility. See #17.
		string = string.replace(regexSeparators, '\x2E');
		var labels = string.split('.');
		var encoded = map(labels, fn).join('.');
		return result + encoded;
	}

	/**
	 * Creates an array containing the numeric code points of each Unicode
	 * character in the string. While JavaScript uses UCS-2 internally,
	 * this function will convert a pair of surrogate halves (each of which
	 * UCS-2 exposes as separate characters) into a single code point,
	 * matching UTF-16.
	 * @see `punycode.ucs2.encode`
	 * @see <https://mathiasbynens.be/notes/javascript-encoding>
	 * @memberOf punycode.ucs2
	 * @name decode
	 * @param {String} string The Unicode input string (UCS-2).
	 * @returns {Array} The new array of code points.
	 */
	function ucs2decode(string) {
		var output = [],
		    counter = 0,
		    length = string.length,
		    value,
		    extra;
		while (counter < length) {
			value = string.charCodeAt(counter++);
			if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
				// high surrogate, and there is a next character
				extra = string.charCodeAt(counter++);
				if ((extra & 0xFC00) == 0xDC00) { // low surrogate
					output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
				} else {
					// unmatched surrogate; only append this code unit, in case the next
					// code unit is the high surrogate of a surrogate pair
					output.push(value);
					counter--;
				}
			} else {
				output.push(value);
			}
		}
		return output;
	}

	/**
	 * Creates a string based on an array of numeric code points.
	 * @see `punycode.ucs2.decode`
	 * @memberOf punycode.ucs2
	 * @name encode
	 * @param {Array} codePoints The array of numeric code points.
	 * @returns {String} The new Unicode string (UCS-2).
	 */
	function ucs2encode(array) {
		return map(array, function(value) {
			var output = '';
			if (value > 0xFFFF) {
				value -= 0x10000;
				output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
				value = 0xDC00 | value & 0x3FF;
			}
			output += stringFromCharCode(value);
			return output;
		}).join('');
	}

	/**
	 * Converts a basic code point into a digit/integer.
	 * @see `digitToBasic()`
	 * @private
	 * @param {Number} codePoint The basic numeric code point value.
	 * @returns {Number} The numeric value of a basic code point (for use in
	 * representing integers) in the range `0` to `base - 1`, or `base` if
	 * the code point does not represent a value.
	 */
	function basicToDigit(codePoint) {
		if (codePoint - 48 < 10) {
			return codePoint - 22;
		}
		if (codePoint - 65 < 26) {
			return codePoint - 65;
		}
		if (codePoint - 97 < 26) {
			return codePoint - 97;
		}
		return base;
	}

	/**
	 * Converts a digit/integer into a basic code point.
	 * @see `basicToDigit()`
	 * @private
	 * @param {Number} digit The numeric value of a basic code point.
	 * @returns {Number} The basic code point whose value (when used for
	 * representing integers) is `digit`, which needs to be in the range
	 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
	 * used; else, the lowercase form is used. The behavior is undefined
	 * if `flag` is non-zero and `digit` has no uppercase form.
	 */
	function digitToBasic(digit, flag) {
		//  0..25 map to ASCII a..z or A..Z
		// 26..35 map to ASCII 0..9
		return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
	}

	/**
	 * Bias adaptation function as per section 3.4 of RFC 3492.
	 * https://tools.ietf.org/html/rfc3492#section-3.4
	 * @private
	 */
	function adapt(delta, numPoints, firstTime) {
		var k = 0;
		delta = firstTime ? floor(delta / damp) : delta >> 1;
		delta += floor(delta / numPoints);
		for (/* no initialization */; delta > baseMinusTMin * tMax >> 1; k += base) {
			delta = floor(delta / baseMinusTMin);
		}
		return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
	}

	/**
	 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
	 * symbols.
	 * @memberOf punycode
	 * @param {String} input The Punycode string of ASCII-only symbols.
	 * @returns {String} The resulting string of Unicode symbols.
	 */
	function decode(input) {
		// Don't use UCS-2
		var output = [],
		    inputLength = input.length,
		    out,
		    i = 0,
		    n = initialN,
		    bias = initialBias,
		    basic,
		    j,
		    index,
		    oldi,
		    w,
		    k,
		    digit,
		    t,
		    /** Cached calculation results */
		    baseMinusT;

		// Handle the basic code points: let `basic` be the number of input code
		// points before the last delimiter, or `0` if there is none, then copy
		// the first basic code points to the output.

		basic = input.lastIndexOf(delimiter);
		if (basic < 0) {
			basic = 0;
		}

		for (j = 0; j < basic; ++j) {
			// if it's not a basic code point
			if (input.charCodeAt(j) >= 0x80) {
				error('not-basic');
			}
			output.push(input.charCodeAt(j));
		}

		// Main decoding loop: start just after the last delimiter if any basic code
		// points were copied; start at the beginning otherwise.

		for (index = basic > 0 ? basic + 1 : 0; index < inputLength; /* no final expression */) {

			// `index` is the index of the next character to be consumed.
			// Decode a generalized variable-length integer into `delta`,
			// which gets added to `i`. The overflow checking is easier
			// if we increase `i` as we go, then subtract off its starting
			// value at the end to obtain `delta`.
			for (oldi = i, w = 1, k = base; /* no condition */; k += base) {

				if (index >= inputLength) {
					error('invalid-input');
				}

				digit = basicToDigit(input.charCodeAt(index++));

				if (digit >= base || digit > floor((maxInt - i) / w)) {
					error('overflow');
				}

				i += digit * w;
				t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);

				if (digit < t) {
					break;
				}

				baseMinusT = base - t;
				if (w > floor(maxInt / baseMinusT)) {
					error('overflow');
				}

				w *= baseMinusT;

			}

			out = output.length + 1;
			bias = adapt(i - oldi, out, oldi == 0);

			// `i` was supposed to wrap around from `out` to `0`,
			// incrementing `n` each time, so we'll fix that now:
			if (floor(i / out) > maxInt - n) {
				error('overflow');
			}

			n += floor(i / out);
			i %= out;

			// Insert `n` at position `i` of the output
			output.splice(i++, 0, n);

		}

		return ucs2encode(output);
	}

	/**
	 * Converts a string of Unicode symbols (e.g. a domain name label) to a
	 * Punycode string of ASCII-only symbols.
	 * @memberOf punycode
	 * @param {String} input The string of Unicode symbols.
	 * @returns {String} The resulting Punycode string of ASCII-only symbols.
	 */
	function encode(input) {
		var n,
		    delta,
		    handledCPCount,
		    basicLength,
		    bias,
		    j,
		    m,
		    q,
		    k,
		    t,
		    currentValue,
		    output = [],
		    /** `inputLength` will hold the number of code points in `input`. */
		    inputLength,
		    /** Cached calculation results */
		    handledCPCountPlusOne,
		    baseMinusT,
		    qMinusT;

		// Convert the input in UCS-2 to Unicode
		input = ucs2decode(input);

		// Cache the length
		inputLength = input.length;

		// Initialize the state
		n = initialN;
		delta = 0;
		bias = initialBias;

		// Handle the basic code points
		for (j = 0; j < inputLength; ++j) {
			currentValue = input[j];
			if (currentValue < 0x80) {
				output.push(stringFromCharCode(currentValue));
			}
		}

		handledCPCount = basicLength = output.length;

		// `handledCPCount` is the number of code points that have been handled;
		// `basicLength` is the number of basic code points.

		// Finish the basic string - if it is not empty - with a delimiter
		if (basicLength) {
			output.push(delimiter);
		}

		// Main encoding loop:
		while (handledCPCount < inputLength) {

			// All non-basic code points < n have been handled already. Find the next
			// larger one:
			for (m = maxInt, j = 0; j < inputLength; ++j) {
				currentValue = input[j];
				if (currentValue >= n && currentValue < m) {
					m = currentValue;
				}
			}

			// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
			// but guard against overflow
			handledCPCountPlusOne = handledCPCount + 1;
			if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
				error('overflow');
			}

			delta += (m - n) * handledCPCountPlusOne;
			n = m;

			for (j = 0; j < inputLength; ++j) {
				currentValue = input[j];

				if (currentValue < n && ++delta > maxInt) {
					error('overflow');
				}

				if (currentValue == n) {
					// Represent delta as a generalized variable-length integer
					for (q = delta, k = base; /* no condition */; k += base) {
						t = k <= bias ? tMin : (k >= bias + tMax ? tMax : k - bias);
						if (q < t) {
							break;
						}
						qMinusT = q - t;
						baseMinusT = base - t;
						output.push(
							stringFromCharCode(digitToBasic(t + qMinusT % baseMinusT, 0))
						);
						q = floor(qMinusT / baseMinusT);
					}

					output.push(stringFromCharCode(digitToBasic(q, 0)));
					bias = adapt(delta, handledCPCountPlusOne, handledCPCount == basicLength);
					delta = 0;
					++handledCPCount;
				}
			}

			++delta;
			++n;

		}
		return output.join('');
	}

	/**
	 * Converts a Punycode string representing a domain name or an email address
	 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
	 * it doesn't matter if you call it on a string that has already been
	 * converted to Unicode.
	 * @memberOf punycode
	 * @param {String} input The Punycoded domain name or email address to
	 * convert to Unicode.
	 * @returns {String} The Unicode representation of the given Punycode
	 * string.
	 */
	function toUnicode(input) {
		return mapDomain(input, function(string) {
			return regexPunycode.test(string)
				? decode(string.slice(4).toLowerCase())
				: string;
		});
	}

	/**
	 * Converts a Unicode string representing a domain name or an email address to
	 * Punycode. Only the non-ASCII parts of the domain name will be converted,
	 * i.e. it doesn't matter if you call it with a domain that's already in
	 * ASCII.
	 * @memberOf punycode
	 * @param {String} input The domain name or email address to convert, as a
	 * Unicode string.
	 * @returns {String} The Punycode representation of the given domain name or
	 * email address.
	 */
	function toASCII(input) {
		return mapDomain(input, function(string) {
			return regexNonASCII.test(string)
				? 'xn--' + encode(string)
				: string;
		});
	}

	/*--------------------------------------------------------------------------*/

	/** Define the public API */
	punycode = {
		/**
		 * A string representing the current Punycode.js version number.
		 * @memberOf punycode
		 * @type String
		 */
		'version': '1.4.1',
		/**
		 * An object of methods to convert from JavaScript's internal character
		 * representation (UCS-2) to Unicode code points, and back.
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode
		 * @type Object
		 */
		'ucs2': {
			'decode': ucs2decode,
			'encode': ucs2encode
		},
		'decode': decode,
		'encode': encode,
		'toASCII': toASCII,
		'toUnicode': toUnicode
	};

	/** Expose `punycode` */
	// Some AMD build optimizers, like r.js, check for specific condition patterns
	// like the following:
	if (
		typeof define == 'function' &&
		typeof define.amd == 'object' &&
		define.amd
	) {
		define('punycode', function() {
			return punycode;
		});
	} else if (freeExports && freeModule) {
		if (module.exports == freeExports) {
			// in Node.js, io.js, or RingoJS v0.8.0+
			freeModule.exports = punycode;
		} else {
			// in Narwhal or RingoJS v0.7.0-
			for (key in punycode) {
				punycode.hasOwnProperty(key) && (freeExports[key] = punycode[key]);
			}
		}
	} else {
		// in Rhino or a web browser
		root.punycode = punycode;
	}

}(this));

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],16:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

// If obj.hasOwnProperty has been overridden, then calling
// obj.hasOwnProperty(prop) will break.
// See: https://github.com/joyent/node/issues/1707
function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

module.exports = function(qs, sep, eq, options) {
  sep = sep || '&';
  eq = eq || '=';
  var obj = {};

  if (typeof qs !== 'string' || qs.length === 0) {
    return obj;
  }

  var regexp = /\+/g;
  qs = qs.split(sep);

  var maxKeys = 1000;
  if (options && typeof options.maxKeys === 'number') {
    maxKeys = options.maxKeys;
  }

  var len = qs.length;
  // maxKeys <= 0 means that we should not limit keys count
  if (maxKeys > 0 && len > maxKeys) {
    len = maxKeys;
  }

  for (var i = 0; i < len; ++i) {
    var x = qs[i].replace(regexp, '%20'),
        idx = x.indexOf(eq),
        kstr, vstr, k, v;

    if (idx >= 0) {
      kstr = x.substr(0, idx);
      vstr = x.substr(idx + 1);
    } else {
      kstr = x;
      vstr = '';
    }

    k = decodeURIComponent(kstr);
    v = decodeURIComponent(vstr);

    if (!hasOwnProperty(obj, k)) {
      obj[k] = v;
    } else if (isArray(obj[k])) {
      obj[k].push(v);
    } else {
      obj[k] = [obj[k], v];
    }
  }

  return obj;
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

},{}],17:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var stringifyPrimitive = function(v) {
  switch (typeof v) {
    case 'string':
      return v;

    case 'boolean':
      return v ? 'true' : 'false';

    case 'number':
      return isFinite(v) ? v : '';

    default:
      return '';
  }
};

module.exports = function(obj, sep, eq, name) {
  sep = sep || '&';
  eq = eq || '=';
  if (obj === null) {
    obj = undefined;
  }

  if (typeof obj === 'object') {
    return map(objectKeys(obj), function(k) {
      var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
      if (isArray(obj[k])) {
        return map(obj[k], function(v) {
          return ks + encodeURIComponent(stringifyPrimitive(v));
        }).join(sep);
      } else {
        return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
      }
    }).join(sep);

  }

  if (!name) return '';
  return encodeURIComponent(stringifyPrimitive(name)) + eq +
         encodeURIComponent(stringifyPrimitive(obj));
};

var isArray = Array.isArray || function (xs) {
  return Object.prototype.toString.call(xs) === '[object Array]';
};

function map (xs, f) {
  if (xs.map) return xs.map(f);
  var res = [];
  for (var i = 0; i < xs.length; i++) {
    res.push(f(xs[i], i));
  }
  return res;
}

var objectKeys = Object.keys || function (obj) {
  var res = [];
  for (var key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) res.push(key);
  }
  return res;
};

},{}],18:[function(require,module,exports){
'use strict';

exports.decode = exports.parse = require('./decode');
exports.encode = exports.stringify = require('./encode');

},{"./decode":16,"./encode":17}],19:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a duplex stream is just a stream that is both readable and writable.
// Since JS doesn't have multiple prototypal inheritance, this class
// prototypally inherits from Readable, and then parasitically from
// Writable.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

/*<replacement>*/
var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    keys.push(key);
  }return keys;
};
/*</replacement>*/

module.exports = Duplex;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

var Readable = require('./_stream_readable');
var Writable = require('./_stream_writable');

util.inherits(Duplex, Readable);

{
  // avoid scope creep, the keys array can then be collected
  var keys = objectKeys(Writable.prototype);
  for (var v = 0; v < keys.length; v++) {
    var method = keys[v];
    if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
  }
}

function Duplex(options) {
  if (!(this instanceof Duplex)) return new Duplex(options);

  Readable.call(this, options);
  Writable.call(this, options);

  if (options && options.readable === false) this.readable = false;

  if (options && options.writable === false) this.writable = false;

  this.allowHalfOpen = true;
  if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

  this.once('end', onend);
}

Object.defineProperty(Duplex.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// the no-half-open enforcer
function onend() {
  // if we allow half-open state, or if the writable side ended,
  // then we're ok.
  if (this.allowHalfOpen || this._writableState.ended) return;

  // no more data can be written.
  // But allow more writes to happen in this tick.
  pna.nextTick(onEndNT, this);
}

function onEndNT(self) {
  self.end();
}

Object.defineProperty(Duplex.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined || this._writableState === undefined) {
      return false;
    }
    return this._readableState.destroyed && this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (this._readableState === undefined || this._writableState === undefined) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
    this._writableState.destroyed = value;
  }
});

Duplex.prototype._destroy = function (err, cb) {
  this.push(null);
  this.end();

  pna.nextTick(cb, err);
};
},{"./_stream_readable":21,"./_stream_writable":23,"core-util-is":6,"inherits":10,"process-nextick-args":13}],20:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a passthrough stream.
// basically just the most minimal sort of Transform stream.
// Every written chunk gets output as-is.

'use strict';

module.exports = PassThrough;

var Transform = require('./_stream_transform');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(PassThrough, Transform);

function PassThrough(options) {
  if (!(this instanceof PassThrough)) return new PassThrough(options);

  Transform.call(this, options);
}

PassThrough.prototype._transform = function (chunk, encoding, cb) {
  cb(null, chunk);
};
},{"./_stream_transform":22,"core-util-is":6,"inherits":10}],21:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

module.exports = Readable;

/*<replacement>*/
var isArray = require('isarray');
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Readable.ReadableState = ReadableState;

/*<replacement>*/
var EE = require('events').EventEmitter;

var EElistenerCount = function (emitter, type) {
  return emitter.listeners(type).length;
};
/*</replacement>*/

/*<replacement>*/
var Stream = require('./internal/streams/stream');
/*</replacement>*/

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var debugUtil = require('util');
var debug = void 0;
if (debugUtil && debugUtil.debuglog) {
  debug = debugUtil.debuglog('stream');
} else {
  debug = function () {};
}
/*</replacement>*/

var BufferList = require('./internal/streams/BufferList');
var destroyImpl = require('./internal/streams/destroy');
var StringDecoder;

util.inherits(Readable, Stream);

var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

function prependListener(emitter, event, fn) {
  // Sadly this is not cacheable as some libraries bundle their own
  // event emitter implementation with them.
  if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);

  // This is a hack to make sure that our error handler is attached before any
  // userland ones.  NEVER DO THIS. This is here only because this code needs
  // to continue to work with older versions of Node.js that do not include
  // the prependListener() method. The goal is to eventually remove this hack.
  if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
}

function ReadableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag. Used to make read(n) ignore n and to
  // make all the buffer merging and length checks go away
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

  // the point at which it stops calling _read() to fill the buffer
  // Note: 0 is a valid value, means "don't call _read preemptively ever"
  var hwm = options.highWaterMark;
  var readableHwm = options.readableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // A linked list is used to store data chunks instead of an array because the
  // linked list can remove elements from the beginning faster than
  // array.shift()
  this.buffer = new BufferList();
  this.length = 0;
  this.pipes = null;
  this.pipesCount = 0;
  this.flowing = null;
  this.ended = false;
  this.endEmitted = false;
  this.reading = false;

  // a flag to be able to tell if the event 'readable'/'data' is emitted
  // immediately, or on a later tick.  We set this to true at first, because
  // any actions that shouldn't happen until "later" should generally also
  // not happen before the first read call.
  this.sync = true;

  // whenever we return null, then we set a flag to say
  // that we're awaiting a 'readable' event emission.
  this.needReadable = false;
  this.emittedReadable = false;
  this.readableListening = false;
  this.resumeScheduled = false;

  // has it been destroyed
  this.destroyed = false;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // the number of writers that are awaiting a drain event in .pipe()s
  this.awaitDrain = 0;

  // if true, a maybeReadMore has been scheduled
  this.readingMore = false;

  this.decoder = null;
  this.encoding = null;
  if (options.encoding) {
    if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
    this.decoder = new StringDecoder(options.encoding);
    this.encoding = options.encoding;
  }
}

function Readable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  if (!(this instanceof Readable)) return new Readable(options);

  this._readableState = new ReadableState(options, this);

  // legacy
  this.readable = true;

  if (options) {
    if (typeof options.read === 'function') this._read = options.read;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;
  }

  Stream.call(this);
}

Object.defineProperty(Readable.prototype, 'destroyed', {
  get: function () {
    if (this._readableState === undefined) {
      return false;
    }
    return this._readableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._readableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._readableState.destroyed = value;
  }
});

Readable.prototype.destroy = destroyImpl.destroy;
Readable.prototype._undestroy = destroyImpl.undestroy;
Readable.prototype._destroy = function (err, cb) {
  this.push(null);
  cb(err);
};

// Manually shove something into the read() buffer.
// This returns true if the highWaterMark has not been hit yet,
// similar to how Writable.write() returns true if you should
// write() some more.
Readable.prototype.push = function (chunk, encoding) {
  var state = this._readableState;
  var skipChunkCheck;

  if (!state.objectMode) {
    if (typeof chunk === 'string') {
      encoding = encoding || state.defaultEncoding;
      if (encoding !== state.encoding) {
        chunk = Buffer.from(chunk, encoding);
        encoding = '';
      }
      skipChunkCheck = true;
    }
  } else {
    skipChunkCheck = true;
  }

  return readableAddChunk(this, chunk, encoding, false, skipChunkCheck);
};

// Unshift should *always* be something directly out of read()
Readable.prototype.unshift = function (chunk) {
  return readableAddChunk(this, chunk, null, true, false);
};

function readableAddChunk(stream, chunk, encoding, addToFront, skipChunkCheck) {
  var state = stream._readableState;
  if (chunk === null) {
    state.reading = false;
    onEofChunk(stream, state);
  } else {
    var er;
    if (!skipChunkCheck) er = chunkInvalid(state, chunk);
    if (er) {
      stream.emit('error', er);
    } else if (state.objectMode || chunk && chunk.length > 0) {
      if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer.prototype) {
        chunk = _uint8ArrayToBuffer(chunk);
      }

      if (addToFront) {
        if (state.endEmitted) stream.emit('error', new Error('stream.unshift() after end event'));else addChunk(stream, state, chunk, true);
      } else if (state.ended) {
        stream.emit('error', new Error('stream.push() after EOF'));
      } else {
        state.reading = false;
        if (state.decoder && !encoding) {
          chunk = state.decoder.write(chunk);
          if (state.objectMode || chunk.length !== 0) addChunk(stream, state, chunk, false);else maybeReadMore(stream, state);
        } else {
          addChunk(stream, state, chunk, false);
        }
      }
    } else if (!addToFront) {
      state.reading = false;
    }
  }

  return needMoreData(state);
}

function addChunk(stream, state, chunk, addToFront) {
  if (state.flowing && state.length === 0 && !state.sync) {
    stream.emit('data', chunk);
    stream.read(0);
  } else {
    // update the buffer info.
    state.length += state.objectMode ? 1 : chunk.length;
    if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

    if (state.needReadable) emitReadable(stream);
  }
  maybeReadMore(stream, state);
}

function chunkInvalid(state, chunk) {
  var er;
  if (!_isUint8Array(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  return er;
}

// if it's past the high water mark, we can push in some more.
// Also, if we have no data yet, we can stand some
// more bytes.  This is to work around cases where hwm=0,
// such as the repl.  Also, if the push() triggered a
// readable event, and the user called read(largeNumber) such that
// needReadable was set, then we ought to push more, so that another
// 'readable' event will be triggered.
function needMoreData(state) {
  return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
}

Readable.prototype.isPaused = function () {
  return this._readableState.flowing === false;
};

// backwards compatibility.
Readable.prototype.setEncoding = function (enc) {
  if (!StringDecoder) StringDecoder = require('string_decoder/').StringDecoder;
  this._readableState.decoder = new StringDecoder(enc);
  this._readableState.encoding = enc;
  return this;
};

// Don't raise the hwm > 8MB
var MAX_HWM = 0x800000;
function computeNewHighWaterMark(n) {
  if (n >= MAX_HWM) {
    n = MAX_HWM;
  } else {
    // Get the next highest power of 2 to prevent increasing hwm excessively in
    // tiny amounts
    n--;
    n |= n >>> 1;
    n |= n >>> 2;
    n |= n >>> 4;
    n |= n >>> 8;
    n |= n >>> 16;
    n++;
  }
  return n;
}

// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function howMuchToRead(n, state) {
  if (n <= 0 || state.length === 0 && state.ended) return 0;
  if (state.objectMode) return 1;
  if (n !== n) {
    // Only flow one buffer at a time
    if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
  }
  // If we're asking for more than the current hwm, then raise the hwm.
  if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
  if (n <= state.length) return n;
  // Don't have enough
  if (!state.ended) {
    state.needReadable = true;
    return 0;
  }
  return state.length;
}

// you can override either this method, or the async _read(n) below.
Readable.prototype.read = function (n) {
  debug('read', n);
  n = parseInt(n, 10);
  var state = this._readableState;
  var nOrig = n;

  if (n !== 0) state.emittedReadable = false;

  // if we're doing read(0) to trigger a readable event, but we
  // already have a bunch of data in the buffer, then just trigger
  // the 'readable' event and move on.
  if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
    debug('read: emitReadable', state.length, state.ended);
    if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
    return null;
  }

  n = howMuchToRead(n, state);

  // if we've ended, and we're now clear, then finish it up.
  if (n === 0 && state.ended) {
    if (state.length === 0) endReadable(this);
    return null;
  }

  // All the actual chunk generation logic needs to be
  // *below* the call to _read.  The reason is that in certain
  // synthetic stream cases, such as passthrough streams, _read
  // may be a completely synchronous operation which may change
  // the state of the read buffer, providing enough data when
  // before there was *not* enough.
  //
  // So, the steps are:
  // 1. Figure out what the state of things will be after we do
  // a read from the buffer.
  //
  // 2. If that resulting state will trigger a _read, then call _read.
  // Note that this may be asynchronous, or synchronous.  Yes, it is
  // deeply ugly to write APIs this way, but that still doesn't mean
  // that the Readable class should behave improperly, as streams are
  // designed to be sync/async agnostic.
  // Take note if the _read call is sync or async (ie, if the read call
  // has returned yet), so that we know whether or not it's safe to emit
  // 'readable' etc.
  //
  // 3. Actually pull the requested chunks out of the buffer and return.

  // if we need a readable event, then we need to do some reading.
  var doRead = state.needReadable;
  debug('need readable', doRead);

  // if we currently have less than the highWaterMark, then also read some
  if (state.length === 0 || state.length - n < state.highWaterMark) {
    doRead = true;
    debug('length less than watermark', doRead);
  }

  // however, if we've ended, then there's no point, and if we're already
  // reading, then it's unnecessary.
  if (state.ended || state.reading) {
    doRead = false;
    debug('reading or ended', doRead);
  } else if (doRead) {
    debug('do read');
    state.reading = true;
    state.sync = true;
    // if the length is currently zero, then we *need* a readable event.
    if (state.length === 0) state.needReadable = true;
    // call internal read method
    this._read(state.highWaterMark);
    state.sync = false;
    // If _read pushed data synchronously, then `reading` will be false,
    // and we need to re-evaluate how much data we can return to the user.
    if (!state.reading) n = howMuchToRead(nOrig, state);
  }

  var ret;
  if (n > 0) ret = fromList(n, state);else ret = null;

  if (ret === null) {
    state.needReadable = true;
    n = 0;
  } else {
    state.length -= n;
  }

  if (state.length === 0) {
    // If we have nothing in the buffer, then we want to know
    // as soon as we *do* get something into the buffer.
    if (!state.ended) state.needReadable = true;

    // If we tried to read() past the EOF, then emit end on the next tick.
    if (nOrig !== n && state.ended) endReadable(this);
  }

  if (ret !== null) this.emit('data', ret);

  return ret;
};

function onEofChunk(stream, state) {
  if (state.ended) return;
  if (state.decoder) {
    var chunk = state.decoder.end();
    if (chunk && chunk.length) {
      state.buffer.push(chunk);
      state.length += state.objectMode ? 1 : chunk.length;
    }
  }
  state.ended = true;

  // emit 'readable' now to make sure it gets picked up.
  emitReadable(stream);
}

// Don't emit readable right away in sync mode, because this can trigger
// another read() call => stack overflow.  This way, it might trigger
// a nextTick recursion warning, but that's not so bad.
function emitReadable(stream) {
  var state = stream._readableState;
  state.needReadable = false;
  if (!state.emittedReadable) {
    debug('emitReadable', state.flowing);
    state.emittedReadable = true;
    if (state.sync) pna.nextTick(emitReadable_, stream);else emitReadable_(stream);
  }
}

function emitReadable_(stream) {
  debug('emit readable');
  stream.emit('readable');
  flow(stream);
}

// at this point, the user has presumably seen the 'readable' event,
// and called read() to consume some data.  that may have triggered
// in turn another _read(n) call, in which case reading = true if
// it's in progress.
// However, if we're not ended, or reading, and the length < hwm,
// then go ahead and try to read some more preemptively.
function maybeReadMore(stream, state) {
  if (!state.readingMore) {
    state.readingMore = true;
    pna.nextTick(maybeReadMore_, stream, state);
  }
}

function maybeReadMore_(stream, state) {
  var len = state.length;
  while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
    debug('maybeReadMore read 0');
    stream.read(0);
    if (len === state.length)
      // didn't get any data, stop spinning.
      break;else len = state.length;
  }
  state.readingMore = false;
}

// abstract method.  to be overridden in specific implementation classes.
// call cb(er, data) where data is <= n in length.
// for virtual (non-string, non-buffer) streams, "length" is somewhat
// arbitrary, and perhaps not very meaningful.
Readable.prototype._read = function (n) {
  this.emit('error', new Error('_read() is not implemented'));
};

Readable.prototype.pipe = function (dest, pipeOpts) {
  var src = this;
  var state = this._readableState;

  switch (state.pipesCount) {
    case 0:
      state.pipes = dest;
      break;
    case 1:
      state.pipes = [state.pipes, dest];
      break;
    default:
      state.pipes.push(dest);
      break;
  }
  state.pipesCount += 1;
  debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

  var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

  var endFn = doEnd ? onend : unpipe;
  if (state.endEmitted) pna.nextTick(endFn);else src.once('end', endFn);

  dest.on('unpipe', onunpipe);
  function onunpipe(readable, unpipeInfo) {
    debug('onunpipe');
    if (readable === src) {
      if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
        unpipeInfo.hasUnpiped = true;
        cleanup();
      }
    }
  }

  function onend() {
    debug('onend');
    dest.end();
  }

  // when the dest drains, it reduces the awaitDrain counter
  // on the source.  This would be more elegant with a .once()
  // handler in flow(), but adding and removing repeatedly is
  // too slow.
  var ondrain = pipeOnDrain(src);
  dest.on('drain', ondrain);

  var cleanedUp = false;
  function cleanup() {
    debug('cleanup');
    // cleanup event handlers once the pipe is broken
    dest.removeListener('close', onclose);
    dest.removeListener('finish', onfinish);
    dest.removeListener('drain', ondrain);
    dest.removeListener('error', onerror);
    dest.removeListener('unpipe', onunpipe);
    src.removeListener('end', onend);
    src.removeListener('end', unpipe);
    src.removeListener('data', ondata);

    cleanedUp = true;

    // if the reader is waiting for a drain event from this
    // specific writer, then it would cause it to never start
    // flowing again.
    // So, if this is awaiting a drain, then we just call it now.
    // If we don't know, then assume that we are waiting for one.
    if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
  }

  // If the user pushes more data while we're writing to dest then we'll end up
  // in ondata again. However, we only want to increase awaitDrain once because
  // dest will only emit one 'drain' event for the multiple writes.
  // => Introduce a guard on increasing awaitDrain.
  var increasedAwaitDrain = false;
  src.on('data', ondata);
  function ondata(chunk) {
    debug('ondata');
    increasedAwaitDrain = false;
    var ret = dest.write(chunk);
    if (false === ret && !increasedAwaitDrain) {
      // If the user unpiped during `dest.write()`, it is possible
      // to get stuck in a permanently paused state if that write
      // also returned false.
      // => Check whether `dest` is still a piping destination.
      if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
        debug('false write response, pause', src._readableState.awaitDrain);
        src._readableState.awaitDrain++;
        increasedAwaitDrain = true;
      }
      src.pause();
    }
  }

  // if the dest has an error, then stop piping into it.
  // however, don't suppress the throwing behavior for this.
  function onerror(er) {
    debug('onerror', er);
    unpipe();
    dest.removeListener('error', onerror);
    if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
  }

  // Make sure our error handler is attached before userland ones.
  prependListener(dest, 'error', onerror);

  // Both close and finish should trigger unpipe, but only once.
  function onclose() {
    dest.removeListener('finish', onfinish);
    unpipe();
  }
  dest.once('close', onclose);
  function onfinish() {
    debug('onfinish');
    dest.removeListener('close', onclose);
    unpipe();
  }
  dest.once('finish', onfinish);

  function unpipe() {
    debug('unpipe');
    src.unpipe(dest);
  }

  // tell the dest that it's being piped to
  dest.emit('pipe', src);

  // start the flow if it hasn't been started already.
  if (!state.flowing) {
    debug('pipe resume');
    src.resume();
  }

  return dest;
};

function pipeOnDrain(src) {
  return function () {
    var state = src._readableState;
    debug('pipeOnDrain', state.awaitDrain);
    if (state.awaitDrain) state.awaitDrain--;
    if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
      state.flowing = true;
      flow(src);
    }
  };
}

Readable.prototype.unpipe = function (dest) {
  var state = this._readableState;
  var unpipeInfo = { hasUnpiped: false };

  // if we're not piping anywhere, then do nothing.
  if (state.pipesCount === 0) return this;

  // just one destination.  most common case.
  if (state.pipesCount === 1) {
    // passed in one, but it's not the right one.
    if (dest && dest !== state.pipes) return this;

    if (!dest) dest = state.pipes;

    // got a match.
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;
    if (dest) dest.emit('unpipe', this, unpipeInfo);
    return this;
  }

  // slow case. multiple pipe destinations.

  if (!dest) {
    // remove all.
    var dests = state.pipes;
    var len = state.pipesCount;
    state.pipes = null;
    state.pipesCount = 0;
    state.flowing = false;

    for (var i = 0; i < len; i++) {
      dests[i].emit('unpipe', this, unpipeInfo);
    }return this;
  }

  // try to find the right one.
  var index = indexOf(state.pipes, dest);
  if (index === -1) return this;

  state.pipes.splice(index, 1);
  state.pipesCount -= 1;
  if (state.pipesCount === 1) state.pipes = state.pipes[0];

  dest.emit('unpipe', this, unpipeInfo);

  return this;
};

// set up data events if they are asked for
// Ensure readable listeners eventually get something
Readable.prototype.on = function (ev, fn) {
  var res = Stream.prototype.on.call(this, ev, fn);

  if (ev === 'data') {
    // Start flowing on next tick if stream isn't explicitly paused
    if (this._readableState.flowing !== false) this.resume();
  } else if (ev === 'readable') {
    var state = this._readableState;
    if (!state.endEmitted && !state.readableListening) {
      state.readableListening = state.needReadable = true;
      state.emittedReadable = false;
      if (!state.reading) {
        pna.nextTick(nReadingNextTick, this);
      } else if (state.length) {
        emitReadable(this);
      }
    }
  }

  return res;
};
Readable.prototype.addListener = Readable.prototype.on;

function nReadingNextTick(self) {
  debug('readable nexttick read 0');
  self.read(0);
}

// pause() and resume() are remnants of the legacy readable stream API
// If the user uses them, then switch into old mode.
Readable.prototype.resume = function () {
  var state = this._readableState;
  if (!state.flowing) {
    debug('resume');
    state.flowing = true;
    resume(this, state);
  }
  return this;
};

function resume(stream, state) {
  if (!state.resumeScheduled) {
    state.resumeScheduled = true;
    pna.nextTick(resume_, stream, state);
  }
}

function resume_(stream, state) {
  if (!state.reading) {
    debug('resume read 0');
    stream.read(0);
  }

  state.resumeScheduled = false;
  state.awaitDrain = 0;
  stream.emit('resume');
  flow(stream);
  if (state.flowing && !state.reading) stream.read(0);
}

Readable.prototype.pause = function () {
  debug('call pause flowing=%j', this._readableState.flowing);
  if (false !== this._readableState.flowing) {
    debug('pause');
    this._readableState.flowing = false;
    this.emit('pause');
  }
  return this;
};

function flow(stream) {
  var state = stream._readableState;
  debug('flow', state.flowing);
  while (state.flowing && stream.read() !== null) {}
}

// wrap an old-style stream as the async data source.
// This is *not* part of the readable stream interface.
// It is an ugly unfortunate mess of history.
Readable.prototype.wrap = function (stream) {
  var _this = this;

  var state = this._readableState;
  var paused = false;

  stream.on('end', function () {
    debug('wrapped end');
    if (state.decoder && !state.ended) {
      var chunk = state.decoder.end();
      if (chunk && chunk.length) _this.push(chunk);
    }

    _this.push(null);
  });

  stream.on('data', function (chunk) {
    debug('wrapped data');
    if (state.decoder) chunk = state.decoder.write(chunk);

    // don't skip over falsy values in objectMode
    if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

    var ret = _this.push(chunk);
    if (!ret) {
      paused = true;
      stream.pause();
    }
  });

  // proxy all the other methods.
  // important when wrapping filters and duplexes.
  for (var i in stream) {
    if (this[i] === undefined && typeof stream[i] === 'function') {
      this[i] = function (method) {
        return function () {
          return stream[method].apply(stream, arguments);
        };
      }(i);
    }
  }

  // proxy certain important events.
  for (var n = 0; n < kProxyEvents.length; n++) {
    stream.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
  }

  // when we try to consume some more bytes, simply unpause the
  // underlying stream.
  this._read = function (n) {
    debug('wrapped _read', n);
    if (paused) {
      paused = false;
      stream.resume();
    }
  };

  return this;
};

Object.defineProperty(Readable.prototype, 'readableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._readableState.highWaterMark;
  }
});

// exposed for testing purposes only.
Readable._fromList = fromList;

// Pluck off n bytes from an array of buffers.
// Length is the combined lengths of all the buffers in the list.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromList(n, state) {
  // nothing buffered
  if (state.length === 0) return null;

  var ret;
  if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
    // read it all, truncate the list
    if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
    state.buffer.clear();
  } else {
    // read part of list
    ret = fromListPartial(n, state.buffer, state.decoder);
  }

  return ret;
}

// Extracts only enough buffered data to satisfy the amount requested.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function fromListPartial(n, list, hasStrings) {
  var ret;
  if (n < list.head.data.length) {
    // slice is the same for buffers and strings
    ret = list.head.data.slice(0, n);
    list.head.data = list.head.data.slice(n);
  } else if (n === list.head.data.length) {
    // first chunk is a perfect match
    ret = list.shift();
  } else {
    // result spans more than one buffer
    ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
  }
  return ret;
}

// Copies a specified amount of characters from the list of buffered data
// chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBufferString(n, list) {
  var p = list.head;
  var c = 1;
  var ret = p.data;
  n -= ret.length;
  while (p = p.next) {
    var str = p.data;
    var nb = n > str.length ? str.length : n;
    if (nb === str.length) ret += str;else ret += str.slice(0, n);
    n -= nb;
    if (n === 0) {
      if (nb === str.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = str.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

// Copies a specified amount of bytes from the list of buffered data chunks.
// This function is designed to be inlinable, so please take care when making
// changes to the function body.
function copyFromBuffer(n, list) {
  var ret = Buffer.allocUnsafe(n);
  var p = list.head;
  var c = 1;
  p.data.copy(ret);
  n -= p.data.length;
  while (p = p.next) {
    var buf = p.data;
    var nb = n > buf.length ? buf.length : n;
    buf.copy(ret, ret.length - n, 0, nb);
    n -= nb;
    if (n === 0) {
      if (nb === buf.length) {
        ++c;
        if (p.next) list.head = p.next;else list.head = list.tail = null;
      } else {
        list.head = p;
        p.data = buf.slice(nb);
      }
      break;
    }
    ++c;
  }
  list.length -= c;
  return ret;
}

function endReadable(stream) {
  var state = stream._readableState;

  // If we get here before consuming all the bytes, then that is a
  // bug in node.  Should never happen.
  if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

  if (!state.endEmitted) {
    state.ended = true;
    pna.nextTick(endReadableNT, state, stream);
  }
}

function endReadableNT(state, stream) {
  // Check that we didn't get one last unshift.
  if (!state.endEmitted && state.length === 0) {
    state.endEmitted = true;
    stream.readable = false;
    stream.emit('end');
  }
}

function indexOf(xs, x) {
  for (var i = 0, l = xs.length; i < l; i++) {
    if (xs[i] === x) return i;
  }
  return -1;
}
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./_stream_duplex":19,"./internal/streams/BufferList":24,"./internal/streams/destroy":25,"./internal/streams/stream":26,"_process":14,"core-util-is":6,"events":7,"inherits":10,"isarray":12,"process-nextick-args":13,"safe-buffer":29,"string_decoder/":27,"util":3}],22:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// a transform stream is a readable/writable stream where you do
// something with the data.  Sometimes it's called a "filter",
// but that's not a great name for it, since that implies a thing where
// some bits pass through, and others are simply ignored.  (That would
// be a valid example of a transform, of course.)
//
// While the output is causally related to the input, it's not a
// necessarily symmetric or synchronous transformation.  For example,
// a zlib stream might take multiple plain-text writes(), and then
// emit a single compressed chunk some time in the future.
//
// Here's how this works:
//
// The Transform stream has all the aspects of the readable and writable
// stream classes.  When you write(chunk), that calls _write(chunk,cb)
// internally, and returns false if there's a lot of pending writes
// buffered up.  When you call read(), that calls _read(n) until
// there's enough pending readable data buffered up.
//
// In a transform stream, the written data is placed in a buffer.  When
// _read(n) is called, it transforms the queued up data, calling the
// buffered _write cb's as it consumes chunks.  If consuming a single
// written chunk would result in multiple output chunks, then the first
// outputted bit calls the readcb, and subsequent chunks just go into
// the read buffer, and will cause it to emit 'readable' if necessary.
//
// This way, back-pressure is actually determined by the reading side,
// since _read has to be called to start processing a new chunk.  However,
// a pathological inflate type of transform can cause excessive buffering
// here.  For example, imagine a stream where every byte of input is
// interpreted as an integer from 0-255, and then results in that many
// bytes of output.  Writing the 4 bytes {ff,ff,ff,ff} would result in
// 1kb of data being output.  In this case, you could write a very small
// amount of input, and end up with a very large amount of output.  In
// such a pathological inflating mechanism, there'd be no way to tell
// the system to stop doing the transform.  A single 4MB write could
// cause the system to run out of memory.
//
// However, even in such a pathological case, only a single written chunk
// would be consumed, and then the rest would wait (un-transformed) until
// the results of the previous transformed chunk were consumed.

'use strict';

module.exports = Transform;

var Duplex = require('./_stream_duplex');

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

util.inherits(Transform, Duplex);

function afterTransform(er, data) {
  var ts = this._transformState;
  ts.transforming = false;

  var cb = ts.writecb;

  if (!cb) {
    return this.emit('error', new Error('write callback called multiple times'));
  }

  ts.writechunk = null;
  ts.writecb = null;

  if (data != null) // single equals check for both `null` and `undefined`
    this.push(data);

  cb(er);

  var rs = this._readableState;
  rs.reading = false;
  if (rs.needReadable || rs.length < rs.highWaterMark) {
    this._read(rs.highWaterMark);
  }
}

function Transform(options) {
  if (!(this instanceof Transform)) return new Transform(options);

  Duplex.call(this, options);

  this._transformState = {
    afterTransform: afterTransform.bind(this),
    needTransform: false,
    transforming: false,
    writecb: null,
    writechunk: null,
    writeencoding: null
  };

  // start out asking for a readable event once data is transformed.
  this._readableState.needReadable = true;

  // we have implemented the _read method, and done the other things
  // that Readable wants before the first _read call, so unset the
  // sync guard flag.
  this._readableState.sync = false;

  if (options) {
    if (typeof options.transform === 'function') this._transform = options.transform;

    if (typeof options.flush === 'function') this._flush = options.flush;
  }

  // When the writable side finishes, then flush out anything remaining.
  this.on('prefinish', prefinish);
}

function prefinish() {
  var _this = this;

  if (typeof this._flush === 'function') {
    this._flush(function (er, data) {
      done(_this, er, data);
    });
  } else {
    done(this, null, null);
  }
}

Transform.prototype.push = function (chunk, encoding) {
  this._transformState.needTransform = false;
  return Duplex.prototype.push.call(this, chunk, encoding);
};

// This is the part where you do stuff!
// override this function in implementation classes.
// 'chunk' is an input chunk.
//
// Call `push(newChunk)` to pass along transformed output
// to the readable side.  You may call 'push' zero or more times.
//
// Call `cb(err)` when you are done with this chunk.  If you pass
// an error, then that'll put the hurt on the whole operation.  If you
// never call cb(), then you'll never get another chunk.
Transform.prototype._transform = function (chunk, encoding, cb) {
  throw new Error('_transform() is not implemented');
};

Transform.prototype._write = function (chunk, encoding, cb) {
  var ts = this._transformState;
  ts.writecb = cb;
  ts.writechunk = chunk;
  ts.writeencoding = encoding;
  if (!ts.transforming) {
    var rs = this._readableState;
    if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
  }
};

// Doesn't matter what the args are here.
// _transform does all the work.
// That we got here means that the readable side wants more data.
Transform.prototype._read = function (n) {
  var ts = this._transformState;

  if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
    ts.transforming = true;
    this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
  } else {
    // mark that we need a transform, so that any data that comes in
    // will get processed, now that we've asked for it.
    ts.needTransform = true;
  }
};

Transform.prototype._destroy = function (err, cb) {
  var _this2 = this;

  Duplex.prototype._destroy.call(this, err, function (err2) {
    cb(err2);
    _this2.emit('close');
  });
};

function done(stream, er, data) {
  if (er) return stream.emit('error', er);

  if (data != null) // single equals check for both `null` and `undefined`
    stream.push(data);

  // if there's nothing in the write buffer, then that means
  // that nothing more will ever be provided
  if (stream._writableState.length) throw new Error('Calling transform done when ws.length != 0');

  if (stream._transformState.transforming) throw new Error('Calling transform done when still transforming');

  return stream.push(null);
}
},{"./_stream_duplex":19,"core-util-is":6,"inherits":10}],23:[function(require,module,exports){
(function (process,global,setImmediate){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// A bit simpler than readable streams.
// Implement an async ._write(chunk, encoding, cb), and it'll handle all
// the drain event emission and buffering.

'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

module.exports = Writable;

/* <replacement> */
function WriteReq(chunk, encoding, cb) {
  this.chunk = chunk;
  this.encoding = encoding;
  this.callback = cb;
  this.next = null;
}

// It seems a linked list but it is not
// there will be only 2 of these for each stream
function CorkedRequest(state) {
  var _this = this;

  this.next = null;
  this.entry = null;
  this.finish = function () {
    onCorkedFinish(_this, state);
  };
}
/* </replacement> */

/*<replacement>*/
var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : pna.nextTick;
/*</replacement>*/

/*<replacement>*/
var Duplex;
/*</replacement>*/

Writable.WritableState = WritableState;

/*<replacement>*/
var util = require('core-util-is');
util.inherits = require('inherits');
/*</replacement>*/

/*<replacement>*/
var internalUtil = {
  deprecate: require('util-deprecate')
};
/*</replacement>*/

/*<replacement>*/
var Stream = require('./internal/streams/stream');
/*</replacement>*/

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
var OurUint8Array = global.Uint8Array || function () {};
function _uint8ArrayToBuffer(chunk) {
  return Buffer.from(chunk);
}
function _isUint8Array(obj) {
  return Buffer.isBuffer(obj) || obj instanceof OurUint8Array;
}

/*</replacement>*/

var destroyImpl = require('./internal/streams/destroy');

util.inherits(Writable, Stream);

function nop() {}

function WritableState(options, stream) {
  Duplex = Duplex || require('./_stream_duplex');

  options = options || {};

  // Duplex streams are both readable and writable, but share
  // the same options object.
  // However, some cases require setting options to different
  // values for the readable and the writable sides of the duplex stream.
  // These options can be provided separately as readableXXX and writableXXX.
  var isDuplex = stream instanceof Duplex;

  // object stream flag to indicate whether or not this stream
  // contains buffers or objects.
  this.objectMode = !!options.objectMode;

  if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

  // the point at which write() starts returning false
  // Note: 0 is a valid value, means that we always return false if
  // the entire buffer is not flushed immediately on write()
  var hwm = options.highWaterMark;
  var writableHwm = options.writableHighWaterMark;
  var defaultHwm = this.objectMode ? 16 : 16 * 1024;

  if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;else this.highWaterMark = defaultHwm;

  // cast to ints.
  this.highWaterMark = Math.floor(this.highWaterMark);

  // if _final has been called
  this.finalCalled = false;

  // drain event flag.
  this.needDrain = false;
  // at the start of calling end()
  this.ending = false;
  // when end() has been called, and returned
  this.ended = false;
  // when 'finish' is emitted
  this.finished = false;

  // has it been destroyed
  this.destroyed = false;

  // should we decode strings into buffers before passing to _write?
  // this is here so that some node-core streams can optimize string
  // handling at a lower level.
  var noDecode = options.decodeStrings === false;
  this.decodeStrings = !noDecode;

  // Crypto is kind of old and crusty.  Historically, its default string
  // encoding is 'binary' so we have to make this configurable.
  // Everything else in the universe uses 'utf8', though.
  this.defaultEncoding = options.defaultEncoding || 'utf8';

  // not an actual buffer we keep track of, but a measurement
  // of how much we're waiting to get pushed to some underlying
  // socket or file.
  this.length = 0;

  // a flag to see when we're in the middle of a write.
  this.writing = false;

  // when true all writes will be buffered until .uncork() call
  this.corked = 0;

  // a flag to be able to tell if the onwrite cb is called immediately,
  // or on a later tick.  We set this to true at first, because any
  // actions that shouldn't happen until "later" should generally also
  // not happen before the first write call.
  this.sync = true;

  // a flag to know if we're processing previously buffered items, which
  // may call the _write() callback in the same tick, so that we don't
  // end up in an overlapped onwrite situation.
  this.bufferProcessing = false;

  // the callback that's passed to _write(chunk,cb)
  this.onwrite = function (er) {
    onwrite(stream, er);
  };

  // the callback that the user supplies to write(chunk,encoding,cb)
  this.writecb = null;

  // the amount that is being written when _write is called.
  this.writelen = 0;

  this.bufferedRequest = null;
  this.lastBufferedRequest = null;

  // number of pending user-supplied write callbacks
  // this must be 0 before 'finish' can be emitted
  this.pendingcb = 0;

  // emit prefinish if the only thing we're waiting for is _write cbs
  // This is relevant for synchronous Transform streams
  this.prefinished = false;

  // True if the error was already emitted and should not be thrown again
  this.errorEmitted = false;

  // count buffered requests
  this.bufferedRequestCount = 0;

  // allocate the first CorkedRequest, there is always
  // one allocated and free to use, and we maintain at most two
  this.corkedRequestsFree = new CorkedRequest(this);
}

WritableState.prototype.getBuffer = function getBuffer() {
  var current = this.bufferedRequest;
  var out = [];
  while (current) {
    out.push(current);
    current = current.next;
  }
  return out;
};

(function () {
  try {
    Object.defineProperty(WritableState.prototype, 'buffer', {
      get: internalUtil.deprecate(function () {
        return this.getBuffer();
      }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
    });
  } catch (_) {}
})();

// Test _writableState for inheritance to account for Duplex streams,
// whose prototype chain only points to Readable.
var realHasInstance;
if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
  realHasInstance = Function.prototype[Symbol.hasInstance];
  Object.defineProperty(Writable, Symbol.hasInstance, {
    value: function (object) {
      if (realHasInstance.call(this, object)) return true;
      if (this !== Writable) return false;

      return object && object._writableState instanceof WritableState;
    }
  });
} else {
  realHasInstance = function (object) {
    return object instanceof this;
  };
}

function Writable(options) {
  Duplex = Duplex || require('./_stream_duplex');

  // Writable ctor is applied to Duplexes, too.
  // `realHasInstance` is necessary because using plain `instanceof`
  // would return false, as no `_writableState` property is attached.

  // Trying to use the custom `instanceof` for Writable here will also break the
  // Node.js LazyTransform implementation, which has a non-trivial getter for
  // `_writableState` that would lead to infinite recursion.
  if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
    return new Writable(options);
  }

  this._writableState = new WritableState(options, this);

  // legacy.
  this.writable = true;

  if (options) {
    if (typeof options.write === 'function') this._write = options.write;

    if (typeof options.writev === 'function') this._writev = options.writev;

    if (typeof options.destroy === 'function') this._destroy = options.destroy;

    if (typeof options.final === 'function') this._final = options.final;
  }

  Stream.call(this);
}

// Otherwise people can pipe Writable streams, which is just wrong.
Writable.prototype.pipe = function () {
  this.emit('error', new Error('Cannot pipe, not readable'));
};

function writeAfterEnd(stream, cb) {
  var er = new Error('write after end');
  // TODO: defer error events consistently everywhere, not just the cb
  stream.emit('error', er);
  pna.nextTick(cb, er);
}

// Checks that a user-supplied chunk is valid, especially for the particular
// mode the stream is in. Currently this means that `null` is never accepted
// and undefined/non-string values are only allowed in object mode.
function validChunk(stream, state, chunk, cb) {
  var valid = true;
  var er = false;

  if (chunk === null) {
    er = new TypeError('May not write null values to stream');
  } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
    er = new TypeError('Invalid non-string/buffer chunk');
  }
  if (er) {
    stream.emit('error', er);
    pna.nextTick(cb, er);
    valid = false;
  }
  return valid;
}

Writable.prototype.write = function (chunk, encoding, cb) {
  var state = this._writableState;
  var ret = false;
  var isBuf = !state.objectMode && _isUint8Array(chunk);

  if (isBuf && !Buffer.isBuffer(chunk)) {
    chunk = _uint8ArrayToBuffer(chunk);
  }

  if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

  if (typeof cb !== 'function') cb = nop;

  if (state.ended) writeAfterEnd(this, cb);else if (isBuf || validChunk(this, state, chunk, cb)) {
    state.pendingcb++;
    ret = writeOrBuffer(this, state, isBuf, chunk, encoding, cb);
  }

  return ret;
};

Writable.prototype.cork = function () {
  var state = this._writableState;

  state.corked++;
};

Writable.prototype.uncork = function () {
  var state = this._writableState;

  if (state.corked) {
    state.corked--;

    if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
  }
};

Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
  // node::ParseEncoding() requires lower case.
  if (typeof encoding === 'string') encoding = encoding.toLowerCase();
  if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
  this._writableState.defaultEncoding = encoding;
  return this;
};

function decodeChunk(state, chunk, encoding) {
  if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
    chunk = Buffer.from(chunk, encoding);
  }
  return chunk;
}

Object.defineProperty(Writable.prototype, 'writableHighWaterMark', {
  // making it explicit this property is not enumerable
  // because otherwise some prototype manipulation in
  // userland will fail
  enumerable: false,
  get: function () {
    return this._writableState.highWaterMark;
  }
});

// if we're already writing something, then just put this
// in the queue, and wait our turn.  Otherwise, call _write
// If we return false, then we need a drain event, so set that flag.
function writeOrBuffer(stream, state, isBuf, chunk, encoding, cb) {
  if (!isBuf) {
    var newChunk = decodeChunk(state, chunk, encoding);
    if (chunk !== newChunk) {
      isBuf = true;
      encoding = 'buffer';
      chunk = newChunk;
    }
  }
  var len = state.objectMode ? 1 : chunk.length;

  state.length += len;

  var ret = state.length < state.highWaterMark;
  // we must ensure that previous needDrain will not be reset to false.
  if (!ret) state.needDrain = true;

  if (state.writing || state.corked) {
    var last = state.lastBufferedRequest;
    state.lastBufferedRequest = {
      chunk: chunk,
      encoding: encoding,
      isBuf: isBuf,
      callback: cb,
      next: null
    };
    if (last) {
      last.next = state.lastBufferedRequest;
    } else {
      state.bufferedRequest = state.lastBufferedRequest;
    }
    state.bufferedRequestCount += 1;
  } else {
    doWrite(stream, state, false, len, chunk, encoding, cb);
  }

  return ret;
}

function doWrite(stream, state, writev, len, chunk, encoding, cb) {
  state.writelen = len;
  state.writecb = cb;
  state.writing = true;
  state.sync = true;
  if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
  state.sync = false;
}

function onwriteError(stream, state, sync, er, cb) {
  --state.pendingcb;

  if (sync) {
    // defer the callback if we are being called synchronously
    // to avoid piling up things on the stack
    pna.nextTick(cb, er);
    // this can emit finish, and it will always happen
    // after error
    pna.nextTick(finishMaybe, stream, state);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
  } else {
    // the caller expect this to happen before if
    // it is async
    cb(er);
    stream._writableState.errorEmitted = true;
    stream.emit('error', er);
    // this can emit finish, but finish must
    // always follow error
    finishMaybe(stream, state);
  }
}

function onwriteStateUpdate(state) {
  state.writing = false;
  state.writecb = null;
  state.length -= state.writelen;
  state.writelen = 0;
}

function onwrite(stream, er) {
  var state = stream._writableState;
  var sync = state.sync;
  var cb = state.writecb;

  onwriteStateUpdate(state);

  if (er) onwriteError(stream, state, sync, er, cb);else {
    // Check if we're actually ready to finish, but don't emit yet
    var finished = needFinish(state);

    if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
      clearBuffer(stream, state);
    }

    if (sync) {
      /*<replacement>*/
      asyncWrite(afterWrite, stream, state, finished, cb);
      /*</replacement>*/
    } else {
      afterWrite(stream, state, finished, cb);
    }
  }
}

function afterWrite(stream, state, finished, cb) {
  if (!finished) onwriteDrain(stream, state);
  state.pendingcb--;
  cb();
  finishMaybe(stream, state);
}

// Must force callback to be called on nextTick, so that we don't
// emit 'drain' before the write() consumer gets the 'false' return
// value, and has a chance to attach a 'drain' listener.
function onwriteDrain(stream, state) {
  if (state.length === 0 && state.needDrain) {
    state.needDrain = false;
    stream.emit('drain');
  }
}

// if there's something in the buffer waiting, then process it
function clearBuffer(stream, state) {
  state.bufferProcessing = true;
  var entry = state.bufferedRequest;

  if (stream._writev && entry && entry.next) {
    // Fast case, write everything using _writev()
    var l = state.bufferedRequestCount;
    var buffer = new Array(l);
    var holder = state.corkedRequestsFree;
    holder.entry = entry;

    var count = 0;
    var allBuffers = true;
    while (entry) {
      buffer[count] = entry;
      if (!entry.isBuf) allBuffers = false;
      entry = entry.next;
      count += 1;
    }
    buffer.allBuffers = allBuffers;

    doWrite(stream, state, true, state.length, buffer, '', holder.finish);

    // doWrite is almost always async, defer these to save a bit of time
    // as the hot path ends with doWrite
    state.pendingcb++;
    state.lastBufferedRequest = null;
    if (holder.next) {
      state.corkedRequestsFree = holder.next;
      holder.next = null;
    } else {
      state.corkedRequestsFree = new CorkedRequest(state);
    }
    state.bufferedRequestCount = 0;
  } else {
    // Slow case, write chunks one-by-one
    while (entry) {
      var chunk = entry.chunk;
      var encoding = entry.encoding;
      var cb = entry.callback;
      var len = state.objectMode ? 1 : chunk.length;

      doWrite(stream, state, false, len, chunk, encoding, cb);
      entry = entry.next;
      state.bufferedRequestCount--;
      // if we didn't call the onwrite immediately, then
      // it means that we need to wait until it does.
      // also, that means that the chunk and cb are currently
      // being processed, so move the buffer counter past them.
      if (state.writing) {
        break;
      }
    }

    if (entry === null) state.lastBufferedRequest = null;
  }

  state.bufferedRequest = entry;
  state.bufferProcessing = false;
}

Writable.prototype._write = function (chunk, encoding, cb) {
  cb(new Error('_write() is not implemented'));
};

Writable.prototype._writev = null;

Writable.prototype.end = function (chunk, encoding, cb) {
  var state = this._writableState;

  if (typeof chunk === 'function') {
    cb = chunk;
    chunk = null;
    encoding = null;
  } else if (typeof encoding === 'function') {
    cb = encoding;
    encoding = null;
  }

  if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

  // .end() fully uncorks
  if (state.corked) {
    state.corked = 1;
    this.uncork();
  }

  // ignore unnecessary end() calls.
  if (!state.ending && !state.finished) endWritable(this, state, cb);
};

function needFinish(state) {
  return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
}
function callFinal(stream, state) {
  stream._final(function (err) {
    state.pendingcb--;
    if (err) {
      stream.emit('error', err);
    }
    state.prefinished = true;
    stream.emit('prefinish');
    finishMaybe(stream, state);
  });
}
function prefinish(stream, state) {
  if (!state.prefinished && !state.finalCalled) {
    if (typeof stream._final === 'function') {
      state.pendingcb++;
      state.finalCalled = true;
      pna.nextTick(callFinal, stream, state);
    } else {
      state.prefinished = true;
      stream.emit('prefinish');
    }
  }
}

function finishMaybe(stream, state) {
  var need = needFinish(state);
  if (need) {
    prefinish(stream, state);
    if (state.pendingcb === 0) {
      state.finished = true;
      stream.emit('finish');
    }
  }
  return need;
}

function endWritable(stream, state, cb) {
  state.ending = true;
  finishMaybe(stream, state);
  if (cb) {
    if (state.finished) pna.nextTick(cb);else stream.once('finish', cb);
  }
  state.ended = true;
  stream.writable = false;
}

function onCorkedFinish(corkReq, state, err) {
  var entry = corkReq.entry;
  corkReq.entry = null;
  while (entry) {
    var cb = entry.callback;
    state.pendingcb--;
    cb(err);
    entry = entry.next;
  }
  if (state.corkedRequestsFree) {
    state.corkedRequestsFree.next = corkReq;
  } else {
    state.corkedRequestsFree = corkReq;
  }
}

Object.defineProperty(Writable.prototype, 'destroyed', {
  get: function () {
    if (this._writableState === undefined) {
      return false;
    }
    return this._writableState.destroyed;
  },
  set: function (value) {
    // we ignore the value if the stream
    // has not been initialized yet
    if (!this._writableState) {
      return;
    }

    // backward compatibility, the user is explicitly
    // managing destroyed
    this._writableState.destroyed = value;
  }
});

Writable.prototype.destroy = destroyImpl.destroy;
Writable.prototype._undestroy = destroyImpl.undestroy;
Writable.prototype._destroy = function (err, cb) {
  this.end();
  cb(err);
};
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("timers").setImmediate)
},{"./_stream_duplex":19,"./internal/streams/destroy":25,"./internal/streams/stream":26,"_process":14,"core-util-is":6,"inherits":10,"process-nextick-args":13,"safe-buffer":29,"timers":34,"util-deprecate":38}],24:[function(require,module,exports){
'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Buffer = require('safe-buffer').Buffer;
var util = require('util');

function copyBuffer(src, target, offset) {
  src.copy(target, offset);
}

module.exports = function () {
  function BufferList() {
    _classCallCheck(this, BufferList);

    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  BufferList.prototype.push = function push(v) {
    var entry = { data: v, next: null };
    if (this.length > 0) this.tail.next = entry;else this.head = entry;
    this.tail = entry;
    ++this.length;
  };

  BufferList.prototype.unshift = function unshift(v) {
    var entry = { data: v, next: this.head };
    if (this.length === 0) this.tail = entry;
    this.head = entry;
    ++this.length;
  };

  BufferList.prototype.shift = function shift() {
    if (this.length === 0) return;
    var ret = this.head.data;
    if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
    --this.length;
    return ret;
  };

  BufferList.prototype.clear = function clear() {
    this.head = this.tail = null;
    this.length = 0;
  };

  BufferList.prototype.join = function join(s) {
    if (this.length === 0) return '';
    var p = this.head;
    var ret = '' + p.data;
    while (p = p.next) {
      ret += s + p.data;
    }return ret;
  };

  BufferList.prototype.concat = function concat(n) {
    if (this.length === 0) return Buffer.alloc(0);
    if (this.length === 1) return this.head.data;
    var ret = Buffer.allocUnsafe(n >>> 0);
    var p = this.head;
    var i = 0;
    while (p) {
      copyBuffer(p.data, ret, i);
      i += p.data.length;
      p = p.next;
    }
    return ret;
  };

  return BufferList;
}();

if (util && util.inspect && util.inspect.custom) {
  module.exports.prototype[util.inspect.custom] = function () {
    var obj = util.inspect({ length: this.length });
    return this.constructor.name + ' ' + obj;
  };
}
},{"safe-buffer":29,"util":3}],25:[function(require,module,exports){
'use strict';

/*<replacement>*/

var pna = require('process-nextick-args');
/*</replacement>*/

// undocumented cb() API, needed for core, not for public API
function destroy(err, cb) {
  var _this = this;

  var readableDestroyed = this._readableState && this._readableState.destroyed;
  var writableDestroyed = this._writableState && this._writableState.destroyed;

  if (readableDestroyed || writableDestroyed) {
    if (cb) {
      cb(err);
    } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
      pna.nextTick(emitErrorNT, this, err);
    }
    return this;
  }

  // we set destroyed to true before firing error callbacks in order
  // to make it re-entrance safe in case destroy() is called within callbacks

  if (this._readableState) {
    this._readableState.destroyed = true;
  }

  // if this is a duplex stream mark the writable part as destroyed as well
  if (this._writableState) {
    this._writableState.destroyed = true;
  }

  this._destroy(err || null, function (err) {
    if (!cb && err) {
      pna.nextTick(emitErrorNT, _this, err);
      if (_this._writableState) {
        _this._writableState.errorEmitted = true;
      }
    } else if (cb) {
      cb(err);
    }
  });

  return this;
}

function undestroy() {
  if (this._readableState) {
    this._readableState.destroyed = false;
    this._readableState.reading = false;
    this._readableState.ended = false;
    this._readableState.endEmitted = false;
  }

  if (this._writableState) {
    this._writableState.destroyed = false;
    this._writableState.ended = false;
    this._writableState.ending = false;
    this._writableState.finished = false;
    this._writableState.errorEmitted = false;
  }
}

function emitErrorNT(self, err) {
  self.emit('error', err);
}

module.exports = {
  destroy: destroy,
  undestroy: undestroy
};
},{"process-nextick-args":13}],26:[function(require,module,exports){
module.exports = require('events').EventEmitter;

},{"events":7}],27:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

/*<replacement>*/

var Buffer = require('safe-buffer').Buffer;
/*</replacement>*/

var isEncoding = Buffer.isEncoding || function (encoding) {
  encoding = '' + encoding;
  switch (encoding && encoding.toLowerCase()) {
    case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
      return true;
    default:
      return false;
  }
};

function _normalizeEncoding(enc) {
  if (!enc) return 'utf8';
  var retried;
  while (true) {
    switch (enc) {
      case 'utf8':
      case 'utf-8':
        return 'utf8';
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return 'utf16le';
      case 'latin1':
      case 'binary':
        return 'latin1';
      case 'base64':
      case 'ascii':
      case 'hex':
        return enc;
      default:
        if (retried) return; // undefined
        enc = ('' + enc).toLowerCase();
        retried = true;
    }
  }
};

// Do not cache `Buffer.isEncoding` when checking encoding names as some
// modules monkey-patch it to support additional encodings
function normalizeEncoding(enc) {
  var nenc = _normalizeEncoding(enc);
  if (typeof nenc !== 'string' && (Buffer.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
  return nenc || enc;
}

// StringDecoder provides an interface for efficiently splitting a series of
// buffers into a series of JS strings without breaking apart multi-byte
// characters.
exports.StringDecoder = StringDecoder;
function StringDecoder(encoding) {
  this.encoding = normalizeEncoding(encoding);
  var nb;
  switch (this.encoding) {
    case 'utf16le':
      this.text = utf16Text;
      this.end = utf16End;
      nb = 4;
      break;
    case 'utf8':
      this.fillLast = utf8FillLast;
      nb = 4;
      break;
    case 'base64':
      this.text = base64Text;
      this.end = base64End;
      nb = 3;
      break;
    default:
      this.write = simpleWrite;
      this.end = simpleEnd;
      return;
  }
  this.lastNeed = 0;
  this.lastTotal = 0;
  this.lastChar = Buffer.allocUnsafe(nb);
}

StringDecoder.prototype.write = function (buf) {
  if (buf.length === 0) return '';
  var r;
  var i;
  if (this.lastNeed) {
    r = this.fillLast(buf);
    if (r === undefined) return '';
    i = this.lastNeed;
    this.lastNeed = 0;
  } else {
    i = 0;
  }
  if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
  return r || '';
};

StringDecoder.prototype.end = utf8End;

// Returns only complete characters in a Buffer
StringDecoder.prototype.text = utf8Text;

// Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
StringDecoder.prototype.fillLast = function (buf) {
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
  this.lastNeed -= buf.length;
};

// Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
// continuation byte. If an invalid byte is detected, -2 is returned.
function utf8CheckByte(byte) {
  if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
  return byte >> 6 === 0x02 ? -1 : -2;
}

// Checks at most 3 bytes at the end of a Buffer in order to detect an
// incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
// needed to complete the UTF-8 character (if applicable) are returned.
function utf8CheckIncomplete(self, buf, i) {
  var j = buf.length - 1;
  if (j < i) return 0;
  var nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 1;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) self.lastNeed = nb - 2;
    return nb;
  }
  if (--j < i || nb === -2) return 0;
  nb = utf8CheckByte(buf[j]);
  if (nb >= 0) {
    if (nb > 0) {
      if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
    }
    return nb;
  }
  return 0;
}

// Validates as many continuation bytes for a multi-byte UTF-8 character as
// needed or are available. If we see a non-continuation byte where we expect
// one, we "replace" the validated continuation bytes we've seen so far with
// a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
// behavior. The continuation byte check is included three times in the case
// where all of the continuation bytes for a character exist in the same buffer.
// It is also done this way as a slight performance increase instead of using a
// loop.
function utf8CheckExtraBytes(self, buf, p) {
  if ((buf[0] & 0xC0) !== 0x80) {
    self.lastNeed = 0;
    return '\ufffd';
  }
  if (self.lastNeed > 1 && buf.length > 1) {
    if ((buf[1] & 0xC0) !== 0x80) {
      self.lastNeed = 1;
      return '\ufffd';
    }
    if (self.lastNeed > 2 && buf.length > 2) {
      if ((buf[2] & 0xC0) !== 0x80) {
        self.lastNeed = 2;
        return '\ufffd';
      }
    }
  }
}

// Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
function utf8FillLast(buf) {
  var p = this.lastTotal - this.lastNeed;
  var r = utf8CheckExtraBytes(this, buf, p);
  if (r !== undefined) return r;
  if (this.lastNeed <= buf.length) {
    buf.copy(this.lastChar, p, 0, this.lastNeed);
    return this.lastChar.toString(this.encoding, 0, this.lastTotal);
  }
  buf.copy(this.lastChar, p, 0, buf.length);
  this.lastNeed -= buf.length;
}

// Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
// partial character, the character's bytes are buffered until the required
// number of bytes are available.
function utf8Text(buf, i) {
  var total = utf8CheckIncomplete(this, buf, i);
  if (!this.lastNeed) return buf.toString('utf8', i);
  this.lastTotal = total;
  var end = buf.length - (total - this.lastNeed);
  buf.copy(this.lastChar, 0, end);
  return buf.toString('utf8', i, end);
}

// For UTF-8, a replacement character is added when ending on a partial
// character.
function utf8End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + '\ufffd';
  return r;
}

// UTF-16LE typically needs two bytes per character, but even if we have an even
// number of bytes available, we need to check if we end on a leading/high
// surrogate. In that case, we need to wait for the next two bytes in order to
// decode the last character properly.
function utf16Text(buf, i) {
  if ((buf.length - i) % 2 === 0) {
    var r = buf.toString('utf16le', i);
    if (r) {
      var c = r.charCodeAt(r.length - 1);
      if (c >= 0xD800 && c <= 0xDBFF) {
        this.lastNeed = 2;
        this.lastTotal = 4;
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
        return r.slice(0, -1);
      }
    }
    return r;
  }
  this.lastNeed = 1;
  this.lastTotal = 2;
  this.lastChar[0] = buf[buf.length - 1];
  return buf.toString('utf16le', i, buf.length - 1);
}

// For UTF-16LE we do not explicitly append special replacement characters if we
// end on a partial character, we simply let v8 handle that.
function utf16End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) {
    var end = this.lastTotal - this.lastNeed;
    return r + this.lastChar.toString('utf16le', 0, end);
  }
  return r;
}

function base64Text(buf, i) {
  var n = (buf.length - i) % 3;
  if (n === 0) return buf.toString('base64', i);
  this.lastNeed = 3 - n;
  this.lastTotal = 3;
  if (n === 1) {
    this.lastChar[0] = buf[buf.length - 1];
  } else {
    this.lastChar[0] = buf[buf.length - 2];
    this.lastChar[1] = buf[buf.length - 1];
  }
  return buf.toString('base64', i, buf.length - n);
}

function base64End(buf) {
  var r = buf && buf.length ? this.write(buf) : '';
  if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
  return r;
}

// Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
function simpleWrite(buf) {
  return buf.toString(this.encoding);
}

function simpleEnd(buf) {
  return buf && buf.length ? this.write(buf) : '';
}
},{"safe-buffer":29}],28:[function(require,module,exports){
exports = module.exports = require('./lib/_stream_readable.js');
exports.Stream = exports;
exports.Readable = exports;
exports.Writable = require('./lib/_stream_writable.js');
exports.Duplex = require('./lib/_stream_duplex.js');
exports.Transform = require('./lib/_stream_transform.js');
exports.PassThrough = require('./lib/_stream_passthrough.js');

},{"./lib/_stream_duplex.js":19,"./lib/_stream_passthrough.js":20,"./lib/_stream_readable.js":21,"./lib/_stream_transform.js":22,"./lib/_stream_writable.js":23}],29:[function(require,module,exports){
/* eslint-disable node/no-deprecated-api */
var buffer = require('buffer')
var Buffer = buffer.Buffer

// alternative to using Object.keys for old browsers
function copyProps (src, dst) {
  for (var key in src) {
    dst[key] = src[key]
  }
}
if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
  module.exports = buffer
} else {
  // Copy properties from require('buffer')
  copyProps(buffer, exports)
  exports.Buffer = SafeBuffer
}

function SafeBuffer (arg, encodingOrOffset, length) {
  return Buffer(arg, encodingOrOffset, length)
}

// Copy static methods from Buffer
copyProps(Buffer, SafeBuffer)

SafeBuffer.from = function (arg, encodingOrOffset, length) {
  if (typeof arg === 'number') {
    throw new TypeError('Argument must not be a number')
  }
  return Buffer(arg, encodingOrOffset, length)
}

SafeBuffer.alloc = function (size, fill, encoding) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  var buf = Buffer(size)
  if (fill !== undefined) {
    if (typeof encoding === 'string') {
      buf.fill(fill, encoding)
    } else {
      buf.fill(fill)
    }
  } else {
    buf.fill(0)
  }
  return buf
}

SafeBuffer.allocUnsafe = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return Buffer(size)
}

SafeBuffer.allocUnsafeSlow = function (size) {
  if (typeof size !== 'number') {
    throw new TypeError('Argument must be a number')
  }
  return buffer.SlowBuffer(size)
}

},{"buffer":4}],30:[function(require,module,exports){
(function (global){
var ClientRequest = require('./lib/request')
var response = require('./lib/response')
var extend = require('xtend')
var statusCodes = require('builtin-status-codes')
var url = require('url')

var http = exports

http.request = function (opts, cb) {
	if (typeof opts === 'string')
		opts = url.parse(opts)
	else
		opts = extend(opts)

	// Normally, the page is loaded from http or https, so not specifying a protocol
	// will result in a (valid) protocol-relative url. However, this won't work if
	// the protocol is something else, like 'file:'
	var defaultProtocol = global.location.protocol.search(/^https?:$/) === -1 ? 'http:' : ''

	var protocol = opts.protocol || defaultProtocol
	var host = opts.hostname || opts.host
	var port = opts.port
	var path = opts.path || '/'

	// Necessary for IPv6 addresses
	if (host && host.indexOf(':') !== -1)
		host = '[' + host + ']'

	// This may be a relative url. The browser should always be able to interpret it correctly.
	opts.url = (host ? (protocol + '//' + host) : '') + (port ? ':' + port : '') + path
	opts.method = (opts.method || 'GET').toUpperCase()
	opts.headers = opts.headers || {}

	// Also valid opts.auth, opts.mode

	var req = new ClientRequest(opts)
	if (cb)
		req.on('response', cb)
	return req
}

http.get = function get (opts, cb) {
	var req = http.request(opts, cb)
	req.end()
	return req
}

http.ClientRequest = ClientRequest
http.IncomingMessage = response.IncomingMessage

http.Agent = function () {}
http.Agent.defaultMaxSockets = 4

http.globalAgent = new http.Agent()

http.STATUS_CODES = statusCodes

http.METHODS = [
	'CHECKOUT',
	'CONNECT',
	'COPY',
	'DELETE',
	'GET',
	'HEAD',
	'LOCK',
	'M-SEARCH',
	'MERGE',
	'MKACTIVITY',
	'MKCOL',
	'MOVE',
	'NOTIFY',
	'OPTIONS',
	'PATCH',
	'POST',
	'PROPFIND',
	'PROPPATCH',
	'PURGE',
	'PUT',
	'REPORT',
	'SEARCH',
	'SUBSCRIBE',
	'TRACE',
	'UNLOCK',
	'UNSUBSCRIBE'
]
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./lib/request":32,"./lib/response":33,"builtin-status-codes":5,"url":36,"xtend":39}],31:[function(require,module,exports){
(function (global){
exports.fetch = isFunction(global.fetch) && isFunction(global.ReadableStream)

exports.writableStream = isFunction(global.WritableStream)

exports.abortController = isFunction(global.AbortController)

exports.blobConstructor = false
try {
	new Blob([new ArrayBuffer(1)])
	exports.blobConstructor = true
} catch (e) {}

// The xhr request to example.com may violate some restrictive CSP configurations,
// so if we're running in a browser that supports `fetch`, avoid calling getXHR()
// and assume support for certain features below.
var xhr
function getXHR () {
	// Cache the xhr value
	if (xhr !== undefined) return xhr

	if (global.XMLHttpRequest) {
		xhr = new global.XMLHttpRequest()
		// If XDomainRequest is available (ie only, where xhr might not work
		// cross domain), use the page location. Otherwise use example.com
		// Note: this doesn't actually make an http request.
		try {
			xhr.open('GET', global.XDomainRequest ? '/' : 'https://example.com')
		} catch(e) {
			xhr = null
		}
	} else {
		// Service workers don't have XHR
		xhr = null
	}
	return xhr
}

function checkTypeSupport (type) {
	var xhr = getXHR()
	if (!xhr) return false
	try {
		xhr.responseType = type
		return xhr.responseType === type
	} catch (e) {}
	return false
}

// For some strange reason, Safari 7.0 reports typeof global.ArrayBuffer === 'object'.
// Safari 7.1 appears to have fixed this bug.
var haveArrayBuffer = typeof global.ArrayBuffer !== 'undefined'
var haveSlice = haveArrayBuffer && isFunction(global.ArrayBuffer.prototype.slice)

// If fetch is supported, then arraybuffer will be supported too. Skip calling
// checkTypeSupport(), since that calls getXHR().
exports.arraybuffer = exports.fetch || (haveArrayBuffer && checkTypeSupport('arraybuffer'))

// These next two tests unavoidably show warnings in Chrome. Since fetch will always
// be used if it's available, just return false for these to avoid the warnings.
exports.msstream = !exports.fetch && haveSlice && checkTypeSupport('ms-stream')
exports.mozchunkedarraybuffer = !exports.fetch && haveArrayBuffer &&
	checkTypeSupport('moz-chunked-arraybuffer')

// If fetch is supported, then overrideMimeType will be supported too. Skip calling
// getXHR().
exports.overrideMimeType = exports.fetch || (getXHR() ? isFunction(getXHR().overrideMimeType) : false)

exports.vbArray = isFunction(global.VBArray)

function isFunction (value) {
	return typeof value === 'function'
}

xhr = null // Help gc

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],32:[function(require,module,exports){
(function (process,global,Buffer){
var capability = require('./capability')
var inherits = require('inherits')
var response = require('./response')
var stream = require('readable-stream')
var toArrayBuffer = require('to-arraybuffer')

var IncomingMessage = response.IncomingMessage
var rStates = response.readyStates

function decideMode (preferBinary, useFetch) {
	if (capability.fetch && useFetch) {
		return 'fetch'
	} else if (capability.mozchunkedarraybuffer) {
		return 'moz-chunked-arraybuffer'
	} else if (capability.msstream) {
		return 'ms-stream'
	} else if (capability.arraybuffer && preferBinary) {
		return 'arraybuffer'
	} else if (capability.vbArray && preferBinary) {
		return 'text:vbarray'
	} else {
		return 'text'
	}
}

var ClientRequest = module.exports = function (opts) {
	var self = this
	stream.Writable.call(self)

	self._opts = opts
	self._body = []
	self._headers = {}
	if (opts.auth)
		self.setHeader('Authorization', 'Basic ' + new Buffer(opts.auth).toString('base64'))
	Object.keys(opts.headers).forEach(function (name) {
		self.setHeader(name, opts.headers[name])
	})

	var preferBinary
	var useFetch = true
	if (opts.mode === 'disable-fetch' || ('requestTimeout' in opts && !capability.abortController)) {
		// If the use of XHR should be preferred. Not typically needed.
		useFetch = false
		preferBinary = true
	} else if (opts.mode === 'prefer-streaming') {
		// If streaming is a high priority but binary compatibility and
		// the accuracy of the 'content-type' header aren't
		preferBinary = false
	} else if (opts.mode === 'allow-wrong-content-type') {
		// If streaming is more important than preserving the 'content-type' header
		preferBinary = !capability.overrideMimeType
	} else if (!opts.mode || opts.mode === 'default' || opts.mode === 'prefer-fast') {
		// Use binary if text streaming may corrupt data or the content-type header, or for speed
		preferBinary = true
	} else {
		throw new Error('Invalid value for opts.mode')
	}
	self._mode = decideMode(preferBinary, useFetch)
	self._fetchTimer = null

	self.on('finish', function () {
		self._onFinish()
	})
}

inherits(ClientRequest, stream.Writable)

ClientRequest.prototype.setHeader = function (name, value) {
	var self = this
	var lowerName = name.toLowerCase()
	// This check is not necessary, but it prevents warnings from browsers about setting unsafe
	// headers. To be honest I'm not entirely sure hiding these warnings is a good thing, but
	// http-browserify did it, so I will too.
	if (unsafeHeaders.indexOf(lowerName) !== -1)
		return

	self._headers[lowerName] = {
		name: name,
		value: value
	}
}

ClientRequest.prototype.getHeader = function (name) {
	var header = this._headers[name.toLowerCase()]
	if (header)
		return header.value
	return null
}

ClientRequest.prototype.removeHeader = function (name) {
	var self = this
	delete self._headers[name.toLowerCase()]
}

ClientRequest.prototype._onFinish = function () {
	var self = this

	if (self._destroyed)
		return
	var opts = self._opts

	var headersObj = self._headers
	var body = null
	if (opts.method !== 'GET' && opts.method !== 'HEAD') {
		if (capability.arraybuffer) {
			body = toArrayBuffer(Buffer.concat(self._body))
		} else if (capability.blobConstructor) {
			body = new global.Blob(self._body.map(function (buffer) {
				return toArrayBuffer(buffer)
			}), {
				type: (headersObj['content-type'] || {}).value || ''
			})
		} else {
			// get utf8 string
			body = Buffer.concat(self._body).toString()
		}
	}

	// create flattened list of headers
	var headersList = []
	Object.keys(headersObj).forEach(function (keyName) {
		var name = headersObj[keyName].name
		var value = headersObj[keyName].value
		if (Array.isArray(value)) {
			value.forEach(function (v) {
				headersList.push([name, v])
			})
		} else {
			headersList.push([name, value])
		}
	})

	if (self._mode === 'fetch') {
		var signal = null
		var fetchTimer = null
		if (capability.abortController) {
			var controller = new AbortController()
			signal = controller.signal
			self._fetchAbortController = controller

			if ('requestTimeout' in opts && opts.requestTimeout !== 0) {
				self._fetchTimer = global.setTimeout(function () {
					self.emit('requestTimeout')
					if (self._fetchAbortController)
						self._fetchAbortController.abort()
				}, opts.requestTimeout)
			}
		}

		global.fetch(self._opts.url, {
			method: self._opts.method,
			headers: headersList,
			body: body || undefined,
			mode: 'cors',
			credentials: opts.withCredentials ? 'include' : 'same-origin',
			signal: signal
		}).then(function (response) {
			self._fetchResponse = response
			self._connect()
		}, function (reason) {
			global.clearTimeout(self._fetchTimer)
			if (!self._destroyed)
				self.emit('error', reason)
		})
	} else {
		var xhr = self._xhr = new global.XMLHttpRequest()
		try {
			xhr.open(self._opts.method, self._opts.url, true)
		} catch (err) {
			process.nextTick(function () {
				self.emit('error', err)
			})
			return
		}

		// Can't set responseType on really old browsers
		if ('responseType' in xhr)
			xhr.responseType = self._mode.split(':')[0]

		if ('withCredentials' in xhr)
			xhr.withCredentials = !!opts.withCredentials

		if (self._mode === 'text' && 'overrideMimeType' in xhr)
			xhr.overrideMimeType('text/plain; charset=x-user-defined')

		if ('requestTimeout' in opts) {
			xhr.timeout = opts.requestTimeout
			xhr.ontimeout = function () {
				self.emit('requestTimeout')
			}
		}

		headersList.forEach(function (header) {
			xhr.setRequestHeader(header[0], header[1])
		})

		self._response = null
		xhr.onreadystatechange = function () {
			switch (xhr.readyState) {
				case rStates.LOADING:
				case rStates.DONE:
					self._onXHRProgress()
					break
			}
		}
		// Necessary for streaming in Firefox, since xhr.response is ONLY defined
		// in onprogress, not in onreadystatechange with xhr.readyState = 3
		if (self._mode === 'moz-chunked-arraybuffer') {
			xhr.onprogress = function () {
				self._onXHRProgress()
			}
		}

		xhr.onerror = function () {
			if (self._destroyed)
				return
			self.emit('error', new Error('XHR error'))
		}

		try {
			xhr.send(body)
		} catch (err) {
			process.nextTick(function () {
				self.emit('error', err)
			})
			return
		}
	}
}

/**
 * Checks if xhr.status is readable and non-zero, indicating no error.
 * Even though the spec says it should be available in readyState 3,
 * accessing it throws an exception in IE8
 */
function statusValid (xhr) {
	try {
		var status = xhr.status
		return (status !== null && status !== 0)
	} catch (e) {
		return false
	}
}

ClientRequest.prototype._onXHRProgress = function () {
	var self = this

	if (!statusValid(self._xhr) || self._destroyed)
		return

	if (!self._response)
		self._connect()

	self._response._onXHRProgress()
}

ClientRequest.prototype._connect = function () {
	var self = this

	if (self._destroyed)
		return

	self._response = new IncomingMessage(self._xhr, self._fetchResponse, self._mode, self._fetchTimer)
	self._response.on('error', function(err) {
		self.emit('error', err)
	})

	self.emit('response', self._response)
}

ClientRequest.prototype._write = function (chunk, encoding, cb) {
	var self = this

	self._body.push(chunk)
	cb()
}

ClientRequest.prototype.abort = ClientRequest.prototype.destroy = function () {
	var self = this
	self._destroyed = true
	global.clearTimeout(self._fetchTimer)
	if (self._response)
		self._response._destroyed = true
	if (self._xhr)
		self._xhr.abort()
	else if (self._fetchAbortController)
		self._fetchAbortController.abort()
}

ClientRequest.prototype.end = function (data, encoding, cb) {
	var self = this
	if (typeof data === 'function') {
		cb = data
		data = undefined
	}

	stream.Writable.prototype.end.call(self, data, encoding, cb)
}

ClientRequest.prototype.flushHeaders = function () {}
ClientRequest.prototype.setTimeout = function () {}
ClientRequest.prototype.setNoDelay = function () {}
ClientRequest.prototype.setSocketKeepAlive = function () {}

// Taken from http://www.w3.org/TR/XMLHttpRequest/#the-setrequestheader%28%29-method
var unsafeHeaders = [
	'accept-charset',
	'accept-encoding',
	'access-control-request-headers',
	'access-control-request-method',
	'connection',
	'content-length',
	'cookie',
	'cookie2',
	'date',
	'dnt',
	'expect',
	'host',
	'keep-alive',
	'origin',
	'referer',
	'te',
	'trailer',
	'transfer-encoding',
	'upgrade',
	'via'
]

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"./capability":31,"./response":33,"_process":14,"buffer":4,"inherits":10,"readable-stream":28,"to-arraybuffer":35}],33:[function(require,module,exports){
(function (process,global,Buffer){
var capability = require('./capability')
var inherits = require('inherits')
var stream = require('readable-stream')

var rStates = exports.readyStates = {
	UNSENT: 0,
	OPENED: 1,
	HEADERS_RECEIVED: 2,
	LOADING: 3,
	DONE: 4
}

var IncomingMessage = exports.IncomingMessage = function (xhr, response, mode, fetchTimer) {
	var self = this
	stream.Readable.call(self)

	self._mode = mode
	self.headers = {}
	self.rawHeaders = []
	self.trailers = {}
	self.rawTrailers = []

	// Fake the 'close' event, but only once 'end' fires
	self.on('end', function () {
		// The nextTick is necessary to prevent the 'request' module from causing an infinite loop
		process.nextTick(function () {
			self.emit('close')
		})
	})

	if (mode === 'fetch') {
		self._fetchResponse = response

		self.url = response.url
		self.statusCode = response.status
		self.statusMessage = response.statusText
		
		response.headers.forEach(function (header, key){
			self.headers[key.toLowerCase()] = header
			self.rawHeaders.push(key, header)
		})

		if (capability.writableStream) {
			var writable = new WritableStream({
				write: function (chunk) {
					return new Promise(function (resolve, reject) {
						if (self._destroyed) {
							reject()
						} else if(self.push(new Buffer(chunk))) {
							resolve()
						} else {
							self._resumeFetch = resolve
						}
					})
				},
				close: function () {
					global.clearTimeout(fetchTimer)
					if (!self._destroyed)
						self.push(null)
				},
				abort: function (err) {
					if (!self._destroyed)
						self.emit('error', err)
				}
			})

			try {
				response.body.pipeTo(writable).catch(function (err) {
					global.clearTimeout(fetchTimer)
					if (!self._destroyed)
						self.emit('error', err)
				})
				return
			} catch (e) {} // pipeTo method isn't defined. Can't find a better way to feature test this
		}
		// fallback for when writableStream or pipeTo aren't available
		var reader = response.body.getReader()
		function read () {
			reader.read().then(function (result) {
				if (self._destroyed)
					return
				if (result.done) {
					global.clearTimeout(fetchTimer)
					self.push(null)
					return
				}
				self.push(new Buffer(result.value))
				read()
			}).catch(function (err) {
				global.clearTimeout(fetchTimer)
				if (!self._destroyed)
					self.emit('error', err)
			})
		}
		read()
	} else {
		self._xhr = xhr
		self._pos = 0

		self.url = xhr.responseURL
		self.statusCode = xhr.status
		self.statusMessage = xhr.statusText
		var headers = xhr.getAllResponseHeaders().split(/\r?\n/)
		headers.forEach(function (header) {
			var matches = header.match(/^([^:]+):\s*(.*)/)
			if (matches) {
				var key = matches[1].toLowerCase()
				if (key === 'set-cookie') {
					if (self.headers[key] === undefined) {
						self.headers[key] = []
					}
					self.headers[key].push(matches[2])
				} else if (self.headers[key] !== undefined) {
					self.headers[key] += ', ' + matches[2]
				} else {
					self.headers[key] = matches[2]
				}
				self.rawHeaders.push(matches[1], matches[2])
			}
		})

		self._charset = 'x-user-defined'
		if (!capability.overrideMimeType) {
			var mimeType = self.rawHeaders['mime-type']
			if (mimeType) {
				var charsetMatch = mimeType.match(/;\s*charset=([^;])(;|$)/)
				if (charsetMatch) {
					self._charset = charsetMatch[1].toLowerCase()
				}
			}
			if (!self._charset)
				self._charset = 'utf-8' // best guess
		}
	}
}

inherits(IncomingMessage, stream.Readable)

IncomingMessage.prototype._read = function () {
	var self = this

	var resolve = self._resumeFetch
	if (resolve) {
		self._resumeFetch = null
		resolve()
	}
}

IncomingMessage.prototype._onXHRProgress = function () {
	var self = this

	var xhr = self._xhr

	var response = null
	switch (self._mode) {
		case 'text:vbarray': // For IE9
			if (xhr.readyState !== rStates.DONE)
				break
			try {
				// This fails in IE8
				response = new global.VBArray(xhr.responseBody).toArray()
			} catch (e) {}
			if (response !== null) {
				self.push(new Buffer(response))
				break
			}
			// Falls through in IE8	
		case 'text':
			try { // This will fail when readyState = 3 in IE9. Switch mode and wait for readyState = 4
				response = xhr.responseText
			} catch (e) {
				self._mode = 'text:vbarray'
				break
			}
			if (response.length > self._pos) {
				var newData = response.substr(self._pos)
				if (self._charset === 'x-user-defined') {
					var buffer = new Buffer(newData.length)
					for (var i = 0; i < newData.length; i++)
						buffer[i] = newData.charCodeAt(i) & 0xff

					self.push(buffer)
				} else {
					self.push(newData, self._charset)
				}
				self._pos = response.length
			}
			break
		case 'arraybuffer':
			if (xhr.readyState !== rStates.DONE || !xhr.response)
				break
			response = xhr.response
			self.push(new Buffer(new Uint8Array(response)))
			break
		case 'moz-chunked-arraybuffer': // take whole
			response = xhr.response
			if (xhr.readyState !== rStates.LOADING || !response)
				break
			self.push(new Buffer(new Uint8Array(response)))
			break
		case 'ms-stream':
			response = xhr.response
			if (xhr.readyState !== rStates.LOADING)
				break
			var reader = new global.MSStreamReader()
			reader.onprogress = function () {
				if (reader.result.byteLength > self._pos) {
					self.push(new Buffer(new Uint8Array(reader.result.slice(self._pos))))
					self._pos = reader.result.byteLength
				}
			}
			reader.onload = function () {
				self.push(null)
			}
			// reader.onerror = ??? // TODO: this
			reader.readAsArrayBuffer(response)
			break
	}

	// The ms-stream case handles end separately in reader.onload()
	if (self._xhr.readyState === rStates.DONE && self._mode !== 'ms-stream') {
		self.push(null)
	}
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"./capability":31,"_process":14,"buffer":4,"inherits":10,"readable-stream":28}],34:[function(require,module,exports){
(function (setImmediate,clearImmediate){
var nextTick = require('process/browser.js').nextTick;
var apply = Function.prototype.apply;
var slice = Array.prototype.slice;
var immediateIds = {};
var nextImmediateId = 0;

// DOM APIs, for completeness

exports.setTimeout = function() {
  return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
};
exports.setInterval = function() {
  return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
};
exports.clearTimeout =
exports.clearInterval = function(timeout) { timeout.close(); };

function Timeout(id, clearFn) {
  this._id = id;
  this._clearFn = clearFn;
}
Timeout.prototype.unref = Timeout.prototype.ref = function() {};
Timeout.prototype.close = function() {
  this._clearFn.call(window, this._id);
};

// Does not start the time, just sets up the members needed.
exports.enroll = function(item, msecs) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = msecs;
};

exports.unenroll = function(item) {
  clearTimeout(item._idleTimeoutId);
  item._idleTimeout = -1;
};

exports._unrefActive = exports.active = function(item) {
  clearTimeout(item._idleTimeoutId);

  var msecs = item._idleTimeout;
  if (msecs >= 0) {
    item._idleTimeoutId = setTimeout(function onTimeout() {
      if (item._onTimeout)
        item._onTimeout();
    }, msecs);
  }
};

// That's not how node.js implements it but the exposed api is the same.
exports.setImmediate = typeof setImmediate === "function" ? setImmediate : function(fn) {
  var id = nextImmediateId++;
  var args = arguments.length < 2 ? false : slice.call(arguments, 1);

  immediateIds[id] = true;

  nextTick(function onNextTick() {
    if (immediateIds[id]) {
      // fn.call() is faster so we optimize for the common use-case
      // @see http://jsperf.com/call-apply-segu
      if (args) {
        fn.apply(null, args);
      } else {
        fn.call(null);
      }
      // Prevent ids from leaking
      exports.clearImmediate(id);
    }
  });

  return id;
};

exports.clearImmediate = typeof clearImmediate === "function" ? clearImmediate : function(id) {
  delete immediateIds[id];
};
}).call(this,require("timers").setImmediate,require("timers").clearImmediate)
},{"process/browser.js":14,"timers":34}],35:[function(require,module,exports){
var Buffer = require('buffer').Buffer

module.exports = function (buf) {
	// If the buffer is backed by a Uint8Array, a faster version will work
	if (buf instanceof Uint8Array) {
		// If the buffer isn't a subarray, return the underlying ArrayBuffer
		if (buf.byteOffset === 0 && buf.byteLength === buf.buffer.byteLength) {
			return buf.buffer
		} else if (typeof buf.buffer.slice === 'function') {
			// Otherwise we need to get a proper copy
			return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
		}
	}

	if (Buffer.isBuffer(buf)) {
		// This is the slow version that will work with any Buffer
		// implementation (even in old browsers)
		var arrayCopy = new Uint8Array(buf.length)
		var len = buf.length
		for (var i = 0; i < len; i++) {
			arrayCopy[i] = buf[i]
		}
		return arrayCopy.buffer
	} else {
		throw new Error('Argument must be a Buffer')
	}
}

},{"buffer":4}],36:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

'use strict';

var punycode = require('punycode');
var util = require('./util');

exports.parse = urlParse;
exports.resolve = urlResolve;
exports.resolveObject = urlResolveObject;
exports.format = urlFormat;

exports.Url = Url;

function Url() {
  this.protocol = null;
  this.slashes = null;
  this.auth = null;
  this.host = null;
  this.port = null;
  this.hostname = null;
  this.hash = null;
  this.search = null;
  this.query = null;
  this.pathname = null;
  this.path = null;
  this.href = null;
}

// Reference: RFC 3986, RFC 1808, RFC 2396

// define these here so at least they only have to be
// compiled once on the first module load.
var protocolPattern = /^([a-z0-9.+-]+:)/i,
    portPattern = /:[0-9]*$/,

    // Special case for a simple path URL
    simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

    // RFC 2396: characters reserved for delimiting URLs.
    // We actually just auto-escape these.
    delims = ['<', '>', '"', '`', ' ', '\r', '\n', '\t'],

    // RFC 2396: characters not allowed for various reasons.
    unwise = ['{', '}', '|', '\\', '^', '`'].concat(delims),

    // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
    autoEscape = ['\''].concat(unwise),
    // Characters that are never ever allowed in a hostname.
    // Note that any invalid chars are also handled, but these
    // are the ones that are *expected* to be seen, so we fast-path
    // them.
    nonHostChars = ['%', '/', '?', ';', '#'].concat(autoEscape),
    hostEndingChars = ['/', '?', '#'],
    hostnameMaxLen = 255,
    hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
    hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
    // protocols that can allow "unsafe" and "unwise" chars.
    unsafeProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that never have a hostname.
    hostlessProtocol = {
      'javascript': true,
      'javascript:': true
    },
    // protocols that always contain a // bit.
    slashedProtocol = {
      'http': true,
      'https': true,
      'ftp': true,
      'gopher': true,
      'file': true,
      'http:': true,
      'https:': true,
      'ftp:': true,
      'gopher:': true,
      'file:': true
    },
    querystring = require('querystring');

function urlParse(url, parseQueryString, slashesDenoteHost) {
  if (url && util.isObject(url) && url instanceof Url) return url;

  var u = new Url;
  u.parse(url, parseQueryString, slashesDenoteHost);
  return u;
}

Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
  if (!util.isString(url)) {
    throw new TypeError("Parameter 'url' must be a string, not " + typeof url);
  }

  // Copy chrome, IE, opera backslash-handling behavior.
  // Back slashes before the query string get converted to forward slashes
  // See: https://code.google.com/p/chromium/issues/detail?id=25916
  var queryIndex = url.indexOf('?'),
      splitter =
          (queryIndex !== -1 && queryIndex < url.indexOf('#')) ? '?' : '#',
      uSplit = url.split(splitter),
      slashRegex = /\\/g;
  uSplit[0] = uSplit[0].replace(slashRegex, '/');
  url = uSplit.join(splitter);

  var rest = url;

  // trim before proceeding.
  // This is to support parse stuff like "  http://foo.com  \n"
  rest = rest.trim();

  if (!slashesDenoteHost && url.split('#').length === 1) {
    // Try fast path regexp
    var simplePath = simplePathPattern.exec(rest);
    if (simplePath) {
      this.path = rest;
      this.href = rest;
      this.pathname = simplePath[1];
      if (simplePath[2]) {
        this.search = simplePath[2];
        if (parseQueryString) {
          this.query = querystring.parse(this.search.substr(1));
        } else {
          this.query = this.search.substr(1);
        }
      } else if (parseQueryString) {
        this.search = '';
        this.query = {};
      }
      return this;
    }
  }

  var proto = protocolPattern.exec(rest);
  if (proto) {
    proto = proto[0];
    var lowerProto = proto.toLowerCase();
    this.protocol = lowerProto;
    rest = rest.substr(proto.length);
  }

  // figure out if it's got a host
  // user@server is *always* interpreted as a hostname, and url
  // resolution will treat //foo/bar as host=foo,path=bar because that's
  // how the browser resolves relative URLs.
  if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
    var slashes = rest.substr(0, 2) === '//';
    if (slashes && !(proto && hostlessProtocol[proto])) {
      rest = rest.substr(2);
      this.slashes = true;
    }
  }

  if (!hostlessProtocol[proto] &&
      (slashes || (proto && !slashedProtocol[proto]))) {

    // there's a hostname.
    // the first instance of /, ?, ;, or # ends the host.
    //
    // If there is an @ in the hostname, then non-host chars *are* allowed
    // to the left of the last @ sign, unless some host-ending character
    // comes *before* the @-sign.
    // URLs are obnoxious.
    //
    // ex:
    // http://a@b@c/ => user:a@b host:c
    // http://a@b?@c => user:a host:c path:/?@c

    // v0.12 TODO(isaacs): This is not quite how Chrome does things.
    // Review our test case against browsers more comprehensively.

    // find the first instance of any hostEndingChars
    var hostEnd = -1;
    for (var i = 0; i < hostEndingChars.length; i++) {
      var hec = rest.indexOf(hostEndingChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }

    // at this point, either we have an explicit point where the
    // auth portion cannot go past, or the last @ char is the decider.
    var auth, atSign;
    if (hostEnd === -1) {
      // atSign can be anywhere.
      atSign = rest.lastIndexOf('@');
    } else {
      // atSign must be in auth portion.
      // http://a@b/c@d => host:b auth:a path:/c@d
      atSign = rest.lastIndexOf('@', hostEnd);
    }

    // Now we have a portion which is definitely the auth.
    // Pull that off.
    if (atSign !== -1) {
      auth = rest.slice(0, atSign);
      rest = rest.slice(atSign + 1);
      this.auth = decodeURIComponent(auth);
    }

    // the host is the remaining to the left of the first non-host char
    hostEnd = -1;
    for (var i = 0; i < nonHostChars.length; i++) {
      var hec = rest.indexOf(nonHostChars[i]);
      if (hec !== -1 && (hostEnd === -1 || hec < hostEnd))
        hostEnd = hec;
    }
    // if we still have not hit it, then the entire thing is a host.
    if (hostEnd === -1)
      hostEnd = rest.length;

    this.host = rest.slice(0, hostEnd);
    rest = rest.slice(hostEnd);

    // pull out port.
    this.parseHost();

    // we've indicated that there is a hostname,
    // so even if it's empty, it has to be present.
    this.hostname = this.hostname || '';

    // if hostname begins with [ and ends with ]
    // assume that it's an IPv6 address.
    var ipv6Hostname = this.hostname[0] === '[' &&
        this.hostname[this.hostname.length - 1] === ']';

    // validate a little.
    if (!ipv6Hostname) {
      var hostparts = this.hostname.split(/\./);
      for (var i = 0, l = hostparts.length; i < l; i++) {
        var part = hostparts[i];
        if (!part) continue;
        if (!part.match(hostnamePartPattern)) {
          var newpart = '';
          for (var j = 0, k = part.length; j < k; j++) {
            if (part.charCodeAt(j) > 127) {
              // we replace non-ASCII char with a temporary placeholder
              // we need this to make sure size of hostname is not
              // broken by replacing non-ASCII by nothing
              newpart += 'x';
            } else {
              newpart += part[j];
            }
          }
          // we test again with ASCII char only
          if (!newpart.match(hostnamePartPattern)) {
            var validParts = hostparts.slice(0, i);
            var notHost = hostparts.slice(i + 1);
            var bit = part.match(hostnamePartStart);
            if (bit) {
              validParts.push(bit[1]);
              notHost.unshift(bit[2]);
            }
            if (notHost.length) {
              rest = '/' + notHost.join('.') + rest;
            }
            this.hostname = validParts.join('.');
            break;
          }
        }
      }
    }

    if (this.hostname.length > hostnameMaxLen) {
      this.hostname = '';
    } else {
      // hostnames are always lower case.
      this.hostname = this.hostname.toLowerCase();
    }

    if (!ipv6Hostname) {
      // IDNA Support: Returns a punycoded representation of "domain".
      // It only converts parts of the domain name that
      // have non-ASCII characters, i.e. it doesn't matter if
      // you call it with a domain that already is ASCII-only.
      this.hostname = punycode.toASCII(this.hostname);
    }

    var p = this.port ? ':' + this.port : '';
    var h = this.hostname || '';
    this.host = h + p;
    this.href += this.host;

    // strip [ and ] from the hostname
    // the host field still retains them, though
    if (ipv6Hostname) {
      this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      if (rest[0] !== '/') {
        rest = '/' + rest;
      }
    }
  }

  // now rest is set to the post-host stuff.
  // chop off any delim chars.
  if (!unsafeProtocol[lowerProto]) {

    // First, make 100% sure that any "autoEscape" chars get
    // escaped, even if encodeURIComponent doesn't think they
    // need to be.
    for (var i = 0, l = autoEscape.length; i < l; i++) {
      var ae = autoEscape[i];
      if (rest.indexOf(ae) === -1)
        continue;
      var esc = encodeURIComponent(ae);
      if (esc === ae) {
        esc = escape(ae);
      }
      rest = rest.split(ae).join(esc);
    }
  }


  // chop off from the tail first.
  var hash = rest.indexOf('#');
  if (hash !== -1) {
    // got a fragment string.
    this.hash = rest.substr(hash);
    rest = rest.slice(0, hash);
  }
  var qm = rest.indexOf('?');
  if (qm !== -1) {
    this.search = rest.substr(qm);
    this.query = rest.substr(qm + 1);
    if (parseQueryString) {
      this.query = querystring.parse(this.query);
    }
    rest = rest.slice(0, qm);
  } else if (parseQueryString) {
    // no query string, but parseQueryString still requested
    this.search = '';
    this.query = {};
  }
  if (rest) this.pathname = rest;
  if (slashedProtocol[lowerProto] &&
      this.hostname && !this.pathname) {
    this.pathname = '/';
  }

  //to support http.request
  if (this.pathname || this.search) {
    var p = this.pathname || '';
    var s = this.search || '';
    this.path = p + s;
  }

  // finally, reconstruct the href based on what has been validated.
  this.href = this.format();
  return this;
};

// format a parsed object into a url string
function urlFormat(obj) {
  // ensure it's an object, and not a string url.
  // If it's an obj, this is a no-op.
  // this way, you can call url_format() on strings
  // to clean up potentially wonky urls.
  if (util.isString(obj)) obj = urlParse(obj);
  if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
  return obj.format();
}

Url.prototype.format = function() {
  var auth = this.auth || '';
  if (auth) {
    auth = encodeURIComponent(auth);
    auth = auth.replace(/%3A/i, ':');
    auth += '@';
  }

  var protocol = this.protocol || '',
      pathname = this.pathname || '',
      hash = this.hash || '',
      host = false,
      query = '';

  if (this.host) {
    host = auth + this.host;
  } else if (this.hostname) {
    host = auth + (this.hostname.indexOf(':') === -1 ?
        this.hostname :
        '[' + this.hostname + ']');
    if (this.port) {
      host += ':' + this.port;
    }
  }

  if (this.query &&
      util.isObject(this.query) &&
      Object.keys(this.query).length) {
    query = querystring.stringify(this.query);
  }

  var search = this.search || (query && ('?' + query)) || '';

  if (protocol && protocol.substr(-1) !== ':') protocol += ':';

  // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
  // unless they had them to begin with.
  if (this.slashes ||
      (!protocol || slashedProtocol[protocol]) && host !== false) {
    host = '//' + (host || '');
    if (pathname && pathname.charAt(0) !== '/') pathname = '/' + pathname;
  } else if (!host) {
    host = '';
  }

  if (hash && hash.charAt(0) !== '#') hash = '#' + hash;
  if (search && search.charAt(0) !== '?') search = '?' + search;

  pathname = pathname.replace(/[?#]/g, function(match) {
    return encodeURIComponent(match);
  });
  search = search.replace('#', '%23');

  return protocol + host + pathname + search + hash;
};

function urlResolve(source, relative) {
  return urlParse(source, false, true).resolve(relative);
}

Url.prototype.resolve = function(relative) {
  return this.resolveObject(urlParse(relative, false, true)).format();
};

function urlResolveObject(source, relative) {
  if (!source) return relative;
  return urlParse(source, false, true).resolveObject(relative);
}

Url.prototype.resolveObject = function(relative) {
  if (util.isString(relative)) {
    var rel = new Url();
    rel.parse(relative, false, true);
    relative = rel;
  }

  var result = new Url();
  var tkeys = Object.keys(this);
  for (var tk = 0; tk < tkeys.length; tk++) {
    var tkey = tkeys[tk];
    result[tkey] = this[tkey];
  }

  // hash is always overridden, no matter what.
  // even href="" will remove it.
  result.hash = relative.hash;

  // if the relative url is empty, then there's nothing left to do here.
  if (relative.href === '') {
    result.href = result.format();
    return result;
  }

  // hrefs like //foo/bar always cut to the protocol.
  if (relative.slashes && !relative.protocol) {
    // take everything except the protocol from relative
    var rkeys = Object.keys(relative);
    for (var rk = 0; rk < rkeys.length; rk++) {
      var rkey = rkeys[rk];
      if (rkey !== 'protocol')
        result[rkey] = relative[rkey];
    }

    //urlParse appends trailing / to urls like http://www.example.com
    if (slashedProtocol[result.protocol] &&
        result.hostname && !result.pathname) {
      result.path = result.pathname = '/';
    }

    result.href = result.format();
    return result;
  }

  if (relative.protocol && relative.protocol !== result.protocol) {
    // if it's a known url protocol, then changing
    // the protocol does weird things
    // first, if it's not file:, then we MUST have a host,
    // and if there was a path
    // to begin with, then we MUST have a path.
    // if it is file:, then the host is dropped,
    // because that's known to be hostless.
    // anything else is assumed to be absolute.
    if (!slashedProtocol[relative.protocol]) {
      var keys = Object.keys(relative);
      for (var v = 0; v < keys.length; v++) {
        var k = keys[v];
        result[k] = relative[k];
      }
      result.href = result.format();
      return result;
    }

    result.protocol = relative.protocol;
    if (!relative.host && !hostlessProtocol[relative.protocol]) {
      var relPath = (relative.pathname || '').split('/');
      while (relPath.length && !(relative.host = relPath.shift()));
      if (!relative.host) relative.host = '';
      if (!relative.hostname) relative.hostname = '';
      if (relPath[0] !== '') relPath.unshift('');
      if (relPath.length < 2) relPath.unshift('');
      result.pathname = relPath.join('/');
    } else {
      result.pathname = relative.pathname;
    }
    result.search = relative.search;
    result.query = relative.query;
    result.host = relative.host || '';
    result.auth = relative.auth;
    result.hostname = relative.hostname || relative.host;
    result.port = relative.port;
    // to support http.request
    if (result.pathname || result.search) {
      var p = result.pathname || '';
      var s = result.search || '';
      result.path = p + s;
    }
    result.slashes = result.slashes || relative.slashes;
    result.href = result.format();
    return result;
  }

  var isSourceAbs = (result.pathname && result.pathname.charAt(0) === '/'),
      isRelAbs = (
          relative.host ||
          relative.pathname && relative.pathname.charAt(0) === '/'
      ),
      mustEndAbs = (isRelAbs || isSourceAbs ||
                    (result.host && relative.pathname)),
      removeAllDots = mustEndAbs,
      srcPath = result.pathname && result.pathname.split('/') || [],
      relPath = relative.pathname && relative.pathname.split('/') || [],
      psychotic = result.protocol && !slashedProtocol[result.protocol];

  // if the url is a non-slashed url, then relative
  // links like ../.. should be able
  // to crawl up to the hostname, as well.  This is strange.
  // result.protocol has already been set by now.
  // Later on, put the first path part into the host field.
  if (psychotic) {
    result.hostname = '';
    result.port = null;
    if (result.host) {
      if (srcPath[0] === '') srcPath[0] = result.host;
      else srcPath.unshift(result.host);
    }
    result.host = '';
    if (relative.protocol) {
      relative.hostname = null;
      relative.port = null;
      if (relative.host) {
        if (relPath[0] === '') relPath[0] = relative.host;
        else relPath.unshift(relative.host);
      }
      relative.host = null;
    }
    mustEndAbs = mustEndAbs && (relPath[0] === '' || srcPath[0] === '');
  }

  if (isRelAbs) {
    // it's absolute.
    result.host = (relative.host || relative.host === '') ?
                  relative.host : result.host;
    result.hostname = (relative.hostname || relative.hostname === '') ?
                      relative.hostname : result.hostname;
    result.search = relative.search;
    result.query = relative.query;
    srcPath = relPath;
    // fall through to the dot-handling below.
  } else if (relPath.length) {
    // it's relative
    // throw away the existing file, and take the new path instead.
    if (!srcPath) srcPath = [];
    srcPath.pop();
    srcPath = srcPath.concat(relPath);
    result.search = relative.search;
    result.query = relative.query;
  } else if (!util.isNullOrUndefined(relative.search)) {
    // just pull out the search.
    // like href='?foo'.
    // Put this after the other two cases because it simplifies the booleans
    if (psychotic) {
      result.hostname = result.host = srcPath.shift();
      //occationaly the auth can get stuck only in host
      //this especially happens in cases like
      //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
      var authInHost = result.host && result.host.indexOf('@') > 0 ?
                       result.host.split('@') : false;
      if (authInHost) {
        result.auth = authInHost.shift();
        result.host = result.hostname = authInHost.shift();
      }
    }
    result.search = relative.search;
    result.query = relative.query;
    //to support http.request
    if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
      result.path = (result.pathname ? result.pathname : '') +
                    (result.search ? result.search : '');
    }
    result.href = result.format();
    return result;
  }

  if (!srcPath.length) {
    // no path at all.  easy.
    // we've already handled the other stuff above.
    result.pathname = null;
    //to support http.request
    if (result.search) {
      result.path = '/' + result.search;
    } else {
      result.path = null;
    }
    result.href = result.format();
    return result;
  }

  // if a url ENDs in . or .., then it must get a trailing slash.
  // however, if it ends in anything else non-slashy,
  // then it must NOT get a trailing slash.
  var last = srcPath.slice(-1)[0];
  var hasTrailingSlash = (
      (result.host || relative.host || srcPath.length > 1) &&
      (last === '.' || last === '..') || last === '');

  // strip single dots, resolve double dots to parent dir
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = srcPath.length; i >= 0; i--) {
    last = srcPath[i];
    if (last === '.') {
      srcPath.splice(i, 1);
    } else if (last === '..') {
      srcPath.splice(i, 1);
      up++;
    } else if (up) {
      srcPath.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (!mustEndAbs && !removeAllDots) {
    for (; up--; up) {
      srcPath.unshift('..');
    }
  }

  if (mustEndAbs && srcPath[0] !== '' &&
      (!srcPath[0] || srcPath[0].charAt(0) !== '/')) {
    srcPath.unshift('');
  }

  if (hasTrailingSlash && (srcPath.join('/').substr(-1) !== '/')) {
    srcPath.push('');
  }

  var isAbsolute = srcPath[0] === '' ||
      (srcPath[0] && srcPath[0].charAt(0) === '/');

  // put the host back
  if (psychotic) {
    result.hostname = result.host = isAbsolute ? '' :
                                    srcPath.length ? srcPath.shift() : '';
    //occationaly the auth can get stuck only in host
    //this especially happens in cases like
    //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
    var authInHost = result.host && result.host.indexOf('@') > 0 ?
                     result.host.split('@') : false;
    if (authInHost) {
      result.auth = authInHost.shift();
      result.host = result.hostname = authInHost.shift();
    }
  }

  mustEndAbs = mustEndAbs || (result.host && srcPath.length);

  if (mustEndAbs && !isAbsolute) {
    srcPath.unshift('');
  }

  if (!srcPath.length) {
    result.pathname = null;
    result.path = null;
  } else {
    result.pathname = srcPath.join('/');
  }

  //to support request.http
  if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
    result.path = (result.pathname ? result.pathname : '') +
                  (result.search ? result.search : '');
  }
  result.auth = relative.auth || result.auth;
  result.slashes = result.slashes || relative.slashes;
  result.href = result.format();
  return result;
};

Url.prototype.parseHost = function() {
  var host = this.host;
  var port = portPattern.exec(host);
  if (port) {
    port = port[0];
    if (port !== ':') {
      this.port = port.substr(1);
    }
    host = host.substr(0, host.length - port.length);
  }
  if (host) this.hostname = host;
};

},{"./util":37,"punycode":15,"querystring":18}],37:[function(require,module,exports){
'use strict';

module.exports = {
  isString: function(arg) {
    return typeof(arg) === 'string';
  },
  isObject: function(arg) {
    return typeof(arg) === 'object' && arg !== null;
  },
  isNull: function(arg) {
    return arg === null;
  },
  isNullOrUndefined: function(arg) {
    return arg == null;
  }
};

},{}],38:[function(require,module,exports){
(function (global){

/**
 * Module exports.
 */

module.exports = deprecate;

/**
 * Mark that a method should not be used.
 * Returns a modified function which warns once by default.
 *
 * If `localStorage.noDeprecation = true` is set, then it is a no-op.
 *
 * If `localStorage.throwDeprecation = true` is set, then deprecated functions
 * will throw an Error when invoked.
 *
 * If `localStorage.traceDeprecation = true` is set, then deprecated functions
 * will invoke `console.trace()` instead of `console.error()`.
 *
 * @param {Function} fn - the function to deprecate
 * @param {String} msg - the string to print to the console when `fn` is invoked
 * @returns {Function} a new "deprecated" version of `fn`
 * @api public
 */

function deprecate (fn, msg) {
  if (config('noDeprecation')) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (config('throwDeprecation')) {
        throw new Error(msg);
      } else if (config('traceDeprecation')) {
        console.trace(msg);
      } else {
        console.warn(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
}

/**
 * Checks `localStorage` for boolean values for the given `name`.
 *
 * @param {String} name
 * @returns {Boolean}
 * @api private
 */

function config (name) {
  // accessing global.localStorage can trigger a DOMException in sandboxed iframes
  try {
    if (!global.localStorage) return false;
  } catch (_) {
    return false;
  }
  var val = global.localStorage[name];
  if (null == val) return false;
  return String(val).toLowerCase() === 'true';
}

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],39:[function(require,module,exports){
module.exports = extend

var hasOwnProperty = Object.prototype.hasOwnProperty;

function extend() {
    var target = {}

    for (var i = 0; i < arguments.length; i++) {
        var source = arguments[i]

        for (var key in source) {
            if (hasOwnProperty.call(source, key)) {
                target[key] = source[key]
            }
        }
    }

    return target
}

},{}],40:[function(require,module,exports){
module.exports = require("core-js/library/fn/array/is-array");
},{"core-js/library/fn/array/is-array":50}],41:[function(require,module,exports){
module.exports = require("core-js/library/fn/get-iterator");
},{"core-js/library/fn/get-iterator":51}],42:[function(require,module,exports){
module.exports = require("core-js/library/fn/object/create");
},{"core-js/library/fn/object/create":52}],43:[function(require,module,exports){
module.exports = require("core-js/library/fn/parse-int");
},{"core-js/library/fn/parse-int":53}],44:[function(require,module,exports){
var _Array$isArray = require("../core-js/array/is-array");

function _arrayWithHoles(arr) {
  if (_Array$isArray(arr)) return arr;
}

module.exports = _arrayWithHoles;
},{"../core-js/array/is-array":40}],45:[function(require,module,exports){
function _interopRequireDefault(obj) {
  return obj && obj.__esModule ? obj : {
    "default": obj
  };
}

module.exports = _interopRequireDefault;
},{}],46:[function(require,module,exports){
var _getIterator = require("../core-js/get-iterator");

function _iterableToArrayLimit(arr, i) {
  var _arr = [];
  var _n = true;
  var _d = false;
  var _e = undefined;

  try {
    for (var _i = _getIterator(arr), _s; !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);

      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i["return"] != null) _i["return"]();
    } finally {
      if (_d) throw _e;
    }
  }

  return _arr;
}

module.exports = _iterableToArrayLimit;
},{"../core-js/get-iterator":41}],47:[function(require,module,exports){
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance");
}

module.exports = _nonIterableRest;
},{}],48:[function(require,module,exports){
var arrayWithHoles = require("./arrayWithHoles");

var iterableToArrayLimit = require("./iterableToArrayLimit");

var nonIterableRest = require("./nonIterableRest");

function _slicedToArray(arr, i) {
  return arrayWithHoles(arr) || iterableToArrayLimit(arr, i) || nonIterableRest();
}

module.exports = _slicedToArray;
},{"./arrayWithHoles":44,"./iterableToArrayLimit":46,"./nonIterableRest":47}],49:[function(require,module,exports){
(function (global,Buffer){
(function(root, factory) {
  if (typeof define === "function" && define.amd) {
    define([], factory);
  } else if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.returnExports = factory();
  }
})(this, function() {
  var shadow$umd$export = null;

  var g,ba=ba||{},fa=global;function ia(a){return"string"==typeof a}function ka(){}
function la(a){var b=typeof a;if("object"==b)if(a){if(a instanceof Array)return"array";if(a instanceof Object)return b;var c=Object.prototype.toString.call(a);if("[object Window]"==c)return"object";if("[object Array]"==c||"number"==typeof a.length&&"undefined"!=typeof a.splice&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("splice"))return"array";if("[object Function]"==c||"undefined"!=typeof a.call&&"undefined"!=typeof a.propertyIsEnumerable&&!a.propertyIsEnumerable("call"))return"function"}else return"null";
else if("function"==b&&"undefined"==typeof a.call)return"object";return b}function na(a){var b=la(a);return"array"==b||"object"==b&&"number"==typeof a.length}function oa(a){return"function"==la(a)}function pa(a){var b=typeof a;return"object"==b&&null!=a||"function"==b}function qa(a){return a[ra]||(a[ra]=++sa)}var ra="closure_uid_"+(1E9*Math.random()>>>0),sa=0;function ua(a,b,c){return a.call.apply(a.bind,arguments)}
function va(a,b,c){if(!a)throw Error();if(2<arguments.length){var d=Array.prototype.slice.call(arguments,2);return function(){var e=Array.prototype.slice.call(arguments);Array.prototype.unshift.apply(e,d);return a.apply(b,e)}}return function(){return a.apply(b,arguments)}}function wa(a,b,c){wa=Function.prototype.bind&&-1!=Function.prototype.bind.toString().indexOf("native code")?ua:va;return wa.apply(null,arguments)}
function xa(a,b){function c(){}c.prototype=b.prototype;a.jf=b.prototype;a.prototype=new c;a.prototype.constructor=a;a.ud=function(d,e,f){for(var h=Array(arguments.length-2),k=2;k<arguments.length;k++)h[k-2]=arguments[k];return b.prototype[e].apply(d,h)}};function ya(a){ya[" "](a);return a}ya[" "]=ka;function Aa(a,b,c){return Object.prototype.hasOwnProperty.call(a,b)?a[b]:a[b]=c(b)};function Ba(a,b){this.sa=a|0;this.pa=b|0}function Ca(a){return 0<a?0x7fffffffffffffff<=a?Ea:new Ba(a,a/4294967296):0>a?-9223372036854775808>=a?Fa:(new Ba(-a,-a/4294967296)).xa():Ga}function Ia(a,b){return new Ba(a,b)}
function Ja(a,b){if("-"==a.charAt(0))return Ja(a.substring(1),b).xa();var c=parseInt(a,b||10);if(9007199254740991>=c)return new Ba(c%4294967296|0,c/4294967296|0);if(0==a.length)throw Error("number format error: empty string");if(0<=a.indexOf("-"))throw Error('number format error: interior "-" character: '+a);b=b||10;if(2>b||36<b)throw Error("radix out of range: "+b);c=Ca(Math.pow(b,8));for(var d=Ga,e=0;e<a.length;e+=8){var f=Math.min(8,a.length-e),h=parseInt(a.substring(e,e+f),b);8>f?(f=Ca(Math.pow(b,
f)),d=d.multiply(f).add(Ca(h))):(d=d.multiply(c),d=d.add(Ca(h)))}return d}var Ga=Ia(0,0),Ka=Ia(1,0),La=Ia(-1,-1),Ea=Ia(4294967295,2147483647),Fa=Ia(0,2147483648);g=Ba.prototype;g.Ce=function(){return this.sa};g.Db=function(){return 4294967296*this.pa+(this.sa>>>0)};g.isSafeInteger=function(){var a=this.pa>>21;return 0==a||-1==a&&!(0==this.sa&&-2097152==this.pa)};
g.toString=function(a){a=a||10;if(2>a||36<a)throw Error("radix out of range: "+a);if(this.isSafeInteger()){var b=this.Db();return 10==a?""+b:b.toString(a)}b=14-(a>>2);var c=Math.pow(a,b),d=Ia(c,c/4294967296);c=Ma(this,d);d=Math.abs(this.Ac(c.multiply(d)).Db());var e=10==a?""+d:d.toString(a);e.length<b&&(e="0000000000000".substr(e.length-b)+e);d=c.Db();return(10==a?d:d.toString(a))+e};g.kb=function(){return 0==this.sa&&0==this.pa};g.eb=function(){return 0>this.pa};
g.Kb=function(a){return this.sa==a.sa&&this.pa==a.pa};g.Kd=function(a){return 0>this.compare(a)};g.ve=function(a){return 0>=this.compare(a)};g.Fd=function(a){return 0<this.compare(a)};g.re=function(a){return 0<=this.compare(a)};g.compare=function(a){return this.pa==a.pa?this.sa==a.sa?0:this.sa>>>0>a.sa>>>0?1:-1:this.pa>a.pa?1:-1};g.xa=function(){var a=~this.sa+1|0;return Ia(a,~this.pa+!a|0)};
g.add=function(a){var b=this.pa>>>16,c=this.pa&65535,d=this.sa>>>16,e=a.pa>>>16,f=a.pa&65535,h=a.sa>>>16;a=(this.sa&65535)+(a.sa&65535);h=(a>>>16)+(d+h);d=h>>>16;d+=c+f;b=(d>>>16)+(b+e)&65535;return Ia((h&65535)<<16|a&65535,b<<16|d&65535)};g.Ac=function(a){return this.add(a.xa())};
g.multiply=function(a){if(this.kb())return this;if(a.kb())return a;var b=this.pa>>>16,c=this.pa&65535,d=this.sa>>>16,e=this.sa&65535,f=a.pa>>>16,h=a.pa&65535,k=a.sa>>>16;a=a.sa&65535;var l=e*a;var m=(l>>>16)+d*a;var q=m>>>16;m=(m&65535)+e*k;q+=m>>>16;q+=c*a;var n=q>>>16;q=(q&65535)+d*k;n+=q>>>16;q=(q&65535)+e*h;n=n+(q>>>16)+(b*a+c*k+d*h+e*f)&65535;return Ia((m&65535)<<16|l&65535,n<<16|q&65535)};
function Ma(a,b){if(b.kb())throw Error("division by zero");if(a.eb()){if(a.Kb(Fa)){if(b.Kb(Ka)||b.Kb(La))return Fa;if(b.Kb(Fa))return Ka;var c=Ma(a.pc(1),b).shiftLeft(1);if(c.Kb(Ga))return b.eb()?Ka:La;a=a.Ac(b.multiply(c));return c.add(Ma(a,b))}return b.eb()?Ma(a.xa(),b.xa()):Ma(a.xa(),b).xa()}if(a.kb())return Ga;if(b.eb())return b.Kb(Fa)?Ga:Ma(a,b.xa()).xa();for(var d=Ga;a.re(b);){c=Math.max(1,Math.floor(a.Db()/b.Db()));var e=Math.ceil(Math.log(c)/Math.LN2);e=48>=e?1:Math.pow(2,e-48);for(var f=
Ca(c),h=f.multiply(b);h.eb()||h.Fd(a);)c-=e,f=Ca(c),h=f.multiply(b);f.kb()&&(f=Ka);d=d.add(f);a=a.Ac(h)}return d}g.Ze=function(){return Ia(~this.sa,~this.pa)};g.and=function(a){return Ia(this.sa&a.sa,this.pa&a.pa)};g.or=function(a){return Ia(this.sa|a.sa,this.pa|a.pa)};g.xor=function(a){return Ia(this.sa^a.sa,this.pa^a.pa)};g.shiftLeft=function(a){a&=63;if(0==a)return this;var b=this.sa;return 32>a?Ia(b<<a,this.pa<<a|b>>>32-a):Ia(0,b<<a-32)};
g.pc=function(a){a&=63;if(0==a)return this;var b=this.pa;return 32>a?Ia(this.sa>>>a|b<<32-a,b>>a):Ia(b>>a-32,0<=b?0:-1)};function Na(a,b){b&=63;if(0==b)return a;var c=a.pa;return 32>b?Ia(a.sa>>>b|c<<32-b,c>>>b):32==b?Ia(c,0):Ia(c>>>b-32,0)};function Oa(a,b){this.ua=[];this.mb=b;for(var c=!0,d=a.length-1;0<=d;d--){var e=a[d]|0;c&&e==b||(this.ua[d]=e,c=!1)}}var Pa={};function Qa(a){if(-128<=a&&128>a){var b=Pa[a];if(b)return b}b=new Oa([a|0],0>a?-1:0);-128<=a&&128>a&&(Pa[a]=b);return b}function Ra(a){if(isNaN(a)||!isFinite(a))return Sa;if(0>a)return Ra(-a).xa();for(var b=[],c=1,d=0;a>=c;d++)b[d]=a/c|0,c*=Ta;return new Oa(b,0)}var Ta=4294967296,Sa=Qa(0),Ua=Qa(1),Va=Qa(16777216);g=Oa.prototype;
g.Ce=function(){return 0<this.ua.length?this.ua[0]:this.mb};g.Db=function(){if(this.eb())return-this.xa().Db();for(var a=0,b=1,c=0;c<this.ua.length;c++){var d=Wa(this,c);a+=(0<=d?d:Ta+d)*b;b*=Ta}return a};
g.toString=function(a){a=a||10;if(2>a||36<a)throw Error("radix out of range: "+a);if(this.kb())return"0";if(this.eb())return"-"+this.xa().toString(a);for(var b=Ra(Math.pow(a,6)),c=this,d="";;){var e=Xa(c,b),f=(c.Ac(e.multiply(b)).Ce()>>>0).toString(a);c=e;if(c.kb())return f+d;for(;6>f.length;)f="0"+f;d=""+f+d}};function Wa(a,b){return 0>b?0:b<a.ua.length?a.ua[b]:a.mb}g.kb=function(){if(0!=this.mb)return!1;for(var a=0;a<this.ua.length;a++)if(0!=this.ua[a])return!1;return!0};
g.eb=function(){return-1==this.mb};g.Kb=function(a){if(this.mb!=a.mb)return!1;for(var b=Math.max(this.ua.length,a.ua.length),c=0;c<b;c++)if(Wa(this,c)!=Wa(a,c))return!1;return!0};g.Fd=function(a){return 0<this.compare(a)};g.re=function(a){return 0<=this.compare(a)};g.Kd=function(a){return 0>this.compare(a)};g.ve=function(a){return 0>=this.compare(a)};g.compare=function(a){a=this.Ac(a);return a.eb()?-1:a.kb()?0:1};g.xa=function(){return this.Ze().add(Ua)};
g.add=function(a){for(var b=Math.max(this.ua.length,a.ua.length),c=[],d=0,e=0;e<=b;e++){var f=d+(Wa(this,e)&65535)+(Wa(a,e)&65535),h=(f>>>16)+(Wa(this,e)>>>16)+(Wa(a,e)>>>16);d=h>>>16;f&=65535;h&=65535;c[e]=h<<16|f}return new Oa(c,c[c.length-1]&-2147483648?-1:0)};g.Ac=function(a){return this.add(a.xa())};
g.multiply=function(a){if(this.kb()||a.kb())return Sa;if(this.eb())return a.eb()?this.xa().multiply(a.xa()):this.xa().multiply(a).xa();if(a.eb())return this.multiply(a.xa()).xa();if(this.Kd(Va)&&a.Kd(Va))return Ra(this.Db()*a.Db());for(var b=this.ua.length+a.ua.length,c=[],d=0;d<2*b;d++)c[d]=0;for(d=0;d<this.ua.length;d++)for(var e=0;e<a.ua.length;e++){var f=Wa(this,d)>>>16,h=Wa(this,d)&65535,k=Wa(a,e)>>>16,l=Wa(a,e)&65535;c[2*d+2*e]+=h*l;Ya(c,2*d+2*e);c[2*d+2*e+1]+=f*l;Ya(c,2*d+2*e+1);c[2*d+2*e+
1]+=h*k;Ya(c,2*d+2*e+1);c[2*d+2*e+2]+=f*k;Ya(c,2*d+2*e+2)}for(d=0;d<b;d++)c[d]=c[2*d+1]<<16|c[2*d];for(d=b;d<2*b;d++)c[d]=0;return new Oa(c,0)};function Ya(a,b){for(;(a[b]&65535)!=a[b];)a[b+1]+=a[b]>>>16,a[b]&=65535,b++}
function Xa(a,b){if(b.kb())throw Error("division by zero");if(a.kb())return Sa;if(a.eb())return b.eb()?Xa(a.xa(),b.xa()):Xa(a.xa(),b).xa();if(b.eb())return Xa(a,b.xa()).xa();if(30<a.ua.length){if(a.eb()||b.eb())throw Error("slowDivide_ only works with positive integers.");for(var c=Ua;b.ve(a);)c=c.shiftLeft(1),b=b.shiftLeft(1);var d=c.pc(1),e=b.pc(1);b=b.pc(2);for(c=c.pc(2);!b.kb();){var f=e.add(b);f.ve(a)&&(d=d.add(c),e=f);b=b.pc(1);c=c.pc(1)}return d}for(c=Sa;a.re(b);){d=Math.max(1,Math.floor(a.Db()/
b.Db()));e=Math.ceil(Math.log(d)/Math.LN2);e=48>=e?1:Math.pow(2,e-48);f=Ra(d);for(var h=f.multiply(b);h.eb()||h.Fd(a);)d-=e,f=Ra(d),h=f.multiply(b);f.kb()&&(f=Ua);c=c.add(f);a=a.Ac(h)}return c}g.Ze=function(){for(var a=this.ua.length,b=[],c=0;c<a;c++)b[c]=~this.ua[c];return new Oa(b,~this.mb)};g.and=function(a){for(var b=Math.max(this.ua.length,a.ua.length),c=[],d=0;d<b;d++)c[d]=Wa(this,d)&Wa(a,d);return new Oa(c,this.mb&a.mb)};
g.or=function(a){for(var b=Math.max(this.ua.length,a.ua.length),c=[],d=0;d<b;d++)c[d]=Wa(this,d)|Wa(a,d);return new Oa(c,this.mb|a.mb)};g.xor=function(a){for(var b=Math.max(this.ua.length,a.ua.length),c=[],d=0;d<b;d++)c[d]=Wa(this,d)^Wa(a,d);return new Oa(c,this.mb^a.mb)};g.shiftLeft=function(a){var b=a>>5;a%=32;for(var c=this.ua.length+b+(0<a?1:0),d=[],e=0;e<c;e++)d[e]=0<a?Wa(this,e-b)<<a|Wa(this,e-b-1)>>>32-a:Wa(this,e-b);return new Oa(d,this.mb)};
g.pc=function(a){var b=a>>5;a%=32;for(var c=this.ua.length-b,d=[],e=0;e<c;e++)d[e]=0<a?Wa(this,e+b)>>>a|Wa(this,e+b+1)<<32-a:Wa(this,e+b);return new Oa(d,this.mb)};function Za(a){return/^[\s\xa0]*$/.test(a)}var $a=String.prototype.trim?function(a){return a.trim()}:function(a){return/^[\s\xa0]*([\s\S]*?)[\s\xa0]*$/.exec(a)[1]};function ab(a){return-1!=bb.toLowerCase().indexOf(a.toLowerCase())}function cb(a,b){return a<b?-1:a>b?1:0};function db(a){return String(a.charAt(0)).toUpperCase()+String(a.substr(1)).toLowerCase()}function eb(a,b,c){a=a.split(b);for(var d=[];0<c&&a.length;)d.push(a.shift()),c--;a.length&&d.push(a.join(b));return d};function fb(a,b){var c={},d;for(d in a)c[d]=b.call(void 0,a[d],d,a);return c}function gb(a){var b=[],c=0,d;for(d in a)b[c++]=d;return b}var hb="constructor hasOwnProperty isPrototypeOf propertyIsEnumerable toLocaleString toString valueOf".split(" ");function ib(a,b){for(var c,d,e=1;e<arguments.length;e++){d=arguments[e];for(c in d)a[c]=d[c];for(var f=0;f<hb.length;f++)c=hb[f],Object.prototype.hasOwnProperty.call(d,c)&&(a[c]=d[c])}};var jb=Array.prototype.indexOf?function(a,b){return Array.prototype.indexOf.call(a,b,void 0)}:function(a,b){if(ia(a))return ia(b)&&1==b.length?a.indexOf(b,0):-1;for(var c=0;c<a.length;c++)if(c in a&&a[c]===b)return c;return-1},kb=Array.prototype.forEach?function(a,b,c){Array.prototype.forEach.call(a,b,c)}:function(a,b,c){for(var d=a.length,e=ia(a)?a.split(""):a,f=0;f<d;f++)f in e&&b.call(c,e[f],f,a)};
function mb(a){a:{var b=nb;for(var c=a.length,d=ia(a)?a.split(""):a,e=0;e<c;e++)if(e in d&&b.call(void 0,d[e],e,a)){b=e;break a}b=-1}return 0>b?null:ia(a)?a.charAt(b):a[b]}function ob(a){var b=a.length;if(0<b){for(var c=Array(b),d=0;d<b;d++)c[d]=a[d];return c}return[]};function pb(a){if(a.getValues&&"function"==typeof a.getValues)return a.getValues();if(ia(a))return a.split("");if(na(a)){for(var b=[],c=a.length,d=0;d<c;d++)b.push(a[d]);return b}b=[];c=0;for(d in a)b[c++]=a[d];return b}
function qb(a,b){if(a.forEach&&"function"==typeof a.forEach)a.forEach(b,void 0);else if(na(a)||ia(a))kb(a,b,void 0);else{if(a.Ub&&"function"==typeof a.Ub)var c=a.Ub();else if(a.getValues&&"function"==typeof a.getValues)c=void 0;else if(na(a)||ia(a)){c=[];for(var d=a.length,e=0;e<d;e++)c.push(e)}else c=gb(a);d=pb(a);e=d.length;for(var f=0;f<e;f++)b.call(void 0,d[f],c&&c[f],a)}};function rb(a,b){this.dc={};this.fb=[];this.bc=0;var c=arguments.length;if(1<c){if(c%2)throw Error("Uneven number of arguments");for(var d=0;d<c;d+=2)this.set(arguments[d],arguments[d+1])}else a&&this.addAll(a)}g=rb.prototype;g.getCount=function(){return this.bc};g.getValues=function(){sb(this);for(var a=[],b=0;b<this.fb.length;b++)a.push(this.dc[this.fb[b]]);return a};g.Ub=function(){sb(this);return this.fb.concat()};
g.Kb=function(a){if(this===a)return!0;if(this.bc!=a.getCount())return!1;var b=tb;sb(this);for(var c,d=0;c=this.fb[d];d++)if(!b(this.get(c),a.get(c)))return!1;return!0};function tb(a,b){return a===b}g.Id=function(){return 0==this.bc};g.clear=function(){this.dc={};this.bc=this.fb.length=0};g.remove=function(a){return Object.prototype.hasOwnProperty.call(this.dc,a)?(delete this.dc[a],this.bc--,this.fb.length>2*this.bc&&sb(this),!0):!1};
function sb(a){if(a.bc!=a.fb.length){for(var b=0,c=0;b<a.fb.length;){var d=a.fb[b];Object.prototype.hasOwnProperty.call(a.dc,d)&&(a.fb[c++]=d);b++}a.fb.length=c}if(a.bc!=a.fb.length){var e={};for(c=b=0;b<a.fb.length;)d=a.fb[b],Object.prototype.hasOwnProperty.call(e,d)||(a.fb[c++]=d,e[d]=1),b++;a.fb.length=c}}g.get=function(a,b){return Object.prototype.hasOwnProperty.call(this.dc,a)?this.dc[a]:b};
g.set=function(a,b){Object.prototype.hasOwnProperty.call(this.dc,a)||(this.bc++,this.fb.push(a));this.dc[a]=b};g.addAll=function(a){if(a instanceof rb)for(var b=a.Ub(),c=0;c<b.length;c++)this.set(b[c],a.get(b[c]));else for(b in a)this.set(b,a[b])};g.forEach=function(a,b){for(var c=this.Ub(),d=0;d<c.length;d++){var e=c[d],f=this.get(e);a.call(b,f,e,this)}};g.clone=function(){return new rb(this)};var ub=/^(?:([^:/?#.]+):)?(?:\/\/(?:([^/?#]*)@)?([^/#?]*?)(?::([0-9]+))?(?=[/#?]|$))?([^?#]+)?(?:\?([^#]*))?(?:#([\s\S]*))?$/;function vb(a,b){null!=a&&this.append.apply(this,arguments)}g=vb.prototype;g.jc="";g.set=function(a){this.jc=""+a};g.append=function(a,b,c){this.jc+=String(a);if(null!=b)for(var d=1;d<arguments.length;d++)this.jc+=arguments[d];return this};g.clear=function(){this.jc=""};g.getLength=function(){return this.jc.length};g.toString=function(){return this.jc};var wb={},xb={},yb;if("undefined"===typeof wb||"undefined"===typeof xb||"undefined"===typeof w)var w={};if("undefined"===typeof wb||"undefined"===typeof xb||"undefined"===typeof zb)var zb=null;if("undefined"===typeof wb||"undefined"===typeof xb||"undefined"===typeof Ab)var Ab=null;var Bb=!0,Cb=null;if("undefined"===typeof wb||"undefined"===typeof xb||"undefined"===typeof Db)var Db=null;function Eb(){return new Fb(null,5,[Gb,!0,Hb,!0,Ib,!1,Jb,!1,Kb,null],null)}
function Lb(){Bb=!1;zb=function(){return console.log.apply(console,ob(arguments))};Ab=function(){return console.error.apply(console,ob(arguments))}}function B(a){return null!=a&&!1!==a}function Mb(a){return null==a}function Nb(a){return Array.isArray(a)}function Ob(a){return null==a?!0:!1===a?!0:!1}function Qb(a,b){return a[la(null==b?null:b)]?!0:a._?!0:!1}function Rb(a){return null==a?null:a.constructor}
function Sb(a,b){var c=Rb(b);c=B(B(c)?c.qb:c)?c.ib:la(b);return Error(["No protocol method ",a," defined for type ",c,": ",b].join(""))}function Tb(a){var b=a.ib;return B(b)?b:I.a(a)}var Ub="undefined"!==typeof Symbol&&"function"===la(Symbol)?Symbol.iterator:"@@iterator";function Vb(a){for(var b=a.length,c=Array(b),d=0;;)if(d<b)c[d]=a[d],d+=1;else break;return c}function Wb(a){function b(d,e){d.push(e);return d}var c=[];return Xb?Xb(b,c,a):Yb.call(null,b,c,a)}function Zb(){}function $b(){}
var ac=function ac(a){if(null!=a&&null!=a.Ga)return a.Ga(a);var c=ac[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=ac._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("ICloneable.-clone",a);};function bc(){}var cc=function cc(a){if(null!=a&&null!=a.Z)return a.Z(a);var c=cc[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=cc._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("ICounted.-count",a);};function dc(){}
var ec=function ec(a){if(null!=a&&null!=a.ia)return a.ia(a);var c=ec[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=ec._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("IEmptyableCollection.-empty",a);};function fc(){}var gc=function gc(a,b){if(null!=a&&null!=a.ea)return a.ea(a,b);var d=gc[la(null==a?null:a)];if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);d=gc._;if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);throw Sb("ICollection.-conj",a);};function hc(){}
var ic=function ic(a){switch(arguments.length){case 2:return ic.g(arguments[0],arguments[1]);case 3:return ic.h(arguments[0],arguments[1],arguments[2]);default:throw Error(["Invalid arity: ",I.a(arguments.length)].join(""));}};ic.g=function(a,b){if(null!=a&&null!=a.P)return a.P(a,b);var c=ic[la(null==a?null:a)];if(null!=c)return c.g?c.g(a,b):c.call(null,a,b);c=ic._;if(null!=c)return c.g?c.g(a,b):c.call(null,a,b);throw Sb("IIndexed.-nth",a);};
ic.h=function(a,b,c){if(null!=a&&null!=a.ha)return a.ha(a,b,c);var d=ic[la(null==a?null:a)];if(null!=d)return d.h?d.h(a,b,c):d.call(null,a,b,c);d=ic._;if(null!=d)return d.h?d.h(a,b,c):d.call(null,a,b,c);throw Sb("IIndexed.-nth",a);};ic.O=3;function jc(){}
var kc=function kc(a){if(null!=a&&null!=a.Ha)return a.Ha(a);var c=kc[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=kc._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("ISeq.-first",a);},lc=function lc(a){if(null!=a&&null!=a.La)return a.La(a);var c=lc[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=lc._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("ISeq.-rest",a);};function mc(){}
var nc=function nc(a){if(null!=a&&null!=a.Ba)return a.Ba(a);var c=nc[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=nc._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("INext.-next",a);};function oc(){}var pc=function pc(a){switch(arguments.length){case 2:return pc.g(arguments[0],arguments[1]);case 3:return pc.h(arguments[0],arguments[1],arguments[2]);default:throw Error(["Invalid arity: ",I.a(arguments.length)].join(""));}};
pc.g=function(a,b){if(null!=a&&null!=a.V)return a.V(a,b);var c=pc[la(null==a?null:a)];if(null!=c)return c.g?c.g(a,b):c.call(null,a,b);c=pc._;if(null!=c)return c.g?c.g(a,b):c.call(null,a,b);throw Sb("ILookup.-lookup",a);};pc.h=function(a,b,c){if(null!=a&&null!=a.K)return a.K(a,b,c);var d=pc[la(null==a?null:a)];if(null!=d)return d.h?d.h(a,b,c):d.call(null,a,b,c);d=pc._;if(null!=d)return d.h?d.h(a,b,c):d.call(null,a,b,c);throw Sb("ILookup.-lookup",a);};pc.O=3;function qc(){}
var rc=function rc(a,b){if(null!=a&&null!=a.Yb)return a.Yb(a,b);var d=rc[la(null==a?null:a)];if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);d=rc._;if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);throw Sb("IAssociative.-contains-key?",a);},sc=function sc(a,b,c){if(null!=a&&null!=a.Aa)return a.Aa(a,b,c);var e=sc[la(null==a?null:a)];if(null!=e)return e.h?e.h(a,b,c):e.call(null,a,b,c);e=sc._;if(null!=e)return e.h?e.h(a,b,c):e.call(null,a,b,c);throw Sb("IAssociative.-assoc",a);};function tc(){}
var uc=function uc(a,b){if(null!=a&&null!=a.Zb)return a.Zb(a,b);var d=uc[la(null==a?null:a)];if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);d=uc._;if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);throw Sb("IFind.-find",a);};function vc(){}
var wc=function wc(a,b){if(null!=a&&null!=a.Tb)return a.Tb(a,b);var d=wc[la(null==a?null:a)];if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);d=wc._;if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);throw Sb("IMap.-dissoc",a);},xc=function xc(a){if(null!=a&&null!=a.he)return a.key;var c=xc[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=xc._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("IMapEntry.-key",a);},yc=function yc(a){if(null!=a&&null!=a.ie)return a.s;var c=yc[la(null==
a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=yc._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("IMapEntry.-val",a);};function zc(){}var Ac=function Ac(a){if(null!=a&&null!=a.$b)return a.$b(a);var c=Ac[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=Ac._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("IStack.-peek",a);};function Bc(){}
var Cc=function Cc(a,b,c){if(null!=a&&null!=a.Gb)return a.Gb(a,b,c);var e=Cc[la(null==a?null:a)];if(null!=e)return e.h?e.h(a,b,c):e.call(null,a,b,c);e=Cc._;if(null!=e)return e.h?e.h(a,b,c):e.call(null,a,b,c);throw Sb("IVector.-assoc-n",a);},Dc=function Dc(a){if(null!=a&&null!=a.Xc)return a.Xc(a);var c=Dc[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=Dc._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("IDeref.-deref",a);};function Ec(){}
var Fc=function Fc(a){if(null!=a&&null!=a.S)return a.S(a);var c=Fc[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=Fc._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("IMeta.-meta",a);},Gc=function Gc(a,b){if(null!=a&&null!=a.U)return a.U(a,b);var d=Gc[la(null==a?null:a)];if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);d=Gc._;if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);throw Sb("IWithMeta.-with-meta",a);};function Hc(){}
var Ic=function Ic(a){switch(arguments.length){case 2:return Ic.g(arguments[0],arguments[1]);case 3:return Ic.h(arguments[0],arguments[1],arguments[2]);default:throw Error(["Invalid arity: ",I.a(arguments.length)].join(""));}};Ic.g=function(a,b){if(null!=a&&null!=a.Ca)return a.Ca(a,b);var c=Ic[la(null==a?null:a)];if(null!=c)return c.g?c.g(a,b):c.call(null,a,b);c=Ic._;if(null!=c)return c.g?c.g(a,b):c.call(null,a,b);throw Sb("IReduce.-reduce",a);};
Ic.h=function(a,b,c){if(null!=a&&null!=a.Da)return a.Da(a,b,c);var d=Ic[la(null==a?null:a)];if(null!=d)return d.h?d.h(a,b,c):d.call(null,a,b,c);d=Ic._;if(null!=d)return d.h?d.h(a,b,c):d.call(null,a,b,c);throw Sb("IReduce.-reduce",a);};Ic.O=3;function Jc(){}
var Kc=function Kc(a,b,c){if(null!=a&&null!=a.yb)return a.yb(a,b,c);var e=Kc[la(null==a?null:a)];if(null!=e)return e.h?e.h(a,b,c):e.call(null,a,b,c);e=Kc._;if(null!=e)return e.h?e.h(a,b,c):e.call(null,a,b,c);throw Sb("IKVReduce.-kv-reduce",a);},Lc=function Lc(a,b){if(null!=a&&null!=a.H)return a.H(a,b);var d=Lc[la(null==a?null:a)];if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);d=Lc._;if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);throw Sb("IEquiv.-equiv",a);},Mc=function Mc(a){if(null!=a&&null!=
a.Y)return a.Y(a);var c=Mc[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=Mc._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("IHash.-hash",a);};function Nc(){}var Oc=function Oc(a){if(null!=a&&null!=a.aa)return a.aa(a);var c=Oc[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=Oc._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("ISeqable.-seq",a);};function Pc(){}function Qc(){}function Rc(){}function Sc(){}
var Tc=function Tc(a){if(null!=a&&null!=a.Fb)return a.Fb(a);var c=Tc[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=Tc._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("IReversible.-rseq",a);},Uc=function Uc(a,b){if(null!=a&&null!=a.Ue)return a.Ue(a,b);var d=Uc[la(null==a?null:a)];if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);d=Uc._;if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);throw Sb("IWriter.-write",a);};function Vc(){}
var Wc=function Wc(a,b,c){if(null!=a&&null!=a.W)return a.W(a,b,c);var e=Wc[la(null==a?null:a)];if(null!=e)return e.h?e.h(a,b,c):e.call(null,a,b,c);e=Wc._;if(null!=e)return e.h?e.h(a,b,c):e.call(null,a,b,c);throw Sb("IPrintWithWriter.-pr-writer",a);};function Xc(){}
var Yc=function Yc(a){if(null!=a&&null!=a.Gc)return a.Gc(a);var c=Yc[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=Yc._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("IEditableCollection.-as-transient",a);},Zc=function Zc(a,b){if(null!=a&&null!=a.Ic)return a.Ic(a,b);var d=Zc[la(null==a?null:a)];if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);d=Zc._;if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);throw Sb("ITransientCollection.-conj!",a);},$c=function $c(a){if(null!=a&&null!=
a.ad)return a.ad(a);var c=$c[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=$c._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("ITransientCollection.-persistent!",a);},ad=function ad(a,b,c){if(null!=a&&null!=a.Hc)return a.Hc(a,b,c);var e=ad[la(null==a?null:a)];if(null!=e)return e.h?e.h(a,b,c):e.call(null,a,b,c);e=ad._;if(null!=e)return e.h?e.h(a,b,c):e.call(null,a,b,c);throw Sb("ITransientAssociative.-assoc!",a);},bd=function bd(a){if(null!=a&&null!=a.de)return a.de(a);var c=
bd[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=bd._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("IChunk.-drop-first",a);},cd=function cd(a){if(null!=a&&null!=a.xd)return a.xd(a);var c=cd[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=cd._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("IChunkedSeq.-chunked-first",a);},dd=function dd(a){if(null!=a&&null!=a.Fc)return a.Fc(a);var c=dd[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,
a);c=dd._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("IChunkedSeq.-chunked-rest",a);},ed=function ed(a){if(null!=a&&null!=a.yd)return a.yd(a);var c=ed[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=ed._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("INamed.-name",a);},fd=function fd(a){if(null!=a&&null!=a.zd)return a.zd(a);var c=fd[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=fd._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("INamed.-namespace",
a);},gd=function gd(a,b){if(null!=a&&null!=a.yf)return a.yf(a,b);var d=gd[la(null==a?null:a)];if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);d=gd._;if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);throw Sb("IReset.-reset!",a);},hd=function hd(a){switch(arguments.length){case 2:return hd.g(arguments[0],arguments[1]);case 3:return hd.h(arguments[0],arguments[1],arguments[2]);case 4:return hd.J(arguments[0],arguments[1],arguments[2],arguments[3]);case 5:return hd.ca(arguments[0],arguments[1],arguments[2],
arguments[3],arguments[4]);default:throw Error(["Invalid arity: ",I.a(arguments.length)].join(""));}};hd.g=function(a,b){if(null!=a&&null!=a.zf)return a.zf(a,b);var c=hd[la(null==a?null:a)];if(null!=c)return c.g?c.g(a,b):c.call(null,a,b);c=hd._;if(null!=c)return c.g?c.g(a,b):c.call(null,a,b);throw Sb("ISwap.-swap!",a);};
hd.h=function(a,b,c){if(null!=a&&null!=a.Af)return a.Af(a,b,c);var d=hd[la(null==a?null:a)];if(null!=d)return d.h?d.h(a,b,c):d.call(null,a,b,c);d=hd._;if(null!=d)return d.h?d.h(a,b,c):d.call(null,a,b,c);throw Sb("ISwap.-swap!",a);};hd.J=function(a,b,c,d){if(null!=a&&null!=a.Bf)return a.Bf(a,b,c,d);var e=hd[la(null==a?null:a)];if(null!=e)return e.J?e.J(a,b,c,d):e.call(null,a,b,c,d);e=hd._;if(null!=e)return e.J?e.J(a,b,c,d):e.call(null,a,b,c,d);throw Sb("ISwap.-swap!",a);};
hd.ca=function(a,b,c,d,e){if(null!=a&&null!=a.Cf)return a.Cf(a,b,c,d,e);var f=hd[la(null==a?null:a)];if(null!=f)return f.ca?f.ca(a,b,c,d,e):f.call(null,a,b,c,d,e);f=hd._;if(null!=f)return f.ca?f.ca(a,b,c,d,e):f.call(null,a,b,c,d,e);throw Sb("ISwap.-swap!",a);};hd.O=5;var id=function id(a,b){if(null!=a&&null!=a.Te)return a.Te(a,b);var d=id[la(null==a?null:a)];if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);d=id._;if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);throw Sb("IVolatile.-vreset!",a);};
function jd(){}var kd=function kd(a){if(null!=a&&null!=a.Ka)return a.Ka(a);var c=kd[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=kd._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("IIterable.-iterator",a);};function ld(a){this.bg=a;this.l=1073741824;this.I=0}ld.prototype.Ue=function(a,b){return this.bg.append(b)};function md(a){var b=new vb;a.W(null,new ld(b),Eb());return I.a(b)}
var nd="undefined"!==typeof Math&&"undefined"!==typeof Math.imul&&0!==Math.imul(4294967295,5)?function(a,b){return Math.imul(a,b)}:function(a,b){var c=a&65535,d=b&65535;return c*d+((a>>>16&65535)*d+c*(b>>>16&65535)<<16>>>0)|0};function od(a){a=nd(a|0,-862048943);return nd(a<<15|a>>>-15,461845907)}function pd(a,b){a=(a|0)^(b|0);return nd(a<<13|a>>>-13,5)+-430675100|0}function qd(a,b){a=(a|0)^b;a=nd(a^a>>>16,-2048144789);a=nd(a^a>>>13,-1028477387);return a^a>>>16}
function rd(a){a:{var b=1;for(var c=0;;)if(b<a.length)c=pd(c,od(a.charCodeAt(b-1)|a.charCodeAt(b)<<16)),b+=2;else{b=c;break a}}return qd(1===(a.length&1)?b^od(a.charCodeAt(a.length-1)):b,nd(2,a.length))}var sd={},td=0;function ud(a){255<td&&(sd={},td=0);if(null==a)return 0;var b=sd[a];if("number"===typeof b)a=b;else{a:if(null!=a)if(b=a.length,0<b)for(var c=0,d=0;;)if(c<b)d=nd(31,d)+a.charCodeAt(c),c+=1;else{b=d;break a}else b=0;else b=0;sd[a]=b;td+=1;a=b}return a}
function vd(a){if(null!=a&&(a.l&4194304||w===a.ge))return Mc(a)^0;if("number"===typeof a){if(B(isFinite(a)))return Math.floor(a)%2147483647;switch(a){case Infinity:return 2146435072;case -Infinity:return-1048576;default:return 2146959360}}else return!0===a?a=1231:!1===a?a=1237:"string"===typeof a?(a=ud(a),a=0===a?a:qd(pd(0,od(a)),4)):a=a instanceof Date?a.valueOf()^0:null==a?0:Mc(a)^0,a}function wd(a,b){return a^b+2654435769+(a<<6)+(a>>2)}
function xd(a,b,c,d,e){this.Mc=a;this.name=b;this.nb=c;this.Bc=d;this.Sb=e;this.l=2154168321;this.I=4096}g=xd.prototype;g.toString=function(){return this.nb};g.equiv=function(a){return this.H(null,a)};g.H=function(a,b){return b instanceof xd?this.nb===b.nb:!1};
g.call=function(){function a(d,e,f){return J.h?J.h(e,this,f):J.call(null,e,this,f)}function b(d,e){return J.g?J.g(e,this):J.call(null,e,this)}var c=null;c=function(d,e,f){switch(arguments.length){case 2:return b.call(this,d,e);case 3:return a.call(this,d,e,f)}throw Error("Invalid arity: "+(arguments.length-1));};c.g=b;c.h=a;return c}();g.apply=function(a,b){return this.call.apply(this,[this].concat(Vb(b)))};g.a=function(a){return J.g?J.g(a,this):J.call(null,a,this)};
g.g=function(a,b){return J.h?J.h(a,this,b):J.call(null,a,this,b)};g.S=function(){return this.Sb};g.U=function(a,b){return new xd(this.Mc,this.name,this.nb,this.Bc,b)};g.Y=function(){var a=this.Bc;return null!=a?a:this.Bc=a=wd(rd(this.name),ud(this.Mc))};g.yd=function(){return this.name};g.zd=function(){return this.Mc};g.W=function(a,b){return Uc(b,this.nb)};
var yd=function yd(a){switch(arguments.length){case 1:return yd.a(arguments[0]);case 2:return yd.g(arguments[0],arguments[1]);default:throw Error(["Invalid arity: ",I.a(arguments.length)].join(""));}};yd.a=function(a){for(;;){if(a instanceof xd)return a;if("string"===typeof a){var b=a.indexOf("/");return 1>b?yd.g(null,a):yd.g(a.substring(0,b),a.substring(b+1,a.length))}if(a instanceof K)a=a.cb;else throw Error("no conversion to symbol");}};
yd.g=function(a,b){var c=null!=a?[I.a(a),"/",I.a(b)].join(""):b;return new xd(a,b,c,null,null)};yd.O=2;function zd(a){return null!=a?a.I&131072||w===a.kg?!0:a.I?!1:Qb(jd,a):Qb(jd,a)}function M(a){if(null==a)return null;if(null!=a&&(a.l&8388608||w===a.Re))return Oc(a);if(Nb(a)||"string"===typeof a)return 0===a.length?null:new Ad(a,0,null);if(Qb(Nc,a))return Oc(a);throw Error([I.a(a)," is not ISeqable"].join(""));}
function N(a){if(null==a)return null;if(null!=a&&(a.l&64||w===a.T))return kc(a);a=M(a);return null==a?null:kc(a)}function Bd(a){return null!=a?null!=a&&(a.l&64||w===a.T)?lc(a):(a=M(a))?a.La(null):Cd:Cd}function O(a){return null==a?null:null!=a&&(a.l&128||w===a.$c)?nc(a):M(Bd(a))}
var Dd=function Dd(a){switch(arguments.length){case 1:return Dd.a(arguments[0]);case 2:return Dd.g(arguments[0],arguments[1]);default:for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return Dd.A(arguments[0],arguments[1],new Ad(c.slice(2),0,null))}};Dd.a=function(){return!0};Dd.g=function(a,b){return null==a?null==b:a===b||Lc(a,b)};Dd.A=function(a,b,c){for(;;)if(Dd.g(a,b))if(O(c))a=b,b=N(c),c=O(c);else return Dd.g(b,N(c));else return!1};
Dd.R=function(a){var b=N(a),c=O(a);a=N(c);c=O(c);return this.A(b,a,c)};Dd.O=2;function Ed(a){this.X=a}Ed.prototype.next=function(){if(null!=this.X){var a=N(this.X);this.X=O(this.X);return{value:a,done:!1}}return{value:null,done:!0}};function Fd(a){return new Ed(M(a))}function Gd(a){var b=0,c=1;for(a=M(a);;)if(null!=a)b+=1,c=nd(31,c)+vd(N(a))|0,a=O(a);else return qd(pd(0,od(c)),b)}var Hd=qd(pd(0,od(1)),0);
function Id(a){var b=0,c=0;for(a=M(a);;)if(null!=a)b+=1,c=c+vd(N(a))|0,a=O(a);else return qd(pd(0,od(c)),b)}var Jd=qd(pd(0,od(0)),0);bc["null"]=!0;cc["null"]=function(){return 0};Date.prototype.H=function(a,b){return b instanceof Date&&this.valueOf()===b.valueOf()};Lc.number=function(a,b){return a===b};Zb["function"]=!0;Ec["function"]=!0;Fc["function"]=function(){return null};Mc._=function(a){return qa(a)};function Kd(a){this.s=a;this.l=32768;this.I=0}Kd.prototype.Xc=function(){return this.s};
function Ld(a){return new Kd(a)}function Md(a){return a instanceof Kd}function Nd(a){return Md(a)?Od.a?Od.a(a):Od.call(null,a):a}function Od(a){return Dc(a)}function Pd(a,b){var c=cc(a);if(0===c)return b.o?b.o():b.call(null);for(var d=ic.g(a,0),e=1;;)if(e<c){var f=ic.g(a,e);d=b.g?b.g(d,f):b.call(null,d,f);if(Md(d))return Dc(d);e+=1}else return d}function Qd(a,b,c){var d=cc(a),e=c;for(c=0;;)if(c<d){var f=ic.g(a,c);e=b.g?b.g(e,f):b.call(null,e,f);if(Md(e))return Dc(e);c+=1}else return e}
function Rd(a,b){var c=a.length;if(0===a.length)return b.o?b.o():b.call(null);for(var d=a[0],e=1;;)if(e<c){var f=a[e];d=b.g?b.g(d,f):b.call(null,d,f);if(Md(d))return Dc(d);e+=1}else return d}function Sd(a,b,c){var d=a.length,e=c;for(c=0;;)if(c<d){var f=a[c];e=b.g?b.g(e,f):b.call(null,e,f);if(Md(e))return Dc(e);c+=1}else return e}function Td(a,b,c,d){for(var e=a.length;;)if(d<e){var f=a[d];c=b.g?b.g(c,f):b.call(null,c,f);if(Md(c))return Dc(c);d+=1}else return c}
function Ud(a){return null!=a?a.l&2||w===a.qf?!0:a.l?!1:Qb(bc,a):Qb(bc,a)}function Vd(a){return null!=a?a.l&16||w===a.Pe?!0:a.l?!1:Qb(hc,a):Qb(hc,a)}function Wd(a,b,c){var d=Q.a?Q.a(a):Q.call(null,a);if(c>=d)return-1;!(0<c)&&0>c&&(c+=d,c=0>c?0:c);for(;;)if(c<d){if(Dd.g(Xd?Xd(a,c):Yd.call(null,a,c),b))return c;c+=1}else return-1}
function Zd(a,b,c){var d=Q.a?Q.a(a):Q.call(null,a);if(0===d)return-1;0<c?(--d,c=d<c?d:c):c=0>c?d+c:c;for(;;)if(0<=c){if(Dd.g(Xd?Xd(a,c):Yd.call(null,a,c),b))return c;--c}else return-1}function $d(a,b){this.j=a;this.F=b}$d.prototype.ka=function(){return this.F<this.j.length};$d.prototype.next=function(){var a=this.j[this.F];this.F+=1;return a};function Ad(a,b,c){this.j=a;this.F=b;this.B=c;this.l=166592766;this.I=139264}g=Ad.prototype;g.toString=function(){return md(this)};
g.equiv=function(a){return this.H(null,a)};g.indexOf=function(){var a=null;a=function(b,c){switch(arguments.length){case 1:return Wd(this,b,0);case 2:return Wd(this,b,c)}throw Error("Invalid arity: "+arguments.length);};a.a=function(b){return Wd(this,b,0)};a.g=function(b,c){return Wd(this,b,c)};return a}();
g.lastIndexOf=function(){function a(c){return Zd(this,c,Q.a?Q.a(this):Q.call(null,this))}var b=null;b=function(c,d){switch(arguments.length){case 1:return a.call(this,c);case 2:return Zd(this,c,d)}throw Error("Invalid arity: "+arguments.length);};b.a=a;b.g=function(c,d){return Zd(this,c,d)};return b}();g.P=function(a,b){a=b+this.F;if(0<=a&&a<this.j.length)return this.j[a];throw Error("Index out of bounds");};g.ha=function(a,b,c){a=b+this.F;return 0<=a&&a<this.j.length?this.j[a]:c};
g.Ka=function(){return new $d(this.j,this.F)};g.S=function(){return this.B};g.Ga=function(){return new Ad(this.j,this.F,this.B)};g.Ba=function(){return this.F+1<this.j.length?new Ad(this.j,this.F+1,null):null};g.Z=function(){var a=this.j.length-this.F;return 0>a?0:a};g.Fb=function(){var a=this.Z(null);return 0<a?new ae(this,a-1,null):null};g.Y=function(){return Gd(this)};g.H=function(a,b){return be.g?be.g(this,b):be.call(null,this,b)};g.ia=function(){return Cd};
g.Ca=function(a,b){return Td(this.j,b,this.j[this.F],this.F+1)};g.Da=function(a,b,c){return Td(this.j,b,c,this.F)};g.Ha=function(){return this.j[this.F]};g.La=function(){return this.F+1<this.j.length?new Ad(this.j,this.F+1,null):Cd};g.aa=function(){return this.F<this.j.length?this:null};g.U=function(a,b){return b===this.B?this:new Ad(this.j,this.F,b)};g.ea=function(a,b){return ce.g?ce.g(b,this):ce.call(null,b,this)};Ad.prototype[Ub]=function(){return Fd(this)};
function R(a){return 0<a.length?new Ad(a,0,null):null}function ae(a,b,c){this.Wc=a;this.F=b;this.B=c;this.l=32374990;this.I=8192}g=ae.prototype;g.toString=function(){return md(this)};g.equiv=function(a){return this.H(null,a)};g.indexOf=function(){var a=null;a=function(b,c){switch(arguments.length){case 1:return Wd(this,b,0);case 2:return Wd(this,b,c)}throw Error("Invalid arity: "+arguments.length);};a.a=function(b){return Wd(this,b,0)};a.g=function(b,c){return Wd(this,b,c)};return a}();
g.lastIndexOf=function(){function a(c){return Zd(this,c,Q.a?Q.a(this):Q.call(null,this))}var b=null;b=function(c,d){switch(arguments.length){case 1:return a.call(this,c);case 2:return Zd(this,c,d)}throw Error("Invalid arity: "+arguments.length);};b.a=a;b.g=function(c,d){return Zd(this,c,d)};return b}();g.S=function(){return this.B};g.Ga=function(){return new ae(this.Wc,this.F,this.B)};g.Ba=function(){return 0<this.F?new ae(this.Wc,this.F-1,null):null};g.Z=function(){return this.F+1};g.Y=function(){return Gd(this)};
g.H=function(a,b){return be.g?be.g(this,b):be.call(null,this,b)};g.ia=function(){return Cd};g.Ca=function(a,b){return ee?ee(b,this):fe.call(null,b,this)};g.Da=function(a,b,c){return ge?ge(b,c,this):fe.call(null,b,c,this)};g.Ha=function(){return ic.g(this.Wc,this.F)};g.La=function(){return 0<this.F?new ae(this.Wc,this.F-1,null):Cd};g.aa=function(){return this};g.U=function(a,b){return b===this.B?this:new ae(this.Wc,this.F,b)};g.ea=function(a,b){return ce.g?ce.g(b,this):ce.call(null,b,this)};
ae.prototype[Ub]=function(){return Fd(this)};function he(a){for(;;){var b=O(a);if(null!=b)a=b;else return N(a)}}Lc._=function(a,b){return a===b};var ie=function ie(a){switch(arguments.length){case 0:return ie.o();case 1:return ie.a(arguments[0]);case 2:return ie.g(arguments[0],arguments[1]);default:for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return ie.A(arguments[0],arguments[1],new Ad(c.slice(2),0,null))}};ie.o=function(){return je};ie.a=function(a){return a};
ie.g=function(a,b){return null!=a?gc(a,b):new ke(null,b,null,1,null)};ie.A=function(a,b,c){for(;;)if(B(c))a=ie.g(a,b),b=N(c),c=O(c);else return ie.g(a,b)};ie.R=function(a){var b=N(a),c=O(a);a=N(c);c=O(c);return this.A(b,a,c)};ie.O=2;function le(a){return null==a?null:null!=a&&(a.l&4||w===a.rf)?ec(a):(null!=a?a.l&4||w===a.rf||(a.l?0:Qb(dc,a)):Qb(dc,a))?ec(a):null}
function Q(a){if(null!=a)if(null!=a&&(a.l&2||w===a.qf))a=cc(a);else if(Nb(a))a=a.length;else if("string"===typeof a)a=a.length;else if(null!=a&&(a.l&8388608||w===a.Re))a:{a=M(a);for(var b=0;;){if(Ud(a)){a=b+cc(a);break a}a=O(a);b+=1}}else a=cc(a);else a=0;return a}function me(a,b,c){for(;;){if(null==a)return c;if(0===b)return M(a)?N(a):c;if(Vd(a))return ic.h(a,b,c);if(M(a))a=O(a),--b;else return c}}
function Yd(a){switch(arguments.length){case 2:return Xd(arguments[0],arguments[1]);case 3:return S(arguments[0],arguments[1],arguments[2]);default:throw Error(["Invalid arity: ",I.a(arguments.length)].join(""));}}
function Xd(a,b){if("number"!==typeof b)throw Error("Index argument to nth must be a number");if(null==a)return a;if(null!=a&&(a.l&16||w===a.Pe))return ic.g(a,b);if(Nb(a)){if(-1<b&&b<a.length)return a[b|0];throw Error("Index out of bounds");}if("string"===typeof a){if(-1<b&&b<a.length)return a.charAt(b|0);throw Error("Index out of bounds");}if(null!=a&&(a.l&64||w===a.T)||null!=a&&(a.l&16777216||w===a.Se)){if(0>b)throw Error("Index out of bounds");a:for(;;){if(null==a)throw Error("Index out of bounds");
if(0===b){if(M(a)){a=N(a);break a}throw Error("Index out of bounds");}if(Vd(a)){a=ic.g(a,b);break a}if(M(a))a=O(a),--b;else throw Error("Index out of bounds");}return a}if(Qb(hc,a))return ic.g(a,b);throw Error(["nth not supported on this type ",I.a(Tb(Rb(a)))].join(""));}
function S(a,b,c){if("number"!==typeof b)throw Error("Index argument to nth must be a number.");if(null==a)return c;if(null!=a&&(a.l&16||w===a.Pe))return ic.h(a,b,c);if(Nb(a))return-1<b&&b<a.length?a[b|0]:c;if("string"===typeof a)return-1<b&&b<a.length?a.charAt(b|0):c;if(null!=a&&(a.l&64||w===a.T)||null!=a&&(a.l&16777216||w===a.Se))return 0>b?c:me(a,b,c);if(Qb(hc,a))return ic.h(a,b,c);throw Error(["nth not supported on this type ",I.a(Tb(Rb(a)))].join(""));}
var J=function J(a){switch(arguments.length){case 2:return J.g(arguments[0],arguments[1]);case 3:return J.h(arguments[0],arguments[1],arguments[2]);default:throw Error(["Invalid arity: ",I.a(arguments.length)].join(""));}};J.g=function(a,b){return null==a?null:null!=a&&(a.l&256||w===a.Zc)?pc.g(a,b):Nb(a)?null!=b&&b<a.length?a[b|0]:null:"string"===typeof a?null!=b&&b<a.length?a.charAt(b|0):null:Qb(oc,a)?pc.g(a,b):null};
J.h=function(a,b,c){return null!=a?null!=a&&(a.l&256||w===a.Zc)?pc.h(a,b,c):Nb(a)?null!=b&&-1<b&&b<a.length?a[b|0]:c:"string"===typeof a?null!=b&&-1<b&&b<a.length?a.charAt(b|0):c:Qb(oc,a)?pc.h(a,b,c):c:c};J.O=3;var ne=function ne(a){switch(arguments.length){case 3:return ne.h(arguments[0],arguments[1],arguments[2]);default:for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return ne.A(arguments[0],arguments[1],arguments[2],new Ad(c.slice(3),0,null))}};
ne.h=function(a,b,c){return null!=a?sc(a,b,c):oe([b,c])};ne.A=function(a,b,c,d){for(;;)if(a=ne.h(a,b,c),B(d))b=N(d),c=N(O(d)),d=O(O(d));else return a};ne.R=function(a){var b=N(a),c=O(a);a=N(c);var d=O(c);c=N(d);d=O(d);return this.A(b,a,c,d)};ne.O=3;
var pe=function pe(a){switch(arguments.length){case 1:return pe.a(arguments[0]);case 2:return pe.g(arguments[0],arguments[1]);default:for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return pe.A(arguments[0],arguments[1],new Ad(c.slice(2),0,null))}};pe.a=function(a){return a};pe.g=function(a,b){return null==a?null:wc(a,b)};pe.A=function(a,b,c){for(;;){if(null==a)return null;a=pe.g(a,b);if(B(c))b=N(c),c=O(c);else return a}};
pe.R=function(a){var b=N(a),c=O(a);a=N(c);c=O(c);return this.A(b,a,c)};pe.O=2;function qe(a){var b=oa(a);return b?b:null!=a?w===a.pf?!0:a.Bd?!1:Qb(Zb,a):Qb(Zb,a)}function re(a,b){this.v=a;this.B=b;this.l=393217;this.I=0}g=re.prototype;g.S=function(){return this.B};g.U=function(a,b){return new re(this.v,b)};g.pf=w;
g.call=function(){function a(u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da,lb,Pb){u=this;return se.Yc?se.Yc(u.v,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da,lb,Pb):se.call(null,u.v,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da,lb,Pb)}function b(u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da,lb){u=this;return u.v.Za?u.v.Za(y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da,lb):u.v.call(null,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da,lb)}function c(u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da){u=
this;return u.v.Ya?u.v.Ya(y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da):u.v.call(null,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da)}function d(u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha){u=this;return u.v.Xa?u.v.Xa(y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha):u.v.call(null,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha)}function e(u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za){u=this;return u.v.Wa?u.v.Wa(y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za):u.v.call(null,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za)}function f(u,
y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta){u=this;return u.v.Va?u.v.Va(y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta):u.v.call(null,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta)}function h(u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja){u=this;return u.v.Ua?u.v.Ua(y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja):u.v.call(null,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja)}function k(u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha){u=this;return u.v.Ta?u.v.Ta(y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha):u.v.call(null,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha)}function l(u,y,z,A,C,D,G,E,F,W,U,Y,
aa,da){u=this;return u.v.Sa?u.v.Sa(y,z,A,C,D,G,E,F,W,U,Y,aa,da):u.v.call(null,y,z,A,C,D,G,E,F,W,U,Y,aa,da)}function m(u,y,z,A,C,D,G,E,F,W,U,Y,aa){u=this;return u.v.Ra?u.v.Ra(y,z,A,C,D,G,E,F,W,U,Y,aa):u.v.call(null,y,z,A,C,D,G,E,F,W,U,Y,aa)}function q(u,y,z,A,C,D,G,E,F,W,U,Y){u=this;return u.v.Qa?u.v.Qa(y,z,A,C,D,G,E,F,W,U,Y):u.v.call(null,y,z,A,C,D,G,E,F,W,U,Y)}function n(u,y,z,A,C,D,G,E,F,W,U){u=this;return u.v.Pa?u.v.Pa(y,z,A,C,D,G,E,F,W,U):u.v.call(null,y,z,A,C,D,G,E,F,W,U)}function r(u,y,z,A,
C,D,G,E,F,W){u=this;return u.v.bb?u.v.bb(y,z,A,C,D,G,E,F,W):u.v.call(null,y,z,A,C,D,G,E,F,W)}function p(u,y,z,A,C,D,G,E,F){u=this;return u.v.Ia?u.v.Ia(y,z,A,C,D,G,E,F):u.v.call(null,y,z,A,C,D,G,E,F)}function t(u,y,z,A,C,D,G,E){u=this;return u.v.ab?u.v.ab(y,z,A,C,D,G,E):u.v.call(null,y,z,A,C,D,G,E)}function x(u,y,z,A,C,D,G){u=this;return u.v.$a?u.v.$a(y,z,A,C,D,G):u.v.call(null,y,z,A,C,D,G)}function v(u,y,z,A,C,D){u=this;return u.v.ca?u.v.ca(y,z,A,C,D):u.v.call(null,y,z,A,C,D)}function H(u,y,z,A,C){u=
this;return u.v.J?u.v.J(y,z,A,C):u.v.call(null,y,z,A,C)}function P(u,y,z,A){u=this;return u.v.h?u.v.h(y,z,A):u.v.call(null,y,z,A)}function ea(u,y,z){u=this;return u.v.g?u.v.g(y,z):u.v.call(null,y,z)}function ca(u,y){u=this;return u.v.a?u.v.a(y):u.v.call(null,y)}function ma(u){u=this;return u.v.o?u.v.o():u.v.call(null)}var T=null;T=function(u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da,lb,Pb){switch(arguments.length){case 1:return ma.call(this,u);case 2:return ca.call(this,u,y);case 3:return ea.call(this,
u,y,z);case 4:return P.call(this,u,y,z,A);case 5:return H.call(this,u,y,z,A,C);case 6:return v.call(this,u,y,z,A,C,D);case 7:return x.call(this,u,y,z,A,C,D,G);case 8:return t.call(this,u,y,z,A,C,D,G,E);case 9:return p.call(this,u,y,z,A,C,D,G,E,F);case 10:return r.call(this,u,y,z,A,C,D,G,E,F,W);case 11:return n.call(this,u,y,z,A,C,D,G,E,F,W,U);case 12:return q.call(this,u,y,z,A,C,D,G,E,F,W,U,Y);case 13:return m.call(this,u,y,z,A,C,D,G,E,F,W,U,Y,aa);case 14:return l.call(this,u,y,z,A,C,D,G,E,F,W,U,
Y,aa,da);case 15:return k.call(this,u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha);case 16:return h.call(this,u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja);case 17:return f.call(this,u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta);case 18:return e.call(this,u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za);case 19:return d.call(this,u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha);case 20:return c.call(this,u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da);case 21:return b.call(this,u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da,lb);case 22:return a.call(this,
u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da,lb,Pb)}throw Error("Invalid arity: "+(arguments.length-1));};T.a=ma;T.g=ca;T.h=ea;T.J=P;T.ca=H;T.$a=v;T.ab=x;T.Ia=t;T.bb=p;T.Pa=r;T.Qa=n;T.Ra=q;T.Sa=m;T.Ta=l;T.Ua=k;T.Va=h;T.Wa=f;T.Xa=e;T.Ya=d;T.Za=c;T.fe=b;T.Yc=a;return T}();g.apply=function(a,b){return this.call.apply(this,[this].concat(Vb(b)))};g.o=function(){return this.v.o?this.v.o():this.v.call(null)};g.a=function(a){return this.v.a?this.v.a(a):this.v.call(null,a)};
g.g=function(a,b){return this.v.g?this.v.g(a,b):this.v.call(null,a,b)};g.h=function(a,b,c){return this.v.h?this.v.h(a,b,c):this.v.call(null,a,b,c)};g.J=function(a,b,c,d){return this.v.J?this.v.J(a,b,c,d):this.v.call(null,a,b,c,d)};g.ca=function(a,b,c,d,e){return this.v.ca?this.v.ca(a,b,c,d,e):this.v.call(null,a,b,c,d,e)};g.$a=function(a,b,c,d,e,f){return this.v.$a?this.v.$a(a,b,c,d,e,f):this.v.call(null,a,b,c,d,e,f)};
g.ab=function(a,b,c,d,e,f,h){return this.v.ab?this.v.ab(a,b,c,d,e,f,h):this.v.call(null,a,b,c,d,e,f,h)};g.Ia=function(a,b,c,d,e,f,h,k){return this.v.Ia?this.v.Ia(a,b,c,d,e,f,h,k):this.v.call(null,a,b,c,d,e,f,h,k)};g.bb=function(a,b,c,d,e,f,h,k,l){return this.v.bb?this.v.bb(a,b,c,d,e,f,h,k,l):this.v.call(null,a,b,c,d,e,f,h,k,l)};g.Pa=function(a,b,c,d,e,f,h,k,l,m){return this.v.Pa?this.v.Pa(a,b,c,d,e,f,h,k,l,m):this.v.call(null,a,b,c,d,e,f,h,k,l,m)};
g.Qa=function(a,b,c,d,e,f,h,k,l,m,q){return this.v.Qa?this.v.Qa(a,b,c,d,e,f,h,k,l,m,q):this.v.call(null,a,b,c,d,e,f,h,k,l,m,q)};g.Ra=function(a,b,c,d,e,f,h,k,l,m,q,n){return this.v.Ra?this.v.Ra(a,b,c,d,e,f,h,k,l,m,q,n):this.v.call(null,a,b,c,d,e,f,h,k,l,m,q,n)};g.Sa=function(a,b,c,d,e,f,h,k,l,m,q,n,r){return this.v.Sa?this.v.Sa(a,b,c,d,e,f,h,k,l,m,q,n,r):this.v.call(null,a,b,c,d,e,f,h,k,l,m,q,n,r)};
g.Ta=function(a,b,c,d,e,f,h,k,l,m,q,n,r,p){return this.v.Ta?this.v.Ta(a,b,c,d,e,f,h,k,l,m,q,n,r,p):this.v.call(null,a,b,c,d,e,f,h,k,l,m,q,n,r,p)};g.Ua=function(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t){return this.v.Ua?this.v.Ua(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t):this.v.call(null,a,b,c,d,e,f,h,k,l,m,q,n,r,p,t)};g.Va=function(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x){return this.v.Va?this.v.Va(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x):this.v.call(null,a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x)};
g.Wa=function(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v){return this.v.Wa?this.v.Wa(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v):this.v.call(null,a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v)};g.Xa=function(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H){return this.v.Xa?this.v.Xa(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H):this.v.call(null,a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H)};
g.Ya=function(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P){return this.v.Ya?this.v.Ya(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P):this.v.call(null,a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P)};g.Za=function(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P,ea){return this.v.Za?this.v.Za(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P,ea):this.v.call(null,a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P,ea)};
g.fe=function(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P,ea,ca){return se.Yc?se.Yc(this.v,a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P,ea,ca):se.call(null,this.v,a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P,ea,ca)};function te(a,b){return oa(a)?new re(a,b):null==a?null:Gc(a,b)}function ue(a){var b=null!=a;return(b?null!=a?a.l&131072||w===a.Qe||(a.l?0:Qb(Ec,a)):Qb(Ec,a):b)?Fc(a):null}function ve(a){return null==a||Ob(M(a))}function we(a){return null==a?!1:null!=a?a.l&8||w===a.hg?!0:a.l?!1:Qb(fc,a):Qb(fc,a)}
function xe(a){return null==a?!1:null!=a?a.l&4096||w===a.qg?!0:a.l?!1:Qb(zc,a):Qb(zc,a)}function ye(a){return null!=a?a.l&16777216||w===a.Se?!0:a.l?!1:Qb(Pc,a):Qb(Pc,a)}function ze(a){return null==a?!1:null!=a?a.l&1024||w===a.mg?!0:a.l?!1:Qb(vc,a):Qb(vc,a)}function Ae(a){return null!=a?a.l&67108864||w===a.og?!0:a.l?!1:Qb(Rc,a):Qb(Rc,a)}function Be(a){return null!=a?a.l&16384||w===a.rg?!0:a.l?!1:Qb(Bc,a):Qb(Bc,a)}function Ce(a){return null!=a?a.I&512||w===a.gg?!0:!1:!1}
function De(a,b,c,d,e){for(;0!==e;)c[d]=a[b],d+=1,--e,b+=1}var Ee={};function Fe(a){return null==a?!1:null!=a?a.l&64||w===a.T?!0:a.l?!1:Qb(jc,a):Qb(jc,a)}function Ge(a){return null==a?!1:!1===a?!1:!0}function He(a){var b=qe(a);return b?b:null!=a?a.l&1||w===a.jg?!0:a.l?!1:Qb($b,a):Qb($b,a)}function Ie(a){return"number"===typeof a&&!isNaN(a)&&Infinity!==a&&parseFloat(a)===parseInt(a,10)}function Je(a,b){return J.h(a,b,Ee)===Ee?!1:!0}
function Ke(a,b){if(null!=a?w===a.kc||(a.Bd?0:Qb(tc,a)):Qb(tc,a))a=uc(a,b);else{var c;if(c=null!=a)c=null!=a?a.l&512||w===a.fg?!0:a.l?!1:Qb(qc,a):Qb(qc,a);a=c&&Je(a,b)?new Le(b,J.g(a,b),null):null}return a}function fe(a){switch(arguments.length){case 2:return ee(arguments[0],arguments[1]);case 3:return ge(arguments[0],arguments[1],arguments[2]);default:throw Error(["Invalid arity: ",I.a(arguments.length)].join(""));}}
function ee(a,b){var c=M(b);return c?(b=N(c),c=O(c),Xb?Xb(a,b,c):Yb.call(null,a,b,c)):a.o?a.o():a.call(null)}function ge(a,b,c){for(c=M(c);;)if(c){var d=N(c);b=a.g?a.g(b,d):a.call(null,b,d);if(Md(b))return Dc(b);c=O(c)}else return b}function Me(a,b){a=kd(a);if(B(a.ka()))for(var c=a.next();;)if(a.ka()){var d=a.next();c=b.g?b.g(c,d):b.call(null,c,d);if(Md(c))return Dc(c)}else return c;else return b.o?b.o():b.call(null)}
function Ne(a,b,c){for(a=kd(a);;)if(a.ka()){var d=a.next();c=b.g?b.g(c,d):b.call(null,c,d);if(Md(c))return Dc(c)}else return c}function Yb(a){switch(arguments.length){case 2:return Oe(arguments[0],arguments[1]);case 3:return Xb(arguments[0],arguments[1],arguments[2]);default:throw Error(["Invalid arity: ",I.a(arguments.length)].join(""));}}function Oe(a,b){return null!=b&&(b.l&524288||w===b.xf)?Ic.g(b,a):Nb(b)?Rd(b,a):"string"===typeof b?Rd(b,a):Qb(Hc,b)?Ic.g(b,a):zd(b)?Me(b,a):ee(a,b)}
function Xb(a,b,c){return null!=c&&(c.l&524288||w===c.xf)?Ic.h(c,a,b):Nb(c)?Sd(c,a,b):"string"===typeof c?Sd(c,a,b):Qb(Hc,c)?Ic.h(c,a,b):zd(c)?Ne(c,a,b):ge(a,b,c)}function Pe(a,b,c){return null!=c?Kc(c,a,b):b}function Qe(a){return a}
function Re(a){return function(){function b(f,h){return a.g?a.g(f,h):a.call(null,f,h)}function c(f){return Qe.a?Qe.a(f):Qe.call(null,f)}function d(){return a.o?a.o():a.call(null)}var e=null;e=function(f,h){switch(arguments.length){case 0:return d.call(this);case 1:return c.call(this,f);case 2:return b.call(this,f,h)}throw Error("Invalid arity: "+arguments.length);};e.o=d;e.a=c;e.g=b;return e}()}function Se(a,b,c,d){a=a.a?a.a(b):a.call(null,b);c=Xb(a,c,d);return a.a?a.a(c):a.call(null,c)}
function Te(a){if("number"===typeof a)return String.fromCharCode(a);if("string"===typeof a&&1===a.length)return a;throw Error("Argument to char must be a character or number");}function Ue(a){a=(a-a%2)/2;return 0<=a?Math.floor(a):Math.ceil(a)}function Ve(a){a-=a>>1&1431655765;a=(a&858993459)+(a>>2&858993459);return 16843009*(a+(a>>4)&252645135)>>24}
var I=function I(a){switch(arguments.length){case 0:return I.o();case 1:return I.a(arguments[0]);default:for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return I.A(arguments[0],new Ad(c.slice(1),0,null))}};I.o=function(){return""};I.a=function(a){return null==a?"":[a].join("")};I.A=function(a,b){for(a=new vb(I.a(a));;)if(B(b))a=a.append(I.a(N(b))),b=O(b);else return a.toString()};I.R=function(a){var b=N(a);a=O(a);return this.A(b,a)};I.O=1;
function be(a,b){if(ye(b))if(Ud(a)&&Ud(b)&&Q(a)!==Q(b))a=!1;else a:for(a=M(a),b=M(b);;){if(null==a){a=null==b;break a}if(null!=b&&Dd.g(N(a),N(b)))a=O(a),b=O(b);else{a=!1;break a}}else a=null;return Ge(a)}function ke(a,b,c,d,e){this.B=a;this.first=b;this.Qb=c;this.count=d;this.C=e;this.l=65937646;this.I=8192}g=ke.prototype;g.toString=function(){return md(this)};g.equiv=function(a){return this.H(null,a)};
g.indexOf=function(){var a=null;a=function(b,c){switch(arguments.length){case 1:return Wd(this,b,0);case 2:return Wd(this,b,c)}throw Error("Invalid arity: "+arguments.length);};a.a=function(b){return Wd(this,b,0)};a.g=function(b,c){return Wd(this,b,c)};return a}();
g.lastIndexOf=function(){function a(c){return Zd(this,c,this.count)}var b=null;b=function(c,d){switch(arguments.length){case 1:return a.call(this,c);case 2:return Zd(this,c,d)}throw Error("Invalid arity: "+arguments.length);};b.a=a;b.g=function(c,d){return Zd(this,c,d)};return b}();g.S=function(){return this.B};g.Ga=function(){return new ke(this.B,this.first,this.Qb,this.count,this.C)};g.Ba=function(){return 1===this.count?null:this.Qb};g.Z=function(){return this.count};g.$b=function(){return this.first};
g.Y=function(){var a=this.C;return null!=a?a:this.C=a=Gd(this)};g.H=function(a,b){return be(this,b)};g.ia=function(){return Gc(Cd,this.B)};g.Ca=function(a,b){return ee(b,this)};g.Da=function(a,b,c){return ge(b,c,this)};g.Ha=function(){return this.first};g.La=function(){return 1===this.count?Cd:this.Qb};g.aa=function(){return this};g.U=function(a,b){return b===this.B?this:new ke(b,this.first,this.Qb,this.count,this.C)};g.ea=function(a,b){return new ke(this.B,b,this,this.count+1,null)};
function We(a){return null!=a?a.l&33554432||w===a.lg?!0:a.l?!1:Qb(Qc,a):Qb(Qc,a)}ke.prototype[Ub]=function(){return Fd(this)};function Xe(a){this.B=a;this.l=65937614;this.I=8192}g=Xe.prototype;g.toString=function(){return md(this)};g.equiv=function(a){return this.H(null,a)};
g.indexOf=function(){var a=null;a=function(b,c){switch(arguments.length){case 1:return Wd(this,b,0);case 2:return Wd(this,b,c)}throw Error("Invalid arity: "+arguments.length);};a.a=function(b){return Wd(this,b,0)};a.g=function(b,c){return Wd(this,b,c)};return a}();
g.lastIndexOf=function(){function a(c){return Zd(this,c,Q(this))}var b=null;b=function(c,d){switch(arguments.length){case 1:return a.call(this,c);case 2:return Zd(this,c,d)}throw Error("Invalid arity: "+arguments.length);};b.a=a;b.g=function(c,d){return Zd(this,c,d)};return b}();g.S=function(){return this.B};g.Ga=function(){return new Xe(this.B)};g.Ba=function(){return null};g.Z=function(){return 0};g.$b=function(){return null};g.Y=function(){return Hd};
g.H=function(a,b){return We(b)||ye(b)?null==M(b):!1};g.ia=function(){return this};g.Ca=function(a,b){return ee(b,this)};g.Da=function(a,b,c){return ge(b,c,this)};g.Ha=function(){return null};g.La=function(){return Cd};g.aa=function(){return null};g.U=function(a,b){return b===this.B?this:new Xe(b)};g.ea=function(a,b){return new ke(this.B,b,null,1,null)};var Cd=new Xe(null);Xe.prototype[Ub]=function(){return Fd(this)};
function Ye(a){return(null!=a?a.l&134217728||w===a.pg||(a.l?0:Qb(Sc,a)):Qb(Sc,a))?(a=Tc(a))?a:Cd:Xb(ie,Cd,a)}var Ze=function Ze(a){for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return Ze.A(0<c.length?new Ad(c.slice(0),0,null):null)};Ze.A=function(a){if(a instanceof Ad&&0===a.F)var b=a.j;else a:for(b=[];;)if(null!=a)b.push(kc(a)),a=nc(a);else break a;a=b.length;for(var c=Cd;;)if(0<a){var d=a-1;c=gc(c,b[a-1]);a=d}else return c};Ze.O=0;Ze.R=function(a){return this.A(M(a))};
function $e(a,b,c,d){this.B=a;this.first=b;this.Qb=c;this.C=d;this.l=65929452;this.I=8192}g=$e.prototype;g.toString=function(){return md(this)};g.equiv=function(a){return this.H(null,a)};g.indexOf=function(){var a=null;a=function(b,c){switch(arguments.length){case 1:return Wd(this,b,0);case 2:return Wd(this,b,c)}throw Error("Invalid arity: "+arguments.length);};a.a=function(b){return Wd(this,b,0)};a.g=function(b,c){return Wd(this,b,c)};return a}();
g.lastIndexOf=function(){function a(c){return Zd(this,c,Q(this))}var b=null;b=function(c,d){switch(arguments.length){case 1:return a.call(this,c);case 2:return Zd(this,c,d)}throw Error("Invalid arity: "+arguments.length);};b.a=a;b.g=function(c,d){return Zd(this,c,d)};return b}();g.S=function(){return this.B};g.Ga=function(){return new $e(this.B,this.first,this.Qb,this.C)};g.Ba=function(){return null==this.Qb?null:M(this.Qb)};g.Y=function(){var a=this.C;return null!=a?a:this.C=a=Gd(this)};
g.H=function(a,b){return be(this,b)};g.ia=function(){return Cd};g.Ca=function(a,b){return ee(b,this)};g.Da=function(a,b,c){return ge(b,c,this)};g.Ha=function(){return this.first};g.La=function(){return null==this.Qb?Cd:this.Qb};g.aa=function(){return this};g.U=function(a,b){return b===this.B?this:new $e(b,this.first,this.Qb,this.C)};g.ea=function(a,b){return new $e(null,b,this,null)};$e.prototype[Ub]=function(){return Fd(this)};
function ce(a,b){return null==b?new ke(null,a,null,1,null):null!=b&&(b.l&64||w===b.T)?new $e(null,a,b,null):new $e(null,a,M(b),null)}function K(a,b,c,d){this.Mc=a;this.name=b;this.cb=c;this.Bc=d;this.l=2153775105;this.I=4096}g=K.prototype;g.toString=function(){return[":",I.a(this.cb)].join("")};g.equiv=function(a){return this.H(null,a)};g.H=function(a,b){return b instanceof K?this.cb===b.cb:!1};
g.call=function(){var a=null;a=function(b,c,d){switch(arguments.length){case 2:return J.g(c,this);case 3:return J.h(c,this,d)}throw Error("Invalid arity: "+(arguments.length-1));};a.g=function(b,c){return J.g(c,this)};a.h=function(b,c,d){return J.h(c,this,d)};return a}();g.apply=function(a,b){return this.call.apply(this,[this].concat(Vb(b)))};g.a=function(a){return J.g(a,this)};g.g=function(a,b){return J.h(a,this,b)};
g.Y=function(){var a=this.Bc;return null!=a?a:this.Bc=a=wd(rd(this.name),ud(this.Mc))+2654435769|0};g.yd=function(){return this.name};g.zd=function(){return this.Mc};g.W=function(a,b){return Uc(b,[":",I.a(this.cb)].join(""))};function af(a,b){return a===b?!0:a instanceof K&&b instanceof K?a.cb===b.cb:!1}function bf(a){if(null!=a&&(a.I&4096||w===a.wf))return fd(a);throw Error(["Doesn't support namespace: ",I.a(a)].join(""));}
var cf=function cf(a){switch(arguments.length){case 1:return cf.a(arguments[0]);case 2:return cf.g(arguments[0],arguments[1]);default:throw Error(["Invalid arity: ",I.a(arguments.length)].join(""));}};cf.a=function(a){if(a instanceof K)return a;if(a instanceof xd)return new K(bf(a),df.a?df.a(a):df.call(null,a),a.nb,null);if("string"===typeof a){var b=a.split("/");return 2===b.length?new K(b[0],b[1],a,null):new K(null,b[0],a,null)}return null};
cf.g=function(a,b){a=a instanceof K?df.a?df.a(a):df.call(null,a):a instanceof xd?df.a?df.a(a):df.call(null,a):a;b=b instanceof K?df.a?df.a(b):df.call(null,b):b instanceof xd?df.a?df.a(b):df.call(null,b):b;return new K(a,b,[B(a)?[I.a(a),"/"].join(""):null,I.a(b)].join(""),null)};cf.O=2;function ef(a,b,c,d){this.B=a;this.hd=b;this.X=c;this.C=d;this.l=32374988;this.I=1}g=ef.prototype;g.toString=function(){return md(this)};g.equiv=function(a){return this.H(null,a)};
function ff(a){null!=a.hd&&(a.X=a.hd.o?a.hd.o():a.hd.call(null),a.hd=null);return a.X}g.indexOf=function(){var a=null;a=function(b,c){switch(arguments.length){case 1:return Wd(this,b,0);case 2:return Wd(this,b,c)}throw Error("Invalid arity: "+arguments.length);};a.a=function(b){return Wd(this,b,0)};a.g=function(b,c){return Wd(this,b,c)};return a}();
g.lastIndexOf=function(){function a(c){return Zd(this,c,Q(this))}var b=null;b=function(c,d){switch(arguments.length){case 1:return a.call(this,c);case 2:return Zd(this,c,d)}throw Error("Invalid arity: "+arguments.length);};b.a=a;b.g=function(c,d){return Zd(this,c,d)};return b}();g.S=function(){return this.B};g.Ba=function(){this.aa(null);return null==this.X?null:O(this.X)};g.Y=function(){var a=this.C;return null!=a?a:this.C=a=Gd(this)};g.H=function(a,b){return be(this,b)};
g.ia=function(){return Gc(Cd,this.B)};g.Ca=function(a,b){return ee(b,this)};g.Da=function(a,b,c){return ge(b,c,this)};g.Ha=function(){this.aa(null);return null==this.X?null:N(this.X)};g.La=function(){this.aa(null);return null!=this.X?Bd(this.X):Cd};g.aa=function(){ff(this);if(null==this.X)return null;for(var a=this.X;;)if(a instanceof ef)a=ff(a);else return this.X=a,M(this.X)};g.U=function(a,b){return b===this.B?this:new ef(b,function(c){return function(){return c.aa(null)}}(this),null,this.C)};
g.ea=function(a,b){return ce(b,this)};ef.prototype[Ub]=function(){return Fd(this)};function gf(a){this.da=a;this.end=0;this.l=2;this.I=0}gf.prototype.add=function(a){this.da[this.end]=a;return this.end+=1};gf.prototype.za=function(){var a=new hf(this.da,0,this.end);this.da=null;return a};gf.prototype.Z=function(){return this.end};function jf(a){return new gf(Array(a))}function hf(a,b,c){this.j=a;this.Oa=b;this.end=c;this.l=524306;this.I=0}g=hf.prototype;g.Z=function(){return this.end-this.Oa};
g.P=function(a,b){return this.j[this.Oa+b]};g.ha=function(a,b,c){return 0<=b&&b<this.end-this.Oa?this.j[this.Oa+b]:c};g.de=function(){if(this.Oa===this.end)throw Error("-drop-first of empty chunk");return new hf(this.j,this.Oa+1,this.end)};g.Ca=function(a,b){return Td(this.j,b,this.j[this.Oa],this.Oa+1)};g.Da=function(a,b,c){return Td(this.j,b,c,this.Oa)};function kf(a,b,c,d){this.za=a;this.Nb=b;this.B=c;this.C=d;this.l=31850732;this.I=1536}g=kf.prototype;g.toString=function(){return md(this)};
g.equiv=function(a){return this.H(null,a)};g.indexOf=function(){var a=null;a=function(b,c){switch(arguments.length){case 1:return Wd(this,b,0);case 2:return Wd(this,b,c)}throw Error("Invalid arity: "+arguments.length);};a.a=function(b){return Wd(this,b,0)};a.g=function(b,c){return Wd(this,b,c)};return a}();
g.lastIndexOf=function(){function a(c){return Zd(this,c,Q(this))}var b=null;b=function(c,d){switch(arguments.length){case 1:return a.call(this,c);case 2:return Zd(this,c,d)}throw Error("Invalid arity: "+arguments.length);};b.a=a;b.g=function(c,d){return Zd(this,c,d)};return b}();g.S=function(){return this.B};g.Ba=function(){return 1<cc(this.za)?new kf(bd(this.za),this.Nb,null,null):null==this.Nb?null:Oc(this.Nb)};g.Y=function(){var a=this.C;return null!=a?a:this.C=a=Gd(this)};
g.H=function(a,b){return be(this,b)};g.ia=function(){return Cd};g.Ha=function(){return ic.g(this.za,0)};g.La=function(){return 1<cc(this.za)?new kf(bd(this.za),this.Nb,null,null):null==this.Nb?Cd:this.Nb};g.aa=function(){return this};g.xd=function(){return this.za};g.Fc=function(){return null==this.Nb?Cd:this.Nb};g.U=function(a,b){return b===this.B?this:new kf(this.za,this.Nb,b,this.C)};g.ea=function(a,b){return ce(b,this)};g.ee=function(){return null==this.Nb?null:this.Nb};kf.prototype[Ub]=function(){return Fd(this)};
function lf(a,b){return 0===cc(a)?b:new kf(a,b,null,null)}function mf(a,b){a.add(b)}function nf(a){var b=[];for(a=M(a);;)if(null!=a)b.push(N(a)),a=O(a);else return b}function of(a,b){if(Ud(b))return Q(b);var c=0;for(b=M(b);;)if(null!=b&&c<a)c+=1,b=O(b);else return c}
var pf=function pf(a){if(null==a)return null;var c=O(a);return null==c?M(N(a)):ce(N(a),pf.a?pf.a(c):pf.call(null,c))},qf=function qf(a){switch(arguments.length){case 0:return qf.o();case 1:return qf.a(arguments[0]);case 2:return qf.g(arguments[0],arguments[1]);default:for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return qf.A(arguments[0],arguments[1],new Ad(c.slice(2),0,null))}};qf.o=function(){return new ef(null,function(){return null},null,null)};
qf.a=function(a){return new ef(null,function(){return a},null,null)};qf.g=function(a,b){return new ef(null,function(){var c=M(a);return c?Ce(c)?lf(cd(c),qf.g(dd(c),b)):ce(N(c),qf.g(Bd(c),b)):b},null,null)};qf.A=function(a,b,c){return function h(e,f){return new ef(null,function(){var k=M(e);return k?Ce(k)?lf(cd(k),h(dd(k),f)):ce(N(k),h(Bd(k),f)):B(f)?h(N(f),O(f)):null},null,null)}(qf.g(a,b),c)};qf.R=function(a){var b=N(a),c=O(a);a=N(c);c=O(c);return this.A(b,a,c)};qf.O=2;
var rf=function rf(a){switch(arguments.length){case 0:return rf.o();case 1:return rf.a(arguments[0]);case 2:return rf.g(arguments[0],arguments[1]);default:for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return rf.A(arguments[0],arguments[1],new Ad(c.slice(2),0,null))}};rf.o=function(){return Yc(je)};rf.a=function(a){return a};rf.g=function(a,b){return Zc(a,b)};rf.A=function(a,b,c){for(;;)if(a=Zc(a,b),B(c))b=N(c),c=O(c);else return a};
rf.R=function(a){var b=N(a),c=O(a);a=N(c);c=O(c);return this.A(b,a,c)};rf.O=2;function sf(a,b,c){return ad(a,b,c)}
function tf(a,b,c){var d=M(c);if(0===b)return a.o?a.o():a.call(null);c=kc(d);var e=lc(d);if(1===b)return a.a?a.a(c):a.call(null,c);d=kc(e);var f=lc(e);if(2===b)return a.g?a.g(c,d):a.call(null,c,d);e=kc(f);var h=lc(f);if(3===b)return a.h?a.h(c,d,e):a.call(null,c,d,e);f=kc(h);var k=lc(h);if(4===b)return a.J?a.J(c,d,e,f):a.call(null,c,d,e,f);h=kc(k);var l=lc(k);if(5===b)return a.ca?a.ca(c,d,e,f,h):a.call(null,c,d,e,f,h);k=kc(l);var m=lc(l);if(6===b)return a.$a?a.$a(c,d,e,f,h,k):a.call(null,c,d,e,f,h,
k);l=kc(m);var q=lc(m);if(7===b)return a.ab?a.ab(c,d,e,f,h,k,l):a.call(null,c,d,e,f,h,k,l);m=kc(q);var n=lc(q);if(8===b)return a.Ia?a.Ia(c,d,e,f,h,k,l,m):a.call(null,c,d,e,f,h,k,l,m);q=kc(n);var r=lc(n);if(9===b)return a.bb?a.bb(c,d,e,f,h,k,l,m,q):a.call(null,c,d,e,f,h,k,l,m,q);n=kc(r);var p=lc(r);if(10===b)return a.Pa?a.Pa(c,d,e,f,h,k,l,m,q,n):a.call(null,c,d,e,f,h,k,l,m,q,n);r=kc(p);var t=lc(p);if(11===b)return a.Qa?a.Qa(c,d,e,f,h,k,l,m,q,n,r):a.call(null,c,d,e,f,h,k,l,m,q,n,r);p=kc(t);var x=lc(t);
if(12===b)return a.Ra?a.Ra(c,d,e,f,h,k,l,m,q,n,r,p):a.call(null,c,d,e,f,h,k,l,m,q,n,r,p);t=kc(x);var v=lc(x);if(13===b)return a.Sa?a.Sa(c,d,e,f,h,k,l,m,q,n,r,p,t):a.call(null,c,d,e,f,h,k,l,m,q,n,r,p,t);x=kc(v);var H=lc(v);if(14===b)return a.Ta?a.Ta(c,d,e,f,h,k,l,m,q,n,r,p,t,x):a.call(null,c,d,e,f,h,k,l,m,q,n,r,p,t,x);v=kc(H);var P=lc(H);if(15===b)return a.Ua?a.Ua(c,d,e,f,h,k,l,m,q,n,r,p,t,x,v):a.call(null,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v);H=kc(P);var ea=lc(P);if(16===b)return a.Va?a.Va(c,d,e,f,h,k,l,
m,q,n,r,p,t,x,v,H):a.call(null,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H);P=kc(ea);var ca=lc(ea);if(17===b)return a.Wa?a.Wa(c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P):a.call(null,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P);ea=kc(ca);var ma=lc(ca);if(18===b)return a.Xa?a.Xa(c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P,ea):a.call(null,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P,ea);ca=kc(ma);ma=lc(ma);if(19===b)return a.Ya?a.Ya(c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P,ea,ca):a.call(null,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P,ea,ca);var T=kc(ma);lc(ma);if(20===
b)return a.Za?a.Za(c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P,ea,ca,T):a.call(null,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P,ea,ca,T);throw Error("Only up to 20 arguments supported on functions");}function uf(a){return null!=a&&(a.l&128||w===a.$c)?a.Ba(null):M(Bd(a))}function vf(a,b,c){return null==c?a.a?a.a(b):a.call(a,b):wf(a,b,kc(c),uf(c))}function wf(a,b,c,d){return null==d?a.g?a.g(b,c):a.call(a,b,c):xf(a,b,c,kc(d),uf(d))}
function xf(a,b,c,d,e){return null==e?a.h?a.h(b,c,d):a.call(a,b,c,d):yf(a,b,c,d,kc(e),uf(e))}
function yf(a,b,c,d,e,f){if(null==f)return a.J?a.J(b,c,d,e):a.call(a,b,c,d,e);var h=kc(f),k=O(f);if(null==k)return a.ca?a.ca(b,c,d,e,h):a.call(a,b,c,d,e,h);f=kc(k);var l=O(k);if(null==l)return a.$a?a.$a(b,c,d,e,h,f):a.call(a,b,c,d,e,h,f);k=kc(l);var m=O(l);if(null==m)return a.ab?a.ab(b,c,d,e,h,f,k):a.call(a,b,c,d,e,h,f,k);l=kc(m);var q=O(m);if(null==q)return a.Ia?a.Ia(b,c,d,e,h,f,k,l):a.call(a,b,c,d,e,h,f,k,l);m=kc(q);var n=O(q);if(null==n)return a.bb?a.bb(b,c,d,e,h,f,k,l,m):a.call(a,b,c,d,e,h,f,
k,l,m);q=kc(n);var r=O(n);if(null==r)return a.Pa?a.Pa(b,c,d,e,h,f,k,l,m,q):a.call(a,b,c,d,e,h,f,k,l,m,q);n=kc(r);var p=O(r);if(null==p)return a.Qa?a.Qa(b,c,d,e,h,f,k,l,m,q,n):a.call(a,b,c,d,e,h,f,k,l,m,q,n);r=kc(p);var t=O(p);if(null==t)return a.Ra?a.Ra(b,c,d,e,h,f,k,l,m,q,n,r):a.call(a,b,c,d,e,h,f,k,l,m,q,n,r);p=kc(t);var x=O(t);if(null==x)return a.Sa?a.Sa(b,c,d,e,h,f,k,l,m,q,n,r,p):a.call(a,b,c,d,e,h,f,k,l,m,q,n,r,p);t=kc(x);var v=O(x);if(null==v)return a.Ta?a.Ta(b,c,d,e,h,f,k,l,m,q,n,r,p,t):a.call(a,
b,c,d,e,h,f,k,l,m,q,n,r,p,t);x=kc(v);var H=O(v);if(null==H)return a.Ua?a.Ua(b,c,d,e,h,f,k,l,m,q,n,r,p,t,x):a.call(a,b,c,d,e,h,f,k,l,m,q,n,r,p,t,x);v=kc(H);var P=O(H);if(null==P)return a.Va?a.Va(b,c,d,e,h,f,k,l,m,q,n,r,p,t,x,v):a.call(a,b,c,d,e,h,f,k,l,m,q,n,r,p,t,x,v);H=kc(P);var ea=O(P);if(null==ea)return a.Wa?a.Wa(b,c,d,e,h,f,k,l,m,q,n,r,p,t,x,v,H):a.call(a,b,c,d,e,h,f,k,l,m,q,n,r,p,t,x,v,H);P=kc(ea);var ca=O(ea);if(null==ca)return a.Xa?a.Xa(b,c,d,e,h,f,k,l,m,q,n,r,p,t,x,v,H,P):a.call(a,b,c,d,e,
h,f,k,l,m,q,n,r,p,t,x,v,H,P);ea=kc(ca);var ma=O(ca);if(null==ma)return a.Ya?a.Ya(b,c,d,e,h,f,k,l,m,q,n,r,p,t,x,v,H,P,ea):a.call(a,b,c,d,e,h,f,k,l,m,q,n,r,p,t,x,v,H,P,ea);ca=kc(ma);ma=O(ma);if(null==ma)return a.Za?a.Za(b,c,d,e,h,f,k,l,m,q,n,r,p,t,x,v,H,P,ea,ca):a.call(a,b,c,d,e,h,f,k,l,m,q,n,r,p,t,x,v,H,P,ea,ca);b=[b,c,d,e,h,f,k,l,m,q,n,r,p,t,x,v,H,P,ea,ca];for(c=ma;;)if(c)b.push(kc(c)),c=O(c);else break;return a.apply(a,b)}
function se(a){switch(arguments.length){case 2:return zf(arguments[0],arguments[1]);case 3:return Af(arguments[0],arguments[1],arguments[2]);case 4:return Bf(arguments[0],arguments[1],arguments[2],arguments[3]);case 5:return Cf(arguments[0],arguments[1],arguments[2],arguments[3],arguments[4]);default:for(var b=[],c=arguments.length,d=0;;)if(d<c)b.push(arguments[d]),d+=1;else break;return Df(arguments[0],arguments[1],arguments[2],arguments[3],arguments[4],new Ad(b.slice(5),0,null))}}
function zf(a,b){if(a.R){var c=a.O,d=of(c+1,b);return d<=c?tf(a,d,b):a.R(b)}b=M(b);return null==b?a.o?a.o():a.call(a):vf(a,kc(b),uf(b))}function Af(a,b,c){if(a.R){b=ce(b,c);var d=a.O;c=of(d,c)+1;return c<=d?tf(a,c,b):a.R(b)}return vf(a,b,M(c))}function Bf(a,b,c,d){return a.R?(b=ce(b,ce(c,d)),c=a.O,d=2+of(c-1,d),d<=c?tf(a,d,b):a.R(b)):wf(a,b,c,M(d))}function Cf(a,b,c,d,e){return a.R?(b=ce(b,ce(c,ce(d,e))),c=a.O,e=3+of(c-2,e),e<=c?tf(a,e,b):a.R(b)):xf(a,b,c,d,M(e))}
function Df(a,b,c,d,e,f){return a.R?(f=pf(f),b=ce(b,ce(c,ce(d,ce(e,f)))),c=a.O,f=4+of(c-3,f),f<=c?tf(a,f,b):a.R(b)):yf(a,b,c,d,e,pf(f))}function Ef(a,b){return!Dd.g(a,b)}function Ff(a){return M(a)?a:null}
function Gf(){if("undefined"===typeof wb||"undefined"===typeof xb||"undefined"===typeof yb)yb=function(a){this.Kf=a;this.l=393216;this.I=0},yb.prototype.U=function(a,b){return new yb(b)},yb.prototype.S=function(){return this.Kf},yb.prototype.ka=function(){return!1},yb.prototype.next=function(){return Error("No such element")},yb.prototype.remove=function(){return Error("Unsupported operation")},yb.Ab=function(){return new V(null,1,5,X,[Hf],null)},yb.qb=!0,yb.ib="cljs.core/t_cljs$core26146",yb.ub=
function(a,b){return Uc(b,"cljs.core/t_cljs$core26146")};return new yb(If)}function Jf(a){this.X=a;this.F=0}Jf.prototype.ka=function(){return this.F<this.X.length};Jf.prototype.next=function(){var a=this.X.charAt(this.F);this.F+=1;return a};Jf.prototype.remove=function(){return Error("Unsupported operation")};function Kf(a){this.j=a;this.F=0}Kf.prototype.ka=function(){return this.F<this.j.length};Kf.prototype.next=function(){var a=this.j[this.F];this.F+=1;return a};Kf.prototype.remove=function(){return Error("Unsupported operation")};
var Lf={},Mf={};function Nf(a){this.Rc=Lf;this.tb=a}Nf.prototype.ka=function(){this.Rc===Lf?(this.Rc=Mf,this.tb=M(this.tb)):this.Rc===this.tb&&(this.tb=O(this.Rc));return null!=this.tb};Nf.prototype.next=function(){if(this.ka())return this.Rc=this.tb,N(this.tb);throw Error("No such element");};Nf.prototype.remove=function(){return Error("Unsupported operation")};
function Of(a){if(zd(a))return kd(a);if(null==a)return Gf();if("string"===typeof a)return new Jf(a);if(Nb(a))return new Kf(a);var b=null==a;b||(b=(b=null!=a?a.l&8388608||w===a.Re?!0:a.l?!1:Qb(Nc,a):Qb(Nc,a))?b:Nb(a)||"string"===typeof a);if(b)return new Nf(a);throw Error(["Cannot create iterator from ",I.a(a)].join(""));}function Pf(a){this.Sd=a}Pf.prototype.add=function(a){this.Sd.push(a);return this};Pf.prototype.remove=function(){return this.Sd.shift()};Pf.prototype.Id=function(){return 0===this.Sd.length};
Pf.prototype.toString=function(){return["Many: ",I.a(this.Sd)].join("")};var Qf={};function Rf(a){this.s=a}Rf.prototype.add=function(a){return this.s===Qf?(this.s=a,this):new Pf([this.s,a])};Rf.prototype.remove=function(){if(this.s===Qf)throw Error("Removing object from empty buffer");var a=this.s;this.s=Qf;return a};Rf.prototype.Id=function(){return this.s===Qf};Rf.prototype.toString=function(){return["Single: ",I.a(this.s)].join("")};function Sf(){}Sf.prototype.add=function(a){return new Rf(a)};
Sf.prototype.remove=function(){throw Error("Removing object from empty buffer");};Sf.prototype.Id=function(){return!0};Sf.prototype.toString=function(){return"Empty"};var Tf=new Sf,Uf=function Uf(a){return new ef(null,function(){if(a.ka())for(var c=[],d=0;;){var e=a.ka();if(B(B(e)?32>d:e))c[d]=a.next(),d+=1;else return lf(new hf(c,0,d),Uf.a?Uf.a(a):Uf.call(null,a))}else return null},null,null)};function Vf(a){this.buffer=Tf;this.tb=Qf;this.me=!1;this.Rb=null;this.Be=a;this.Xf=!1}
Vf.prototype.step=function(){if(this.tb!==Qf)return!0;for(;;)if(this.tb===Qf)if(this.buffer.Id()){if(this.me)return!1;if(this.Be.ka()){if(this.Xf)var a=zf(this.Rb,ce(null,this.Be.next()));else a=this.Be.next(),a=this.Rb.g?this.Rb.g(null,a):this.Rb.call(null,null,a);Md(a)&&(this.Rb.a?this.Rb.a(null):this.Rb.call(null,null),this.me=!0)}else this.Rb.a?this.Rb.a(null):this.Rb.call(null,null),this.me=!0}else this.tb=this.buffer.remove();else return!0};Vf.prototype.ka=function(){return this.step()};
Vf.prototype.next=function(){if(this.ka()){var a=this.tb;this.tb=Qf;return a}throw Error("No such element");};Vf.prototype.remove=function(){return Error("Unsupported operation")};Vf.prototype[Ub]=function(){return Fd(this)};
function Wf(a,b){var c=new Vf(b);c.Rb=function(){var d=function(e){return function(){function f(k,l){e.buffer=e.buffer.add(l);return k}var h=null;h=function(k,l){switch(arguments.length){case 0:return null;case 1:return k;case 2:return f.call(this,k,l)}throw Error("Invalid arity: "+arguments.length);};h.o=function(){return null};h.a=function(k){return k};h.g=f;return h}()}(c);return a.a?a.a(d):a.call(null,d)}();return c}
function Xf(a,b){for(;;){if(null==M(b))return!0;var c=N(b);c=a.a?a.a(c):a.call(null,c);if(B(c))b=O(b);else return!1}}function Yf(a,b){for(;;)if(b=M(b)){var c=N(b);c=a.a?a.a(c):a.call(null,c);if(B(c))return c;b=O(b)}else return null}function Zf(a){if(Ie(a))return 0===(a&1);throw Error(["Argument must be an integer: ",I.a(a)].join(""));}
function $f(a){return function(){function b(h,k){return Ob(a.g?a.g(h,k):a.call(null,h,k))}function c(h){return Ob(a.a?a.a(h):a.call(null,h))}function d(){return Ob(a.o?a.o():a.call(null))}var e=null,f=function(){function h(l,m,q){var n=null;if(2<arguments.length){n=0;for(var r=Array(arguments.length-2);n<r.length;)r[n]=arguments[n+2],++n;n=new Ad(r,0,null)}return k.call(this,l,m,n)}function k(l,m,q){return Ob(Bf(a,l,m,q))}h.O=2;h.R=function(l){var m=N(l);l=O(l);var q=N(l);l=Bd(l);return k(m,q,l)};
h.A=k;return h}();e=function(h,k,l){switch(arguments.length){case 0:return d.call(this);case 1:return c.call(this,h);case 2:return b.call(this,h,k);default:var m=null;if(2<arguments.length){m=0;for(var q=Array(arguments.length-2);m<q.length;)q[m]=arguments[m+2],++m;m=new Ad(q,0,null)}return f.A(h,k,m)}throw Error("Invalid arity: "+arguments.length);};e.O=2;e.R=f.R;e.o=d;e.a=c;e.g=b;e.A=f.A;return e}()}
function ag(a){return function(){function b(c){if(0<arguments.length)for(var d=0,e=Array(arguments.length-0);d<e.length;)e[d]=arguments[d+0],++d;return a}b.O=0;b.R=function(c){M(c);return a};b.A=function(){return a};return b}()}
var bg=function bg(a){switch(arguments.length){case 0:return bg.o();case 1:return bg.a(arguments[0]);case 2:return bg.g(arguments[0],arguments[1]);case 3:return bg.h(arguments[0],arguments[1],arguments[2]);default:for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return bg.A(arguments[0],arguments[1],arguments[2],new Ad(c.slice(3),0,null))}};bg.o=function(){return Qe};bg.a=function(a){return a};
bg.g=function(a,b){return function(){function c(l,m,q){l=b.h?b.h(l,m,q):b.call(null,l,m,q);return a.a?a.a(l):a.call(null,l)}function d(l,m){l=b.g?b.g(l,m):b.call(null,l,m);return a.a?a.a(l):a.call(null,l)}function e(l){l=b.a?b.a(l):b.call(null,l);return a.a?a.a(l):a.call(null,l)}function f(){var l=b.o?b.o():b.call(null);return a.a?a.a(l):a.call(null,l)}var h=null,k=function(){function l(q,n,r,p){var t=null;if(3<arguments.length){t=0;for(var x=Array(arguments.length-3);t<x.length;)x[t]=arguments[t+
3],++t;t=new Ad(x,0,null)}return m.call(this,q,n,r,t)}function m(q,n,r,p){q=Cf(b,q,n,r,p);return a.a?a.a(q):a.call(null,q)}l.O=3;l.R=function(q){var n=N(q);q=O(q);var r=N(q);q=O(q);var p=N(q);q=Bd(q);return m(n,r,p,q)};l.A=m;return l}();h=function(l,m,q,n){switch(arguments.length){case 0:return f.call(this);case 1:return e.call(this,l);case 2:return d.call(this,l,m);case 3:return c.call(this,l,m,q);default:var r=null;if(3<arguments.length){r=0;for(var p=Array(arguments.length-3);r<p.length;)p[r]=
arguments[r+3],++r;r=new Ad(p,0,null)}return k.A(l,m,q,r)}throw Error("Invalid arity: "+arguments.length);};h.O=3;h.R=k.R;h.o=f;h.a=e;h.g=d;h.h=c;h.A=k.A;return h}()};
bg.h=function(a,b,c){return function(){function d(m,q,n){m=c.h?c.h(m,q,n):c.call(null,m,q,n);m=b.a?b.a(m):b.call(null,m);return a.a?a.a(m):a.call(null,m)}function e(m,q){m=c.g?c.g(m,q):c.call(null,m,q);m=b.a?b.a(m):b.call(null,m);return a.a?a.a(m):a.call(null,m)}function f(m){m=c.a?c.a(m):c.call(null,m);m=b.a?b.a(m):b.call(null,m);return a.a?a.a(m):a.call(null,m)}function h(){var m=c.o?c.o():c.call(null);m=b.a?b.a(m):b.call(null,m);return a.a?a.a(m):a.call(null,m)}var k=null,l=function(){function m(n,
r,p,t){var x=null;if(3<arguments.length){x=0;for(var v=Array(arguments.length-3);x<v.length;)v[x]=arguments[x+3],++x;x=new Ad(v,0,null)}return q.call(this,n,r,p,x)}function q(n,r,p,t){n=Cf(c,n,r,p,t);n=b.a?b.a(n):b.call(null,n);return a.a?a.a(n):a.call(null,n)}m.O=3;m.R=function(n){var r=N(n);n=O(n);var p=N(n);n=O(n);var t=N(n);n=Bd(n);return q(r,p,t,n)};m.A=q;return m}();k=function(m,q,n,r){switch(arguments.length){case 0:return h.call(this);case 1:return f.call(this,m);case 2:return e.call(this,
m,q);case 3:return d.call(this,m,q,n);default:var p=null;if(3<arguments.length){p=0;for(var t=Array(arguments.length-3);p<t.length;)t[p]=arguments[p+3],++p;p=new Ad(t,0,null)}return l.A(m,q,n,p)}throw Error("Invalid arity: "+arguments.length);};k.O=3;k.R=l.R;k.o=h;k.a=f;k.g=e;k.h=d;k.A=l.A;return k}()};
bg.A=function(a,b,c,d){return function(e){return function(){function f(k){var l=null;if(0<arguments.length){l=0;for(var m=Array(arguments.length-0);l<m.length;)m[l]=arguments[l+0],++l;l=new Ad(m,0,null)}return h.call(this,l)}function h(k){k=zf(N(e),k);for(var l=O(e);;)if(l){var m=N(l);k=m.a?m.a(k):m.call(null,k);l=O(l)}else return k}f.O=0;f.R=function(k){k=M(k);return h(k)};f.A=h;return f}()}(Ye(ce(a,ce(b,ce(c,d)))))};
bg.R=function(a){var b=N(a),c=O(a);a=N(c);var d=O(c);c=N(d);d=O(d);return this.A(b,a,c,d)};bg.O=3;
function cg(a,b){return function(){function c(l,m,q){return a.J?a.J(b,l,m,q):a.call(null,b,l,m,q)}function d(l,m){return a.h?a.h(b,l,m):a.call(null,b,l,m)}function e(l){return a.g?a.g(b,l):a.call(null,b,l)}function f(){return a.a?a.a(b):a.call(null,b)}var h=null,k=function(){function l(q,n,r,p){var t=null;if(3<arguments.length){t=0;for(var x=Array(arguments.length-3);t<x.length;)x[t]=arguments[t+3],++t;t=new Ad(x,0,null)}return m.call(this,q,n,r,t)}function m(q,n,r,p){return Df(a,b,q,n,r,R([p]))}
l.O=3;l.R=function(q){var n=N(q);q=O(q);var r=N(q);q=O(q);var p=N(q);q=Bd(q);return m(n,r,p,q)};l.A=m;return l}();h=function(l,m,q,n){switch(arguments.length){case 0:return f.call(this);case 1:return e.call(this,l);case 2:return d.call(this,l,m);case 3:return c.call(this,l,m,q);default:var r=null;if(3<arguments.length){r=0;for(var p=Array(arguments.length-3);r<p.length;)p[r]=arguments[r+3],++r;r=new Ad(p,0,null)}return k.A(l,m,q,r)}throw Error("Invalid arity: "+arguments.length);};h.O=3;h.R=k.R;h.o=
f;h.a=e;h.g=d;h.h=c;h.A=k.A;return h}()}function dg(a,b){return function f(d,e){return new ef(null,function(){var h=M(e);if(h){if(Ce(h)){for(var k=cd(h),l=Q(k),m=jf(l),q=0;;)if(q<l)mf(m,function(){var n=d+q,r=ic.g(k,q);return a.g?a.g(n,r):a.call(null,n,r)}()),q+=1;else break;return lf(m.za(),f(d+l,dd(h)))}return ce(function(){var n=N(h);return a.g?a.g(d,n):a.call(null,d,n)}(),f(d+1,Bd(h)))}return null},null,null)}(0,b)}
function eg(a){this.state=a;this.lf=this.dg=this.B=null;this.I=16386;this.l=6455296}g=eg.prototype;g.equiv=function(a){return this.H(null,a)};g.H=function(a,b){return this===b};g.Xc=function(){return this.state};g.S=function(){return this.B};g.Y=function(){return qa(this)};function fg(a){return new eg(a)}
function gg(a,b){if(a instanceof eg){var c=a.dg;if(null!=c&&!B(c.a?c.a(b):c.call(null,b)))throw Error("Validator rejected reference state");c=a.state;a.state=b;if(null!=a.lf)a:for(var d=M(a.lf),e=null,f=0,h=0;;)if(h<f){var k=e.P(null,h),l=S(k,0,null);k=S(k,1,null);k.J?k.J(l,a,c,b):k.call(null,l,a,c,b);h+=1}else if(d=M(d))Ce(d)?(e=cd(d),d=dd(d),l=e,f=Q(e),e=l):(e=N(d),l=S(e,0,null),k=S(e,1,null),k.J?k.J(l,a,c,b):k.call(null,l,a,c,b),d=O(d),e=null,f=0),h=0;else break a;return b}return gd(a,b)}
var hg=function hg(a){switch(arguments.length){case 2:return hg.g(arguments[0],arguments[1]);case 3:return hg.h(arguments[0],arguments[1],arguments[2]);case 4:return hg.J(arguments[0],arguments[1],arguments[2],arguments[3]);default:for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return hg.A(arguments[0],arguments[1],arguments[2],arguments[3],new Ad(c.slice(4),0,null))}};
hg.g=function(a,b){if(a instanceof eg){var c=a.state;b=b.a?b.a(c):b.call(null,c);a=gg(a,b)}else a=hd.g(a,b);return a};hg.h=function(a,b,c){if(a instanceof eg){var d=a.state;b=b.g?b.g(d,c):b.call(null,d,c);a=gg(a,b)}else a=hd.h(a,b,c);return a};hg.J=function(a,b,c,d){if(a instanceof eg){var e=a.state;b=b.h?b.h(e,c,d):b.call(null,e,c,d);a=gg(a,b)}else a=hd.J(a,b,c,d);return a};hg.A=function(a,b,c,d,e){return a instanceof eg?gg(a,Cf(b,a.state,c,d,e)):hd.ca(a,b,c,d,e)};
hg.R=function(a){var b=N(a),c=O(a);a=N(c);var d=O(c);c=N(d);var e=O(d);d=N(e);e=O(e);return this.A(b,a,c,d,e)};hg.O=4;function ig(a){this.state=a;this.l=32768;this.I=0}ig.prototype.Te=function(a,b){return this.state=b};ig.prototype.Xc=function(){return this.state};function jg(a){var b=Yc(If);id(a,b)}
var kg=function kg(a){switch(arguments.length){case 1:return kg.a(arguments[0]);case 2:return kg.g(arguments[0],arguments[1]);case 3:return kg.h(arguments[0],arguments[1],arguments[2]);case 4:return kg.J(arguments[0],arguments[1],arguments[2],arguments[3]);default:for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return kg.A(arguments[0],arguments[1],arguments[2],arguments[3],new Ad(c.slice(4),0,null))}};
kg.a=function(a){return function(b){return function(){function c(k,l){l=a.a?a.a(l):a.call(null,l);return b.g?b.g(k,l):b.call(null,k,l)}function d(k){return b.a?b.a(k):b.call(null,k)}function e(){return b.o?b.o():b.call(null)}var f=null,h=function(){function k(m,q,n){var r=null;if(2<arguments.length){r=0;for(var p=Array(arguments.length-2);r<p.length;)p[r]=arguments[r+2],++r;r=new Ad(p,0,null)}return l.call(this,m,q,r)}function l(m,q,n){q=Af(a,q,n);return b.g?b.g(m,q):b.call(null,m,q)}k.O=2;k.R=function(m){var q=
N(m);m=O(m);var n=N(m);m=Bd(m);return l(q,n,m)};k.A=l;return k}();f=function(k,l,m){switch(arguments.length){case 0:return e.call(this);case 1:return d.call(this,k);case 2:return c.call(this,k,l);default:var q=null;if(2<arguments.length){q=0;for(var n=Array(arguments.length-2);q<n.length;)n[q]=arguments[q+2],++q;q=new Ad(n,0,null)}return h.A(k,l,q)}throw Error("Invalid arity: "+arguments.length);};f.O=2;f.R=h.R;f.o=e;f.a=d;f.g=c;f.A=h.A;return f}()}};
kg.g=function(a,b){return new ef(null,function(){var c=M(b);if(c){if(Ce(c)){for(var d=cd(c),e=Q(d),f=jf(e),h=0;;)if(h<e)mf(f,function(){var k=ic.g(d,h);return a.a?a.a(k):a.call(null,k)}()),h+=1;else break;return lf(f.za(),kg.g(a,dd(c)))}return ce(function(){var k=N(c);return a.a?a.a(k):a.call(null,k)}(),kg.g(a,Bd(c)))}return null},null,null)};
kg.h=function(a,b,c){return new ef(null,function(){var d=M(b),e=M(c);if(d&&e){var f=N(d);var h=N(e);f=a.g?a.g(f,h):a.call(null,f,h);d=ce(f,kg.h(a,Bd(d),Bd(e)))}else d=null;return d},null,null)};kg.J=function(a,b,c,d){return new ef(null,function(){var e=M(b),f=M(c),h=M(d);if(e&&f&&h){var k=N(e);var l=N(f),m=N(h);k=a.h?a.h(k,l,m):a.call(null,k,l,m);e=ce(k,kg.J(a,Bd(e),Bd(f),Bd(h)))}else e=null;return e},null,null)};
kg.A=function(a,b,c,d,e){var f=function l(k){return new ef(null,function(){var m=kg.g(M,k);return Xf(Qe,m)?ce(kg.g(N,m),l(kg.g(Bd,m))):null},null,null)};return kg.g(function(){return function(k){return zf(a,k)}}(f),f(ie.A(e,d,R([c,b]))))};kg.R=function(a){var b=N(a),c=O(a);a=N(c);var d=O(c);c=N(d);var e=O(d);d=N(e);e=O(e);return this.A(b,a,c,d,e)};kg.O=4;function lg(a,b){return new ef(null,function(){if(0<a){var c=M(b);return c?ce(N(c),lg(a-1,Bd(c))):null}return null},null,null)}
function mg(a,b){return new ef(null,function(c){return function(){return c(a,b)}}(function(c,d){for(;;)if(d=M(d),0<c&&d)--c,d=Bd(d);else return d}),null,null)}function ng(a){return kg.h(function(b){return b},a,mg(2,a))}function og(a,b,c,d,e){this.B=a;this.count=b;this.s=c;this.next=d;this.C=e;this.l=32374988;this.I=1}g=og.prototype;g.toString=function(){return md(this)};g.equiv=function(a){return this.H(null,a)};
g.indexOf=function(){var a=null;a=function(b,c){switch(arguments.length){case 1:return Wd(this,b,0);case 2:return Wd(this,b,c)}throw Error("Invalid arity: "+arguments.length);};a.a=function(b){return Wd(this,b,0)};a.g=function(b,c){return Wd(this,b,c)};return a}();
g.lastIndexOf=function(){function a(c){return Zd(this,c,this.count)}var b=null;b=function(c,d){switch(arguments.length){case 1:return a.call(this,c);case 2:return Zd(this,c,d)}throw Error("Invalid arity: "+arguments.length);};b.a=a;b.g=function(c,d){return Zd(this,c,d)};return b}();g.S=function(){return this.B};g.Ba=function(){return null==this.next?1<this.count?this.next=new og(null,this.count-1,this.s,null,null):-1===this.count?this:null:this.next};
g.Y=function(){var a=this.C;return null!=a?a:this.C=a=Gd(this)};g.H=function(a,b){return be(this,b)};g.ia=function(){return Cd};g.Ca=function(a,b){if(-1===this.count)for(var c=b.g?b.g(this.s,this.s):b.call(null,this.s,this.s);;){if(Md(c))return Dc(c);c=b.g?b.g(c,this.s):b.call(null,c,this.s)}else for(a=1,c=this.s;;)if(a<this.count){c=b.g?b.g(c,this.s):b.call(null,c,this.s);if(Md(c))return Dc(c);a+=1}else return c};
g.Da=function(a,b,c){if(-1===this.count)for(c=b.g?b.g(c,this.s):b.call(null,c,this.s);;){if(Md(c))return Dc(c);c=b.g?b.g(c,this.s):b.call(null,c,this.s)}else for(a=0;;)if(a<this.count){c=b.g?b.g(c,this.s):b.call(null,c,this.s);if(Md(c))return Dc(c);a+=1}else return c};g.Ha=function(){return this.s};g.La=function(){return null==this.next?1<this.count?this.next=new og(null,this.count-1,this.s,null,null):-1===this.count?this:Cd:this.next};g.aa=function(){return this};
g.U=function(a,b){return b===this.B?this:new og(b,this.count,this.s,this.next,null)};g.ea=function(a,b){return ce(b,this)};var pg=function pg(a){switch(arguments.length){case 0:return pg.o();case 1:return pg.a(arguments[0]);case 2:return pg.g(arguments[0],arguments[1]);default:for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return pg.A(arguments[0],arguments[1],new Ad(c.slice(2),0,null))}};pg.o=function(){return Cd};
pg.a=function(a){return new ef(null,function(){return a},null,null)};pg.g=function(a,b){return new ef(null,function(){var c=M(a),d=M(b);return c&&d?ce(N(c),ce(N(d),pg.g(Bd(c),Bd(d)))):null},null,null)};pg.A=function(a,b,c){return new ef(null,function(){var d=kg.g(M,ie.A(c,b,R([a])));return Xf(Qe,d)?qf.g(kg.g(N,d),zf(pg,kg.g(Bd,d))):null},null,null)};pg.R=function(a){var b=N(a),c=O(a);a=N(c);c=O(c);return this.A(b,a,c)};pg.O=2;function qg(a,b){return zf(qf,Af(kg,a,b))}
function rg(a){return function(b){return function(){function c(h,k){return B(a.a?a.a(k):a.call(null,k))?b.g?b.g(h,k):b.call(null,h,k):h}function d(h){return b.a?b.a(h):b.call(null,h)}function e(){return b.o?b.o():b.call(null)}var f=null;f=function(h,k){switch(arguments.length){case 0:return e.call(this);case 1:return d.call(this,h);case 2:return c.call(this,h,k)}throw Error("Invalid arity: "+arguments.length);};f.o=e;f.a=d;f.g=c;return f}()}}
function sg(a,b){return new ef(null,function(){var c=M(b);if(c){if(Ce(c)){for(var d=cd(c),e=Q(d),f=jf(e),h=0;;)if(h<e){var k=ic.g(d,h);k=a.a?a.a(k):a.call(null,k);B(k)&&(k=ic.g(d,h),f.add(k));h+=1}else break;return lf(f.za(),sg(a,dd(c)))}d=N(c);c=Bd(c);return B(a.a?a.a(d):a.call(null,d))?ce(d,sg(a,c)):sg(a,c)}return null},null,null)}function tg(a,b){return sg($f(a),b)}
var ug=function ug(a){switch(arguments.length){case 0:return ug.o();case 1:return ug.a(arguments[0]);case 2:return ug.g(arguments[0],arguments[1]);case 3:return ug.h(arguments[0],arguments[1],arguments[2]);default:throw Error(["Invalid arity: ",I.a(arguments.length)].join(""));}};ug.o=function(){return je};ug.a=function(a){return a};ug.g=function(a,b){return null!=a?null!=a&&(a.I&4||w===a.Oe)?Gc($c(Xb(Zc,Yc(a),b)),ue(a)):Xb(gc,a,b):Xb(ie,Cd,b)};
ug.h=function(a,b,c){return null!=a&&(a.I&4||w===a.Oe)?Gc($c(Se(b,rf,Yc(a),c)),ue(a)):Se(b,ie,a,c)};ug.O=3;function vg(a,b){return $c(Xb(function(c,d){return rf.g(c,a.a?a.a(d):a.call(null,d))},Yc(je),b))}function wg(a,b,c){return new ef(null,function(){var d=M(c);if(d){var e=lg(a,d);return a===Q(e)?ce(e,wg(a,b,mg(b,d))):null}return null},null,null)}function xg(a,b){return Xb(J,a,b)}
var zg=function zg(a,b,c){b=M(b);var e=N(b),f=O(b);return f?ne.h(a,e,function(){var h=J.g(a,e);return zg.h?zg.h(h,f,c):zg.call(null,h,f,c)}()):ne.h(a,e,c)};function Ag(a,b,c){return ne.h(a,b,function(){var d=J.g(a,b);return c.a?c.a(d):c.call(null,d)}())}function Bg(a,b,c){var d=Cg;return ne.h(a,b,function(){var e=J.g(a,b);return d.g?d.g(e,c):d.call(null,e,c)}())}function Dg(a,b){this.oa=a;this.j=b}
function Eg(a){return new Dg(a,[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null])}function Fg(a){a=a.D;return 32>a?0:a-1>>>5<<5}function Gg(a,b,c){for(;;){if(0===b)return c;var d=Eg(a);d.j[0]=c;c=d;b-=5}}var Hg=function Hg(a,b,c,d){var f=new Dg(c.oa,Vb(c.j)),h=a.D-1>>>b&31;5===b?f.j[h]=d:(c=c.j[h],null!=c?(b-=5,a=Hg.J?Hg.J(a,b,c,d):Hg.call(null,a,b,c,d)):a=Gg(null,b-5,d),f.j[h]=a);return f};
function Ig(a,b){throw Error(["No item ",I.a(a)," in vector of length ",I.a(b)].join(""));}function Jg(a,b){if(b>=Fg(a))return a.la;var c=a.root;for(a=a.shift;;)if(0<a){var d=a-5;c=c.j[b>>>a&31];a=d}else return c.j}function Kg(a,b){return 0<=b&&b<a.D?Jg(a,b):Ig(b,a.D)}var Lg=function Lg(a,b,c,d,e){var h=new Dg(c.oa,Vb(c.j));if(0===b)h.j[d&31]=e;else{var k=d>>>b&31;b-=5;c=c.j[k];a=Lg.ca?Lg.ca(a,b,c,d,e):Lg.call(null,a,b,c,d,e);h.j[k]=a}return h};
function Mg(a,b,c,d,e,f){this.F=a;this.ud=b;this.j=c;this.Fa=d;this.start=e;this.end=f}Mg.prototype.ka=function(){return this.F<this.end};Mg.prototype.next=function(){32===this.F-this.ud&&(this.j=Jg(this.Fa,this.F),this.ud+=32);var a=this.j[this.F&31];this.F+=1;return a};function Ng(a,b,c){return new Mg(b,b-b%32,b<Q(a)?Jg(a,b):null,a,b,c)}function Og(a,b,c,d){return c<d?Pg(a,b,Xd(a,c),c+1,d):b.o?b.o():b.call(null)}
function Pg(a,b,c,d,e){var f=c;c=d;for(d=Jg(a,d);;)if(c<e){var h=c&31;d=0===h?Jg(a,c):d;h=d[h];f=b.g?b.g(f,h):b.call(null,f,h);if(Md(f))return Dc(f);c+=1}else return f}function V(a,b,c,d,e,f){this.B=a;this.D=b;this.shift=c;this.root=d;this.la=e;this.C=f;this.l=167666463;this.I=139268}g=V.prototype;g.kc=w;g.Zb=function(a,b){return 0<=b&&b<this.D?new Le(b,Jg(this,b)[b&31],null):null};g.toString=function(){return md(this)};g.equiv=function(a){return this.H(null,a)};
g.indexOf=function(){var a=null;a=function(b,c){switch(arguments.length){case 1:return Wd(this,b,0);case 2:return Wd(this,b,c)}throw Error("Invalid arity: "+arguments.length);};a.a=function(b){return Wd(this,b,0)};a.g=function(b,c){return Wd(this,b,c)};return a}();
g.lastIndexOf=function(){function a(c){return Zd(this,c,Q(this))}var b=null;b=function(c,d){switch(arguments.length){case 1:return a.call(this,c);case 2:return Zd(this,c,d)}throw Error("Invalid arity: "+arguments.length);};b.a=a;b.g=function(c,d){return Zd(this,c,d)};return b}();g.V=function(a,b){return this.K(null,b,null)};g.K=function(a,b,c){return"number"===typeof b?this.ha(null,b,c):c};
g.yb=function(a,b,c){a=0;for(var d=c;;)if(a<this.D){var e=Jg(this,a);c=e.length;a:for(var f=0;;)if(f<c){var h=f+a,k=e[f];d=b.h?b.h(d,h,k):b.call(null,d,h,k);if(Md(d)){e=d;break a}f+=1}else{e=d;break a}if(Md(e))return Dc(e);a+=c;d=e}else return d};g.ce=w;g.P=function(a,b){return Kg(this,b)[b&31]};g.ha=function(a,b,c){return 0<=b&&b<this.D?Jg(this,b)[b&31]:c};
g.Gb=function(a,b,c){if(0<=b&&b<this.D)return Fg(this)<=b?(a=Vb(this.la),a[b&31]=c,new V(this.B,this.D,this.shift,this.root,a,null)):new V(this.B,this.D,this.shift,Lg(this,this.shift,this.root,b,c),this.la,null);if(b===this.D)return this.ea(null,c);throw Error(["Index ",I.a(b)," out of bounds  [0,",I.a(this.D),"]"].join(""));};g.Ka=function(){return Ng(this,0,this.D)};g.S=function(){return this.B};g.Ga=function(){return new V(this.B,this.D,this.shift,this.root,this.la,this.C)};g.Z=function(){return this.D};
g.$b=function(){return 0<this.D?this.P(null,this.D-1):null};g.Fb=function(){return 0<this.D?new ae(this,this.D-1,null):null};g.Y=function(){var a=this.C;return null!=a?a:this.C=a=Gd(this)};g.H=function(a,b){if(b instanceof V)if(this.D===Q(b))for(a=this.Ka(null),b=b.Ka(null);;)if(a.ka()){var c=a.next(),d=b.next();if(!Dd.g(c,d))return!1}else return!0;else return!1;else return be(this,b)};
g.Gc=function(){return new Qg(this.D,this.shift,Rg.a?Rg.a(this.root):Rg.call(null,this.root),Sg.a?Sg.a(this.la):Sg.call(null,this.la))};g.ia=function(){return Gc(je,this.B)};g.Ca=function(a,b){return Og(this,b,0,this.D)};g.Da=function(a,b,c){a=0;for(var d=c;;)if(a<this.D){var e=Jg(this,a);c=e.length;a:for(var f=0;;)if(f<c){var h=e[f];d=b.g?b.g(d,h):b.call(null,d,h);if(Md(d)){e=d;break a}f+=1}else{e=d;break a}if(Md(e))return Dc(e);a+=c;d=e}else return d};
g.Aa=function(a,b,c){if("number"===typeof b)return this.Gb(null,b,c);throw Error("Vector's key for assoc must be a number.");};g.Yb=function(a,b){return Ie(b)?0<=b&&b<this.D:!1};g.aa=function(){if(0===this.D)return null;if(32>=this.D)return new Ad(this.la,0,null);a:{var a=this.root;for(var b=this.shift;;)if(0<b)b-=5,a=a.j[0];else{a=a.j;break a}}return Tg?Tg(this,a,0,0):Ug.call(null,this,a,0,0)};g.U=function(a,b){return b===this.B?this:new V(b,this.D,this.shift,this.root,this.la,this.C)};
g.ea=function(a,b){if(32>this.D-Fg(this)){a=this.la.length;for(var c=Array(a+1),d=0;;)if(d<a)c[d]=this.la[d],d+=1;else break;c[a]=b;return new V(this.B,this.D+1,this.shift,this.root,c,null)}a=(c=this.D>>>5>1<<this.shift)?this.shift+5:this.shift;c?(c=Eg(null),c.j[0]=this.root,d=Gg(null,this.shift,new Dg(null,this.la)),c.j[1]=d):c=Hg(this,this.shift,this.root,new Dg(null,this.la));return new V(this.B,this.D+1,a,c,[b],null)};
g.call=function(){var a=null;a=function(b,c,d){switch(arguments.length){case 2:return this.P(null,c);case 3:return this.ha(null,c,d)}throw Error("Invalid arity: "+(arguments.length-1));};a.g=function(b,c){return this.P(null,c)};a.h=function(b,c,d){return this.ha(null,c,d)};return a}();g.apply=function(a,b){return this.call.apply(this,[this].concat(Vb(b)))};g.a=function(a){return this.P(null,a)};g.g=function(a,b){return this.ha(null,a,b)};
var X=new Dg(null,[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null]),je=new V(null,0,5,X,[],Hd);function Vg(a){var b=a.length;if(32>b)return new V(null,b,5,X,a,null);for(var c=32,d=(new V(null,32,5,X,a.slice(0,32),null)).Gc(null);;)if(c<b){var e=c+1;d=rf.g(d,a[c]);c=e}else return $c(d)}V.prototype[Ub]=function(){return Fd(this)};
function Wg(a){return B(Xg.a?Xg.a(a):Xg.call(null,a))?new V(null,2,5,X,[Yg.a?Yg.a(a):Yg.call(null,a),Zg.a?Zg.a(a):Zg.call(null,a)],null):Be(a)?te(a,null):Nb(a)?Vg(a):$c(Xb(Zc,Yc(je),a))}var $g=function $g(a){for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return $g.A(0<c.length?new Ad(c.slice(0),0,null):null)};$g.A=function(a){return a instanceof Ad&&0===a.F?Vg(a.j):Wg(a)};$g.O=0;$g.R=function(a){return this.A(M(a))};
function ah(a,b,c,d,e,f){this.sb=a;this.node=b;this.F=c;this.Oa=d;this.B=e;this.C=f;this.l=32375020;this.I=1536}g=ah.prototype;g.toString=function(){return md(this)};g.equiv=function(a){return this.H(null,a)};g.indexOf=function(){var a=null;a=function(b,c){switch(arguments.length){case 1:return Wd(this,b,0);case 2:return Wd(this,b,c)}throw Error("Invalid arity: "+arguments.length);};a.a=function(b){return Wd(this,b,0)};a.g=function(b,c){return Wd(this,b,c)};return a}();
g.lastIndexOf=function(){function a(c){return Zd(this,c,Q(this))}var b=null;b=function(c,d){switch(arguments.length){case 1:return a.call(this,c);case 2:return Zd(this,c,d)}throw Error("Invalid arity: "+arguments.length);};b.a=a;b.g=function(c,d){return Zd(this,c,d)};return b}();g.S=function(){return this.B};g.Ba=function(){if(this.Oa+1<this.node.length){var a=this.sb;var b=this.node,c=this.F,d=this.Oa+1;a=Tg?Tg(a,b,c,d):Ug.call(null,a,b,c,d);return null==a?null:a}return this.ee()};
g.Y=function(){var a=this.C;return null!=a?a:this.C=a=Gd(this)};g.H=function(a,b){return be(this,b)};g.ia=function(){return Cd};g.Ca=function(a,b){return Og(this.sb,b,this.F+this.Oa,Q(this.sb))};g.Da=function(a,b,c){return Pg(this.sb,b,c,this.F+this.Oa,Q(this.sb))};g.Ha=function(){return this.node[this.Oa]};g.La=function(){if(this.Oa+1<this.node.length){var a=this.sb;var b=this.node,c=this.F,d=this.Oa+1;a=Tg?Tg(a,b,c,d):Ug.call(null,a,b,c,d);return null==a?Cd:a}return this.Fc(null)};g.aa=function(){return this};
g.xd=function(){var a=this.node;return new hf(a,this.Oa,a.length)};g.Fc=function(){var a=this.F+this.node.length;if(a<cc(this.sb)){var b=this.sb,c=Jg(this.sb,a);return Tg?Tg(b,c,a,0):Ug.call(null,b,c,a,0)}return Cd};g.U=function(a,b){return b===this.B?this:bh?bh(this.sb,this.node,this.F,this.Oa,b):Ug.call(null,this.sb,this.node,this.F,this.Oa,b)};g.ea=function(a,b){return ce(b,this)};
g.ee=function(){var a=this.F+this.node.length;if(a<cc(this.sb)){var b=this.sb,c=Jg(this.sb,a);return Tg?Tg(b,c,a,0):Ug.call(null,b,c,a,0)}return null};ah.prototype[Ub]=function(){return Fd(this)};
function Ug(a){switch(arguments.length){case 3:var b=arguments[0],c=arguments[1],d=arguments[2];return new ah(b,Kg(b,c),c,d,null,null);case 4:return Tg(arguments[0],arguments[1],arguments[2],arguments[3]);case 5:return bh(arguments[0],arguments[1],arguments[2],arguments[3],arguments[4]);default:throw Error(["Invalid arity: ",I.a(arguments.length)].join(""));}}function Tg(a,b,c,d){return new ah(a,b,c,d,null,null)}function bh(a,b,c,d,e){return new ah(a,b,c,d,e,null)}
function ch(a,b,c,d,e){this.B=a;this.Fa=b;this.start=c;this.end=d;this.C=e;this.l=167666463;this.I=139264}g=ch.prototype;g.kc=w;g.Zb=function(a,b){if(0>b)return null;a=this.start+b;return a<this.end?new Le(b,pc.g(this.Fa,a),null):null};g.toString=function(){return md(this)};g.equiv=function(a){return this.H(null,a)};
g.indexOf=function(){var a=null;a=function(b,c){switch(arguments.length){case 1:return Wd(this,b,0);case 2:return Wd(this,b,c)}throw Error("Invalid arity: "+arguments.length);};a.a=function(b){return Wd(this,b,0)};a.g=function(b,c){return Wd(this,b,c)};return a}();
g.lastIndexOf=function(){function a(c){return Zd(this,c,Q(this))}var b=null;b=function(c,d){switch(arguments.length){case 1:return a.call(this,c);case 2:return Zd(this,c,d)}throw Error("Invalid arity: "+arguments.length);};b.a=a;b.g=function(c,d){return Zd(this,c,d)};return b}();g.V=function(a,b){return this.K(null,b,null)};g.K=function(a,b,c){return"number"===typeof b?this.ha(null,b,c):c};
g.yb=function(a,b,c){a=this.start;for(var d=0;;)if(a<this.end){var e=d,f=ic.g(this.Fa,a);c=b.h?b.h(c,e,f):b.call(null,c,e,f);if(Md(c))return Dc(c);d+=1;a+=1}else return c};g.P=function(a,b){return 0>b||this.end<=this.start+b?Ig(b,this.end-this.start):ic.g(this.Fa,this.start+b)};g.ha=function(a,b,c){return 0>b||this.end<=this.start+b?c:ic.h(this.Fa,this.start+b,c)};
g.Gb=function(a,b,c){a=this.start+b;if(0>b||this.end+1<=a)throw Error(["Index ",I.a(b)," out of bounds [0,",I.a(this.Z(null)),"]"].join(""));b=this.B;c=ne.h(this.Fa,a,c);var d=this.start,e=this.end;a+=1;a=e>a?e:a;return dh.ca?dh.ca(b,c,d,a,null):dh.call(null,b,c,d,a,null)};g.Ka=function(){return null!=this.Fa&&w===this.Fa.ce?Ng(this.Fa,this.start,this.end):new Nf(this)};g.S=function(){return this.B};g.Ga=function(){return new ch(this.B,this.Fa,this.start,this.end,this.C)};
g.Z=function(){return this.end-this.start};g.$b=function(){return ic.g(this.Fa,this.end-1)};g.Fb=function(){return this.start!==this.end?new ae(this,this.end-this.start-1,null):null};g.Y=function(){var a=this.C;return null!=a?a:this.C=a=Gd(this)};g.H=function(a,b){return be(this,b)};g.ia=function(){return Gc(je,this.B)};g.Ca=function(a,b){return null!=this.Fa&&w===this.Fa.ce?Og(this.Fa,b,this.start,this.end):Pd(this,b)};
g.Da=function(a,b,c){return null!=this.Fa&&w===this.Fa.ce?Pg(this.Fa,b,c,this.start,this.end):Qd(this,b,c)};g.Aa=function(a,b,c){if("number"===typeof b)return this.Gb(null,b,c);throw Error("Subvec's key for assoc must be a number.");};g.aa=function(){var a=this;return function(b){return function e(d){return d===a.end?null:ce(ic.g(a.Fa,d),new ef(null,function(){return function(){return e(d+1)}}(b),null,null))}}(this)(a.start)};
g.U=function(a,b){return b===this.B?this:dh.ca?dh.ca(b,this.Fa,this.start,this.end,this.C):dh.call(null,b,this.Fa,this.start,this.end,this.C)};g.ea=function(a,b){a=this.B;b=Cc(this.Fa,this.end,b);var c=this.start,d=this.end+1;return dh.ca?dh.ca(a,b,c,d,null):dh.call(null,a,b,c,d,null)};
g.call=function(){var a=null;a=function(b,c,d){switch(arguments.length){case 2:return this.P(null,c);case 3:return this.ha(null,c,d)}throw Error("Invalid arity: "+(arguments.length-1));};a.g=function(b,c){return this.P(null,c)};a.h=function(b,c,d){return this.ha(null,c,d)};return a}();g.apply=function(a,b){return this.call.apply(this,[this].concat(Vb(b)))};g.a=function(a){return this.P(null,a)};g.g=function(a,b){return this.ha(null,a,b)};ch.prototype[Ub]=function(){return Fd(this)};
function dh(a,b,c,d,e){for(;;)if(b instanceof ch)c=b.start+c,d=b.start+d,b=b.Fa;else{if(!Be(b))throw Error("v must satisfy IVector");var f=Q(b);if(0>c||0>d||c>f||d>f)throw Error("Index out of bounds");return new ch(a,b,c,d,e)}}function eh(a,b,c){return dh(null,a,b|0,c|0,null)}function fh(a,b){return a===b.oa?b:new Dg(a,Vb(b.j))}function Rg(a){return new Dg({},Vb(a.j))}
function Sg(a){var b=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];De(a,0,b,0,a.length);return b}var gh=function gh(a,b,c,d){c=fh(a.root.oa,c);var f=a.D-1>>>b&31;if(5===b)a=d;else{var h=c.j[f];null!=h?(b-=5,a=gh.J?gh.J(a,b,h,d):gh.call(null,a,b,h,d)):a=Gg(a.root.oa,b-5,d)}c.j[f]=a;return c};function Qg(a,b,c,d){this.D=a;this.shift=b;this.root=c;this.la=d;this.I=88;this.l=275}g=Qg.prototype;
g.Ic=function(a,b){if(this.root.oa){if(32>this.D-Fg(this))this.la[this.D&31]=b;else{a=new Dg(this.root.oa,this.la);var c=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];c[0]=b;this.la=c;this.D>>>5>1<<this.shift?(b=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],c=this.shift+
5,b[0]=this.root,b[1]=Gg(this.root.oa,this.shift,a),this.root=new Dg(this.root.oa,b),this.shift=c):this.root=gh(this,this.shift,this.root,a)}this.D+=1;return this}throw Error("conj! after persistent!");};g.ad=function(){if(this.root.oa){this.root.oa=null;var a=this.D-Fg(this),b=Array(a);De(this.la,0,b,0,a);return new V(null,this.D,this.shift,this.root,b,null)}throw Error("persistent! called twice");};
g.Hc=function(a,b,c){if("number"===typeof b)return hh(this,b,c);throw Error("TransientVector's key for assoc! must be a number.");};
function hh(a,b,c){if(a.root.oa){if(0<=b&&b<a.D){if(Fg(a)<=b)a.la[b&31]=c;else{var d=function(){return function(){return function k(f,h){h=fh(a.root.oa,h);if(0===f)h.j[b&31]=c;else{var l=b>>>f&31;f=k(f-5,h.j[l]);h.j[l]=f}return h}}(a)(a.shift,a.root)}();a.root=d}return a}if(b===a.D)return a.Ic(null,c);throw Error(["Index ",I.a(b)," out of bounds for TransientVector of length",I.a(a.D)].join(""));}throw Error("assoc! after persistent!");}
g.Z=function(){if(this.root.oa)return this.D;throw Error("count after persistent!");};g.P=function(a,b){if(this.root.oa)return Kg(this,b)[b&31];throw Error("nth after persistent!");};g.ha=function(a,b,c){return 0<=b&&b<this.D?this.P(null,b):c};g.V=function(a,b){return this.K(null,b,null)};g.K=function(a,b,c){return"number"===typeof b?this.ha(null,b,c):c};
g.call=function(){var a=null;a=function(b,c,d){switch(arguments.length){case 2:return this.V(null,c);case 3:return this.K(null,c,d)}throw Error("Invalid arity: "+(arguments.length-1));};a.g=function(b,c){return this.V(null,c)};a.h=function(b,c,d){return this.K(null,c,d)};return a}();g.apply=function(a,b){return this.call.apply(this,[this].concat(Vb(b)))};g.a=function(a){return this.V(null,a)};g.g=function(a,b){return this.K(null,a,b)};function ih(a,b){this.Kc=a;this.rd=b}
ih.prototype.ka=function(){var a=null!=this.Kc&&M(this.Kc);return a?a:(a=null!=this.rd)?this.rd.ka():a};ih.prototype.next=function(){if(null!=this.Kc){var a=N(this.Kc);this.Kc=O(this.Kc);return a}if(null!=this.rd&&this.rd.ka())return this.rd.next();throw Error("No such element");};ih.prototype.remove=function(){return Error("Unsupported operation")};function jh(a,b,c,d){this.B=a;this.jb=b;this.wb=c;this.C=d;this.l=31850700;this.I=0}g=jh.prototype;g.toString=function(){return md(this)};
g.equiv=function(a){return this.H(null,a)};g.indexOf=function(){var a=null;a=function(b,c){switch(arguments.length){case 1:return Wd(this,b,0);case 2:return Wd(this,b,c)}throw Error("Invalid arity: "+arguments.length);};a.a=function(b){return Wd(this,b,0)};a.g=function(b,c){return Wd(this,b,c)};return a}();
g.lastIndexOf=function(){function a(c){return Zd(this,c,Q(this))}var b=null;b=function(c,d){switch(arguments.length){case 1:return a.call(this,c);case 2:return Zd(this,c,d)}throw Error("Invalid arity: "+arguments.length);};b.a=a;b.g=function(c,d){return Zd(this,c,d)};return b}();g.S=function(){return this.B};g.Ba=function(){var a=O(this.jb);return a?new jh(this.B,a,this.wb,null):null!=this.wb?new jh(this.B,this.wb,null,null):null};g.Y=function(){var a=this.C;return null!=a?a:this.C=a=Gd(this)};
g.H=function(a,b){return be(this,b)};g.ia=function(){return Gc(Cd,this.B)};g.Ha=function(){return N(this.jb)};g.La=function(){var a=O(this.jb);return a?new jh(this.B,a,this.wb,null):null==this.wb?this.ia(null):new jh(this.B,this.wb,null,null)};g.aa=function(){return this};g.U=function(a,b){return b===this.B?this:new jh(b,this.jb,this.wb,this.C)};g.ea=function(a,b){return ce(b,this)};jh.prototype[Ub]=function(){return Fd(this)};
function kh(a,b,c,d,e){this.B=a;this.count=b;this.jb=c;this.wb=d;this.C=e;this.I=139264;this.l=31858766}g=kh.prototype;g.toString=function(){return md(this)};g.equiv=function(a){return this.H(null,a)};g.indexOf=function(){var a=null;a=function(b,c){switch(arguments.length){case 1:return Wd(this,b,0);case 2:return Wd(this,b,c)}throw Error("Invalid arity: "+arguments.length);};a.a=function(b){return Wd(this,b,0)};a.g=function(b,c){return Wd(this,b,c)};return a}();
g.lastIndexOf=function(){function a(c){return Zd(this,c,this.count.a?this.count.a(this):this.count.call(null,this))}var b=null;b=function(c,d){switch(arguments.length){case 1:return a.call(this,c);case 2:return Zd(this,c,d)}throw Error("Invalid arity: "+arguments.length);};b.a=a;b.g=function(c,d){return Zd(this,c,d)};return b}();g.Ka=function(){return new ih(this.jb,kd(this.wb))};g.S=function(){return this.B};g.Ga=function(){return new kh(this.B,this.count,this.jb,this.wb,this.C)};g.Z=function(){return this.count};
g.$b=function(){return N(this.jb)};g.Y=function(){var a=this.C;return null!=a?a:this.C=a=Gd(this)};g.H=function(a,b){return be(this,b)};g.ia=function(){return Gc(lh,this.B)};g.Ha=function(){return N(this.jb)};g.La=function(){return Bd(M(this))};g.aa=function(){var a=M(this.wb),b=this.jb;return B(B(b)?b:a)?new jh(null,this.jb,M(a),null):null};g.U=function(a,b){return b===this.B?this:new kh(b,this.count,this.jb,this.wb,this.C)};
g.ea=function(a,b){B(this.jb)?(a=this.wb,b=new kh(this.B,this.count+1,this.jb,ie.g(B(a)?a:je,b),null)):b=new kh(this.B,this.count+1,ie.g(this.jb,b),je,null);return b};var lh=new kh(null,0,null,je,Hd);kh.prototype[Ub]=function(){return Fd(this)};function mh(){this.l=2097152;this.I=0}mh.prototype.equiv=function(a){return this.H(null,a)};mh.prototype.H=function(){return!1};var nh=new mh;
function oh(a,b){return Ge(ze(b)&&!Ae(b)?Q(a)===Q(b)?(null!=a?a.l&1048576||w===a.vf||(a.l?0:Qb(Jc,a)):Qb(Jc,a))?Pe(function(c,d,e){return Dd.g(J.h(b,d,nh),e)?!0:Ld(!1)},!0,a):Xf(function(c){return Dd.g(J.h(b,N(c),nh),N(O(c)))},a):null:null)}function ph(a,b,c,d){this.F=0;this.ag=a;this.Ke=b;this.If=c;this.Xe=d}ph.prototype.ka=function(){var a=this.F<this.Ke;return a?a:this.Xe.ka()};ph.prototype.next=function(){if(this.F<this.Ke){var a=Xd(this.If,this.F);this.F+=1;return new Le(a,pc.g(this.ag,a),null)}return this.Xe.next()};
ph.prototype.remove=function(){return Error("Unsupported operation")};function qh(a){this.X=a}qh.prototype.next=function(){if(null!=this.X){var a=N(this.X),b=S(a,0,null);a=S(a,1,null);this.X=O(this.X);return{value:[b,a],done:!1}}return{value:null,done:!0}};function rh(a){this.X=a}rh.prototype.next=function(){if(null!=this.X){var a=N(this.X);this.X=O(this.X);return{value:[a,a],done:!1}}return{value:null,done:!0}};
function sh(a,b){if(b instanceof K)a:{var c=a.length;b=b.cb;for(var d=0;;){if(c<=d){a=-1;break a}if(a[d]instanceof K&&b===a[d].cb){a=d;break a}d+=2}}else if(ia(b)||"number"===typeof b)a:for(c=a.length,d=0;;){if(c<=d){a=-1;break a}if(b===a[d]){a=d;break a}d+=2}else if(b instanceof xd)a:for(c=a.length,b=b.nb,d=0;;){if(c<=d){a=-1;break a}if(a[d]instanceof xd&&b===a[d].nb){a=d;break a}d+=2}else if(null==b)a:for(b=a.length,c=0;;){if(b<=c){a=-1;break a}if(null==a[c]){a=c;break a}c+=2}else a:for(c=a.length,
d=0;;){if(c<=d){a=-1;break a}if(Dd.g(b,a[d])){a=d;break a}d+=2}return a}function Le(a,b,c){this.key=a;this.s=b;this.C=c;this.l=166619935;this.I=0}g=Le.prototype;g.kc=w;g.Zb=function(a,b){switch(b){case 0:return new Le(0,this.key,null);case 1:return new Le(1,this.s,null);default:return null}};
g.indexOf=function(){var a=null;a=function(b,c){switch(arguments.length){case 1:return Wd(this,b,0);case 2:return Wd(this,b,c)}throw Error("Invalid arity: "+arguments.length);};a.a=function(b){return Wd(this,b,0)};a.g=function(b,c){return Wd(this,b,c)};return a}();
g.lastIndexOf=function(){function a(c){return Zd(this,c,Q(this))}var b=null;b=function(c,d){switch(arguments.length){case 1:return a.call(this,c);case 2:return Zd(this,c,d)}throw Error("Invalid arity: "+arguments.length);};b.a=a;b.g=function(c,d){return Zd(this,c,d)};return b}();g.V=function(a,b){return this.ha(null,b,null)};g.K=function(a,b,c){return this.ha(null,b,c)};g.P=function(a,b){if(0===b)return this.key;if(1===b)return this.s;throw Error("Index out of bounds");};
g.ha=function(a,b,c){return 0===b?this.key:1===b?this.s:c};g.Gb=function(a,b,c){return(new V(null,2,5,X,[this.key,this.s],null)).Gb(null,b,c)};g.S=function(){return null};g.Z=function(){return 2};g.he=function(){return this.key};g.ie=function(){return this.s};g.$b=function(){return this.s};g.Fb=function(){return new Ad([this.s,this.key],0,null)};g.Y=function(){var a=this.C;return null!=a?a:this.C=a=Gd(this)};g.H=function(a,b){return be(this,b)};g.ia=function(){return null};
g.Ca=function(a,b){return Pd(this,b)};g.Da=function(a,b,c){return Qd(this,b,c)};g.Aa=function(a,b,c){return ne.h(new V(null,2,5,X,[this.key,this.s],null),b,c)};g.Yb=function(a,b){return 0===b||1===b};g.aa=function(){return new Ad([this.key,this.s],0,null)};g.U=function(a,b){return te(new V(null,2,5,X,[this.key,this.s],null),b)};g.ea=function(a,b){return new V(null,3,5,X,[this.key,this.s,b],null)};
g.call=function(){var a=null;a=function(b,c,d){switch(arguments.length){case 2:return this.P(null,c);case 3:return this.ha(null,c,d)}throw Error("Invalid arity: "+(arguments.length-1));};a.g=function(b,c){return this.P(null,c)};a.h=function(b,c,d){return this.ha(null,c,d)};return a}();g.apply=function(a,b){return this.call.apply(this,[this].concat(Vb(b)))};g.a=function(a){return this.P(null,a)};g.g=function(a,b){return this.ha(null,a,b)};function Xg(a){return null!=a?a.l&2048||w===a.ng?!0:!1:!1}
function th(a,b,c){this.j=a;this.F=b;this.Sb=c;this.l=32374990;this.I=0}g=th.prototype;g.toString=function(){return md(this)};g.equiv=function(a){return this.H(null,a)};g.indexOf=function(){var a=null;a=function(b,c){switch(arguments.length){case 1:return Wd(this,b,0);case 2:return Wd(this,b,c)}throw Error("Invalid arity: "+arguments.length);};a.a=function(b){return Wd(this,b,0)};a.g=function(b,c){return Wd(this,b,c)};return a}();
g.lastIndexOf=function(){function a(c){return Zd(this,c,Q(this))}var b=null;b=function(c,d){switch(arguments.length){case 1:return a.call(this,c);case 2:return Zd(this,c,d)}throw Error("Invalid arity: "+arguments.length);};b.a=a;b.g=function(c,d){return Zd(this,c,d)};return b}();g.S=function(){return this.Sb};g.Ba=function(){return this.F<this.j.length-2?new th(this.j,this.F+2,null):null};g.Z=function(){return(this.j.length-this.F)/2};g.Y=function(){return Gd(this)};
g.H=function(a,b){return be(this,b)};g.ia=function(){return Cd};g.Ca=function(a,b){return ee(b,this)};g.Da=function(a,b,c){return ge(b,c,this)};g.Ha=function(){return new Le(this.j[this.F],this.j[this.F+1],null)};g.La=function(){return this.F<this.j.length-2?new th(this.j,this.F+2,null):Cd};g.aa=function(){return this};g.U=function(a,b){return b===this.Sb?this:new th(this.j,this.F,b)};g.ea=function(a,b){return ce(b,this)};th.prototype[Ub]=function(){return Fd(this)};
function uh(a,b){this.j=a;this.F=0;this.D=b}uh.prototype.ka=function(){return this.F<this.D};uh.prototype.next=function(){var a=new Le(this.j[this.F],this.j[this.F+1],null);this.F+=2;return a};function Fb(a,b,c,d){this.B=a;this.D=b;this.j=c;this.C=d;this.l=16647951;this.I=139268}g=Fb.prototype;g.kc=w;g.Zb=function(a,b){a=sh(this.j,b);return-1===a?null:new Le(this.j[a],this.j[a+1],null)};g.toString=function(){return md(this)};g.equiv=function(a){return this.H(null,a)};
g.keys=function(){return Fd(vh.a?vh.a(this):vh.call(null,this))};g.entries=function(){return new qh(M(M(this)))};g.values=function(){return Fd(wh.a?wh.a(this):wh.call(null,this))};g.has=function(a){return Je(this,a)};g.get=function(a,b){return this.K(null,a,b)};
g.forEach=function(a){for(var b=M(this),c=null,d=0,e=0;;)if(e<d){var f=c.P(null,e),h=S(f,0,null);f=S(f,1,null);a.g?a.g(f,h):a.call(null,f,h);e+=1}else if(b=M(b))Ce(b)?(c=cd(b),b=dd(b),h=c,d=Q(c),c=h):(c=N(b),h=S(c,0,null),f=S(c,1,null),a.g?a.g(f,h):a.call(null,f,h),b=O(b),c=null,d=0),e=0;else return null};g.V=function(a,b){return this.K(null,b,null)};g.K=function(a,b,c){a=sh(this.j,b);return-1===a?c:this.j[a+1]};
g.yb=function(a,b,c){a=this.j.length;for(var d=0;;)if(d<a){var e=this.j[d],f=this.j[d+1];c=b.h?b.h(c,e,f):b.call(null,c,e,f);if(Md(c))return Dc(c);d+=2}else return c};g.Ka=function(){return new uh(this.j,2*this.D)};g.S=function(){return this.B};g.Ga=function(){return new Fb(this.B,this.D,this.j,this.C)};g.Z=function(){return this.D};g.Y=function(){var a=this.C;return null!=a?a:this.C=a=Id(this)};
g.H=function(a,b){if(ze(b)&&!Ae(b))if(a=this.j.length,this.D===b.Z(null))for(var c=0;;)if(c<a){var d=b.K(null,this.j[c],Ee);if(d!==Ee)if(Dd.g(this.j[c+1],d))c+=2;else return!1;else return!1}else return!0;else return!1;else return!1};g.Gc=function(){return new xh(this.j.length,Vb(this.j))};g.ia=function(){return Gc(If,this.B)};g.Ca=function(a,b){return Me(this,b)};g.Da=function(a,b,c){return Ne(this,b,c)};
g.Tb=function(a,b){if(0<=sh(this.j,b)){a=this.j.length;var c=a-2;if(0===c)return this.ia(null);c=Array(c);for(var d=0,e=0;;){if(d>=a)return new Fb(this.B,this.D-1,c,null);Dd.g(b,this.j[d])?d+=2:(c[e]=this.j[d],c[e+1]=this.j[d+1],e+=2,d+=2)}}else return this};
g.Aa=function(a,b,c){a=sh(this.j,b);if(-1===a){if(this.D<yh){a=this.j;for(var d=a.length,e=Array(d+2),f=0;;)if(f<d)e[f]=a[f],f+=1;else break;e[d]=b;e[d+1]=c;return new Fb(this.B,this.D+1,e,null)}return Gc(sc(ug.g(zh,this),b,c),this.B)}if(c===this.j[a+1])return this;b=Vb(this.j);b[a+1]=c;return new Fb(this.B,this.D,b,null)};g.Yb=function(a,b){return-1!==sh(this.j,b)};g.aa=function(){var a=this.j;return 0<=a.length-2?new th(a,0,null):null};
g.U=function(a,b){return b===this.B?this:new Fb(b,this.D,this.j,this.C)};g.ea=function(a,b){if(Be(b))return this.Aa(null,ic.g(b,0),ic.g(b,1));a=this;for(b=M(b);;){if(null==b)return a;var c=N(b);if(Be(c))a=sc(a,ic.g(c,0),ic.g(c,1)),b=O(b);else throw Error("conj on a map takes map entries or seqables of map entries");}};
g.call=function(){var a=null;a=function(b,c,d){switch(arguments.length){case 2:return this.V(null,c);case 3:return this.K(null,c,d)}throw Error("Invalid arity: "+(arguments.length-1));};a.g=function(b,c){return this.V(null,c)};a.h=function(b,c,d){return this.K(null,c,d)};return a}();g.apply=function(a,b){return this.call.apply(this,[this].concat(Vb(b)))};g.a=function(a){return this.V(null,a)};g.g=function(a,b){return this.K(null,a,b)};var If=new Fb(null,0,[],Jd),yh=8;
function Ah(a){return new Fb(null,a.length/2,a,null)}function oe(a){for(var b=[],c=0;;)if(c<a.length){var d=a[c],e=a[c+1],f=sh(b,d);-1===f?(f=b,f.push(d),f.push(e)):b[f+1]=e;c+=2}else break;return new Fb(null,b.length/2,b,null)}Fb.prototype[Ub]=function(){return Fd(this)};function xh(a,b){this.Jc={};this.yc=a;this.j=b;this.l=259;this.I=56}g=xh.prototype;g.Z=function(){if(B(this.Jc))return Ue(this.yc);throw Error("count after persistent!");};g.V=function(a,b){return this.K(null,b,null)};
g.K=function(a,b,c){if(B(this.Jc))return a=sh(this.j,b),-1===a?c:this.j[a+1];throw Error("lookup after persistent!");};g.Ic=function(a,b){if(B(this.Jc)){if(Xg(b))return this.Hc(null,Yg.a?Yg.a(b):Yg.call(null,b),Zg.a?Zg.a(b):Zg.call(null,b));if(Be(b))return this.Hc(null,b.a?b.a(0):b.call(null,0),b.a?b.a(1):b.call(null,1));a=M(b);for(b=this;;){var c=N(a);if(B(c))a=O(a),b=ad(b,Yg.a?Yg.a(c):Yg.call(null,c),Zg.a?Zg.a(c):Zg.call(null,c));else return b}}else throw Error("conj! after persistent!");};
g.ad=function(){if(B(this.Jc))return this.Jc=!1,new Fb(null,Ue(this.yc),this.j,null);throw Error("persistent! called twice");};g.Hc=function(a,b,c){if(B(this.Jc)){a=sh(this.j,b);if(-1===a)return this.yc+2<=2*yh?(this.yc+=2,this.j.push(b),this.j.push(c),this):sf(Bh.g?Bh.g(this.yc,this.j):Bh.call(null,this.yc,this.j),b,c);c!==this.j[a+1]&&(this.j[a+1]=c);return this}throw Error("assoc! after persistent!");};
g.call=function(){var a=null;a=function(b,c,d){switch(arguments.length){case 2:return this.K(null,c,null);case 3:return this.K(null,c,d)}throw Error("Invalid arity: "+(arguments.length-1));};a.g=function(b,c){return this.K(null,c,null)};a.h=function(b,c,d){return this.K(null,c,d)};return a}();g.apply=function(a,b){return this.call.apply(this,[this].concat(Vb(b)))};g.a=function(a){return this.K(null,a,null)};g.g=function(a,b){return this.K(null,a,b)};
function Bh(a,b){for(var c=Yc(zh),d=0;;)if(d<a)c=ad(c,b[d],b[d+1]),d+=2;else return c}function Ch(){this.s=!1}function Dh(a,b){return a===b?!0:af(a,b)?!0:Dd.g(a,b)}function Eh(a,b,c){a=Vb(a);a[b]=c;return a}function Fh(a,b){var c=Array(a.length-2);De(a,0,c,0,2*b);De(a,2*(b+1),c,2*b,c.length-2*b);return c}function Gh(a,b,c,d){a=a.tc(b);a.j[c]=d;return a}
function Hh(a,b,c){for(var d=a.length,e=0,f=c;;)if(e<d){c=a[e];if(null!=c){var h=a[e+1];c=b.h?b.h(f,c,h):b.call(null,f,c,h)}else c=a[e+1],c=null!=c?c.xc(b,f):f;if(Md(c))return c;e+=2;f=c}else return f}function Ih(a){this.j=a;this.F=0;this.Ob=this.pd=null}Ih.prototype.advance=function(){for(var a=this.j.length;;)if(this.F<a){var b=this.j[this.F],c=this.j[this.F+1];null!=b?b=this.pd=new Le(b,c,null):null!=c?(b=kd(c),b=b.ka()?this.Ob=b:!1):b=!1;this.F+=2;if(b)return!0}else return!1};
Ih.prototype.ka=function(){var a=null!=this.pd;return a?a:(a=null!=this.Ob)?a:this.advance()};Ih.prototype.next=function(){if(null!=this.pd){var a=this.pd;this.pd=null;return a}if(null!=this.Ob)return a=this.Ob.next(),this.Ob.ka()||(this.Ob=null),a;if(this.advance())return this.next();throw Error("No such element");};Ih.prototype.remove=function(){return Error("Unsupported operation")};function Jh(a,b,c){this.oa=a;this.ta=b;this.j=c;this.I=131072;this.l=0}g=Jh.prototype;
g.tc=function(a){if(a===this.oa)return this;var b=Ve(this.ta),c=Array(0>b?4:2*(b+1));De(this.j,0,c,0,2*b);return new Jh(a,this.ta,c)};g.nd=function(){return Kh?Kh(this.j):Nh.call(null,this.j)};g.xc=function(a,b){return Hh(this.j,a,b)};g.lc=function(a,b,c,d){var e=1<<(b>>>a&31);if(0===(this.ta&e))return d;var f=Ve(this.ta&e-1);e=this.j[2*f];f=this.j[2*f+1];return null==e?f.lc(a+5,b,c,d):Dh(c,e)?f:d};
g.Mb=function(a,b,c,d,e,f){var h=1<<(c>>>b&31),k=Ve(this.ta&h-1);if(0===(this.ta&h)){var l=Ve(this.ta);if(2*l<this.j.length){a=this.tc(a);b=a.j;f.s=!0;c=2*(l-k);f=2*k+(c-1);for(l=2*(k+1)+(c-1);0!==c;)b[l]=b[f],--l,--c,--f;b[2*k]=d;b[2*k+1]=e;a.ta|=h;return a}if(16<=l){k=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];k[c>>>b&31]=Oh.Mb(a,b+5,c,d,e,f);for(e=d=0;;)if(32>d)0===(this.ta>>>
d&1)?d+=1:(k[d]=null!=this.j[e]?Oh.Mb(a,b+5,vd(this.j[e]),this.j[e],this.j[e+1],f):this.j[e+1],e+=2,d+=1);else break;return new Ph(a,l+1,k)}b=Array(2*(l+4));De(this.j,0,b,0,2*k);b[2*k]=d;b[2*k+1]=e;De(this.j,2*k,b,2*(k+1),2*(l-k));f.s=!0;a=this.tc(a);a.j=b;a.ta|=h;return a}l=this.j[2*k];h=this.j[2*k+1];if(null==l)return l=h.Mb(a,b+5,c,d,e,f),l===h?this:Gh(this,a,2*k+1,l);if(Dh(d,l))return e===h?this:Gh(this,a,2*k+1,e);f.s=!0;f=b+5;d=Qh?Qh(a,f,l,h,c,d,e):Rh.call(null,a,f,l,h,c,d,e);e=2*k;k=2*k+1;a=
this.tc(a);a.j[e]=null;a.j[k]=d;return a};
g.Lb=function(a,b,c,d,e){var f=1<<(b>>>a&31),h=Ve(this.ta&f-1);if(0===(this.ta&f)){var k=Ve(this.ta);if(16<=k){h=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];h[b>>>a&31]=Oh.Lb(a+5,b,c,d,e);for(d=c=0;;)if(32>c)0===(this.ta>>>c&1)?c+=1:(h[c]=null!=this.j[d]?Oh.Lb(a+5,vd(this.j[d]),this.j[d],this.j[d+1],e):this.j[d+1],d+=2,c+=1);else break;return new Ph(null,k+1,h)}a=Array(2*(k+1));De(this.j,
0,a,0,2*h);a[2*h]=c;a[2*h+1]=d;De(this.j,2*h,a,2*(h+1),2*(k-h));e.s=!0;return new Jh(null,this.ta|f,a)}var l=this.j[2*h];f=this.j[2*h+1];if(null==l)return k=f.Lb(a+5,b,c,d,e),k===f?this:new Jh(null,this.ta,Eh(this.j,2*h+1,k));if(Dh(c,l))return d===f?this:new Jh(null,this.ta,Eh(this.j,2*h+1,d));e.s=!0;e=this.ta;k=this.j;a+=5;a=Sh?Sh(a,l,f,b,c,d):Rh.call(null,a,l,f,b,c,d);c=2*h;h=2*h+1;d=Vb(k);d[c]=null;d[h]=a;return new Jh(null,e,d)};
g.md=function(a,b,c,d){var e=1<<(b>>>a&31);if(0===(this.ta&e))return d;var f=Ve(this.ta&e-1);e=this.j[2*f];f=this.j[2*f+1];return null==e?f.md(a+5,b,c,d):Dh(c,e)?new Le(e,f,null):d};g.od=function(a,b,c){var d=1<<(b>>>a&31);if(0===(this.ta&d))return this;var e=Ve(this.ta&d-1),f=this.j[2*e],h=this.j[2*e+1];return null==f?(a=h.od(a+5,b,c),a===h?this:null!=a?new Jh(null,this.ta,Eh(this.j,2*e+1,a)):this.ta===d?null:new Jh(null,this.ta^d,Fh(this.j,e))):Dh(c,f)?new Jh(null,this.ta^d,Fh(this.j,e)):this};
g.Ka=function(){return new Ih(this.j)};var Oh=new Jh(null,0,[]);function Th(a){this.j=a;this.F=0;this.Ob=null}Th.prototype.ka=function(){for(var a=this.j.length;;){if(null!=this.Ob&&this.Ob.ka())return!0;if(this.F<a){var b=this.j[this.F];this.F+=1;null!=b&&(this.Ob=kd(b))}else return!1}};Th.prototype.next=function(){if(this.ka())return this.Ob.next();throw Error("No such element");};Th.prototype.remove=function(){return Error("Unsupported operation")};
function Ph(a,b,c){this.oa=a;this.D=b;this.j=c;this.I=131072;this.l=0}g=Ph.prototype;g.tc=function(a){return a===this.oa?this:new Ph(a,this.D,Vb(this.j))};g.nd=function(){return Uh?Uh(this.j):Vh.call(null,this.j)};g.xc=function(a,b){for(var c=this.j.length,d=0;;)if(d<c){var e=this.j[d];if(null!=e){b=e.xc(a,b);if(Md(b))return b;d+=1}else d+=1}else return b};g.lc=function(a,b,c,d){var e=this.j[b>>>a&31];return null!=e?e.lc(a+5,b,c,d):d};
g.Mb=function(a,b,c,d,e,f){var h=c>>>b&31,k=this.j[h];if(null==k)return a=Gh(this,a,h,Oh.Mb(a,b+5,c,d,e,f)),a.D+=1,a;b=k.Mb(a,b+5,c,d,e,f);return b===k?this:Gh(this,a,h,b)};g.Lb=function(a,b,c,d,e){var f=b>>>a&31,h=this.j[f];if(null==h)return new Ph(null,this.D+1,Eh(this.j,f,Oh.Lb(a+5,b,c,d,e)));a=h.Lb(a+5,b,c,d,e);return a===h?this:new Ph(null,this.D,Eh(this.j,f,a))};g.md=function(a,b,c,d){var e=this.j[b>>>a&31];return null!=e?e.md(a+5,b,c,d):d};
g.od=function(a,b,c){var d=b>>>a&31,e=this.j[d];if(null!=e){a=e.od(a+5,b,c);if(a===e)d=this;else if(null==a)if(8>=this.D)a:{e=this.j;a=e.length;b=Array(2*(this.D-1));c=0;for(var f=1,h=0;;)if(c<a)c!==d&&null!=e[c]?(b[f]=e[c],f+=2,h|=1<<c,c+=1):c+=1;else{d=new Jh(null,h,b);break a}}else d=new Ph(null,this.D-1,Eh(this.j,d,a));else d=new Ph(null,this.D,Eh(this.j,d,a));return d}return this};g.Ka=function(){return new Th(this.j)};
function Wh(a,b,c){b*=2;for(var d=0;;)if(d<b){if(Dh(c,a[d]))return d;d+=2}else return-1}function Xh(a,b,c,d){this.oa=a;this.ac=b;this.D=c;this.j=d;this.I=131072;this.l=0}g=Xh.prototype;g.tc=function(a){if(a===this.oa)return this;var b=Array(2*(this.D+1));De(this.j,0,b,0,2*this.D);return new Xh(a,this.ac,this.D,b)};g.nd=function(){return Kh?Kh(this.j):Nh.call(null,this.j)};g.xc=function(a,b){return Hh(this.j,a,b)};
g.lc=function(a,b,c,d){a=Wh(this.j,this.D,c);return 0>a?d:Dh(c,this.j[a])?this.j[a+1]:d};
g.Mb=function(a,b,c,d,e,f){if(c===this.ac){b=Wh(this.j,this.D,d);if(-1===b){if(this.j.length>2*this.D)return b=2*this.D,c=2*this.D+1,a=this.tc(a),a.j[b]=d,a.j[c]=e,f.s=!0,a.D+=1,a;c=this.j.length;b=Array(c+2);De(this.j,0,b,0,c);b[c]=d;b[c+1]=e;f.s=!0;d=this.D+1;a===this.oa?(this.j=b,this.D=d,a=this):a=new Xh(this.oa,this.ac,d,b);return a}return this.j[b+1]===e?this:Gh(this,a,b+1,e)}return(new Jh(a,1<<(this.ac>>>b&31),[null,this,null,null])).Mb(a,b,c,d,e,f)};
g.Lb=function(a,b,c,d,e){return b===this.ac?(a=Wh(this.j,this.D,c),-1===a?(a=2*this.D,b=Array(a+2),De(this.j,0,b,0,a),b[a]=c,b[a+1]=d,e.s=!0,new Xh(null,this.ac,this.D+1,b)):Dd.g(this.j[a+1],d)?this:new Xh(null,this.ac,this.D,Eh(this.j,a+1,d))):(new Jh(null,1<<(this.ac>>>a&31),[null,this])).Lb(a,b,c,d,e)};g.md=function(a,b,c,d){a=Wh(this.j,this.D,c);return 0>a?d:Dh(c,this.j[a])?new Le(this.j[a],this.j[a+1],null):d};
g.od=function(a,b,c){a=Wh(this.j,this.D,c);return-1===a?this:1===this.D?null:new Xh(null,this.ac,this.D-1,Fh(this.j,Ue(a)))};g.Ka=function(){return new Ih(this.j)};function Rh(a){switch(arguments.length){case 6:return Sh(arguments[0],arguments[1],arguments[2],arguments[3],arguments[4],arguments[5]);case 7:return Qh(arguments[0],arguments[1],arguments[2],arguments[3],arguments[4],arguments[5],arguments[6]);default:throw Error(["Invalid arity: ",I.a(arguments.length)].join(""));}}
function Sh(a,b,c,d,e,f){var h=vd(b);if(h===d)return new Xh(null,h,2,[b,c,e,f]);var k=new Ch;return Oh.Lb(a,h,b,c,k).Lb(a,d,e,f,k)}function Qh(a,b,c,d,e,f,h){var k=vd(c);if(k===e)return new Xh(null,k,2,[c,d,f,h]);var l=new Ch;return Oh.Mb(a,b,k,c,d,l).Mb(a,b,e,f,h,l)}function Yh(a,b,c,d,e){this.B=a;this.Pb=b;this.F=c;this.X=d;this.C=e;this.l=32374988;this.I=0}g=Yh.prototype;g.toString=function(){return md(this)};g.equiv=function(a){return this.H(null,a)};
g.indexOf=function(){var a=null;a=function(b,c){switch(arguments.length){case 1:return Wd(this,b,0);case 2:return Wd(this,b,c)}throw Error("Invalid arity: "+arguments.length);};a.a=function(b){return Wd(this,b,0)};a.g=function(b,c){return Wd(this,b,c)};return a}();
g.lastIndexOf=function(){function a(c){return Zd(this,c,Q(this))}var b=null;b=function(c,d){switch(arguments.length){case 1:return a.call(this,c);case 2:return Zd(this,c,d)}throw Error("Invalid arity: "+arguments.length);};b.a=a;b.g=function(c,d){return Zd(this,c,d)};return b}();g.S=function(){return this.B};g.Ba=function(){if(null==this.X){var a=this.Pb,b=this.F+2;return Zh?Zh(a,b,null):Nh.call(null,a,b,null)}a=this.Pb;b=this.F;var c=O(this.X);return Zh?Zh(a,b,c):Nh.call(null,a,b,c)};
g.Y=function(){var a=this.C;return null!=a?a:this.C=a=Gd(this)};g.H=function(a,b){return be(this,b)};g.ia=function(){return Cd};g.Ca=function(a,b){return ee(b,this)};g.Da=function(a,b,c){return ge(b,c,this)};g.Ha=function(){return null==this.X?new Le(this.Pb[this.F],this.Pb[this.F+1],null):N(this.X)};
g.La=function(){var a=this,b=null==a.X?function(){var c=a.Pb,d=a.F+2;return Zh?Zh(c,d,null):Nh.call(null,c,d,null)}():function(){var c=a.Pb,d=a.F,e=O(a.X);return Zh?Zh(c,d,e):Nh.call(null,c,d,e)}();return null!=b?b:Cd};g.aa=function(){return this};g.U=function(a,b){return b===this.B?this:new Yh(b,this.Pb,this.F,this.X,this.C)};g.ea=function(a,b){return ce(b,this)};Yh.prototype[Ub]=function(){return Fd(this)};
function Nh(a){switch(arguments.length){case 1:return Kh(arguments[0]);case 3:return Zh(arguments[0],arguments[1],arguments[2]);default:throw Error(["Invalid arity: ",I.a(arguments.length)].join(""));}}function Kh(a){return Zh(a,0,null)}function Zh(a,b,c){if(null==c)for(c=a.length;;)if(b<c){if(null!=a[b])return new Yh(null,a,b,null,null);var d=a[b+1];if(B(d)&&(d=d.nd(),B(d)))return new Yh(null,a,b+2,d,null);b+=2}else return null;else return new Yh(null,a,b,c,null)}
function $h(a,b,c,d,e){this.B=a;this.Pb=b;this.F=c;this.X=d;this.C=e;this.l=32374988;this.I=0}g=$h.prototype;g.toString=function(){return md(this)};g.equiv=function(a){return this.H(null,a)};g.indexOf=function(){var a=null;a=function(b,c){switch(arguments.length){case 1:return Wd(this,b,0);case 2:return Wd(this,b,c)}throw Error("Invalid arity: "+arguments.length);};a.a=function(b){return Wd(this,b,0)};a.g=function(b,c){return Wd(this,b,c)};return a}();
g.lastIndexOf=function(){function a(c){return Zd(this,c,Q(this))}var b=null;b=function(c,d){switch(arguments.length){case 1:return a.call(this,c);case 2:return Zd(this,c,d)}throw Error("Invalid arity: "+arguments.length);};b.a=a;b.g=function(c,d){return Zd(this,c,d)};return b}();g.S=function(){return this.B};g.Ba=function(){var a=this.Pb,b=this.F,c=O(this.X);return ai?ai(a,b,c):Vh.call(null,a,b,c)};g.Y=function(){var a=this.C;return null!=a?a:this.C=a=Gd(this)};g.H=function(a,b){return be(this,b)};
g.ia=function(){return Cd};g.Ca=function(a,b){return ee(b,this)};g.Da=function(a,b,c){return ge(b,c,this)};g.Ha=function(){return N(this.X)};g.La=function(){var a=this.Pb;var b=this.F,c=O(this.X);a=ai?ai(a,b,c):Vh.call(null,a,b,c);return null!=a?a:Cd};g.aa=function(){return this};g.U=function(a,b){return b===this.B?this:new $h(b,this.Pb,this.F,this.X,this.C)};g.ea=function(a,b){return ce(b,this)};$h.prototype[Ub]=function(){return Fd(this)};
function Vh(a){switch(arguments.length){case 1:return Uh(arguments[0]);case 3:return ai(arguments[0],arguments[1],arguments[2]);default:throw Error(["Invalid arity: ",I.a(arguments.length)].join(""));}}function Uh(a){return ai(a,0,null)}function ai(a,b,c){if(null==c)for(c=a.length;;)if(b<c){var d=a[b];if(B(d)&&(d=d.nd(),B(d)))return new $h(null,a,b+1,d,null);b+=1}else return null;else return new $h(null,a,b,c,null)}function bi(a,b){this.Na=a;this.gf=b;this.Ae=!1}
bi.prototype.ka=function(){return!this.Ae||this.gf.ka()};bi.prototype.next=function(){if(this.Ae)return this.gf.next();this.Ae=!0;return new Le(null,this.Na,null)};bi.prototype.remove=function(){return Error("Unsupported operation")};function ci(a,b,c,d,e,f){this.B=a;this.D=b;this.root=c;this.Ma=d;this.Na=e;this.C=f;this.l=16123663;this.I=139268}g=ci.prototype;g.kc=w;g.Zb=function(a,b){return null==b?this.Ma?new Le(null,this.Na,null):null:null==this.root?null:this.root.md(0,vd(b),b,null)};
g.toString=function(){return md(this)};g.equiv=function(a){return this.H(null,a)};g.keys=function(){return Fd(vh.a?vh.a(this):vh.call(null,this))};g.entries=function(){return new qh(M(M(this)))};g.values=function(){return Fd(wh.a?wh.a(this):wh.call(null,this))};g.has=function(a){return Je(this,a)};g.get=function(a,b){return this.K(null,a,b)};
g.forEach=function(a){for(var b=M(this),c=null,d=0,e=0;;)if(e<d){var f=c.P(null,e),h=S(f,0,null);f=S(f,1,null);a.g?a.g(f,h):a.call(null,f,h);e+=1}else if(b=M(b))Ce(b)?(c=cd(b),b=dd(b),h=c,d=Q(c),c=h):(c=N(b),h=S(c,0,null),f=S(c,1,null),a.g?a.g(f,h):a.call(null,f,h),b=O(b),c=null,d=0),e=0;else return null};g.V=function(a,b){return this.K(null,b,null)};g.K=function(a,b,c){return null==b?this.Ma?this.Na:c:null==this.root?c:this.root.lc(0,vd(b),b,c)};
g.yb=function(a,b,c){a=this.Ma?b.h?b.h(c,null,this.Na):b.call(null,c,null,this.Na):c;return Md(a)?Dc(a):null!=this.root?Nd(this.root.xc(b,a)):a};g.Ka=function(){var a=this.root?kd(this.root):Gf();return this.Ma?new bi(this.Na,a):a};g.S=function(){return this.B};g.Ga=function(){return new ci(this.B,this.D,this.root,this.Ma,this.Na,this.C)};g.Z=function(){return this.D};g.Y=function(){var a=this.C;return null!=a?a:this.C=a=Id(this)};g.H=function(a,b){return oh(this,b)};
g.Gc=function(){return new di(this.root,this.D,this.Ma,this.Na)};g.ia=function(){return Gc(zh,this.B)};g.Tb=function(a,b){if(null==b)return this.Ma?new ci(this.B,this.D-1,this.root,!1,null,null):this;if(null==this.root)return this;a=this.root.od(0,vd(b),b);return a===this.root?this:new ci(this.B,this.D-1,a,this.Ma,this.Na,null)};
g.Aa=function(a,b,c){if(null==b)return this.Ma&&c===this.Na?this:new ci(this.B,this.Ma?this.D:this.D+1,this.root,!0,c,null);a=new Ch;b=(null==this.root?Oh:this.root).Lb(0,vd(b),b,c,a);return b===this.root?this:new ci(this.B,a.s?this.D+1:this.D,b,this.Ma,this.Na,null)};g.Yb=function(a,b){return null==b?this.Ma:null==this.root?!1:this.root.lc(0,vd(b),b,Ee)!==Ee};g.aa=function(){if(0<this.D){var a=null!=this.root?this.root.nd():null;return this.Ma?ce(new Le(null,this.Na,null),a):a}return null};
g.U=function(a,b){return b===this.B?this:new ci(b,this.D,this.root,this.Ma,this.Na,this.C)};g.ea=function(a,b){if(Be(b))return this.Aa(null,ic.g(b,0),ic.g(b,1));a=this;for(b=M(b);;){if(null==b)return a;var c=N(b);if(Be(c))a=sc(a,ic.g(c,0),ic.g(c,1)),b=O(b);else throw Error("conj on a map takes map entries or seqables of map entries");}};
g.call=function(){var a=null;a=function(b,c,d){switch(arguments.length){case 2:return this.V(null,c);case 3:return this.K(null,c,d)}throw Error("Invalid arity: "+(arguments.length-1));};a.g=function(b,c){return this.V(null,c)};a.h=function(b,c,d){return this.K(null,c,d)};return a}();g.apply=function(a,b){return this.call.apply(this,[this].concat(Vb(b)))};g.a=function(a){return this.V(null,a)};g.g=function(a,b){return this.K(null,a,b)};var zh=new ci(null,0,null,!1,null,Jd);
function ei(a){for(var b=[ci,$e,Fb,Yh,kh,Ad,K,Xe,ef,ch,jh,$h,fi,gi,th,V,ke,ae,hi,ii,ji,ah,ki,kf,xd,li,mi,ni],c=b.length,d=0,e=Yc(zh);;)if(d<c){var f=d+1;e=ad(e,b[d],a[d]);d=f}else return $c(e)}ci.prototype[Ub]=function(){return Fd(this)};function di(a,b,c,d){this.oa={};this.root=a;this.count=b;this.Ma=c;this.Na=d;this.l=259;this.I=56}
function oi(a,b,c){if(a.oa){if(null==b)a.Na!==c&&(a.Na=c),a.Ma||(a.count+=1,a.Ma=!0);else{var d=new Ch;b=(null==a.root?Oh:a.root).Mb(a.oa,0,vd(b),b,c,d);b!==a.root&&(a.root=b);d.s&&(a.count+=1)}return a}throw Error("assoc! after persistent!");}g=di.prototype;g.Z=function(){if(this.oa)return this.count;throw Error("count after persistent!");};g.V=function(a,b){return null==b?this.Ma?this.Na:null:null==this.root?null:this.root.lc(0,vd(b),b)};
g.K=function(a,b,c){return null==b?this.Ma?this.Na:c:null==this.root?c:this.root.lc(0,vd(b),b,c)};g.Ic=function(a,b){a:if(this.oa)if(Xg(b))a=oi(this,Yg.a?Yg.a(b):Yg.call(null,b),Zg.a?Zg.a(b):Zg.call(null,b));else if(Be(b))a=oi(this,b.a?b.a(0):b.call(null,0),b.a?b.a(1):b.call(null,1));else for(a=M(b),b=this;;){var c=N(a);if(B(c))a=O(a),b=oi(b,Yg.a?Yg.a(c):Yg.call(null,c),Zg.a?Zg.a(c):Zg.call(null,c));else{a=b;break a}}else throw Error("conj! after persistent");return a};
g.ad=function(){if(this.oa){this.oa=null;var a=new ci(null,this.count,this.root,this.Ma,this.Na,null)}else throw Error("persistent! called twice");return a};g.Hc=function(a,b,c){return oi(this,b,c)};g.call=function(){var a=null;a=function(b,c,d){switch(arguments.length){case 2:return this.V(null,c);case 3:return this.K(null,c,d)}throw Error("Invalid arity: "+(arguments.length-1));};a.g=function(b,c){return this.V(null,c)};a.h=function(b,c,d){return this.K(null,c,d)};return a}();
g.apply=function(a,b){return this.call.apply(this,[this].concat(Vb(b)))};g.a=function(a){return this.V(null,a)};g.g=function(a,b){return this.K(null,a,b)};function pi(a,b,c){for(var d=b;;)if(null!=a)b=c?a.left:a.right,d=ie.g(d,a),a=b;else return d}function ni(a,b,c,d,e){this.B=a;this.stack=b;this.qc=c;this.D=d;this.C=e;this.l=32374990;this.I=0}g=ni.prototype;g.toString=function(){return md(this)};g.equiv=function(a){return this.H(null,a)};
g.indexOf=function(){var a=null;a=function(b,c){switch(arguments.length){case 1:return Wd(this,b,0);case 2:return Wd(this,b,c)}throw Error("Invalid arity: "+arguments.length);};a.a=function(b){return Wd(this,b,0)};a.g=function(b,c){return Wd(this,b,c)};return a}();
g.lastIndexOf=function(){function a(c){return Zd(this,c,Q(this))}var b=null;b=function(c,d){switch(arguments.length){case 1:return a.call(this,c);case 2:return Zd(this,c,d)}throw Error("Invalid arity: "+arguments.length);};b.a=a;b.g=function(c,d){return Zd(this,c,d)};return b}();g.S=function(){return this.B};g.Ba=function(){var a=N(this.stack);a=pi(this.qc?a.right:a.left,O(this.stack),this.qc);return null==a?null:new ni(null,a,this.qc,this.D-1,null)};g.Z=function(){return 0>this.D?Q(O(this))+1:this.D};
g.Y=function(){var a=this.C;return null!=a?a:this.C=a=Gd(this)};g.H=function(a,b){return be(this,b)};g.ia=function(){return Cd};g.Ca=function(a,b){return ee(b,this)};g.Da=function(a,b,c){return ge(b,c,this)};g.Ha=function(){var a=this.stack;return null==a?null:Ac(a)};g.La=function(){var a=N(this.stack);a=pi(this.qc?a.right:a.left,O(this.stack),this.qc);return null!=a?new ni(null,a,this.qc,this.D-1,null):Cd};g.aa=function(){return this};
g.U=function(a,b){return b===this.B?this:new ni(b,this.stack,this.qc,this.D,this.C)};g.ea=function(a,b){return ce(b,this)};ni.prototype[Ub]=function(){return Fd(this)};function qi(a,b,c){return new ni(null,pi(a,null,b),b,c,null)}function ri(a,b,c,d){return c instanceof si?c.left instanceof si?new si(c.key,c.s,c.left.Xb(),new ti(a,b,c.right,d)):c.right instanceof si?new si(c.right.key,c.right.s,new ti(c.key,c.s,c.left,c.right.left),new ti(a,b,c.right.right,d)):new ti(a,b,c,d):new ti(a,b,c,d)}
function ui(a,b,c,d){return d instanceof si?d.right instanceof si?new si(d.key,d.s,new ti(a,b,c,d.left),d.right.Xb()):d.left instanceof si?new si(d.left.key,d.left.s,new ti(a,b,c,d.left.left),new ti(d.key,d.s,d.left.right,d.right)):new ti(a,b,c,d):new ti(a,b,c,d)}
function vi(a,b,c,d){if(c instanceof si)return new si(a,b,c.Xb(),d);if(d instanceof ti)return ui(a,b,c,d.qd());if(d instanceof si&&d.left instanceof ti)return new si(d.left.key,d.left.s,new ti(a,b,c,d.left.left),ui(d.key,d.s,d.left.right,d.right.qd()));throw Error("red-black tree invariant violation");}
function wi(a,b,c,d){if(d instanceof si)return new si(a,b,c,d.Xb());if(c instanceof ti)return ri(a,b,c.qd(),d);if(c instanceof si&&c.right instanceof ti)return new si(c.right.key,c.right.s,ri(c.key,c.s,c.left.qd(),c.right.left),new ti(a,b,c.right.right,d));throw Error("red-black tree invariant violation");}
var xi=function xi(a,b,c){var e=null!=a.left?function(){var k=a.left;return xi.h?xi.h(k,b,c):xi.call(null,k,b,c)}():c;if(Md(e))return e;var f=function(){var k=a.key,l=a.s;return b.h?b.h(e,k,l):b.call(null,e,k,l)}();if(Md(f))return f;if(null!=a.right){var h=a.right;return xi.h?xi.h(h,b,f):xi.call(null,h,b,f)}return f};function ti(a,b,c,d){this.key=a;this.s=b;this.left=c;this.right=d;this.C=null;this.l=166619935;this.I=0}g=ti.prototype;g.kc=w;
g.Zb=function(a,b){switch(b){case 0:return new Le(0,this.key,null);case 1:return new Le(1,this.s,null);default:return null}};g.lastIndexOf=function(){function a(c){return Zd(this,c,Q(this))}var b=null;b=function(c,d){switch(arguments.length){case 1:return a.call(this,c);case 2:return Zd(this,c,d)}throw Error("Invalid arity: "+arguments.length);};b.a=a;b.g=function(c,d){return Zd(this,c,d)};return b}();
g.indexOf=function(){var a=null;a=function(b,c){switch(arguments.length){case 1:return Wd(this,b,0);case 2:return Wd(this,b,c)}throw Error("Invalid arity: "+arguments.length);};a.a=function(b){return Wd(this,b,0)};a.g=function(b,c){return Wd(this,b,c)};return a}();g.He=function(a){return a.Je(this)};g.qd=function(){return new si(this.key,this.s,this.left,this.right)};g.Xb=function(){return this};g.Ge=function(a){return a.Ie(this)};g.replace=function(a,b,c,d){return new ti(a,b,c,d)};
g.Ie=function(a){return new ti(a.key,a.s,this,a.right)};g.Je=function(a){return new ti(a.key,a.s,a.left,this)};g.xc=function(a,b){return xi(this,a,b)};g.V=function(a,b){return this.ha(null,b,null)};g.K=function(a,b,c){return this.ha(null,b,c)};g.P=function(a,b){if(0===b)return this.key;if(1===b)return this.s;throw Error("Index out of bounds");};g.ha=function(a,b,c){return 0===b?this.key:1===b?this.s:c};g.Gb=function(a,b,c){return(new V(null,2,5,X,[this.key,this.s],null)).Gb(null,b,c)};g.S=function(){return null};
g.Z=function(){return 2};g.he=function(){return this.key};g.ie=function(){return this.s};g.$b=function(){return this.s};g.Fb=function(){return new Ad([this.s,this.key],0,null)};g.Y=function(){var a=this.C;return null!=a?a:this.C=a=Gd(this)};g.H=function(a,b){return be(this,b)};g.ia=function(){return null};g.Ca=function(a,b){return Pd(this,b)};g.Da=function(a,b,c){return Qd(this,b,c)};g.Aa=function(a,b,c){return ne.h(new V(null,2,5,X,[this.key,this.s],null),b,c)};
g.Yb=function(a,b){return 0===b||1===b};g.aa=function(){return new Ad([this.key,this.s],0,null)};g.U=function(a,b){return Gc(new V(null,2,5,X,[this.key,this.s],null),b)};g.ea=function(a,b){return new V(null,3,5,X,[this.key,this.s,b],null)};
g.call=function(){var a=null;a=function(b,c,d){switch(arguments.length){case 2:return this.P(null,c);case 3:return this.ha(null,c,d)}throw Error("Invalid arity: "+(arguments.length-1));};a.g=function(b,c){return this.P(null,c)};a.h=function(b,c,d){return this.ha(null,c,d)};return a}();g.apply=function(a,b){return this.call.apply(this,[this].concat(Vb(b)))};g.a=function(a){return this.P(null,a)};g.g=function(a,b){return this.ha(null,a,b)};ti.prototype[Ub]=function(){return Fd(this)};
function si(a,b,c,d){this.key=a;this.s=b;this.left=c;this.right=d;this.C=null;this.l=166619935;this.I=0}g=si.prototype;g.kc=w;g.Zb=function(a,b){switch(b){case 0:return new Le(0,this.key,null);case 1:return new Le(1,this.s,null);default:return null}};
g.lastIndexOf=function(){function a(c){return Zd(this,c,Q(this))}var b=null;b=function(c,d){switch(arguments.length){case 1:return a.call(this,c);case 2:return Zd(this,c,d)}throw Error("Invalid arity: "+arguments.length);};b.a=a;b.g=function(c,d){return Zd(this,c,d)};return b}();
g.indexOf=function(){var a=null;a=function(b,c){switch(arguments.length){case 1:return Wd(this,b,0);case 2:return Wd(this,b,c)}throw Error("Invalid arity: "+arguments.length);};a.a=function(b){return Wd(this,b,0)};a.g=function(b,c){return Wd(this,b,c)};return a}();g.He=function(a){return new si(this.key,this.s,this.left,a)};g.qd=function(){throw Error("red-black tree invariant violation");};g.Xb=function(){return new ti(this.key,this.s,this.left,this.right)};
g.Ge=function(a){return new si(this.key,this.s,a,this.right)};g.replace=function(a,b,c,d){return new si(a,b,c,d)};g.Ie=function(a){return this.left instanceof si?new si(this.key,this.s,this.left.Xb(),new ti(a.key,a.s,this.right,a.right)):this.right instanceof si?new si(this.right.key,this.right.s,new ti(this.key,this.s,this.left,this.right.left),new ti(a.key,a.s,this.right.right,a.right)):new ti(a.key,a.s,this,a.right)};
g.Je=function(a){return this.right instanceof si?new si(this.key,this.s,new ti(a.key,a.s,a.left,this.left),this.right.Xb()):this.left instanceof si?new si(this.left.key,this.left.s,new ti(a.key,a.s,a.left,this.left.left),new ti(this.key,this.s,this.left.right,this.right)):new ti(a.key,a.s,a.left,this)};g.xc=function(a,b){return xi(this,a,b)};g.V=function(a,b){return this.ha(null,b,null)};g.K=function(a,b,c){return this.ha(null,b,c)};
g.P=function(a,b){if(0===b)return this.key;if(1===b)return this.s;throw Error("Index out of bounds");};g.ha=function(a,b,c){return 0===b?this.key:1===b?this.s:c};g.Gb=function(a,b,c){return(new V(null,2,5,X,[this.key,this.s],null)).Gb(null,b,c)};g.S=function(){return null};g.Z=function(){return 2};g.he=function(){return this.key};g.ie=function(){return this.s};g.$b=function(){return this.s};g.Fb=function(){return new Ad([this.s,this.key],0,null)};
g.Y=function(){var a=this.C;return null!=a?a:this.C=a=Gd(this)};g.H=function(a,b){return be(this,b)};g.ia=function(){return null};g.Ca=function(a,b){return Pd(this,b)};g.Da=function(a,b,c){return Qd(this,b,c)};g.Aa=function(a,b,c){return ne.h(new V(null,2,5,X,[this.key,this.s],null),b,c)};g.Yb=function(a,b){return 0===b||1===b};g.aa=function(){return new Ad([this.key,this.s],0,null)};g.U=function(a,b){return Gc(new V(null,2,5,X,[this.key,this.s],null),b)};
g.ea=function(a,b){return new V(null,3,5,X,[this.key,this.s,b],null)};g.call=function(){var a=null;a=function(b,c,d){switch(arguments.length){case 2:return this.P(null,c);case 3:return this.ha(null,c,d)}throw Error("Invalid arity: "+(arguments.length-1));};a.g=function(b,c){return this.P(null,c)};a.h=function(b,c,d){return this.ha(null,c,d)};return a}();g.apply=function(a,b){return this.call.apply(this,[this].concat(Vb(b)))};g.a=function(a){return this.P(null,a)};
g.g=function(a,b){return this.ha(null,a,b)};si.prototype[Ub]=function(){return Fd(this)};
var yi=function yi(a,b,c,d,e){if(null==b)return new si(c,d,null,null);var h=function(){var k=b.key;return a.g?a.g(c,k):a.call(null,c,k)}();if(0===h)return e[0]=b,null;if(0>h)return h=function(){var k=b.left;return yi.ca?yi.ca(a,k,c,d,e):yi.call(null,a,k,c,d,e)}(),null!=h?b.Ge(h):null;h=function(){var k=b.right;return yi.ca?yi.ca(a,k,c,d,e):yi.call(null,a,k,c,d,e)}();return null!=h?b.He(h):null},zi=function zi(a,b){if(null==a)return b;if(null==b)return a;if(a instanceof si){if(b instanceof si){var d=
function(){var e=a.right,f=b.left;return zi.g?zi.g(e,f):zi.call(null,e,f)}();return d instanceof si?new si(d.key,d.s,new si(a.key,a.s,a.left,d.left),new si(b.key,b.s,d.right,b.right)):new si(a.key,a.s,a.left,new si(b.key,b.s,d,b.right))}return new si(a.key,a.s,a.left,function(){var e=a.right;return zi.g?zi.g(e,b):zi.call(null,e,b)}())}if(b instanceof si)return new si(b.key,b.s,function(){var e=b.left;return zi.g?zi.g(a,e):zi.call(null,a,e)}(),b.right);d=function(){var e=a.right,f=b.left;return zi.g?
zi.g(e,f):zi.call(null,e,f)}();return d instanceof si?new si(d.key,d.s,new ti(a.key,a.s,a.left,d.left),new ti(b.key,b.s,d.right,b.right)):vi(a.key,a.s,a.left,new ti(b.key,b.s,d,b.right))},Ai=function Ai(a,b,c,d){if(null!=b){var f=function(){var h=b.key;return a.g?a.g(c,h):a.call(null,c,h)}();if(0===f)return d[0]=b,zi(b.left,b.right);if(0>f)return f=function(){var h=b.left;return Ai.J?Ai.J(a,h,c,d):Ai.call(null,a,h,c,d)}(),null!=f||null!=d[0]?b.left instanceof ti?vi(b.key,b.s,f,b.right):new si(b.key,
b.s,f,b.right):null;f=function(){var h=b.right;return Ai.J?Ai.J(a,h,c,d):Ai.call(null,a,h,c,d)}();return null!=f||null!=d[0]?b.right instanceof ti?wi(b.key,b.s,b.left,f):new si(b.key,b.s,b.left,f):null}return null},Bi=function Bi(a,b,c,d){var f=b.key,h=a.g?a.g(c,f):a.call(null,c,f);return 0===h?b.replace(f,d,b.left,b.right):0>h?b.replace(f,b.s,function(){var k=b.left;return Bi.J?Bi.J(a,k,c,d):Bi.call(null,a,k,c,d)}(),b.right):b.replace(f,b.s,b.left,function(){var k=b.right;return Bi.J?Bi.J(a,k,c,
d):Bi.call(null,a,k,c,d)}())};function ii(a,b,c,d,e){this.vb=a;this.Vb=b;this.D=c;this.B=d;this.C=e;this.l=418776847;this.I=8192}g=ii.prototype;g.kc=w;g.Zb=function(a,b){return Ci(this,b)};g.forEach=function(a){for(var b=M(this),c=null,d=0,e=0;;)if(e<d){var f=c.P(null,e),h=S(f,0,null);f=S(f,1,null);a.g?a.g(f,h):a.call(null,f,h);e+=1}else if(b=M(b))Ce(b)?(c=cd(b),b=dd(b),h=c,d=Q(c),c=h):(c=N(b),h=S(c,0,null),f=S(c,1,null),a.g?a.g(f,h):a.call(null,f,h),b=O(b),c=null,d=0),e=0;else return null};
g.get=function(a,b){return this.K(null,a,b)};g.entries=function(){return new qh(M(M(this)))};g.toString=function(){return md(this)};g.keys=function(){return Fd(vh.a?vh.a(this):vh.call(null,this))};g.values=function(){return Fd(wh.a?wh.a(this):wh.call(null,this))};g.equiv=function(a){return this.H(null,a)};function Ci(a,b){for(var c=a.Vb;;)if(null!=c){var d=c.key;d=a.vb.g?a.vb.g(b,d):a.vb.call(null,b,d);if(0===d)return c;c=0>d?c.left:c.right}else return null}g.has=function(a){return Je(this,a)};
g.V=function(a,b){return this.K(null,b,null)};g.K=function(a,b,c){a=Ci(this,b);return null!=a?a.s:c};g.yb=function(a,b,c){return null!=this.Vb?Nd(xi(this.Vb,b,c)):c};g.S=function(){return this.B};g.Ga=function(){return new ii(this.vb,this.Vb,this.D,this.B,this.C)};g.Z=function(){return this.D};g.Fb=function(){return 0<this.D?qi(this.Vb,!1,this.D):null};g.Y=function(){var a=this.C;return null!=a?a:this.C=a=Id(this)};g.H=function(a,b){return oh(this,b)};
g.ia=function(){return new ii(this.vb,null,0,this.B,0)};g.Tb=function(a,b){a=[null];b=Ai(this.vb,this.Vb,b,a);return null==b?null==Xd(a,0)?this:new ii(this.vb,null,0,this.B,null):new ii(this.vb,b.Xb(),this.D-1,this.B,null)};g.Aa=function(a,b,c){a=[null];var d=yi(this.vb,this.Vb,b,c,a);return null==d?(a=Xd(a,0),Dd.g(c,a.s)?this:new ii(this.vb,Bi(this.vb,this.Vb,b,c),this.D,this.B,null)):new ii(this.vb,d.Xb(),this.D+1,this.B,null)};g.Yb=function(a,b){return null!=Ci(this,b)};
g.aa=function(){return 0<this.D?qi(this.Vb,!0,this.D):null};g.U=function(a,b){return b===this.B?this:new ii(this.vb,this.Vb,this.D,b,this.C)};g.ea=function(a,b){if(Be(b))return this.Aa(null,ic.g(b,0),ic.g(b,1));a=this;for(b=M(b);;){if(null==b)return a;var c=N(b);if(Be(c))a=sc(a,ic.g(c,0),ic.g(c,1)),b=O(b);else throw Error("conj on a map takes map entries or seqables of map entries");}};
g.call=function(){var a=null;a=function(b,c,d){switch(arguments.length){case 2:return this.V(null,c);case 3:return this.K(null,c,d)}throw Error("Invalid arity: "+(arguments.length-1));};a.g=function(b,c){return this.V(null,c)};a.h=function(b,c,d){return this.K(null,c,d)};return a}();g.apply=function(a,b){return this.call.apply(this,[this].concat(Vb(b)))};g.a=function(a){return this.V(null,a)};g.g=function(a,b){return this.K(null,a,b)};ii.prototype[Ub]=function(){return Fd(this)};
var Di=function Di(a){for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return Di.A(0<c.length?new Ad(c.slice(0),0,null):null)};Di.A=function(a){a=M(a);for(var b=Yc(zh);;)if(a){var c=O(O(a));b=sf(b,N(a),N(O(a)));a=c}else return $c(b)};Di.O=0;Di.R=function(a){return this.A(M(a))};var Ei=function Ei(a){for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return Ei.A(0<c.length?new Ad(c.slice(0),0,null):null)};
Ei.A=function(a){a=a instanceof Ad&&0===a.F?a.j:Wb(a);return oe(a)};Ei.O=0;Ei.R=function(a){return this.A(M(a))};function ji(a,b){this.fa=a;this.Sb=b;this.l=32374988;this.I=0}g=ji.prototype;g.toString=function(){return md(this)};g.equiv=function(a){return this.H(null,a)};
g.indexOf=function(){var a=null;a=function(b,c){switch(arguments.length){case 1:return Wd(this,b,0);case 2:return Wd(this,b,c)}throw Error("Invalid arity: "+arguments.length);};a.a=function(b){return Wd(this,b,0)};a.g=function(b,c){return Wd(this,b,c)};return a}();
g.lastIndexOf=function(){function a(c){return Zd(this,c,Q(this))}var b=null;b=function(c,d){switch(arguments.length){case 1:return a.call(this,c);case 2:return Zd(this,c,d)}throw Error("Invalid arity: "+arguments.length);};b.a=a;b.g=function(c,d){return Zd(this,c,d)};return b}();g.S=function(){return this.Sb};g.Ba=function(){var a=(null!=this.fa?this.fa.l&128||w===this.fa.$c||(this.fa.l?0:Qb(mc,this.fa)):Qb(mc,this.fa))?this.fa.Ba(null):O(this.fa);return null==a?null:new ji(a,null)};g.Y=function(){return Gd(this)};
g.H=function(a,b){return be(this,b)};g.ia=function(){return Cd};g.Ca=function(a,b){return ee(b,this)};g.Da=function(a,b,c){return ge(b,c,this)};g.Ha=function(){return this.fa.Ha(null).key};g.La=function(){var a=(null!=this.fa?this.fa.l&128||w===this.fa.$c||(this.fa.l?0:Qb(mc,this.fa)):Qb(mc,this.fa))?this.fa.Ba(null):O(this.fa);return null!=a?new ji(a,null):Cd};g.aa=function(){return this};g.U=function(a,b){return b===this.Sb?this:new ji(this.fa,b)};g.ea=function(a,b){return ce(b,this)};
ji.prototype[Ub]=function(){return Fd(this)};function vh(a){return(a=M(a))?new ji(a,null):null}function Yg(a){return xc(a)}function fi(a,b){this.fa=a;this.Sb=b;this.l=32374988;this.I=0}g=fi.prototype;g.toString=function(){return md(this)};g.equiv=function(a){return this.H(null,a)};
g.indexOf=function(){var a=null;a=function(b,c){switch(arguments.length){case 1:return Wd(this,b,0);case 2:return Wd(this,b,c)}throw Error("Invalid arity: "+arguments.length);};a.a=function(b){return Wd(this,b,0)};a.g=function(b,c){return Wd(this,b,c)};return a}();
g.lastIndexOf=function(){function a(c){return Zd(this,c,Q(this))}var b=null;b=function(c,d){switch(arguments.length){case 1:return a.call(this,c);case 2:return Zd(this,c,d)}throw Error("Invalid arity: "+arguments.length);};b.a=a;b.g=function(c,d){return Zd(this,c,d)};return b}();g.S=function(){return this.Sb};g.Ba=function(){var a=(null!=this.fa?this.fa.l&128||w===this.fa.$c||(this.fa.l?0:Qb(mc,this.fa)):Qb(mc,this.fa))?this.fa.Ba(null):O(this.fa);return null==a?null:new fi(a,null)};g.Y=function(){return Gd(this)};
g.H=function(a,b){return be(this,b)};g.ia=function(){return Cd};g.Ca=function(a,b){return ee(b,this)};g.Da=function(a,b,c){return ge(b,c,this)};g.Ha=function(){return this.fa.Ha(null).s};g.La=function(){var a=(null!=this.fa?this.fa.l&128||w===this.fa.$c||(this.fa.l?0:Qb(mc,this.fa)):Qb(mc,this.fa))?this.fa.Ba(null):O(this.fa);return null!=a?new fi(a,null):Cd};g.aa=function(){return this};g.U=function(a,b){return b===this.Sb?this:new fi(this.fa,b)};g.ea=function(a,b){return ce(b,this)};
fi.prototype[Ub]=function(){return Fd(this)};function wh(a){return(a=M(a))?new fi(a,null):null}function Zg(a){return yc(a)}var Fi=function Fi(a){for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return Fi.A(0<c.length?new Ad(c.slice(0),0,null):null)};Fi.A=function(a){return B(Yf(Qe,a))?Oe(function(b,c){return ie.g(B(b)?b:If,c)},a):null};Fi.O=0;Fi.R=function(a){return this.A(M(a))};
var Gi=function Gi(a){for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return Gi.A(arguments[0],1<c.length?new Ad(c.slice(1),0,null):null)};Gi.A=function(a,b){return B(Yf(Qe,b))?Oe(function(c){return function(d,e){return Xb(c,B(d)?d:If,M(e))}}(function(c,d){var e=xc(d),f=yc(d);return Je(c,e)?ne.h(c,e,function(){var h=J.g(c,e);return a.g?a.g(h,f):a.call(null,h,f)}()):ne.h(c,e,f)}),b):null};Gi.O=1;Gi.R=function(a){var b=N(a);a=O(a);return this.A(b,a)};
function Hi(a){this.te=a}Hi.prototype.ka=function(){return this.te.ka()};Hi.prototype.next=function(){if(this.te.ka())return this.te.next().key;throw Error("No such element");};Hi.prototype.remove=function(){return Error("Unsupported operation")};function hi(a,b,c){this.B=a;this.cc=b;this.C=c;this.l=15077647;this.I=139268}g=hi.prototype;g.toString=function(){return md(this)};g.equiv=function(a){return this.H(null,a)};g.keys=function(){return Fd(M(this))};g.entries=function(){return new rh(M(M(this)))};
g.values=function(){return Fd(M(this))};g.has=function(a){return Je(this,a)};g.forEach=function(a){for(var b=M(this),c=null,d=0,e=0;;)if(e<d){var f=c.P(null,e),h=S(f,0,null);f=S(f,1,null);a.g?a.g(f,h):a.call(null,f,h);e+=1}else if(b=M(b))Ce(b)?(c=cd(b),b=dd(b),h=c,d=Q(c),c=h):(c=N(b),h=S(c,0,null),f=S(c,1,null),a.g?a.g(f,h):a.call(null,f,h),b=O(b),c=null,d=0),e=0;else return null};g.V=function(a,b){return this.K(null,b,null)};g.K=function(a,b,c){a=uc(this.cc,b);return B(a)?xc(a):c};g.Ka=function(){return new Hi(kd(this.cc))};
g.S=function(){return this.B};g.Ga=function(){return new hi(this.B,this.cc,this.C)};g.Z=function(){return cc(this.cc)};g.Y=function(){var a=this.C;return null!=a?a:this.C=a=Id(this)};g.H=function(a,b){if(a=xe(b)){var c=Q(this)===Q(b);if(c)try{return Pe(function(){return function(d,e){return(d=Je(b,e))?d:Ld(!1)}}(c,a,this),!0,this.cc)}catch(d){if(d instanceof Error)return!1;throw d;}else return c}else return a};g.Gc=function(){return new Ii(Yc(this.cc))};g.ia=function(){return Gc(Ji,this.B)};
g.aa=function(){return vh(this.cc)};g.U=function(a,b){return b===this.B?this:new hi(b,this.cc,this.C)};g.ea=function(a,b){return new hi(this.B,ne.h(this.cc,b,null),null)};g.call=function(){var a=null;a=function(b,c,d){switch(arguments.length){case 2:return this.V(null,c);case 3:return this.K(null,c,d)}throw Error("Invalid arity: "+(arguments.length-1));};a.g=function(b,c){return this.V(null,c)};a.h=function(b,c,d){return this.K(null,c,d)};return a}();
g.apply=function(a,b){return this.call.apply(this,[this].concat(Vb(b)))};g.a=function(a){return this.V(null,a)};g.g=function(a,b){return this.K(null,a,b)};var Ji=new hi(null,If,Jd);hi.prototype[Ub]=function(){return Fd(this)};function Ii(a){this.gc=a;this.I=136;this.l=259}g=Ii.prototype;g.Ic=function(a,b){this.gc=ad(this.gc,b,null);return this};g.ad=function(){return new hi(null,$c(this.gc),null)};g.Z=function(){return Q(this.gc)};g.V=function(a,b){return this.K(null,b,null)};
g.K=function(a,b,c){return pc.h(this.gc,b,Ee)===Ee?c:b};g.call=function(){function a(d,e,f){return pc.h(this.gc,e,Ee)===Ee?f:e}function b(d,e){return pc.h(this.gc,e,Ee)===Ee?null:e}var c=null;c=function(d,e,f){switch(arguments.length){case 2:return b.call(this,d,e);case 3:return a.call(this,d,e,f)}throw Error("Invalid arity: "+(arguments.length-1));};c.g=b;c.h=a;return c}();g.apply=function(a,b){return this.call.apply(this,[this].concat(Vb(b)))};
g.a=function(a){return pc.h(this.gc,a,Ee)===Ee?null:a};g.g=function(a,b){return pc.h(this.gc,a,Ee)===Ee?b:a};function ki(a,b,c){this.B=a;this.Wb=b;this.C=c;this.l=417730831;this.I=8192}g=ki.prototype;g.toString=function(){return md(this)};g.equiv=function(a){return this.H(null,a)};g.keys=function(){return Fd(M(this))};g.entries=function(){return new rh(M(M(this)))};g.values=function(){return Fd(M(this))};g.has=function(a){return Je(this,a)};
g.forEach=function(a){for(var b=M(this),c=null,d=0,e=0;;)if(e<d){var f=c.P(null,e),h=S(f,0,null);f=S(f,1,null);a.g?a.g(f,h):a.call(null,f,h);e+=1}else if(b=M(b))Ce(b)?(c=cd(b),b=dd(b),h=c,d=Q(c),c=h):(c=N(b),h=S(c,0,null),f=S(c,1,null),a.g?a.g(f,h):a.call(null,f,h),b=O(b),c=null,d=0),e=0;else return null};g.V=function(a,b){return this.K(null,b,null)};g.K=function(a,b,c){a=Ci(this.Wb,b);return null!=a?a.key:c};g.S=function(){return this.B};g.Ga=function(){return new ki(this.B,this.Wb,this.C)};
g.Z=function(){return Q(this.Wb)};g.Fb=function(){return 0<Q(this.Wb)?kg.g(Yg,Tc(this.Wb)):null};g.Y=function(){var a=this.C;return null!=a?a:this.C=a=Id(this)};g.H=function(a,b){if(a=xe(b)){var c=Q(this)===Q(b);if(c)try{return Pe(function(){return function(d,e){return(d=Je(b,e))?d:Ld(!1)}}(c,a,this),!0,this.Wb)}catch(d){if(d instanceof Error)return!1;throw d;}else return c}else return a};g.ia=function(){return new ki(this.B,ec(this.Wb),0)};g.aa=function(){return vh(this.Wb)};
g.U=function(a,b){return b===this.B?this:new ki(b,this.Wb,this.C)};g.ea=function(a,b){return new ki(this.B,ne.h(this.Wb,b,null),null)};g.call=function(){var a=null;a=function(b,c,d){switch(arguments.length){case 2:return this.V(null,c);case 3:return this.K(null,c,d)}throw Error("Invalid arity: "+(arguments.length-1));};a.g=function(b,c){return this.V(null,c)};a.h=function(b,c,d){return this.K(null,c,d)};return a}();g.apply=function(a,b){return this.call.apply(this,[this].concat(Vb(b)))};
g.a=function(a){return this.V(null,a)};g.g=function(a,b){return this.K(null,a,b)};ki.prototype[Ub]=function(){return Fd(this)};function Ki(a){if(xe(a))return te(a,null);a=M(a);if(null==a)return Ji;if(a instanceof Ad&&0===a.F){a=a.j;for(var b=a.length,c=Yc(Ji),d=0;;)if(d<b)Zc(c,a[d]),d+=1;else break;return $c(c)}for(c=Yc(Ji);;)if(null!=a)b=O(a),c=Zc(c,kc(a)),a=b;else return $c(c)}function Li(a){for(var b=je;;)if(O(a))b=ie.g(b,N(a)),a=O(a);else return M(b)}
function df(a){if(null!=a&&(a.I&4096||w===a.wf))return ed(a);if("string"===typeof a)return a;throw Error(["Doesn't support name: ",I.a(a)].join(""));}function Mi(a,b){var c=Yc(If);a=M(a);for(b=M(b);;)if(a&&b)c=sf(c,N(a),N(b)),a=O(a),b=O(b);else return $c(c)}function Ni(a,b,c){this.start=a;this.step=b;this.count=c;this.l=82;this.I=0}g=Ni.prototype;g.Z=function(){return this.count};g.Ha=function(){return this.start};g.P=function(a,b){return this.start+b*this.step};
g.ha=function(a,b,c){return 0<=b&&b<this.count?this.start+b*this.step:c};g.de=function(){if(1>=this.count)throw Error("-drop-first of empty chunk");return new Ni(this.start+this.step,this.step,this.count-1)};function Oi(a,b,c){this.F=a;this.end=b;this.step=c}Oi.prototype.ka=function(){return 0<this.step?this.F<this.end:this.F>this.end};Oi.prototype.next=function(){var a=this.F;this.F+=this.step;return a};
function mi(a,b,c,d,e,f,h){this.B=a;this.start=b;this.end=c;this.step=d;this.za=e;this.Vc=f;this.C=h;this.l=32375006;this.I=140800}g=mi.prototype;g.toString=function(){return md(this)};g.equiv=function(a){return this.H(null,a)};g.indexOf=function(){var a=null;a=function(b,c){switch(arguments.length){case 1:return Wd(this,b,0);case 2:return Wd(this,b,c)}throw Error("Invalid arity: "+arguments.length);};a.a=function(b){return Wd(this,b,0)};a.g=function(b,c){return Wd(this,b,c)};return a}();
g.lastIndexOf=function(){function a(c){return Zd(this,c,Q(this))}var b=null;b=function(c,d){switch(arguments.length){case 1:return a.call(this,c);case 2:return Zd(this,c,d)}throw Error("Invalid arity: "+arguments.length);};b.a=a;b.g=function(c,d){return Zd(this,c,d)};return b}();function Qi(a){if(null==a.za){var b=a.Z(null);32<b?(a.Vc=new mi(null,a.start+32*a.step,a.end,a.step,null,null,null),a.za=new Ni(a.start,a.step,32)):a.za=new Ni(a.start,a.step,b)}}
g.P=function(a,b){if(0<=b&&b<this.Z(null))return this.start+b*this.step;if(0<=b&&this.start>this.end&&0===this.step)return this.start;throw Error("Index out of bounds");};g.ha=function(a,b,c){return 0<=b&&b<this.Z(null)?this.start+b*this.step:0<=b&&this.start>this.end&&0===this.step?this.start:c};g.Ka=function(){return new Oi(this.start,this.end,this.step)};g.S=function(){return this.B};g.Ga=function(){return new mi(this.B,this.start,this.end,this.step,this.za,this.Vc,this.C)};
g.Ba=function(){return 0<this.step?this.start+this.step<this.end?new mi(null,this.start+this.step,this.end,this.step,null,null,null):null:this.start+this.step>this.end?new mi(null,this.start+this.step,this.end,this.step,null,null,null):null};g.Z=function(){return Math.ceil((this.end-this.start)/this.step)};g.Y=function(){var a=this.C;return null!=a?a:this.C=a=Gd(this)};g.H=function(a,b){return be(this,b)};g.ia=function(){return Cd};g.Ca=function(a,b){return Pd(this,b)};
g.Da=function(a,b,c){for(a=this.start;;)if(0<this.step?a<this.end:a>this.end){c=b.g?b.g(c,a):b.call(null,c,a);if(Md(c))return Dc(c);a+=this.step}else return c};g.Ha=function(){return this.start};g.La=function(){var a=this.Ba(null);return null==a?Cd:a};g.aa=function(){return this};g.xd=function(){Qi(this);return this.za};g.Fc=function(){Qi(this);return null==this.Vc?Cd:this.Vc};g.U=function(a,b){return b===this.B?this:new mi(b,this.start,this.end,this.step,this.za,this.Vc,this.C)};
g.ea=function(a,b){return ce(b,this)};g.ee=function(){return M(this.Fc(null))};mi.prototype[Ub]=function(){return Fd(this)};function Ri(a,b){return new ef(null,function(){var c=M(b);return c?ce(N(c),Ri(a,mg(a,c))):null},null,null)}function Si(a){return $c(Xb(function(b,c){return sf(b,c,J.h(b,c,0)+1)},Yc(If),a))}
function Ti(){var a=df;return function(){function b(k,l,m){return new V(null,2,5,X,[bf.h?bf.h(k,l,m):bf.call(null,k,l,m),a.h?a.h(k,l,m):a.call(null,k,l,m)],null)}function c(k,l){return new V(null,2,5,X,[bf.g?bf.g(k,l):bf.call(null,k,l),a.g?a.g(k,l):a.call(null,k,l)],null)}function d(k){return new V(null,2,5,X,[bf.a?bf.a(k):bf.call(null,k),a.a?a.a(k):a.call(null,k)],null)}function e(){return new V(null,2,5,X,[bf.o?bf.o():bf.call(null),a.o?a.o():a.call(null)],null)}var f=null,h=function(){function k(m,
q,n,r){var p=null;if(3<arguments.length){p=0;for(var t=Array(arguments.length-3);p<t.length;)t[p]=arguments[p+3],++p;p=new Ad(t,0,null)}return l.call(this,m,q,n,p)}function l(m,q,n,r){return new V(null,2,5,X,[Cf(bf,m,q,n,r),Cf(a,m,q,n,r)],null)}k.O=3;k.R=function(m){var q=N(m);m=O(m);var n=N(m);m=O(m);var r=N(m);m=Bd(m);return l(q,n,r,m)};k.A=l;return k}();f=function(k,l,m,q){switch(arguments.length){case 0:return e.call(this);case 1:return d.call(this,k);case 2:return c.call(this,k,l);case 3:return b.call(this,
k,l,m);default:var n=null;if(3<arguments.length){n=0;for(var r=Array(arguments.length-3);n<r.length;)r[n]=arguments[n+3],++n;n=new Ad(r,0,null)}return h.A(k,l,m,n)}throw Error("Invalid arity: "+arguments.length);};f.O=3;f.R=h.R;f.o=e;f.a=d;f.g=c;f.h=b;f.A=h.A;return f}()}function Ui(a){a:for(var b=a;;)if(b=M(b))b=O(b);else break a;return a}
function Vi(a,b){if("string"===typeof b)return a=a.exec(b),Dd.g(N(a),b)?1===Q(a)?N(a):Wg(a):null;throw new TypeError("re-matches must match against a string.");}function Wi(a,b){if("string"===typeof b)return a=a.exec(b),null==a?null:1===Q(a)?N(a):Wg(a);throw new TypeError("re-find must match against a string.");}
function Xi(a,b,c,d,e,f,h){var k=Cb;Cb=null==Cb?null:Cb-1;try{if(null!=Cb&&0>Cb)return Uc(a,"#");Uc(a,c);if(0===Kb.a(f))M(h)&&Uc(a,function(){var p=Yi.a(f);return B(p)?p:"..."}());else{if(M(h)){var l=N(h);b.h?b.h(l,a,f):b.call(null,l,a,f)}for(var m=O(h),q=Kb.a(f)-1;;)if(!m||null!=q&&0===q){M(m)&&0===q&&(Uc(a,d),Uc(a,function(){var p=Yi.a(f);return B(p)?p:"..."}()));break}else{Uc(a,d);var n=N(m);c=a;h=f;b.h?b.h(n,c,h):b.call(null,n,c,h);var r=O(m);c=q-1;m=r;q=c}}return Uc(a,e)}finally{Cb=k}}
function Zi(a,b){b=M(b);for(var c=null,d=0,e=0;;)if(e<d){var f=c.P(null,e);Uc(a,f);e+=1}else if(b=M(b))c=b,Ce(c)?(b=cd(c),d=dd(c),c=b,f=Q(b),b=d,d=f):(f=N(c),Uc(a,f),b=O(c),c=null,d=0),e=0;else return null}function $i(a){if(null==zb)throw Error("No *print-fn* fn set for evaluation environment");zb.a?zb.a(a):zb.call(null,a)}var aj={'"':'\\"',"\\":"\\\\","\b":"\\b","\f":"\\f","\n":"\\n","\r":"\\r","\t":"\\t"};
function bj(a){return['"',I.a(a.replace(/[\\"\b\f\n\r\t]/g,function(b){return aj[b]})),'"'].join("")}function cj(a,b){return(a=Ge(J.g(a,Ib)))?(a=null!=b?b.l&131072||w===b.Qe?!0:!1:!1)?null!=ue(b):a:a}
function dj(a,b,c){if(null==a)return Uc(b,"nil");if(cj(c,a)){Uc(b,"^");var d=ue(a);ej.h?ej.h(d,b,c):ej.call(null,d,b,c);Uc(b," ")}if(a.qb)return a.ub(a,b,c);if(null!=a?a.l&2147483648||w===a.ja||(a.l?0:Qb(Vc,a)):Qb(Vc,a))return Wc(a,b,c);if(!0===a||!1===a)return Uc(b,I.a(a));if("number"===typeof a)return Uc(b,isNaN(a)?"##NaN":a===Number.POSITIVE_INFINITY?"##Inf":a===Number.NEGATIVE_INFINITY?"##-Inf":I.a(a));if(null!=a&&a.constructor===Object)return Uc(b,"#js "),d=kg.g(function(f){return new Le(null!=
Vi(/[A-Za-z_\*\+\?!\-'][\w\*\+\?!\-']*/,f)?cf.a(f):f,a[f],null)},gb(a)),fj.J?fj.J(d,ej,b,c):fj.call(null,d,ej,b,c);if(Nb(a))return Xi(b,ej,"#js ["," ","]",c,a);if(ia(a))return B(Hb.a(c))?Uc(b,bj(a)):Uc(b,a);if(oa(a)){var e=a.name;c=B(function(){var f=null==e;return f?f:Za(e)}())?"Function":e;return Zi(b,R(["#object[",c,"","]"]))}if(a instanceof Date)return c=function(f,h){for(f=I.a(f);;)if(Q(f)<h)f=["0",f].join("");else return f},Zi(b,R(['#inst "',I.a(a.getUTCFullYear()),"-",c(a.getUTCMonth()+1,2),
"-",c(a.getUTCDate(),2),"T",c(a.getUTCHours(),2),":",c(a.getUTCMinutes(),2),":",c(a.getUTCSeconds(),2),".",c(a.getUTCMilliseconds(),3),"-",'00:00"']));if(a instanceof RegExp)return Zi(b,R(['#"',a.source,'"']));if(B(function(){var f=null==a?null:a.constructor;return null==f?null:f.ib}()))return Zi(b,R(["#object[",a.constructor.ib.replace(/\//g,"."),"]"]));e=function(){var f=null==a?null:a.constructor;return null==f?null:f.name}();c=B(function(){var f=null==e;return f?f:Za(e)}())?"Object":e;return null==
a.constructor?Zi(b,R(["#object[",c,"]"])):Zi(b,R(["#object[",c," ",I.a(a),"]"]))}function ej(a,b,c){var d=gj.a(c);return B(d)?(c=ne.h(c,hj,dj),d.h?d.h(a,b,c):d.call(null,a,b,c)):dj(a,b,c)}function ij(a,b){var c=new vb;a:{var d=new ld(c);ej(N(a),d,b);a=M(O(a));for(var e=null,f=0,h=0;;)if(h<f){var k=e.P(null,h);Uc(d," ");ej(k,d,b);h+=1}else if(a=M(a))e=a,Ce(e)?(a=cd(e),f=dd(e),e=a,k=Q(a),a=f,f=k):(k=N(e),Uc(d," "),ej(k,d,b),a=O(e),e=null,f=0),h=0;else break a}return c}
function jj(a,b){return ve(a)?"":I.a(ij(a,b))}function kj(){var a=Eb();$i("\n");return J.g(a,Gb),null}function lj(a){var b=ne.h(Eb(),Hb,!1);$i(jj(a,b));return Bb?kj():null}function mj(a){$i(jj(a,Eb()));return Bb?kj():null}function nj(a,b,c,d,e){return Xi(d,function(f,h,k){var l=xc(f);c.h?c.h(l,h,k):c.call(null,l,h,k);Uc(h," ");f=yc(f);return c.h?c.h(f,h,k):c.call(null,f,h,k)},[I.a(a),"{"].join(""),", ","}",e,M(b))}
function fj(a,b,c,d){var e=(ze(a),null),f=S(e,0,null);e=S(e,1,null);return B(f)?nj(["#:",I.a(f)].join(""),e,b,c,d):nj(null,a,b,c,d)}ig.prototype.ja=w;ig.prototype.W=function(a,b,c){Uc(b,"#object[cljs.core.Volatile ");ej(new Fb(null,1,[oj,this.state],null),b,c);return Uc(b,"]")};Ad.prototype.ja=w;Ad.prototype.W=function(a,b,c){return Xi(b,ej,"("," ",")",c,this)};ef.prototype.ja=w;ef.prototype.W=function(a,b,c){return Xi(b,ej,"("," ",")",c,this)};Le.prototype.ja=w;
Le.prototype.W=function(a,b,c){return Xi(b,ej,"["," ","]",c,this)};ni.prototype.ja=w;ni.prototype.W=function(a,b,c){return Xi(b,ej,"("," ",")",c,this)};Yh.prototype.ja=w;Yh.prototype.W=function(a,b,c){return Xi(b,ej,"("," ",")",c,this)};ti.prototype.ja=w;ti.prototype.W=function(a,b,c){return Xi(b,ej,"["," ","]",c,this)};th.prototype.ja=w;th.prototype.W=function(a,b,c){return Xi(b,ej,"("," ",")",c,this)};ki.prototype.ja=w;ki.prototype.W=function(a,b,c){return Xi(b,ej,"#{"," ","}",c,this)};
ah.prototype.ja=w;ah.prototype.W=function(a,b,c){return Xi(b,ej,"("," ",")",c,this)};$e.prototype.ja=w;$e.prototype.W=function(a,b,c){return Xi(b,ej,"("," ",")",c,this)};ae.prototype.ja=w;ae.prototype.W=function(a,b,c){return Xi(b,ej,"("," ",")",c,this)};ci.prototype.ja=w;ci.prototype.W=function(a,b,c){return fj(this,ej,b,c)};$h.prototype.ja=w;$h.prototype.W=function(a,b,c){return Xi(b,ej,"("," ",")",c,this)};ch.prototype.ja=w;ch.prototype.W=function(a,b,c){return Xi(b,ej,"["," ","]",c,this)};
ii.prototype.ja=w;ii.prototype.W=function(a,b,c){return fj(this,ej,b,c)};hi.prototype.ja=w;hi.prototype.W=function(a,b,c){return Xi(b,ej,"#{"," ","}",c,this)};kf.prototype.ja=w;kf.prototype.W=function(a,b,c){return Xi(b,ej,"("," ",")",c,this)};eg.prototype.ja=w;eg.prototype.W=function(a,b,c){Uc(b,"#object[cljs.core.Atom ");ej(new Fb(null,1,[oj,this.state],null),b,c);return Uc(b,"]")};fi.prototype.ja=w;fi.prototype.W=function(a,b,c){return Xi(b,ej,"("," ",")",c,this)};si.prototype.ja=w;
si.prototype.W=function(a,b,c){return Xi(b,ej,"["," ","]",c,this)};og.prototype.ja=w;og.prototype.W=function(a,b,c){return Xi(b,ej,"("," ",")",c,this)};V.prototype.ja=w;V.prototype.W=function(a,b,c){return Xi(b,ej,"["," ","]",c,this)};jh.prototype.ja=w;jh.prototype.W=function(a,b,c){return Xi(b,ej,"("," ",")",c,this)};Xe.prototype.ja=w;Xe.prototype.W=function(a,b){return Uc(b,"()")};kh.prototype.ja=w;kh.prototype.W=function(a,b,c){return Xi(b,ej,"#queue ["," ","]",c,M(this))};Fb.prototype.ja=w;
Fb.prototype.W=function(a,b,c){return fj(this,ej,b,c)};mi.prototype.ja=w;mi.prototype.W=function(a,b,c){return Xi(b,ej,"("," ",")",c,this)};Vf.prototype.ja=w;Vf.prototype.W=function(a,b,c){return Xi(b,ej,"("," ",")",c,this)};ji.prototype.ja=w;ji.prototype.W=function(a,b,c){return Xi(b,ej,"("," ",")",c,this)};ke.prototype.ja=w;ke.prototype.W=function(a,b,c){return Xi(b,ej,"("," ",")",c,this)};function pj(a,b){this.ma=a;this.Cd=b;this.l=2173173760;this.I=131072}g=pj.prototype;
g.indexOf=function(){var a=null;a=function(b,c){switch(arguments.length){case 1:return Wd(this,b,0);case 2:return Wd(this,b,c)}throw Error("Invalid arity: "+arguments.length);};a.a=function(b){return Wd(this,b,0)};a.g=function(b,c){return Wd(this,b,c)};return a}();
g.lastIndexOf=function(){function a(c){return Zd(this,c,Q(this))}var b=null;b=function(c,d){switch(arguments.length){case 1:return a.call(this,c);case 2:return Zd(this,c,d)}throw Error("Invalid arity: "+arguments.length);};b.a=a;b.g=function(c,d){return Zd(this,c,d)};return b}();g.Ka=function(){var a=Of(this.Cd);return Wf(this.ma,a)};g.aa=function(){var a=Of(this.Cd);a=Wf(this.ma,a);a=Uf(a);return M(B(a)?a:Cd)};g.Ca=function(a,b){a=Re(b);b=this.Cd;return Se(this.ma,a,a.o?a.o():a.call(null),b)};
g.Da=function(a,b,c){return Se(this.ma,Re(b),c,this.Cd)};g.W=function(a,b,c){return Xi(b,ej,"("," ",")",c,this)};pj.prototype[Ub]=function(){return Fd(this)};function qj(a){return new pj(zf(bg,Li(a)),he(a))}function rj(){}
var sj=function sj(a){if(null!=a&&null!=a.uf)return a.uf(a);var c=sj[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=sj._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("IEncodeJS.-clj-\x3ejs",a);},tj=function tj(a){for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return tj.A(arguments[0],1<c.length?new Ad(c.slice(1),0,null):null)};
tj.A=function(a,b){var c=null!=b&&(b.l&64||w===b.T)?zf(Di,b):b,d=J.h(c,uj,df),e=function(){return function(h){var k=f;return(null!=h?w===h.tf||(h.Bd?0:Qb(rj,h)):Qb(rj,h))?sj(h):"string"===typeof h||"number"===typeof h||h instanceof K||h instanceof xd?k.a?k.a(h):k.call(null,h):jj(R([h]),Eb())}}(b,c,c,d),f=function(h,k,l,m){return function r(n){if(null==n)return null;if(null!=n?w===n.tf||(n.Bd?0:Qb(rj,n)):Qb(rj,n))return sj(n);if(n instanceof K)return m.a?m.a(n):m.call(null,n);if(n instanceof xd)return I.a(n);
if(ze(n)){var p={};n=M(n);for(var t=null,x=0,v=0;;)if(v<x){var H=t.P(null,v),P=S(H,0,null),ea=S(H,1,null);H=p;P=e(P);ea=r(ea);H[P]=ea;v+=1}else if(n=M(n))Ce(n)?(x=cd(n),n=dd(n),t=x,x=Q(x)):(t=N(n),x=S(t,0,null),v=S(t,1,null),t=p,x=e(x),v=r(v),t[x]=v,n=O(n),t=null,x=0),v=0;else break;return p}if(we(n)){p=[];n=M(kg.g(r,n));t=null;for(v=x=0;;)if(v<x)H=t.P(null,v),p.push(H),v+=1;else if(n=M(n))t=n,Ce(t)?(n=cd(t),v=dd(t),t=n,x=Q(n),n=v):(n=N(t),p.push(n),n=O(t),t=null,x=0),v=0;else break;return p}return n}}(b,
c,c,d);return f(a)};tj.O=1;tj.R=function(a){var b=N(a);a=O(a);return this.A(b,a)};function vj(){}var wj=function wj(a,b){if(null!=a&&null!=a.sf)return a.sf(a,b);var d=wj[la(null==a?null:a)];if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);d=wj._;if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);throw Sb("IEncodeClojure.-js-\x3eclj",a);};
function xj(a,b){var c=null!=b&&(b.l&64||w===b.T)?zf(Di,b):b,d=J.g(c,yj);return function(e,f,h,k){return function q(m){return(null!=m?w===m.ig||(m.Bd?0:Qb(vj,m)):Qb(vj,m))?wj(m,zf(Ei,b)):Fe(m)?Ui(kg.g(q,m)):Xg(m)?new Le(q(xc(m)),q(yc(m)),null):we(m)?ug.h(le(m),kg.a(q),m):Nb(m)?$c(Xb(function(){return function(n,r){return rf.g(n,q(r))}}(e,f,h,k),Yc(je),m)):Rb(m)===Object?$c(Xb(function(n,r,p,t){return function(x,v){var H=t.a?t.a(v):t.call(null,v);return sf(x,H,q(null!==m&&v in m?m[v]:void 0))}}(e,
f,h,k),Yc(If),gb(m))):m}}(b,c,d,B(d)?cf:I)(a)}var zj=null;function Aj(){null==zj&&(zj=fg(new Fb(null,3,[Bj,If,Cj,If,Dj,If],null)));return zj}function Ej(a,b,c){var d=Dd.g(b,c);if(d)return d;d=Dj.a(a);d=d.a?d.a(b):d.call(null,b);if(!(d=Je(d,c))&&(d=Be(c)))if(d=Be(b))if(d=Q(c)===Q(b)){d=!0;for(var e=0;;)if(d&&e!==Q(c))d=Ej(a,b.a?b.a(e):b.call(null,e),c.a?c.a(e):c.call(null,e)),e+=1;else return d}else return d;else return d;else return d}function Fj(a){var b=Dc(Aj());return Ff(J.g(Bj.a(b),a))}
function Gj(a,b,c,d){hg.g(a,function(){return Dc(b)});hg.g(c,function(){return Dc(d)})}
var Hj=function Hj(a,b,c){var e=function(){var f=Dc(c);return f.a?f.a(a):f.call(null,a)}();e=B(B(e)?e.a?e.a(b):e.call(null,b):e)?!0:null;if(B(e))return e;e=function(){for(var f=Fj(b);;)if(0<Q(f)){var h=N(f);Hj.h?Hj.h(a,h,c):Hj.call(null,a,h,c);f=Bd(f)}else return null}();if(B(e))return e;e=function(){for(var f=Fj(a);;)if(0<Q(f)){var h=N(f);Hj.h?Hj.h(h,b,c):Hj.call(null,h,b,c);f=Bd(f)}else return null}();return B(e)?e:!1};function Ij(a,b,c,d){c=Hj(a,b,c);return B(c)?c:Ej(d,a,b)}
var Jj=function Jj(a,b,c,d,e,f,h,k){var m=Xb(function(n,r){var p=S(r,0,null);S(r,1,null);if(Ej(Dc(c),b,p)&&(n=null==n||Ij(p,N(n),e,Dc(c))?r:n,!Ij(N(n),p,e,Dc(c))))throw Error(["Multiple methods in multimethod '",I.a(a),"' match dispatch value: ",I.a(b)," -\x3e ",I.a(p)," and ",I.a(N(n)),", and neither is preferred"].join(""));return n},null,Dc(d)),q=function(){var n;if(n=null==m)n=Dc(d),n=n.a?n.a(k):n.call(null,k);return B(n)?new V(null,2,5,X,[k,n],null):m}();if(B(q)){if(Dd.g(Dc(h),Dc(c)))return hg.J(f,
ne,b,N(O(q))),N(O(q));Gj(f,d,h,c);return Jj.Ia?Jj.Ia(a,b,c,d,e,f,h,k):Jj.call(null,a,b,c,d,e,f,h,k)}return null};function Kj(a,b){throw Error(["No method in multimethod '",I.a(a),"' for dispatch value: ",I.a(b)].join(""));}function Lj(){var a=yd.g("cljs.tools.reader.impl.inspect","inspect*"),b=Mj,c=Nj,d=Oj,e=Pj,f=Qj,h=Rj,k=Sj;this.name=a;this.w=h;this.Hf=k;this.Gd=b;this.Md=c;this.$f=d;this.Ld=e;this.vd=f;this.l=4194305;this.I=4352}g=Lj.prototype;
g.call=function(){function a(u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da,lb,Pb){u=this;var de=Df(u.w,y,z,A,C,R([D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da,lb,Pb])),Pi=Tj(this,de);B(Pi)||Kj(u.name,de);return Df(Pi,y,z,A,C,R([D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da,lb,Pb]))}function b(u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da,lb){u=this;var Pb=u.w.Za?u.w.Za(y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da,lb):u.w.call(null,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da,lb),de=Tj(this,Pb);B(de)||Kj(u.name,
Pb);return de.Za?de.Za(y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da,lb):de.call(null,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da,lb)}function c(u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da){u=this;var lb=u.w.Ya?u.w.Ya(y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da):u.w.call(null,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da),Pb=Tj(this,lb);B(Pb)||Kj(u.name,lb);return Pb.Ya?Pb.Ya(y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da):Pb.call(null,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da)}function d(u,
y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha){u=this;var Da=u.w.Xa?u.w.Xa(y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha):u.w.call(null,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha),lb=Tj(this,Da);B(lb)||Kj(u.name,Da);return lb.Xa?lb.Xa(y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha):lb.call(null,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha)}function e(u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za){u=this;var Ha=u.w.Wa?u.w.Wa(y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za):u.w.call(null,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,
ta,za),Da=Tj(this,Ha);B(Da)||Kj(u.name,Ha);return Da.Wa?Da.Wa(y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za):Da.call(null,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za)}function f(u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta){u=this;var za=u.w.Va?u.w.Va(y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta):u.w.call(null,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta),Ha=Tj(this,za);B(Ha)||Kj(u.name,za);return Ha.Va?Ha.Va(y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta):Ha.call(null,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta)}function h(u,y,z,A,C,D,G,E,F,W,
U,Y,aa,da,ha,ja){u=this;var ta=u.w.Ua?u.w.Ua(y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja):u.w.call(null,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja),za=Tj(this,ta);B(za)||Kj(u.name,ta);return za.Ua?za.Ua(y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja):za.call(null,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja)}function k(u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha){u=this;var ja=u.w.Ta?u.w.Ta(y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha):u.w.call(null,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha),ta=Tj(this,ja);B(ta)||Kj(u.name,ja);return ta.Ta?ta.Ta(y,z,A,C,D,G,E,F,W,U,Y,aa,da,
ha):ta.call(null,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha)}function l(u,y,z,A,C,D,G,E,F,W,U,Y,aa,da){u=this;var ha=u.w.Sa?u.w.Sa(y,z,A,C,D,G,E,F,W,U,Y,aa,da):u.w.call(null,y,z,A,C,D,G,E,F,W,U,Y,aa,da),ja=Tj(this,ha);B(ja)||Kj(u.name,ha);return ja.Sa?ja.Sa(y,z,A,C,D,G,E,F,W,U,Y,aa,da):ja.call(null,y,z,A,C,D,G,E,F,W,U,Y,aa,da)}function m(u,y,z,A,C,D,G,E,F,W,U,Y,aa){u=this;var da=u.w.Ra?u.w.Ra(y,z,A,C,D,G,E,F,W,U,Y,aa):u.w.call(null,y,z,A,C,D,G,E,F,W,U,Y,aa),ha=Tj(this,da);B(ha)||Kj(u.name,da);return ha.Ra?ha.Ra(y,
z,A,C,D,G,E,F,W,U,Y,aa):ha.call(null,y,z,A,C,D,G,E,F,W,U,Y,aa)}function q(u,y,z,A,C,D,G,E,F,W,U,Y){u=this;var aa=u.w.Qa?u.w.Qa(y,z,A,C,D,G,E,F,W,U,Y):u.w.call(null,y,z,A,C,D,G,E,F,W,U,Y),da=Tj(this,aa);B(da)||Kj(u.name,aa);return da.Qa?da.Qa(y,z,A,C,D,G,E,F,W,U,Y):da.call(null,y,z,A,C,D,G,E,F,W,U,Y)}function n(u,y,z,A,C,D,G,E,F,W,U){u=this;var Y=u.w.Pa?u.w.Pa(y,z,A,C,D,G,E,F,W,U):u.w.call(null,y,z,A,C,D,G,E,F,W,U),aa=Tj(this,Y);B(aa)||Kj(u.name,Y);return aa.Pa?aa.Pa(y,z,A,C,D,G,E,F,W,U):aa.call(null,
y,z,A,C,D,G,E,F,W,U)}function r(u,y,z,A,C,D,G,E,F,W){u=this;var U=u.w.bb?u.w.bb(y,z,A,C,D,G,E,F,W):u.w.call(null,y,z,A,C,D,G,E,F,W),Y=Tj(this,U);B(Y)||Kj(u.name,U);return Y.bb?Y.bb(y,z,A,C,D,G,E,F,W):Y.call(null,y,z,A,C,D,G,E,F,W)}function p(u,y,z,A,C,D,G,E,F){u=this;var W=u.w.Ia?u.w.Ia(y,z,A,C,D,G,E,F):u.w.call(null,y,z,A,C,D,G,E,F),U=Tj(this,W);B(U)||Kj(u.name,W);return U.Ia?U.Ia(y,z,A,C,D,G,E,F):U.call(null,y,z,A,C,D,G,E,F)}function t(u,y,z,A,C,D,G,E){u=this;var F=u.w.ab?u.w.ab(y,z,A,C,D,G,E):
u.w.call(null,y,z,A,C,D,G,E),W=Tj(this,F);B(W)||Kj(u.name,F);return W.ab?W.ab(y,z,A,C,D,G,E):W.call(null,y,z,A,C,D,G,E)}function x(u,y,z,A,C,D,G){u=this;var E=u.w.$a?u.w.$a(y,z,A,C,D,G):u.w.call(null,y,z,A,C,D,G),F=Tj(this,E);B(F)||Kj(u.name,E);return F.$a?F.$a(y,z,A,C,D,G):F.call(null,y,z,A,C,D,G)}function v(u,y,z,A,C,D){u=this;var G=u.w.ca?u.w.ca(y,z,A,C,D):u.w.call(null,y,z,A,C,D),E=Tj(this,G);B(E)||Kj(u.name,G);return E.ca?E.ca(y,z,A,C,D):E.call(null,y,z,A,C,D)}function H(u,y,z,A,C){u=this;var D=
u.w.J?u.w.J(y,z,A,C):u.w.call(null,y,z,A,C),G=Tj(this,D);B(G)||Kj(u.name,D);return G.J?G.J(y,z,A,C):G.call(null,y,z,A,C)}function P(u,y,z,A){u=this;var C=u.w.h?u.w.h(y,z,A):u.w.call(null,y,z,A),D=Tj(this,C);B(D)||Kj(u.name,C);return D.h?D.h(y,z,A):D.call(null,y,z,A)}function ea(u,y,z){u=this;var A=u.w.g?u.w.g(y,z):u.w.call(null,y,z),C=Tj(this,A);B(C)||Kj(u.name,A);return C.g?C.g(y,z):C.call(null,y,z)}function ca(u,y){u=this;var z=u.w.a?u.w.a(y):u.w.call(null,y),A=Tj(this,z);B(A)||Kj(u.name,z);return A.a?
A.a(y):A.call(null,y)}function ma(u){u=this;var y=u.w.o?u.w.o():u.w.call(null),z=Tj(this,y);B(z)||Kj(u.name,y);return z.o?z.o():z.call(null)}var T=null;T=function(u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da,lb,Pb){switch(arguments.length){case 1:return ma.call(this,u);case 2:return ca.call(this,u,y);case 3:return ea.call(this,u,y,z);case 4:return P.call(this,u,y,z,A);case 5:return H.call(this,u,y,z,A,C);case 6:return v.call(this,u,y,z,A,C,D);case 7:return x.call(this,u,y,z,A,C,D,G);case 8:return t.call(this,
u,y,z,A,C,D,G,E);case 9:return p.call(this,u,y,z,A,C,D,G,E,F);case 10:return r.call(this,u,y,z,A,C,D,G,E,F,W);case 11:return n.call(this,u,y,z,A,C,D,G,E,F,W,U);case 12:return q.call(this,u,y,z,A,C,D,G,E,F,W,U,Y);case 13:return m.call(this,u,y,z,A,C,D,G,E,F,W,U,Y,aa);case 14:return l.call(this,u,y,z,A,C,D,G,E,F,W,U,Y,aa,da);case 15:return k.call(this,u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha);case 16:return h.call(this,u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja);case 17:return f.call(this,u,y,z,A,C,D,G,E,F,W,U,Y,
aa,da,ha,ja,ta);case 18:return e.call(this,u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za);case 19:return d.call(this,u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha);case 20:return c.call(this,u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da);case 21:return b.call(this,u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da,lb);case 22:return a.call(this,u,y,z,A,C,D,G,E,F,W,U,Y,aa,da,ha,ja,ta,za,Ha,Da,lb,Pb)}throw Error("Invalid arity: "+(arguments.length-1));};T.a=ma;T.g=ca;T.h=ea;T.J=P;T.ca=H;T.$a=v;T.ab=x;T.Ia=
t;T.bb=p;T.Pa=r;T.Qa=n;T.Ra=q;T.Sa=m;T.Ta=l;T.Ua=k;T.Va=h;T.Wa=f;T.Xa=e;T.Ya=d;T.Za=c;T.fe=b;T.Yc=a;return T}();g.apply=function(a,b){return this.call.apply(this,[this].concat(Vb(b)))};g.o=function(){var a=this.w.o?this.w.o():this.w.call(null),b=Tj(this,a);B(b)||Kj(this.name,a);return b.o?b.o():b.call(null)};g.a=function(a){var b=this.w.a?this.w.a(a):this.w.call(null,a),c=Tj(this,b);B(c)||Kj(this.name,b);return c.a?c.a(a):c.call(null,a)};
g.g=function(a,b){var c=this.w.g?this.w.g(a,b):this.w.call(null,a,b),d=Tj(this,c);B(d)||Kj(this.name,c);return d.g?d.g(a,b):d.call(null,a,b)};g.h=function(a,b,c){var d=this.w.h?this.w.h(a,b,c):this.w.call(null,a,b,c),e=Tj(this,d);B(e)||Kj(this.name,d);return e.h?e.h(a,b,c):e.call(null,a,b,c)};g.J=function(a,b,c,d){var e=this.w.J?this.w.J(a,b,c,d):this.w.call(null,a,b,c,d),f=Tj(this,e);B(f)||Kj(this.name,e);return f.J?f.J(a,b,c,d):f.call(null,a,b,c,d)};
g.ca=function(a,b,c,d,e){var f=this.w.ca?this.w.ca(a,b,c,d,e):this.w.call(null,a,b,c,d,e),h=Tj(this,f);B(h)||Kj(this.name,f);return h.ca?h.ca(a,b,c,d,e):h.call(null,a,b,c,d,e)};g.$a=function(a,b,c,d,e,f){var h=this.w.$a?this.w.$a(a,b,c,d,e,f):this.w.call(null,a,b,c,d,e,f),k=Tj(this,h);B(k)||Kj(this.name,h);return k.$a?k.$a(a,b,c,d,e,f):k.call(null,a,b,c,d,e,f)};
g.ab=function(a,b,c,d,e,f,h){var k=this.w.ab?this.w.ab(a,b,c,d,e,f,h):this.w.call(null,a,b,c,d,e,f,h),l=Tj(this,k);B(l)||Kj(this.name,k);return l.ab?l.ab(a,b,c,d,e,f,h):l.call(null,a,b,c,d,e,f,h)};g.Ia=function(a,b,c,d,e,f,h,k){var l=this.w.Ia?this.w.Ia(a,b,c,d,e,f,h,k):this.w.call(null,a,b,c,d,e,f,h,k),m=Tj(this,l);B(m)||Kj(this.name,l);return m.Ia?m.Ia(a,b,c,d,e,f,h,k):m.call(null,a,b,c,d,e,f,h,k)};
g.bb=function(a,b,c,d,e,f,h,k,l){var m=this.w.bb?this.w.bb(a,b,c,d,e,f,h,k,l):this.w.call(null,a,b,c,d,e,f,h,k,l),q=Tj(this,m);B(q)||Kj(this.name,m);return q.bb?q.bb(a,b,c,d,e,f,h,k,l):q.call(null,a,b,c,d,e,f,h,k,l)};g.Pa=function(a,b,c,d,e,f,h,k,l,m){var q=this.w.Pa?this.w.Pa(a,b,c,d,e,f,h,k,l,m):this.w.call(null,a,b,c,d,e,f,h,k,l,m),n=Tj(this,q);B(n)||Kj(this.name,q);return n.Pa?n.Pa(a,b,c,d,e,f,h,k,l,m):n.call(null,a,b,c,d,e,f,h,k,l,m)};
g.Qa=function(a,b,c,d,e,f,h,k,l,m,q){var n=this.w.Qa?this.w.Qa(a,b,c,d,e,f,h,k,l,m,q):this.w.call(null,a,b,c,d,e,f,h,k,l,m,q),r=Tj(this,n);B(r)||Kj(this.name,n);return r.Qa?r.Qa(a,b,c,d,e,f,h,k,l,m,q):r.call(null,a,b,c,d,e,f,h,k,l,m,q)};g.Ra=function(a,b,c,d,e,f,h,k,l,m,q,n){var r=this.w.Ra?this.w.Ra(a,b,c,d,e,f,h,k,l,m,q,n):this.w.call(null,a,b,c,d,e,f,h,k,l,m,q,n),p=Tj(this,r);B(p)||Kj(this.name,r);return p.Ra?p.Ra(a,b,c,d,e,f,h,k,l,m,q,n):p.call(null,a,b,c,d,e,f,h,k,l,m,q,n)};
g.Sa=function(a,b,c,d,e,f,h,k,l,m,q,n,r){var p=this.w.Sa?this.w.Sa(a,b,c,d,e,f,h,k,l,m,q,n,r):this.w.call(null,a,b,c,d,e,f,h,k,l,m,q,n,r),t=Tj(this,p);B(t)||Kj(this.name,p);return t.Sa?t.Sa(a,b,c,d,e,f,h,k,l,m,q,n,r):t.call(null,a,b,c,d,e,f,h,k,l,m,q,n,r)};
g.Ta=function(a,b,c,d,e,f,h,k,l,m,q,n,r,p){var t=this.w.Ta?this.w.Ta(a,b,c,d,e,f,h,k,l,m,q,n,r,p):this.w.call(null,a,b,c,d,e,f,h,k,l,m,q,n,r,p),x=Tj(this,t);B(x)||Kj(this.name,t);return x.Ta?x.Ta(a,b,c,d,e,f,h,k,l,m,q,n,r,p):x.call(null,a,b,c,d,e,f,h,k,l,m,q,n,r,p)};
g.Ua=function(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t){var x=this.w.Ua?this.w.Ua(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t):this.w.call(null,a,b,c,d,e,f,h,k,l,m,q,n,r,p,t),v=Tj(this,x);B(v)||Kj(this.name,x);return v.Ua?v.Ua(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t):v.call(null,a,b,c,d,e,f,h,k,l,m,q,n,r,p,t)};
g.Va=function(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x){var v=this.w.Va?this.w.Va(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x):this.w.call(null,a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x),H=Tj(this,v);B(H)||Kj(this.name,v);return H.Va?H.Va(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x):H.call(null,a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x)};
g.Wa=function(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v){var H=this.w.Wa?this.w.Wa(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v):this.w.call(null,a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v),P=Tj(this,H);B(P)||Kj(this.name,H);return P.Wa?P.Wa(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v):P.call(null,a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v)};
g.Xa=function(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H){var P=this.w.Xa?this.w.Xa(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H):this.w.call(null,a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H),ea=Tj(this,P);B(ea)||Kj(this.name,P);return ea.Xa?ea.Xa(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H):ea.call(null,a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H)};
g.Ya=function(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P){var ea=this.w.Ya?this.w.Ya(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P):this.w.call(null,a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P),ca=Tj(this,ea);B(ca)||Kj(this.name,ea);return ca.Ya?ca.Ya(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P):ca.call(null,a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P)};
g.Za=function(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P,ea){var ca=this.w.Za?this.w.Za(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P,ea):this.w.call(null,a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P,ea),ma=Tj(this,ca);B(ma)||Kj(this.name,ca);return ma.Za?ma.Za(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P,ea):ma.call(null,a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P,ea)};
g.fe=function(a,b,c,d,e,f,h,k,l,m,q,n,r,p,t,x,v,H,P,ea,ca){var ma=Df(this.w,a,b,c,d,R([e,f,h,k,l,m,q,n,r,p,t,x,v,H,P,ea,ca])),T=Tj(this,ma);B(T)||Kj(this.name,ma);return Df(T,a,b,c,d,R([e,f,h,k,l,m,q,n,r,p,t,x,v,H,P,ea,ca]))};function Uj(a,b){var c=Vj;hg.J(c.Md,ne,a,b);Gj(c.Ld,c.Md,c.vd,c.Gd)}function Tj(a,b){Dd.g(Dc(a.vd),Dc(a.Gd))||Gj(a.Ld,a.Md,a.vd,a.Gd);var c=Dc(a.Ld);c=c.a?c.a(b):c.call(null,b);return B(c)?c:Jj(a.name,b,a.Gd,a.Md,a.$f,a.Ld,a.vd,a.Hf)}g.yd=function(){return ed(this.name)};
g.zd=function(){return fd(this.name)};g.Y=function(){return qa(this)};function li(a,b){this.hc=a;this.C=b;this.l=2153775104;this.I=2048}g=li.prototype;g.toString=function(){return this.hc};g.equiv=function(a){return this.H(null,a)};g.H=function(a,b){return b instanceof li&&this.hc===b.hc};g.W=function(a,b){return Uc(b,['#uuid "',I.a(this.hc),'"'].join(""))};g.Y=function(){null==this.C&&(this.C=vd(this.hc));return this.C};
function Wj(a,b,c){var d=Error(a);this.message=a;this.data=b;this.Ne=c;this.name=d.name;this.description=d.description;this.number=d.number;this.fileName=d.fileName;this.lineNumber=d.lineNumber;this.columnNumber=d.columnNumber;this.stack=d.stack;return this}Wj.prototype.__proto__=Error.prototype;Wj.prototype.ja=w;
Wj.prototype.W=function(a,b,c){Uc(b,"#error {:message ");ej(this.message,b,c);B(this.data)&&(Uc(b,", :data "),ej(this.data,b,c));B(this.Ne)&&(Uc(b,", :cause "),ej(this.Ne,b,c));return Uc(b,"}")};Wj.prototype.toString=function(){return md(this)};if("undefined"===typeof wb||"undefined"===typeof xb||"undefined"===typeof Xj)var Xj=null;"undefined"!==typeof console&&Lb();
if("undefined"===typeof wb||"undefined"===typeof xb||"undefined"===typeof Yj)var Yj=function(){throw Error("cljs.core/*eval* not bound");};Lb();var Zj=new K(null,"lng","lng",1667213918),oj=new K(null,"val","val",128701612),ak=new K(null,"readers","readers",-2118263030),bk=new K(null,"timeout","timeout",-318625318),ck=new K(null,"line","line",212345235),dk=new K(null,"original-text","original-text",744448452),ek=new K(null,"left","left",-399115937),fk=new K(null,"content-type","content-type",-508222634),ik=new K(null,"looked-up-in","looked-up-in",258688908),jk=new K(null,"geo","geo",-2054400503),kk=new K(null,"headers","headers",-835030129),
lk=new K(null,"method","method",55703592),mk=new K(null,"string","string",-1989541586),nk=new K(null,"write","write",-1857649168),ok=new K(null,"status-text","status-text",-1834235478),pk=new K(null,"namespaced-map","namespaced-map",1235665380),qk=new K(null,"handlers","handlers",79528781),rk=new K(null,"zip-code-tabulation-area","zip-code-tabulation-area",-1640974557),sk=new K(null,"status","status",-1997798413),Cj=new K(null,"descendants","descendants",1824886031),tk=new K(null,"tag","tag",-1290361223),
uk=new K(null,"description","description",-1428560544),vk=new K(null,"finally","finally",1589088705),wk=new K(null,"features","features",-1146962336),xk=new K(null,"recur","recur",-437573268),yk=new K(null,"attributes","attributes",-74013604),zk=new xd(null,"vacc","vacc",-1937917185,null),Ak=new K(null,"edn","edn",1317840885),Bk=new xd("linked","set","linked/set",833210926,null),gj=new K(null,"alt-impl","alt-impl",670969595),Ck=new K(null,"vintage","vintage",818195578),Dk=new K(null,"state","state",
-1988618099),Ek=new K(null,"geocodes","geocodes",-857805648),Fk=new K(null,"parse-error","parse-error",255902478),Gk=new K(null,"exception","exception",-335277064),Hk=new xd(null,"cb","cb",-2064487928,null),Ik=new xd(null,"meta34774","meta34774",-1171669992,null),Jk=new xd(null,"/","/",-1371932971,null),Kk=new K(null,"parse","parse",-1162164619),Lk=new K(null,"raw","raw",1604651272),Mk=new K(null,"interceptors","interceptors",-1546782951),Gb=new K(null,"flush-on-newline","flush-on-newline",-151457939),
Nk=new K(null,"illegal-argument","illegal-argument",-1845493170),Ok=new K(null,"reader","reader",169660853),Pk=new xd(null,"meta34769","meta34769",-206997124,null),Qk=new K(null,"values","values",372645556),Rk=new K(null,"character","character",380652989),Sk=new K(null,"us","us",746429226),Tk=new K(null,"xform","xform",-1725711008),Uk=new K("cljs.analyzer","analyzed","cljs.analyzer/analyzed",-735094162),Vk=new K(null,"failed","failed",-1397425762),Wk=new xd(null,"kfn","kfn",729311001,null),Xk=new K(null,
"hierarchy","hierarchy",-1053470341),Yk=new K("clojure.core.match","not-found","clojure.core.match/not-found",1553053780),Zk=new K(null,"wms","wms",663469516),$k=new K(null,"set","set",304602554),al=new xd(null,"meta34863","meta34863",-1120570399,null),bl=new K(null,"lookup-up-in","lookup-up-in",576418132),cl=new K(null,"strable","strable",1877668047),dl=new xd(null,"meta34745","meta34745",-1148529315,null),el=new K(null,"symbol","symbol",-1038572696),fl=new K(null,"error","error",-978969032),gl=
new K(null,"st","st",1455255828),hl=new K(null,"filter-id","filter-id",-84826199),il=new xd(null,"meta34738","meta34738",756852564,null),jl=new K(null,"value","value",305978217),hj=new K(null,"fallback-impl","fallback-impl",-1501286995),kl=new K(null,"prefix","prefix",-265908465),ll=new K(null,"lookup","lookup",1225356838),ml=new K(null,"catch-exception","catch-exception",-1997306795),nl=new K(null,"sourcePath","sourcePath",-986600405),uj=new K(null,"keyword-fn","keyword-fn",-64566675),ol=new xd("linked",
"map","linked/map",-195852787,null),pl=new K(null,"county","county",-1347113013),ql=new K(null,"url-params","url-params",-697567619),rl=new K(null,"vector","vector",1902966158),sl=new K(null,"stats+geos","stats+geos",-1652005478),tl=new K(null,"keywords?","keywords?",764949733),ul=new xd(null,"meta34837","meta34837",466043184,null),vl=new K(null,"format","format",-1306924766),wl=new K(null,"finally-block","finally-block",832982472),xl=new K(null,"eof","eof",-489063237),yl=new xd(null,"f","f",43394975,
null),zl=new xd(null,"js","js",-886355190,null),Al=new K(null,"not-initialized","not-initialized",-1937378906),Bl=new xd(null,"meta34829","meta34829",-927715109,null),Cl=new K(null,"type","type",1174270348),Dl=new K(null,"reader-error","reader-error",1610253121),El=new xd(null,"m","m",-1021758608,null),Yi=new K(null,"more-marker","more-marker",-14717935),Fl=new K(null,"vec-strategy","vec-strategy",1843221372),Gl=new xd(null,"rf","rf",-651557526,null),Hl=new xd(null,"pair","pair",1193015215,null),
Il=new xd(null,"val","val",1769233139,null),Jl=new K(null,"layers","layers",1944875032),Kl=new K(null,"getter","getter",84844855),Ll=new K(null,"handler","handler",-195596612),Ib=new K(null,"meta","meta",1499536964),Ml=new xd(null,"meta27265","meta27265",-109869200,null),Nl=new K(null,"map","map",1371690461),Ol=new K(null,"read","read",1140058661),Pl=new K(null,"body","body",-2049205669),Ql=new K(null,"right","right",-452581833),Rl=new xd(null,"mrf","mrf",-887894298,null),Sl=new K(null,"uri","uri",
-774711847),Tl=new xd(null,"meta27374","meta27374",-458851111,null),Ul=new K(null,"url","url",276297046),Vl=new K(null,"col","col",-1959363084),Wl=new K(null,"no-values","no-values",711523891),Xl=new K(null,"failure","failure",720415879),Yl=new K(null,"id\x3c-json","id\x3c-json",-1249818926),Zl=new K(null,"catch-block","catch-block",1175212748),$l=new K(null,"lat","lat",-580793929),am=new xd(null,"inst","inst",-2008473268,null),bm=new K(null,"with-credentials","with-credentials",-1163127235),cm=new K(null,
"ex-kind","ex-kind",1581199296),dm=new K(null,"cur-layer-idx","cur-layer-idx",1604904097),em=new K(null,"sub-level","sub-level",368751408),Hf=new xd(null,"meta26147","meta26147",-82244978,null),fm=new K(null,"java","java",1958249105),gm=new xd(null,"to","to",1832630534,null),hm=new xd(null,"-Inf","-Inf",-2123243689,null),im=new K(null,"processing-request","processing-request",-264947221),jm=new K(null,"request-received","request-received",2110590540),km=new K(null,"properties","properties",685819552),
Sj=new K(null,"default","default",-1987822328),lm=new K(null,"stats-only","stats-only",-1854147429),mm=new xd(null,"meta27452","meta27452",-359435410,null),nm=new K(null,"prev","prev",-1597069226),om=new xd(null,"Inf","Inf",647172781,null),pm=new xd(null,"vfn","vfn",-868700079,null),Jb=new K(null,"dup","dup",556298533),qm=new K(null,"api","api",-899839580),Kb=new K(null,"print-length","print-length",1931866356),rm=new K(null,"nil","nil",99600501),sm=new K(null,"json","json",1279968570),tm=new xd(null,
"meta27445","meta27445",-1155193796,null),um=new K(null,"priority","priority",1431093715),vm=new K(null,"reader-exception","reader-exception",-1938323098),wm=new xd(null,"make-rf","make-rf",44212345,null),xm=new K(null,"geos-only","geos-only",-735736590),yj=new K(null,"keywordize-keys","keywordize-keys",1310784252),ym=new K(null,"aborted","aborted",1775972619),zm=new K(null,"list","list",765357683),Am=new K(null,"silent","silent",-1142977785),Bm=new K(null,"column","column",2078222095),Cm=new xd(null,
"meta27427","meta27427",758201894,null),Dm=new xd(null,"xform","xform",-85179481,null),Em=new K(null,"continue-block","continue-block",-1852047850),Bj=new K(null,"parents","parents",-2027538891),Fm=new K(null,"response","response",-1068424192),Hb=new K(null,"readably","readably",1129599760),Gm=new K(null,"geoResolution","geoResolution",1206666050),Hm=new xd(null,"blockable","blockable",-28395259,null),Im=new K(null,"error-handler","error-handler",-484945776),Jm=new K(null,"file","file",-1269645878),
Km=new K("net.cgrand.xforms","default","net.cgrand.xforms/default",-729285165),Lm=new K(null,"json-verbose","json-verbose",-542533531),Mm=new K(null,"statsKey","statsKey",452548050),Nm=new K(null,"scopes","scopes",-1571524352),Om=new xd(null,"or__4131__auto__","or__4131__auto__",941665662,null),Pm=new K(null,"connection-established","connection-established",-1403749733),Qm=new K(null,"geoHierarchy","geoHierarchy",380422740),Rm=new xd(null,"flag","flag",-1565787888,null),Sm=new K(null,"writer","writer",
-277568236),$m=new K(null,"progress-handler","progress-handler",333585589),an=new K(null,"response-ready","response-ready",245208276),bn=new K(null,"predicates","predicates",620402712),cn=new xd(null,"uuid","uuid",-504564192,null),dn=new xd(null,"NaN","NaN",666918153,null),en=new xd(null,"queue","queue",-1198599890,null),fn=new K(null,"keyword","keyword",811389747),gn=new K(null,"params","params",710516235),Dj=new K(null,"ancestors","ancestors",-776045424),hn=new K(null,"response-format","response-format",
1664465322);var jn={},kn,ln,mn,nn={},on=function on(a,b){if(null!=a&&null!=a.le)return a.le(a,b);var d=on[la(null==a?null:a)];if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);d=on._;if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);throw Sb("ReadPort.take!",a);},pn=function pn(a,b,c){if(null!=a&&null!=a.Ad)return a.Ad(a,b,c);var e=pn[la(null==a?null:a)];if(null!=e)return e.h?e.h(a,b,c):e.call(null,a,b,c);e=pn._;if(null!=e)return e.h?e.h(a,b,c):e.call(null,a,b,c);throw Sb("WritePort.put!",a);},qn=function qn(a){if(null!=
a&&null!=a.cd)return a.cd(a);var c=qn[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=qn._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("Channel.close!",a);},rn=function rn(a){if(null!=a&&null!=a.pb)return a.pb(a);var c=rn[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=rn._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("Handler.active?",a);},sn=function sn(a){if(null!=a&&null!=a.hb)return a.hb(a);var c=sn[la(null==a?null:a)];if(null!=c)return c.a?
c.a(a):c.call(null,a);c=sn._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("Handler.commit",a);},tn=function tn(a,b){if(null!=a&&null!=a.je)return a.je(a,b);var d=tn[la(null==a?null:a)];if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);d=tn._;if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);throw Sb("Buffer.add!*",a);},un=function un(a){switch(arguments.length){case 1:return un.a(arguments[0]);case 2:return un.g(arguments[0],arguments[1]);default:throw Error(["Invalid arity: ",I.a(arguments.length)].join(""));
}};un.a=function(a){return a};un.g=function(a,b){return tn(a,b)};un.O=2;var vn={};function wn(a,b,c,d,e){for(var f=0;;)if(f<e)c[d+f]=a[b+f],f+=1;else break}function xn(a){this.length=this.la=this.head=0;this.j=a}g=xn.prototype;g.pop=function(){if(0===this.length)return null;var a=this.j[this.la];this.j[this.la]=null;this.la=(this.la+1)%this.j.length;--this.length;return a};g.unshift=function(a){this.j[this.head]=a;this.head=(this.head+1)%this.j.length;this.length+=1;return null};g.unbounded_unshift=function(a){this.length+1===this.j.length&&this.resize();return this.unshift(a)};
g.resize=function(){var a=Array(2*this.j.length);return this.la<this.head?(wn(this.j,this.la,a,0,this.length),this.la=0,this.head=this.length,this.j=a):this.la>this.head?(wn(this.j,this.la,a,0,this.j.length-this.la),wn(this.j,0,a,this.j.length-this.la,this.head),this.la=0,this.head=this.length,this.j=a):this.la===this.head?(this.head=this.la=0,this.j=a):null};g.cleanup=function(a){for(var b=this.length,c=0;;)if(c<b){var d=this.pop();(a.a?a.a(d):a.call(null,d))&&this.unshift(d);c+=1}else return null};
function yn(a,b){this.da=a;this.n=b;this.l=2;this.I=0}g=yn.prototype;g.ke=function(){return this.da.length===this.n};g.bd=function(){return this.da.pop()};g.je=function(a,b){this.da.unbounded_unshift(b);return this};g.Ve=function(){};g.Z=function(){return this.da.length};if("undefined"===typeof wb||"undefined"===typeof xb||"undefined"===typeof jn||"undefined"===typeof nn||"undefined"===typeof vn||"undefined"===typeof zn)var zn={};function An(){this.s=zn;this.l=2;this.I=0}g=An.prototype;g.ke=function(){return!1};
g.bd=function(){return this.s};g.je=function(a,b){zn===this.s&&(this.s=b);return this};g.Ve=function(){zn===this.s&&(this.s=null)};g.Z=function(){return zn===this.s?0:1};var bb;a:{var Bn=fa.navigator;if(Bn){var Cn=Bn.userAgent;if(Cn){bb=Cn;break a}}bb=""}function Dn(a){return-1!=bb.indexOf(a)};var En;
function Fn(){var a=fa.MessageChannel;"undefined"===typeof a&&"undefined"!==typeof window&&window.postMessage&&window.addEventListener&&!Dn("Presto")&&(a=function(){var e=document.createElement("IFRAME");e.style.display="none";e.src="";document.documentElement.appendChild(e);var f=e.contentWindow;e=f.document;e.open();e.write("");e.close();var h="callImmediate"+Math.random(),k="file:"==f.location.protocol?"*":f.location.protocol+"//"+f.location.host;e=wa(function(l){if(("*"==k||l.origin==k)&&l.data==
h)this.port1.onmessage()},this);f.addEventListener("message",e,!1);this.port1={};this.port2={postMessage:function(){f.postMessage(h,k)}}});if("undefined"!==typeof a&&!Dn("Trident")&&!Dn("MSIE")){var b=new a,c={},d=c;b.port1.onmessage=function(){if(void 0!==c.next){c=c.next;var e=c.Uc;c.Uc=null;e()}};return function(e){d.next={Uc:e};d=d.next;b.port2.postMessage(0)}}return"undefined"!==typeof document&&"onreadystatechange"in document.createElement("SCRIPT")?function(e){var f=document.createElement("SCRIPT");
f.onreadystatechange=function(){f.onreadystatechange=null;f.parentNode.removeChild(f);f=null;e();e=null};document.documentElement.appendChild(f)}:function(e){fa.setTimeout(e,0)}};var Gn=new xn(Array(32)),Hn=!1,In=!1;function Jn(){Hn=!0;In=!1;for(var a=0;;){var b=Gn.pop();if(null!=b&&(b.o?b.o():b.call(null),1024>a)){a+=1;continue}break}Hn=!1;return 0<Gn.length?Kn.o?Kn.o():Kn.call(null):null}function Kn(){if(In&&Hn)return null;In=!0;!oa(fa.setImmediate)||fa.Window&&fa.Window.prototype&&!Dn("Edge")&&fa.Window.prototype.setImmediate==fa.setImmediate?(En||(En=Fn()),En(Jn)):fa.setImmediate(Jn)}function Ln(a){Gn.unbounded_unshift(a);Kn()};var Mn={},Nn;
function On(a){if("undefined"===typeof wb||"undefined"===typeof xb||"undefined"===typeof jn||"undefined"===typeof nn||"undefined"===typeof Mn||"undefined"===typeof Nn)Nn=function(b,c){this.s=b;this.Lf=c;this.l=425984;this.I=0},Nn.prototype.U=function(b,c){return new Nn(this.s,c)},Nn.prototype.S=function(){return this.Lf},Nn.prototype.Xc=function(){return this.s},Nn.Ab=function(){return new V(null,2,5,X,[Il,Ml],null)},Nn.qb=!0,Nn.ib="cljs.core.async.impl.channels/t_cljs$core$async$impl$channels27264",Nn.ub=
function(b,c){return Uc(c,"cljs.core.async.impl.channels/t_cljs$core$async$impl$channels27264")};return new Nn(a,If)}function Pn(a,b){this.rb=a;this.s=b}function Qn(a){return rn(a.rb)}function Rn(a,b,c,d){this.Pc=a;this.Ed=0;this.ec=b;this.Dd=0;this.da=c;this.closed=!1;this.xb=d}
function Sn(a){for(;;){var b=a.ec.pop();if(null!=b){var c=b.rb,d=b.s;if(c.pb(null)){var e=c.hb(null);Ln(function(f){return function(){return f.a?f.a(!0):f.call(null,!0)}}(e,c,d,b,a))}else continue}break}a.ec.cleanup(ag(!1));a.cd(null)}
Rn.prototype.Ad=function(a,b,c){var d=this,e=this,f=d.closed;if(f||!c.pb(null))return On(!f);if(B(function(){var q=d.da;return B(q)?Ob(d.da.ke()):q}())){c.hb(null);var h=Md(d.xb.g?d.xb.g(d.da,b):d.xb.call(null,d.da,b));c=function(){for(var q=je;;)if(0<d.Pc.length&&0<Q(d.da)){var n=d.Pc.pop();if(n.pb(null)){var r=n.hb(null),p=d.da.bd();q=ie.g(q,function(t,x,v){return function(){return x.a?x.a(v):x.call(null,v)}}(q,r,p,n,h,f,e))}}else return q}();h&&Sn(e);if(M(c)){c=M(c);a=null;for(var k=0,l=0;;)if(l<
k){var m=a.P(null,l);Ln(m);l+=1}else if(c=M(c))a=c,Ce(a)?(c=cd(a),l=dd(a),a=c,k=Q(c),c=l):(c=N(a),Ln(c),c=O(a),a=null,k=0),l=0;else break}return On(!0)}a=function(){for(;;){var q=d.Pc.pop();if(B(q)){if(B(q.pb(null)))return q}else return null}}();if(B(a))return k=a.hb(null),c.hb(null),Ln(function(q){return function(){return q.a?q.a(b):q.call(null,b)}}(k,a,f,e)),On(!0);64<d.Dd?(d.Dd=0,d.ec.cleanup(Qn)):d.Dd+=1;B(c.dd(null))&&d.ec.unbounded_unshift(new Pn(c,b));return null};
Rn.prototype.le=function(a,b){var c=this;if(b.pb(null)){if(null!=c.da&&0<Q(c.da)){a=b.hb(null);if(B(a)){var d=c.da.bd(),e=0<c.ec.length?function(){for(var t=je;;){var x=c.ec.pop(),v=x.rb;x=x.s;var H=v.pb(null);v=H?v.hb(null):H;t=B(v)?ie.g(t,v):t;x=B(v)?Md(c.xb.g?c.xb.g(c.da,x):c.xb.call(null,c.da,x)):null;if(!(Ob(x)&&Ob(c.da.ke())&&0<c.ec.length))return new V(null,2,5,X,[x,t],null)}}():null,f=S(e,0,null),h=S(e,1,null);B(f)&&Sn(this);for(var k=M(h),l=null,m=0,q=0;;)if(q<m){var n=l.P(null,q);Ln(function(t,
x,v,H,P){return function(){return P.a?P.a(!0):P.call(null,!0)}}(k,l,m,q,n,d,e,f,h,a,a,this));q+=1}else{var r=M(k);if(r){n=r;if(Ce(n))k=cd(n),q=dd(n),l=k,m=Q(k),k=q;else{var p=N(n);Ln(function(t,x,v,H,P){return function(){return P.a?P.a(!0):P.call(null,!0)}}(k,l,m,q,p,n,r,d,e,f,h,a,a,this));k=O(n);l=null;m=0}q=0}else break}return On(d)}return null}a=function(){for(;;){var t=c.ec.pop();if(B(t)){if(rn(t.rb))return t}else return null}}();if(B(a))return d=sn(a.rb),b.hb(null),Ln(function(t){return function(){return t.a?
t.a(!0):t.call(null,!0)}}(d,a,this)),On(a.s);if(B(c.closed))return B(c.da)&&(c.xb.a?c.xb.a(c.da):c.xb.call(null,c.da)),B(function(){var t=b.pb(null);return B(t)?b.hb(null):t}())?(a=function(){var t=c.da;return B(t)?0<Q(c.da):t}(),d=B(a)?c.da.bd():null,On(d)):null;64<c.Ed?(c.Ed=0,c.Pc.cleanup(rn)):c.Ed+=1;B(b.dd(null))&&c.Pc.unbounded_unshift(b)}return null};
Rn.prototype.cd=function(){var a=this;if(!a.closed){a.closed=!0;for(B(function(){var e=a.da;return B(e)?0===a.ec.length:e}())&&(a.xb.a?a.xb.a(a.da):a.xb.call(null,a.da));;){var b=a.Pc.pop();if(null!=b){if(b.pb(null)){var c=b.hb(null),d=B(function(){var e=a.da;return B(e)?0<Q(a.da):e}())?a.da.bd():null;Ln(function(e,f){return function(){return e.a?e.a(f):e.call(null,f)}}(c,d,b,this))}}else break}B(a.da)&&a.da.Ve()}return null};function Tn(a){console.log(a);return null}
function Un(a,b){var c=B(null)?null:Tn;b=c.a?c.a(b):c.call(null,b);return null==b?a:un.g(a,b)}
function Vn(a,b){return new Rn(new xn(Array(32)),new xn(Array(32)),a,function(){return function(c){return function(){function d(h,k){try{return c.g?c.g(h,k):c.call(null,h,k)}catch(l){return Un(h,l)}}function e(h){try{return c.a?c.a(h):c.call(null,h)}catch(k){return Un(h,k)}}var f=null;f=function(h,k){switch(arguments.length){case 1:return e.call(this,h);case 2:return d.call(this,h,k)}throw Error("Invalid arity: "+arguments.length);};f.a=e;f.g=d;return f}()}(B(b)?b.a?b.a(un):b.call(null,un):un)}())}
;var Wn={},Xn;
function Yn(a){if("undefined"===typeof wb||"undefined"===typeof xb||"undefined"===typeof jn||"undefined"===typeof nn||"undefined"===typeof Wn||"undefined"===typeof Xn)Xn=function(b,c){this.ya=b;this.Mf=c;this.l=393216;this.I=0},Xn.prototype.U=function(b,c){return new Xn(this.ya,c)},Xn.prototype.S=function(){return this.Mf},Xn.prototype.pb=function(){return!0},Xn.prototype.dd=function(){return!0},Xn.prototype.hb=function(){return this.ya},Xn.Ab=function(){return new V(null,2,5,X,[yl,Tl],null)},Xn.qb=
!0,Xn.ib="cljs.core.async.impl.ioc-helpers/t_cljs$core$async$impl$ioc_helpers27373",Xn.ub=function(b,c){return Uc(c,"cljs.core.async.impl.ioc-helpers/t_cljs$core$async$impl$ioc_helpers27373")};return new Xn(a,If)}function Zn(a){try{var b=a[0];return b.a?b.a(a):b.call(null,a)}catch(c){if(c instanceof Object)throw b=c,a[6].cd(null),b;throw c;}}function $n(a,b,c){c=c.le(null,Yn(function(d){a[2]=d;a[1]=b;return Zn(a)}));return B(c)?(a[2]=Dc(c),a[1]=b,xk):null}
function ao(a,b,c,d){c=c.Ad(null,d,Yn(function(e){a[2]=e;a[1]=b;return Zn(a)}));return B(c)?(a[2]=Dc(c),a[1]=b,xk):null}function bo(a,b){a=a[6];null!=b&&a.Ad(null,b,Yn(function(){return function(){return null}}(a)));a.cd(null);return a}
function co(a){for(;;){var b=a[4],c=Zl.a(b),d=ml.a(b),e=a[5];if(B(function(){var f=e;return B(f)?Ob(b):f}()))throw e;if(B(function(){var f=e;return B(f)?(f=c,B(f)?Dd.g(Sj,d)||e instanceof d:f):f}())){a[1]=c;a[2]=e;a[5]=null;a[4]=ne.A(b,Zl,null,R([ml,null]));break}if(B(function(){var f=e;return B(f)?Ob(c)&&Ob(wl.a(b)):f}()))a[4]=nm.a(b);else{if(B(function(){var f=e;return B(f)?(f=Ob(c))?wl.a(b):f:f}())){a[1]=wl.a(b);a[4]=ne.h(b,wl,null);break}if(B(function(){var f=Ob(e);return f?wl.a(b):f}())){a[1]=
wl.a(b);a[4]=ne.h(b,wl,null);break}if(Ob(e)&&Ob(wl.a(b))){a[1]=Em.a(b);a[4]=nm.a(b);break}throw Error("No matching clause");}}};function eo(a){if("undefined"===typeof wb||"undefined"===typeof xb||"undefined"===typeof jn||"undefined"===typeof kn)kn=function(b,c,d){this.ya=b;this.Le=c;this.Nf=d;this.l=393216;this.I=0},kn.prototype.U=function(b,c){return new kn(this.ya,this.Le,c)},kn.prototype.S=function(){return this.Nf},kn.prototype.pb=function(){return!0},kn.prototype.dd=function(){return this.Le},kn.prototype.hb=function(){return this.ya},kn.Ab=function(){return new V(null,3,5,X,[yl,Hm,Cm],null)},kn.qb=!0,kn.ib="cljs.core.async/t_cljs$core$async27426",
kn.ub=function(b,c){return Uc(c,"cljs.core.async/t_cljs$core$async27426")};return new kn(a,!0,If)}function fo(a,b){a=Dd.g(a,0)?null:a;return Vn("number"===typeof a?new yn(new xn(Array(a)),a):a,b)}function go(a,b){return ho(a,b)}function ho(a,b){a=on(a,eo(b));if(B(a)){var c=Dc(a);B(!0)?b.a?b.a(c):b.call(null,c):Ln(function(d){return function(){return b.a?b.a(d):b.call(null,d)}}(c,a))}return null}var io=eo(function(){return null});function jo(a,b){a=pn(a,b,io);return B(a)?Dc(a):!0}
function ko(a){for(var b=Array(a),c=0;;)if(c<a)b[c]=0,c+=1;else break;for(c=1;;){if(Dd.g(c,a))return b;var d=Math.floor(Math.random()*c);b[c]=b[d];b[d]=c;c+=1}}
function lo(){var a=fg(!0);if("undefined"===typeof wb||"undefined"===typeof xb||"undefined"===typeof jn||"undefined"===typeof ln)ln=function(b,c){this.vc=b;this.Of=c;this.l=393216;this.I=0},ln.prototype.U=function(){return function(b,c){return new ln(this.vc,c)}}(a),ln.prototype.S=function(){return function(){return this.Of}}(a),ln.prototype.pb=function(){return function(){return Dc(this.vc)}}(a),ln.prototype.dd=function(){return function(){return!0}}(a),ln.prototype.hb=function(){return function(){gg(this.vc,
null);return!0}}(a),ln.Ab=function(){return function(){return new V(null,2,5,X,[Rm,tm],null)}}(a),ln.qb=!0,ln.ib="cljs.core.async/t_cljs$core$async27444",ln.ub=function(){return function(b,c){return Uc(c,"cljs.core.async/t_cljs$core$async27444")}}(a);return new ln(a,If)}
function mo(a,b){if("undefined"===typeof wb||"undefined"===typeof xb||"undefined"===typeof jn||"undefined"===typeof mn)mn=function(c,d,e){this.vc=c;this.Uc=d;this.Pf=e;this.l=393216;this.I=0},mn.prototype.U=function(c,d){return new mn(this.vc,this.Uc,d)},mn.prototype.S=function(){return this.Pf},mn.prototype.pb=function(){return rn(this.vc)},mn.prototype.dd=function(){return!0},mn.prototype.hb=function(){sn(this.vc);return this.Uc},mn.Ab=function(){return new V(null,3,5,X,[Rm,Hk,mm],null)},mn.qb=
!0,mn.ib="cljs.core.async/t_cljs$core$async27451",mn.ub=function(c,d){return Uc(d,"cljs.core.async/t_cljs$core$async27451")};return new mn(a,b,If)}
function no(a,b,c){var d=lo(),e=Q(b),f=ko(e),h=um.a(c),k=function(){for(var l=0;;)if(l<e){var m=B(h)?l:f[l],q=Xd(b,m),n=Be(q)?q.a?q.a(0):q.call(null,0):null,r=B(n)?function(){var p=q.a?q.a(1):q.call(null,1);return pn(n,p,mo(d,function(t,x,v,H,P){return function(ea){ea=new V(null,2,5,X,[ea,P],null);return a.a?a.a(ea):a.call(null,ea)}}(l,p,m,q,n,d,e,f,h)))}():on(q,mo(d,function(p,t,x){return function(v){v=new V(null,2,5,X,[v,x],null);return a.a?a.a(v):a.call(null,v)}}(l,m,q,n,d,e,f,h)));if(B(r))return On(new V(null,
2,5,X,[Dc(r),function(){var p=n;return B(p)?p:q}()],null));l+=1}else return null}();return B(k)?k:Je(c,Sj)?(k=function(){var l=d.pb(null);return B(l)?d.hb(null):l}(),B(k)?On(new V(null,2,5,X,[Sj.a(c),Sj],null)):null):null}
function oo(a,b){var c=fo(1,null);Ln(function(d){return function(){var e=function(){return function(h){return function(){function k(q){for(;;){a:try{for(;;){var n=h(q);if(!af(n,xk)){var r=n;break a}}}catch(p){if(p instanceof Object)q[5]=p,co(q),r=xk;else throw p;}if(!af(r,xk))return r}}function l(){var q=[null,null,null,null,null,null,null,null];q[0]=m;q[1]=1;return q}var m=null;m=function(q){switch(arguments.length){case 0:return l.call(this);case 1:return k.call(this,q)}throw Error("Invalid arity: "+
arguments.length);};m.o=l;m.a=k;return m}()}(function(){return function(h){var k=h[1];return 7===k?(h[2]=h[2],h[1]=3,xk):1===k?(h[2]=null,h[1]=2,xk):4===k?(k=h[2],h[7]=k,h[1]=B(null==k)?5:6,xk):13===k?(h[2]=null,h[1]=14,xk):6===k?(k=h[7],ao(h,11,b,k)):3===k?bo(h,h[2]):12===k?(h[2]=null,h[1]=2,xk):2===k?$n(h,4,a):11===k?(h[1]=B(h[2])?12:13,xk):9===k?(h[2]=null,h[1]=10,xk):5===k?(h[1]=B(!0)?8:9,xk):14===k||10===k?(h[2]=h[2],h[1]=7,xk):8===k?(k=qn(b),h[2]=k,h[1]=10,xk):null}}(d),d)}(),f=function(){var h=
e.o?e.o():e.call(null);h[6]=d;return h}();return Zn(f)}}(c));return b}
function po(a,b){var c=fo(1,null);Ln(function(d){return function(){var e=function(){return function(h){return function(){function k(q){for(;;){a:try{for(;;){var n=h(q);if(!af(n,xk)){var r=n;break a}}}catch(p){if(p instanceof Object)q[5]=p,co(q),r=xk;else throw p;}if(!af(r,xk))return r}}function l(){var q=[null,null,null,null,null,null,null,null];q[0]=m;q[1]=1;return q}var m=null;m=function(q){switch(arguments.length){case 0:return l.call(this);case 1:return k.call(this,q)}throw Error("Invalid arity: "+
arguments.length);};m.o=l;m.a=k;return m}()}(function(){return function(h){var k=h[1];return 7===k?(h[2]=h[2],h[1]=6,xk):1===k?(k=M(b),h[7]=k,h[2]=null,h[1]=2,xk):4===k?(k=h[7],k=N(k),ao(h,7,a,k)):13===k?(h[2]=h[2],h[1]=10,xk):6===k?(h[1]=B(h[2])?8:9,xk):3===k?bo(h,h[2]):12===k?(h[2]=null,h[1]=13,xk):2===k?(k=h[7],h[1]=B(k)?4:5,xk):11===k?(k=qn(a),h[2]=k,h[1]=13,xk):9===k?(h[1]=B(!0)?11:12,xk):5===k?(k=h[7],h[2]=k,h[1]=6,xk):10===k?(h[2]=h[2],h[1]=3,xk):8===k?(k=h[7],k=O(k),h[7]=k,h[2]=null,h[1]=
2,xk):null}}(d),d)}(),f=function(){var h=e.o?e.o():e.call(null);h[6]=d;return h}();return Zn(f)}}(c))}function qo(a){var b=fo(of(100,a),null);po(b,a);return b}function ro(a){for(var b=[],c=arguments.length,d=0;;)if(d<c)b.push(arguments[d]),d+=1;else break;return so(arguments[0],arguments[1],arguments[2],3<b.length?new Ad(b.slice(3),0,null):null)}
function so(a,b,c,d){var e=null!=d&&(d.l&64||w===d.T)?zf(Di,d):d;a[1]=b;b=no(function(){return function(f){a[2]=f;return Zn(a)}}(d,e,e),c,e);return B(b)?(a[2]=Dc(b),xk):null};var Z=Error();function to(a,b,c){var d=B(b.ignoreCase)?"gi":"g";d=B(b.multiline)?[d,"m"].join(""):d;return a.replace(new RegExp(b.source,B(b.tg)?[d,"u"].join(""):d),c)}
function uo(a){return function(){function b(d){var e=null;if(0<arguments.length){e=0;for(var f=Array(arguments.length-0);e<f.length;)f[e]=arguments[e+0],++e;e=new Ad(f,0,null)}return c.call(this,e)}function c(d){d=ng(d);if(Dd.g(Q(d),1))return d=N(d),a.a?a.a(d):a.call(null,d);d=Wg(d);return a.a?a.a(d):a.call(null,d)}b.O=0;b.R=function(d){d=M(d);return c(d)};b.A=c;return b}()}
function vo(a,b){var c=new vb;for(b=M(b);;)if(null!=b)c.append(I.a(N(b))),b=O(b),null!=b&&c.append(a);else return c.toString()};var wo=function wo(a,b,c){if(null!=a&&null!=a.Vd)return a.Vd(a,b,c);var e=wo[la(null==a?null:a)];if(null!=e)return e.h?e.h(a,b,c):e.call(null,a,b,c);e=wo._;if(null!=e)return e.h?e.h(a,b,c):e.call(null,a,b,c);throw Sb("AjaxImpl.-js-ajax-request",a);},xo=function xo(a){if(null!=a&&null!=a.Zd)return a.Zd(a);var c=xo[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=xo._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("AjaxResponse.-status",a);},yo=function yo(a){if(null!=a&&null!=
a.$d)return a.$d(a);var c=yo[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=yo._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("AjaxResponse.-status-text",a);},zo=function zo(a){if(null!=a&&null!=a.Xd)return a.Xd(a);var c=zo[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=zo._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("AjaxResponse.-get-all-headers",a);},Ao=function Ao(a){if(null!=a&&null!=a.Wd)return a.Wd(a);var c=Ao[la(null==a?null:a)];if(null!=
c)return c.a?c.a(a):c.call(null,a);c=Ao._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("AjaxResponse.-body",a);},Bo=function Bo(a,b){if(null!=a&&null!=a.Yd)return a.Yd(a,b);var d=Bo[la(null==a?null:a)];if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);d=Bo._;if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);throw Sb("AjaxResponse.-get-response-header",a);},Co=function Co(a){if(null!=a&&null!=a.ae)return a.ae(a);var c=Co[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=Co._;if(null!=
c)return c.a?c.a(a):c.call(null,a);throw Sb("AjaxResponse.-was-aborted",a);},Do=function Do(a,b){if(null!=a&&null!=a.Sc)return a.Sc(a,b);var d=Do[la(null==a?null:a)];if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);d=Do._;if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);throw Sb("Interceptor.-process-request",a);},Eo=function Eo(a,b){if(null!=a&&null!=a.Tc)return a.Tc(a,b);var d=Eo[la(null==a?null:a)];if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);d=Eo._;if(null!=d)return d.g?d.g(a,b):d.call(null,
a,b);throw Sb("Interceptor.-process-response",a);};function Fo(a){throw Error(I.a(a));}var Go=new hi(null,new Fb(null,7,[206,null,204,null,304,null,1223,null,201,null,202,null,200,null],null),null);function Ho(a){return a instanceof K?df(a):a}var Io=encodeURIComponent;function Jo(a){var b=S(a,0,null);a=S(a,1,null);return[I.a(Ho(b)),"\x3d",I.a(Io.a?Io.a(a):Io.call(null,a))].join("")}function Ko(a){return function(b,c){return new V(null,2,5,X,[a.a?a.a(b):a.call(null,b),c],null)}}
function Lo(a){var b=function(){var c=B(a)?a:fm,d=c instanceof K?c.cb:null;switch(d){case "java":return function(){return function(){return null}}(c,d);case "rails":return function(){return function(){return""}}(c,d);case "indexed":return Qe;default:throw Error(["No matching clause: ",I.a(d)].join(""));}}();return Ko(b)}
function Mo(a,b){var c=S(b,0,null);b=S(b,1,null);var d=Ho(c);c=B(null)?B(c)?[I.a(null),"[",I.a(d),"]"].join(""):null:d;d=No(a,c);return"string"===typeof b?new V(null,1,5,X,[new V(null,2,5,X,[c,b],null)],null):b instanceof K?new V(null,1,5,X,[new V(null,2,5,X,[c,df(b)],null)],null):ze(b)?qg(d,R([M(b)])):ye(b)?qg(d,R([dg(a,M(b))])):new V(null,1,5,X,[new V(null,2,5,X,[c,b],null)],null)}
function No(a,b){return function(c){var d=S(c,0,null);c=S(c,1,null);var e=Ho(d);d=B(b)?B(d)?[I.a(b),"[",I.a(e),"]"].join(""):b:e;e=No(a,d);return"string"===typeof c?new V(null,1,5,X,[new V(null,2,5,X,[d,c],null)],null):c instanceof K?new V(null,1,5,X,[new V(null,2,5,X,[d,df(c)],null)],null):ze(c)?qg(e,R([M(c)])):ye(c)?qg(e,R([dg(a,M(c))])):new V(null,1,5,X,[new V(null,2,5,X,[d,c],null)],null)}}function Oo(a,b){return vo("\x26",kg.g(Jo,Mo(Lo(a),new V(null,2,5,X,[null,b],null))))}
function Po(a){return function(b){return vo("\x26",kg.g(Jo,Mo(Lo(a),new V(null,2,5,X,[null,b],null))))}}function Qo(a){a=null!=a&&(a.l&64||w===a.T)?zf(Di,a):a;a=J.g(a,Fl);return new Fb(null,2,[nk,Po(a),fk,"application/x-www-form-urlencoded; charset\x3dutf-8"],null)};var Ro="undefined"!=typeof Object.keys?function(a){return Object.keys(a)}:function(a){return gb(a)},So="undefined"!=typeof Array.isArray?function(a){return Array.isArray(a)}:function(a){return"array"===la(a)};function To(){return Math.round(15*Math.random()).toString(16)};function Uo(a,b){if(3<a.length){if(b)return!0;b=a.charAt(1);return"~"===a.charAt(0)?":"===b||"$"===b||"#"===b:!1}return!1}function Vo(a){var b=Math.floor(a/44);a=String.fromCharCode(a%44+48);return 0===b?"^"+a:"^"+String.fromCharCode(b+48)+a}function Wo(){this.nf=this.jd=this.va=0;this.cache={}}
Wo.prototype.write=function(a,b){return Uo(a,b)?(4096===this.nf?(this.clear(),this.jd=0,this.cache={}):1936===this.va&&this.clear(),b=this.cache[a],null==b?(this.cache[a]=[Vo(this.va),this.jd],this.va++,a):b[1]!=this.jd?(b[1]=this.jd,b[0]=Vo(this.va),this.va++,a):b[0]):a};Wo.prototype.clear=function(){this.va=0;this.jd++};function Xo(){this.va=0;this.cache=[]}Xo.prototype.write=function(a){1936==this.va&&(this.va=0);this.cache[this.va]=a;this.va++;return a};
Xo.prototype.read=function(a){return this.cache[2===a.length?a.charCodeAt(1)-48:44*(a.charCodeAt(1)-48)+(a.charCodeAt(2)-48)]};Xo.prototype.clear=function(){this.va=0};var Yo=1;function Zo(a,b){if(null==a)return null==b;if(a===b)return!0;if("object"===typeof a){if(So(a)){if(So(b)&&a.length===b.length){for(var c=0;c<a.length;c++)if(!Zo(a[c],b[c]))return!1;return!0}return!1}if(a.zb)return a.zb(b);if(null!=b&&"object"===typeof b){if(b.zb)return b.zb(a);c=0;var d=Ro(b).length,e;for(e in a)if(a.hasOwnProperty(e)&&(c++,!b.hasOwnProperty(e)||!Zo(a[e],b[e])))return!1;return c===d}}return!1}function $o(a,b){return a^b+2654435769+(a<<6)+(a>>2)}var ap={},bp=0;
function cp(a){var b=0;if(null!=a.forEach)a.forEach(function(h,k){b=(b+(dp(k)^dp(h)))%4503599627370496});else for(var c=Ro(a),d=0;d<c.length;d++){var e=c[d],f=a[e];b=(b+(dp(e)^dp(f)))%4503599627370496}return b}function ep(a){var b=0;if(So(a))for(var c=0;c<a.length;c++)b=$o(b,dp(a[c]));else a.forEach&&a.forEach(function(d){b=$o(b,dp(d))});return b}
function dp(a){if(null==a)return 0;switch(typeof a){case "number":return a;case "boolean":return!0===a?1:0;case "string":var b=ap[a];if(null!=b)a=b;else{for(var c=b=0;c<a.length;++c)b=31*b+a.charCodeAt(c),b%=4294967296;bp++;256<=bp&&(ap={},bp=1);a=ap[a]=b}return a;case "function":return b=a.transit$hashCode$,b||(b=Yo,"undefined"!=typeof Object.defineProperty?Object.defineProperty(a,"transit$hashCode$",{value:b,enumerable:!1}):a.transit$hashCode$=b,Yo++),b;default:return a instanceof Date?a.valueOf():
So(a)?ep(a):a.Hb?a.Hb():cp(a)}};var fp="undefined"!=typeof Symbol?Symbol.iterator:"@@iterator";function gp(a,b){this.tag=a;this.rep=b;this.ra=-1}gp.prototype.toString=function(){return"[TaggedValue: "+this.tag+", "+this.rep+"]"};gp.prototype.equiv=function(a){return Zo(this,a)};gp.prototype.equiv=gp.prototype.equiv;gp.prototype.zb=function(a){return a instanceof gp?this.tag===a.tag&&Zo(this.rep,a.rep):!1};gp.prototype.Hb=function(){-1===this.ra&&(this.ra=$o(dp(this.tag),dp(this.rep)));return this.ra};
function hp(a,b){return new gp(a,b)}var ip=Ja("9007199254740991"),jp=Ja("-9007199254740991");Ba.prototype.equiv=function(a){return Zo(this,a)};Ba.prototype.equiv=Ba.prototype.equiv;Ba.prototype.zb=function(a){return a instanceof Ba&&this.Kb(a)};Ba.prototype.Hb=function(){return this.Ce()};function kp(a){this.Ea=a;this.ra=-1}kp.prototype.toString=function(){return":"+this.Ea};kp.prototype.namespace=function(){var a=this.Ea.indexOf("/");return-1!=a?this.Ea.substring(0,a):null};
kp.prototype.name=function(){var a=this.Ea.indexOf("/");return-1!=a?this.Ea.substring(a+1,this.Ea.length):this.Ea};kp.prototype.equiv=function(a){return Zo(this,a)};kp.prototype.equiv=kp.prototype.equiv;kp.prototype.zb=function(a){return a instanceof kp&&this.Ea==a.Ea};kp.prototype.Hb=function(){-1===this.ra&&(this.ra=dp(this.Ea));return this.ra};function lp(a){this.Ea=a;this.ra=-1}lp.prototype.namespace=function(){var a=this.Ea.indexOf("/");return-1!=a?this.Ea.substring(0,a):null};
lp.prototype.name=function(){var a=this.Ea.indexOf("/");return-1!=a?this.Ea.substring(a+1,this.Ea.length):this.Ea};lp.prototype.toString=function(){return this.Ea};lp.prototype.equiv=function(a){return Zo(this,a)};lp.prototype.equiv=lp.prototype.equiv;lp.prototype.zb=function(a){return a instanceof lp&&this.Ea==a.Ea};lp.prototype.Hb=function(){-1===this.ra&&(this.ra=dp(this.Ea));return this.ra};
function mp(a,b,c){var d="";c=c||b+1;for(var e=8*(7-b),f=(new Ba(255,0)).shiftLeft(e);b<c;b++,e-=8,f=Na(f,8)){var h=Na(a.and(f),e).toString(16);1==h.length&&(h="0"+h);d+=h}return d}function np(a,b){this.high=a;this.low=b;this.ra=-1}np.prototype.toString=function(){var a=this.high,b=this.low;var c=mp(a,0,4)+"-";c+=mp(a,4,6)+"-";c+=mp(a,6,8)+"-";c+=mp(b,0,2)+"-";return c+=mp(b,2,8)};np.prototype.equiv=function(a){return Zo(this,a)};np.prototype.equiv=np.prototype.equiv;
np.prototype.zb=function(a){return a instanceof np&&this.high.Kb(a.high)&&this.low.Kb(a.low)};np.prototype.Hb=function(){-1===this.ra&&(this.ra=dp(this.toString()));return this.ra};Date.prototype.zb=function(a){return a instanceof Date?this.valueOf()===a.valueOf():!1};Date.prototype.Hb=function(){return this.valueOf()};function op(a,b){this.entries=a;this.type=b||0;this.va=0}
op.prototype.next=function(){if(this.va<this.entries.length){var a={value:0===this.type?this.entries[this.va]:1===this.type?this.entries[this.va+1]:[this.entries[this.va],this.entries[this.va+1]],done:!1};this.va+=2;return a}return{value:null,done:!0}};op.prototype.next=op.prototype.next;op.prototype[fp]=function(){return this};function pp(a,b){this.map=a;this.type=b||0;this.keys=this.map.Ub();this.va=0;this.rc=null;this.ic=0}
pp.prototype.next=function(){if(this.va<this.map.size){null!=this.rc&&this.ic<this.rc.length||(this.rc=this.map.map[this.keys[this.va]],this.ic=0);var a={value:0===this.type?this.rc[this.ic]:1===this.type?this.rc[this.ic+1]:[this.rc[this.ic],this.rc[this.ic+1]],done:!1};this.va++;this.ic+=2;return a}return{value:null,done:!0}};pp.prototype.next=pp.prototype.next;pp.prototype[fp]=function(){return this};
function qp(a,b){if(a instanceof rp&&(b instanceof sp||b instanceof rp)){if(a.size!==b.size)return!1;for(var c in a.map)for(var d=a.map[c],e=0;e<d.length;e+=2)if(!Zo(d[e+1],b.get(d[e])))return!1;return!0}if(a instanceof sp&&(b instanceof sp||b instanceof rp)){if(a.size!==b.size)return!1;a=a.qa;for(e=0;e<a.length;e+=2)if(!Zo(a[e+1],b.get(a[e])))return!1;return!0}if(null!=b&&"object"===typeof b&&(e=Ro(b),c=e.length,a.size===c)){for(d=0;d<c;d++){var f=e[d];if(!a.has(f)||!Zo(b[f],a.get(f)))return!1}return!0}return!1}
function tp(a){return null==a?"null":"array"==la(a)?"["+a.toString()+"]":ia(a)?'"'+a+'"':a.toString()}function up(a){var b=0,c="TransitMap {";a.forEach(function(d,e){c+=tp(e)+" \x3d\x3e "+tp(d);b<a.size-1&&(c+=", ");b++});return c+"}"}function vp(a){var b=0,c="TransitSet {";a.forEach(function(d){c+=tp(d);b<a.size-1&&(c+=", ");b++});return c+"}"}function sp(a){this.qa=a;this.na=null;this.ra=-1;this.size=a.length/2;this.Fe=0}sp.prototype.toString=function(){return up(this)};sp.prototype.inspect=function(){return this.toString()};
function wp(a){if(a.na)throw Error("Invalid operation, already converted");if(8>a.size)return!1;a.Fe++;return 32<a.Fe?(a.na=xp(a.qa,!1,!0),a.qa=[],!0):!1}sp.prototype.clear=function(){this.ra=-1;this.na?this.na.clear():this.qa=[];this.size=0};sp.prototype.clear=sp.prototype.clear;sp.prototype.keys=function(){return this.na?this.na.keys():new op(this.qa,0)};sp.prototype.keys=sp.prototype.keys;
sp.prototype.wc=function(){if(this.na)return this.na.wc();for(var a=[],b=0,c=0;c<this.qa.length;b++,c+=2)a[b]=this.qa[c];return a};sp.prototype.keySet=sp.prototype.wc;sp.prototype.entries=function(){return this.na?this.na.entries():new op(this.qa,2)};sp.prototype.entries=sp.prototype.entries;sp.prototype.values=function(){return this.na?this.na.values():new op(this.qa,1)};sp.prototype.values=sp.prototype.values;
sp.prototype.forEach=function(a){if(this.na)this.na.forEach(a);else for(var b=0;b<this.qa.length;b+=2)a(this.qa[b+1],this.qa[b])};sp.prototype.forEach=sp.prototype.forEach;sp.prototype.get=function(a,b){if(this.na)return this.na.get(a);if(wp(this))return this.get(a);for(var c=0;c<this.qa.length;c+=2)if(Zo(this.qa[c],a))return this.qa[c+1];return b};sp.prototype.get=sp.prototype.get;
sp.prototype.has=function(a){if(this.na)return this.na.has(a);if(wp(this))return this.has(a);for(var b=0;b<this.qa.length;b+=2)if(Zo(this.qa[b],a))return!0;return!1};sp.prototype.has=sp.prototype.has;sp.prototype.set=function(a,b){this.ra=-1;if(this.na)this.na.set(a,b),this.size=this.na.size;else{for(var c=0;c<this.qa.length;c+=2)if(Zo(this.qa[c],a)){this.qa[c+1]=b;return}this.qa.push(a);this.qa.push(b);this.size++;32<this.size&&(this.na=xp(this.qa,!1,!0),this.qa=null)}};sp.prototype.set=sp.prototype.set;
sp.prototype["delete"]=function(a){this.ra=-1;if(this.na)return a=this.na["delete"](a),this.size=this.na.size,a;for(var b=0;b<this.qa.length;b+=2)if(Zo(this.qa[b],a))return a=this.qa[b+1],this.qa.splice(b,2),this.size--,a};sp.prototype.clone=function(){var a=xp();this.forEach(function(b,c){a.set(c,b)});return a};sp.prototype.clone=sp.prototype.clone;sp.prototype[fp]=function(){return this.entries()};sp.prototype.Hb=function(){if(this.na)return this.na.Hb();-1===this.ra&&(this.ra=cp(this));return this.ra};
sp.prototype.zb=function(a){return this.na?qp(this.na,a):qp(this,a)};function rp(a,b,c){this.map=b||{};this.Cc=a||[];this.size=c||0;this.ra=-1}rp.prototype.toString=function(){return up(this)};rp.prototype.inspect=function(){return this.toString()};rp.prototype.clear=function(){this.ra=-1;this.map={};this.Cc=[];this.size=0};rp.prototype.clear=rp.prototype.clear;rp.prototype.Ub=function(){return null!=this.Cc?this.Cc:Ro(this.map)};
rp.prototype["delete"]=function(a){this.ra=-1;this.Cc=null;for(var b=dp(a),c=this.map[b],d=0;d<c.length;d+=2)if(Zo(a,c[d]))return a=c[d+1],c.splice(d,2),0===c.length&&delete this.map[b],this.size--,a};rp.prototype.entries=function(){return new pp(this,2)};rp.prototype.entries=rp.prototype.entries;rp.prototype.forEach=function(a){for(var b=this.Ub(),c=0;c<b.length;c++)for(var d=this.map[b[c]],e=0;e<d.length;e+=2)a(d[e+1],d[e],this)};rp.prototype.forEach=rp.prototype.forEach;
rp.prototype.get=function(a,b){var c=dp(a);c=this.map[c];if(null!=c)for(b=0;b<c.length;b+=2){if(Zo(a,c[b]))return c[b+1]}else return b};rp.prototype.get=rp.prototype.get;rp.prototype.has=function(a){var b=dp(a);b=this.map[b];if(null!=b)for(var c=0;c<b.length;c+=2)if(Zo(a,b[c]))return!0;return!1};rp.prototype.has=rp.prototype.has;rp.prototype.keys=function(){return new pp(this,0)};rp.prototype.keys=rp.prototype.keys;
rp.prototype.wc=function(){for(var a=this.Ub(),b=[],c=0;c<a.length;c++)for(var d=this.map[a[c]],e=0;e<d.length;e+=2)b.push(d[e]);return b};rp.prototype.keySet=rp.prototype.wc;rp.prototype.set=function(a,b){this.ra=-1;var c=dp(a),d=this.map[c];if(null==d)this.Cc&&this.Cc.push(c),this.map[c]=[a,b],this.size++;else{c=!0;for(var e=0;e<d.length;e+=2)if(Zo(b,d[e])){c=!1;d[e]=b;break}c&&(d.push(a),d.push(b),this.size++)}};rp.prototype.set=rp.prototype.set;
rp.prototype.values=function(){return new pp(this,1)};rp.prototype.values=rp.prototype.values;rp.prototype.clone=function(){var a=xp();this.forEach(function(b,c){a.set(c,b)});return a};rp.prototype.clone=rp.prototype.clone;rp.prototype[fp]=function(){return this.entries()};rp.prototype.Hb=function(){-1===this.ra&&(this.ra=cp(this));return this.ra};rp.prototype.zb=function(a){return qp(this,a)};
function xp(a,b,c){a=a||[];b=!1===b?b:!0;if((!0!==c||!c)&&64>=a.length){if(b){var d=a;a=[];for(b=0;b<d.length;b+=2){var e=!1;for(c=0;c<a.length;c+=2)if(Zo(a[c],d[b])){a[c+1]=d[b+1];e=!0;break}e||(a.push(d[b]),a.push(d[b+1]))}}return new sp(a)}d={};e=[];var f=0;for(b=0;b<a.length;b+=2){c=dp(a[b]);var h=d[c];if(null==h)e.push(c),d[c]=[a[b],a[b+1]],f++;else{var k=!0;for(c=0;c<h.length;c+=2)if(Zo(h[c],a[b])){h[c+1]=a[b+1];k=!1;break}k&&(h.push(a[b]),h.push(a[b+1]),f++)}}return new rp(e,d,f)}
function yp(a){this.map=a;this.size=a.size}yp.prototype.toString=function(){return vp(this)};yp.prototype.inspect=function(){return this.toString()};yp.prototype.add=function(a){this.map.set(a,a);this.size=this.map.size};yp.prototype.add=yp.prototype.add;yp.prototype.clear=function(){this.map=new rp;this.size=0};yp.prototype.clear=yp.prototype.clear;yp.prototype["delete"]=function(a){a=this.map["delete"](a);this.size=this.map.size;return a};yp.prototype.entries=function(){return this.map.entries()};
yp.prototype.entries=yp.prototype.entries;yp.prototype.forEach=function(a){var b=this;this.map.forEach(function(c,d){a(d,b)})};yp.prototype.forEach=yp.prototype.forEach;yp.prototype.has=function(a){return this.map.has(a)};yp.prototype.has=yp.prototype.has;yp.prototype.keys=function(){return this.map.keys()};yp.prototype.keys=yp.prototype.keys;yp.prototype.wc=function(){return this.map.wc()};yp.prototype.keySet=yp.prototype.wc;yp.prototype.values=function(){return this.map.values()};
yp.prototype.values=yp.prototype.values;yp.prototype.clone=function(){var a=zp();this.forEach(function(b){a.add(b)});return a};yp.prototype.clone=yp.prototype.clone;yp.prototype[fp]=function(){return this.values()};yp.prototype.zb=function(a){if(a instanceof yp){if(this.size===a.size)return Zo(this.map,a.map)}else return!1};yp.prototype.Hb=function(){return dp(this.map)};
function zp(a){a=a||[];for(var b={},c=[],d=0,e=0;e<a.length;e++){var f=dp(a[e]),h=b[f];if(null==h)c.push(f),b[f]=[a[e],a[e]],d++;else{f=!0;for(var k=0;k<h.length;k+=2)if(Zo(h[k],a[e])){f=!1;break}f&&(h.push(a[e]),h.push(a[e]),d++)}}return new yp(new rp(c,b,d))};function Ap(a){this.nb=a}
function Bp(a){this.options=a||{};this.Ja={};for(var b in this.fd.Ja)this.Ja[b]=this.fd.Ja[b];for(b in this.options.handlers){a:{switch(b){case "_":case "s":case "?":case "i":case "d":case "b":case "'":case "array":case "map":a=!0;break a}a=!1}if(a)throw Error('Cannot override handler for ground type "'+b+'"');this.Ja[b]=this.options.handlers[b]}this.Nd=null!=this.options.preferStrings?this.options.preferStrings:this.fd.Nd;this.ze=null!=this.options.preferBuffers?this.options.preferBuffers:this.fd.ze;
this.ne=this.options.defaultHandler||this.fd.ne;this.Cb=this.options.mapBuilder;this.Ec=this.options.arrayBuilder}
Bp.prototype.fd={Ja:{_:function(){return null},"?":function(a){return"t"===a},b:function(a,b){if(b&&!1===b.ze||"undefined"==typeof Buffer)if("undefined"!=typeof Uint8Array){if("undefined"!=typeof atob)var c=atob(a);else{a=String(a).replace(/=+$/,"");if(1==a.length%4)throw Error("'atob' failed: The string to be decoded is not correctly encoded.");b=0;for(var d,e=0,f="";d=a.charAt(e++);~d&&(c=b%4?64*c+d:d,b++%4)?f+=String.fromCharCode(255&c>>(-2*b&6)):0)d="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/\x3d".indexOf(d);
c=f}a=c.length;b=new Uint8Array(a);for(d=0;d<a;d++)b[d]=c.charCodeAt(d);c=b}else c=hp("b",a);else c=new Buffer(a,"base64");return c},i:function(a){"number"===typeof a||a instanceof Ba||(a=Ja(a,10),a=a.Fd(ip)||a.Kd(jp)?a:a.Db());return a},n:function(a){return hp("n",a)},d:function(a){return parseFloat(a)},f:function(a){return hp("f",a)},c:function(a){return a},":":function(a){return new kp(a)},$:function(a){return new lp(a)},r:function(a){return hp("r",a)},z:function(a){a:switch(a){case "-INF":a=-Infinity;
break a;case "INF":a=Infinity;break a;case "NaN":a=NaN;break a;default:throw Error("Invalid special double value "+a);}return a},"'":function(a){return a},m:function(a){a="number"===typeof a?a:parseInt(a,10);return new Date(a)},t:function(a){return new Date(a)},u:function(a){a=a.replace(/-/g,"");var b,c;var d=b=0;for(c=24;8>d;d+=2,c-=8)b|=parseInt(a.substring(d,d+2),16)<<c;var e=0;d=8;for(c=24;16>d;d+=2,c-=8)e|=parseInt(a.substring(d,d+2),16)<<c;var f=Ia(e,b);b=0;d=16;for(c=24;24>d;d+=2,c-=8)b|=parseInt(a.substring(d,
d+2),16)<<c;e=0;for(c=d=24;32>d;d+=2,c-=8)e|=parseInt(a.substring(d,d+2),16)<<c;return new np(f,Ia(e,b))},set:function(a){return zp(a)},list:function(a){return hp("list",a)},link:function(a){return hp("link",a)},cmap:function(a){return xp(a,!1)}},ne:function(a,b){return hp(a,b)},Nd:!0,ze:!0};
Bp.prototype.decode=function(a,b,c,d){if(null==a)return null;switch(typeof a){case "string":return Uo(a,c)?(a=Cp(this,a),b&&b.write(a,c),b=a):b="^"===a.charAt(0)&&" "!==a.charAt(1)?b.read(a,c):Cp(this,a),b;case "object":if(So(a))if("^ "===a[0])if(this.Cb)if(17>a.length&&this.Cb.fromArray){d=[];for(c=1;c<a.length;c+=2)d.push(this.decode(a[c],b,!0,!1)),d.push(this.decode(a[c+1],b,!1,!1));b=this.Cb.fromArray(d,a)}else{d=this.Cb.init(a);for(c=1;c<a.length;c+=2)d=this.Cb.add(d,this.decode(a[c],b,!0,!1),
this.decode(a[c+1],b,!1,!1),a);b=this.Cb.finalize(d,a)}else{d=[];for(c=1;c<a.length;c+=2)d.push(this.decode(a[c],b,!0,!1)),d.push(this.decode(a[c+1],b,!1,!1));b=xp(d,!1)}else b=Dp(this,a,b,c,d);else{c=Ro(a);var e=c[0];if((d=1==c.length?this.decode(e,b,!1,!1):null)&&d instanceof Ap)a=a[e],c=this.Ja[d.nb],b=null!=c?c(this.decode(a,b,!1,!0),this):hp(d.nb,this.decode(a,b,!1,!1));else if(this.Cb)if(16>c.length&&this.Cb.fromArray){var f=[];for(d=0;d<c.length;d++)e=c[d],f.push(this.decode(e,b,!0,!1)),f.push(this.decode(a[e],
b,!1,!1));b=this.Cb.fromArray(f,a)}else{f=this.Cb.init(a);for(d=0;d<c.length;d++)e=c[d],f=this.Cb.add(f,this.decode(e,b,!0,!1),this.decode(a[e],b,!1,!1),a);b=this.Cb.finalize(f,a)}else{f=[];for(d=0;d<c.length;d++)e=c[d],f.push(this.decode(e,b,!0,!1)),f.push(this.decode(a[e],b,!1,!1));b=xp(f,!1)}}return b}return a};Bp.prototype.decode=Bp.prototype.decode;
function Dp(a,b,c,d,e){if(e){var f=[];for(e=0;e<b.length;e++)f.push(a.decode(b[e],c,d,!1));return f}f=c&&c.va;if(2===b.length&&"string"===typeof b[0]&&(e=a.decode(b[0],c,!1,!1))&&e instanceof Ap)return b=b[1],f=a.Ja[e.nb],null!=f?f=f(a.decode(b,c,d,!0),a):hp(e.nb,a.decode(b,c,d,!1));c&&f!=c.va&&(c.va=f);if(a.Ec){if(32>=b.length&&a.Ec.fromArray){f=[];for(e=0;e<b.length;e++)f.push(a.decode(b[e],c,d,!1));return a.Ec.fromArray(f,b)}f=a.Ec.init(b);for(e=0;e<b.length;e++)f=a.Ec.add(f,a.decode(b[e],c,d,
!1),b);return a.Ec.finalize(f,b)}f=[];for(e=0;e<b.length;e++)f.push(a.decode(b[e],c,d,!1));return f}function Cp(a,b){if("~"===b.charAt(0)){var c=b.charAt(1);if("~"===c||"^"===c||"`"===c)return b.substring(1);if("#"===c)return new Ap(b.substring(2));var d=a.Ja[c];return null==d?a.ne(c,b.substring(2)):d(b.substring(2),a)}return b};function Ep(a){this.Gf=new Bp(a)}function Fp(a,b){this.cg=a;this.options=b||{};this.cache=this.options.cache?this.options.cache:new Xo}Fp.prototype.read=function(a){var b=this.cache;a=this.cg.Gf.decode(JSON.parse(a),b);this.cache.clear();return a};Fp.prototype.read=Fp.prototype.read;var Gp=0,Hp=(8|3&Math.round(14*Math.random())).toString(16),Ip="transit$guid$"+(To()+To()+To()+To()+To()+To()+To()+To()+"-"+To()+To()+To()+To()+"-4"+To()+To()+To()+"-"+Hp+To()+To()+To()+"-"+To()+To()+To()+To()+To()+To()+To()+To()+To()+To()+To()+To());
function Jp(a){if(null==a)return"null";if(a===String)return"string";if(a===Boolean)return"boolean";if(a===Number)return"number";if(a===Array)return"array";if(a===Object)return"map";var b=a[Ip];null==b&&("undefined"!=typeof Object.defineProperty?(b=++Gp,Object.defineProperty(a,Ip,{value:b,enumerable:!1})):a[Ip]=b=++Gp);return b}function Kp(a,b){a=a.toString();for(var c=a.length;c<b;c++)a="0"+a;return a}function Lp(){}Lp.prototype.tag=function(){return"_"};Lp.prototype.rep=function(){return null};
Lp.prototype.stringRep=function(){return"null"};function Mp(){}Mp.prototype.tag=function(){return"s"};Mp.prototype.rep=function(a){return a};Mp.prototype.stringRep=function(a){return a};function Np(){}Np.prototype.tag=function(){return"i"};Np.prototype.rep=function(a){return a};Np.prototype.stringRep=function(a){return a.toString()};function Op(){}Op.prototype.tag=function(){return"i"};Op.prototype.rep=function(a){return a.toString()};Op.prototype.stringRep=function(a){return a.toString()};
function Pp(){}Pp.prototype.tag=function(){return"?"};Pp.prototype.rep=function(a){return a};Pp.prototype.stringRep=function(a){return a.toString()};function Qp(){}Qp.prototype.tag=function(){return"array"};Qp.prototype.rep=function(a){return a};Qp.prototype.stringRep=function(){return null};function Rp(){}Rp.prototype.tag=function(){return"map"};Rp.prototype.rep=function(a){return a};Rp.prototype.stringRep=function(){return null};function Sp(){}Sp.prototype.tag=function(){return"t"};
Sp.prototype.rep=function(a){return a.getUTCFullYear()+"-"+Kp(a.getUTCMonth()+1,2)+"-"+Kp(a.getUTCDate(),2)+"T"+Kp(a.getUTCHours(),2)+":"+Kp(a.getUTCMinutes(),2)+":"+Kp(a.getUTCSeconds(),2)+"."+Kp(a.getUTCMilliseconds(),3)+"Z"};Sp.prototype.stringRep=function(a,b){return b.rep(a)};function Tp(){}Tp.prototype.tag=function(){return"m"};Tp.prototype.rep=function(a){return a.valueOf()};Tp.prototype.stringRep=function(a){return a.valueOf().toString()};Tp.prototype.getVerboseHandler=function(){return new Sp};
function Up(){}Up.prototype.tag=function(){return"u"};Up.prototype.rep=function(a){return a.toString()};Up.prototype.stringRep=function(a){return a.toString()};function Vp(){}Vp.prototype.tag=function(){return":"};Vp.prototype.rep=function(a){return a.Ea};Vp.prototype.stringRep=function(a,b){return b.rep(a)};function Wp(){}Wp.prototype.tag=function(){return"$"};Wp.prototype.rep=function(a){return a.Ea};Wp.prototype.stringRep=function(a,b){return b.rep(a)};function Xp(){}Xp.prototype.tag=function(a){return a.tag};
Xp.prototype.rep=function(a){return a.rep};Xp.prototype.stringRep=function(){return null};function Yp(){}Yp.prototype.tag=function(){return"set"};Yp.prototype.rep=function(a){var b=[];a.forEach(function(c){b.push(c)});return hp("array",b)};Yp.prototype.stringRep=function(){return null};function Zp(){}Zp.prototype.tag=function(){return"map"};Zp.prototype.rep=function(a){return a};Zp.prototype.stringRep=function(){return null};function $p(){}$p.prototype.tag=function(){return"map"};
$p.prototype.rep=function(a){return a};$p.prototype.stringRep=function(){return null};function aq(){}aq.prototype.tag=function(){return"b"};aq.prototype.rep=function(a){return a.toString("base64")};aq.prototype.stringRep=function(){return null};function bq(){}bq.prototype.tag=function(){return"b"};
bq.prototype.rep=function(a){for(var b,c=0,d=a.length,e="",f;c<d;)f=a.subarray(c,Math.min(c+32768,d)),e+=String.fromCharCode.apply(null,f),c+=32768;if("undefined"!=typeof btoa)b=btoa(e);else{a=String(e);d=0;e="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/\x3d";for(f="";a.charAt(d|0)||(e="\x3d",d%1);f+=e.charAt(63&b>>8-d%1*8)){c=a.charCodeAt(d+=.75);if(255<c)throw Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");b=b<<8|c}b=f}return b};
bq.prototype.stringRep=function(){return null};
function cq(){this.Ja={};this.set(null,new Lp);this.set(String,new Mp);this.set(Number,new Np);this.set(Ba,new Op);this.set(Boolean,new Pp);this.set(Array,new Qp);this.set(Object,new Rp);this.set(Date,new Tp);this.set(np,new Up);this.set(kp,new Vp);this.set(lp,new Wp);this.set(gp,new Xp);this.set(yp,new Yp);this.set(sp,new Zp);this.set(rp,new $p);"undefined"!=typeof Buffer&&this.set(Buffer,new aq);"undefined"!=typeof Uint8Array&&this.set(Uint8Array,new bq)}
cq.prototype.get=function(a){a="string"===typeof a?this.Ja[a]:this.Ja[Jp(a)];return null!=a?a:this.Ja["default"]};cq.prototype.get=cq.prototype.get;cq.prototype.set=function(a,b){var c;if(c="string"===typeof a)a:{switch(a){case "null":case "string":case "boolean":case "number":case "array":case "map":c=!1;break a}c=!0}c?this.Ja[a]=b:this.Ja[Jp(a)]=b};function dq(a){this.oc=a||{};this.Nd=null!=this.oc.preferStrings?this.oc.preferStrings:!0;this.$e=this.oc.objectBuilder||null;this.Ja=new cq;if(a=this.oc.handlers){if(So(a)||!a.forEach)throw Error('transit writer "handlers" option must be a map');var b=this;a.forEach(function(c,d){if(void 0!==d)b.Ja.set(d,c);else throw Error("Cannot create handler for JavaScript undefined");})}this.kd=this.oc.handlerForForeign;this.Rd=this.oc.unpack||function(c){return c instanceof sp&&null===c.na?c.qa:!1};this.td=
this.oc&&this.oc.verbose||!1}dq.prototype.rb=function(a){var b=this.Ja.get(null==a?null:a.constructor);return null!=b?b:(a=a&&a.transitTag)?this.Ja.get(a):null};function eq(a,b,c,d,e){a=a+b+c;return e?e.write(a,d):a}function fq(a,b,c){var d=[];if(So(b))for(var e=0;e<b.length;e++)d.push(gq(a,b[e],!1,c));else b.forEach(function(f){d.push(gq(a,f,!1,c))});return d}function hq(a,b){return"string"!==typeof b?(a=a.rb(b))&&1===a.tag(b).length:!0}
function iq(a,b){var c=a.Rd(b),d=!0;if(c){for(b=0;b<c.length&&(d=hq(a,c[b]),d);b+=2);return d}if(b.keys){c=b.keys();var e=null;if(c.next){for(e=c.next();!e.done;){d=hq(a,e.value);if(!d)break;e=c.next()}return d}}if(b.forEach)return b.forEach(function(f,h){d=d&&hq(a,h)}),d;throw Error("Cannot walk keys of object type "+(null==b?null:b.constructor).name);}
function jq(a){if(a.constructor.transit$isObject)return!0;var b=a.constructor.toString();b=b.substr(9);b=b.substr(0,b.indexOf("("));isObject="Object"==b;"undefined"!=typeof Object.defineProperty?Object.defineProperty(a.constructor,"transit$isObject",{value:isObject,enumerable:!1}):a.constructor.transit$isObject=isObject;return isObject}
function kq(a,b,c){var d=null,e=null,f=null;d=null;var h=0;if(b.constructor===Object||null!=b.forEach||a.kd&&jq(b)){if(a.td){if(null!=b.forEach)if(iq(a,b)){var k={};b.forEach(function(l,m){k[gq(a,m,!0,!1)]=gq(a,l,!1,c)})}else{d=a.Rd(b);e=[];f=eq("~#","cmap","",!0,c);if(d)for(;h<d.length;h+=2)e.push(gq(a,d[h],!1,!1)),e.push(gq(a,d[h+1],!1,c));else b.forEach(function(l,m){e.push(gq(a,m,!1,!1));e.push(gq(a,l,!1,c))});k={};k[f]=e}else for(d=Ro(b),k={};h<d.length;h++)k[gq(a,d[h],!0,!1)]=gq(a,b[d[h]],!1,
c);return k}if(null!=b.forEach){if(iq(a,b)){d=a.Rd(b);k=["^ "];if(d)for(;h<d.length;h+=2)k.push(gq(a,d[h],!0,c)),k.push(gq(a,d[h+1],!1,c));else b.forEach(function(l,m){k.push(gq(a,m,!0,c));k.push(gq(a,l,!1,c))});return k}d=a.Rd(b);e=[];f=eq("~#","cmap","",!0,c);if(d)for(;h<d.length;h+=2)e.push(gq(a,d[h],!1,c)),e.push(gq(a,d[h+1],!1,c));else b.forEach(function(l,m){e.push(gq(a,m,!1,c));e.push(gq(a,l,!1,c))});return[f,e]}k=["^ "];for(d=Ro(b);h<d.length;h++)k.push(gq(a,d[h],!0,c)),k.push(gq(a,b[d[h]],
!1,c));return k}if(null!=a.$e)return a.$e(b,function(l){return gq(a,l,!0,c)},function(l){return gq(a,l,!1,c)});h=(null==b?null:b.constructor).name;d=Error("Cannot write "+h);d.data={xe:b,type:h};throw d;}
function gq(a,b,c,d){var e=a.rb(b)||(a.kd?a.kd(b,a.Ja):null),f=e?e.tag(b):null,h=e?e.rep(b):null;if(null!=e&&null!=f)switch(f){case "_":return c?eq("~","_","",c,d):null;case "s":return 0<h.length?(a=h.charAt(0),a="~"===a||"^"===a||"`"===a?"~"+h:h):a=h,eq("","",a,c,d);case "?":return c?eq("~","?",h.toString()[0],c,d):h;case "i":return Infinity===h?eq("~","z","INF",c,d):-Infinity===h?eq("~","z","-INF",c,d):isNaN(h)?eq("~","z","NaN",c,d):c||"string"===typeof h||h instanceof Ba?eq("~","i",h.toString(),
c,d):h;case "d":return c?eq(h.eg,"d",h,c,d):h;case "b":return eq("~","b",h,c,d);case "'":return a.td?(b={},c=eq("~#","'","",!0,d),b[c]=gq(a,h,!1,d),d=b):d=[eq("~#","'","",!0,d),gq(a,h,!1,d)],d;case "array":return fq(a,h,d);case "map":return kq(a,h,d);default:a:{if(1===f.length){if("string"===typeof h){d=eq("~",f,h,c,d);break a}if(c||a.Nd){(a=a.td&&e.getVerboseHandler())?(f=a.tag(b),h=a.stringRep(b,a)):h=e.stringRep(b,e);if(null!==h){d=eq("~",f,h,c,d);break a}d=Error('Tag "'+f+'" cannot be encoded as string');
d.data={tag:f,rep:h,xe:b};throw d;}}b=f;c=h;a.td?(h={},h[eq("~#",b,"",!0,d)]=gq(a,c,!1,d),d=h):d=[eq("~#",b,"",!0,d),gq(a,c,!1,d)]}return d}else throw d=(null==b?null:b.constructor).name,a=Error("Cannot write "+d),a.data={xe:b,type:d},a;}function lq(a,b){a=a.rb(b)||(a.kd?a.kd(b,a.Ja):null);if(null!=a)return 1===a.tag(b).length?hp("'",b):b;a=(null==b?null:b.constructor).name;var c=Error("Cannot write "+a);c.data={xe:b,type:a};throw c;}
function mq(a,b){this.Qc=a;this.options=b||{};this.cache=!1===this.options.cache?null:this.options.cache?this.options.cache:new Wo}mq.prototype.Jf=function(){return this.Qc};mq.prototype.marshaller=mq.prototype.Jf;mq.prototype.write=function(a,b){var c=b||{};b=c.asMapKey||!1;var d=this.Qc.td?!1:this.cache;!1===c.marshalTop?a=gq(this.Qc,a,b,d):(c=this.Qc,a=JSON.stringify(gq(c,lq(c,a),b,d)));null!=this.cache&&this.cache.clear();return a};mq.prototype.write=mq.prototype.write;
mq.prototype.register=function(a,b){this.Qc.Ja.set(a,b)};mq.prototype.register=mq.prototype.register;function nq(a,b){if("json"===a||"json-verbose"===a||null==a)return a=new Ep(b),new Fp(a,b);throw Error("Cannot create reader of type "+a);}function oq(a,b){if("json"===a||"json-verbose"===a||null==a)return"json-verbose"===a&&(null==b&&(b={}),b.verbose=!0),a=new dq(b),new mq(a,b);b=Error('Type must be "json"');b.data={type:a};throw b;};li.prototype.H=function(a,b){return b instanceof li?this.hc===b.hc:b instanceof np?this.hc===b.toString():!1};Ba.prototype.H=function(a,b){return this.equiv(b)};np.prototype.H=function(a,b){return b instanceof li?b.H(null,this):this.equiv(b)};gp.prototype.H=function(a,b){return this.equiv(b)};Ba.prototype.ge=w;Ba.prototype.Y=function(){return dp(this)};np.prototype.ge=w;np.prototype.Y=function(){return vd(this.toString())};gp.prototype.ge=w;gp.prototype.Y=function(){return dp(this)};
np.prototype.ja=w;np.prototype.W=function(a,b){return Uc(b,['#uuid "',I.a(this.toString()),'"'].join(""))};function pq(a,b){for(var c=M(gb(b)),d=null,e=0,f=0;;)if(f<e){var h=d.P(null,f);a[h]=b[h];f+=1}else if(c=M(c))d=c,Ce(d)?(c=cd(d),f=dd(d),d=c,e=Q(c),c=f):(c=N(d),a[c]=b[c],c=O(d),d=null,e=0),f=0;else break;return a}function qq(){}qq.prototype.init=function(){return Yc(If)};qq.prototype.add=function(a,b,c){return ad(a,b,c)};qq.prototype.finalize=function(a){return $c(a)};
qq.prototype.fromArray=function(a){return Ah.call(null,a)};function rq(){}rq.prototype.init=function(){return Yc(je)};rq.prototype.add=function(a,b){return rf.g(a,b)};rq.prototype.finalize=function(a){return $c(a)};rq.prototype.fromArray=function(a){return Vg.call(null,a)};
function sq(a){var b=df(sm);a=pq({handlers:tj(Fi.A(R([new Fb(null,6,["$",function(){return function(c){return yd.a(c)}}(b),":",function(){return function(c){return cf.a(c)}}(b),"set",function(){return function(c){return ug.g(Ji,c)}}(b),"list",function(){return function(c){return ug.g(Cd,c.reverse())}}(b),"cmap",function(){return function(c){for(var d=0,e=Yc(If);;)if(d<c.length){var f=d+2;e=ad(e,c[d],c[d+1]);d=f}else return $c(e)}}(b),"with-meta",function(){return function(c){return te(c[0],c[1])}}(b)],
null),qk.a(a)]))),mapBuilder:new qq,arrayBuilder:new rq,prefersStrings:!1},tj(pe.g(a,qk)));return nq(b,a)}function tq(){}tq.prototype.tag=function(){return":"};tq.prototype.rep=function(a){return a.cb};tq.prototype.stringRep=function(a){return a.cb};function uq(){}uq.prototype.tag=function(){return"$"};uq.prototype.rep=function(a){return a.nb};uq.prototype.stringRep=function(a){return a.nb};function vq(){}vq.prototype.tag=function(){return"list"};
vq.prototype.rep=function(a){var b=[];a=M(a);for(var c=null,d=0,e=0;;)if(e<d){var f=c.P(null,e);b.push(f);e+=1}else if(a=M(a))c=a,Ce(c)?(a=cd(c),e=dd(c),c=a,d=Q(a),a=e):(a=N(c),b.push(a),a=O(c),c=null,d=0),e=0;else break;return hp("array",b)};vq.prototype.stringRep=function(){return null};function wq(){}wq.prototype.tag=function(){return"map"};wq.prototype.rep=function(a){return a};wq.prototype.stringRep=function(){return null};function xq(){}xq.prototype.tag=function(){return"set"};
xq.prototype.rep=function(a){var b=[];a=M(a);for(var c=null,d=0,e=0;;)if(e<d){var f=c.P(null,e);b.push(f);e+=1}else if(a=M(a))c=a,Ce(c)?(a=cd(c),e=dd(c),c=a,d=Q(a),a=e):(a=N(c),b.push(a),a=O(c),c=null,d=0),e=0;else break;return hp("array",b)};xq.prototype.stringRep=function(){return null};function yq(){}yq.prototype.tag=function(){return"array"};
yq.prototype.rep=function(a){var b=[];a=M(a);for(var c=null,d=0,e=0;;)if(e<d){var f=c.P(null,e);b.push(f);e+=1}else if(a=M(a))c=a,Ce(c)?(a=cd(c),e=dd(c),c=a,d=Q(a),a=e):(a=N(c),b.push(a),a=O(c),c=null,d=0),e=0;else break;return b};yq.prototype.stringRep=function(){return null};function zq(){}zq.prototype.tag=function(){return"u"};zq.prototype.rep=function(a){return a.hc};zq.prototype.stringRep=function(a){return this.rep(a)};function gi(a,b){this.value=a;this.B=b}function Aq(){}Aq.prototype.tag=function(){return"with-meta"};
Aq.prototype.rep=function(a){return hp("array",[a.value,a.B])};Aq.prototype.stringRep=function(){return null};
function Bq(a,b){var c=new tq,d=new uq,e=new vq,f=new wq,h=new xq,k=new yq,l=new zq,m=new Aq,q=Fi.A(R([ei([f,e,f,e,e,e,c,e,e,k,e,e,e,m,e,k,e,e,h,f,e,e,h,e,d,l,e,e]),"undefined"!==typeof wb&&"undefined"!==typeof xb&&"undefined"!==typeof pj?oe([pj,e]):null,"undefined"!==typeof wb&&"undefined"!==typeof xb&&"undefined"!==typeof og?oe([og,e]):null,"undefined"!==typeof wb&&"undefined"!==typeof xb&&"undefined"!==typeof Le?oe([Le,k]):null,qk.a(b)])),n=df(a);a=pq({objectBuilder:function(r,p,t,x,v,H,P,ea,ca,
ma){return function(T,u,y){return Pe(function(){return function(z,A,C){z.push(u.a?u.a(A):u.call(null,A),y.a?y.a(C):y.call(null,C));return z}}(r,p,t,x,v,H,P,ea,ca,ma),["^ "],T)}}(n,c,d,e,f,h,k,l,m,q),handlers:function(){var r=ac(q);r.forEach=function(){return function(p){for(var t=M(this),x=null,v=0,H=0;;)if(H<v){var P=x.P(null,H),ea=S(P,0,null);P=S(P,1,null);p.g?p.g(P,ea):p.call(null,P,ea);H+=1}else if(t=M(t))Ce(t)?(x=cd(t),t=dd(t),ea=x,v=Q(x),x=ea):(x=N(t),ea=S(x,0,null),P=S(x,1,null),p.g?p.g(P,
ea):p.call(null,P,ea),t=O(t),x=null,v=0),H=0;else return null}}(r,n,c,d,e,f,h,k,l,m,q);return r}(),unpack:function(){return function(r){return r instanceof Fb?r.j:!1}}(n,c,d,e,f,h,k,l,m,q)},tj(pe.g(b,qk)));return oq(n,a)};function Cq(a,b,c){if(We(c)){var d=zf(Ze,kg.g(a,c));return b.a?b.a(d):b.call(null,d)}return Xg(c)?(d=new Le(function(){var e=xc(c);return a.a?a.a(e):a.call(null,e)}(),function(){var e=yc(c);return a.a?a.a(e):a.call(null,e)}(),null),b.a?b.a(d):b.call(null,d)):Fe(c)?(d=Ui(kg.g(a,c)),b.a?b.a(d):b.call(null,d)):Ae(c)?(d=Xb(function(e,f){return ie.g(e,a.a?a.a(f):a.call(null,f))},c,c),b.a?b.a(d):b.call(null,d)):we(c)?(d=ug.g(le(c),kg.g(a,c)),b.a?b.a(d):b.call(null,d)):b.a?b.a(c):b.call(null,c)}
var Dq=function Dq(a,b){return Cq(cg(Dq,a),a,b)};function Eq(a){return Dq(function(b){return function(c){return ze(c)?ug.g(If,kg.g(b,c)):c}}(function(b){var c=S(b,0,null);b=S(b,1,null);return"string"===typeof c?new V(null,2,5,X,[cf.a(c),b],null):new V(null,2,5,X,[c,b],null)}),a)};var Fq=function Fq(a){for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return Fq.A(arguments[0],arguments[1],arguments[2],3<c.length?new Ad(c.slice(3),0,null):null)};Fq.A=function(a,b,c,d){return new V(null,2,5,X,[!1,Xb(ie,new Fb(null,3,[sk,a,ok,b,Xl,c],null),kg.g(Wg,wg(2,2,d)))],null)};Fq.O=3;Fq.R=function(a){var b=N(a),c=O(a);a=N(c);var d=O(c);c=N(d);d=O(d);return this.A(b,a,c,d)};function Gq(a){return vo(", ","string"===typeof a?new V(null,1,5,X,[a],null):a)}
function Hq(a,b,c,d,e,f){this.read=a;this.description=b;this.Ib=c;this.ga=d;this.M=e;this.C=f;this.l=2230716170;this.I=139264}g=Hq.prototype;g.V=function(a,b){return this.K(null,b,null)};g.K=function(a,b,c){switch(b instanceof K?b.cb:null){case "read":return this.read;case "description":return this.description;case "content-type":return this.Ib;default:return J.h(this.M,b,c)}};
g.yb=function(a,b,c){return Xb(function(){return function(d,e){var f=S(e,0,null);e=S(e,1,null);return b.h?b.h(d,f,e):b.call(null,d,f,e)}}(this),c,this)};g.Sc=function(a,b){var c=null!=a&&(a.l&64||w===a.T)?zf(Di,a):a,d=J.g(c,fk),e=null!=this&&(this.l&64||w===this.T)?zf(Di,this):this,f=J.g(e,fk);return Ag(b,kk,function(h,k,l){return function(m){return Fi.A(R([new Fb(null,1,["Accept",Gq(l)],null),B(m)?m:If]))}}(this,e,f,a,c,d))};
g.Tc=function(a,b){a=null!=a&&(a.l&64||w===a.T)?zf(Di,a):a;J.g(a,Ol);a=null!=this&&(this.l&64||w===this.T)?zf(Di,this):this;var c=J.g(a,Ol);try{var d=xo(b),e=cg(Fq,d);switch(d){case 0:return e.g?e.g("Request failed.",Vk):e.call(null,"Request failed.",Vk);case -1:return B(Co(b))?e.g?e.g("Request aborted by client.",ym):e.call(null,"Request aborted by client.",ym):e.g?e.g("Request timed out.",bk):e.call(null,"Request timed out.",bk);case 204:return new V(null,2,5,X,[!0,null],null);case 205:return new V(null,
2,5,X,[!0,null],null);default:try{var f=c.a?c.a(b):c.call(null,b);if(Je(Go,d))return new V(null,2,5,X,[!0,f],null);var h=yo(b);return e.J?e.J(h,fl,Fm,f):e.call(null,h,fl,Fm,f)}catch(p){if(p instanceof Object){f=p;e=X;var k=null!=a&&(a.l&64||w===a.T)?zf(Di,a):a,l=J.g(k,uk),m=new Fb(null,3,[sk,d,Xl,fl,Fm,null],null),q=[I.a(f.message),"  Format should have been ",I.a(l)].join(""),n=ne.A(m,ok,q,R([Xl,Kk,dk,Ao(b)]));var r=Je(Go,d)?n:ne.A(m,ok,yo(b),R([Fk,n]));return new V(null,2,5,e,[!1,r],null)}throw p;
}}}catch(p){if(p instanceof Object)return f=p,Fq.A(0,f.message,Gk,R([Gk,f]));throw p;}};g.W=function(a,b,c){return Xi(b,function(){return function(d){return Xi(b,ej,""," ","",c,d)}}(this),"#ajax.interceptors.ResponseFormat{",", ","}",c,qf.g(new V(null,3,5,X,[new V(null,2,5,X,[Ol,this.read],null),new V(null,2,5,X,[uk,this.description],null),new V(null,2,5,X,[fk,this.Ib],null)],null),this.M))};g.Ka=function(){return new ph(this,3,new V(null,3,5,X,[Ol,uk,fk],null),B(this.M)?kd(this.M):Gf())};g.S=function(){return this.ga};
g.Ga=function(){return new Hq(this.read,this.description,this.Ib,this.ga,this.M,this.C)};g.Z=function(){return 3+Q(this.M)};g.Y=function(){var a=this,b=this.C;if(null!=b)return b;var c=function(){return function(){return function(d){return-2103965186^Id(d)}}(b,a)(a)}();return this.C=c};g.H=function(a,b){return null!=b&&this.constructor===b.constructor&&Dd.g(this.read,b.read)&&Dd.g(this.description,b.description)&&Dd.g(this.Ib,b.Ib)&&Dd.g(this.M,b.M)};
g.Tb=function(a,b){return Je(new hi(null,new Fb(null,3,[uk,null,Ol,null,fk,null],null),null),b)?pe.g(Gc(ug.g(If,this),this.ga),b):new Hq(this.read,this.description,this.Ib,this.ga,Ff(pe.g(this.M,b)),null)};
g.Aa=function(a,b,c){return B(af.g?af.g(Ol,b):af.call(null,Ol,b))?new Hq(c,this.description,this.Ib,this.ga,this.M,null):B(af.g?af.g(uk,b):af.call(null,uk,b))?new Hq(this.read,c,this.Ib,this.ga,this.M,null):B(af.g?af.g(fk,b):af.call(null,fk,b))?new Hq(this.read,this.description,c,this.ga,this.M,null):new Hq(this.read,this.description,this.Ib,this.ga,ne.h(this.M,b,c),null)};
g.aa=function(){return M(qf.g(new V(null,3,5,X,[new Le(Ol,this.read,null),new Le(uk,this.description,null),new Le(fk,this.Ib,null)],null),this.M))};g.U=function(a,b){return new Hq(this.read,this.description,this.Ib,b,this.M,this.C)};g.ea=function(a,b){return Be(b)?this.Aa(null,ic.g(b,0),ic.g(b,1)):Xb(gc,this,b)};function Iq(a){var b=pe.A(a,Ol,R([uk,fk]));b=Ae(a)?ug.g(If,b):b;return new Hq(Ol.a(a),uk.a(a),fk.a(a),null,Ff(b),null)}
function Jq(a,b,c){this.ga=a;this.M=b;this.C=c;this.l=2230716170;this.I=139264}g=Jq.prototype;g.V=function(a,b){return this.K(null,b,null)};g.K=function(a,b,c){return J.h(this.M,b,c)};g.yb=function(a,b,c){return Xb(function(){return function(d,e){var f=S(e,0,null);e=S(e,1,null);return b.h?b.h(d,f,e):b.call(null,d,f,e)}}(this),c,this)};
g.Sc=function(a,b){a=null!=b&&(b.l&64||w===b.T)?zf(Di,b):b;J.g(a,Sl);J.g(a,lk);var c=J.g(a,vl),d=J.g(a,gn);b=J.g(a,kk);var e=ze(c)?c:c instanceof K?Fo(new V(null,2,5,X,["keywords are not allowed as request formats in ajax calls: ",c],null)):He(c)?new Fb(null,2,[nk,c,fk,"text/plain"],null):If;e=null!=e&&(e.l&64||w===e.T)?zf(Di,e):e;var f=J.g(e,nk);e=J.g(e,fk);c=null!=f?f.a?f.a(d):f.call(null,d):Fo(new V(null,2,5,X,["unrecognized request format: ",c],null));b=B(b)?b:If;return ne.A(a,Pl,c,R([kk,B(e)?
ne.h(b,"Content-Type",Gq(e)):b]))};g.Tc=function(a,b){return b};g.W=function(a,b,c){return Xi(b,function(){return function(d){return Xi(b,ej,""," ","",c,d)}}(this),"#ajax.interceptors.ApplyRequestFormat{",", ","}",c,qf.g(je,this.M))};g.Ka=function(){return new ph(this,0,je,B(this.M)?kd(this.M):Gf())};g.S=function(){return this.ga};g.Ga=function(){return new Jq(this.ga,this.M,this.C)};g.Z=function(){return 0+Q(this.M)};
g.Y=function(){var a=this,b=this.C;if(null!=b)return b;var c=function(){return function(){return function(d){return 1698259290^Id(d)}}(b,a)(a)}();return this.C=c};g.H=function(a,b){return null!=b&&this.constructor===b.constructor&&Dd.g(this.M,b.M)};g.Tb=function(a,b){return Je(Ji,b)?pe.g(Gc(ug.g(If,this),this.ga),b):new Jq(this.ga,Ff(pe.g(this.M,b)),null)};g.Aa=function(a,b,c){return new Jq(this.ga,ne.h(this.M,b,c),null)};g.aa=function(){return M(qf.g(je,this.M))};
g.U=function(a,b){return new Jq(b,this.M,this.C)};g.ea=function(a,b){return Be(b)?this.Aa(null,ic.g(b,0),ic.g(b,1)):Xb(gc,this,b)};function Kq(a){var b=null!=a&&(a.l&64||w===a.T)?zf(Di,a):a,c=J.g(b,Fl),d=J.g(b,gn),e=J.g(b,lk),f=J.g(b,ql);return function(h,k,l,m,q,n){return function(r){var p=Dd.g(q,"GET")&&null==n?m:n;return B(p)?[I.a(r),B(Wi(/\?/,r))?"\x26":"?",I.a(Oo(l,p))].join(""):r}}(a,b,c,d,e,f)}function Lq(a,b,c){this.ga=a;this.M=b;this.C=c;this.l=2230716170;this.I=139264}g=Lq.prototype;
g.V=function(a,b){return this.K(null,b,null)};g.K=function(a,b,c){return J.h(this.M,b,c)};g.yb=function(a,b,c){return Xb(function(){return function(d,e){var f=S(e,0,null);e=S(e,1,null);return b.h?b.h(d,f,e):b.call(null,d,f,e)}}(this),c,this)};g.Sc=function(a,b){a=null!=b&&(b.l&64||w===b.T)?zf(Di,b):b;b=J.g(a,lk);b=Dd.g(b,"GET")?Ld:Qe;a=Ag(a,Sl,Kq(a));return b.a?b.a(a):b.call(null,a)};g.Tc=function(a,b){return b};
g.W=function(a,b,c){return Xi(b,function(){return function(d){return Xi(b,ej,""," ","",c,d)}}(this),"#ajax.interceptors.ProcessUrlParameters{",", ","}",c,qf.g(je,this.M))};g.Ka=function(){return new ph(this,0,je,B(this.M)?kd(this.M):Gf())};g.S=function(){return this.ga};g.Ga=function(){return new Lq(this.ga,this.M,this.C)};g.Z=function(){return 0+Q(this.M)};
g.Y=function(){var a=this,b=this.C;if(null!=b)return b;var c=function(){return function(){return function(d){return-516728758^Id(d)}}(b,a)(a)}();return this.C=c};g.H=function(a,b){return null!=b&&this.constructor===b.constructor&&Dd.g(this.M,b.M)};g.Tb=function(a,b){return Je(Ji,b)?pe.g(Gc(ug.g(If,this),this.ga),b):new Lq(this.ga,Ff(pe.g(this.M,b)),null)};g.Aa=function(a,b,c){return new Lq(this.ga,ne.h(this.M,b,c),null)};g.aa=function(){return M(qf.g(je,this.M))};
g.U=function(a,b){return new Lq(b,this.M,this.C)};g.ea=function(a,b){return Be(b)?this.Aa(null,ic.g(b,0),ic.g(b,1)):Xb(gc,this,b)};function Mq(a,b,c){this.ga=a;this.M=b;this.C=c;this.l=2230716170;this.I=139264}g=Mq.prototype;g.V=function(a,b){return this.K(null,b,null)};g.K=function(a,b,c){return J.h(this.M,b,c)};g.yb=function(a,b,c){return Xb(function(){return function(d,e){var f=S(e,0,null);e=S(e,1,null);return b.h?b.h(d,f,e):b.call(null,d,f,e)}}(this),c,this)};
g.Sc=function(a,b){a=null!=b&&(b.l&64||w===b.T)?zf(Di,b):b;return null==J.g(a,Pl)?a:Ld(a)};g.Tc=function(a,b){return b};g.W=function(a,b,c){return Xi(b,function(){return function(d){return Xi(b,ej,""," ","",c,d)}}(this),"#ajax.interceptors.DirectSubmission{",", ","}",c,qf.g(je,this.M))};g.Ka=function(){return new ph(this,0,je,B(this.M)?kd(this.M):Gf())};g.S=function(){return this.ga};g.Ga=function(){return new Mq(this.ga,this.M,this.C)};g.Z=function(){return 0+Q(this.M)};
g.Y=function(){var a=this,b=this.C;if(null!=b)return b;var c=function(){return function(){return function(d){return-1077152635^Id(d)}}(b,a)(a)}();return this.C=c};g.H=function(a,b){return null!=b&&this.constructor===b.constructor&&Dd.g(this.M,b.M)};g.Tb=function(a,b){return Je(Ji,b)?pe.g(Gc(ug.g(If,this),this.ga),b):new Mq(this.ga,Ff(pe.g(this.M,b)),null)};g.Aa=function(a,b,c){return new Mq(this.ga,ne.h(this.M,b,c),null)};g.aa=function(){return M(qf.g(je,this.M))};
g.U=function(a,b){return new Mq(b,this.M,this.C)};g.ea=function(a,b){return Be(b)?this.Aa(null,ic.g(b,0),ic.g(b,1)):Xb(gc,this,b)};var Nq=new V(null,3,5,X,[new Lq(null,null,null),new Mq(null,null,null),new Jq(null,null,null)],null);
function Oq(a){var b=Pq;a=null!=a&&(a.l&64||w===a.T)?zf(Di,a):a;var c=J.g(a,hn);return c instanceof Hq?c:Be(c)?b.a?b.a(a):b.call(null,a):ze(c)?Iq(c):c instanceof K?Fo(new V(null,2,5,X,["keywords are not allowed as response formats in ajax calls: ",c],null)):He(c)?Iq(new Fb(null,3,[Ol,c,uk,"custom",fk,"*/*"],null)):Fo(new V(null,2,5,X,["unrecognized response format: ",c],null))};var Qq=function(a){return function(){function b(e){var f=null!=e&&(e.l&64||w===e.T)?zf(Di,e):e,h=J.g(f,kl),k=J.g(f,tl),l=J.g(f,Lk);return Iq(new Fb(null,3,[Ol,function(m,q,n,r,p){return function(t){t=Ao(t);t=B(B(n)?Dd.g(0,t.indexOf(n)):n)?t.substring(n.length):t;return a.h?a.h(p,r,t):a.call(null,p,r,t)}}(e,f,h,k,l),uk,["JSON",B(h)?[" prefix '",I.a(h),"'"].join(""):null,B(k)?" keywordize":null].join(""),fk,new V(null,1,5,X,["application/json"],null)],null))}function c(){return d.a(If)}var d=null;d=
function(e){switch(arguments.length){case 0:return c.call(this);case 1:return b.call(this,e)}throw Error("Invalid arity: "+arguments.length);};d.o=c;d.a=b;return d}()}(function(a,b,c){c=JSON.parse(c);return B(a)?c:xj(c,R([yj,b]))}),Rq=function(a){return function(){return new Fb(null,2,[nk,a,fk,"application/json"],null)}}(function(a){return JSON.stringify(tj(a))});function Sq(a){a=null!=a&&(a.l&64||w===a.T)?zf(Di,a):a;a=J.g(a,Cl);return B(a)?a:sm}function Tq(a,b){return function(c){return function(d){return c.write(d)}}(function(){var c=Sm.a(b);return B(c)?c:Bq(a,b)}())}function Uq(a){var b=Sq(a),c=Dd.g(b,sm)||Dd.g(b,Lm)?"json":"msgpack";return new Fb(null,2,[nk,Tq(b,a),fk,["application/transit+",c].join("")],null)}function Vq(a){return function(b){return function(c){c=Ao(c);return b.read(c)}}(function(){var b=Ok.a(a);return B(b)?b:sq(a)}())}
var Wq=function Wq(a){switch(arguments.length){case 0:return Wq.o();case 1:return Wq.a(arguments[0]);case 2:return Wq.g(arguments[0],arguments[1]);default:throw Error(["Invalid arity: ",I.a(arguments.length)].join(""));}};Wq.o=function(){return Wq.a(If)};Wq.a=function(a){return Wq.g(Sq(a),a)};Wq.g=function(a,b){return Iq(new Fb(null,3,[Ol,Vq(b),uk,"Transit",fk,new V(null,1,5,X,["application/transit+json"],null)],null))};Wq.O=2;var Xq=function Xq(a){switch(arguments.length){case 0:return Xq.o();case 1:return Xq.a(arguments[0]);default:throw Error(["Invalid arity: ",I.a(arguments.length)].join(""));}};Xq.o=function(){return Iq(new Fb(null,3,[Ol,Ao,uk,"raw text",fk,new V(null,1,5,X,["*/*"],null)],null))};Xq.a=function(){return Xq.o()};Xq.O=1;function Yq(a,b){return null==b||ze(b)?b:Be(b)?Yq(a,N(O(b))):b.a?b.a(a):b.call(null,a)}
function Zq(a,b){a=Be(b)?N(b):fk.a(Yq(a,b));return null==a?new V(null,1,5,X,["*/*"],null):"string"===typeof a?new V(null,1,5,X,[a],null):a}function $q(a){return function(b){b=Be(b)?N(b):fk.a(Yq(a,b));return null==b?new V(null,1,5,X,["*/*"],null):"string"===typeof b?new V(null,1,5,X,[b],null):b}}function ar(a){return function(b){return Dd.g(b,"*/*")||0<=a.indexOf(b)}}function br(a,b){return function(c){c=Zq(b,c);return Yf(ar(a),c)}}
function cr(a){return function(b){var c=null!=a&&(a.l&64||w===a.T)?zf(Di,a):a;var d=J.g(c,hn),e=Bo(b,"Content-Type");c=Yq(c,N(sg(br(B(e)?e:"",c),d)));c=Ol.a(c);return c.a?c.a(b):c.call(null,b)}}function Pq(a){var b=null!=a&&(a.l&64||w===a.T)?zf(Di,a):a;var c=J.g(b,hn);b=Be(c)?qg($q(b),R([c])):Zq(b,c);return Iq(new Fb(null,3,[Ol,cr(a),vl,["(from ",I.a(b),")"].join(""),fk,b],null))};function dr(a){return function(b){return new Fb(null,3,[sk,xo(b),kk,zo(b),Pl,a.a?a.a(b):a.call(null,b)],null)}};function er(){0!=fr&&qa(this);this.oe=this.oe}var fr=0;er.prototype.oe=!1;function gr(){return Dn("iPhone")&&!Dn("iPod")&&!Dn("iPad")};var hr=Dn("Opera"),ir=Dn("Trident")||Dn("MSIE"),jr=Dn("Edge"),kr=Dn("Gecko")&&!(ab("WebKit")&&!Dn("Edge"))&&!(Dn("Trident")||Dn("MSIE"))&&!Dn("Edge"),lr=ab("WebKit")&&!Dn("Edge");lr&&Dn("Mobile");Dn("Macintosh");Dn("Windows");Dn("Linux")||Dn("CrOS");var mr=fa.navigator||null;mr&&(mr.appVersion||"").indexOf("X11");Dn("Android");gr();Dn("iPad");Dn("iPod");gr()||Dn("iPad")||Dn("iPod");ab("KaiOS");ab("GAFP");function nr(){var a=fa.document;return a?a.documentMode:void 0}var or;
a:{var pr="",qr=function(){var a=bb;if(kr)return/rv:([^\);]+)(\)|;)/.exec(a);if(jr)return/Edge\/([\d\.]+)/.exec(a);if(ir)return/\b(?:MSIE|rv)[: ]([^\);]+)(\)|;)/.exec(a);if(lr)return/WebKit\/(\S+)/.exec(a);if(hr)return/(?:Version)[ \/]?(\S+)/.exec(a)}();qr&&(pr=qr?qr[1]:"");if(ir){var rr=nr();if(null!=rr&&rr>parseFloat(pr)){or=String(rr);break a}}or=pr}var sr={};
function tr(a){return Aa(sr,a,function(){for(var b=0,c=$a(String(or)).split("."),d=$a(String(a)).split("."),e=Math.max(c.length,d.length),f=0;0==b&&f<e;f++){var h=c[f]||"",k=d[f]||"";do{h=/(\d*)(\D*)(.*)/.exec(h)||["","","",""];k=/(\d*)(\D*)(.*)/.exec(k)||["","","",""];if(0==h[0].length&&0==k[0].length)break;b=cb(0==h[1].length?0:parseInt(h[1],10),0==k[1].length?0:parseInt(k[1],10))||cb(0==h[2].length,0==k[2].length)||cb(h[2],k[2]);h=h[3];k=k[3]}while(0==b)}return 0<=b})}var ur;var vr=fa.document;
ur=vr&&ir?nr()||("CSS1Compat"==vr.compatMode?parseInt(or,10):5):void 0;var wr;(wr=!ir)||(wr=9<=Number(ur));var Pr=wr,Qr=ir&&!tr("9"),Rr=function(){if(!fa.addEventListener||!Object.defineProperty)return!1;var a=!1,b=Object.defineProperty({},"passive",{get:function(){a=!0}});try{fa.addEventListener("test",ka,b),fa.removeEventListener("test",ka,b)}catch(c){}return a}();function Sr(a,b){this.type=a;this.currentTarget=this.target=b;this.defaultPrevented=this.zc=!1;this.ff=!0}Sr.prototype.stopPropagation=function(){this.zc=!0};Sr.prototype.preventDefault=function(){this.defaultPrevented=!0;this.ff=!1};function Tr(a,b){Sr.call(this,a?a.type:"");this.relatedTarget=this.currentTarget=this.target=null;this.button=this.screenY=this.screenX=this.clientY=this.clientX=this.offsetY=this.offsetX=0;this.key="";this.charCode=this.keyCode=0;this.metaKey=this.shiftKey=this.altKey=this.ctrlKey=!1;this.state=null;this.pointerId=0;this.pointerType="";this.gd=null;a&&this.init(a,b)}xa(Tr,Sr);var Ur={2:"touch",3:"pen",4:"mouse"};
Tr.prototype.init=function(a,b){var c=this.type=a.type,d=a.changedTouches&&a.changedTouches.length?a.changedTouches[0]:null;this.target=a.target||a.srcElement;this.currentTarget=b;if(b=a.relatedTarget){if(kr){a:{try{ya(b.nodeName);var e=!0;break a}catch(f){}e=!1}e||(b=null)}}else"mouseover"==c?b=a.fromElement:"mouseout"==c&&(b=a.toElement);this.relatedTarget=b;d?(this.clientX=void 0!==d.clientX?d.clientX:d.pageX,this.clientY=void 0!==d.clientY?d.clientY:d.pageY,this.screenX=d.screenX||0,this.screenY=
d.screenY||0):(this.offsetX=lr||void 0!==a.offsetX?a.offsetX:a.layerX,this.offsetY=lr||void 0!==a.offsetY?a.offsetY:a.layerY,this.clientX=void 0!==a.clientX?a.clientX:a.pageX,this.clientY=void 0!==a.clientY?a.clientY:a.pageY,this.screenX=a.screenX||0,this.screenY=a.screenY||0);this.button=a.button;this.keyCode=a.keyCode||0;this.key=a.key||"";this.charCode=a.charCode||("keypress"==c?a.keyCode:0);this.ctrlKey=a.ctrlKey;this.altKey=a.altKey;this.shiftKey=a.shiftKey;this.metaKey=a.metaKey;this.pointerId=
a.pointerId||0;this.pointerType=ia(a.pointerType)?a.pointerType:Ur[a.pointerType]||"";this.state=a.state;this.gd=a;a.defaultPrevented&&this.preventDefault()};Tr.prototype.stopPropagation=function(){Tr.jf.stopPropagation.call(this);this.gd.stopPropagation?this.gd.stopPropagation():this.gd.cancelBubble=!0};
Tr.prototype.preventDefault=function(){Tr.jf.preventDefault.call(this);var a=this.gd;if(a.preventDefault)a.preventDefault();else if(a.returnValue=!1,Qr)try{if(a.ctrlKey||112<=a.keyCode&&123>=a.keyCode)a.keyCode=-1}catch(b){}};var Vr="closure_listenable_"+(1E6*Math.random()|0),Wr=0;function Xr(a,b,c,d,e){this.listener=a;this.proxy=null;this.src=b;this.type=c;this.capture=!!d;this.rb=e;this.key=++Wr;this.Nc=this.wd=!1}function Yr(a){a.Nc=!0;a.listener=null;a.proxy=null;a.src=null;a.rb=null};function Zr(a){this.src=a;this.Bb={};this.Qd=0}Zr.prototype.add=function(a,b,c,d,e){var f=a.toString();a=this.Bb[f];a||(a=this.Bb[f]=[],this.Qd++);var h=$r(a,b,d,e);-1<h?(b=a[h],c||(b.wd=!1)):(b=new Xr(b,this.src,f,!!d,e),b.wd=c,a.push(b));return b};Zr.prototype.remove=function(a,b,c,d){a=a.toString();if(!(a in this.Bb))return!1;var e=this.Bb[a];b=$r(e,b,c,d);return-1<b?(Yr(e[b]),Array.prototype.splice.call(e,b,1),0==e.length&&(delete this.Bb[a],this.Qd--),!0):!1};
function as(a,b){var c=b.type;if(c in a.Bb){var d=a.Bb[c],e=jb(d,b),f;(f=0<=e)&&Array.prototype.splice.call(d,e,1);f&&(Yr(b),0==a.Bb[c].length&&(delete a.Bb[c],a.Qd--))}}Zr.prototype.qe=function(a,b,c,d){a=this.Bb[a.toString()];var e=-1;a&&(e=$r(a,b,c,d));return-1<e?a[e]:null};function $r(a,b,c,d){for(var e=0;e<a.length;++e){var f=a[e];if(!f.Nc&&f.listener==b&&f.capture==!!c&&f.rb==d)return e}return-1};var bs="closure_lm_"+(1E6*Math.random()|0),cs={},ds=0;function es(a,b,c,d,e){if(d&&d.once)fs(a,b,c,d,e);else if("array"==la(b))for(var f=0;f<b.length;f++)es(a,b[f],c,d,e);else c=gs(c),a&&a[Vr]?a.uc.add(String(b),c,!1,pa(d)?!!d.capture:!!d,e):hs(a,b,c,!1,d,e)}
function hs(a,b,c,d,e,f){if(!b)throw Error("Invalid event type");var h=pa(e)?!!e.capture:!!e,k=is(a);k||(a[bs]=k=new Zr(a));c=k.add(b,c,d,h,f);if(!c.proxy){d=js();c.proxy=d;d.src=a;d.listener=c;if(a.addEventListener)Rr||(e=h),void 0===e&&(e=!1),a.addEventListener(b.toString(),d,e);else if(a.attachEvent)a.attachEvent(ks(b.toString()),d);else if(a.addListener&&a.removeListener)a.addListener(d);else throw Error("addEventListener and attachEvent are unavailable.");ds++}}
function js(){var a=ls,b=Pr?function(c){return a.call(b.src,b.listener,c)}:function(c){c=a.call(b.src,b.listener,c);if(!c)return c};return b}function fs(a,b,c,d,e){if("array"==la(b))for(var f=0;f<b.length;f++)fs(a,b[f],c,d,e);else c=gs(c),a&&a[Vr]?a.uc.add(String(b),c,!0,pa(d)?!!d.capture:!!d,e):hs(a,b,c,!0,d,e)}
function ms(a,b,c,d,e){if("array"==la(b))for(var f=0;f<b.length;f++)ms(a,b[f],c,d,e);else d=pa(d)?!!d.capture:!!d,c=gs(c),a&&a[Vr]?a.uc.remove(String(b),c,d,e):a&&(a=is(a))&&(b=a.qe(b,c,d,e))&&ns(b)}
function ns(a){if("number"!=typeof a&&a&&!a.Nc){var b=a.src;if(b&&b[Vr])as(b.uc,a);else{var c=a.type,d=a.proxy;b.removeEventListener?b.removeEventListener(c,d,a.capture):b.detachEvent?b.detachEvent(ks(c),d):b.addListener&&b.removeListener&&b.removeListener(d);ds--;(c=is(b))?(as(c,a),0==c.Qd&&(c.src=null,b[bs]=null)):Yr(a)}}}function ks(a){return a in cs?cs[a]:cs[a]="on"+a}
function os(a,b,c,d){var e=!0;if(a=is(a))if(b=a.Bb[b.toString()])for(b=b.concat(),a=0;a<b.length;a++){var f=b[a];f&&f.capture==c&&!f.Nc&&(f=ps(f,d),e=e&&!1!==f)}return e}function ps(a,b){var c=a.listener,d=a.rb||a.src;a.wd&&ns(a);return c.call(d,b)}
function ls(a,b){if(a.Nc)return!0;if(!Pr){if(!b)a:{b=["window","event"];for(var c=fa,d=0;d<b.length;d++)if(c=c[b[d]],null==c){b=null;break a}b=c}d=b;b=new Tr(d,this);c=!0;if(!(0>d.keyCode||void 0!=d.returnValue)){a:{var e=!1;if(0==d.keyCode)try{d.keyCode=-1;break a}catch(h){e=!0}if(e||void 0==d.returnValue)d.returnValue=!0}d=[];for(e=b.currentTarget;e;e=e.parentNode)d.push(e);a=a.type;for(e=d.length-1;!b.zc&&0<=e;e--){b.currentTarget=d[e];var f=os(d[e],a,!0,b);c=c&&f}for(e=0;!b.zc&&e<d.length;e++)b.currentTarget=
d[e],f=os(d[e],a,!1,b),c=c&&f}return c}return ps(a,new Tr(b,this))}function is(a){a=a[bs];return a instanceof Zr?a:null}var qs="__closure_events_fn_"+(1E9*Math.random()>>>0);function gs(a){if(oa(a))return a;a[qs]||(a[qs]=function(b){return a.handleEvent(b)});return a[qs]};function rs(){er.call(this);this.uc=new Zr(this);this.mf=this;this.cf=null}xa(rs,er);rs.prototype[Vr]=!0;rs.prototype.addEventListener=function(a,b,c,d){es(this,a,b,c,d)};rs.prototype.removeEventListener=function(a,b,c,d){ms(this,a,b,c,d)};
rs.prototype.dispatchEvent=function(a){var b,c=this.cf;if(c)for(b=[];c;c=c.cf)b.push(c);c=this.mf;var d=a.type||a;if(ia(a))a=new Sr(a,c);else if(a instanceof Sr)a.target=a.target||c;else{var e=a;a=new Sr(d,c);ib(a,e)}e=!0;if(b)for(var f=b.length-1;!a.zc&&0<=f;f--){var h=a.currentTarget=b[f];e=ss(h,d,!0,a)&&e}a.zc||(h=a.currentTarget=c,e=ss(h,d,!0,a)&&e,a.zc||(e=ss(h,d,!1,a)&&e));if(b)for(f=0;!a.zc&&f<b.length;f++)h=a.currentTarget=b[f],e=ss(h,d,!1,a)&&e;return e};
function ss(a,b,c,d){b=a.uc.Bb[String(b)];if(!b)return!0;b=b.concat();for(var e=!0,f=0;f<b.length;++f){var h=b[f];if(h&&!h.Nc&&h.capture==c){var k=h.listener,l=h.rb||h.src;h.wd&&as(a.uc,h);e=!1!==k.call(l,d)&&e}}return e&&0!=d.ff}rs.prototype.qe=function(a,b,c,d){return this.uc.qe(String(a),b,c,d)};function ts(a,b,c){if(oa(a))c&&(a=wa(a,c));else if(a&&"function"==typeof a.handleEvent)a=wa(a.handleEvent,a);else throw Error("Invalid listener argument");return 2147483647<Number(b)?-1:fa.setTimeout(a,b||0)};function us(){}us.prototype.Me=null;function vs(a){var b;(b=a.Me)||(b={},ws(a)&&(b[0]=!0,b[1]=!0),b=a.Me=b);return b};var xs;function ys(){}xa(ys,us);function zs(a){return(a=ws(a))?new ActiveXObject(a):new XMLHttpRequest}function ws(a){if(!a.Ye&&"undefined"==typeof XMLHttpRequest&&"undefined"!=typeof ActiveXObject){for(var b=["MSXML2.XMLHTTP.6.0","MSXML2.XMLHTTP.3.0","MSXML2.XMLHTTP","Microsoft.XMLHTTP"],c=0;c<b.length;c++){var d=b[c];try{return new ActiveXObject(d),a.Ye=d}catch(e){}}throw Error("Could not create ActiveXObject. ActiveX might be disabled, or MSXML might not be installed");}return a.Ye}xs=new ys;function As(a){rs.call(this);this.headers=new rb;this.Ud=a||null;this.Dc=!1;this.Td=this.ba=null;this.ue="";this.Lc=0;this.Jd="";this.ld=this.se=this.Hd=this.pe=!1;this.sd=0;this.Pd=null;this.Od=Bs;this.De=this.df=this.Ee=!1}xa(As,rs);var Bs="",Cs=/^https?$/i,Ds=["POST","PUT"];g=As.prototype;g.setTimeoutInterval=function(a){this.sd=Math.max(0,a)};g.setResponseType=function(a){this.Od=a};g.setWithCredentials=function(a){this.Ee=a};g.setProgressEventsEnabled=function(a){this.df=a};
g.send=function(a,b,c,d){if(this.ba)throw Error("[goog.net.XhrIo] Object is active with another request\x3d"+this.ue+"; newUri\x3d"+a);b=b?b.toUpperCase():"GET";this.ue=a;this.Jd="";this.Lc=0;this.pe=!1;this.Dc=!0;this.ba=this.Ud?zs(this.Ud):zs(xs);this.Td=this.Ud?vs(this.Ud):vs(xs);this.ba.onreadystatechange=wa(this.bf,this);this.df&&"onprogress"in this.ba&&(this.ba.onprogress=wa(function(f){this.af(f,!0)},this),this.ba.upload&&(this.ba.upload.onprogress=wa(this.af,this)));try{this.getStatus(),this.se=
!0,this.ba.open(b,String(a),!0),this.se=!1}catch(f){this.getStatus();Es(this,f);return}a=c||"";var e=this.headers.clone();d&&qb(d,function(f,h){e.set(h,f)});d=mb(e.Ub());c=fa.FormData&&a instanceof fa.FormData;!(0<=jb(Ds,b))||d||c||e.set("Content-Type","application/x-www-form-urlencoded;charset\x3dutf-8");e.forEach(function(f,h){this.ba.setRequestHeader(h,f)},this);this.Od&&(this.ba.responseType=this.Od);"withCredentials"in this.ba&&this.ba.withCredentials!==this.Ee&&(this.ba.withCredentials=this.Ee);
try{Fs(this),0<this.sd&&(this.De=Gs(this.ba),this.getStatus(),this.De?(this.ba.timeout=this.sd,this.ba.ontimeout=wa(this.kf,this)):this.Pd=ts(this.kf,this.sd,this)),this.getStatus(),this.Hd=!0,this.ba.send(a),this.Hd=!1}catch(f){this.getStatus(),Es(this,f)}};function Gs(a){return ir&&tr(9)&&"number"==typeof a.timeout&&void 0!==a.ontimeout}function nb(a){return"content-type"==a.toLowerCase()}
g.kf=function(){"undefined"!=typeof ba&&this.ba&&(this.Jd="Timed out after "+this.sd+"ms, aborting",this.Lc=8,this.getStatus(),this.dispatchEvent("timeout"),this.abort(8))};function Es(a,b){a.Dc=!1;a.ba&&(a.ld=!0,a.ba.abort(),a.ld=!1);a.Jd=b;a.Lc=5;Hs(a);Is(a)}function Hs(a){a.pe||(a.pe=!0,a.dispatchEvent("complete"),a.dispatchEvent("error"))}
g.abort=function(a){this.ba&&this.Dc&&(this.getStatus(),this.Dc=!1,this.ld=!0,this.ba.abort(),this.ld=!1,this.Lc=a||7,this.dispatchEvent("complete"),this.dispatchEvent("abort"),Is(this))};g.bf=function(){this.oe||(this.se||this.Hd||this.ld?Js(this):this.Yf())};g.Yf=function(){Js(this)};
function Js(a){if(a.Dc&&"undefined"!=typeof ba)if(a.Td[1]&&4==Ks(a)&&2==a.getStatus())a.getStatus();else if(a.Hd&&4==Ks(a))ts(a.bf,0,a);else if(a.dispatchEvent("readystatechange"),4==Ks(a)){a.getStatus();a.Dc=!1;try{var b=a.getStatus();a:switch(b){case 200:case 201:case 202:case 204:case 206:case 304:case 1223:var c=!0;break a;default:c=!1}var d;if(!(d=c)){var e;if(e=0===b){var f=String(a.ue).match(ub)[1]||null;if(!f&&fa.self&&fa.self.location){var h=fa.self.location.protocol;f=h.substr(0,h.length-
1)}e=!Cs.test(f?f.toLowerCase():"")}d=e}d?(a.dispatchEvent("complete"),a.dispatchEvent("success")):(a.Lc=6,a.Jd=a.getStatusText()+" ["+a.getStatus()+"]",Hs(a))}finally{Is(a)}}}g.af=function(a,b){this.dispatchEvent(Ls(a,"progress"));this.dispatchEvent(Ls(a,b?"downloadprogress":"uploadprogress"))};function Ls(a,b){return{type:b,lengthComputable:a.lengthComputable,loaded:a.loaded,total:a.total}}
function Is(a){if(a.ba){Fs(a);var b=a.ba,c=a.Td[0]?ka:null;a.ba=null;a.Td=null;a.dispatchEvent("ready");try{b.onreadystatechange=c}catch(d){}}}function Fs(a){a.ba&&a.De&&(a.ba.ontimeout=null);a.Pd&&(fa.clearTimeout(a.Pd),a.Pd=null)}function Ks(a){return a.ba?a.ba.readyState:0}g.getStatus=function(){try{return 2<Ks(this)?this.ba.status:-1}catch(a){return-1}};g.getStatusText=function(){try{return 2<Ks(this)?this.ba.statusText:""}catch(a){return""}};
g.getResponse=function(){try{if(!this.ba)return null;if("response"in this.ba)return this.ba.response;switch(this.Od){case Bs:case "text":return this.ba.responseText;case "arraybuffer":if("mozResponseArrayBuffer"in this.ba)return this.ba.mozResponseArrayBuffer}return null}catch(a){return null}};g.getResponseHeader=function(a){if(this.ba&&4==Ks(this))return a=this.ba.getResponseHeader(a),null===a?void 0:a};
g.getAllResponseHeaders=function(){return this.ba&&4==Ks(this)?this.ba.getAllResponseHeaders()||"":""};g.getResponseHeaders=function(){for(var a={},b=this.getAllResponseHeaders().split("\r\n"),c=0;c<b.length;c++)if(!Za(b[c])){var d=eb(b[c],":",1),e=d[0];d=d[1];if(ia(d)){d=d.trim();var f=a[e]||[];a[e]=f;f.push(d)}}return fb(a,function(h){return h.join(", ")})};g.getLastErrorCode=function(){return this.Lc};function Ms(a){return a instanceof K?df(a).toUpperCase():a}function Ns(a,b){return Eo(b,a)}function Os(a,b){return function(c){c=Xb(Ns,c,b);return a.a?a.a(c):a.call(null,c)}}var Ps=fg(je);function Qs(a){var b=Oq(a);return Ag(Ag(a,lk,Ms),Mk,function(c){return function(d){return qf.A(new V(null,1,5,X,[c],null),B(d)?d:Dc(Ps),R([Nq]))}}(b))}function Rs(a,b){return Do(b,a)};var Ss=fg(new V(null,6,5,X,[new V(null,2,5,X,["application/transit+json",Wq],null),new V(null,2,5,X,["application/transit+transit",Wq],null),new V(null,2,5,X,["application/json",Qq],null),new V(null,2,5,X,["text/plain",Xq],null),new V(null,2,5,X,["text/html",Xq],null),new V(null,2,5,X,["*/*",Xq],null)],null));
function Ts(a,b){if(ze(a))return a;if(qe(a))return new Fb(null,1,[nk,a],null);if(null==a)return Uq(b);switch(a instanceof K?a.cb:null){case "transit":return Uq(b);case "json":return Rq.o?Rq.o():Rq.call(null);case "text":return new Fb(null,2,[nk,Qe,fk,"text/plain; charset\x3dutf-8"],null);case "raw":return Qo(b);case "url":return Qo(b);default:return null}}
var Us=function Us(a,b){if(Be(a)){var d=X,e=N(a);a=N(O(a));b=Us.g?Us.g(a,b):Us.call(null,a,b);return new V(null,2,5,d,[e,b],null)}if(ze(a))return a;if(qe(a))return new Fb(null,2,[Ol,a,uk,"custom"],null);if(null==a)return Pq(new Fb(null,1,[hn,Dc(Ss)],null));switch(a instanceof K?a.cb:null){case "transit":return Wq.a(b);case "json":return Qq.a?Qq.a(b):Qq.call(null,b);case "text":return Xq.o?Xq.o():Xq.call(null);case "ring":return d=new Fb(null,1,[vl,Xq.o()],null),d=null!=d&&(d.l&64||w===d.T)?zf(Di,
d):d,d=J.g(d,vl),b=null!=d&&(d.l&64||w===d.T)?zf(Di,d):d,d=J.g(b,Ol),e=J.g(b,uk),b=J.g(b,fk),Iq(new Fb(null,3,[Ol,dr(d),uk,["ring/",I.a(e)].join(""),fk,b],null));case "raw":return Xq.o();case "detect":return Pq(new Fb(null,1,[hn,Dc(Ss)],null));default:return null}};function Vs(a,b){return Be(a)?zf($g,kg.g(function(c){return Us(c,b)},a)):Us(a,b)}
var Ws=fg(function(a){return lj(R(["CLJS-AJAX response:",a]))}),Xs=fg(function(a){return"undefined"!==typeof console?console.error(a):"undefined"!==typeof window?window.alert(I.a(a)):lj(R(["CLJS-AJAX ERROR:",a]))});
function Ys(a){var b=null!=a&&(a.l&64||w===a.T)?zf(Di,a):a,c=J.g(b,Ll),d=J.g(b,Im),e=J.g(b,vk),f=B(c)?c:Dc(Ws),h=B(d)?d:Dc(Xs);return function(k,l,m,q,n,r,p){return function(t){var x=S(t,0,null);t=S(t,1,null);x=B(x)?k:l;x.a?x.a(t):x.call(null,t);return qe(p)?p.o?p.o():p.call(null):null}}(f,h,a,b,c,d,e)};g=As.prototype;
g.Vd=function(a,b,c){a=null!=b&&(b.l&64||w===b.T)?zf(Di,b):b;var d=J.g(a,Sl),e=J.g(a,lk),f=J.g(a,Pl),h=J.g(a,kk),k=J.h(a,bk,0),l=J.h(a,bm,!1),m=J.g(a,hn),q=J.g(a,$m),n=Cl.a(m);B(n)&&this.setResponseType(df(n));qe(q)&&(this.setProgressEventsEnabled(!0),es(this,"uploadprogress",q));es(this,"complete",function(){return function(r){r=r.target;return c.a?c.a(r):c.call(null,r)}}(this,"complete",this,this,b,a,d,e,f,h,k,l,m,q));this.setTimeoutInterval(k);this.setWithCredentials(l);this.send(d,e,f,tj(h));
return this};g.Wd=function(){return this.getResponse()};g.Zd=function(){return this.getStatus()};g.$d=function(){return this.getStatusText()};g.Xd=function(){return xj(this.getResponseHeaders(),R([yj,!1]))};g.Yd=function(a,b){return this.getResponseHeader(b)};g.ae=function(){return Dd.g(this.getLastErrorCode(),7)};function Zs(a){a=a.target.readyState;var b=new Fb(null,6,[0,Al,1,Pm,2,jm,3,im,4,an,Uk,!0],null);return b.a?b.a(a):b.call(null,a)}function Cg(a,b){return B(a)?[I.a(a),", ",I.a(b)].join(""):b}function $s(a){return B(a)?Xb(function(b,c){if(B(Za(c)))return b;c=eb(c,": ",2);return Bg(b,c[0],c[1])},If,a.split("\r\n")):If}var at;if(Dd.g("nodejs","nodejs")){var bt=require("xmlhttprequest").XMLHttpRequest;at=global.XMLHttpRequest=bt}else at=XMLHttpRequest;var ct=at;g=ct.prototype;
g.Vd=function(a,b,c){var d=null!=b&&(b.l&64||w===b.T)?zf(Di,b):b,e=J.g(d,Sl),f=J.g(d,lk);a=J.g(d,Pl);var h=J.g(d,kk),k=J.h(d,bk,0),l=J.h(d,bm,!1),m=J.g(d,hn);this.withCredentials=l;this.onreadystatechange=function(q){return function(n){return Dd.g(an,Zs(n))?c.a?c.a(q):c.call(null,q):null}}(this,b,d,e,f,a,h,k,l,m);this.open(f,e,!0);this.timeout=k;b=Cl.a(m);B(b)&&(this.responseType=df(b));b=M(h);h=null;for(e=d=0;;)if(e<d)k=h.P(null,e),f=S(k,0,null),k=S(k,1,null),this.setRequestHeader(f,k),e+=1;else if(b=
M(b))Ce(b)?(d=cd(b),b=dd(b),h=d,d=Q(d)):(d=N(b),h=S(d,0,null),d=S(d,1,null),this.setRequestHeader(h,d),b=O(b),h=null,d=0),e=0;else break;this.send(B(a)?a:"");return this};g.Wd=function(){return this.response};g.Zd=function(){return this.status};g.$d=function(){return this.statusText};g.Xd=function(){return $s(this.getAllResponseHeaders())};g.Yd=function(a,b){return this.getResponseHeader(b)};g.ae=function(){return Dd.g(0,this.readyState)};function dt(a,b){var c=N(b);b=c instanceof K?zf(Di,b):c;a=ne.A(b,Sl,a,R([lk,"GET"]));a=null!=a&&(a.l&64||w===a.T)?zf(Di,a):a;var d=J.g(a,lk);c=J.g(a,vl);b=J.g(a,hn);J.g(a,gn);d=null==J.g(a,Pl)&&Ef(d,"GET");c=B(B(c)?c:d)?Ts(c,a):null;a=ne.A(a,Ll,Ys(a),R([vl,c,hn,Vs(b,a)]));a=Qs(a);a=null!=a&&(a.l&64||w===a.T)?zf(Di,a):a;b=J.g(a,Mk);a=Xb(Rs,a,b);b=Ye(b);c=null!=a&&(a.l&64||w===a.T)?zf(Di,a):a;c=J.g(c,Ll);b=B(c)?Os(c,b):Fo("No ajax handler provided.");c=qm.a(a);c=B(c)?c:new As;return wo(c,a,b)};function et(a){return Xb(function(b,c){var d=S(c,0,null);c=S(c,1,null);return ne.h(b,c,d)},If,a)};var ft=require("xregexp"),gt=["XRegExp"],ht=fa;gt[0]in ht||"undefined"==typeof ht.execScript||ht.execScript("var "+gt[0]);for(var it;gt.length&&(it=gt.shift());)gt.length||void 0===ft?ht=ht[it]&&ht[it]!==Object.prototype[it]?ht[it]:ht[it]={}:ht[it]=ft;var jt={},kt={},lt={},mt=/[\s]/;function nt(a){return null==a?null:","===a?!0:mt.test(a)}function ot(a){return null==a?null:!/[^0-9]/.test(a)}
function pt(a,b){return function e(d){return new ef(null,function(){for(;;){var f=M(d);if(f){if(Ce(f)){var h=cd(f),k=Q(h),l=jf(k);return function(){for(var q=0;;)if(q<k){var n=ic.g(h,q),r=l;if(n instanceof xd||n instanceof K){var p=Ti();var t=p.a?p.a(n):p.call(null,n);p=S(t,0,null);t=S(t,1,null);var x=n instanceof xd?yd:cf;n=null==p?x.g?x.g(a,t):x.call(null,a,t):Dd.g("_",p)?x.a?x.a(t):x.call(null,t):n}r.add(n);q+=1}else return!0}()?lf(l.za(),e(dd(f))):lf(l.za(),null)}var m=N(f);return ce(m instanceof
xd||m instanceof K?function(){var q=Ti();var n=q.a?q.a(m):q.call(null,m);q=S(n,0,null);n=S(n,1,null);var r=m instanceof xd?yd:cf;return null==q?r.g?r.g(a,n):r.call(null,a,n):Dd.g("_",q)?r.a?r.a(n):r.call(null,n):m}():m,e(Bd(f)))}return null}},null,null)}(b)}function qt(a,b){a=parseInt(a,b);return B(isNaN(a))?-1:a};var rt=function rt(a){if(null!=a&&null!=a.sc)return a.sc(a);var c=rt[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=rt._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("Reader.read-char",a);},st=function st(a){if(null!=a&&null!=a.ed)return a.ed(a);var c=st[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=st._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("Reader.peek-char",a);},tt=function tt(a,b){if(null!=a&&null!=a.We)return a.We(a,b);var d=tt[la(null==
a?null:a)];if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);d=tt._;if(null!=d)return d.g?d.g(a,b):d.call(null,a,b);throw Sb("IPushbackReader.unread",a);},ut=function ut(a){if(null!=a&&null!=a.Ff)return a.Ff(a);var c=ut[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=ut._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("IndexingReader.get-line-number",a);},vt=function vt(a){if(null!=a&&null!=a.Df)return a.Df(a);var c=vt[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,
a);c=vt._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("IndexingReader.get-column-number",a);},wt=function wt(a){if(null!=a&&null!=a.Ef)return a.Ef(a);var c=wt[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=wt._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("IndexingReader.get-file-name",a);};function xt(a,b){this.X=a;this.hf=b;this.Oc=0}xt.prototype.sc=function(){if(this.hf>this.Oc){var a=this.X.charAt(this.Oc);this.Oc+=1;return a}return null};
xt.prototype.ed=function(){return this.hf>this.Oc?this.X.charAt(this.Oc):null};function yt(a,b){this.ef=a;this.da=b;this.Eb=this.be=1}yt.prototype.sc=function(){var a=this.Eb<this.be?this.da[this.Eb]:this.ef.sc(null);this.Eb<this.be&&(this.Eb+=1);return null==a?null:Te(a)};yt.prototype.ed=function(){var a=this.Eb<this.be?this.da[this.Eb]:this.ef.ed(null);return null==a?null:Te(a)};
yt.prototype.We=function(a,b){if(B(b)){if(0===this.Eb)throw Error("Pushback buffer is full");--this.Eb;return this.da[this.Eb]=b}return null};function zt(a){return null!=a?w===a.sg?!0:!1:!1};var At={};function Bt(a,b,c,d){var e=Q(b);a=B(a)?0:10<e?10:e;b=kg.g(cg(Vj,!0),lg(a,b));b=zf(I,mg(1,pg.g(new og(null,-1," ",null,null),b)));e=a<e?"...":null;return[I.a(c),I.a(b),e,I.a(d)].join("")}function Rj(a,b){return null==b?rm:"string"===typeof b?mk:b instanceof K?cl:"number"===typeof b?cl:b instanceof xd?cl:Be(b)?rl:We(b)?zm:ze(b)?Nl:xe(b)?$k:Dd.g(b,!0)?cl:Dd.g(b,!1)?cl:Rb(b)}
if("undefined"===typeof wb||"undefined"===typeof jt||"undefined"===typeof kt||"undefined"===typeof lt||"undefined"===typeof At||"undefined"===typeof Vj){var Vj,Nj=fg(If),Oj=fg(If),Pj=fg(If),Qj=fg(If),Mj=J.h(If,Xk,Aj.o?Aj.o():Aj.call(null));Vj=new Lj}Uj(mk,function(a,b){a=B(a)?5:20;var c=b.length>a?'..."':'"',d=b.length;return['"',I.a(b.substring(0,a<d?a:d)),c].join("")});Uj(cl,function(a,b){return I.a(b)});Uj(Ad,function(){return"\x3cindexed seq\x3e"});Uj(th,function(){return"\x3cmap seq\x3e"});
Uj(Yh,function(){return"\x3cmap seq\x3e"});Uj($e,function(){return"\x3ccons\x3e"});Uj(ef,function(){return"\x3clazy seq\x3e"});Uj(rm,function(){return"nil"});Uj(zm,function(a,b){return Bt(a,b,"(",")")});Uj(Nl,function(a,b){var c=Q(b),d=B(a)?0:c;b=zf(qf,lg(d,b));return Bt(a,b,"{",c>d?"...}":"}")});Uj($k,function(a,b){return Bt(a,b,"#{","}")});Uj(rl,function(a,b){return Bt(a,b,"[","]")});Uj(Sj,function(a,b){return jj(R([Rb(b)]),Eb())});function Ct(a){return Vj.g?Vj.g(!1,a):Vj.call(null,!1,a)};function Dt(a,b,c){b=new Fb(null,2,[Cl,vm,cm,b],null);a=zt(a)?ne.A(b,Jm,wt(a),R([ck,ut(a),Vl,vt(a)])):b;var d=Jm.a(a);b=ck.a(a);var e=Vl.a(a);d=B(d)?[I.a(d)," "].join(""):null;b=B(b)?["[line ",I.a(b),", col ",I.a(e),"]"].join(""):null;c=Cf(I,d,b,B(B(d)?d:b)?" ":null,c);throw new Wj(c,a,null);}function Et(a,b){return Dt(a,Dl,R([zf(I,b)]))}function Ft(a,b){return Dt(a,Nk,R([zf(I,b)]))}function Gt(a,b){return Dt(a,xl,R([zf(I,b)]))}
function Ht(a,b,c,d){Et(a,R(["The map literal starting with ",Ct(N(d)),B(b)?[" on line ",I.a(b)," column ",I.a(c)].join(""):null," contains ",Q(d)," form(s). Map literals must contain an even number of forms."]))}function It(a,b,c){return Et(a,R(["Invalid ",df(b),": ",c,"."]))}function Jt(a,b,c){return Et(a,R(["Invalid character: ",c," found while reading ",df(b),"."]))}
function Kt(a,b){a:{var c=mk instanceof K?mk.cb:null;switch(c){case "regex":c='#"';break a;case "string":c='"';break a;default:throw Error(["No matching clause: ",I.a(c)].join(""));}}return Gt(a,R(["Unexpected EOF reading ",df(mk)," starting ",Af(I,c,b),"."]))}function Lt(a,b){return Ft(a,R(["Invalid digit ",b," in unicode character."]))}function Mt(a){return Et(a,R(["Octal escape sequence must be in range [0, 377]."]))}
function Nt(a,b){b=function(c){return function f(e){return new ef(null,function(){for(var h=e;;)if(h=M(h)){if(Ce(h)){var k=cd(h),l=Q(k),m=jf(l);a:for(var q=0;;)if(q<l){var n=ic.g(k,q),r=S(n,0,null);1<S(n,1,null)&&m.add(r);q+=1}else{k=!0;break a}return k?lf(m.za(),f(dd(h))):lf(m.za(),null)}m=N(h);k=S(m,0,null);if(1<S(m,1,null))return ce(k,f(Bd(h)));h=Bd(h)}else return null},null,null)}(Si(c))}(b);return Cf(I,a,1<Q(b)?"s":null,": ",mg(1,pg.g(new og(null,-1,", ",null,null),b)))}
function Ot(a,b,c){Et(a,R([Nt([I.a(db(df(b)))," literal contains duplicate key"].join(""),c)]))};function Pt(a){for(var b=a.sc(null);;)if(nt.a?nt.a(b):nt.call(null,b))b=a.sc(null);else return b}var Qt=/^([-+]?)(?:(0)|([1-9][0-9]*)|0[xX]([0-9A-Fa-f]+)|0([0-7]+)|([1-9][0-9]?)[rR]([0-9A-Za-z]+)|0[0-9]+)(N)?$/,Rt=/([-+]?[0-9]+)\/([0-9]+)/,St=/([-+]?[0-9]+(\.[0-9]*)?([eE][-+]?[0-9]+)?)(M)?/;function Tt(a,b){a=Wi(a,b);return S(a,0,null)===b}
function Ut(a){if(Tt(Qt,a)){var b=Wg(Wi(Qt,a));if(null!=(b.a?b.a(2):b.call(null,2)))a=0;else{a="-"===(b.a?b.a(1):b.call(null,1));b=null!=(b.a?b.a(3):b.call(null,3))?new V(null,2,5,X,[b.a?b.a(3):b.call(null,3),10],null):null!=(b.a?b.a(4):b.call(null,4))?new V(null,2,5,X,[b.a?b.a(4):b.call(null,4),16],null):null!=(b.a?b.a(5):b.call(null,5))?new V(null,2,5,X,[b.a?b.a(5):b.call(null,5),8],null):null!=(b.a?b.a(7):b.call(null,7))?new V(null,2,5,X,[b.a?b.a(7):b.call(null,7),parseInt(b.a?b.a(6):b.call(null,
6))],null):new V(null,2,5,X,[null,null],null);var c=b.a?b.a(0):b.call(null,0);null==c?a=null:(b=parseInt(c,b.a?b.a(1):b.call(null,1)),a=a?-1*b:b,a=B(isNaN(a))?null:a)}}else Tt(St,a)?(b=Wg(Wi(St,a)),a=null!=(b.a?b.a(4):b.call(null,4))?parseFloat(b.a?b.a(1):b.call(null,1)):parseFloat(a)):Tt(Rt,a)?(b=Wg(Wi(Rt,a)),a=b.a?b.a(1):b.call(null,1),b=b.a?b.a(2):b.call(null,2),a=B(Wi(/^\+/,a))?a.substring(1):a,a=parseInt(a)/parseInt(b)):a=null;return a}
function Vt(a){if(""===a||!0===/:$/.test(a)||!0===/^::/.test(a))return null;var b=a.indexOf("/"),c=0<b?a.substring(0,b):null;if(null!=c){b+=1;if(b===Q(a))return null;a=a.substring(b);return ot(Xd(a,0))||""===a||!1!==/:$/.test(c)||"/"!==a&&-1!==a.indexOf("/")?null:new V(null,2,5,X,[c,a],null)}return"/"===a||-1===a.indexOf("/")?new V(null,2,5,X,[null,a],null):null}
var Wt=function Wt(a){for(var c=[],d=arguments.length,e=0;;)if(e<d)c.push(arguments[e]),e+=1;else break;return Wt.A(arguments[0],1<c.length?new Ad(c.slice(1),0,null):null)};Wt.A=function(a){for(;;){var b=a.sc(null);if("\n"===b||"\n"===b||null==b)break}return a};Wt.O=1;Wt.R=function(a){var b=N(a);a=O(a);return this.A(b,a)};
function Xt(){return function(){function a(c,d){var e=null;if(1<arguments.length){e=0;for(var f=Array(arguments.length-1);e<f.length;)f[e]=arguments[e+1],++e;e=new Ad(f,0,null)}return b.call(this,c,e)}function b(c){return Et(c,R(["Unreadable form"]))}a.O=1;a.R=function(c){var d=N(c);c=Bd(c);return b(d,c)};a.A=b;return a}()};new vb;if("undefined"===typeof wb||"undefined"===typeof jt||"undefined"===typeof kt||"undefined"===typeof Yt)var Yt={};if("undefined"===typeof wb||"undefined"===typeof jt||"undefined"===typeof kt||"undefined"===typeof Zt)var Zt={};if("undefined"===typeof wb||"undefined"===typeof jt||"undefined"===typeof kt||"undefined"===typeof $t)var $t={};function au(a){var b="#"!==a;return b&&(b="'"!==a)?(b=":"!==a)?bu.a?bu.a(a):bu.call(null,a):b:b}function cu(a){return"@"===a||"`"===a||"~"===a}function du(a,b,c,d){if(Ob(c))return Gt(a,R(["Unexpected EOF while reading start of ",df(b),"."]));if(B(B(d)?cu(c):d))return Jt(a,b,c);d=new vb;for(tt(a,c);;){if(nt(c)||au(c)||null==c)return I.a(d);if(cu(c))return Jt(a,b,c);d.append(rt(a));c=st(a)}}
function eu(a,b,c){b=rt(a);if(B(b)){var d=fu.a?fu.a(b):fu.call(null,b);if(B(d))return d.h?d.h(a,b,c):d.call(null,a,b,c);tt(a,b);c=gu.h?gu.h(a,b,c):gu.call(null,a,b,c);return B(c)?c:Et(a,R(["No dispatch macro for ",b,"."]))}return Gt(a,R(["Unexpected EOF while reading dispatch character."]))}function hu(a,b){return Et(a,R(["Unmatched delimiter ",b,"."]))}
function iu(a,b,c){b=1+b;if(Q(a)!==b)throw Ft(null,R(["Invalid unicode literal: \\",a,"."]));for(var d=1,e=0;;){if(d===b)return String.fromCharCode(e);var f=qt(Xd(a,d),c);if(-1===f)return c=Xd(a,d),Ft(null,R(["Invalid digit ",c," in unicode character \\",a,"."]));e=f+e*c;d+=1}}
function ju(a,b,c,d,e){for(var f=1,h=qt(b,c);;){if(-1===h)return Lt(a,b);if(f!==d){var k=st(a);var l=nt(k);l||(l=bu.a?bu.a(k):bu.call(null,k),l=B(l)?l:null==k);if(B(l))return B(e)?Ft(a,R(["Invalid unicode literal. Unicode literals should be ",d,"characters long.  ","value suppled is ",f,"characters long."])):String.fromCharCode(h);l=qt(k,c);rt(a);if(-1===l)return Lt(a,k);h=l+h*c;f+=1}else return String.fromCharCode(h)}}
function ku(a){var b=rt(a);if(null!=b){b=au(b)||cu(b)||nt(b)?I.a(b):du(a,Rk,b,!1);var c=Q(b);if(1===c)return Xd(b,0);if("newline"===b)return"\n";if("space"===b)return" ";if("tab"===b)return"\t";if("backspace"===b)return"\b";if("formfeed"===b)return"\f";if("return"===b)return"\r";if(B(0==b.lastIndexOf("u",0)))return b=iu(b,4,16),c=b.charCodeAt(),55295<c&&57344>c?(b=c.toString(16),a=Et(a,R(["Invalid character literal \\u",b,"."]))):a=b,a;if(B(0==b.lastIndexOf("o",0))){--c;if(3<c)return Et(a,R(["Invalid octal escape sequence in a character literal:",
b,". Octal escape sequences must be 3 or fewer digits."]));b=iu(b,c,8);return 255<(b|0)?Mt(a):b}return Et(a,R(["Unsupported character: ",b,"."]))}return Gt(a,R(["Unexpected EOF while reading character."]))}function lu(a){return zt(a)?new V(null,2,5,X,[ut(a),(vt(a)|0)-1|0],null):null}
function mu(a,b,c,d){var e=lu(c),f=S(e,0,null);e=S(e,1,null);b=null==b?null:Te(b);for(var h=Yc(je);;){var k=Pt(c);if(!B(k)){var l=a,m=f,q=e,n=Q(h);Gt(c,R(["Unexpected EOF while reading ",B(n)?["item ",I.a(n)," of "].join(""):null,df(l),B(m)?[", starting at line ",I.a(m)," and column ",I.a(q)].join(""):null,"."]))}if(Dd.g(b,null==k?null:Te(k)))return $c(h);l=bu.a?bu.a(k):bu.call(null,k);B(l)?(k=l.h?l.h(c,k,d):l.call(null,c,k,d),h=k!==c?rf.g(h,k):h):(tt(c,k),k=nu?nu(c,!0,null,d):ou.call(null,c,!0,null,
d),h=k!==c?rf.g(h,k):h)}}function pu(a,b,c){a=mu(zm,")",a,c);return ve(a)?Cd:zf(Ze,a)}function qu(a,b,c){return mu(rl,"]",a,c)}function ru(a,b,c){var d=lu(a);b=S(d,0,null);d=S(d,1,null);c=mu(Nl,"}",a,c);var e=Q(c),f=Ri(2,c),h=Ki(f);!Zf(e)&&Ht(a,b,d,c);Dd.g(Q(h),Q(f))||Ot(a,Nl,f);if(e<=2*yh)a=Ah(nf(c));else a:for(a=nf(c),b=a.length,d=0,e=Yc(zh);;)if(d<b)c=d+2,e=ad(e,a[d],a[d+1]),d=c;else{a=$c(e);break a}return a}
function su(a,b){for(var c=function(){var h=new vb;h.append(b);return h}(),d=rt(a);;){if(B(function(){var h=nt(d);if(h)return h;h=bu.a?bu.a(d):bu.call(null,d);return B(h)?h:null==d}())){var e=I.a(c);tt(a,d);var f=Ut(e);return B(f)?f:Et(a,R(["Invalid number: ",e,"."]))}e=function(){var h=c;h.append(d);return h}();f=rt(a);c=e;d=f}}
function tu(a){var b=rt(a);switch(b){case "t":return"\t";case "r":return"\r";case "n":return"\n";case "\\":return"\\";case '"':return'"';case "b":return"\b";case "f":return"\f";case "u":return b=rt(a),-1===parseInt(b|0,16)?Et(a,R(["Invalid unicode escape: \\u",b,"."])):ju(a,b,16,4,!0);default:return ot(b)?(b=ju(a,b,8,3,!1),255<(b|0)?Mt(a):b):Et(a,R(["Unsupported escape character: \\",b,"."]))}}
function uu(a){for(var b=new vb,c=rt(a);;){var d=c;if(Dd.g(null,d))return Kt(a,R(['"',b]));if(Dd.g("\\",d)){d=function(){var f=b;f.append(tu(a));return f}();var e=rt(a);b=d;c=e}else{if(Dd.g('"',d))return I.a(b);d=function(){var f=b;f.append(c);return f}();e=rt(a);b=d;c=e}}}
function vu(a,b){b=du(a,el,b,!0);if(B(b))switch(b){case "nil":return null;case "true":return!0;case "false":return!1;case "/":return Jk;default:var c=Vt(b);c=B(c)?yd.g(c.a?c.a(0):c.call(null,0),c.a?c.a(1):c.call(null,1)):null;return B(c)?c:It(a,el,b)}else return null}
function wu(a){var b=rt(a);if(nt(b))return Et(a,R(["A single colon is not a valid keyword."]));b=du(a,fn,b,!0);var c=Vt(b);if(B(B(c)?-1===b.indexOf("::"):c)){var d=c.a?c.a(0):c.call(null,0);c=c.a?c.a(1):c.call(null,1);return":"===Xd(b,0)?It(a,fn,b):cf.g(d,c)}return It(a,fn,b)}
function xu(a,b,c){b=nu?nu(a,!0,null,c):ou.call(null,a,!0,null,c);b=b instanceof K?oe([b,!0]):b instanceof xd?new Fb(null,1,[tk,b],null):"string"===typeof b?new Fb(null,1,[tk,b],null):b;ze(b)||Et(a,R(["Metadata cannot be ",Ct(b),". Metadata must be a Symbol, Keyword, String or Map."]));c=nu?nu(a,!0,null,c):ou.call(null,a,!0,null,c);return null!=c&&(c.l&131072||w===c.Qe)?te(c,Fi.A(R([ue(c),b]))):Et(a,R(["Metadata can not be applied to ",Ct(c),". ","Metadata can only be applied to IMetas."]))}
function yu(a,b,c){b=mu($k,"}",a,c);c=Ki(b);Dd.g(Q(b),Q(c))||Ot(a,$k,b);return c}function zu(a){nu?nu(a,!0,null,!0):ou.call(null,a,!0,null,!0);return a}
function Au(a,b,c){b=rt(a);b=du(a,pk,b,!0);var d=null==b?null:Vt(b);if(null==d)var e=null;else e=S(d,0,null),d=S(d,1,null),e=B(e)?null:d;return B(e)?"{"===Pt(a)?(c=mu(pk,"}",a,c),!Zf(Q(c))&&Ht(a,null,null,c),b=pt(I.a(e),Ri(2,c)),c=Ri(2,Bd(c)),Dd.g(Q(Ki(b)),Q(b))||Ot(a,pk,b),Mi(b,c)):Et(a,R(["Namespaced map with namespace ",b," does not specify a map."])):Et(a,R(["Invalid value used as namespace in namespaced map: ",b,"."]))}
function Bu(a,b,c){b=nu?nu(a,!0,null,c):ou.call(null,a,!0,null,c);return Dd.g(dn,b)?Number.NaN:Dd.g(hm,b)?Number.NEGATIVE_INFINITY:Dd.g(om,b)?Number.POSITIVE_INFINITY:Et(a,R([["Invalid token: ##",I.a(b)].join("")]))}function bu(a){switch(a){case '"':return uu;case ":":return wu;case ";":return Wt;case "^":return xu;case "(":return pu;case ")":return hu;case "[":return qu;case "]":return hu;case "{":return ru;case "}":return hu;case "\\":return ku;case "#":return eu;default:return null}}
function fu(a){switch(a){case "^":return xu;case "{":return yu;case "\x3c":return Xt();case "!":return Wt;case "_":return zu;case ":":return Au;case "#":return Bu;default:return null}}
function gu(a,b,c){b=nu?nu(a,!0,null,c):ou.call(null,a,!0,null,c);var d=nu?nu(a,!0,null,c):ou.call(null,a,!0,null,c);b instanceof xd||Et(a,R(["Invalid reader tag: ",Ct("Reader tag must be a symbol"),". Reader tags must be symbols."]));var e=J.g(ak.a(c),b);e=B(e)?e:If.a?If.a(b):If.call(null,b);if(B(e))return e.a?e.a(d):e.call(null,d);c=Sj.a(c);return B(c)?c.g?c.g(b,d):c.call(null,b,d):Et(a,R(["No reader function for tag ",Ct(b),"."]))}
function ou(a){switch(arguments.length){case 1:return Cu(If,arguments[0]);case 2:return Cu(arguments[0],arguments[1]);case 4:return nu(arguments[0],arguments[1],arguments[2],arguments[3]);default:throw Error(["Invalid arity: ",I.a(arguments.length)].join(""));}}function Cu(a,b){a=null!=a&&(a.l&64||w===a.T)?zf(Di,a):a;var c=J.g(a,xl),d=!Je(a,xl);return nu(b,d,c,a)}
function nu(a,b,c,d){try{for(;;){var e=rt(a);if(!nt(e)){if(null==e){if(B(b)){b=a;var f=B(null)?Gt(b,R(["EOF while reading, starting at line ",null,"."])):Gt(b,R(["EOF while reading."]))}else f=c;return f}if(ot(e)||("+"===e||"-"===e)&&ot(a.ed(null)))return su(a,e);var h=bu(e);if(B(h)){var k=h.h?h.h(a,e,d):h.call(null,a,e,d);if(k!==a)return k}else return vu(a,e)}}}catch(l){if(l instanceof Error){f=l;if(f instanceof Wj){b=f instanceof Wj?f.data:null;if(Dd.g(vm,Cl.a(b)))throw f;a=Fi.A(R([new Fb(null,
1,[Cl,vm],null),b,zt(a)?new Fb(null,3,[ck,ut(a),Bm,vt(a),Jm,wt(a)],null):null]));throw new Wj(f.message,a,f);}a=Fi.A(R([new Fb(null,1,[Cl,vm],null),zt(a)?new Fb(null,3,[ck,ut(a),Bm,vt(a),Jm,wt(a)],null):null]));throw new Wj(f.message,a,f);}throw l;}};var Du=function(a,b){return function(c,d){return J.g(B(d)?b:a,c)}}(new V(null,13,5,X,[null,31,28,31,30,31,30,31,31,30,31,30,31],null),new V(null,13,5,X,[null,31,29,31,30,31,30,31,31,30,31,30,31],null)),Eu=/(\d\d\d\d)(?:-(\d\d)(?:-(\d\d)(?:[T](\d\d)(?::(\d\d)(?::(\d\d)(?:[.](\d+))?)?)?)?)?)?(?:[Z]|([-+])(\d\d):(\d\d))?/;function Fu(a){a=parseInt(a,10);return Ob(isNaN(a))?a:null}
function Gu(a,b,c,d){if(!(a<=b&&b<=c))throw Error([I.a(d)," Failed:  ",I.a(a),"\x3c\x3d",I.a(b),"\x3c\x3d",I.a(c)].join(""));return b}
function Hu(a){var b=Vi(Eu,a);S(b,0,null);var c=S(b,1,null),d=S(b,2,null),e=S(b,3,null),f=S(b,4,null),h=S(b,5,null),k=S(b,6,null),l=S(b,7,null),m=S(b,8,null),q=S(b,9,null),n=S(b,10,null);if(Ob(b))throw Error(["Unrecognized date/time syntax: ",I.a(a)].join(""));var r=Fu(c),p=function(){var v=Fu(d);return B(v)?v:1}();a=function(){var v=Fu(e);return B(v)?v:1}();b=function(){var v=Fu(f);return B(v)?v:0}();c=function(){var v=Fu(h);return B(v)?v:0}();var t=function(){var v=Fu(k);return B(v)?v:0}(),x=function(){a:if(Dd.g(3,
Q(l)))var v=l;else if(3<Q(l))v=l.substring(0,3);else for(v=new vb(l);;)if(3>v.getLength())v=v.append("0");else{v=v.toString();break a}v=Fu(v);return B(v)?v:0}();m=(Dd.g(m,"-")?-1:1)*(60*function(){var v=Fu(q);return B(v)?v:0}()+function(){var v=Fu(n);return B(v)?v:0}());return new V(null,8,5,X,[r,Gu(1,p,12,"timestamp month field must be in range 1..12"),Gu(1,a,function(){var v=0===(r%4+4)%4&&(0!==(r%100+100)%100||0===(r%400+400)%400);return Du.g?Du.g(p,v):Du.call(null,p,v)}(),"timestamp day field must be in range 1..last day in month"),
Gu(0,b,23,"timestamp hour field must be in range 0..23"),Gu(0,c,59,"timestamp minute field must be in range 0..59"),Gu(0,t,Dd.g(c,59)?60:59,"timestamp second field must be in range 0..60"),Gu(0,x,999,"timestamp millisecond field must be in range 0..999"),m],null)}
var Iu=fg(null),Ju=fg(Fi.A(R([new Fb(null,4,[am,function(a){if("string"===typeof a){var b=Hu(a);if(B(b)){a=S(b,0,null);var c=S(b,1,null),d=S(b,2,null),e=S(b,3,null),f=S(b,4,null),h=S(b,5,null),k=S(b,6,null);b=S(b,7,null);b=new Date(Date.UTC(a,c-1,d,e,f,h,k)-6E4*b)}else throw Error(["Unrecognized date/time syntax: ",I.a(a)].join(""));return b}throw Error("Instance literal expects a string for its timestamp.");},cn,function(a){if("string"===typeof a)return new li(a.toLowerCase(),null);throw Error("UUID literal expects a string as its representation.");
},en,function(a){if(Be(a))return ug.g(lh,a);throw Error("Queue literal expects a vector for its elements.");},zl,function(a){if(Be(a)){var b=[];a=M(a);for(var c=null,d=0,e=0;;)if(e<d){var f=c.P(null,e);b.push(f);e+=1}else if(a=M(a))c=a,Ce(c)?(a=cd(c),e=dd(c),c=a,d=Q(a),a=e):(a=N(c),b.push(a),a=O(c),c=null,d=0),e=0;else break;return b}if(ze(a)){b={};a=M(a);c=null;for(e=d=0;;)if(e<d){var h=c.P(null,e);f=S(h,0,null);h=S(h,1,null);var k=b;f=df(f);k[f]=h;e+=1}else if(a=M(a))Ce(a)?(d=cd(a),a=dd(a),c=d,
d=Q(d)):(d=N(a),c=S(d,0,null),d=S(d,1,null),e=b,c=df(c),e[c]=d,a=O(a),c=null,d=0),e=0;else break;return b}throw Error("JS literal expects a vector or map containing only string or unqualified keyword keys");}],null),If])));
function Ku(a){var b=new Fb(null,3,[ak,Dc(Ju),Sj,Dc(Iu),xl,null],null);if(B(B(a)?Ef(a,""):a)){a=new xt(a,Q(a));a:{var c=Array(1);if(Fe(null))for(var d=0,e=M(null);;)if(e&&1>d)c[d]=N(e),d+=1,e=O(e);else break a;else for(d=0;;)if(1>d)c[d]=null,d+=1;else break}b=Cu(b,new yt(a,c))}else b=null;return b};function Lu(a){if("string"===typeof a){if(null==a)return!1;if(B(0===Q(".0000")))return!0;var b=Q(a)-Q(".0000");return 0<=b&&Dd.g(a.indexOf(".0000",b),b)}return null}function Mu(a){return"string"===typeof a?Ge(Vi(/^[+-]?([0-9]*\.?[0-9]+|[0-9]+\.?[0-9]*)([eE][+-]?[0-9]+)?$/,a)):null}function Nu(a){if(B(Lu(a))){var b=Q(a)-Q(".0000".toString());a="string"===typeof a?a.slice(0,b):null}return a}
function Ou(a,b,c){var d=b.flags;var e="string"===typeof d?-1!=d.indexOf("g"):null;d=B(e)?d:[I.a(d),"g"].join("");return a.replace(new RegExp(b.source,d),c)}
function Pu(a,b,c){if("string"===typeof a)if("string"===typeof b)if("string"===typeof b)a=a.replace(new RegExp(String(b).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g,"\\$1").replace(/\x08/g,"\\x08"),"g"),c);else if(b instanceof RegExp)a="string"===typeof c?to(a,b,c):to(a,b,uo(c));else throw["Invalid match arg: ",I.a(b)].join("");else a=b instanceof RegExp?"string"===typeof c?Ou(a,b,c):Ou(a,b,uo(c)):null;else a=null;return a}function Qu(a,b){return zf(I,mg(1,pg.g(new og(null,-1,a,null,null),b)))}
Mi("ąàáäâãåæăćčĉęèéëêĝĥìíïîĵłľńňòóöőôõðøśșšŝťțŭùúüűûñÿýçżźž","aaaaaaaaaccceeeeeghiiiijllnnoooooooossssttuuuuuunyyczzz");function Ru(a){return null==a?NaN:B(Mu(a))?Ku(a):NaN};var Su=Error;function Tu(a,b){return Pe(function(c,d,e){return ne.h(c,a.a?a.a(d):a.call(null,d),e)},If,b)}function Uu(a,b){return Pe(function(c,d,e){return ne.h(c,d,a.a?a.a(e):a.call(null,e))},If,b)}function Vu(a){return Pu(a,/-_|_|!|-/,new Fb(null,4,"-_; (;_;);!;/;-; ".split(";"),null))}function Wu(a){return Pu(a,/ \(|\)|\/| /,new Fb(null,4," (;-_;);_;/;!; ;-".split(";"),null))}function Xu(a){if(a instanceof Su)throw a;return a}
function Yu(a,b,c,d,e){return function(){function f(l,m,q,n){return go(l,function(r){if(Dd.g(r,Dc(c))&&!ve(Dc(e)))return mj(R([["Unsuccessful ",I.a(b)," request."].join("")])),jo(q,Dc(e)),gg(e,If);if(Dd.g(r,Dc(c))&&ve(Dc(e)))return null==n&&(mj(R([["Getting ",I.a(b)," data from cache:"].join("")])),mj(R([r]))),jo(m,Dc(d));null==n&&(mj(R([["Getting ",I.a(b)," data from source:"].join("")])),mj(R([r])));var p=new Fb(null,1,[Im,function(x){var v=null!=x&&(x.l&64||w===x.T)?zf(Di,x):x;x=J.g(v,sk);v=J.g(v,
ok);mj(R([["Unsuccessful: ",I.a(b)," request"].join("")]));gg(c,r);return jo(q,gg(e,["STATUS: ",I.a(x)," ",I.a(v)," for: ",I.a(r)].join("")))}],null),t=a instanceof K?a.cb:null;switch(t){case "json":return p=Fi.A(R([p,new Fb(null,3,[hn,sm,tl,!0,Ll,function(){return function(x){gg(e,If);gg(c,r);return jo(m,gg(d,x))}}(a,t,p)],null)])),dt(r,R([p]));case "edn":return p=Fi.A(R([p,new Fb(null,1,[Ll,function(){return function(x){gg(e,If);gg(c,r);return jo(m,gg(d,Ku(x)))}}(a,t,p)],null)])),dt(r,R([p]));case "raw":return p=
Fi.A(R([p,new Fb(null,1,[Ll,function(){return function(x){gg(e,If);gg(c,r);return jo(m,gg(d,x))}}(a,t,p)],null)])),dt(r,R([p]));default:throw Error(["No matching clause: ",I.a(t)].join(""));}})}function h(l,m,q){var n=Yu.ca?Yu.ca(a,b,c,d,e):Yu.call(null,a,b,c,d,e);return n.J?n.J(l,m,q,null):n.call(null,l,m,q,null)}var k=null;k=function(l,m,q,n){switch(arguments.length){case 3:return h.call(this,l,m,q);case 4:return f.call(this,l,m,q,n)}throw Error("Invalid arity: "+arguments.length);};k.h=h;k.J=f;
return k}()}function Zu(a){if(Dd.g(Rb(a),Fb)){var b=null!=a&&(a.l&64||w===a.T)?zf(Di,a):a;b=J.g(b,Ck);return Fi.A(R([a,new Fb(null,1,[Ck,I.a(b)],null)]))}a=xj(a,R([yj,!1]));var c=null!=a&&(a.l&64||w===a.T)?zf(Di,a):a,d=J.g(c,"geoHierarchy");b=J.g(c,"vintage");return Eq(Fi.A(R([c,new Fb(null,2,["geoHierarchy",Tu(function(){return function(e){return Wu(e)}}(a,c,c,d,b),d),"vintage",I.a(b)],null)])))}
function $u(a){var b=null!=a&&(a.l&64||w===a.T)?zf(Di,a):a,c=J.g(b,Qm);a=Tu(function(){return function(d){return Vu(df(d))}}(a,b,b,c),c);return tj(Fi.A(R([b,new Fb(null,1,[Qm,a],null)])))}
function av(a){return function(b){return function(){function c(h,k){return a.h?a.h(b,h,k):a.call(null,b,h,k)}function d(h){return b.a?b.a(h):b.call(null,h)}function e(){return b.o?b.o():b.call(null)}var f=null;f=function(h,k){switch(arguments.length){case 0:return e.call(this);case 1:return d.call(this,h);case 2:return c.call(this,h,k)}throw Error("Invalid arity: "+arguments.length);};f.o=e;f.a=d;f.g=c;return f}()}}
function bv(a){return function(b){return function(c){return function(){function d(k,l){return a.J?a.J(c,b,k,l):a.call(null,c,b,k,l)}function e(k){return b.a?b.a(k):b.call(null,k)}function f(){return b.o?b.o():b.call(null)}var h=null;h=function(k,l){switch(arguments.length){case 0:return f.call(this);case 1:return e.call(this,k);case 2:return d.call(this,k,l)}throw Error("Invalid arity: "+arguments.length);};h.o=f;h.a=e;h.g=d;return h}()}(new ig(null))}}
function cv(a){return function(b){return function(){function c(h,k){k=qj(R([a,k]));return b.g?b.g(h,k):b.call(null,h,k)}function d(h){return b.a?b.a(h):b.call(null,h)}function e(){return b.o?b.o():b.call(null)}var f=null;f=function(h,k){switch(arguments.length){case 0:return e.call(this);case 1:return d.call(this,h);case 2:return c.call(this,h,k)}throw Error("Invalid arity: "+arguments.length);};f.o=e;f.a=d;f.g=c;return f}()}}
function dv(a,b){var c=ev,d=S(a,0,null),e=S(a,1,null);return Pe(function(f,h,k,l){return function(m,q,n){return B(Yf(function(){return function(r){return Dd.g(q,r)}}(f,h,k,l),f))?ie.g(m,c.a?c.a(n):c.call(null,n)):ie.g(m,n)}}(e<=d?Cd:new mi(null,d,e,1,null,null,null),a,d,e),je,b)};function fv(a,b,c,d,e,f){this.value=a;this.left=b;this.right=c;this.ga=d;this.M=e;this.C=f;this.l=2230716170;this.I=139264}g=fv.prototype;g.V=function(a,b){return this.K(null,b,null)};g.K=function(a,b,c){switch(b instanceof K?b.cb:null){case "value":return this.value;case "left":return this.left;case "right":return this.right;default:return J.h(this.M,b,c)}};
g.yb=function(a,b,c){return Xb(function(){return function(d,e){var f=S(e,0,null);e=S(e,1,null);return b.h?b.h(d,f,e):b.call(null,d,f,e)}}(this),c,this)};g.W=function(a,b,c){return Xi(b,function(){return function(d){return Xi(b,ej,""," ","",c,d)}}(this),"#linked.map.Node{",", ","}",c,qf.g(new V(null,3,5,X,[new V(null,2,5,X,[jl,this.value],null),new V(null,2,5,X,[ek,this.left],null),new V(null,2,5,X,[Ql,this.right],null)],null),this.M))};
g.Ka=function(){return new ph(this,3,new V(null,3,5,X,[jl,ek,Ql],null),B(this.M)?kd(this.M):Gf())};g.S=function(){return this.ga};g.Ga=function(){return new fv(this.value,this.left,this.right,this.ga,this.M,this.C)};g.Z=function(){return 3+Q(this.M)};g.Y=function(){var a=this,b=this.C;if(null!=b)return b;var c=function(){return function(){return function(d){return-1739253980^Id(d)}}(b,a)(a)}();return this.C=c};
g.H=function(a,b){return null!=b&&this.constructor===b.constructor&&Dd.g(this.value,b.value)&&Dd.g(this.left,b.left)&&Dd.g(this.right,b.right)&&Dd.g(this.M,b.M)};g.Tb=function(a,b){return Je(new hi(null,new Fb(null,3,[jl,null,Ql,null,ek,null],null),null),b)?pe.g(Gc(ug.g(If,this),this.ga),b):new fv(this.value,this.left,this.right,this.ga,Ff(pe.g(this.M,b)),null)};
g.Aa=function(a,b,c){return B(af.g?af.g(jl,b):af.call(null,jl,b))?new fv(c,this.left,this.right,this.ga,this.M,null):B(af.g?af.g(ek,b):af.call(null,ek,b))?new fv(this.value,c,this.right,this.ga,this.M,null):B(af.g?af.g(Ql,b):af.call(null,Ql,b))?new fv(this.value,this.left,c,this.ga,this.M,null):new fv(this.value,this.left,this.right,this.ga,ne.h(this.M,b,c),null)};
g.aa=function(){return M(qf.g(new V(null,3,5,X,[new Le(jl,this.value,null),new Le(ek,this.left,null),new Le(Ql,this.right,null)],null),this.M))};g.U=function(a,b){return new fv(this.value,this.left,this.right,b,this.M,this.C)};g.ea=function(a,b){return Be(b)?this.Aa(null,ic.g(b,0),ic.g(b,1)):Xb(gc,this,b)};function gv(a,b){this.head=a;this.Jb=b;this.l=2314602255;this.I=8192}g=gv.prototype;
g.toString=function(){var a=this;return["{",I.a(vo(", ",function(){return function(b){return function e(d){return new ef(null,function(){return function(){for(;;){var f=M(d);if(f){if(Ce(f)){var h=cd(f),k=Q(h),l=jf(k);a:for(var m=0;;)if(m<k){var q=ic.g(h,m),n=S(q,0,null);q=S(q,1,null);n=[I.a(n)," ",I.a(q)].join("");l.add(n);m+=1}else{h=!0;break a}return h?lf(l.za(),e(dd(f))):lf(l.za(),null)}h=N(f);l=S(h,0,null);h=S(h,1,null);return ce([I.a(l)," ",I.a(h)].join(""),e(Bd(f)))}return null}}}(b),null,null)}}(a)(a)}())),
"}"].join("")};g.equiv=function(a){return this.H(null,a)};g.V=function(a,b){return this.K(null,b,null)};g.K=function(a,b,c){a=Ke(this.Jb,b);return B(a)?jl.a(yc(a)):c};g.yb=function(a,b,c){return Xb(function(){return function(d,e){return zf(cg(b,d),e)}}(this),c,M(this))};g.W=function(a,b){return Uc(b,["#linked/map ",I.a(ug.g(je,this))].join(""))};g.S=function(){return ue(this.Jb)};g.Ga=function(){return new gv(this.head,this.Jb)};g.Z=function(){return Q(this.Jb)};
g.Fb=function(){return hv.a?hv.a(this):hv.call(null,this)};g.Y=function(){return vd(ug.g(If,this))};g.H=function(a,b){return oh(this,b)};g.ia=function(){return Gc(iv,ue(this.Jb))};g.Tb=function(a,b){return jv.g?jv.g(this,b):jv.call(null,this,b)};g.Aa=function(a,b,c){return kv.h?kv.h(this,b,c):kv.call(null,this,b,c)};g.Yb=function(a,b){return Je(this.Jb,b)};g.aa=function(){return lv.a?lv.a(this):lv.call(null,this)};g.U=function(a,b){return new gv(this.head,te(this.Jb,b))};
g.ea=function(a,b){if(Be(b))return this.Aa(null,ic.g(b,0),ic.g(b,1));a=this;for(b=M(b);;){if(null==b)return a;var c=N(b);if(Be(c))a=sc(a,ic.g(c,0),ic.g(c,1)),b=O(b);else throw Error("conj on a map takes map entries or seqables of map entries");}};
g.call=function(){var a=null;a=function(b,c,d){switch(arguments.length){case 2:return this.V(null,c);case 3:return this.K(null,c,d)}throw Error("Invalid arity: "+(arguments.length-1));};a.g=function(b,c){return this.V(null,c)};a.h=function(b,c,d){return this.K(null,c,d)};return a}();g.apply=function(a,b){return this.call.apply(this,[this].concat(Vb(b)))};g.a=function(a){return this.V(null,a)};g.g=function(a,b){return this.K(null,a,b)};
function kv(a,b,c){var d=a.head;a=a.Jb;var e=Ke(a,b);if(B(e))return new gv(d,zg(a,new V(null,2,5,X,[b,jl],null),c));if(ve(a))return new gv(b,ne.h(a,b,new fv(c,b,b,null,null,null)));e=xg(a,new V(null,2,5,X,[d,ek],null));return new gv(d,zg(zg(ne.h(a,b,new fv(c,e,d,null,null,null)),new V(null,2,5,X,[d,ek],null),b),new V(null,2,5,X,[e,Ql],null),b))}
function jv(a,b){var c=a.head,d=a.Jb,e=Ke(d,b);if(B(e)){if(Dd.g(1,Q(d)))return le(a);a=Ql.a(yc(e));e=ek.a(yc(e));c=Dd.g(b,c)?a:c;return new gv(c,zg(zg(pe.g(d,b),new V(null,2,5,X,[a,ek],null),e),new V(null,2,5,X,[e,Ql],null),a))}return a}function mv(a,b){return new Le(a,b,null)}
var nv=function nv(a,b,c,d){var f=Ke(a,b),h=S(f,0,null),k=S(f,1,null),l=mv(h,jl.a(k)),m=d.a?d.a(k):d.call(null,k);return Dd.g(b,c)?new ke(null,l,null,1,null):ce(l,new ef(null,function(q,n,r,p,t){return function(){return nv.J?nv.J(a,t,c,d):nv.call(null,a,t,c,d)}}(f,h,k,l,m),null,null))};function lv(a){var b=a.Jb;a=a.head;var c=xg(b,new V(null,2,5,X,[a,ek],null));return M(b)?nv(b,a,c,Ql):null}
function hv(a){var b=a.Jb;a=a.head;var c=xg(b,new V(null,2,5,X,[a,ek],null));return M(b)?nv(b,c,a,ek):null}var iv=new gv(null,zh),ov=cg(ug,iv);J.g(Dc(Ju),ol);hg.J(Ju,ne,ol,ov);function pv(a){this.mc=a;this.l=2313556239;this.I=8192}g=pv.prototype;g.toString=function(){return["[",I.a(vo(" ",kg.g(I,this))),"]"].join("")};g.equiv=function(a){return this.H(null,a)};g.V=function(a,b){return this.K(null,b,null)};g.K=function(a,b,c){return rc(this.mc,b)?b:c};g.W=function(a,b){return Uc(b,["#linked/set ",I.a(ug.g(je,this))].join(""))};g.S=function(){return ue(this.mc)};g.Ga=function(){return new pv(this.mc)};g.Z=function(){return cc(this.mc)};
g.Fb=function(){var a=Tc(this.mc);return a?kg.g(Yg,a):null};g.Y=function(){return vd(ug.g(Ji,this))};g.H=function(a,b){return xe(b)&&Q(this)===Q(b)&&Xf(function(c){return function(d){return Je(c,d)}}(this),b)};g.ia=function(){return te(qv,ue)};g.aa=function(){var a=M(this.mc);return a?kg.g(Yg,a):null};g.U=function(a,b){return new pv(te(this.mc,b))};g.ea=function(a,b){return new pv(ne.h(this.mc,b,null))};
g.call=function(){var a=null;a=function(b,c,d){switch(arguments.length){case 2:return this.V(null,c);case 3:return this.K(null,c,d)}throw Error("Invalid arity: "+(arguments.length-1));};a.g=function(b,c){return this.V(null,c)};a.h=function(b,c,d){return this.K(null,c,d)};return a}();g.apply=function(a,b){return this.call.apply(this,[this].concat(Vb(b)))};g.a=function(a){return this.V(null,a)};g.g=function(a,b){return this.K(null,a,b)};var qv=new pv(iv),rv=cg(ug,qv);J.g(Dc(Ju),Bk);hg.J(Ju,ne,Bk,rv);function sv(a,b,c){b=null!=b&&(b.l&64||w===b.T)?zf(Di,b):b;var d=J.g(b,Qm);b=J.g(b,Ck);var e=Wg(d),f=S(e,0,null);d=S(f,0,null);f=S(f,1,null);var h=null!=f&&(f.l&64||w===f.T)?zf(Di,f):f;f=J.g(h,$l);h=J.g(h,Zj);e=S(e,1,null);var k=xg(a,new V(null,3,5,X,[d,cf.a(I.a(b)),Zk],null)),l=null!=k&&(k.l&64||w===k.T)?zf(Di,k):k;k=J.g(l,ll);l=J.g(l,Jl);c=new Fb(null,6,[Ck,b,Jl,l,dm,c,$l,f,Zj,h,em,e],null);return k instanceof V?Gi.A(ne,R([c,new Fb(null,2,[jk,k,ik,cf.a(b)],null)])):Gi.A(ne,R([c,new Fb(null,2,[jk,
xg(a,new V(null,3,5,X,[d,k,Yl],null)),bl,k],null)]))}function tv(a,b){var c=S(b,0,null),d=S(b,1,null),e=kg.g(function(){return function(f){S(f,0,null);f=S(f,1,null);f=null!=f&&(f.l&64||w===f.T)?zf(Di,f):f;var h=J.g(f,Zk);h=null!=h&&(h.l&64||w===h.T)?zf(Di,h):h;h=J.g(h,ll);f=J.g(f,Yl);return h instanceof V?he(h):he(f)}}(b,c,d),Wg(c));return B(Yf(function(){return function(f){return Dd.g(a,f)}}(e,b,c,d),e))?d:null}
function uv(a,b){a=M(et(a));return tg(Mb,kg.g(function(){return function(c){return tv(b,c)}}(a),a))}
function vv(a,b,c){a=sv(a,b,c);b=null!=a&&(a.l&64||w===a.T)?zf(Di,a):a;c=J.g(b,Ck);var d=J.g(b,Jl),e=J.g(b,dm),f=J.g(b,$l),h=J.g(b,Zj),k=J.g(b,jk);return["https://tigerweb.geo.census.gov/arcgis/rest/services/",Dd.g("2010",I.a(c))?"TIGERweb/tigerWMS_Census2010":Dd.g("2000",I.a(c))?"Census2010/tigerWMS_Census2000":["TIGERweb/tigerWMS_ACS",I.a(c)].join(""),"/Mapserver/",I.a(J.g(d,e)),"/query?",I.a(Qu("\x26",kg.g(function(){return function(l){return Qu("\x3d",l)}}(a,b,c,d,e,f,h,k),new V(null,7,5,X,[new V(null,
2,5,X,["geometry",[I.a(h),",",I.a(f)].join("")],null),new V(null,2,5,X,["geometryType","esriGeometryPoint"],null),new V(null,2,5,X,["inSR","4269"],null),new V(null,2,5,X,["spatialRel","esriSpatialRelIntersects"],null),new V(null,2,5,X,["returnGeometry","false"],null),new V(null,2,5,X,["f","pjson"],null),new V(null,2,5,X,["outFields",Qu(",",kg.g(df,k))],null)],null))))].join("")}
function wv(a,b){var c=ug.g(je,vh(b));b=ug.g(je,wh(b));for(var d=kg.g(function(){return function(k){return uv(a,k)}}(c,b),c),e=0,f=If;;){if(Dd.g(null,J.g(c,e)))return f;var h=e+1;f=ne.h(f,J.g(c,e),oe([J.g(vg(function(){return function(k){return N(k)}}(e,f,c,b,d),d),e),J.g(b,e)]));e=h}}var xv=Yu(sm,"Census FIPS Geocoding",fg(""),fg(je),fg(If));
function yv(a,b,c,d){var e=fo(1,kg.a(function(f){return wv(a,xg(f,new V(null,3,5,X,[wk,0,yk],null)))}));b=vv(a,b,c);c=qo(new V(null,1,5,X,[b],null));xv.h?xv.h(c,e,e):xv.call(null,c,e,e);return go(e,function(f){return function(h){jo(d,h);return qn(f)}}(e,b))}
function zv(a){return function(b,c){var d=fo(1,null);Ln(function(e){return function(){var f=function(){return function(k){return function(){function l(n){for(;;){a:try{for(;;){var r=k(n);if(!af(r,xk)){var p=r;break a}}}catch(t){if(t instanceof Object)n[5]=t,co(n),p=xk;else throw t;}if(!af(p,xk))return p}}function m(){var n=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];n[0]=q;n[1]=1;return n}var q=null;q=function(n){switch(arguments.length){case 0:return m.call(this);
case 1:return l.call(this,n)}throw Error("Invalid arity: "+arguments.length);};q.o=m;q.a=l;return q}()}(function(){return function(k){var l=k[1];if(7===l){var m=k[7];l=k[8];var q=k[9];l=yv(a,q,m,l);q=sv(a,q,0);m=Ob(null==q);k[11]=l;k[10]=q;k[1]=m?9:10;return xk}if(20===l){m=k[7];q=k[12];var n=k[13];l=ve(n);q=null==J.g(q,m+1);q=Ob(q);k[1]=B(l&&q)?23:24;return xk}if(27===l)return k[2]=null,k[1]=28,xk;if(1===l)return $n(k,2,b);if(24===l)return k[1]=26,xk;if(4===l)return l=k[14],k[7]=0,k[9]=l,k[2]=null,
k[1]=7,xk;if(15===l)return l=k[10],l=zf(Di,l),k[2]=l,k[1]=17,xk;if(21===l)return k[2]=k[2],k[1]=8,xk;if(13===l)return k[2]=!1,k[1]=14,xk;if(22===l)return l=k[8],q=k[2],l=qn(l),k[15]=q,k[2]=l,k[1]=21,xk;if(29===l)return l=k[8],q=k[2],l=qn(l),k[16]=q,k[2]=l,k[1]=28,xk;if(6===l)return l=k[8],q=k[2],l=qn(l),k[17]=q,k[2]=l,k[1]=5,xk;if(28===l)return k[2]=k[2],k[1]=25,xk;if(25===l)return k[2]=k[2],k[1]=21,xk;if(17===l)return l=k[8],m=k[2],q=J.g(m,Jl),m=J.g(m,em),k[12]=q,k[18]=m,$n(k,18,l);if(3===l)return l=
k[14],ao(k,6,c,l);if(12===l)return k[2]=!0,k[1]=14,xk;if(2===l)return q=k[2],l=fo(1,null),m=null!=q&&(q.l&64||w===q.T)?zf(Di,q):q,m=J.g(m,Qm),m=N(m),S(m,0,null),m=!(S(m,1,null)instanceof Fb),k[8]=l,k[14]=q,k[1]=m?3:4,xk;if(23===l)return m=k[7],l=k[14],k[7]=m+1,k[9]=l,k[2]=null,k[1]=7,xk;if(19===l){q=k[9];n=k[13];m=k[18];var r=l=iv;n=wh(n);n=ug.g(r,n);m=ug.g(iv,new V(null,1,5,X,[m],null));l=ie.A(l,n,R([m]));l=ne.h(zh,Qm,l);l=Fi.A(R([q,l]));return ao(k,22,c,l)}return 11===l?(k[1]=B(k[2])?15:16,xk):
9===l?(l=k[10],q=w===l.T,k[1]=B(l.l&64||q)?12:13,xk):5===l?bo(k,k[2]):14===l?(k[2]=k[2],k[1]=11,xk):26===l?ao(k,29,c,"No FIPS (Census geocodes) found for given arguments"):16===l?(l=k[10],k[2]=l,k[1]=17,xk):10===l?(k[2]=!1,k[1]=11,xk):18===l?(l=k[2],q=!ve(l),k[13]=l,k[1]=q?19:20,xk):8===l?(k[2]=k[2],k[1]=5,xk):null}}(e),e)}(),h=function(){var k=f.o?f.o():f.call(null);k[6]=e;return k}();return Zn(h)}}(d));return d}}
function Av(a){return function(b,c){b=qo(new V(null,1,5,X,[Zu(b)],null));var d=zv(a);return d.g?d.g(b,c):d.call(null,b,c)}};function Bv(a,b,c,d){var e=Vu(df(d));b=new V(null,3,5,X,[["No GeoJSON found for: '",I.a(e),"'"].join(""),["at this scope in vintage: ",I.a(c)].join(""),["at resolution: ",I.a(b)].join("")],null);d=xg(a,new V(null,1,5,X,[d],null));if(B(d)){a=new V(null,3,5,X,[["For '",I.a(e),"' try of of the following:"].join(""),["\x3d\x3d\x3d :us \x3d nation-level '",I.a(e),"' geoResolutions \x3d\x3d\x3d"].join(""),["\x3d\x3d\x3d :st \x3d state-levels '",I.a(e),"' geoResolutions \x3d\x3d\x3d"].join("")],null);c=
M(b);for(var f=null,h=0,k=0;;)if(k<h){var l=f.P(null,k);mj(R([l]));k+=1}else if(c=M(c))f=c,Ce(f)?(c=cd(f),k=dd(f),f=c,h=Q(c),c=k):(c=N(f),mj(R([c])),c=O(f),f=null,h=0),k=0;else break;c=M(a);f=null;for(k=h=0;;)if(k<h)l=f.P(null,k),mj(R([l])),k+=1;else if(c=M(c))f=c,Ce(f)?(c=cd(f),k=dd(f),f=c,h=Q(c),c=k):(c=N(f),mj(R([c])),c=O(f),f=null,h=0),k=0;else break;e=M(Wg(Uu(function(){return function(m){return xg(m,new V(null,1,5,X,[Nm],null))}}(a,d,d,e,b),d)));b=null;for(a=d=0;;)if(a<d)c=b.P(null,a),mj(R([c])),
a+=1;else if(e=M(e))b=e,Ce(b)?(e=cd(b),a=dd(b),b=e,d=Q(e),e=a):(e=N(b),mj(R([e])),e=O(b),b=null,d=0),a=0;else break}else{c=M(b);f=null;for(k=h=0;;)if(k<h)l=f.P(null,k),mj(R([l])),k+=1;else if(c=M(c))f=c,Ce(f)?(c=cd(f),k=dd(f),f=c,h=Q(c),c=k):(c=N(f),mj(R([c])),c=O(f),f=null,h=0),k=0;else break;mj(R(["\x3d\x3d\x3d available geoHierarchy levels \x3d\x3d\x3d"]));e=M(Wg(kg.g(function(){return function(m){return Vu(df(xc(m)))}}("\x3d\x3d\x3d available geoHierarchy levels \x3d\x3d\x3d",d,e,b),a)));b=null;
for(a=d=0;;)if(a<d)c=b.P(null,a),mj(R([c])),a+=1;else if(e=M(e))b=e,Ce(b)?(e=cd(b),a=dd(b),b=e,d=Q(e),e=a):(e=N(b),mj(R([e])),e=O(b),b=null,d=0),a=0;else break}return""}
function Cv(a,b,c,d){return null==d?[I.a(Qu("/",new V(null,4,5,X,["https://cors-e.herokuapp.com/https://raw.githubusercontent.com/uscensusbureau/citysdk/master/v2/GeoJSON",a,b,df(c)],null))),".json"].join(""):[I.a(Qu("/",new V(null,5,5,X,["https://cors-e.herokuapp.com/https://raw.githubusercontent.com/uscensusbureau/citysdk/master/v2/GeoJSON",a,b,d,df(c)],null))),".json"].join("")}
function Dv(a,b,c,d,e,f,h){f=null!=Yf(function(m){return Dd.g(b,m)},f);e=null!=Yf(function(){return function(m){return Dd.g(b,m)}}(f),e);var k=null!=h,l=null==h;return k&&f?Cv(b,c,d,h):l&&e?Cv(b,c,d,null):k&&e&&!f?Cv(b,c,d,null):Bv(a,b,c,d)}
function Ev(a,b,c,d,e){for(var f=M(new V(null,4,5,X,["Warning, you are about to make a large GeoJSON request.","This may take some time -\x3e consider local data caching.","The response may also cause VM heap capacity overflow.","On Node - for ZCTAs - Use `--max-old-space-size\x3d4096"],null)),h=null,k=0,l=0;;)if(l<k){var m=h.P(null,l);mj(R([m]));l+=1}else if(f=M(f))h=f,Ce(h)?(f=cd(h),l=dd(h),h=f,k=Q(f),f=l):(f=N(h),mj(R([f])),f=O(h),h=null,k=0),l=0;else break;return Dv(a,b,c,d,e,null,null)}
var Fv=function(){function a(c){var d=null;if(0<arguments.length){d=0;for(var e=Array(arguments.length-0);d<e.length;)e[d]=arguments[d+0],++d;d=new Ad(e,0,null)}return b.call(this,d)}function b(c){var d=Wg(c);try{if(Be(d)&&2===Q(d))try{var e=Xd(d,1);if(Be(e)&&5===Q(e))try{var f=Xd(e,3);if(Be(f)&&2===Q(f))try{var h=Xd(f,0);if(af(h,rk))try{var k=Xd(e,0);if("500k"===k)try{var l=Xd(e,2);if(null===l)try{var m=Xd(e,4);if(null!=m?m.l&256||w===m.Zc||(m.l?0:Qb(oc,m)):Qb(oc,m))try{if(null===J.h(m,gl,Yk))try{var q=
J.h(m,Sk,Yk);if(Ef(q,Yk)){var n=J.g(m,Sk),r=Xd(e,1),p=Xd(d,0);return Ev(p,"500k",r,rk,n)}throw Z;}catch(E){if(E instanceof Error){var t=E;if(t===Z)throw Z;throw t;}throw E;}else throw Z;}catch(E){if(E instanceof Error){t=E;if(t===Z)throw Z;throw t;}throw E;}else throw Z;}catch(E){if(E instanceof Error){t=E;if(t===Z)throw Z;throw t;}throw E;}else throw Z;}catch(E){if(E instanceof Error){t=E;if(t===Z)throw Z;throw t;}throw E;}else throw Z;}catch(E){if(E instanceof Error)if(t=E,t===Z)try{k=Xd(e,0);if(function(){return function(){return function(F){return!Dd.g("500k",
F)}}(k,t,h,f,e,d)(k)}()){var x=Xd(e,0);r=Xd(e,1);p=Xd(d,0);return Bv(p,x,r,rk)}throw Z;}catch(F){if(F instanceof Error){var v=F;if(v===Z)throw Z;throw v;}throw F;}else throw t;else throw E;}else throw Z;}catch(E){if(E instanceof Error)if(t=E,t===Z)try{if(m=Xd(e,4),null!=m?m.l&256||w===m.Zc||(m.l?0:Qb(oc,m)):Qb(oc,m))try{if(null===J.h(m,gl,Yk))try{if(h=Xd(f,0),af(h,pl))try{if(l=Xd(e,2),null===l)try{var H=J.h(m,Sk,Yk);if(Ef(H,Yk))return n=J.g(m,Sk),x=Xd(e,0),r=Xd(e,1),p=Xd(d,0),Ev(p,x,r,pl,n);throw Z;
}catch(F){if(F instanceof Error){v=F;if(v===Z)throw Z;throw v;}throw F;}else throw Z;}catch(F){if(F instanceof Error){v=F;if(v===Z)throw Z;throw v;}throw F;}else throw Z;}catch(F){if(F instanceof Error){v=F;if(v===Z)throw Z;throw v;}throw F;}else throw Z;}catch(F){if(F instanceof Error){v=F;if(v===Z)throw Z;throw v;}throw F;}else throw Z;}catch(F){if(F instanceof Error)if(v=F,v===Z)try{m=Xd(e,4);if(null===m){var P=Xd(f,0);x=Xd(e,0);r=Xd(e,1);p=Xd(d,0);return Bv(p,x,r,P)}throw Z;}catch(W){if(W instanceof
Error)if(c=W,c===Z)try{if(m=Xd(e,4),null!=m?m.l&256||w===m.Zc||(m.l?0:Qb(oc,m)):Qb(oc,m))try{if(l=Xd(e,2),null===l)try{var ea=J.h(m,Sk,Yk);if(null===ea)try{var ca=J.h(m,gl,Yk);if(Ef(ca,Yk))return P=Xd(f,0),x=Xd(e,0),r=Xd(e,1),p=Xd(d,0),Bv(p,x,r,P);throw Z;}catch(U){if(U instanceof Error){var ma=U;if(ma===Z)throw Z;throw ma;}throw U;}else throw Z;}catch(U){if(U instanceof Error){ma=U;if(ma===Z)throw Z;throw ma;}throw U;}else throw Z;}catch(U){if(U instanceof Error)if(ma=U,ma===Z)try{if(l=Xd(e,2),"*"===
l)try{if(ea=J.h(m,Sk,Yk),null===ea)try{ca=J.h(m,gl,Yk);if(Ef(ca,Yk))return P=Xd(f,0),x=Xd(e,0),r=Xd(e,1),p=Xd(d,0),Bv(p,x,r,P);throw Z;}catch(Y){if(Y instanceof Error){var T=Y;if(T===Z)throw Z;throw T;}throw Y;}else throw Z;}catch(Y){if(Y instanceof Error){T=Y;if(T===Z)throw Z;throw T;}throw Y;}else throw Z;}catch(Y){if(Y instanceof Error)if(T=Y,T===Z)try{if(l=Xd(e,2),null===l)try{if(ea=J.h(m,Sk,Yk),Ef(ea,Yk))try{ca=J.h(m,gl,Yk);if(Ef(ca,Yk))return n=J.g(m,Sk),P=Xd(f,0),x=Xd(e,0),r=Xd(e,1),p=Xd(d,
0),Dv(p,x,r,P,n,null,null);throw Z;}catch(aa){if(aa instanceof Error){var u=aa;if(u===Z)throw Z;throw u;}throw aa;}else throw Z;}catch(aa){if(aa instanceof Error){u=aa;if(u===Z)throw Z;throw u;}throw aa;}else throw Z;}catch(aa){if(aa instanceof Error)if(u=aa,u===Z)try{if(l=Xd(e,2),"*"===l)try{if(ea=J.h(m,Sk,Yk),Ef(ea,Yk))try{ca=J.h(m,gl,Yk);if(Ef(ca,Yk))return n=J.g(m,Sk),P=Xd(f,0),x=Xd(e,0),r=Xd(e,1),p=Xd(d,0),Dv(p,x,r,P,n,null,null);throw Z;}catch(da){if(da instanceof Error){var y=da;if(y===Z)throw Z;
throw y;}throw da;}else throw Z;}catch(da){if(da instanceof Error){y=da;if(y===Z)throw Z;throw y;}throw da;}else throw Z;}catch(da){if(da instanceof Error)if(y=da,y===Z)try{if(ca=J.h(m,gl,Yk),null===ca)try{ea=J.h(m,Sk,Yk);if(Ef(ea,Yk))return n=J.g(m,Sk),P=Xd(f,0),x=Xd(e,0),r=Xd(e,1),p=Xd(d,0),Dv(p,x,r,P,n,null,null);throw Z;}catch(ha){if(ha instanceof Error){var z=ha;if(z===Z)throw Z;throw z;}throw ha;}else throw Z;}catch(ha){if(ha instanceof Error)if(z=ha,z===Z)try{if(ca=J.h(m,gl,Yk),Ef(ca,Yk))try{ea=
J.h(m,Sk,Yk);if(Ef(ea,Yk)){n=J.g(m,Sk);var A=J.g(m,gl),C=Xd(e,2);P=Xd(f,0);x=Xd(e,0);r=Xd(e,1);p=Xd(d,0);return Dv(p,x,r,P,n,A,C)}throw Z;}catch(ja){if(ja instanceof Error){var D=ja;if(D===Z)throw Z;throw D;}throw ja;}else throw Z;}catch(ja){if(ja instanceof Error){D=ja;if(D===Z)throw Z;throw D;}throw ja;}else throw z;else throw ha;}else throw y;else throw da;}else throw u;else throw aa;}else throw T;else throw Y;}else throw ma;else throw U;}else throw Z;}catch(U){if(U instanceof Error){ma=U;if(ma===
Z)throw Z;throw ma;}throw U;}else throw c;else throw W;}else throw v;else throw F;}else throw t;else throw E;}else throw Z;}catch(E){if(E instanceof Error){t=E;if(t===Z)throw Z;throw t;}throw E;}else throw Z;}catch(E){if(E instanceof Error){t=E;if(t===Z)throw Z;throw t;}throw E;}else throw Z;}catch(E){if(E instanceof Error)if(t=E,t===Z)try{if(Be(d)&&1<=Q(d))try{var G=eh(d,0,1);if(Be(G)&&1===Q(G))return p=Xd(G,0),eh(d,1,Q(d)),"";throw Z;}catch(F){if(F instanceof Error){v=F;if(v===Z)throw Z;throw v;
}throw F;}else throw Z;}catch(F){if(F instanceof Error){v=F;if(v===Z)throw Error(["No matching clause: ",I.a(d)].join(""));throw v;}throw F;}else throw t;else throw E;}}a.O=0;a.R=function(c){c=M(c);return b(c)};a.A=b;return a}();function Gv(a,b){var c=null!=b&&(b.l&64||w===b.T)?zf(Di,b):b;b=J.g(c,Qm);var d=null!=b&&(b.l&64||w===b.T)?zf(Di,b):b;b=J.g(d,Dk);var e=J.g(c,Ck);c=J.g(c,Gm);d=he(d);a=xg(a,new V(null,3,5,X,[xc(d),cf.a(e),Nm],null));return new V(null,5,5,X,[c,e,b,d,a],null)}
var Hv=Yu(Lk,"Census GeoJSON",fg(""),fg(je),fg(If));function Iv(a){return function(b,c,d){return go(b,function(e){var f=Fv.A(R([a,Gv(a,e)]));e=fo(1,kg.a(JSON.parse));if(Dd.g("",f))return jo(d,"Invalid GeoJSON request. Please check arguments against requirements.");f=qo(new V(null,1,5,X,[f],null));Hv.h?Hv.h(f,e,d):Hv.call(null,f,e,d);return oo(e,c)})}}
function Jv(a,b){var c=null!=b&&(b.l&64||w===b.T)?zf(Di,b):b;b=J.g(c,Qm);c=J.g(c,Ck);a=xg(a,new V(null,3,5,X,[xc(he(b)),cf.a(c),Yl],null));return M(a)}function Kv(a,b){a=Jv(a,b);return av(function(c){return function(d,e,f){f=oe([zf(I,kg.g(km.a(f),c)),f]);return d.g?d.g(e,f):d.call(null,e,f)}}(a))}function Lv(a,b){return bg.g(kg.a(function(c){return J.g(c,wk)}),cv(Kv(a,b)))}
var Mv=Yu(sm,"Census GeoJSON (for merge)",fg(""),fg(je),fg(If)),Nv=new V(null,2,5,X,[function(a){return function(b,c){return go(b,function(d){var e=Fv.A(R([a,Gv(a,d)])),f=Lv(a,d);d=N(Jv(a,d));return Dd.g("",e)?jo(c,"Invalid GeoJSON request. Please check arguments against requirements."):jo(c,new Fb(null,4,[Ul,e,Tk,f,Kl,Mv,hl,d],null))})}},!0],null);function Ov(a,b){var c=S(a,0,null);a=S(a,1,null);return Qu(b,new V(null,2,5,X,[df(c),I.a(a)],null))}
function Pv(a){var b=null!=a&&(a.l&64||w===a.T)?zf(Di,a):a,c=J.g(b,Ck),d=J.g(b,nl),e=J.g(b,Qm),f=J.g(b,Qk),h=J.g(b,bn),k=J.g(b,Mm);return Ob(Yf(Mb,new V(null,4,5,X,[c,d,e,f],null)))?["https://cors-e.herokuapp.com/https://api.census.gov/data/",I.a(c),I.a(zf(I,kg.g(function(){return function(l){return["/",I.a(l)].join("")}}(a,b,c,d,e,f,h,k),d))),"?get\x3d",I.a(null!=f?Qu(",",f):""),null!=h?["\x26",I.a(Qu("\x26",kg.g(function(){return function(l){return Ov(l,"\x3d")}}(a,b,c,d,e,f,h,k),h)))].join(""):
"",I.a(Vu(Dd.g(1,Q(e))?["\x26for\x3d",I.a(Ov(N(e),":"))].join(""):["\x26in\x3d",I.a(Qu("%20",kg.g(function(){return function(l){return Ov(l,":")}}(a,b,c,d,e,f,h,k),Li(e)))),"\x26for\x3d",I.a(Ov(he(e),":"))].join(""))),null!=k?["\x26key\x3d",I.a(k)].join(""):null].join(""):""}
function ev(a){return B(Yf(function(b){return Dd.g(a,b)},new V(null,6,5,X,"-222222222.0000 -333333333.0000 -555555555.0000 -666666666.0000 -888888888.0000 -999999999.0000".split(" "),null)))?["NAN: ",I.a(Nu(a))].join(""):B(Mu(a))?Ru(a):a}
function Qv(a){var b=null!=a&&(a.l&64||w===a.T)?zf(Di,a):a,c=J.g(b,Qk),d=J.g(b,bn),e=new V(null,2,5,X,[0,Q(c)+Q(d)],null);return bv(function(f){return function(h,k,l,m){if(null==Dc(h))return k=vg(Wu,m),id(h,k),null;h=Mi(vg(cf,Dc(h)),dv(f,m));return k.g?k.g(l,h):k.call(null,l,h)}}(e,a,b,c,d))}function Rv(a){return bg.g(Qv(a),kg.a(function(b){return tj.A(b,R([yj,!0]))}))}var Sv=Yu(Lk,"Census statistics",fg(""),fg(je),fg(If));
function Tv(a,b,c){return go(a,function(d){var e=Pv(d);d=fo(1,bg.g(cv(Rv(d)),kg.a(nf)));if(Dd.g("",e))return jo(c,"Invalid Census Statistics request. Please check arguments against requirements.");e=qo(new V(null,1,5,X,[e],null));Sv.h?Sv.h(e,d,c):Sv.call(null,e,d,c);return oo(d,b)})}function Uv(a){return av(function(b,c,d){var e=I;a:{var f=Q(d)-a,h=M(d);for(f=M(mg(f,d));;)if(f)h=O(h),f=O(f);else break a}d=oe([zf(e,wh(h)),new Fb(null,1,[km,d],null)]);return b.g?b.g(c,d):b.call(null,c,d)})}
var Vv=new V(null,2,5,X,[function(a,b){return go(a,function(c){var d=Q(J.g(c,Qk))+Q(J.g(c,bn)),e=Pv(c);d=bg.g(Qv(c),Uv(d));d=cv(d);c=cf.a(N(J.g(c,Qk)));return Dd.g("",e)?jo(b,"Invalid Census Statistics request. Please check arguments against requirements."):jo(b,new Fb(null,4,[Ul,e,Tk,d,Kl,Sv,hl,c],null))})},!1],null);var Wv={},Xv={},Yv={},Zv,$v,aw,bw,cw,dw,ew;var fw=function fw(a){if(null!=a&&null!=a.nc)return a.nc(a);var c=fw[la(null==a?null:a)];if(null!=c)return c.a?c.a(a):c.call(null,a);c=fw._;if(null!=c)return c.a?c.a(a):c.call(null,a);throw Sb("KvRfable.some-kvrf",a);};fw._=function(){return null};
function gw(a){var b=fw(a);if(B(b))return b;if("undefined"===typeof Wv||"undefined"===typeof Xv||"undefined"===typeof Yv||"undefined"===typeof Zv)Zv=function(c,d,e){this.G=c;this.Zf=d;this.Qf=e;this.l=393217;this.I=0},Zv.prototype.U=function(){return function(c,d){return new Zv(this.G,this.Zf,d)}}(b),Zv.prototype.S=function(){return function(){return this.Qf}}(b),Zv.prototype.nc=function(){return function(){return this}}(b),Zv.prototype.call=function(){return function(){function c(k,l,m,q){k=this;
m=new V(null,2,5,X,[m,q],null);return k.G.g?k.G.g(l,m):k.G.call(null,l,m)}function d(k,l,m){k=this;return k.G.g?k.G.g(l,m):k.G.call(null,l,m)}function e(k,l){k=this;return k.G.a?k.G.a(l):k.G.call(null,l)}function f(k){k=this;return k.G.o?k.G.o():k.G.call(null)}var h=null;h=function(k,l,m,q){switch(arguments.length){case 1:return f.call(this,k);case 2:return e.call(this,k,l);case 3:return d.call(this,k,l,m);case 4:return c.call(this,k,l,m,q)}throw Error("Invalid arity: "+(arguments.length-1));};h.a=
f;h.g=e;h.h=d;h.J=c;return h}()}(b),Zv.prototype.apply=function(){return function(c,d){return this.call.apply(this,[this].concat(Vb(d)))}}(b),Zv.prototype.h=function(){return function(c,d,e){d=new V(null,2,5,X,[d,e],null);return this.G.g?this.G.g(c,d):this.G.call(null,c,d)}}(b),Zv.prototype.o=function(){return function(){return this.G.o?this.G.o():this.G.call(null)}}(b),Zv.prototype.a=function(){return function(c){return this.G.a?this.G.a(c):this.G.call(null,c)}}(b),Zv.prototype.g=function(){return function(c,
d){return this.G.g?this.G.g(c,d):this.G.call(null,c,d)}}(b),Zv.Ab=function(){return function(){return new V(null,3,5,X,[Gl,Om,il],null)}}(b),Zv.qb=!0,Zv.ib="net.cgrand.xforms/t_net$cgrand$xforms34737",Zv.ub=function(){return function(c,d){return Uc(d,"net.cgrand.xforms/t_net$cgrand$xforms34737")}}(b);return new Zv(a,b,null)}
function hw(){var a=iw(je);return function(b){var c=new ig(a.o?a.o():a.call(null)),d=gw(a);if("undefined"===typeof Wv||"undefined"===typeof Xv||"undefined"===typeof Yv||"undefined"===typeof $v)$v=function(e,f,h,k){this.ya=e;this.G=f;this.gb=h;this.Rf=k;this.l=393217;this.I=0},$v.prototype.U=function(){return function(e,f){return new $v(this.ya,this.G,this.gb,f)}}(d,c),$v.prototype.S=function(){return function(){return this.Rf}}(d,c),$v.prototype.nc=function(){return function(){return this}}(d,c),
$v.prototype.call=function(){return function(){function e(m,q,n,r){m=this;var p=m.gb,t=Dc(m.gb);m=m.ya.h?m.ya.h(t,n,r):m.ya.call(null,t,n,r);return Md(id(p,m))?Ld(q):q}function f(m,q,n){m=this;var r=m.gb,p=Dc(m.gb);m=m.ya.g?m.ya.g(p,n):m.ya.call(null,p,n);return Md(id(r,m))?Ld(q):q}function h(m,q){m=this;var n=Dc(m.gb);if(n===m.gb)return null;id(m.gb,m.gb);n=Nd(n);n=m.ya.a?m.ya.a(n):m.ya.call(null,n);q=m.G.g?m.G.g(q,n):m.G.call(null,q,n);q=Nd(q);return m.G.a?m.G.a(q):m.G.call(null,q)}function k(m){m=
this;return m.G.o?m.G.o():m.G.call(null)}var l=null;l=function(m,q,n,r){switch(arguments.length){case 1:return k.call(this,m);case 2:return h.call(this,m,q);case 3:return f.call(this,m,q,n);case 4:return e.call(this,m,q,n,r)}throw Error("Invalid arity: "+(arguments.length-1));};l.a=k;l.g=h;l.h=f;l.J=e;return l}()}(d,c),$v.prototype.apply=function(){return function(e,f){return this.call.apply(this,[this].concat(Vb(f)))}}(d,c),$v.prototype.o=function(){return function(){return this.G.o?this.G.o():this.G.call(null)}}(d,
c),$v.prototype.a=function(){return function(e){var f=Dc(this.gb);if(f===this.gb)return null;id(this.gb,this.gb);f=Nd(f);f=this.ya.a?this.ya.a(f):this.ya.call(null,f);e=this.G.g?this.G.g(e,f):this.G.call(null,e,f);e=Nd(e);return this.G.a?this.G.a(e):this.G.call(null,e)}}(d,c),$v.prototype.g=function(){return function(e,f){var h=this.gb,k=Dc(this.gb);f=this.ya.g?this.ya.g(k,f):this.ya.call(null,k,f);return Md(id(h,f))?Ld(e):e}}(d,c),$v.prototype.h=function(){return function(e,f,h){var k=this.gb,l=
Dc(this.gb);f=this.ya.h?this.ya.h(l,f,h):this.ya.call(null,l,f,h);return Md(id(k,f))?Ld(e):e}}(d,c),$v.Ab=function(){return function(){return new V(null,4,5,X,[yl,Gl,zk,dl],null)}}(d,c),$v.qb=!0,$v.ib="net.cgrand.xforms/t_net$cgrand$xforms34744",$v.ub=function(){return function(e,f){return Uc(f,"net.cgrand.xforms/t_net$cgrand$xforms34744")}}(d,c);return new $v(d,b,c,null)}}
function iw(a){if(null!=a?a.I&4||w===a.Oe||(a.I?0:Qb(Xc,a)):Qb(Xc,a)){if(ze(a)){if("undefined"===typeof Wv||"undefined"===typeof Xv||"undefined"===typeof Yv||"undefined"===typeof aw)aw=function(b,c){this.fc=b;this.Sf=c;this.l=393217;this.I=0},aw.prototype.U=function(b,c){return new aw(this.fc,c)},aw.prototype.S=function(){return this.Sf},aw.prototype.nc=function(){return this},aw.prototype.call=function(){var b=null;b=function(c,d,e,f){switch(arguments.length){case 1:return Yc(this.fc);case 2:return $c(d);
case 3:return rf.g(d,e);case 4:return ad(d,e,f)}throw Error("Invalid arity: "+(arguments.length-1));};b.a=function(){return Yc(this.fc)};b.g=function(c,d){return $c(d)};b.h=function(c,d,e){return rf.g(d,e)};b.J=function(c,d,e,f){return ad(d,e,f)};return b}(),aw.prototype.apply=function(b,c){return this.call.apply(this,[this].concat(Vb(c)))},aw.prototype.o=function(){return Yc(this.fc)},aw.prototype.a=function(b){return $c(b)},aw.prototype.g=function(b,c){return rf.g(b,c)},aw.prototype.h=function(b,
c,d){return ad(b,c,d)},aw.Ab=function(){return new V(null,2,5,X,[gm,Pk],null)},aw.qb=!0,aw.ib="net.cgrand.xforms/t_net$cgrand$xforms34768",aw.ub=function(b,c){return Uc(c,"net.cgrand.xforms/t_net$cgrand$xforms34768")};return new aw(a,null)}return function(){function b(e,f){return rf.g(e,f)}function c(){return Yc(a)}var d=null;d=function(e,f){switch(arguments.length){case 0:return c.call(this);case 1:return $c(e);case 2:return b.call(this,e,f)}throw Error("Invalid arity: "+arguments.length);};d.o=
c;d.a=function(e){return $c(e)};d.g=b;return d}()}if(ze(a)){if("undefined"===typeof Wv||"undefined"===typeof Xv||"undefined"===typeof Yv||"undefined"===typeof bw)bw=function(b,c){this.fc=b;this.Tf=c;this.l=393217;this.I=0},bw.prototype.U=function(b,c){return new bw(this.fc,c)},bw.prototype.S=function(){return this.Tf},bw.prototype.nc=function(){return this},bw.prototype.call=function(){var b=null;b=function(c,d,e,f){switch(arguments.length){case 1:return this.fc;case 2:return d;case 3:return ie.g(d,
e);case 4:return ne.h(d,e,f)}throw Error("Invalid arity: "+(arguments.length-1));};b.a=function(){return this.fc};b.g=function(c,d){return d};b.h=function(c,d,e){return ie.g(d,e)};b.J=function(c,d,e,f){return ne.h(d,e,f)};return b}(),bw.prototype.apply=function(b,c){return this.call.apply(this,[this].concat(Vb(c)))},bw.prototype.o=function(){return this.fc},bw.prototype.a=function(b){return b},bw.prototype.g=function(b,c){return ie.g(b,c)},bw.prototype.h=function(b,c,d){return ne.h(b,c,d)},bw.Ab=
function(){return new V(null,2,5,X,[gm,Ik],null)},bw.qb=!0,bw.ib="net.cgrand.xforms/t_net$cgrand$xforms34773",bw.ub=function(b,c){return Uc(c,"net.cgrand.xforms/t_net$cgrand$xforms34773")};return new bw(a,null)}return function(){function b(d,e){return ie.g(d,e)}var c=null;c=function(d,e){switch(arguments.length){case 0:return a;case 1:return d;case 2:return b.call(this,d,e)}throw Error("Invalid arity: "+arguments.length);};c.o=function(){return a};c.a=function(d){return d};c.g=b;return c}()}
function jw(a){var b=je,c=function(){var f=iw(b);return Qe.a?Qe.a(f):Qe.call(null,f)}(),d=function(){var f=ze(a);return f?(f=null!=a?a.l&1048576||w===a.vf?!0:a.l?!1:Qb(Jc,a):Qb(Jc,a))?fw(c):f:f}();if(B(d)){var e=Pe(d,d.o?d.o():d.call(null),a);return d.a?d.a(e):d.call(null,e)}d=Xb(c,c.o?c.o():c.call(null),a);return c.a?c.a(d):c.call(null,d)}function kw(a){return Xd(a,0)}function lw(a){return Xd(a,1)}
var mw=function mw(a){switch(arguments.length){case 1:return mw.a(arguments[0]);case 2:return mw.g(arguments[0],arguments[1]);case 3:return mw.h(arguments[0],arguments[1],arguments[2]);default:throw Error(["Invalid arity: ",I.a(arguments.length)].join(""));}};mw.a=function(a){return a};mw.g=function(a){return a};mw.h=function(a){return a};mw.O=3;
function nw(a){a=gw(a);if("undefined"===typeof Wv||"undefined"===typeof Xv||"undefined"===typeof Yv||"undefined"===typeof cw)cw=function(b,c){this.G=b;this.Uf=c;this.l=393217;this.I=0},cw.prototype.U=function(){return function(b,c){return new cw(this.G,c)}}(a),cw.prototype.S=function(){return function(){return this.Uf}}(a),cw.prototype.nc=function(){return function(){return this}}(a),cw.prototype.call=function(){return function(){function b(e,f,h,k){e=this;e=e.G.h?e.G.h(f,h,k):e.G.call(null,f,h,k);
return Md(e)?Ld(e):e}function c(e,f,h){e=this;e=e.G.g?e.G.g(f,h):e.G.call(null,f,h);return Md(e)?Ld(e):e}var d=null;d=function(e,f,h,k){switch(arguments.length){case 1:return null;case 2:return f;case 3:return c.call(this,e,f,h);case 4:return b.call(this,e,f,h,k)}throw Error("Invalid arity: "+(arguments.length-1));};d.a=function(){return null};d.g=function(e,f){return f};d.h=c;d.J=b;return d}()}(a),cw.prototype.apply=function(){return function(b,c){return this.call.apply(this,[this].concat(Vb(c)))}}(a),
cw.prototype.o=function(){return function(){return null}}(a),cw.prototype.a=function(){return function(b){return b}}(a),cw.prototype.g=function(){return function(b,c){b=this.G.g?this.G.g(b,c):this.G.call(null,b,c);return Md(b)?Ld(b):b}}(a),cw.prototype.h=function(){return function(b,c,d){b=this.G.h?this.G.h(b,c,d):this.G.call(null,b,c,d);return Md(b)?Ld(b):b}}(a),cw.Ab=function(){return function(){return new V(null,2,5,X,[Gl,Bl],null)}}(a),cw.qb=!0,cw.ib="net.cgrand.xforms/t_net$cgrand$xforms34828",
cw.ub=function(){return function(b,c){return Uc(c,"net.cgrand.xforms/t_net$cgrand$xforms34828")}}(a);return new cw(a,null)}var ow=function ow(a){switch(arguments.length){case 1:return ow.a(arguments[0]);case 2:return ow.g(arguments[0],arguments[1]);case 3:return ow.h(arguments[0],arguments[1],arguments[2]);case 4:return ow.J(arguments[0],arguments[1],arguments[2],arguments[3]);default:throw Error(["Invalid arity: ",I.a(arguments.length)].join(""));}};ow.a=function(a){return ow.J(null,null,$g,a)};
ow.g=function(a,b){return ow.J(a,Qe,$g,b)};ow.h=function(a,b,c){return ow.J(a,b,$g,c)};
ow.J=function(a,b,c,d){return function(e){return function(f){var h=nw(f),k=null==e?ag(h):Dd.g(Km,e)?function(n,r){return function(p){return function(t){return function(){function x(H,P){return t.h?t.h(H,p,P):t.call(null,H,p,P)}var v=null;v=function(H,P){switch(arguments.length){case 1:return H;case 2:return x.call(this,H,P)}throw Error("Invalid arity: "+arguments.length);};v.a=function(H){return H};v.g=x;return v}()}(n,r)}}(h,e):function(n,r){return function(p){return function(t,x){return function(){function v(P,
ea){ea=x.g?x.g(p,ea):x.call(null,p,ea);return t.g?t.g(P,ea):t.call(null,P,ea)}var H=null;H=function(P,ea){switch(arguments.length){case 1:return P;case 2:return v.call(this,P,ea)}throw Error("Invalid arity: "+arguments.length);};H.a=function(P){return P};H.g=v;return H}()}(n,r)}}(h,e),l=new ig(Yc(If));if(null==a&&null==b){if("undefined"===typeof Wv||"undefined"===typeof Xv||"undefined"===typeof Yv||"undefined"===typeof dw)dw=function(n,r,p,t,x,v,H,P,ea){this.lb=n;this.ob=r;this.ye=p;this.ma=t;this.G=
x;this.we=v;this.wa=H;this.N=P;this.Vf=ea;this.l=393217;this.I=0},dw.prototype.U=function(){return function(n,r){return new dw(this.lb,this.ob,this.ye,this.ma,this.G,this.we,this.wa,this.N,r)}}(h,k,l,e),dw.prototype.S=function(){return function(){return this.Vf}}(h,k,l,e),dw.prototype.nc=function(){return function(){return this}}(h,k,l,e),dw.prototype.call=function(n,r,p,t){return function(){function x(ca,ma,T,u){ca=this;var y=J.g(Dc(ca.N),T);B(y)||(y=ca.wa.a?ca.wa.a(T):ca.wa.call(null,T),y=ca.ma.a?
ca.ma.a(y):ca.ma.call(null,y),id(ca.N,sf(Dc(ca.N),T,y)));ma=y.g?y.g(ma,u):y.call(null,ma,u);if(Md(ma)){if(Md(Dc(ma)))return jg(ca.N),Dc(ma);id(ca.N,sf(Dc(ca.N),T,mw));ca=Dc(ma);return y.a?y.a(ca):y.call(null,ca)}return ma}function v(ca,ma,T){ca=this;var u=S(T,0,null);T=S(T,1,null);var y=J.g(Dc(ca.N),u);B(y)||(y=ca.wa.a?ca.wa.a(u):ca.wa.call(null,u),y=ca.ma.a?ca.ma.a(y):ca.ma.call(null,y),id(ca.N,sf(Dc(ca.N),u,y)));ma=y.g?y.g(ma,T):y.call(null,ma,T);if(Md(ma)){if(Md(Dc(ma)))return jg(ca.N),Dc(ma);
id(ca.N,sf(Dc(ca.N),u,mw));ca=Dc(ma);return y.a?y.a(ca):y.call(null,ca)}return ma}function H(ca,ma){ca=this;var T=Dc(ca.N);if(T===ca.N)return null;id(ca.N,ca.N);ma=Xb(function(){return function(u,y){return y.a?y.a(u):y.call(null,u)}}(T,T,this,this,n,r,p,t),ma,wh($c(T)));return ca.G.a?ca.G.a(ma):ca.G.call(null,ma)}function P(ca){ca=this;return ca.G.o?ca.G.o():ca.G.call(null)}var ea=null;ea=function(ca,ma,T,u){switch(arguments.length){case 1:return P.call(this,ca);case 2:return H.call(this,ca,ma);case 3:return v.call(this,
ca,ma,T);case 4:return x.call(this,ca,ma,T,u)}throw Error("Invalid arity: "+(arguments.length-1));};ea.a=P;ea.g=H;ea.h=v;ea.J=x;return ea}()}(h,k,l,e),dw.prototype.apply=function(){return function(n,r){return this.call.apply(this,[this].concat(Vb(r)))}}(h,k,l,e),dw.prototype.g=function(){return function(n,r){var p=S(r,0,null);r=S(r,1,null);var t=J.g(Dc(this.N),p);B(t)||(t=this.wa.a?this.wa.a(p):this.wa.call(null,p),t=this.ma.a?this.ma.a(t):this.ma.call(null,t),id(this.N,sf(Dc(this.N),p,t)));n=t.g?
t.g(n,r):t.call(null,n,r);if(Md(n)){if(Md(Dc(n)))return jg(this.N),Dc(n);id(this.N,sf(Dc(this.N),p,mw));p=Dc(n);return t.a?t.a(p):t.call(null,p)}return n}}(h,k,l,e),dw.prototype.o=function(){return function(){return this.G.o?this.G.o():this.G.call(null)}}(h,k,l,e),dw.prototype.a=function(n,r,p,t){return function(x){var v=Dc(this.N);if(v===this.N)return null;id(this.N,this.N);x=Xb(function(){return function(H,P){return P.a?P.a(H):P.call(null,H)}}(v,v,this,n,r,p,t),x,wh($c(v)));return this.G.a?this.G.a(x):
this.G.call(null,x)}}(h,k,l,e),dw.prototype.h=function(){return function(n,r,p){var t=J.g(Dc(this.N),r);B(t)||(t=this.wa.a?this.wa.a(r):this.wa.call(null,r),t=this.ma.a?this.ma.a(t):this.ma.call(null,t),id(this.N,sf(Dc(this.N),r,t)));n=t.g?t.g(n,p):t.call(null,n,p);if(Md(n)){if(Md(Dc(n)))return jg(this.N),Dc(n);id(this.N,sf(Dc(this.N),r,mw));r=Dc(n);return t.a?t.a(r):t.call(null,r)}return n}}(h,k,l,e),dw.Ab=function(){return function(){return new V(null,9,5,X,[Wk,pm,Hl,Dm,Gl,Rl,wm,El,ul],null)}}(h,
k,l,e),dw.qb=!0,dw.ib="net.cgrand.xforms/t_net$cgrand$xforms34836",dw.ub=function(){return function(n,r){return Uc(r,"net.cgrand.xforms/t_net$cgrand$xforms34836")}}(h,k,l,e);return new dw(a,b,e,d,f,h,k,l,null)}var m=B(a)?a:kw,q=B(b)?b:lw;if("undefined"===typeof Wv||"undefined"===typeof Xv||"undefined"===typeof Yv||"undefined"===typeof ew)ew=function(n,r,p,t,x,v,H,P,ea){this.lb=n;this.ob=r;this.ye=p;this.ma=t;this.G=x;this.we=v;this.wa=H;this.N=P;this.Wf=ea;this.l=393217;this.I=0},ew.prototype.U=function(){return function(n,
r){return new ew(this.lb,this.ob,this.ye,this.ma,this.G,this.we,this.wa,this.N,r)}}(m,q,h,k,l,e),ew.prototype.S=function(){return function(){return this.Wf}}(m,q,h,k,l,e),ew.prototype.nc=function(){return function(){return this}}(m,q,h,k,l,e),ew.prototype.call=function(n,r,p,t,x,v){return function(){function H(T,u,y,z){T=this;var A=new V(null,2,5,X,[y,z],null),C=T.lb.a?T.lb.a(A):T.lb.call(null,A),D=function(){var G=J.g(Dc(T.N),C);if(B(G))return G;G=T.wa.a?T.wa.a(C):T.wa.call(null,C);G=T.ma.a?T.ma.a(G):
T.ma.call(null,G);id(T.N,sf(Dc(T.N),C,G));return G}();y=function(){var G=T.ob.a?T.ob.a(A):T.ob.call(null,A);return D.g?D.g(u,G):D.call(null,u,G)}();if(Md(y)){if(Md(Dc(y)))return jg(T.N),Dc(y);id(T.N,sf(Dc(T.N),C,mw));y=Dc(y);return D.a?D.a(y):D.call(null,y)}return y}function P(T,u,y){T=this;var z=T.lb.a?T.lb.a(y):T.lb.call(null,y),A=function(){var D=J.g(Dc(T.N),z);if(B(D))return D;D=T.wa.a?T.wa.a(z):T.wa.call(null,z);D=T.ma.a?T.ma.a(D):T.ma.call(null,D);id(T.N,sf(Dc(T.N),z,D));return D}(),C=function(){var D=
T.ob.a?T.ob.a(y):T.ob.call(null,y);return A.g?A.g(u,D):A.call(null,u,D)}();if(Md(C)){if(Md(Dc(C)))return jg(T.N),Dc(C);id(T.N,sf(Dc(T.N),z,mw));C=Dc(C);return A.a?A.a(C):A.call(null,C)}return C}function ea(T,u){T=this;var y=Dc(T.N);if(y===T.N)return null;id(T.N,T.N);u=Xb(function(){return function(z,A){return A.a?A.a(z):A.call(null,z)}}(y,y,this,this,n,r,p,t,x,v),u,wh($c(y)));return T.G.a?T.G.a(u):T.G.call(null,u)}function ca(T){T=this;return T.G.o?T.G.o():T.G.call(null)}var ma=null;ma=function(T,
u,y,z){switch(arguments.length){case 1:return ca.call(this,T);case 2:return ea.call(this,T,u);case 3:return P.call(this,T,u,y);case 4:return H.call(this,T,u,y,z)}throw Error("Invalid arity: "+(arguments.length-1));};ma.a=ca;ma.g=ea;ma.h=P;ma.J=H;return ma}()}(m,q,h,k,l,e),ew.prototype.apply=function(){return function(n,r){return this.call.apply(this,[this].concat(Vb(r)))}}(m,q,h,k,l,e),ew.prototype.h=function(){return function(n,r,p){var t=this,x=new V(null,2,5,X,[r,p],null),v=t.lb.a?t.lb.a(x):t.lb.call(null,
x),H=function(){var P=J.g(Dc(t.N),v);if(B(P))return P;P=t.wa.a?t.wa.a(v):t.wa.call(null,v);P=t.ma.a?t.ma.a(P):t.ma.call(null,P);id(t.N,sf(Dc(t.N),v,P));return P}();r=function(){var P=t.ob.a?t.ob.a(x):t.ob.call(null,x);return H.g?H.g(n,P):H.call(null,n,P)}();if(Md(r)){if(Md(Dc(r)))return jg(t.N),Dc(r);id(t.N,sf(Dc(t.N),v,mw));r=Dc(r);return H.a?H.a(r):H.call(null,r)}return r}}(m,q,h,k,l,e),ew.prototype.o=function(){return function(){return this.G.o?this.G.o():this.G.call(null)}}(m,q,h,k,l,e),ew.prototype.a=
function(n,r,p,t,x,v){return function(H){var P=Dc(this.N);if(P===this.N)return null;id(this.N,this.N);H=Xb(function(){return function(ea,ca){return ca.a?ca.a(ea):ca.call(null,ea)}}(P,P,this,n,r,p,t,x,v),H,wh($c(P)));return this.G.a?this.G.a(H):this.G.call(null,H)}}(m,q,h,k,l,e),ew.prototype.g=function(){return function(n,r){var p=this,t=p.lb.a?p.lb.a(r):p.lb.call(null,r),x=function(){var H=J.g(Dc(p.N),t);if(B(H))return H;H=p.wa.a?p.wa.a(t):p.wa.call(null,t);H=p.ma.a?p.ma.a(H):p.ma.call(null,H);id(p.N,
sf(Dc(p.N),t,H));return H}(),v=function(){var H=p.ob.a?p.ob.a(r):p.ob.call(null,r);return x.g?x.g(n,H):x.call(null,n,H)}();if(Md(v)){if(Md(Dc(v)))return jg(p.N),Dc(v);id(p.N,sf(Dc(p.N),t,mw));v=Dc(v);return x.a?x.a(v):x.call(null,v)}return v}}(m,q,h,k,l,e),ew.Ab=function(){return function(){return new V(null,9,5,X,[Wk,pm,Hl,Dm,Gl,Rl,wm,El,al],null)}}(m,q,h,k,l,e),ew.qb=!0,ew.ib="net.cgrand.xforms/t_net$cgrand$xforms34862",ew.ub=function(){return function(n,r){return Uc(r,"net.cgrand.xforms/t_net$cgrand$xforms34862")}}(m,
q,h,k,l,e);return new ew(m,q,e,d,f,h,k,l,null)}}($g===c?Km:c)};ow.O=4;var pw=function pw(a){return Af(Gi,function(){function c(e){var f=null;if(0<arguments.length){f=0;for(var h=Array(arguments.length-0);f<h.length;)h[f]=arguments[f+0],++f;f=new Ad(h,0,null)}return d.call(this,f)}function d(e){return Xf(ze,e)?pw.a?pw.a(e):pw.call(null,e):he(e)}c.O=0;c.R=function(e){e=M(e);return d(e)};c.A=d;return c}(),a)};function qw(a){return function(b){b=jw(b);b=S(b,0,null);S(b,0,null);b=S(b,1,null);return Ob(Yf(Mb,kg.g(J.g(b,km),a)))?b:null}}
function rw(a){return bg.A(hw(),kg.a(pw),kg.a(qw(a)),R([kg.a(tj)]))}function sw(a){return bg.h(ow.g(vh,rw(a)),rg($f(function(b){S(b,0,null);return null==S(b,1,null)})),kg.a(function(b){return J.g(b,1)}))}
function tw(a,b){var c=new V(null,2,5,X,[Nv,Vv],null);return function(d,e){var f=fo(new An,null),h=fo(1,null);Ln(function(k,l){return function(){var m=function(){return function(n){return function(){function r(x){for(;;){a:try{for(;;){var v=n(x);if(!af(v,xk)){var H=v;break a}}}catch(P){if(P instanceof Object)x[5]=P,co(x),H=xk;else throw P;}if(!af(H,xk))return H}}function p(){var x=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,
null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];x[0]=t;x[1]=1;return x}var t=null;t=function(x){switch(arguments.length){case 0:return p.call(this);case 1:return r.call(this,x)}throw Error("Invalid arity: "+arguments.length);};t.o=p;t.a=r;return t}()}(function(n,r){return function(p){var t=p[1];if(7===t){var x=p[7],v=p;v[1]=B(x)?10:11;return xk}if(20===t){var H=p[8],P=zf(Di,H),ea=v=p;ea[2]=P;ea[1]=22;return xk}if(27===t){var ca=p[9],ma=
p[10],T=p[11],u=p[12],y=p[13],z=S(u,0,null),A=qn(y),C=qn(ca),D=Bd(T),G=N(O(T)),E=rf.g(ma,z),F=G;p[10]=E;p[14]=C;p[15]=F;p[11]=D;p[16]=A;var W=v=p;W[2]=null;W[1]=4;return xk}if(1===t)return v=p,$n(v,3,b);if(24===t){var U=v=p;U[2]=null;U[1]=25;return xk}if(4===t){F=p[15];T=p[11];var Y=S(F,0,null);x=S(F,1,null);var aa=null==N(T);p[7]=x;p[17]=Y;v=p;v[1]=B(aa)?6:7;return xk}if(15===t){var da=v=p;da[2]=!1;da[1]=16;return xk}if(21===t){H=p[8];var ha=v=p;ha[2]=H;ha[1]=22;return xk}if(31===t){var ja=p[18],
ta=Dd.g(ja,Sj);v=p;v[1]=ta?34:35;return xk}if(32===t){var za=p[2],Ha=v=p;Ha[2]=za;Ha[1]=29;return xk}if(33===t){ca=p[9];var Da=p[19];y=p[13];var lb=p[2],Pb=qn(Da),de=qn(d),Pi=qn(r),yw=qn(y),zw=qn(ca);p[20]=lb;p[21]=Pi;p[22]=de;p[23]=yw;p[24]=Pb;var xr=v=p;xr[2]=zw;xr[1]=32;return xk}if(13===t){H=p[8];var yr=p[2],Aw=Ob(null==yr);p[8]=yr;v=p;v[1]=Aw?14:15;return xk}if(22===t){var zr=p[25],yg=p[2],Lh=J.g(yg,Kl),Tm=J.g(yg,Ul),Um=J.g(yg,Tk),Vm=J.g(yg,hl),Bw=Dd.g(Rb(yg),Fb);p[26]=Lh;p[27]=Tm;p[28]=Um;p[25]=
yg;p[29]=Vm;v=p;v[1]=Bw?23:24;return xk}if(36===t){var Cw=p[2],Ar=v=p;Ar[2]=Cw;Ar[1]=32;return xk}if(29===t){var Dw=p[2],Br=v=p;Br[2]=Dw;Br[1]=25;return xk}if(6===t){ma=p[10];var Mh=p[30],Ew=mj(R(["Working on it ..."])),Fw=Dc(Mh),Gw=sw(Fw),Hw=$c(ma),Iw=Oe(qf,Hw),Jw=qj(R([Gw,Iw])),Kw={type:"FeatureCollection",features:Wb(Jw)};p[31]=Ew;v=p;return ao(v,9,d,Kw)}if(28===t){ca=p[9];ja=p[18];var Lw=Dd.g(ja,ca);v=p;v[1]=Lw?30:31;return xk}if(25===t)return zr=p[25],p[32]=p[2],v=p,ao(v,37,e,zr);if(34===t){var Wm=
p[33],Cr=v=p;Cr[2]=Wm;Cr[1]=36;return xk}if(17===t){var Dr=v=p;Dr[2]=!0;Dr[1]=19;return xk}if(3===t){var Mw=p[2];v=p;return ao(v,2,r,Mw)}if(12===t)return Da=p[19],p[34]=p[2],v=p,$n(v,13,Da);if(2===t){var Nw=p[2];Da=fo(1,null);Mh=fg(je);var Xm=N(c),Ow=S(Xm,0,null),Pw=S(Xm,1,null),Qw=Yc(je);T=c;F=Xm;ma=Qw;p[10]=ma;p[35]=Pw;p[15]=F;p[11]=T;p[19]=Da;p[30]=Mh;p[36]=Ow;p[37]=Nw;var Er=v=p;Er[2]=null;Er[1]=4;return xk}if(23===t){ca=p[9];Lh=p[26];Tm=p[27];y=p[13];Um=p[28];Mh=p[30];Vm=p[29];var gk=fo(1,Um),
hk=fo(1,null),Rw=hg.h(Mh,ie,Vm),Fr=qo(new V(null,1,5,X,[Tm],null)),Sw=Lh.h?Lh.h(Fr,gk,hk):Lh.call(null,Fr,gk,hk),Tw=new V(null,2,5,X,[gk,hk],null);p[9]=hk;p[38]=Sw;p[39]=Rw;p[13]=gk;v=p;return ro(v,26,Tw)}if(35===t){var Gr=v=p;Gr[2]=null;Gr[1]=36;return xk}if(19===t){var Uw=p[2],Hr=v=p;Hr[2]=Uw;Hr[1]=16;return xk}if(11===t){Da=p[19];Y=p[17];var Vw=Y.g?Y.g(r,Da):Y.call(null,r,Da),Ir=v=p;Ir[2]=Vw;Ir[1]=12;return xk}if(9===t){Da=p[19];var Ww=p[2],Xw=qn(Da),Yw=qn(r);p[40]=Ww;p[41]=Xw;var Jr=v=p;Jr[2]=
Yw;Jr[1]=8;return xk}if(5===t){var Zw=p[2];v=p;return bo(v,Zw)}if(14===t){H=p[8];var $w=w===H.T,ax=H.l&64||$w;v=p;v[1]=B(ax)?17:18;return xk}if(26===t){u=p[12];y=p[13];ja=p[18];var Ym=p[2];Wm=S(Ym,0,null);var Kr=S(Ym,1,null),bx=Dd.g(Kr,y);p[12]=Ym;p[18]=Kr;p[33]=Wm;v=p;v[1]=bx?27:28;return xk}if(16===t){var cx=p[2];v=p;v[1]=B(cx)?20:21;return xk}if(30===t){u=p[12];var dx=S(u,0,null);v=p;return ao(v,33,e,dx)}if(10===t){Da=p[19];Y=p[17];var Zm=Y.a?Y.a(a):Y.call(null,a),ex=Zm.g?Zm.g(r,Da):Zm.call(null,
r,Da),Lr=v=p;Lr[2]=ex;Lr[1]=12;return xk}if(18===t){var Mr=v=p;Mr[2]=!1;Mr[1]=19;return xk}if(37===t){Da=p[19];var fx=p[2],gx=qn(Da),hx=qn(d),ix=qn(r),jx=qn(e);p[42]=gx;p[43]=ix;p[44]=fx;p[45]=hx;var Nr=v=p;Nr[2]=jx;Nr[1]=8;return xk}if(8===t){var kx=p[2],Or=v=p;Or[2]=kx;Or[1]=5;return xk}return null}}(k,l),k,l)}(),q=function(){var n=m.o?m.o():m.call(null);n[6]=k;return n}();return Zn(q)}}(h,f));return h}};var uw=function(){function a(c){var d=null;if(0<arguments.length){d=0;for(var e=Array(arguments.length-0);d<e.length;)e[d]=arguments[d+0],++d;d=new Ad(e,0,null)}return b.call(this,d)}function b(c){c=Wg(c);try{if(Be(c)&&1===Q(c))try{var d=Xd(c,0);if(null!=d?d.l&256||w===d.Zc||(d.l?0:Qb(oc,d)):Qb(oc,d))try{var e=J.h(d,Gm,Yk);if(Ef(e,Yk))try{var f=J.h(d,nl,Yk);if(Ef(f,Yk))try{var h=J.h(d,Qm,Yk);if(Ef(h,Yk))try{var k=J.h(d,Qk,Yk);if(Ef(k,Yk))try{var l=J.h(d,bn,Yk);if(Ef(l,Yk))try{var m=J.h(d,Ck,Yk);if(Ef(m,
Yk))return sl;throw Z;}catch(x){if(x instanceof Error){var q=x;if(q===Z)throw Z;throw q;}throw x;}else throw Z;}catch(x){if(x instanceof Error)if(q=x,q===Z)try{m=J.h(d,Ck,Yk);if(Ef(m,Yk))return sl;throw Z;}catch(v){if(v instanceof Error){var n=v;if(n===Z)throw Z;throw n;}throw v;}else throw q;else throw x;}else throw Z;}catch(x){if(x instanceof Error){q=x;if(q===Z)throw Z;throw q;}throw x;}else throw Z;}catch(x){if(x instanceof Error){q=x;if(q===Z)throw Z;throw q;}throw x;}else throw Z;}catch(x){if(x instanceof
Error){q=x;if(q===Z)throw Z;throw q;}throw x;}else throw Z;}catch(x){if(x instanceof Error)if(q=x,q===Z)try{if(f=J.h(d,nl,Yk),Ef(f,Yk))try{if(h=J.h(d,Qm,Yk),Ef(h,Yk))try{if(k=J.h(d,Qk,Yk),Ef(k,Yk))try{if(l=J.h(d,bn,Yk),Ef(l,Yk))try{m=J.h(d,Ck,Yk);if(Ef(m,Yk))return lm;throw Z;}catch(v){if(v instanceof Error){n=v;if(n===Z)throw Z;throw n;}throw v;}else throw Z;}catch(v){if(v instanceof Error)if(n=v,n===Z)try{m=J.h(d,Ck,Yk);if(Ef(m,Yk))return lm;throw Z;}catch(H){if(H instanceof Error){var r=H;if(r===
Z)throw Z;throw r;}throw H;}else throw n;else throw v;}else throw Z;}catch(v){if(v instanceof Error)if(n=v,n===Z)try{if(e=J.h(d,Gm,Yk),Ef(e,Yk))try{if(l=J.h(d,bn,Yk),Ef(l,Yk))try{m=J.h(d,Ck,Yk);if(Ef(m,Yk))return Wl;throw Z;}catch(H){if(H instanceof Error){r=H;if(r===Z)throw Z;throw r;}throw H;}else throw Z;}catch(H){if(H instanceof Error){r=H;if(r===Z)throw Z;throw r;}throw H;}else throw Z;}catch(H){if(H instanceof Error)if(r=H,r===Z)try{if(l=J.h(d,bn,Yk),Ef(l,Yk))try{m=J.h(d,Ck,Yk);if(Ef(m,Yk))return Wl;
throw Z;}catch(P){if(P instanceof Error){var p=P;if(p===Z)throw Z;throw p;}throw P;}else throw Z;}catch(P){if(P instanceof Error){p=P;if(p===Z)throw Z;throw p;}throw P;}else throw r;else throw H;}else throw n;else throw v;}else throw Z;}catch(v){if(v instanceof Error){n=v;if(n===Z)throw Z;throw n;}throw v;}else throw Z;}catch(v){if(v instanceof Error)if(n=v,n===Z)try{if(e=J.h(d,Gm,Yk),Ef(e,Yk))try{if(h=J.h(d,Qm,Yk),Ef(h,Yk))try{m=J.h(d,Ck,Yk);if(Ef(m,Yk))return xm;throw Z;}catch(H){if(H instanceof
Error){r=H;if(r===Z)throw Z;throw r;}throw H;}else throw Z;}catch(H){if(H instanceof Error){r=H;if(r===Z)throw Z;throw r;}throw H;}else throw Z;}catch(H){if(H instanceof Error)if(r=H,r===Z)try{if(h=J.h(d,Qm,Yk),Ef(h,Yk))try{m=J.h(d,Ck,Yk);if(Ef(m,Yk))return Ek;throw Z;}catch(P){if(P instanceof Error){p=P;if(p===Z)throw Z;throw p;}throw P;}else throw Z;}catch(P){if(P instanceof Error){p=P;if(p===Z)throw Z;throw p;}throw P;}else throw r;else throw H;}else throw n;else throw v;}else throw q;else throw x;
}else throw Z;}catch(x){if(x instanceof Error){q=x;if(q===Z)throw Z;throw q;}throw x;}else throw Z;}catch(x){if(x instanceof Error)if(q=x,q===Z)try{if(Be(c)&&0<=Q(c))try{var t=eh(c,0,0);if(Be(t)&&0===Q(t))return eh(c,0,Q(c)),null;throw Z;}catch(v){if(v instanceof Error){n=v;if(n===Z)throw Z;throw n;}throw v;}else throw Z;}catch(v){if(v instanceof Error){n=v;if(n===Z)throw Error(["No matching clause: ",I.a(c)].join(""));throw n;}throw v;}else throw q;else throw x;}}a.O=0;a.R=function(c){c=M(c);return b(c)};
a.A=b;return a}();
function vw(a){return function(b,c,d){return go(b,function(e){var f=uw.A(R([e]));mj(R([f]));switch(f instanceof K?f.cb:null){case "stats+geos":return e=tw(a,qo(new V(null,1,5,X,[e],null))),e.g?e.g(c,d):e.call(null,c,d);case "stats-only":return Tv(qo(new V(null,1,5,X,[e],null)),c,d);case "geos-only":return e=qo(new V(null,1,5,X,[e],null)),f=Iv(a),f.h?f.h(e,c,d):f.call(null,e,c,d);case "geocodes":return jo(c,$u(e));case "no-values":return jo(d,"When using `predicates`, you must also supply at least one value to `values`");default:return mj(R(["No matching clause for the arguments provided.",
"Please check arguments against requirements"]))}})}}var ww=Yu(Ak,"configuration",fg(""),fg(je),fg(If)),xw=fo(new An,null),lx=qo(new V(null,1,5,X,["https://cors-e.herokuapp.com/https://raw.githubusercontent.com/uscensusbureau/citysdk/master/v2/src/configs/geojson/index.edn"],null)),mx=fo(1,kg.a(Xu));ww.J?ww.J(lx,xw,mx,Am):ww.call(null,lx,xw,mx,Am);shadow$umd$export=function(a,b){var c=fo(1,null),d=fo(1,null),e=fo(1,kg.a(Xu));return go(xw,function(f,h,k){return function(l){var m=Av(l);m.g?m.g(a,f):m.call(null,a,f);return go(f,function(q,n,r){return function(p){if(Dd.g(Rb(p),Fb)){p=qo(new V(null,1,5,X,[p],null));var t=vw(l);t.h?t.h(p,n,r):t.call(null,p,n,r);go(r,function(){return function(x){return b.g?b.g(x,null):b.call(null,x,null)}}(q,n,r));return go(n,function(){return function(x){return b.g?b.g(null,x):b.call(null,null,x)}}(q,n,r))}return b.g?
b.g(p,null):b.call(null,p,null)}}(f,h,k))}}(c,d,e))};

  return shadow$umd$export;
});

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {},require("buffer").Buffer)
},{"buffer":4,"xmlhttprequest":112,"xregexp":120}],50:[function(require,module,exports){
require('../../modules/es6.array.is-array');
module.exports = require('../../modules/_core').Array.isArray;

},{"../../modules/_core":60,"../../modules/es6.array.is-array":106}],51:[function(require,module,exports){
require('../modules/web.dom.iterable');
require('../modules/es6.string.iterator');
module.exports = require('../modules/core.get-iterator');

},{"../modules/core.get-iterator":105,"../modules/es6.string.iterator":110,"../modules/web.dom.iterable":111}],52:[function(require,module,exports){
require('../../modules/es6.object.create');
var $Object = require('../../modules/_core').Object;
module.exports = function create(P, D) {
  return $Object.create(P, D);
};

},{"../../modules/_core":60,"../../modules/es6.object.create":108}],53:[function(require,module,exports){
require('../modules/es6.parse-int');
module.exports = require('../modules/_core').parseInt;

},{"../modules/_core":60,"../modules/es6.parse-int":109}],54:[function(require,module,exports){
module.exports = function (it) {
  if (typeof it != 'function') throw TypeError(it + ' is not a function!');
  return it;
};

},{}],55:[function(require,module,exports){
module.exports = function () { /* empty */ };

},{}],56:[function(require,module,exports){
var isObject = require('./_is-object');
module.exports = function (it) {
  if (!isObject(it)) throw TypeError(it + ' is not an object!');
  return it;
};

},{"./_is-object":75}],57:[function(require,module,exports){
// false -> Array#indexOf
// true  -> Array#includes
var toIObject = require('./_to-iobject');
var toLength = require('./_to-length');
var toAbsoluteIndex = require('./_to-absolute-index');
module.exports = function (IS_INCLUDES) {
  return function ($this, el, fromIndex) {
    var O = toIObject($this);
    var length = toLength(O.length);
    var index = toAbsoluteIndex(fromIndex, length);
    var value;
    // Array#includes uses SameValueZero equality algorithm
    // eslint-disable-next-line no-self-compare
    if (IS_INCLUDES && el != el) while (length > index) {
      value = O[index++];
      // eslint-disable-next-line no-self-compare
      if (value != value) return true;
    // Array#indexOf ignores holes, Array#includes - not
    } else for (;length > index; index++) if (IS_INCLUDES || index in O) {
      if (O[index] === el) return IS_INCLUDES || index || 0;
    } return !IS_INCLUDES && -1;
  };
};

},{"./_to-absolute-index":96,"./_to-iobject":98,"./_to-length":99}],58:[function(require,module,exports){
// getting tag from 19.1.3.6 Object.prototype.toString()
var cof = require('./_cof');
var TAG = require('./_wks')('toStringTag');
// ES3 wrong here
var ARG = cof(function () { return arguments; }()) == 'Arguments';

// fallback for IE11 Script Access Denied error
var tryGet = function (it, key) {
  try {
    return it[key];
  } catch (e) { /* empty */ }
};

module.exports = function (it) {
  var O, T, B;
  return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (T = tryGet(O = Object(it), TAG)) == 'string' ? T
    // builtinTag case
    : ARG ? cof(O)
    // ES3 arguments fallback
    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
};

},{"./_cof":59,"./_wks":103}],59:[function(require,module,exports){
var toString = {}.toString;

module.exports = function (it) {
  return toString.call(it).slice(8, -1);
};

},{}],60:[function(require,module,exports){
var core = module.exports = { version: '2.6.5' };
if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef

},{}],61:[function(require,module,exports){
// optional / simple context binding
var aFunction = require('./_a-function');
module.exports = function (fn, that, length) {
  aFunction(fn);
  if (that === undefined) return fn;
  switch (length) {
    case 1: return function (a) {
      return fn.call(that, a);
    };
    case 2: return function (a, b) {
      return fn.call(that, a, b);
    };
    case 3: return function (a, b, c) {
      return fn.call(that, a, b, c);
    };
  }
  return function (/* ...args */) {
    return fn.apply(that, arguments);
  };
};

},{"./_a-function":54}],62:[function(require,module,exports){
// 7.2.1 RequireObjectCoercible(argument)
module.exports = function (it) {
  if (it == undefined) throw TypeError("Can't call method on  " + it);
  return it;
};

},{}],63:[function(require,module,exports){
// Thank's IE8 for his funny defineProperty
module.exports = !require('./_fails')(function () {
  return Object.defineProperty({}, 'a', { get: function () { return 7; } }).a != 7;
});

},{"./_fails":67}],64:[function(require,module,exports){
var isObject = require('./_is-object');
var document = require('./_global').document;
// typeof document.createElement is 'object' in old IE
var is = isObject(document) && isObject(document.createElement);
module.exports = function (it) {
  return is ? document.createElement(it) : {};
};

},{"./_global":68,"./_is-object":75}],65:[function(require,module,exports){
// IE 8- don't enum bug keys
module.exports = (
  'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'
).split(',');

},{}],66:[function(require,module,exports){
var global = require('./_global');
var core = require('./_core');
var ctx = require('./_ctx');
var hide = require('./_hide');
var has = require('./_has');
var PROTOTYPE = 'prototype';

var $export = function (type, name, source) {
  var IS_FORCED = type & $export.F;
  var IS_GLOBAL = type & $export.G;
  var IS_STATIC = type & $export.S;
  var IS_PROTO = type & $export.P;
  var IS_BIND = type & $export.B;
  var IS_WRAP = type & $export.W;
  var exports = IS_GLOBAL ? core : core[name] || (core[name] = {});
  var expProto = exports[PROTOTYPE];
  var target = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE];
  var key, own, out;
  if (IS_GLOBAL) source = name;
  for (key in source) {
    // contains in native
    own = !IS_FORCED && target && target[key] !== undefined;
    if (own && has(exports, key)) continue;
    // export native or passed
    out = own ? target[key] : source[key];
    // prevent global pollution for namespaces
    exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
    // bind timers to global for call from export context
    : IS_BIND && own ? ctx(out, global)
    // wrap global constructors for prevent change them in library
    : IS_WRAP && target[key] == out ? (function (C) {
      var F = function (a, b, c) {
        if (this instanceof C) {
          switch (arguments.length) {
            case 0: return new C();
            case 1: return new C(a);
            case 2: return new C(a, b);
          } return new C(a, b, c);
        } return C.apply(this, arguments);
      };
      F[PROTOTYPE] = C[PROTOTYPE];
      return F;
    // make static versions for prototype methods
    })(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
    // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%
    if (IS_PROTO) {
      (exports.virtual || (exports.virtual = {}))[key] = out;
      // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%
      if (type & $export.R && expProto && !expProto[key]) hide(expProto, key, out);
    }
  }
};
// type bitmap
$export.F = 1;   // forced
$export.G = 2;   // global
$export.S = 4;   // static
$export.P = 8;   // proto
$export.B = 16;  // bind
$export.W = 32;  // wrap
$export.U = 64;  // safe
$export.R = 128; // real proto method for `library`
module.exports = $export;

},{"./_core":60,"./_ctx":61,"./_global":68,"./_has":69,"./_hide":70}],67:[function(require,module,exports){
module.exports = function (exec) {
  try {
    return !!exec();
  } catch (e) {
    return true;
  }
};

},{}],68:[function(require,module,exports){
// https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
var global = module.exports = typeof window != 'undefined' && window.Math == Math
  ? window : typeof self != 'undefined' && self.Math == Math ? self
  // eslint-disable-next-line no-new-func
  : Function('return this')();
if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef

},{}],69:[function(require,module,exports){
var hasOwnProperty = {}.hasOwnProperty;
module.exports = function (it, key) {
  return hasOwnProperty.call(it, key);
};

},{}],70:[function(require,module,exports){
var dP = require('./_object-dp');
var createDesc = require('./_property-desc');
module.exports = require('./_descriptors') ? function (object, key, value) {
  return dP.f(object, key, createDesc(1, value));
} : function (object, key, value) {
  object[key] = value;
  return object;
};

},{"./_descriptors":63,"./_object-dp":82,"./_property-desc":88}],71:[function(require,module,exports){
var document = require('./_global').document;
module.exports = document && document.documentElement;

},{"./_global":68}],72:[function(require,module,exports){
module.exports = !require('./_descriptors') && !require('./_fails')(function () {
  return Object.defineProperty(require('./_dom-create')('div'), 'a', { get: function () { return 7; } }).a != 7;
});

},{"./_descriptors":63,"./_dom-create":64,"./_fails":67}],73:[function(require,module,exports){
// fallback for non-array-like ES3 and non-enumerable old V8 strings
var cof = require('./_cof');
// eslint-disable-next-line no-prototype-builtins
module.exports = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
  return cof(it) == 'String' ? it.split('') : Object(it);
};

},{"./_cof":59}],74:[function(require,module,exports){
// 7.2.2 IsArray(argument)
var cof = require('./_cof');
module.exports = Array.isArray || function isArray(arg) {
  return cof(arg) == 'Array';
};

},{"./_cof":59}],75:[function(require,module,exports){
module.exports = function (it) {
  return typeof it === 'object' ? it !== null : typeof it === 'function';
};

},{}],76:[function(require,module,exports){
'use strict';
var create = require('./_object-create');
var descriptor = require('./_property-desc');
var setToStringTag = require('./_set-to-string-tag');
var IteratorPrototype = {};

// 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
require('./_hide')(IteratorPrototype, require('./_wks')('iterator'), function () { return this; });

module.exports = function (Constructor, NAME, next) {
  Constructor.prototype = create(IteratorPrototype, { next: descriptor(1, next) });
  setToStringTag(Constructor, NAME + ' Iterator');
};

},{"./_hide":70,"./_object-create":81,"./_property-desc":88,"./_set-to-string-tag":90,"./_wks":103}],77:[function(require,module,exports){
'use strict';
var LIBRARY = require('./_library');
var $export = require('./_export');
var redefine = require('./_redefine');
var hide = require('./_hide');
var Iterators = require('./_iterators');
var $iterCreate = require('./_iter-create');
var setToStringTag = require('./_set-to-string-tag');
var getPrototypeOf = require('./_object-gpo');
var ITERATOR = require('./_wks')('iterator');
var BUGGY = !([].keys && 'next' in [].keys()); // Safari has buggy iterators w/o `next`
var FF_ITERATOR = '@@iterator';
var KEYS = 'keys';
var VALUES = 'values';

var returnThis = function () { return this; };

module.exports = function (Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED) {
  $iterCreate(Constructor, NAME, next);
  var getMethod = function (kind) {
    if (!BUGGY && kind in proto) return proto[kind];
    switch (kind) {
      case KEYS: return function keys() { return new Constructor(this, kind); };
      case VALUES: return function values() { return new Constructor(this, kind); };
    } return function entries() { return new Constructor(this, kind); };
  };
  var TAG = NAME + ' Iterator';
  var DEF_VALUES = DEFAULT == VALUES;
  var VALUES_BUG = false;
  var proto = Base.prototype;
  var $native = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT];
  var $default = $native || getMethod(DEFAULT);
  var $entries = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined;
  var $anyNative = NAME == 'Array' ? proto.entries || $native : $native;
  var methods, key, IteratorPrototype;
  // Fix native
  if ($anyNative) {
    IteratorPrototype = getPrototypeOf($anyNative.call(new Base()));
    if (IteratorPrototype !== Object.prototype && IteratorPrototype.next) {
      // Set @@toStringTag to native iterators
      setToStringTag(IteratorPrototype, TAG, true);
      // fix for some old engines
      if (!LIBRARY && typeof IteratorPrototype[ITERATOR] != 'function') hide(IteratorPrototype, ITERATOR, returnThis);
    }
  }
  // fix Array#{values, @@iterator}.name in V8 / FF
  if (DEF_VALUES && $native && $native.name !== VALUES) {
    VALUES_BUG = true;
    $default = function values() { return $native.call(this); };
  }
  // Define iterator
  if ((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])) {
    hide(proto, ITERATOR, $default);
  }
  // Plug for library
  Iterators[NAME] = $default;
  Iterators[TAG] = returnThis;
  if (DEFAULT) {
    methods = {
      values: DEF_VALUES ? $default : getMethod(VALUES),
      keys: IS_SET ? $default : getMethod(KEYS),
      entries: $entries
    };
    if (FORCED) for (key in methods) {
      if (!(key in proto)) redefine(proto, key, methods[key]);
    } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
  }
  return methods;
};

},{"./_export":66,"./_hide":70,"./_iter-create":76,"./_iterators":79,"./_library":80,"./_object-gpo":84,"./_redefine":89,"./_set-to-string-tag":90,"./_wks":103}],78:[function(require,module,exports){
module.exports = function (done, value) {
  return { value: value, done: !!done };
};

},{}],79:[function(require,module,exports){
module.exports = {};

},{}],80:[function(require,module,exports){
module.exports = true;

},{}],81:[function(require,module,exports){
// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
var anObject = require('./_an-object');
var dPs = require('./_object-dps');
var enumBugKeys = require('./_enum-bug-keys');
var IE_PROTO = require('./_shared-key')('IE_PROTO');
var Empty = function () { /* empty */ };
var PROTOTYPE = 'prototype';

// Create object with fake `null` prototype: use iframe Object with cleared prototype
var createDict = function () {
  // Thrash, waste and sodomy: IE GC bug
  var iframe = require('./_dom-create')('iframe');
  var i = enumBugKeys.length;
  var lt = '<';
  var gt = '>';
  var iframeDocument;
  iframe.style.display = 'none';
  require('./_html').appendChild(iframe);
  iframe.src = 'javascript:'; // eslint-disable-line no-script-url
  // createDict = iframe.contentWindow.Object;
  // html.removeChild(iframe);
  iframeDocument = iframe.contentWindow.document;
  iframeDocument.open();
  iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
  iframeDocument.close();
  createDict = iframeDocument.F;
  while (i--) delete createDict[PROTOTYPE][enumBugKeys[i]];
  return createDict();
};

module.exports = Object.create || function create(O, Properties) {
  var result;
  if (O !== null) {
    Empty[PROTOTYPE] = anObject(O);
    result = new Empty();
    Empty[PROTOTYPE] = null;
    // add "__proto__" for Object.getPrototypeOf polyfill
    result[IE_PROTO] = O;
  } else result = createDict();
  return Properties === undefined ? result : dPs(result, Properties);
};

},{"./_an-object":56,"./_dom-create":64,"./_enum-bug-keys":65,"./_html":71,"./_object-dps":83,"./_shared-key":91}],82:[function(require,module,exports){
var anObject = require('./_an-object');
var IE8_DOM_DEFINE = require('./_ie8-dom-define');
var toPrimitive = require('./_to-primitive');
var dP = Object.defineProperty;

exports.f = require('./_descriptors') ? Object.defineProperty : function defineProperty(O, P, Attributes) {
  anObject(O);
  P = toPrimitive(P, true);
  anObject(Attributes);
  if (IE8_DOM_DEFINE) try {
    return dP(O, P, Attributes);
  } catch (e) { /* empty */ }
  if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
  if ('value' in Attributes) O[P] = Attributes.value;
  return O;
};

},{"./_an-object":56,"./_descriptors":63,"./_ie8-dom-define":72,"./_to-primitive":101}],83:[function(require,module,exports){
var dP = require('./_object-dp');
var anObject = require('./_an-object');
var getKeys = require('./_object-keys');

module.exports = require('./_descriptors') ? Object.defineProperties : function defineProperties(O, Properties) {
  anObject(O);
  var keys = getKeys(Properties);
  var length = keys.length;
  var i = 0;
  var P;
  while (length > i) dP.f(O, P = keys[i++], Properties[P]);
  return O;
};

},{"./_an-object":56,"./_descriptors":63,"./_object-dp":82,"./_object-keys":86}],84:[function(require,module,exports){
// 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
var has = require('./_has');
var toObject = require('./_to-object');
var IE_PROTO = require('./_shared-key')('IE_PROTO');
var ObjectProto = Object.prototype;

module.exports = Object.getPrototypeOf || function (O) {
  O = toObject(O);
  if (has(O, IE_PROTO)) return O[IE_PROTO];
  if (typeof O.constructor == 'function' && O instanceof O.constructor) {
    return O.constructor.prototype;
  } return O instanceof Object ? ObjectProto : null;
};

},{"./_has":69,"./_shared-key":91,"./_to-object":100}],85:[function(require,module,exports){
var has = require('./_has');
var toIObject = require('./_to-iobject');
var arrayIndexOf = require('./_array-includes')(false);
var IE_PROTO = require('./_shared-key')('IE_PROTO');

module.exports = function (object, names) {
  var O = toIObject(object);
  var i = 0;
  var result = [];
  var key;
  for (key in O) if (key != IE_PROTO) has(O, key) && result.push(key);
  // Don't enum bug & hidden keys
  while (names.length > i) if (has(O, key = names[i++])) {
    ~arrayIndexOf(result, key) || result.push(key);
  }
  return result;
};

},{"./_array-includes":57,"./_has":69,"./_shared-key":91,"./_to-iobject":98}],86:[function(require,module,exports){
// 19.1.2.14 / 15.2.3.14 Object.keys(O)
var $keys = require('./_object-keys-internal');
var enumBugKeys = require('./_enum-bug-keys');

module.exports = Object.keys || function keys(O) {
  return $keys(O, enumBugKeys);
};

},{"./_enum-bug-keys":65,"./_object-keys-internal":85}],87:[function(require,module,exports){
var $parseInt = require('./_global').parseInt;
var $trim = require('./_string-trim').trim;
var ws = require('./_string-ws');
var hex = /^[-+]?0[xX]/;

module.exports = $parseInt(ws + '08') !== 8 || $parseInt(ws + '0x16') !== 22 ? function parseInt(str, radix) {
  var string = $trim(String(str), 3);
  return $parseInt(string, (radix >>> 0) || (hex.test(string) ? 16 : 10));
} : $parseInt;

},{"./_global":68,"./_string-trim":94,"./_string-ws":95}],88:[function(require,module,exports){
module.exports = function (bitmap, value) {
  return {
    enumerable: !(bitmap & 1),
    configurable: !(bitmap & 2),
    writable: !(bitmap & 4),
    value: value
  };
};

},{}],89:[function(require,module,exports){
module.exports = require('./_hide');

},{"./_hide":70}],90:[function(require,module,exports){
var def = require('./_object-dp').f;
var has = require('./_has');
var TAG = require('./_wks')('toStringTag');

module.exports = function (it, tag, stat) {
  if (it && !has(it = stat ? it : it.prototype, TAG)) def(it, TAG, { configurable: true, value: tag });
};

},{"./_has":69,"./_object-dp":82,"./_wks":103}],91:[function(require,module,exports){
var shared = require('./_shared')('keys');
var uid = require('./_uid');
module.exports = function (key) {
  return shared[key] || (shared[key] = uid(key));
};

},{"./_shared":92,"./_uid":102}],92:[function(require,module,exports){
var core = require('./_core');
var global = require('./_global');
var SHARED = '__core-js_shared__';
var store = global[SHARED] || (global[SHARED] = {});

(module.exports = function (key, value) {
  return store[key] || (store[key] = value !== undefined ? value : {});
})('versions', []).push({
  version: core.version,
  mode: require('./_library') ? 'pure' : 'global',
  copyright: '© 2019 Denis Pushkarev (zloirock.ru)'
});

},{"./_core":60,"./_global":68,"./_library":80}],93:[function(require,module,exports){
var toInteger = require('./_to-integer');
var defined = require('./_defined');
// true  -> String#at
// false -> String#codePointAt
module.exports = function (TO_STRING) {
  return function (that, pos) {
    var s = String(defined(that));
    var i = toInteger(pos);
    var l = s.length;
    var a, b;
    if (i < 0 || i >= l) return TO_STRING ? '' : undefined;
    a = s.charCodeAt(i);
    return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff
      ? TO_STRING ? s.charAt(i) : a
      : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
  };
};

},{"./_defined":62,"./_to-integer":97}],94:[function(require,module,exports){
var $export = require('./_export');
var defined = require('./_defined');
var fails = require('./_fails');
var spaces = require('./_string-ws');
var space = '[' + spaces + ']';
var non = '\u200b\u0085';
var ltrim = RegExp('^' + space + space + '*');
var rtrim = RegExp(space + space + '*$');

var exporter = function (KEY, exec, ALIAS) {
  var exp = {};
  var FORCE = fails(function () {
    return !!spaces[KEY]() || non[KEY]() != non;
  });
  var fn = exp[KEY] = FORCE ? exec(trim) : spaces[KEY];
  if (ALIAS) exp[ALIAS] = fn;
  $export($export.P + $export.F * FORCE, 'String', exp);
};

// 1 -> String#trimLeft
// 2 -> String#trimRight
// 3 -> String#trim
var trim = exporter.trim = function (string, TYPE) {
  string = String(defined(string));
  if (TYPE & 1) string = string.replace(ltrim, '');
  if (TYPE & 2) string = string.replace(rtrim, '');
  return string;
};

module.exports = exporter;

},{"./_defined":62,"./_export":66,"./_fails":67,"./_string-ws":95}],95:[function(require,module,exports){
module.exports = '\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003' +
  '\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';

},{}],96:[function(require,module,exports){
var toInteger = require('./_to-integer');
var max = Math.max;
var min = Math.min;
module.exports = function (index, length) {
  index = toInteger(index);
  return index < 0 ? max(index + length, 0) : min(index, length);
};

},{"./_to-integer":97}],97:[function(require,module,exports){
// 7.1.4 ToInteger
var ceil = Math.ceil;
var floor = Math.floor;
module.exports = function (it) {
  return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
};

},{}],98:[function(require,module,exports){
// to indexed object, toObject with fallback for non-array-like ES3 strings
var IObject = require('./_iobject');
var defined = require('./_defined');
module.exports = function (it) {
  return IObject(defined(it));
};

},{"./_defined":62,"./_iobject":73}],99:[function(require,module,exports){
// 7.1.15 ToLength
var toInteger = require('./_to-integer');
var min = Math.min;
module.exports = function (it) {
  return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
};

},{"./_to-integer":97}],100:[function(require,module,exports){
// 7.1.13 ToObject(argument)
var defined = require('./_defined');
module.exports = function (it) {
  return Object(defined(it));
};

},{"./_defined":62}],101:[function(require,module,exports){
// 7.1.1 ToPrimitive(input [, PreferredType])
var isObject = require('./_is-object');
// instead of the ES6 spec version, we didn't implement @@toPrimitive case
// and the second argument - flag - preferred type is a string
module.exports = function (it, S) {
  if (!isObject(it)) return it;
  var fn, val;
  if (S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  if (typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it))) return val;
  if (!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
  throw TypeError("Can't convert object to primitive value");
};

},{"./_is-object":75}],102:[function(require,module,exports){
var id = 0;
var px = Math.random();
module.exports = function (key) {
  return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
};

},{}],103:[function(require,module,exports){
var store = require('./_shared')('wks');
var uid = require('./_uid');
var Symbol = require('./_global').Symbol;
var USE_SYMBOL = typeof Symbol == 'function';

var $exports = module.exports = function (name) {
  return store[name] || (store[name] =
    USE_SYMBOL && Symbol[name] || (USE_SYMBOL ? Symbol : uid)('Symbol.' + name));
};

$exports.store = store;

},{"./_global":68,"./_shared":92,"./_uid":102}],104:[function(require,module,exports){
var classof = require('./_classof');
var ITERATOR = require('./_wks')('iterator');
var Iterators = require('./_iterators');
module.exports = require('./_core').getIteratorMethod = function (it) {
  if (it != undefined) return it[ITERATOR]
    || it['@@iterator']
    || Iterators[classof(it)];
};

},{"./_classof":58,"./_core":60,"./_iterators":79,"./_wks":103}],105:[function(require,module,exports){
var anObject = require('./_an-object');
var get = require('./core.get-iterator-method');
module.exports = require('./_core').getIterator = function (it) {
  var iterFn = get(it);
  if (typeof iterFn != 'function') throw TypeError(it + ' is not iterable!');
  return anObject(iterFn.call(it));
};

},{"./_an-object":56,"./_core":60,"./core.get-iterator-method":104}],106:[function(require,module,exports){
// 22.1.2.2 / 15.4.3.2 Array.isArray(arg)
var $export = require('./_export');

$export($export.S, 'Array', { isArray: require('./_is-array') });

},{"./_export":66,"./_is-array":74}],107:[function(require,module,exports){
'use strict';
var addToUnscopables = require('./_add-to-unscopables');
var step = require('./_iter-step');
var Iterators = require('./_iterators');
var toIObject = require('./_to-iobject');

// 22.1.3.4 Array.prototype.entries()
// 22.1.3.13 Array.prototype.keys()
// 22.1.3.29 Array.prototype.values()
// 22.1.3.30 Array.prototype[@@iterator]()
module.exports = require('./_iter-define')(Array, 'Array', function (iterated, kind) {
  this._t = toIObject(iterated); // target
  this._i = 0;                   // next index
  this._k = kind;                // kind
// 22.1.5.2.1 %ArrayIteratorPrototype%.next()
}, function () {
  var O = this._t;
  var kind = this._k;
  var index = this._i++;
  if (!O || index >= O.length) {
    this._t = undefined;
    return step(1);
  }
  if (kind == 'keys') return step(0, index);
  if (kind == 'values') return step(0, O[index]);
  return step(0, [index, O[index]]);
}, 'values');

// argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
Iterators.Arguments = Iterators.Array;

addToUnscopables('keys');
addToUnscopables('values');
addToUnscopables('entries');

},{"./_add-to-unscopables":55,"./_iter-define":77,"./_iter-step":78,"./_iterators":79,"./_to-iobject":98}],108:[function(require,module,exports){
var $export = require('./_export');
// 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
$export($export.S, 'Object', { create: require('./_object-create') });

},{"./_export":66,"./_object-create":81}],109:[function(require,module,exports){
var $export = require('./_export');
var $parseInt = require('./_parse-int');
// 18.2.5 parseInt(string, radix)
$export($export.G + $export.F * (parseInt != $parseInt), { parseInt: $parseInt });

},{"./_export":66,"./_parse-int":87}],110:[function(require,module,exports){
'use strict';
var $at = require('./_string-at')(true);

// 21.1.3.27 String.prototype[@@iterator]()
require('./_iter-define')(String, 'String', function (iterated) {
  this._t = String(iterated); // target
  this._i = 0;                // next index
// 21.1.5.2.1 %StringIteratorPrototype%.next()
}, function () {
  var O = this._t;
  var index = this._i;
  var point;
  if (index >= O.length) return { value: undefined, done: true };
  point = $at(O, index);
  this._i += point.length;
  return { value: point, done: false };
});

},{"./_iter-define":77,"./_string-at":93}],111:[function(require,module,exports){
require('./es6.array.iterator');
var global = require('./_global');
var hide = require('./_hide');
var Iterators = require('./_iterators');
var TO_STRING_TAG = require('./_wks')('toStringTag');

var DOMIterables = ('CSSRuleList,CSSStyleDeclaration,CSSValueList,ClientRectList,DOMRectList,DOMStringList,' +
  'DOMTokenList,DataTransferItemList,FileList,HTMLAllCollection,HTMLCollection,HTMLFormElement,HTMLSelectElement,' +
  'MediaList,MimeTypeArray,NamedNodeMap,NodeList,PaintRequestList,Plugin,PluginArray,SVGLengthList,SVGNumberList,' +
  'SVGPathSegList,SVGPointList,SVGStringList,SVGTransformList,SourceBufferList,StyleSheetList,TextTrackCueList,' +
  'TextTrackList,TouchList').split(',');

for (var i = 0; i < DOMIterables.length; i++) {
  var NAME = DOMIterables[i];
  var Collection = global[NAME];
  var proto = Collection && Collection.prototype;
  if (proto && !proto[TO_STRING_TAG]) hide(proto, TO_STRING_TAG, NAME);
  Iterators[NAME] = Iterators.Array;
}

},{"./_global":68,"./_hide":70,"./_iterators":79,"./_wks":103,"./es6.array.iterator":107}],112:[function(require,module,exports){
(function (process,Buffer){
/**
 * Wrapper for built-in http.js to emulate the browser XMLHttpRequest object.
 *
 * This can be used with JS designed for browsers to improve reuse of code and
 * allow the use of existing libraries.
 *
 * Usage: include("XMLHttpRequest.js") and use XMLHttpRequest per W3C specs.
 *
 * @author Dan DeFelippi <dan@driverdan.com>
 * @contributor David Ellis <d.f.ellis@ieee.org>
 * @license MIT
 */

var Url = require("url");
var spawn = require("child_process").spawn;
var fs = require("fs");

exports.XMLHttpRequest = function() {
  "use strict";

  /**
   * Private variables
   */
  var self = this;
  var http = require("http");
  var https = require("https");

  // Holds http.js objects
  var request;
  var response;

  // Request settings
  var settings = {};

  // Disable header blacklist.
  // Not part of XHR specs.
  var disableHeaderCheck = false;

  // Set some default headers
  var defaultHeaders = {
    "User-Agent": "node-XMLHttpRequest",
    "Accept": "*/*",
  };

  var headers = {};
  var headersCase = {};

  // These headers are not user setable.
  // The following are allowed but banned in the spec:
  // * user-agent
  var forbiddenRequestHeaders = [
    "accept-charset",
    "accept-encoding",
    "access-control-request-headers",
    "access-control-request-method",
    "connection",
    "content-length",
    "content-transfer-encoding",
    "cookie",
    "cookie2",
    "date",
    "expect",
    "host",
    "keep-alive",
    "origin",
    "referer",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade",
    "via"
  ];

  // These request methods are not allowed
  var forbiddenRequestMethods = [
    "TRACE",
    "TRACK",
    "CONNECT"
  ];

  // Send flag
  var sendFlag = false;
  // Error flag, used when errors occur or abort is called
  var errorFlag = false;

  // Event listeners
  var listeners = {};

  /**
   * Constants
   */

  this.UNSENT = 0;
  this.OPENED = 1;
  this.HEADERS_RECEIVED = 2;
  this.LOADING = 3;
  this.DONE = 4;

  /**
   * Public vars
   */

  // Current state
  this.readyState = this.UNSENT;

  // default ready state change handler in case one is not set or is set late
  this.onreadystatechange = null;

  // Result & response
  this.responseText = "";
  this.responseXML = "";
  this.status = null;
  this.statusText = null;
  
  // Whether cross-site Access-Control requests should be made using
  // credentials such as cookies or authorization headers
  this.withCredentials = false;

  /**
   * Private methods
   */

  /**
   * Check if the specified header is allowed.
   *
   * @param string header Header to validate
   * @return boolean False if not allowed, otherwise true
   */
  var isAllowedHttpHeader = function(header) {
    return disableHeaderCheck || (header && forbiddenRequestHeaders.indexOf(header.toLowerCase()) === -1);
  };

  /**
   * Check if the specified method is allowed.
   *
   * @param string method Request method to validate
   * @return boolean False if not allowed, otherwise true
   */
  var isAllowedHttpMethod = function(method) {
    return (method && forbiddenRequestMethods.indexOf(method) === -1);
  };

  /**
   * Public methods
   */

  /**
   * Open the connection. Currently supports local server requests.
   *
   * @param string method Connection method (eg GET, POST)
   * @param string url URL for the connection.
   * @param boolean async Asynchronous connection. Default is true.
   * @param string user Username for basic authentication (optional)
   * @param string password Password for basic authentication (optional)
   */
  this.open = function(method, url, async, user, password) {
    this.abort();
    errorFlag = false;

    // Check for valid request method
    if (!isAllowedHttpMethod(method)) {
      throw new Error("SecurityError: Request method not allowed");
    }

    settings = {
      "method": method,
      "url": url.toString(),
      "async": (typeof async !== "boolean" ? true : async),
      "user": user || null,
      "password": password || null
    };

    setState(this.OPENED);
  };

  /**
   * Disables or enables isAllowedHttpHeader() check the request. Enabled by default.
   * This does not conform to the W3C spec.
   *
   * @param boolean state Enable or disable header checking.
   */
  this.setDisableHeaderCheck = function(state) {
    disableHeaderCheck = state;
  };

  /**
   * Sets a header for the request or appends the value if one is already set.
   *
   * @param string header Header name
   * @param string value Header value
   */
  this.setRequestHeader = function(header, value) {
    if (this.readyState !== this.OPENED) {
      throw new Error("INVALID_STATE_ERR: setRequestHeader can only be called when state is OPEN");
    }
    if (!isAllowedHttpHeader(header)) {
      console.warn("Refused to set unsafe header \"" + header + "\"");
      return;
    }
    if (sendFlag) {
      throw new Error("INVALID_STATE_ERR: send flag is true");
    }
    header = headersCase[header.toLowerCase()] || header;
    headersCase[header.toLowerCase()] = header;
    headers[header] = headers[header] ? headers[header] + ', ' + value : value;
  };

  /**
   * Gets a header from the server response.
   *
   * @param string header Name of header to get.
   * @return string Text of the header or null if it doesn't exist.
   */
  this.getResponseHeader = function(header) {
    if (typeof header === "string"
      && this.readyState > this.OPENED
      && response
      && response.headers
      && response.headers[header.toLowerCase()]
      && !errorFlag
    ) {
      return response.headers[header.toLowerCase()];
    }

    return null;
  };

  /**
   * Gets all the response headers.
   *
   * @return string A string with all response headers separated by CR+LF
   */
  this.getAllResponseHeaders = function() {
    if (this.readyState < this.HEADERS_RECEIVED || errorFlag) {
      return "";
    }
    var result = "";

    for (var i in response.headers) {
      // Cookie headers are excluded
      if (i !== "set-cookie" && i !== "set-cookie2") {
        result += i + ": " + response.headers[i] + "\r\n";
      }
    }
    return result.substr(0, result.length - 2);
  };

  /**
   * Gets a request header
   *
   * @param string name Name of header to get
   * @return string Returns the request header or empty string if not set
   */
  this.getRequestHeader = function(name) {
    if (typeof name === "string" && headersCase[name.toLowerCase()]) {
      return headers[headersCase[name.toLowerCase()]];
    }

    return "";
  };

  /**
   * Sends the request to the server.
   *
   * @param string data Optional data to send as request body.
   */
  this.send = function(data) {
    if (this.readyState !== this.OPENED) {
      throw new Error("INVALID_STATE_ERR: connection must be opened before send() is called");
    }

    if (sendFlag) {
      throw new Error("INVALID_STATE_ERR: send has already been called");
    }

    var ssl = false, local = false;
    var url = Url.parse(settings.url);
    var host;
    // Determine the server
    switch (url.protocol) {
      case "https:":
        ssl = true;
        // SSL & non-SSL both need host, no break here.
      case "http:":
        host = url.hostname;
        break;

      case "file:":
        local = true;
        break;

      case undefined:
      case null:
      case "":
        host = "localhost";
        break;

      default:
        throw new Error("Protocol not supported.");
    }

    // Load files off the local filesystem (file://)
    if (local) {
      if (settings.method !== "GET") {
        throw new Error("XMLHttpRequest: Only GET method is supported");
      }

      if (settings.async) {
        fs.readFile(url.pathname, "utf8", function(error, data) {
          if (error) {
            self.handleError(error);
          } else {
            self.status = 200;
            self.responseText = data;
            setState(self.DONE);
          }
        });
      } else {
        try {
          this.responseText = fs.readFileSync(url.pathname, "utf8");
          this.status = 200;
          setState(self.DONE);
        } catch(e) {
          this.handleError(e);
        }
      }

      return;
    }

    // Default to port 80. If accessing localhost on another port be sure
    // to use http://localhost:port/path
    var port = url.port || (ssl ? 443 : 80);
    // Add query string if one is used
    var uri = url.pathname + (url.search ? url.search : "");

    // Set the defaults if they haven't been set
    for (var name in defaultHeaders) {
      if (!headersCase[name.toLowerCase()]) {
        headers[name] = defaultHeaders[name];
      }
    }

    // Set the Host header or the server may reject the request
    headers.Host = host;
    if (!((ssl && port === 443) || port === 80)) {
      headers.Host += ":" + url.port;
    }

    // Set Basic Auth if necessary
    if (settings.user) {
      if (typeof settings.password === "undefined") {
        settings.password = "";
      }
      var authBuf = new Buffer(settings.user + ":" + settings.password);
      headers.Authorization = "Basic " + authBuf.toString("base64");
    }

    // Set content length header
    if (settings.method === "GET" || settings.method === "HEAD") {
      data = null;
    } else if (data) {
      headers["Content-Length"] = Buffer.isBuffer(data) ? data.length : Buffer.byteLength(data);

      if (!headers["Content-Type"]) {
        headers["Content-Type"] = "text/plain;charset=UTF-8";
      }
    } else if (settings.method === "POST") {
      // For a post with no data set Content-Length: 0.
      // This is required by buggy servers that don't meet the specs.
      headers["Content-Length"] = 0;
    }

    var options = {
      host: host,
      port: port,
      path: uri,
      method: settings.method,
      headers: headers,
      agent: false,
      withCredentials: self.withCredentials
    };

    // Reset error flag
    errorFlag = false;

    // Handle async requests
    if (settings.async) {
      // Use the proper protocol
      var doRequest = ssl ? https.request : http.request;

      // Request is being sent, set send flag
      sendFlag = true;

      // As per spec, this is called here for historical reasons.
      self.dispatchEvent("readystatechange");

      // Handler for the response
      var responseHandler = function responseHandler(resp) {
        // Set response var to the response we got back
        // This is so it remains accessable outside this scope
        response = resp;
        // Check for redirect
        // @TODO Prevent looped redirects
        if (response.statusCode === 301 || response.statusCode === 302 || response.statusCode === 303 || response.statusCode === 307) {
          // Change URL to the redirect location
          settings.url = response.headers.location;
          var url = Url.parse(settings.url);
          // Set host var in case it's used later
          host = url.hostname;
          // Options for the new request
          var newOptions = {
            hostname: url.hostname,
            port: url.port,
            path: url.path,
            method: response.statusCode === 303 ? "GET" : settings.method,
            headers: headers,
            withCredentials: self.withCredentials
          };

          // Issue the new request
          request = doRequest(newOptions, responseHandler).on("error", errorHandler);
          request.end();
          // @TODO Check if an XHR event needs to be fired here
          return;
        }

        response.setEncoding("utf8");

        setState(self.HEADERS_RECEIVED);
        self.status = response.statusCode;

        response.on("data", function(chunk) {
          // Make sure there's some data
          if (chunk) {
            self.responseText += chunk;
          }
          // Don't emit state changes if the connection has been aborted.
          if (sendFlag) {
            setState(self.LOADING);
          }
        });

        response.on("end", function() {
          if (sendFlag) {
            // Discard the end event if the connection has been aborted
            setState(self.DONE);
            sendFlag = false;
          }
        });

        response.on("error", function(error) {
          self.handleError(error);
        });
      };

      // Error handler for the request
      var errorHandler = function errorHandler(error) {
        self.handleError(error);
      };

      // Create the request
      request = doRequest(options, responseHandler).on("error", errorHandler);

      // Node 0.4 and later won't accept empty data. Make sure it's needed.
      if (data) {
        request.write(data);
      }

      request.end();

      self.dispatchEvent("loadstart");
    } else { // Synchronous
      // Create a temporary file for communication with the other Node process
      var contentFile = ".node-xmlhttprequest-content-" + process.pid;
      var syncFile = ".node-xmlhttprequest-sync-" + process.pid;
      fs.writeFileSync(syncFile, "", "utf8");
      // The async request the other Node process executes
      var execString = "var http = require('http'), https = require('https'), fs = require('fs');"
        + "var doRequest = http" + (ssl ? "s" : "") + ".request;"
        + "var options = " + JSON.stringify(options) + ";"
        + "var responseText = '';"
        + "var req = doRequest(options, function(response) {"
        + "response.setEncoding('utf8');"
        + "response.on('data', function(chunk) {"
        + "  responseText += chunk;"
        + "});"
        + "response.on('end', function() {"
        + "fs.writeFileSync('" + contentFile + "', JSON.stringify({err: null, data: {statusCode: response.statusCode, headers: response.headers, text: responseText}}), 'utf8');"
        + "fs.unlinkSync('" + syncFile + "');"
        + "});"
        + "response.on('error', function(error) {"
        + "fs.writeFileSync('" + contentFile + "', JSON.stringify({err: error}), 'utf8');"
        + "fs.unlinkSync('" + syncFile + "');"
        + "});"
        + "}).on('error', function(error) {"
        + "fs.writeFileSync('" + contentFile + "', JSON.stringify({err: error}), 'utf8');"
        + "fs.unlinkSync('" + syncFile + "');"
        + "});"
        + (data ? "req.write('" + JSON.stringify(data).slice(1,-1).replace(/'/g, "\\'") + "');":"")
        + "req.end();";
      // Start the other Node Process, executing this string
      var syncProc = spawn(process.argv[0], ["-e", execString]);
      while(fs.existsSync(syncFile)) {
        // Wait while the sync file is empty
      }
      var resp = JSON.parse(fs.readFileSync(contentFile, 'utf8'));
      // Kill the child process once the file has data
      syncProc.stdin.end();
      // Remove the temporary file
      fs.unlinkSync(contentFile);

      if (resp.err) {
        self.handleError(resp.err);
      } else {
        response = resp.data;
        self.status = resp.data.statusCode;
        self.responseText = resp.data.text;
        setState(self.DONE);
      }
    }
  };

  /**
   * Called when an error is encountered to deal with it.
   */
  this.handleError = function(error) {
    this.status = 0;
    this.statusText = error;
    this.responseText = error.stack;
    errorFlag = true;
    setState(this.DONE);
    this.dispatchEvent('error');
  };

  /**
   * Aborts a request.
   */
  this.abort = function() {
    if (request) {
      request.abort();
      request = null;
    }

    headers = defaultHeaders;
    this.status = 0;
    this.responseText = "";
    this.responseXML = "";

    errorFlag = true;

    if (this.readyState !== this.UNSENT
        && (this.readyState !== this.OPENED || sendFlag)
        && this.readyState !== this.DONE) {
      sendFlag = false;
      setState(this.DONE);
    }
    this.readyState = this.UNSENT;
    this.dispatchEvent('abort');
  };

  /**
   * Adds an event listener. Preferred method of binding to events.
   */
  this.addEventListener = function(event, callback) {
    if (!(event in listeners)) {
      listeners[event] = [];
    }
    // Currently allows duplicate callbacks. Should it?
    listeners[event].push(callback);
  };

  /**
   * Remove an event callback that has already been bound.
   * Only works on the matching funciton, cannot be a copy.
   */
  this.removeEventListener = function(event, callback) {
    if (event in listeners) {
      // Filter will return a new array with the callback removed
      listeners[event] = listeners[event].filter(function(ev) {
        return ev !== callback;
      });
    }
  };

  /**
   * Dispatch any events, including both "on" methods and events attached using addEventListener.
   */
  this.dispatchEvent = function(event) {
    if (typeof self["on" + event] === "function") {
      self["on" + event]();
    }
    if (event in listeners) {
      for (var i = 0, len = listeners[event].length; i < len; i++) {
        listeners[event][i].call(self);
      }
    }
  };

  /**
   * Changes readyState and calls onreadystatechange.
   *
   * @param int state New state
   */
  var setState = function(state) {
    if (state == self.LOADING || self.readyState !== state) {
      self.readyState = state;

      if (settings.async || self.readyState < self.OPENED || self.readyState === self.DONE) {
        self.dispatchEvent("readystatechange");
      }

      if (self.readyState === self.DONE && !errorFlag) {
        self.dispatchEvent("load");
        // @TODO figure out InspectorInstrumentation::didLoadXHR(cookie)
        self.dispatchEvent("loadend");
      }
    }
  };
};

}).call(this,require('_process'),require("buffer").Buffer)
},{"_process":14,"buffer":4,"child_process":1,"fs":1,"http":30,"https":8,"url":36}],113:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/*!
 * XRegExp.build 4.2.4
 * <xregexp.com>
 * Steven Levithan (c) 2012-present MIT License
 */
var _default = function _default(XRegExp) {
  var REGEX_DATA = 'xregexp';
  var subParts = /(\()(?!\?)|\\([1-9]\d*)|\\[\s\S]|\[(?:[^\\\]]|\\[\s\S])*\]/g;
  var parts = XRegExp.union([/\({{([\w$]+)}}\)|{{([\w$]+)}}/, subParts], 'g', {
    conjunction: 'or'
  });
  /**
   * Strips a leading `^` and trailing unescaped `$`, if both are present.
   *
   * @private
   * @param {String} pattern Pattern to process.
   * @returns {String} Pattern with edge anchors removed.
   */

  function deanchor(pattern) {
    // Allow any number of empty noncapturing groups before/after anchors, because regexes
    // built/generated by XRegExp sometimes include them
    var leadingAnchor = /^(?:\(\?:\))*\^/;
    var trailingAnchor = /\$(?:\(\?:\))*$/;

    if (leadingAnchor.test(pattern) && trailingAnchor.test(pattern) && // Ensure that the trailing `$` isn't escaped
    trailingAnchor.test(pattern.replace(/\\[\s\S]/g, ''))) {
      return pattern.replace(leadingAnchor, '').replace(trailingAnchor, '');
    }

    return pattern;
  }
  /**
   * Converts the provided value to an XRegExp. Native RegExp flags are not preserved.
   *
   * @private
   * @param {String|RegExp} value Value to convert.
   * @param {Boolean} [addFlagX] Whether to apply the `x` flag in cases when `value` is not
   *   already a regex generated by XRegExp
   * @returns {RegExp} XRegExp object with XRegExp syntax applied.
   */


  function asXRegExp(value, addFlagX) {
    var flags = addFlagX ? 'x' : '';
    return XRegExp.isRegExp(value) ? value[REGEX_DATA] && value[REGEX_DATA].captureNames ? // Don't recompile, to preserve capture names
    value : // Recompile as XRegExp
    XRegExp(value.source, flags) : // Compile string as XRegExp
    XRegExp(value, flags);
  }

  function interpolate(substitution) {
    return substitution instanceof RegExp ? substitution : XRegExp.escape(substitution);
  }

  function reduceToSubpatternsObject(subpatterns, interpolated, subpatternIndex) {
    subpatterns["subpattern".concat(subpatternIndex)] = interpolated;
    return subpatterns;
  }

  function embedSubpatternAfter(raw, subpatternIndex, rawLiterals) {
    var hasSubpattern = subpatternIndex < rawLiterals.length - 1;
    return raw + (hasSubpattern ? "{{subpattern".concat(subpatternIndex, "}}") : '');
  }
  /**
   * Provides tagged template literals that create regexes with XRegExp syntax and flags. The
   * provided pattern is handled as a raw string, so backslashes don't need to be escaped.
   *
   * Interpolation of strings and regexes shares the features of `XRegExp.build`. Interpolated
   * patterns are treated as atomic units when quantified, interpolated strings have their special
   * characters escaped, a leading `^` and trailing unescaped `$` are stripped from interpolated
   * regexes if both are present, and any backreferences within an interpolated regex are
   * rewritten to work within the overall pattern.
   *
   * @memberOf XRegExp
   * @param {String} [flags] Any combination of XRegExp flags.
   * @returns {Function} Handler for template literals that construct regexes with XRegExp syntax.
   * @example
   *
   * const h12 = /1[0-2]|0?[1-9]/;
   * const h24 = /2[0-3]|[01][0-9]/;
   * const hours = XRegExp.tag('x')`${h12} : | ${h24}`;
   * const minutes = /^[0-5][0-9]$/;
   * // Note that explicitly naming the 'minutes' group is required for named backreferences
   * const time = XRegExp.tag('x')`^ ${hours} (?<minutes>${minutes}) $`;
   * time.test('10:59'); // -> true
   * XRegExp.exec('10:59', time).minutes; // -> '59'
   */


  XRegExp.tag = function (flags) {
    return function (literals) {
      for (var _len = arguments.length, substitutions = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
        substitutions[_key - 1] = arguments[_key];
      }

      var subpatterns = substitutions.map(interpolate).reduce(reduceToSubpatternsObject, {});
      var pattern = literals.raw.map(embedSubpatternAfter).join('');
      return XRegExp.build(pattern, subpatterns, flags);
    };
  };
  /**
   * Builds regexes using named subpatterns, for readability and pattern reuse. Backreferences in
   * the outer pattern and provided subpatterns are automatically renumbered to work correctly.
   * Native flags used by provided subpatterns are ignored in favor of the `flags` argument.
   *
   * @memberOf XRegExp
   * @param {String} pattern XRegExp pattern using `{{name}}` for embedded subpatterns. Allows
   *   `({{name}})` as shorthand for `(?<name>{{name}})`. Patterns cannot be embedded within
   *   character classes.
   * @param {Object} subs Lookup object for named subpatterns. Values can be strings or regexes. A
   *   leading `^` and trailing unescaped `$` are stripped from subpatterns, if both are present.
   * @param {String} [flags] Any combination of XRegExp flags.
   * @returns {RegExp} Regex with interpolated subpatterns.
   * @example
   *
   * const time = XRegExp.build('(?x)^ {{hours}} ({{minutes}}) $', {
   *   hours: XRegExp.build('{{h12}} : | {{h24}}', {
   *     h12: /1[0-2]|0?[1-9]/,
   *     h24: /2[0-3]|[01][0-9]/
   *   }, 'x'),
   *   minutes: /^[0-5][0-9]$/
   * });
   * time.test('10:59'); // -> true
   * XRegExp.exec('10:59', time).minutes; // -> '59'
   */


  XRegExp.build = function (pattern, subs, flags) {
    flags = flags || ''; // Used with `asXRegExp` calls for `pattern` and subpatterns in `subs`, to work around how
    // some browsers convert `RegExp('\n')` to a regex that contains the literal characters `\`
    // and `n`. See more details at <https://github.com/slevithan/xregexp/pull/163>.

    var addFlagX = flags.indexOf('x') !== -1;
    var inlineFlags = /^\(\?([\w$]+)\)/.exec(pattern); // Add flags within a leading mode modifier to the overall pattern's flags

    if (inlineFlags) {
      flags = XRegExp._clipDuplicates(flags + inlineFlags[1]);
    }

    var data = {};

    for (var p in subs) {
      if (subs.hasOwnProperty(p)) {
        // Passing to XRegExp enables extended syntax and ensures independent validity,
        // lest an unescaped `(`, `)`, `[`, or trailing `\` breaks the `(?:)` wrapper. For
        // subpatterns provided as native regexes, it dies on octals and adds the property
        // used to hold extended regex instance data, for simplicity.
        var sub = asXRegExp(subs[p], addFlagX);
        data[p] = {
          // Deanchoring allows embedding independently useful anchored regexes. If you
          // really need to keep your anchors, double them (i.e., `^^...$$`).
          pattern: deanchor(sub.source),
          names: sub[REGEX_DATA].captureNames || []
        };
      }
    } // Passing to XRegExp dies on octals and ensures the outer pattern is independently valid;
    // helps keep this simple. Named captures will be put back.


    var patternAsRegex = asXRegExp(pattern, addFlagX); // 'Caps' is short for 'captures'

    var numCaps = 0;
    var numPriorCaps;
    var numOuterCaps = 0;
    var outerCapsMap = [0];
    var outerCapNames = patternAsRegex[REGEX_DATA].captureNames || [];
    var output = patternAsRegex.source.replace(parts, function ($0, $1, $2, $3, $4) {
      var subName = $1 || $2;
      var capName;
      var intro;
      var localCapIndex; // Named subpattern

      if (subName) {
        if (!data.hasOwnProperty(subName)) {
          throw new ReferenceError("Undefined property ".concat($0));
        } // Named subpattern was wrapped in a capturing group


        if ($1) {
          capName = outerCapNames[numOuterCaps];
          outerCapsMap[++numOuterCaps] = ++numCaps; // If it's a named group, preserve the name. Otherwise, use the subpattern name
          // as the capture name

          intro = "(?<".concat(capName || subName, ">");
        } else {
          intro = '(?:';
        }

        numPriorCaps = numCaps;
        var rewrittenSubpattern = data[subName].pattern.replace(subParts, function (match, paren, backref) {
          // Capturing group
          if (paren) {
            capName = data[subName].names[numCaps - numPriorCaps];
            ++numCaps; // If the current capture has a name, preserve the name

            if (capName) {
              return "(?<".concat(capName, ">");
            } // Backreference

          } else if (backref) {
            localCapIndex = +backref - 1; // Rewrite the backreference

            return data[subName].names[localCapIndex] ? // Need to preserve the backreference name in case using flag `n`
            "\\k<".concat(data[subName].names[localCapIndex], ">") : "\\".concat(+backref + numPriorCaps);
          }

          return match;
        });
        return "".concat(intro).concat(rewrittenSubpattern, ")");
      } // Capturing group


      if ($3) {
        capName = outerCapNames[numOuterCaps];
        outerCapsMap[++numOuterCaps] = ++numCaps; // If the current capture has a name, preserve the name

        if (capName) {
          return "(?<".concat(capName, ">");
        } // Backreference

      } else if ($4) {
        localCapIndex = +$4 - 1; // Rewrite the backreference

        return outerCapNames[localCapIndex] ? // Need to preserve the backreference name in case using flag `n`
        "\\k<".concat(outerCapNames[localCapIndex], ">") : "\\".concat(outerCapsMap[+$4]);
      }

      return $0;
    });
    return XRegExp(output, flags);
  };
};

exports.default = _default;
module.exports = exports["default"];
},{}],114:[function(require,module,exports){
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

/*!
 * XRegExp.matchRecursive 4.2.4
 * <xregexp.com>
 * Steven Levithan (c) 2009-present MIT License
 */
var _default = function _default(XRegExp) {
  /**
   * Returns a match detail object composed of the provided values.
   *
   * @private
   */
  function row(name, value, start, end) {
    return {
      name: name,
      value: value,
      start: start,
      end: end
    };
  }
  /**
   * Returns an array of match strings between outermost left and right delimiters, or an array of
   * objects with detailed match parts and position data. An error is thrown if delimiters are
   * unbalanced within the data.
   *
   * @memberOf XRegExp
   * @param {String} str String to search.
   * @param {String} left Left delimiter as an XRegExp pattern.
   * @param {String} right Right delimiter as an XRegExp pattern.
   * @param {String} [flags] Any native or XRegExp flags, used for the left and right delimiters.
   * @param {Object} [options] Lets you specify `valueNames` and `escapeChar` options.
   * @returns {Array} Array of matches, or an empty array.
   * @example
   *
   * // Basic usage
   * let str = '(t((e))s)t()(ing)';
   * XRegExp.matchRecursive(str, '\\(', '\\)', 'g');
   * // -> ['t((e))s', '', 'ing']
   *
   * // Extended information mode with valueNames
   * str = 'Here is <div> <div>an</div></div> example';
   * XRegExp.matchRecursive(str, '<div\\s*>', '</div>', 'gi', {
   *   valueNames: ['between', 'left', 'match', 'right']
   * });
   * // -> [
   * // {name: 'between', value: 'Here is ',       start: 0,  end: 8},
   * // {name: 'left',    value: '<div>',          start: 8,  end: 13},
   * // {name: 'match',   value: ' <div>an</div>', start: 13, end: 27},
   * // {name: 'right',   value: '</div>',         start: 27, end: 33},
   * // {name: 'between', value: ' example',       start: 33, end: 41}
   * // ]
   *
   * // Omitting unneeded parts with null valueNames, and using escapeChar
   * str = '...{1}.\\{{function(x,y){return {y:x}}}';
   * XRegExp.matchRecursive(str, '{', '}', 'g', {
   *   valueNames: ['literal', null, 'value', null],
   *   escapeChar: '\\'
   * });
   * // -> [
   * // {name: 'literal', value: '...',  start: 0, end: 3},
   * // {name: 'value',   value: '1',    start: 4, end: 5},
   * // {name: 'literal', value: '.\\{', start: 6, end: 9},
   * // {name: 'value',   value: 'function(x,y){return {y:x}}', start: 10, end: 37}
   * // ]
   *
   * // Sticky mode via flag y
   * str = '<1><<<2>>><3>4<5>';
   * XRegExp.matchRecursive(str, '<', '>', 'gy');
   * // -> ['1', '<<2>>', '3']
   */


  XRegExp.matchRecursive = function (str, left, right, flags, options) {
    flags = flags || '';
    options = options || {};
    var global = flags.indexOf('g') !== -1;
    var sticky = flags.indexOf('y') !== -1; // Flag `y` is controlled internally

    var basicFlags = flags.replace(/y/g, '');
    var _options = options,
        escapeChar = _options.escapeChar;
    var vN = options.valueNames;
    var output = [];
    var openTokens = 0;
    var delimStart = 0;
    var delimEnd = 0;
    var lastOuterEnd = 0;
    var outerStart;
    var innerStart;
    var leftMatch;
    var rightMatch;
    var esc;
    left = XRegExp(left, basicFlags);
    right = XRegExp(right, basicFlags);

    if (escapeChar) {
      if (escapeChar.length > 1) {
        throw new Error('Cannot use more than one escape character');
      }

      escapeChar = XRegExp.escape(escapeChar); // Example of concatenated `esc` regex:
      // `escapeChar`: '%'
      // `left`: '<'
      // `right`: '>'
      // Regex is: /(?:%[\S\s]|(?:(?!<|>)[^%])+)+/

      esc = new RegExp("(?:".concat(escapeChar, "[\\S\\s]|(?:(?!").concat( // Using `XRegExp.union` safely rewrites backreferences in `left` and `right`.
      // Intentionally not passing `basicFlags` to `XRegExp.union` since any syntax
      // transformation resulting from those flags was already applied to `left` and
      // `right` when they were passed through the XRegExp constructor above.
      XRegExp.union([left, right], '', {
        conjunction: 'or'
      }).source, ")[^").concat(escapeChar, "])+)+"), // Flags `gy` not needed here
      flags.replace(/[^imu]+/g, ''));
    }

    while (true) {
      // If using an escape character, advance to the delimiter's next starting position,
      // skipping any escaped characters in between
      if (escapeChar) {
        delimEnd += (XRegExp.exec(str, esc, delimEnd, 'sticky') || [''])[0].length;
      }

      leftMatch = XRegExp.exec(str, left, delimEnd);
      rightMatch = XRegExp.exec(str, right, delimEnd); // Keep the leftmost match only

      if (leftMatch && rightMatch) {
        if (leftMatch.index <= rightMatch.index) {
          rightMatch = null;
        } else {
          leftMatch = null;
        }
      } // Paths (LM: leftMatch, RM: rightMatch, OT: openTokens):
      // LM | RM | OT | Result
      // 1  | 0  | 1  | loop
      // 1  | 0  | 0  | loop
      // 0  | 1  | 1  | loop
      // 0  | 1  | 0  | throw
      // 0  | 0  | 1  | throw
      // 0  | 0  | 0  | break
      // The paths above don't include the sticky mode special case. The loop ends after the
      // first completed match if not `global`.


      if (leftMatch || rightMatch) {
        delimStart = (leftMatch || rightMatch).index;
        delimEnd = delimStart + (leftMatch || rightMatch)[0].length;
      } else if (!openTokens) {
        break;
      }

      if (sticky && !openTokens && delimStart > lastOuterEnd) {
        break;
      }

      if (leftMatch) {
        if (!openTokens) {
          outerStart = delimStart;
          innerStart = delimEnd;
        }

        ++openTokens;
      } else if (rightMatch && openTokens) {
        if (! --openTokens) {
          if (vN) {
            if (vN[0] && outerStart > lastOuterEnd) {
              output.push(row(vN[0], str.slice(lastOuterEnd, outerStart), lastOuterEnd, outerStart));
            }

            if (vN[1]) {
              output.push(row(vN[1], str.slice(outerStart, innerStart), outerStart, innerStart));
            }

            if (vN[2]) {
              output.push(row(vN[2], str.slice(innerStart, delimStart), innerStart, delimStart));
            }

            if (vN[3]) {
              output.push(row(vN[3], str.slice(delimStart, delimEnd), delimStart, delimEnd));
            }
          } else {
            output.push(str.slice(innerStart, delimStart));
          }

          lastOuterEnd = delimEnd;

          if (!global) {
            break;
          }
        }
      } else {
        throw new Error('Unbalanced delimiter found in string');
      } // If the delimiter matched an empty string, avoid an infinite loop


      if (delimStart === delimEnd) {
        ++delimEnd;
      }
    }

    if (global && !sticky && vN && vN[0] && str.length > lastOuterEnd) {
      output.push(row(vN[0], str.slice(lastOuterEnd), lastOuterEnd, str.length));
    }

    return output;
  };
};

exports.default = _default;
module.exports = exports["default"];
},{}],115:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

/*!
 * XRegExp Unicode Base 4.2.4
 * <xregexp.com>
 * Steven Levithan (c) 2008-present MIT License
 */
var _default = function _default(XRegExp) {
  /**
   * Adds base support for Unicode matching:
   * - Adds syntax `\p{..}` for matching Unicode tokens. Tokens can be inverted using `\P{..}` or
   *   `\p{^..}`. Token names ignore case, spaces, hyphens, and underscores. You can omit the
   *   braces for token names that are a single letter (e.g. `\pL` or `PL`).
   * - Adds flag A (astral), which enables 21-bit Unicode support.
   * - Adds the `XRegExp.addUnicodeData` method used by other addons to provide character data.
   *
   * Unicode Base relies on externally provided Unicode character data. Official addons are
   * available to provide data for Unicode categories, scripts, blocks, and properties.
   *
   * @requires XRegExp
   */
  // ==--------------------------==
  // Private stuff
  // ==--------------------------==
  // Storage for Unicode data
  var unicode = {}; // Reuse utils

  var dec = XRegExp._dec;
  var hex = XRegExp._hex;
  var pad4 = XRegExp._pad4; // Generates a token lookup name: lowercase, with hyphens, spaces, and underscores removed

  function normalize(name) {
    return name.replace(/[- _]+/g, '').toLowerCase();
  } // Gets the decimal code of a literal code unit, \xHH, \uHHHH, or a backslash-escaped literal


  function charCode(chr) {
    var esc = /^\\[xu](.+)/.exec(chr);
    return esc ? dec(esc[1]) : chr.charCodeAt(chr[0] === '\\' ? 1 : 0);
  } // Inverts a list of ordered BMP characters and ranges


  function invertBmp(range) {
    var output = '';
    var lastEnd = -1;
    XRegExp.forEach(range, /(\\x..|\\u....|\\?[\s\S])(?:-(\\x..|\\u....|\\?[\s\S]))?/, function (m) {
      var start = charCode(m[1]);

      if (start > lastEnd + 1) {
        output += "\\u".concat(pad4(hex(lastEnd + 1)));

        if (start > lastEnd + 2) {
          output += "-\\u".concat(pad4(hex(start - 1)));
        }
      }

      lastEnd = charCode(m[2] || m[1]);
    });

    if (lastEnd < 0xFFFF) {
      output += "\\u".concat(pad4(hex(lastEnd + 1)));

      if (lastEnd < 0xFFFE) {
        output += '-\\uFFFF';
      }
    }

    return output;
  } // Generates an inverted BMP range on first use


  function cacheInvertedBmp(slug) {
    var prop = 'b!';
    return unicode[slug][prop] || (unicode[slug][prop] = invertBmp(unicode[slug].bmp));
  } // Combines and optionally negates BMP and astral data


  function buildAstral(slug, isNegated) {
    var item = unicode[slug];
    var combined = '';

    if (item.bmp && !item.isBmpLast) {
      combined = "[".concat(item.bmp, "]").concat(item.astral ? '|' : '');
    }

    if (item.astral) {
      combined += item.astral;
    }

    if (item.isBmpLast && item.bmp) {
      combined += "".concat(item.astral ? '|' : '', "[").concat(item.bmp, "]");
    } // Astral Unicode tokens always match a code point, never a code unit


    return isNegated ? "(?:(?!".concat(combined, ")(?:[\uD800-\uDBFF][\uDC00-\uDFFF]|[\0-\uFFFF]))") : "(?:".concat(combined, ")");
  } // Builds a complete astral pattern on first use


  function cacheAstral(slug, isNegated) {
    var prop = isNegated ? 'a!' : 'a=';
    return unicode[slug][prop] || (unicode[slug][prop] = buildAstral(slug, isNegated));
  } // ==--------------------------==
  // Core functionality
  // ==--------------------------==

  /*
   * Add astral mode (flag A) and Unicode token syntax: `\p{..}`, `\P{..}`, `\p{^..}`, `\pC`.
   */


  XRegExp.addToken( // Use `*` instead of `+` to avoid capturing `^` as the token name in `\p{^}`
  /\\([pP])(?:{(\^?)([^}]*)}|([A-Za-z]))/, function (match, scope, flags) {
    var ERR_DOUBLE_NEG = 'Invalid double negation ';
    var ERR_UNKNOWN_NAME = 'Unknown Unicode token ';
    var ERR_UNKNOWN_REF = 'Unicode token missing data ';
    var ERR_ASTRAL_ONLY = 'Astral mode required for Unicode token ';
    var ERR_ASTRAL_IN_CLASS = 'Astral mode does not support Unicode tokens within character classes'; // Negated via \P{..} or \p{^..}

    var isNegated = match[1] === 'P' || !!match[2]; // Switch from BMP (0-FFFF) to astral (0-10FFFF) mode via flag A

    var isAstralMode = flags.indexOf('A') !== -1; // Token lookup name. Check `[4]` first to avoid passing `undefined` via `\p{}`

    var slug = normalize(match[4] || match[3]); // Token data object

    var item = unicode[slug];

    if (match[1] === 'P' && match[2]) {
      throw new SyntaxError(ERR_DOUBLE_NEG + match[0]);
    }

    if (!unicode.hasOwnProperty(slug)) {
      throw new SyntaxError(ERR_UNKNOWN_NAME + match[0]);
    } // Switch to the negated form of the referenced Unicode token


    if (item.inverseOf) {
      slug = normalize(item.inverseOf);

      if (!unicode.hasOwnProperty(slug)) {
        throw new ReferenceError("".concat(ERR_UNKNOWN_REF + match[0], " -> ").concat(item.inverseOf));
      }

      item = unicode[slug];
      isNegated = !isNegated;
    }

    if (!(item.bmp || isAstralMode)) {
      throw new SyntaxError(ERR_ASTRAL_ONLY + match[0]);
    }

    if (isAstralMode) {
      if (scope === 'class') {
        throw new SyntaxError(ERR_ASTRAL_IN_CLASS);
      }

      return cacheAstral(slug, isNegated);
    }

    return scope === 'class' ? isNegated ? cacheInvertedBmp(slug) : item.bmp : "".concat((isNegated ? '[^' : '[') + item.bmp, "]");
  }, {
    scope: 'all',
    optionalFlags: 'A',
    leadChar: '\\'
  });
  /**
   * Adds to the list of Unicode tokens that XRegExp regexes can match via `\p` or `\P`.
   *
   * @memberOf XRegExp
   * @param {Array} data Objects with named character ranges. Each object may have properties
   *   `name`, `alias`, `isBmpLast`, `inverseOf`, `bmp`, and `astral`. All but `name` are
   *   optional, although one of `bmp` or `astral` is required (unless `inverseOf` is set). If
   *   `astral` is absent, the `bmp` data is used for BMP and astral modes. If `bmp` is absent,
   *   the name errors in BMP mode but works in astral mode. If both `bmp` and `astral` are
   *   provided, the `bmp` data only is used in BMP mode, and the combination of `bmp` and
   *   `astral` data is used in astral mode. `isBmpLast` is needed when a token matches orphan
   *   high surrogates *and* uses surrogate pairs to match astral code points. The `bmp` and
   *   `astral` data should be a combination of literal characters and `\xHH` or `\uHHHH` escape
   *   sequences, with hyphens to create ranges. Any regex metacharacters in the data should be
   *   escaped, apart from range-creating hyphens. The `astral` data can additionally use
   *   character classes and alternation, and should use surrogate pairs to represent astral code
   *   points. `inverseOf` can be used to avoid duplicating character data if a Unicode token is
   *   defined as the exact inverse of another token.
   * @example
   *
   * // Basic use
   * XRegExp.addUnicodeData([{
   *   name: 'XDigit',
   *   alias: 'Hexadecimal',
   *   bmp: '0-9A-Fa-f'
   * }]);
   * XRegExp('\\p{XDigit}:\\p{Hexadecimal}+').test('0:3D'); // -> true
   */

  XRegExp.addUnicodeData = function (data) {
    var ERR_NO_NAME = 'Unicode token requires name';
    var ERR_NO_DATA = 'Unicode token has no character data ';
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = (0, _getIterator2.default)(data), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var item = _step.value;

        if (!item.name) {
          throw new Error(ERR_NO_NAME);
        }

        if (!(item.inverseOf || item.bmp || item.astral)) {
          throw new Error(ERR_NO_DATA + item.name);
        }

        unicode[normalize(item.name)] = item;

        if (item.alias) {
          unicode[normalize(item.alias)] = item;
        }
      } // Reset the pattern cache used by the `XRegExp` constructor, since the same pattern and
      // flags might now produce different results

    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return != null) {
          _iterator.return();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }

    XRegExp.cache.flush('patterns');
  };
  /**
   * @ignore
   *
   * Return a reference to the internal Unicode definition structure for the given Unicode
   * Property if the given name is a legal Unicode Property for use in XRegExp `\p` or `\P` regex
   * constructs.
   *
   * @memberOf XRegExp
   * @param {String} name Name by which the Unicode Property may be recognized (case-insensitive),
   *   e.g. `'N'` or `'Number'`. The given name is matched against all registered Unicode
   *   Properties and Property Aliases.
   * @returns {Object} Reference to definition structure when the name matches a Unicode Property.
   *
   * @note
   * For more info on Unicode Properties, see also http://unicode.org/reports/tr18/#Categories.
   *
   * @note
   * This method is *not* part of the officially documented API and may change or be removed in
   * the future. It is meant for userland code that wishes to reuse the (large) internal Unicode
   * structures set up by XRegExp.
   */


  XRegExp._getUnicodeProperty = function (name) {
    var slug = normalize(name);
    return unicode[slug];
  };
};

exports.default = _default;
module.exports = exports["default"];
},{"@babel/runtime-corejs2/core-js/get-iterator":41,"@babel/runtime-corejs2/helpers/interopRequireDefault":45}],116:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _blocks = _interopRequireDefault(require("../../tools/output/blocks"));

/*!
 * XRegExp Unicode Blocks 4.2.4
 * <xregexp.com>
 * Steven Levithan (c) 2010-present MIT License
 * Unicode data by Mathias Bynens <mathiasbynens.be>
 */
var _default = function _default(XRegExp) {
  /**
   * Adds support for all Unicode blocks. Block names use the prefix 'In'. E.g.,
   * `\p{InBasicLatin}`. Token names are case insensitive, and any spaces, hyphens, and
   * underscores are ignored.
   *
   * Uses Unicode 11.0.0.
   *
   * @requires XRegExp, Unicode Base
   */
  if (!XRegExp.addUnicodeData) {
    throw new ReferenceError('Unicode Base must be loaded before Unicode Blocks');
  }

  XRegExp.addUnicodeData(_blocks.default);
};

exports.default = _default;
module.exports = exports["default"];
},{"../../tools/output/blocks":122,"@babel/runtime-corejs2/helpers/interopRequireDefault":45}],117:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _categories = _interopRequireDefault(require("../../tools/output/categories"));

/*!
 * XRegExp Unicode Categories 4.2.4
 * <xregexp.com>
 * Steven Levithan (c) 2010-present MIT License
 * Unicode data by Mathias Bynens <mathiasbynens.be>
 */
var _default = function _default(XRegExp) {
  /**
   * Adds support for Unicode's general categories. E.g., `\p{Lu}` or `\p{Uppercase Letter}`. See
   * category descriptions in UAX #44 <http://unicode.org/reports/tr44/#GC_Values_Table>. Token
   * names are case insensitive, and any spaces, hyphens, and underscores are ignored.
   *
   * Uses Unicode 11.0.0.
   *
   * @requires XRegExp, Unicode Base
   */
  if (!XRegExp.addUnicodeData) {
    throw new ReferenceError('Unicode Base must be loaded before Unicode Categories');
  }

  XRegExp.addUnicodeData(_categories.default);
};

exports.default = _default;
module.exports = exports["default"];
},{"../../tools/output/categories":123,"@babel/runtime-corejs2/helpers/interopRequireDefault":45}],118:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _properties = _interopRequireDefault(require("../../tools/output/properties"));

/*!
 * XRegExp Unicode Properties 4.2.4
 * <xregexp.com>
 * Steven Levithan (c) 2012-present MIT License
 * Unicode data by Mathias Bynens <mathiasbynens.be>
 */
var _default = function _default(XRegExp) {
  /**
   * Adds properties to meet the UTS #18 Level 1 RL1.2 requirements for Unicode regex support. See
   * <http://unicode.org/reports/tr18/#RL1.2>. Following are definitions of these properties from
   * UAX #44 <http://unicode.org/reports/tr44/>:
   *
   * - Alphabetic
   *   Characters with the Alphabetic property. Generated from: Lowercase + Uppercase + Lt + Lm +
   *   Lo + Nl + Other_Alphabetic.
   *
   * - Default_Ignorable_Code_Point
   *   For programmatic determination of default ignorable code points. New characters that should
   *   be ignored in rendering (unless explicitly supported) will be assigned in these ranges,
   *   permitting programs to correctly handle the default rendering of such characters when not
   *   otherwise supported.
   *
   * - Lowercase
   *   Characters with the Lowercase property. Generated from: Ll + Other_Lowercase.
   *
   * - Noncharacter_Code_Point
   *   Code points permanently reserved for internal use.
   *
   * - Uppercase
   *   Characters with the Uppercase property. Generated from: Lu + Other_Uppercase.
   *
   * - White_Space
   *   Spaces, separator characters and other control characters which should be treated by
   *   programming languages as "white space" for the purpose of parsing elements.
   *
   * The properties ASCII, Any, and Assigned are also included but are not defined in UAX #44. UTS
   * #18 RL1.2 additionally requires support for Unicode scripts and general categories. These are
   * included in XRegExp's Unicode Categories and Unicode Scripts addons.
   *
   * Token names are case insensitive, and any spaces, hyphens, and underscores are ignored.
   *
   * Uses Unicode 11.0.0.
   *
   * @requires XRegExp, Unicode Base
   */
  if (!XRegExp.addUnicodeData) {
    throw new ReferenceError('Unicode Base must be loaded before Unicode Properties');
  }

  var unicodeData = _properties.default; // Add non-generated data

  unicodeData.push({
    name: 'Assigned',
    // Since this is defined as the inverse of Unicode category Cn (Unassigned), the Unicode
    // Categories addon is required to use this property
    inverseOf: 'Cn'
  });
  XRegExp.addUnicodeData(unicodeData);
};

exports.default = _default;
module.exports = exports["default"];
},{"../../tools/output/properties":124,"@babel/runtime-corejs2/helpers/interopRequireDefault":45}],119:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _scripts = _interopRequireDefault(require("../../tools/output/scripts"));

/*!
 * XRegExp Unicode Scripts 4.2.4
 * <xregexp.com>
 * Steven Levithan (c) 2010-present MIT License
 * Unicode data by Mathias Bynens <mathiasbynens.be>
 */
var _default = function _default(XRegExp) {
  /**
   * Adds support for all Unicode scripts. E.g., `\p{Latin}`. Token names are case insensitive,
   * and any spaces, hyphens, and underscores are ignored.
   *
   * Uses Unicode 11.0.0.
   *
   * @requires XRegExp, Unicode Base
   */
  if (!XRegExp.addUnicodeData) {
    throw new ReferenceError('Unicode Base must be loaded before Unicode Scripts');
  }

  XRegExp.addUnicodeData(_scripts.default);
};

exports.default = _default;
module.exports = exports["default"];
},{"../../tools/output/scripts":125,"@babel/runtime-corejs2/helpers/interopRequireDefault":45}],120:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _xregexp = _interopRequireDefault(require("./xregexp"));

var _build = _interopRequireDefault(require("./addons/build"));

var _matchrecursive = _interopRequireDefault(require("./addons/matchrecursive"));

var _unicodeBase = _interopRequireDefault(require("./addons/unicode-base"));

var _unicodeBlocks = _interopRequireDefault(require("./addons/unicode-blocks"));

var _unicodeCategories = _interopRequireDefault(require("./addons/unicode-categories"));

var _unicodeProperties = _interopRequireDefault(require("./addons/unicode-properties"));

var _unicodeScripts = _interopRequireDefault(require("./addons/unicode-scripts"));

(0, _build.default)(_xregexp.default);
(0, _matchrecursive.default)(_xregexp.default);
(0, _unicodeBase.default)(_xregexp.default);
(0, _unicodeBlocks.default)(_xregexp.default);
(0, _unicodeCategories.default)(_xregexp.default);
(0, _unicodeProperties.default)(_xregexp.default);
(0, _unicodeScripts.default)(_xregexp.default);
var _default = _xregexp.default;
exports.default = _default;
module.exports = exports["default"];
},{"./addons/build":113,"./addons/matchrecursive":114,"./addons/unicode-base":115,"./addons/unicode-blocks":116,"./addons/unicode-categories":117,"./addons/unicode-properties":118,"./addons/unicode-scripts":119,"./xregexp":121,"@babel/runtime-corejs2/helpers/interopRequireDefault":45}],121:[function(require,module,exports){
"use strict";

var _interopRequireDefault = require("@babel/runtime-corejs2/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _create = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/object/create"));

var _slicedToArray2 = _interopRequireDefault(require("@babel/runtime-corejs2/helpers/slicedToArray"));

var _getIterator2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/get-iterator"));

var _parseInt2 = _interopRequireDefault(require("@babel/runtime-corejs2/core-js/parse-int"));

/*!
 * XRegExp 4.2.4
 * <xregexp.com>
 * Steven Levithan (c) 2007-present MIT License
 */

/**
 * XRegExp provides augmented, extensible regular expressions. You get additional regex syntax and
 * flags, beyond what browsers support natively. XRegExp is also a regex utility belt with tools to
 * make your client-side grepping simpler and more powerful, while freeing you from related
 * cross-browser inconsistencies.
 */
// ==--------------------------==
// Private stuff
// ==--------------------------==
// Property name used for extended regex instance data
var REGEX_DATA = 'xregexp'; // Optional features that can be installed and uninstalled

var features = {
  astral: false,
  namespacing: false
}; // Native methods to use and restore ('native' is an ES3 reserved keyword)

var nativ = {
  exec: RegExp.prototype.exec,
  test: RegExp.prototype.test,
  match: String.prototype.match,
  replace: String.prototype.replace,
  split: String.prototype.split
}; // Storage for fixed/extended native methods

var fixed = {}; // Storage for regexes cached by `XRegExp.cache`

var regexCache = {}; // Storage for pattern details cached by the `XRegExp` constructor

var patternCache = {}; // Storage for regex syntax tokens added internally or by `XRegExp.addToken`

var tokens = []; // Token scopes

var defaultScope = 'default';
var classScope = 'class'; // Regexes that match native regex syntax, including octals

var nativeTokens = {
  // Any native multicharacter token in default scope, or any single character
  'default': /\\(?:0(?:[0-3][0-7]{0,2}|[4-7][0-7]?)?|[1-9]\d*|x[\dA-Fa-f]{2}|u(?:[\dA-Fa-f]{4}|{[\dA-Fa-f]+})|c[A-Za-z]|[\s\S])|\(\?(?:[:=!]|<[=!])|[?*+]\?|{\d+(?:,\d*)?}\??|[\s\S]/,
  // Any native multicharacter token in character class scope, or any single character
  'class': /\\(?:[0-3][0-7]{0,2}|[4-7][0-7]?|x[\dA-Fa-f]{2}|u(?:[\dA-Fa-f]{4}|{[\dA-Fa-f]+})|c[A-Za-z]|[\s\S])|[\s\S]/
}; // Any backreference or dollar-prefixed character in replacement strings

var replacementToken = /\$(?:{([\w$]+)}|<([\w$]+)>|(\d\d?|[\s\S]))/g; // Check for correct `exec` handling of nonparticipating capturing groups

var correctExecNpcg = nativ.exec.call(/()??/, '')[1] === undefined; // Check for ES6 `flags` prop support

var hasFlagsProp = /x/.flags !== undefined; // Shortcut to `Object.prototype.toString`

var _ref = {},
    toString = _ref.toString;

function hasNativeFlag(flag) {
  // Can't check based on the presence of properties/getters since browsers might support such
  // properties even when they don't support the corresponding flag in regex construction (tested
  // in Chrome 48, where `'unicode' in /x/` is true but trying to construct a regex with flag `u`
  // throws an error)
  var isSupported = true;

  try {
    // Can't use regex literals for testing even in a `try` because regex literals with
    // unsupported flags cause a compilation error in IE
    new RegExp('', flag);
  } catch (exception) {
    isSupported = false;
  }

  return isSupported;
} // Check for ES6 `u` flag support


var hasNativeU = hasNativeFlag('u'); // Check for ES6 `y` flag support

var hasNativeY = hasNativeFlag('y'); // Tracker for known flags, including addon flags

var registeredFlags = {
  g: true,
  i: true,
  m: true,
  u: hasNativeU,
  y: hasNativeY
};
/**
 * Attaches extended data and `XRegExp.prototype` properties to a regex object.
 *
 * @private
 * @param {RegExp} regex Regex to augment.
 * @param {Array} captureNames Array with capture names, or `null`.
 * @param {String} xSource XRegExp pattern used to generate `regex`, or `null` if N/A.
 * @param {String} xFlags XRegExp flags used to generate `regex`, or `null` if N/A.
 * @param {Boolean} [isInternalOnly=false] Whether the regex will be used only for internal
 *   operations, and never exposed to users. For internal-only regexes, we can improve perf by
 *   skipping some operations like attaching `XRegExp.prototype` properties.
 * @returns {RegExp} Augmented regex.
 */

function augment(regex, captureNames, xSource, xFlags, isInternalOnly) {
  regex[REGEX_DATA] = {
    captureNames: captureNames
  };

  if (isInternalOnly) {
    return regex;
  } // Can't auto-inherit these since the XRegExp constructor returns a nonprimitive value


  if (regex.__proto__) {
    regex.__proto__ = XRegExp.prototype;
  } else {
    for (var p in XRegExp.prototype) {
      // An `XRegExp.prototype.hasOwnProperty(p)` check wouldn't be worth it here, since this
      // is performance sensitive, and enumerable `Object.prototype` or `RegExp.prototype`
      // extensions exist on `regex.prototype` anyway
      regex[p] = XRegExp.prototype[p];
    }
  }

  regex[REGEX_DATA].source = xSource; // Emulate the ES6 `flags` prop by ensuring flags are in alphabetical order

  regex[REGEX_DATA].flags = xFlags ? xFlags.split('').sort().join('') : xFlags;
  return regex;
}
/**
 * Removes any duplicate characters from the provided string.
 *
 * @private
 * @param {String} str String to remove duplicate characters from.
 * @returns {String} String with any duplicate characters removed.
 */


function clipDuplicates(str) {
  return nativ.replace.call(str, /([\s\S])(?=[\s\S]*\1)/g, '');
}
/**
 * Copies a regex object while preserving extended data and augmenting with `XRegExp.prototype`
 * properties. The copy has a fresh `lastIndex` property (set to zero). Allows adding and removing
 * flags g and y while copying the regex.
 *
 * @private
 * @param {RegExp} regex Regex to copy.
 * @param {Object} [options] Options object with optional properties:
 *   - `addG` {Boolean} Add flag g while copying the regex.
 *   - `addY` {Boolean} Add flag y while copying the regex.
 *   - `removeG` {Boolean} Remove flag g while copying the regex.
 *   - `removeY` {Boolean} Remove flag y while copying the regex.
 *   - `isInternalOnly` {Boolean} Whether the copied regex will be used only for internal
 *     operations, and never exposed to users. For internal-only regexes, we can improve perf by
 *     skipping some operations like attaching `XRegExp.prototype` properties.
 *   - `source` {String} Overrides `<regex>.source`, for special cases.
 * @returns {RegExp} Copy of the provided regex, possibly with modified flags.
 */


function copyRegex(regex, options) {
  if (!XRegExp.isRegExp(regex)) {
    throw new TypeError('Type RegExp expected');
  }

  var xData = regex[REGEX_DATA] || {};
  var flags = getNativeFlags(regex);
  var flagsToAdd = '';
  var flagsToRemove = '';
  var xregexpSource = null;
  var xregexpFlags = null;
  options = options || {};

  if (options.removeG) {
    flagsToRemove += 'g';
  }

  if (options.removeY) {
    flagsToRemove += 'y';
  }

  if (flagsToRemove) {
    flags = nativ.replace.call(flags, new RegExp("[".concat(flagsToRemove, "]+"), 'g'), '');
  }

  if (options.addG) {
    flagsToAdd += 'g';
  }

  if (options.addY) {
    flagsToAdd += 'y';
  }

  if (flagsToAdd) {
    flags = clipDuplicates(flags + flagsToAdd);
  }

  if (!options.isInternalOnly) {
    if (xData.source !== undefined) {
      xregexpSource = xData.source;
    } // null or undefined; don't want to add to `flags` if the previous value was null, since
    // that indicates we're not tracking original precompilation flags


    if (xData.flags != null) {
      // Flags are only added for non-internal regexes by `XRegExp.globalize`. Flags are never
      // removed for non-internal regexes, so don't need to handle it
      xregexpFlags = flagsToAdd ? clipDuplicates(xData.flags + flagsToAdd) : xData.flags;
    }
  } // Augment with `XRegExp.prototype` properties, but use the native `RegExp` constructor to avoid
  // searching for special tokens. That would be wrong for regexes constructed by `RegExp`, and
  // unnecessary for regexes constructed by `XRegExp` because the regex has already undergone the
  // translation to native regex syntax


  regex = augment(new RegExp(options.source || regex.source, flags), hasNamedCapture(regex) ? xData.captureNames.slice(0) : null, xregexpSource, xregexpFlags, options.isInternalOnly);
  return regex;
}
/**
 * Converts hexadecimal to decimal.
 *
 * @private
 * @param {String} hex
 * @returns {Number}
 */


function dec(hex) {
  return (0, _parseInt2.default)(hex, 16);
}
/**
 * Returns a pattern that can be used in a native RegExp in place of an ignorable token such as an
 * inline comment or whitespace with flag x. This is used directly as a token handler function
 * passed to `XRegExp.addToken`.
 *
 * @private
 * @param {String} match Match arg of `XRegExp.addToken` handler
 * @param {String} scope Scope arg of `XRegExp.addToken` handler
 * @param {String} flags Flags arg of `XRegExp.addToken` handler
 * @returns {String} Either '' or '(?:)', depending on which is needed in the context of the match.
 */


function getContextualTokenSeparator(match, scope, flags) {
  if ( // No need to separate tokens if at the beginning or end of a group
  match.input[match.index - 1] === '(' || match.input[match.index + match[0].length] === ')' || // No need to separate tokens if before or after a `|`
  match.input[match.index - 1] === '|' || match.input[match.index + match[0].length] === '|' || // No need to separate tokens if at the beginning or end of the pattern
  match.index < 1 || match.index + match[0].length >= match.input.length || // No need to separate tokens if at the beginning of a noncapturing group or lookahead.
  // The way this is written relies on:
  // - The search regex matching only 3-char strings.
  // - Although `substr` gives chars from the end of the string if given a negative index,
  //   the resulting substring will be too short to match. Ex: `'abcd'.substr(-1, 3) === 'd'`
  nativ.test.call(/^\(\?[:=!]/, match.input.substr(match.index - 3, 3)) || // Avoid separating tokens when the following token is a quantifier
  isQuantifierNext(match.input, match.index + match[0].length, flags)) {
    return '';
  } // Keep tokens separated. This avoids e.g. inadvertedly changing `\1 1` or `\1(?#)1` to `\11`.
  // This also ensures all tokens remain as discrete atoms, e.g. it avoids converting the syntax
  // error `(? :` into `(?:`.


  return '(?:)';
}
/**
 * Returns native `RegExp` flags used by a regex object.
 *
 * @private
 * @param {RegExp} regex Regex to check.
 * @returns {String} Native flags in use.
 */


function getNativeFlags(regex) {
  return hasFlagsProp ? regex.flags : // Explicitly using `RegExp.prototype.toString` (rather than e.g. `String` or concatenation
  // with an empty string) allows this to continue working predictably when
  // `XRegExp.proptotype.toString` is overridden
  nativ.exec.call(/\/([a-z]*)$/i, RegExp.prototype.toString.call(regex))[1];
}
/**
 * Determines whether a regex has extended instance data used to track capture names.
 *
 * @private
 * @param {RegExp} regex Regex to check.
 * @returns {Boolean} Whether the regex uses named capture.
 */


function hasNamedCapture(regex) {
  return !!(regex[REGEX_DATA] && regex[REGEX_DATA].captureNames);
}
/**
 * Converts decimal to hexadecimal.
 *
 * @private
 * @param {Number|String} dec
 * @returns {String}
 */


function hex(dec) {
  return (0, _parseInt2.default)(dec, 10).toString(16);
}
/**
 * Checks whether the next nonignorable token after the specified position is a quantifier.
 *
 * @private
 * @param {String} pattern Pattern to search within.
 * @param {Number} pos Index in `pattern` to search at.
 * @param {String} flags Flags used by the pattern.
 * @returns {Boolean} Whether the next nonignorable token is a quantifier.
 */


function isQuantifierNext(pattern, pos, flags) {
  var inlineCommentPattern = '\\(\\?#[^)]*\\)';
  var lineCommentPattern = '#[^#\\n]*';
  var quantifierPattern = '[?*+]|{\\d+(?:,\\d*)?}';
  return nativ.test.call(flags.indexOf('x') !== -1 ? // Ignore any leading whitespace, line comments, and inline comments
  /^(?:\s|#[^#\n]*|\(\?#[^)]*\))*(?:[?*+]|{\d+(?:,\d*)?})/ : // Ignore any leading inline comments
  /^(?:\(\?#[^)]*\))*(?:[?*+]|{\d+(?:,\d*)?})/, pattern.slice(pos));
}
/**
 * Determines whether a value is of the specified type, by resolving its internal [[Class]].
 *
 * @private
 * @param {*} value Object to check.
 * @param {String} type Type to check for, in TitleCase.
 * @returns {Boolean} Whether the object matches the type.
 */


function isType(value, type) {
  return toString.call(value) === "[object ".concat(type, "]");
}
/**
 * Adds leading zeros if shorter than four characters. Used for fixed-length hexadecimal values.
 *
 * @private
 * @param {String} str
 * @returns {String}
 */


function pad4(str) {
  while (str.length < 4) {
    str = "0".concat(str);
  }

  return str;
}
/**
 * Checks for flag-related errors, and strips/applies flags in a leading mode modifier. Offloads
 * the flag preparation logic from the `XRegExp` constructor.
 *
 * @private
 * @param {String} pattern Regex pattern, possibly with a leading mode modifier.
 * @param {String} flags Any combination of flags.
 * @returns {Object} Object with properties `pattern` and `flags`.
 */


function prepareFlags(pattern, flags) {
  // Recent browsers throw on duplicate flags, so copy this behavior for nonnative flags
  if (clipDuplicates(flags) !== flags) {
    throw new SyntaxError("Invalid duplicate regex flag ".concat(flags));
  } // Strip and apply a leading mode modifier with any combination of flags except g or y


  pattern = nativ.replace.call(pattern, /^\(\?([\w$]+)\)/, function ($0, $1) {
    if (nativ.test.call(/[gy]/, $1)) {
      throw new SyntaxError("Cannot use flag g or y in mode modifier ".concat($0));
    } // Allow duplicate flags within the mode modifier


    flags = clipDuplicates(flags + $1);
    return '';
  }); // Throw on unknown native or nonnative flags

  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = (0, _getIterator2.default)(flags), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var flag = _step.value;

      if (!registeredFlags[flag]) {
        throw new SyntaxError("Unknown regex flag ".concat(flag));
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return != null) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return {
    pattern: pattern,
    flags: flags
  };
}
/**
 * Prepares an options object from the given value.
 *
 * @private
 * @param {String|Object} value Value to convert to an options object.
 * @returns {Object} Options object.
 */


function prepareOptions(value) {
  var options = {};

  if (isType(value, 'String')) {
    XRegExp.forEach(value, /[^\s,]+/, function (match) {
      options[match] = true;
    });
    return options;
  }

  return value;
}
/**
 * Registers a flag so it doesn't throw an 'unknown flag' error.
 *
 * @private
 * @param {String} flag Single-character flag to register.
 */


function registerFlag(flag) {
  if (!/^[\w$]$/.test(flag)) {
    throw new Error('Flag must be a single character A-Za-z0-9_$');
  }

  registeredFlags[flag] = true;
}
/**
 * Runs built-in and custom regex syntax tokens in reverse insertion order at the specified
 * position, until a match is found.
 *
 * @private
 * @param {String} pattern Original pattern from which an XRegExp object is being built.
 * @param {String} flags Flags being used to construct the regex.
 * @param {Number} pos Position to search for tokens within `pattern`.
 * @param {Number} scope Regex scope to apply: 'default' or 'class'.
 * @param {Object} context Context object to use for token handler functions.
 * @returns {Object} Object with properties `matchLength`, `output`, and `reparse`; or `null`.
 */


function runTokens(pattern, flags, pos, scope, context) {
  var i = tokens.length;
  var leadChar = pattern[pos];
  var result = null;
  var match;
  var t; // Run in reverse insertion order

  while (i--) {
    t = tokens[i];

    if (t.leadChar && t.leadChar !== leadChar || t.scope !== scope && t.scope !== 'all' || t.flag && !(flags.indexOf(t.flag) !== -1)) {
      continue;
    }

    match = XRegExp.exec(pattern, t.regex, pos, 'sticky');

    if (match) {
      result = {
        matchLength: match[0].length,
        output: t.handler.call(context, match, scope, flags),
        reparse: t.reparse
      }; // Finished with token tests

      break;
    }
  }

  return result;
}
/**
 * Enables or disables implicit astral mode opt-in. When enabled, flag A is automatically added to
 * all new regexes created by XRegExp. This causes an error to be thrown when creating regexes if
 * the Unicode Base addon is not available, since flag A is registered by that addon.
 *
 * @private
 * @param {Boolean} on `true` to enable; `false` to disable.
 */


function setAstral(on) {
  features.astral = on;
}
/**
 * Adds named capture groups to the `groups` property of match arrays. See here for details:
 * https://github.com/tc39/proposal-regexp-named-groups
 *
 * @private
 * @param {Boolean} on `true` to enable; `false` to disable.
 */


function setNamespacing(on) {
  features.namespacing = on;
}
/**
 * Returns the object, or throws an error if it is `null` or `undefined`. This is used to follow
 * the ES5 abstract operation `ToObject`.
 *
 * @private
 * @param {*} value Object to check and return.
 * @returns {*} The provided object.
 */


function toObject(value) {
  // null or undefined
  if (value == null) {
    throw new TypeError('Cannot convert null or undefined to object');
  }

  return value;
} // ==--------------------------==
// Constructor
// ==--------------------------==

/**
 * Creates an extended regular expression object for matching text with a pattern. Differs from a
 * native regular expression in that additional syntax and flags are supported. The returned object
 * is in fact a native `RegExp` and works with all native methods.
 *
 * @class XRegExp
 * @constructor
 * @param {String|RegExp} pattern Regex pattern string, or an existing regex object to copy.
 * @param {String} [flags] Any combination of flags.
 *   Native flags:
 *     - `g` - global
 *     - `i` - ignore case
 *     - `m` - multiline anchors
 *     - `u` - unicode (ES6)
 *     - `y` - sticky (Firefox 3+, ES6)
 *   Additional XRegExp flags:
 *     - `n` - explicit capture
 *     - `s` - dot matches all (aka singleline)
 *     - `x` - free-spacing and line comments (aka extended)
 *     - `A` - astral (requires the Unicode Base addon)
 *   Flags cannot be provided when constructing one `RegExp` from another.
 * @returns {RegExp} Extended regular expression object.
 * @example
 *
 * // With named capture and flag x
 * XRegExp(`(?<year>  [0-9]{4} ) -?  # year
 *          (?<month> [0-9]{2} ) -?  # month
 *          (?<day>   [0-9]{2} )     # day`, 'x');
 *
 * // Providing a regex object copies it. Native regexes are recompiled using native (not XRegExp)
 * // syntax. Copies maintain extended data, are augmented with `XRegExp.prototype` properties, and
 * // have fresh `lastIndex` properties (set to zero).
 * XRegExp(/regex/);
 */


function XRegExp(pattern, flags) {
  if (XRegExp.isRegExp(pattern)) {
    if (flags !== undefined) {
      throw new TypeError('Cannot supply flags when copying a RegExp');
    }

    return copyRegex(pattern);
  } // Copy the argument behavior of `RegExp`


  pattern = pattern === undefined ? '' : String(pattern);
  flags = flags === undefined ? '' : String(flags);

  if (XRegExp.isInstalled('astral') && !(flags.indexOf('A') !== -1)) {
    // This causes an error to be thrown if the Unicode Base addon is not available
    flags += 'A';
  }

  if (!patternCache[pattern]) {
    patternCache[pattern] = {};
  }

  if (!patternCache[pattern][flags]) {
    var context = {
      hasNamedCapture: false,
      captureNames: []
    };
    var scope = defaultScope;
    var output = '';
    var pos = 0;
    var result; // Check for flag-related errors, and strip/apply flags in a leading mode modifier

    var applied = prepareFlags(pattern, flags);
    var appliedPattern = applied.pattern;
    var appliedFlags = applied.flags; // Use XRegExp's tokens to translate the pattern to a native regex pattern.
    // `appliedPattern.length` may change on each iteration if tokens use `reparse`

    while (pos < appliedPattern.length) {
      do {
        // Check for custom tokens at the current position
        result = runTokens(appliedPattern, appliedFlags, pos, scope, context); // If the matched token used the `reparse` option, splice its output into the
        // pattern before running tokens again at the same position

        if (result && result.reparse) {
          appliedPattern = appliedPattern.slice(0, pos) + result.output + appliedPattern.slice(pos + result.matchLength);
        }
      } while (result && result.reparse);

      if (result) {
        output += result.output;
        pos += result.matchLength || 1;
      } else {
        // Get the native token at the current position
        var _XRegExp$exec = XRegExp.exec(appliedPattern, nativeTokens[scope], pos, 'sticky'),
            _XRegExp$exec2 = (0, _slicedToArray2.default)(_XRegExp$exec, 1),
            token = _XRegExp$exec2[0];

        output += token;
        pos += token.length;

        if (token === '[' && scope === defaultScope) {
          scope = classScope;
        } else if (token === ']' && scope === classScope) {
          scope = defaultScope;
        }
      }
    }

    patternCache[pattern][flags] = {
      // Use basic cleanup to collapse repeated empty groups like `(?:)(?:)` to `(?:)`. Empty
      // groups are sometimes inserted during regex transpilation in order to keep tokens
      // separated. However, more than one empty group in a row is never needed.
      pattern: nativ.replace.call(output, /(?:\(\?:\))+/g, '(?:)'),
      // Strip all but native flags
      flags: nativ.replace.call(appliedFlags, /[^gimuy]+/g, ''),
      // `context.captureNames` has an item for each capturing group, even if unnamed
      captures: context.hasNamedCapture ? context.captureNames : null
    };
  }

  var generated = patternCache[pattern][flags];
  return augment(new RegExp(generated.pattern, generated.flags), generated.captures, pattern, flags);
} // Add `RegExp.prototype` to the prototype chain


XRegExp.prototype = /(?:)/; // ==--------------------------==
// Public properties
// ==--------------------------==

/**
 * The XRegExp version number as a string containing three dot-separated parts. For example,
 * '2.0.0-beta-3'.
 *
 * @static
 * @memberOf XRegExp
 * @type String
 */

XRegExp.version = '4.2.4'; // ==--------------------------==
// Public methods
// ==--------------------------==
// Intentionally undocumented; used in tests and addons

XRegExp._clipDuplicates = clipDuplicates;
XRegExp._hasNativeFlag = hasNativeFlag;
XRegExp._dec = dec;
XRegExp._hex = hex;
XRegExp._pad4 = pad4;
/**
 * Extends XRegExp syntax and allows custom flags. This is used internally and can be used to
 * create XRegExp addons. If more than one token can match the same string, the last added wins.
 *
 * @memberOf XRegExp
 * @param {RegExp} regex Regex object that matches the new token.
 * @param {Function} handler Function that returns a new pattern string (using native regex syntax)
 *   to replace the matched token within all future XRegExp regexes. Has access to persistent
 *   properties of the regex being built, through `this`. Invoked with three arguments:
 *   - The match array, with named backreference properties.
 *   - The regex scope where the match was found: 'default' or 'class'.
 *   - The flags used by the regex, including any flags in a leading mode modifier.
 *   The handler function becomes part of the XRegExp construction process, so be careful not to
 *   construct XRegExps within the function or you will trigger infinite recursion.
 * @param {Object} [options] Options object with optional properties:
 *   - `scope` {String} Scope where the token applies: 'default', 'class', or 'all'.
 *   - `flag` {String} Single-character flag that triggers the token. This also registers the
 *     flag, which prevents XRegExp from throwing an 'unknown flag' error when the flag is used.
 *   - `optionalFlags` {String} Any custom flags checked for within the token `handler` that are
 *     not required to trigger the token. This registers the flags, to prevent XRegExp from
 *     throwing an 'unknown flag' error when any of the flags are used.
 *   - `reparse` {Boolean} Whether the `handler` function's output should not be treated as
 *     final, and instead be reparseable by other tokens (including the current token). Allows
 *     token chaining or deferring.
 *   - `leadChar` {String} Single character that occurs at the beginning of any successful match
 *     of the token (not always applicable). This doesn't change the behavior of the token unless
 *     you provide an erroneous value. However, providing it can increase the token's performance
 *     since the token can be skipped at any positions where this character doesn't appear.
 * @example
 *
 * // Basic usage: Add \a for the ALERT control code
 * XRegExp.addToken(
 *   /\\a/,
 *   () => '\\x07',
 *   {scope: 'all'}
 * );
 * XRegExp('\\a[\\a-\\n]+').test('\x07\n\x07'); // -> true
 *
 * // Add the U (ungreedy) flag from PCRE and RE2, which reverses greedy and lazy quantifiers.
 * // Since `scope` is not specified, it uses 'default' (i.e., transformations apply outside of
 * // character classes only)
 * XRegExp.addToken(
 *   /([?*+]|{\d+(?:,\d*)?})(\??)/,
 *   (match) => `${match[1]}${match[2] ? '' : '?'}`,
 *   {flag: 'U'}
 * );
 * XRegExp('a+', 'U').exec('aaa')[0]; // -> 'a'
 * XRegExp('a+?', 'U').exec('aaa')[0]; // -> 'aaa'
 */

XRegExp.addToken = function (regex, handler, options) {
  options = options || {};
  var _options = options,
      optionalFlags = _options.optionalFlags;

  if (options.flag) {
    registerFlag(options.flag);
  }

  if (optionalFlags) {
    optionalFlags = nativ.split.call(optionalFlags, '');
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = (0, _getIterator2.default)(optionalFlags), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var flag = _step2.value;
        registerFlag(flag);
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return != null) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }
  } // Add to the private list of syntax tokens


  tokens.push({
    regex: copyRegex(regex, {
      addG: true,
      addY: hasNativeY,
      isInternalOnly: true
    }),
    handler: handler,
    scope: options.scope || defaultScope,
    flag: options.flag,
    reparse: options.reparse,
    leadChar: options.leadChar
  }); // Reset the pattern cache used by the `XRegExp` constructor, since the same pattern and flags
  // might now produce different results

  XRegExp.cache.flush('patterns');
};
/**
 * Caches and returns the result of calling `XRegExp(pattern, flags)`. On any subsequent call with
 * the same pattern and flag combination, the cached copy of the regex is returned.
 *
 * @memberOf XRegExp
 * @param {String} pattern Regex pattern string.
 * @param {String} [flags] Any combination of XRegExp flags.
 * @returns {RegExp} Cached XRegExp object.
 * @example
 *
 * while (match = XRegExp.cache('.', 'gs').exec(str)) {
 *   // The regex is compiled once only
 * }
 */


XRegExp.cache = function (pattern, flags) {
  if (!regexCache[pattern]) {
    regexCache[pattern] = {};
  }

  return regexCache[pattern][flags] || (regexCache[pattern][flags] = XRegExp(pattern, flags));
}; // Intentionally undocumented; used in tests


XRegExp.cache.flush = function (cacheName) {
  if (cacheName === 'patterns') {
    // Flush the pattern cache used by the `XRegExp` constructor
    patternCache = {};
  } else {
    // Flush the regex cache populated by `XRegExp.cache`
    regexCache = {};
  }
};
/**
 * Escapes any regular expression metacharacters, for use when matching literal strings. The result
 * can safely be used at any point within a regex that uses any flags.
 *
 * @memberOf XRegExp
 * @param {String} str String to escape.
 * @returns {String} String with regex metacharacters escaped.
 * @example
 *
 * XRegExp.escape('Escaped? <.>');
 * // -> 'Escaped\?\ <\.>'
 */


XRegExp.escape = function (str) {
  return nativ.replace.call(toObject(str), /[-\[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
};
/**
 * Executes a regex search in a specified string. Returns a match array or `null`. If the provided
 * regex uses named capture, named backreference properties are included on the match array.
 * Optional `pos` and `sticky` arguments specify the search start position, and whether the match
 * must start at the specified position only. The `lastIndex` property of the provided regex is not
 * used, but is updated for compatibility. Also fixes browser bugs compared to the native
 * `RegExp.prototype.exec` and can be used reliably cross-browser.
 *
 * @memberOf XRegExp
 * @param {String} str String to search.
 * @param {RegExp} regex Regex to search with.
 * @param {Number} [pos=0] Zero-based index at which to start the search.
 * @param {Boolean|String} [sticky=false] Whether the match must start at the specified position
 *   only. The string `'sticky'` is accepted as an alternative to `true`.
 * @returns {Array} Match array with named backreference properties, or `null`.
 * @example
 *
 * // Basic use, with named backreference
 * let match = XRegExp.exec('U+2620', XRegExp('U\\+(?<hex>[0-9A-F]{4})'));
 * match.hex; // -> '2620'
 *
 * // With pos and sticky, in a loop
 * let pos = 2, result = [], match;
 * while (match = XRegExp.exec('<1><2><3><4>5<6>', /<(\d)>/, pos, 'sticky')) {
 *   result.push(match[1]);
 *   pos = match.index + match[0].length;
 * }
 * // result -> ['2', '3', '4']
 */


XRegExp.exec = function (str, regex, pos, sticky) {
  var cacheKey = 'g';
  var addY = false;
  var fakeY = false;
  var match;
  addY = hasNativeY && !!(sticky || regex.sticky && sticky !== false);

  if (addY) {
    cacheKey += 'y';
  } else if (sticky) {
    // Simulate sticky matching by appending an empty capture to the original regex. The
    // resulting regex will succeed no matter what at the current index (set with `lastIndex`),
    // and will not search the rest of the subject string. We'll know that the original regex
    // has failed if that last capture is `''` rather than `undefined` (i.e., if that last
    // capture participated in the match).
    fakeY = true;
    cacheKey += 'FakeY';
  }

  regex[REGEX_DATA] = regex[REGEX_DATA] || {}; // Shares cached copies with `XRegExp.match`/`replace`

  var r2 = regex[REGEX_DATA][cacheKey] || (regex[REGEX_DATA][cacheKey] = copyRegex(regex, {
    addG: true,
    addY: addY,
    source: fakeY ? "".concat(regex.source, "|()") : undefined,
    removeY: sticky === false,
    isInternalOnly: true
  }));
  pos = pos || 0;
  r2.lastIndex = pos; // Fixed `exec` required for `lastIndex` fix, named backreferences, etc.

  match = fixed.exec.call(r2, str); // Get rid of the capture added by the pseudo-sticky matcher if needed. An empty string means
  // the original regexp failed (see above).

  if (fakeY && match && match.pop() === '') {
    match = null;
  }

  if (regex.global) {
    regex.lastIndex = match ? r2.lastIndex : 0;
  }

  return match;
};
/**
 * Executes a provided function once per regex match. Searches always start at the beginning of the
 * string and continue until the end, regardless of the state of the regex's `global` property and
 * initial `lastIndex`.
 *
 * @memberOf XRegExp
 * @param {String} str String to search.
 * @param {RegExp} regex Regex to search with.
 * @param {Function} callback Function to execute for each match. Invoked with four arguments:
 *   - The match array, with named backreference properties.
 *   - The zero-based match index.
 *   - The string being traversed.
 *   - The regex object being used to traverse the string.
 * @example
 *
 * // Extracts every other digit from a string
 * const evens = [];
 * XRegExp.forEach('1a2345', /\d/, (match, i) => {
 *   if (i % 2) evens.push(+match[0]);
 * });
 * // evens -> [2, 4]
 */


XRegExp.forEach = function (str, regex, callback) {
  var pos = 0;
  var i = -1;
  var match;

  while (match = XRegExp.exec(str, regex, pos)) {
    // Because `regex` is provided to `callback`, the function could use the deprecated/
    // nonstandard `RegExp.prototype.compile` to mutate the regex. However, since `XRegExp.exec`
    // doesn't use `lastIndex` to set the search position, this can't lead to an infinite loop,
    // at least. Actually, because of the way `XRegExp.exec` caches globalized versions of
    // regexes, mutating the regex will not have any effect on the iteration or matched strings,
    // which is a nice side effect that brings extra safety.
    callback(match, ++i, str, regex);
    pos = match.index + (match[0].length || 1);
  }
};
/**
 * Copies a regex object and adds flag `g`. The copy maintains extended data, is augmented with
 * `XRegExp.prototype` properties, and has a fresh `lastIndex` property (set to zero). Native
 * regexes are not recompiled using XRegExp syntax.
 *
 * @memberOf XRegExp
 * @param {RegExp} regex Regex to globalize.
 * @returns {RegExp} Copy of the provided regex with flag `g` added.
 * @example
 *
 * const globalCopy = XRegExp.globalize(/regex/);
 * globalCopy.global; // -> true
 */


XRegExp.globalize = function (regex) {
  return copyRegex(regex, {
    addG: true
  });
};
/**
 * Installs optional features according to the specified options. Can be undone using
 * `XRegExp.uninstall`.
 *
 * @memberOf XRegExp
 * @param {Object|String} options Options object or string.
 * @example
 *
 * // With an options object
 * XRegExp.install({
 *   // Enables support for astral code points in Unicode addons (implicitly sets flag A)
 *   astral: true,
 *
 *   // Adds named capture groups to the `groups` property of matches
 *   namespacing: true
 * });
 *
 * // With an options string
 * XRegExp.install('astral namespacing');
 */


XRegExp.install = function (options) {
  options = prepareOptions(options);

  if (!features.astral && options.astral) {
    setAstral(true);
  }

  if (!features.namespacing && options.namespacing) {
    setNamespacing(true);
  }
};
/**
 * Checks whether an individual optional feature is installed.
 *
 * @memberOf XRegExp
 * @param {String} feature Name of the feature to check. One of:
 *   - `astral`
 *   - `namespacing`
 * @returns {Boolean} Whether the feature is installed.
 * @example
 *
 * XRegExp.isInstalled('astral');
 */


XRegExp.isInstalled = function (feature) {
  return !!features[feature];
};
/**
 * Returns `true` if an object is a regex; `false` if it isn't. This works correctly for regexes
 * created in another frame, when `instanceof` and `constructor` checks would fail.
 *
 * @memberOf XRegExp
 * @param {*} value Object to check.
 * @returns {Boolean} Whether the object is a `RegExp` object.
 * @example
 *
 * XRegExp.isRegExp('string'); // -> false
 * XRegExp.isRegExp(/regex/i); // -> true
 * XRegExp.isRegExp(RegExp('^', 'm')); // -> true
 * XRegExp.isRegExp(XRegExp('(?s).')); // -> true
 */


XRegExp.isRegExp = function (value) {
  return toString.call(value) === '[object RegExp]';
}; // isType(value, 'RegExp');

/**
 * Returns the first matched string, or in global mode, an array containing all matched strings.
 * This is essentially a more convenient re-implementation of `String.prototype.match` that gives
 * the result types you actually want (string instead of `exec`-style array in match-first mode,
 * and an empty array instead of `null` when no matches are found in match-all mode). It also lets
 * you override flag g and ignore `lastIndex`, and fixes browser bugs.
 *
 * @memberOf XRegExp
 * @param {String} str String to search.
 * @param {RegExp} regex Regex to search with.
 * @param {String} [scope='one'] Use 'one' to return the first match as a string. Use 'all' to
 *   return an array of all matched strings. If not explicitly specified and `regex` uses flag g,
 *   `scope` is 'all'.
 * @returns {String|Array} In match-first mode: First match as a string, or `null`. In match-all
 *   mode: Array of all matched strings, or an empty array.
 * @example
 *
 * // Match first
 * XRegExp.match('abc', /\w/); // -> 'a'
 * XRegExp.match('abc', /\w/g, 'one'); // -> 'a'
 * XRegExp.match('abc', /x/g, 'one'); // -> null
 *
 * // Match all
 * XRegExp.match('abc', /\w/g); // -> ['a', 'b', 'c']
 * XRegExp.match('abc', /\w/, 'all'); // -> ['a', 'b', 'c']
 * XRegExp.match('abc', /x/, 'all'); // -> []
 */


XRegExp.match = function (str, regex, scope) {
  var global = regex.global && scope !== 'one' || scope === 'all';
  var cacheKey = (global ? 'g' : '') + (regex.sticky ? 'y' : '') || 'noGY';
  regex[REGEX_DATA] = regex[REGEX_DATA] || {}; // Shares cached copies with `XRegExp.exec`/`replace`

  var r2 = regex[REGEX_DATA][cacheKey] || (regex[REGEX_DATA][cacheKey] = copyRegex(regex, {
    addG: !!global,
    removeG: scope === 'one',
    isInternalOnly: true
  }));
  var result = nativ.match.call(toObject(str), r2);

  if (regex.global) {
    regex.lastIndex = scope === 'one' && result ? // Can't use `r2.lastIndex` since `r2` is nonglobal in this case
    result.index + result[0].length : 0;
  }

  return global ? result || [] : result && result[0];
};
/**
 * Retrieves the matches from searching a string using a chain of regexes that successively search
 * within previous matches. The provided `chain` array can contain regexes and or objects with
 * `regex` and `backref` properties. When a backreference is specified, the named or numbered
 * backreference is passed forward to the next regex or returned.
 *
 * @memberOf XRegExp
 * @param {String} str String to search.
 * @param {Array} chain Regexes that each search for matches within preceding results.
 * @returns {Array} Matches by the last regex in the chain, or an empty array.
 * @example
 *
 * // Basic usage; matches numbers within <b> tags
 * XRegExp.matchChain('1 <b>2</b> 3 <b>4 a 56</b>', [
 *   XRegExp('(?is)<b>.*?</b>'),
 *   /\d+/
 * ]);
 * // -> ['2', '4', '56']
 *
 * // Passing forward and returning specific backreferences
 * html = '<a href="http://xregexp.com/api/">XRegExp</a>\
 *         <a href="http://www.google.com/">Google</a>';
 * XRegExp.matchChain(html, [
 *   {regex: /<a href="([^"]+)">/i, backref: 1},
 *   {regex: XRegExp('(?i)^https?://(?<domain>[^/?#]+)'), backref: 'domain'}
 * ]);
 * // -> ['xregexp.com', 'www.google.com']
 */


XRegExp.matchChain = function (str, chain) {
  return function recurseChain(values, level) {
    var item = chain[level].regex ? chain[level] : {
      regex: chain[level]
    };
    var matches = [];

    function addMatch(match) {
      if (item.backref) {
        var ERR_UNDEFINED_GROUP = "Backreference to undefined group: ".concat(item.backref);
        var isNamedBackref = isNaN(item.backref);

        if (isNamedBackref && XRegExp.isInstalled('namespacing')) {
          // `groups` has `null` as prototype, so using `in` instead of `hasOwnProperty`
          if (!(item.backref in match.groups)) {
            throw new ReferenceError(ERR_UNDEFINED_GROUP);
          }
        } else if (!match.hasOwnProperty(item.backref)) {
          throw new ReferenceError(ERR_UNDEFINED_GROUP);
        }

        var backrefValue = isNamedBackref && XRegExp.isInstalled('namespacing') ? match.groups[item.backref] : match[item.backref];
        matches.push(backrefValue || '');
      } else {
        matches.push(match[0]);
      }
    }

    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = (0, _getIterator2.default)(values), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var value = _step3.value;
        XRegExp.forEach(value, item.regex, addMatch);
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return != null) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }

    return level === chain.length - 1 || !matches.length ? matches : recurseChain(matches, level + 1);
  }([str], 0);
};
/**
 * Returns a new string with one or all matches of a pattern replaced. The pattern can be a string
 * or regex, and the replacement can be a string or a function to be called for each match. To
 * perform a global search and replace, use the optional `scope` argument or include flag g if using
 * a regex. Replacement strings can use `${n}` or `$<n>` for named and numbered backreferences.
 * Replacement functions can use named backreferences via `arguments[0].name`. Also fixes browser
 * bugs compared to the native `String.prototype.replace` and can be used reliably cross-browser.
 *
 * @memberOf XRegExp
 * @param {String} str String to search.
 * @param {RegExp|String} search Search pattern to be replaced.
 * @param {String|Function} replacement Replacement string or a function invoked to create it.
 *   Replacement strings can include special replacement syntax:
 *     - $$ - Inserts a literal $ character.
 *     - $&, $0 - Inserts the matched substring.
 *     - $` - Inserts the string that precedes the matched substring (left context).
 *     - $' - Inserts the string that follows the matched substring (right context).
 *     - $n, $nn - Where n/nn are digits referencing an existent capturing group, inserts
 *       backreference n/nn.
 *     - ${n}, $<n> - Where n is a name or any number of digits that reference an existent capturing
 *       group, inserts backreference n.
 *   Replacement functions are invoked with three or more arguments:
 *     - The matched substring (corresponds to $& above). Named backreferences are accessible as
 *       properties of this first argument.
 *     - 0..n arguments, one for each backreference (corresponding to $1, $2, etc. above).
 *     - The zero-based index of the match within the total search string.
 *     - The total string being searched.
 * @param {String} [scope='one'] Use 'one' to replace the first match only, or 'all'. If not
 *   explicitly specified and using a regex with flag g, `scope` is 'all'.
 * @returns {String} New string with one or all matches replaced.
 * @example
 *
 * // Regex search, using named backreferences in replacement string
 * const name = XRegExp('(?<first>\\w+) (?<last>\\w+)');
 * XRegExp.replace('John Smith', name, '$<last>, $<first>');
 * // -> 'Smith, John'
 *
 * // Regex search, using named backreferences in replacement function
 * XRegExp.replace('John Smith', name, (match) => `${match.last}, ${match.first}`);
 * // -> 'Smith, John'
 *
 * // String search, with replace-all
 * XRegExp.replace('RegExp builds RegExps', 'RegExp', 'XRegExp', 'all');
 * // -> 'XRegExp builds XRegExps'
 */


XRegExp.replace = function (str, search, replacement, scope) {
  var isRegex = XRegExp.isRegExp(search);
  var global = search.global && scope !== 'one' || scope === 'all';
  var cacheKey = (global ? 'g' : '') + (search.sticky ? 'y' : '') || 'noGY';
  var s2 = search;

  if (isRegex) {
    search[REGEX_DATA] = search[REGEX_DATA] || {}; // Shares cached copies with `XRegExp.exec`/`match`. Since a copy is used, `search`'s
    // `lastIndex` isn't updated *during* replacement iterations

    s2 = search[REGEX_DATA][cacheKey] || (search[REGEX_DATA][cacheKey] = copyRegex(search, {
      addG: !!global,
      removeG: scope === 'one',
      isInternalOnly: true
    }));
  } else if (global) {
    s2 = new RegExp(XRegExp.escape(String(search)), 'g');
  } // Fixed `replace` required for named backreferences, etc.


  var result = fixed.replace.call(toObject(str), s2, replacement);

  if (isRegex && search.global) {
    // Fixes IE, Safari bug (last tested IE 9, Safari 5.1)
    search.lastIndex = 0;
  }

  return result;
};
/**
 * Performs batch processing of string replacements. Used like `XRegExp.replace`, but accepts an
 * array of replacement details. Later replacements operate on the output of earlier replacements.
 * Replacement details are accepted as an array with a regex or string to search for, the
 * replacement string or function, and an optional scope of 'one' or 'all'. Uses the XRegExp
 * replacement text syntax, which supports named backreference properties via `${name}` or
 * `$<name>`.
 *
 * @memberOf XRegExp
 * @param {String} str String to search.
 * @param {Array} replacements Array of replacement detail arrays.
 * @returns {String} New string with all replacements.
 * @example
 *
 * str = XRegExp.replaceEach(str, [
 *   [XRegExp('(?<name>a)'), 'z${name}'],
 *   [/b/gi, 'y'],
 *   [/c/g, 'x', 'one'], // scope 'one' overrides /g
 *   [/d/, 'w', 'all'],  // scope 'all' overrides lack of /g
 *   ['e', 'v', 'all'],  // scope 'all' allows replace-all for strings
 *   [/f/g, ($0) => $0.toUpperCase()]
 * ]);
 */


XRegExp.replaceEach = function (str, replacements) {
  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = (0, _getIterator2.default)(replacements), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var r = _step4.value;
      str = XRegExp.replace(str, r[0], r[1], r[2]);
    }
  } catch (err) {
    _didIteratorError4 = true;
    _iteratorError4 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion4 && _iterator4.return != null) {
        _iterator4.return();
      }
    } finally {
      if (_didIteratorError4) {
        throw _iteratorError4;
      }
    }
  }

  return str;
};
/**
 * Splits a string into an array of strings using a regex or string separator. Matches of the
 * separator are not included in the result array. However, if `separator` is a regex that contains
 * capturing groups, backreferences are spliced into the result each time `separator` is matched.
 * Fixes browser bugs compared to the native `String.prototype.split` and can be used reliably
 * cross-browser.
 *
 * @memberOf XRegExp
 * @param {String} str String to split.
 * @param {RegExp|String} separator Regex or string to use for separating the string.
 * @param {Number} [limit] Maximum number of items to include in the result array.
 * @returns {Array} Array of substrings.
 * @example
 *
 * // Basic use
 * XRegExp.split('a b c', ' ');
 * // -> ['a', 'b', 'c']
 *
 * // With limit
 * XRegExp.split('a b c', ' ', 2);
 * // -> ['a', 'b']
 *
 * // Backreferences in result array
 * XRegExp.split('..word1..', /([a-z]+)(\d+)/i);
 * // -> ['..', 'word', '1', '..']
 */


XRegExp.split = function (str, separator, limit) {
  return fixed.split.call(toObject(str), separator, limit);
};
/**
 * Executes a regex search in a specified string. Returns `true` or `false`. Optional `pos` and
 * `sticky` arguments specify the search start position, and whether the match must start at the
 * specified position only. The `lastIndex` property of the provided regex is not used, but is
 * updated for compatibility. Also fixes browser bugs compared to the native
 * `RegExp.prototype.test` and can be used reliably cross-browser.
 *
 * @memberOf XRegExp
 * @param {String} str String to search.
 * @param {RegExp} regex Regex to search with.
 * @param {Number} [pos=0] Zero-based index at which to start the search.
 * @param {Boolean|String} [sticky=false] Whether the match must start at the specified position
 *   only. The string `'sticky'` is accepted as an alternative to `true`.
 * @returns {Boolean} Whether the regex matched the provided value.
 * @example
 *
 * // Basic use
 * XRegExp.test('abc', /c/); // -> true
 *
 * // With pos and sticky
 * XRegExp.test('abc', /c/, 0, 'sticky'); // -> false
 * XRegExp.test('abc', /c/, 2, 'sticky'); // -> true
 */
// Do this the easy way :-)


XRegExp.test = function (str, regex, pos, sticky) {
  return !!XRegExp.exec(str, regex, pos, sticky);
};
/**
 * Uninstalls optional features according to the specified options. All optional features start out
 * uninstalled, so this is used to undo the actions of `XRegExp.install`.
 *
 * @memberOf XRegExp
 * @param {Object|String} options Options object or string.
 * @example
 *
 * // With an options object
 * XRegExp.uninstall({
 *   // Disables support for astral code points in Unicode addons
 *   astral: true,
 *
 *   // Don't add named capture groups to the `groups` property of matches
 *   namespacing: true
 * });
 *
 * // With an options string
 * XRegExp.uninstall('astral namespacing');
 */


XRegExp.uninstall = function (options) {
  options = prepareOptions(options);

  if (features.astral && options.astral) {
    setAstral(false);
  }

  if (features.namespacing && options.namespacing) {
    setNamespacing(false);
  }
};
/**
 * Returns an XRegExp object that is the union of the given patterns. Patterns can be provided as
 * regex objects or strings. Metacharacters are escaped in patterns provided as strings.
 * Backreferences in provided regex objects are automatically renumbered to work correctly within
 * the larger combined pattern. Native flags used by provided regexes are ignored in favor of the
 * `flags` argument.
 *
 * @memberOf XRegExp
 * @param {Array} patterns Regexes and strings to combine.
 * @param {String} [flags] Any combination of XRegExp flags.
 * @param {Object} [options] Options object with optional properties:
 *   - `conjunction` {String} Type of conjunction to use: 'or' (default) or 'none'.
 * @returns {RegExp} Union of the provided regexes and strings.
 * @example
 *
 * XRegExp.union(['a+b*c', /(dogs)\1/, /(cats)\1/], 'i');
 * // -> /a\+b\*c|(dogs)\1|(cats)\2/i
 *
 * XRegExp.union([/man/, /bear/, /pig/], 'i', {conjunction: 'none'});
 * // -> /manbearpig/i
 */


XRegExp.union = function (patterns, flags, options) {
  options = options || {};
  var conjunction = options.conjunction || 'or';
  var numCaptures = 0;
  var numPriorCaptures;
  var captureNames;

  function rewrite(match, paren, backref) {
    var name = captureNames[numCaptures - numPriorCaptures]; // Capturing group

    if (paren) {
      ++numCaptures; // If the current capture has a name, preserve the name

      if (name) {
        return "(?<".concat(name, ">");
      } // Backreference

    } else if (backref) {
      // Rewrite the backreference
      return "\\".concat(+backref + numPriorCaptures);
    }

    return match;
  }

  if (!(isType(patterns, 'Array') && patterns.length)) {
    throw new TypeError('Must provide a nonempty array of patterns to merge');
  }

  var parts = /(\()(?!\?)|\\([1-9]\d*)|\\[\s\S]|\[(?:[^\\\]]|\\[\s\S])*\]/g;
  var output = [];
  var _iteratorNormalCompletion5 = true;
  var _didIteratorError5 = false;
  var _iteratorError5 = undefined;

  try {
    for (var _iterator5 = (0, _getIterator2.default)(patterns), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
      var pattern = _step5.value;

      if (XRegExp.isRegExp(pattern)) {
        numPriorCaptures = numCaptures;
        captureNames = pattern[REGEX_DATA] && pattern[REGEX_DATA].captureNames || []; // Rewrite backreferences. Passing to XRegExp dies on octals and ensures patterns are
        // independently valid; helps keep this simple. Named captures are put back

        output.push(nativ.replace.call(XRegExp(pattern.source).source, parts, rewrite));
      } else {
        output.push(XRegExp.escape(pattern));
      }
    }
  } catch (err) {
    _didIteratorError5 = true;
    _iteratorError5 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion5 && _iterator5.return != null) {
        _iterator5.return();
      }
    } finally {
      if (_didIteratorError5) {
        throw _iteratorError5;
      }
    }
  }

  var separator = conjunction === 'none' ? '' : '|';
  return XRegExp(output.join(separator), flags);
}; // ==--------------------------==
// Fixed/extended native methods
// ==--------------------------==

/**
 * Adds named capture support (with backreferences returned as `result.name`), and fixes browser
 * bugs in the native `RegExp.prototype.exec`. Use via `XRegExp.exec`.
 *
 * @memberOf RegExp
 * @param {String} str String to search.
 * @returns {Array} Match array with named backreference properties, or `null`.
 */


fixed.exec = function (str) {
  var origLastIndex = this.lastIndex;
  var match = nativ.exec.apply(this, arguments);

  if (match) {
    // Fix browsers whose `exec` methods don't return `undefined` for nonparticipating capturing
    // groups. This fixes IE 5.5-8, but not IE 9's quirks mode or emulation of older IEs. IE 9
    // in standards mode follows the spec.
    if (!correctExecNpcg && match.length > 1 && match.indexOf('') !== -1) {
      var r2 = copyRegex(this, {
        removeG: true,
        isInternalOnly: true
      }); // Using `str.slice(match.index)` rather than `match[0]` in case lookahead allowed
      // matching due to characters outside the match

      nativ.replace.call(String(str).slice(match.index), r2, function () {
        var len = arguments.length; // Skip index 0 and the last 2

        for (var i = 1; i < len - 2; ++i) {
          if ((i < 0 || arguments.length <= i ? undefined : arguments[i]) === undefined) {
            match[i] = undefined;
          }
        }
      });
    } // Attach named capture properties


    var groupsObject = match;

    if (XRegExp.isInstalled('namespacing')) {
      // https://tc39.github.io/proposal-regexp-named-groups/#sec-regexpbuiltinexec
      match.groups = (0, _create.default)(null);
      groupsObject = match.groups;
    }

    if (this[REGEX_DATA] && this[REGEX_DATA].captureNames) {
      // Skip index 0
      for (var i = 1; i < match.length; ++i) {
        var name = this[REGEX_DATA].captureNames[i - 1];

        if (name) {
          groupsObject[name] = match[i];
        }
      }
    } // Fix browsers that increment `lastIndex` after zero-length matches


    if (this.global && !match[0].length && this.lastIndex > match.index) {
      this.lastIndex = match.index;
    }
  }

  if (!this.global) {
    // Fixes IE, Opera bug (last tested IE 9, Opera 11.6)
    this.lastIndex = origLastIndex;
  }

  return match;
};
/**
 * Fixes browser bugs in the native `RegExp.prototype.test`.
 *
 * @memberOf RegExp
 * @param {String} str String to search.
 * @returns {Boolean} Whether the regex matched the provided value.
 */


fixed.test = function (str) {
  // Do this the easy way :-)
  return !!fixed.exec.call(this, str);
};
/**
 * Adds named capture support (with backreferences returned as `result.name`), and fixes browser
 * bugs in the native `String.prototype.match`.
 *
 * @memberOf String
 * @param {RegExp|*} regex Regex to search with. If not a regex object, it is passed to `RegExp`.
 * @returns {Array} If `regex` uses flag g, an array of match strings or `null`. Without flag g,
 *   the result of calling `regex.exec(this)`.
 */


fixed.match = function (regex) {
  if (!XRegExp.isRegExp(regex)) {
    // Use the native `RegExp` rather than `XRegExp`
    regex = new RegExp(regex);
  } else if (regex.global) {
    var result = nativ.match.apply(this, arguments); // Fixes IE bug

    regex.lastIndex = 0;
    return result;
  }

  return fixed.exec.call(regex, toObject(this));
};
/**
 * Adds support for `${n}` (or `$<n>`) tokens for named and numbered backreferences in replacement
 * text, and provides named backreferences to replacement functions as `arguments[0].name`. Also
 * fixes browser bugs in replacement text syntax when performing a replacement using a nonregex
 * search value, and the value of a replacement regex's `lastIndex` property during replacement
 * iterations and upon completion. Note that this doesn't support SpiderMonkey's proprietary third
 * (`flags`) argument. Use via `XRegExp.replace`.
 *
 * @memberOf String
 * @param {RegExp|String} search Search pattern to be replaced.
 * @param {String|Function} replacement Replacement string or a function invoked to create it.
 * @returns {String} New string with one or all matches replaced.
 */


fixed.replace = function (search, replacement) {
  var isRegex = XRegExp.isRegExp(search);
  var origLastIndex;
  var captureNames;
  var result;

  if (isRegex) {
    if (search[REGEX_DATA]) {
      captureNames = search[REGEX_DATA].captureNames;
    } // Only needed if `search` is nonglobal


    origLastIndex = search.lastIndex;
  } else {
    search += ''; // Type-convert
  } // Don't use `typeof`; some older browsers return 'function' for regex objects


  if (isType(replacement, 'Function')) {
    // Stringifying `this` fixes a bug in IE < 9 where the last argument in replacement
    // functions isn't type-converted to a string
    result = nativ.replace.call(String(this), search, function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      if (captureNames) {
        var groupsObject;

        if (XRegExp.isInstalled('namespacing')) {
          // https://tc39.github.io/proposal-regexp-named-groups/#sec-regexpbuiltinexec
          groupsObject = (0, _create.default)(null);
          args.push(groupsObject);
        } else {
          // Change the `args[0]` string primitive to a `String` object that can store
          // properties. This really does need to use `String` as a constructor
          args[0] = new String(args[0]);
          groupsObject = args[0];
        } // Store named backreferences


        for (var i = 0; i < captureNames.length; ++i) {
          if (captureNames[i]) {
            groupsObject[captureNames[i]] = args[i + 1];
          }
        }
      } // Update `lastIndex` before calling `replacement`. Fixes IE, Chrome, Firefox, Safari
      // bug (last tested IE 9, Chrome 17, Firefox 11, Safari 5.1)


      if (isRegex && search.global) {
        search.lastIndex = args[args.length - 2] + args[0].length;
      } // ES6 specs the context for replacement functions as `undefined`


      return replacement.apply(void 0, args);
    });
  } else {
    // Ensure that the last value of `args` will be a string when given nonstring `this`,
    // while still throwing on null or undefined context
    result = nativ.replace.call(this == null ? this : String(this), search, function () {
      for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
        args[_key2] = arguments[_key2];
      }

      return nativ.replace.call(String(replacement), replacementToken, replacer);

      function replacer($0, bracketed, angled, dollarToken) {
        bracketed = bracketed || angled; // Named or numbered backreference with curly or angled braces

        if (bracketed) {
          // XRegExp behavior for `${n}` or `$<n>`:
          // 1. Backreference to numbered capture, if `n` is an integer. Use `0` for the
          //    entire match. Any number of leading zeros may be used.
          // 2. Backreference to named capture `n`, if it exists and is not an integer
          //    overridden by numbered capture. In practice, this does not overlap with
          //    numbered capture since XRegExp does not allow named capture to use a bare
          //    integer as the name.
          // 3. If the name or number does not refer to an existing capturing group, it's
          //    an error.
          var n = +bracketed; // Type-convert; drop leading zeros

          if (n <= args.length - 3) {
            return args[n] || '';
          } // Groups with the same name is an error, else would need `lastIndexOf`


          n = captureNames ? captureNames.indexOf(bracketed) : -1;

          if (n < 0) {
            throw new SyntaxError("Backreference to undefined group ".concat($0));
          }

          return args[n + 1] || '';
        } // Else, special variable or numbered backreference without curly braces


        if (dollarToken === '$') {
          // $$
          return '$';
        }

        if (dollarToken === '&' || +dollarToken === 0) {
          // $&, $0 (not followed by 1-9), $00
          return args[0];
        }

        if (dollarToken === '`') {
          // $` (left context)
          return args[args.length - 1].slice(0, args[args.length - 2]);
        }

        if (dollarToken === "'") {
          // $' (right context)
          return args[args.length - 1].slice(args[args.length - 2] + args[0].length);
        } // Else, numbered backreference without braces


        dollarToken = +dollarToken; // Type-convert; drop leading zero
        // XRegExp behavior for `$n` and `$nn`:
        // - Backrefs end after 1 or 2 digits. Use `${..}` or `$<..>` for more digits.
        // - `$1` is an error if no capturing groups.
        // - `$10` is an error if less than 10 capturing groups. Use `${1}0` or `$<1>0`
        //   instead.
        // - `$01` is `$1` if at least one capturing group, else it's an error.
        // - `$0` (not followed by 1-9) and `$00` are the entire match.
        // Native behavior, for comparison:
        // - Backrefs end after 1 or 2 digits. Cannot reference capturing group 100+.
        // - `$1` is a literal `$1` if no capturing groups.
        // - `$10` is `$1` followed by a literal `0` if less than 10 capturing groups.
        // - `$01` is `$1` if at least one capturing group, else it's a literal `$01`.
        // - `$0` is a literal `$0`.

        if (!isNaN(dollarToken)) {
          if (dollarToken > args.length - 3) {
            throw new SyntaxError("Backreference to undefined group ".concat($0));
          }

          return args[dollarToken] || '';
        } // `$` followed by an unsupported char is an error, unlike native JS


        throw new SyntaxError("Invalid token ".concat($0));
      }
    });
  }

  if (isRegex) {
    if (search.global) {
      // Fixes IE, Safari bug (last tested IE 9, Safari 5.1)
      search.lastIndex = 0;
    } else {
      // Fixes IE, Opera bug (last tested IE 9, Opera 11.6)
      search.lastIndex = origLastIndex;
    }
  }

  return result;
};
/**
 * Fixes browser bugs in the native `String.prototype.split`. Use via `XRegExp.split`.
 *
 * @memberOf String
 * @param {RegExp|String} separator Regex or string to use for separating the string.
 * @param {Number} [limit] Maximum number of items to include in the result array.
 * @returns {Array} Array of substrings.
 */


fixed.split = function (separator, limit) {
  if (!XRegExp.isRegExp(separator)) {
    // Browsers handle nonregex split correctly, so use the faster native method
    return nativ.split.apply(this, arguments);
  }

  var str = String(this);
  var output = [];
  var origLastIndex = separator.lastIndex;
  var lastLastIndex = 0;
  var lastLength; // Values for `limit`, per the spec:
  // If undefined: pow(2,32) - 1
  // If 0, Infinity, or NaN: 0
  // If positive number: limit = floor(limit); if (limit >= pow(2,32)) limit -= pow(2,32);
  // If negative number: pow(2,32) - floor(abs(limit))
  // If other: Type-convert, then use the above rules
  // This line fails in very strange ways for some values of `limit` in Opera 10.5-10.63, unless
  // Opera Dragonfly is open (go figure). It works in at least Opera 9.5-10.1 and 11+

  limit = (limit === undefined ? -1 : limit) >>> 0;
  XRegExp.forEach(str, separator, function (match) {
    // This condition is not the same as `if (match[0].length)`
    if (match.index + match[0].length > lastLastIndex) {
      output.push(str.slice(lastLastIndex, match.index));

      if (match.length > 1 && match.index < str.length) {
        Array.prototype.push.apply(output, match.slice(1));
      }

      lastLength = match[0].length;
      lastLastIndex = match.index + lastLength;
    }
  });

  if (lastLastIndex === str.length) {
    if (!nativ.test.call(separator, '') || lastLength) {
      output.push('');
    }
  } else {
    output.push(str.slice(lastLastIndex));
  }

  separator.lastIndex = origLastIndex;
  return output.length > limit ? output.slice(0, limit) : output;
}; // ==--------------------------==
// Built-in syntax/flag tokens
// ==--------------------------==

/*
 * Letter escapes that natively match literal characters: `\a`, `\A`, etc. These should be
 * SyntaxErrors but are allowed in web reality. XRegExp makes them errors for cross-browser
 * consistency and to reserve their syntax, but lets them be superseded by addons.
 */


XRegExp.addToken(/\\([ABCE-RTUVXYZaeg-mopqyz]|c(?![A-Za-z])|u(?![\dA-Fa-f]{4}|{[\dA-Fa-f]+})|x(?![\dA-Fa-f]{2}))/, function (match, scope) {
  // \B is allowed in default scope only
  if (match[1] === 'B' && scope === defaultScope) {
    return match[0];
  }

  throw new SyntaxError("Invalid escape ".concat(match[0]));
}, {
  scope: 'all',
  leadChar: '\\'
});
/*
 * Unicode code point escape with curly braces: `\u{N..}`. `N..` is any one or more digit
 * hexadecimal number from 0-10FFFF, and can include leading zeros. Requires the native ES6 `u` flag
 * to support code points greater than U+FFFF. Avoids converting code points above U+FFFF to
 * surrogate pairs (which could be done without flag `u`), since that could lead to broken behavior
 * if you follow a `\u{N..}` token that references a code point above U+FFFF with a quantifier, or
 * if you use the same in a character class.
 */

XRegExp.addToken(/\\u{([\dA-Fa-f]+)}/, function (match, scope, flags) {
  var code = dec(match[1]);

  if (code > 0x10FFFF) {
    throw new SyntaxError("Invalid Unicode code point ".concat(match[0]));
  }

  if (code <= 0xFFFF) {
    // Converting to \uNNNN avoids needing to escape the literal character and keep it
    // separate from preceding tokens
    return "\\u".concat(pad4(hex(code)));
  } // If `code` is between 0xFFFF and 0x10FFFF, require and defer to native handling


  if (hasNativeU && flags.indexOf('u') !== -1) {
    return match[0];
  }

  throw new SyntaxError('Cannot use Unicode code point above \\u{FFFF} without flag u');
}, {
  scope: 'all',
  leadChar: '\\'
});
/*
 * Empty character class: `[]` or `[^]`. This fixes a critical cross-browser syntax inconsistency.
 * Unless this is standardized (per the ES spec), regex syntax can't be accurately parsed because
 * character class endings can't be determined.
 */

XRegExp.addToken(/\[(\^?)\]/, // For cross-browser compatibility with ES3, convert [] to \b\B and [^] to [\s\S].
// (?!) should work like \b\B, but is unreliable in some versions of Firefox

/* eslint-disable no-confusing-arrow */
function (match) {
  return match[1] ? '[\\s\\S]' : '\\b\\B';
},
/* eslint-enable no-confusing-arrow */
{
  leadChar: '['
});
/*
 * Comment pattern: `(?# )`. Inline comments are an alternative to the line comments allowed in
 * free-spacing mode (flag x).
 */

XRegExp.addToken(/\(\?#[^)]*\)/, getContextualTokenSeparator, {
  leadChar: '('
});
/*
 * Whitespace and line comments, in free-spacing mode (aka extended mode, flag x) only.
 */

XRegExp.addToken(/\s+|#[^\n]*\n?/, getContextualTokenSeparator, {
  flag: 'x'
});
/*
 * Dot, in dotall mode (aka singleline mode, flag s) only.
 */

XRegExp.addToken(/\./, function () {
  return '[\\s\\S]';
}, {
  flag: 's',
  leadChar: '.'
});
/*
 * Named backreference: `\k<name>`. Backreference names can use the characters A-Z, a-z, 0-9, _,
 * and $ only. Also allows numbered backreferences as `\k<n>`.
 */

XRegExp.addToken(/\\k<([\w$]+)>/, function (match) {
  // Groups with the same name is an error, else would need `lastIndexOf`
  var index = isNaN(match[1]) ? this.captureNames.indexOf(match[1]) + 1 : +match[1];
  var endIndex = match.index + match[0].length;

  if (!index || index > this.captureNames.length) {
    throw new SyntaxError("Backreference to undefined group ".concat(match[0]));
  } // Keep backreferences separate from subsequent literal numbers. This avoids e.g.
  // inadvertedly changing `(?<n>)\k<n>1` to `()\11`.


  return "\\".concat(index).concat(endIndex === match.input.length || isNaN(match.input[endIndex]) ? '' : '(?:)');
}, {
  leadChar: '\\'
});
/*
 * Numbered backreference or octal, plus any following digits: `\0`, `\11`, etc. Octals except `\0`
 * not followed by 0-9 and backreferences to unopened capture groups throw an error. Other matches
 * are returned unaltered. IE < 9 doesn't support backreferences above `\99` in regex syntax.
 */

XRegExp.addToken(/\\(\d+)/, function (match, scope) {
  if (!(scope === defaultScope && /^[1-9]/.test(match[1]) && +match[1] <= this.captureNames.length) && match[1] !== '0') {
    throw new SyntaxError("Cannot use octal escape or backreference to undefined group ".concat(match[0]));
  }

  return match[0];
}, {
  scope: 'all',
  leadChar: '\\'
});
/*
 * Named capturing group; match the opening delimiter only: `(?<name>`. Capture names can use the
 * characters A-Z, a-z, 0-9, _, and $ only. Names can't be integers. Supports Python-style
 * `(?P<name>` as an alternate syntax to avoid issues in some older versions of Opera which natively
 * supported the Python-style syntax. Otherwise, XRegExp might treat numbered backreferences to
 * Python-style named capture as octals.
 */

XRegExp.addToken(/\(\?P?<([\w$]+)>/, function (match) {
  // Disallow bare integers as names because named backreferences are added to match arrays
  // and therefore numeric properties may lead to incorrect lookups
  if (!isNaN(match[1])) {
    throw new SyntaxError("Cannot use integer as capture name ".concat(match[0]));
  }

  if (!XRegExp.isInstalled('namespacing') && (match[1] === 'length' || match[1] === '__proto__')) {
    throw new SyntaxError("Cannot use reserved word as capture name ".concat(match[0]));
  }

  if (this.captureNames.indexOf(match[1]) !== -1) {
    throw new SyntaxError("Cannot use same name for multiple groups ".concat(match[0]));
  }

  this.captureNames.push(match[1]);
  this.hasNamedCapture = true;
  return '(';
}, {
  leadChar: '('
});
/*
 * Capturing group; match the opening parenthesis only. Required for support of named capturing
 * groups. Also adds explicit capture mode (flag n).
 */

XRegExp.addToken(/\((?!\?)/, function (match, scope, flags) {
  if (flags.indexOf('n') !== -1) {
    return '(?:';
  }

  this.captureNames.push(null);
  return '(';
}, {
  optionalFlags: 'n',
  leadChar: '('
});
var _default = XRegExp;
exports.default = _default;
module.exports = exports["default"];
},{"@babel/runtime-corejs2/core-js/get-iterator":41,"@babel/runtime-corejs2/core-js/object/create":42,"@babel/runtime-corejs2/core-js/parse-int":43,"@babel/runtime-corejs2/helpers/interopRequireDefault":45,"@babel/runtime-corejs2/helpers/slicedToArray":48}],122:[function(require,module,exports){
module.exports = [
    {
        'name': 'InAdlam',
        'astral': '\uD83A[\uDD00-\uDD5F]'
    },
    {
        'name': 'InAegean_Numbers',
        'astral': '\uD800[\uDD00-\uDD3F]'
    },
    {
        'name': 'InAhom',
        'astral': '\uD805[\uDF00-\uDF3F]'
    },
    {
        'name': 'InAlchemical_Symbols',
        'astral': '\uD83D[\uDF00-\uDF7F]'
    },
    {
        'name': 'InAlphabetic_Presentation_Forms',
        'bmp': '\uFB00-\uFB4F'
    },
    {
        'name': 'InAnatolian_Hieroglyphs',
        'astral': '\uD811[\uDC00-\uDE7F]'
    },
    {
        'name': 'InAncient_Greek_Musical_Notation',
        'astral': '\uD834[\uDE00-\uDE4F]'
    },
    {
        'name': 'InAncient_Greek_Numbers',
        'astral': '\uD800[\uDD40-\uDD8F]'
    },
    {
        'name': 'InAncient_Symbols',
        'astral': '\uD800[\uDD90-\uDDCF]'
    },
    {
        'name': 'InArabic',
        'bmp': '\u0600-\u06FF'
    },
    {
        'name': 'InArabic_Extended_A',
        'bmp': '\u08A0-\u08FF'
    },
    {
        'name': 'InArabic_Mathematical_Alphabetic_Symbols',
        'astral': '\uD83B[\uDE00-\uDEFF]'
    },
    {
        'name': 'InArabic_Presentation_Forms_A',
        'bmp': '\uFB50-\uFDFF'
    },
    {
        'name': 'InArabic_Presentation_Forms_B',
        'bmp': '\uFE70-\uFEFF'
    },
    {
        'name': 'InArabic_Supplement',
        'bmp': '\u0750-\u077F'
    },
    {
        'name': 'InArmenian',
        'bmp': '\u0530-\u058F'
    },
    {
        'name': 'InArrows',
        'bmp': '\u2190-\u21FF'
    },
    {
        'name': 'InAvestan',
        'astral': '\uD802[\uDF00-\uDF3F]'
    },
    {
        'name': 'InBalinese',
        'bmp': '\u1B00-\u1B7F'
    },
    {
        'name': 'InBamum',
        'bmp': '\uA6A0-\uA6FF'
    },
    {
        'name': 'InBamum_Supplement',
        'astral': '\uD81A[\uDC00-\uDE3F]'
    },
    {
        'name': 'InBasic_Latin',
        'bmp': '\0-\x7F'
    },
    {
        'name': 'InBassa_Vah',
        'astral': '\uD81A[\uDED0-\uDEFF]'
    },
    {
        'name': 'InBatak',
        'bmp': '\u1BC0-\u1BFF'
    },
    {
        'name': 'InBengali',
        'bmp': '\u0980-\u09FF'
    },
    {
        'name': 'InBhaiksuki',
        'astral': '\uD807[\uDC00-\uDC6F]'
    },
    {
        'name': 'InBlock_Elements',
        'bmp': '\u2580-\u259F'
    },
    {
        'name': 'InBopomofo',
        'bmp': '\u3100-\u312F'
    },
    {
        'name': 'InBopomofo_Extended',
        'bmp': '\u31A0-\u31BF'
    },
    {
        'name': 'InBox_Drawing',
        'bmp': '\u2500-\u257F'
    },
    {
        'name': 'InBrahmi',
        'astral': '\uD804[\uDC00-\uDC7F]'
    },
    {
        'name': 'InBraille_Patterns',
        'bmp': '\u2800-\u28FF'
    },
    {
        'name': 'InBuginese',
        'bmp': '\u1A00-\u1A1F'
    },
    {
        'name': 'InBuhid',
        'bmp': '\u1740-\u175F'
    },
    {
        'name': 'InByzantine_Musical_Symbols',
        'astral': '\uD834[\uDC00-\uDCFF]'
    },
    {
        'name': 'InCJK_Compatibility',
        'bmp': '\u3300-\u33FF'
    },
    {
        'name': 'InCJK_Compatibility_Forms',
        'bmp': '\uFE30-\uFE4F'
    },
    {
        'name': 'InCJK_Compatibility_Ideographs',
        'bmp': '\uF900-\uFAFF'
    },
    {
        'name': 'InCJK_Compatibility_Ideographs_Supplement',
        'astral': '\uD87E[\uDC00-\uDE1F]'
    },
    {
        'name': 'InCJK_Radicals_Supplement',
        'bmp': '\u2E80-\u2EFF'
    },
    {
        'name': 'InCJK_Strokes',
        'bmp': '\u31C0-\u31EF'
    },
    {
        'name': 'InCJK_Symbols_And_Punctuation',
        'bmp': '\u3000-\u303F'
    },
    {
        'name': 'InCJK_Unified_Ideographs',
        'bmp': '\u4E00-\u9FFF'
    },
    {
        'name': 'InCJK_Unified_Ideographs_Extension_A',
        'bmp': '\u3400-\u4DBF'
    },
    {
        'name': 'InCJK_Unified_Ideographs_Extension_B',
        'astral': '[\uD840-\uD868][\uDC00-\uDFFF]|\uD869[\uDC00-\uDEDF]'
    },
    {
        'name': 'InCJK_Unified_Ideographs_Extension_C',
        'astral': '\uD869[\uDF00-\uDFFF]|[\uD86A-\uD86C][\uDC00-\uDFFF]|\uD86D[\uDC00-\uDF3F]'
    },
    {
        'name': 'InCJK_Unified_Ideographs_Extension_D',
        'astral': '\uD86D[\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1F]'
    },
    {
        'name': 'InCJK_Unified_Ideographs_Extension_E',
        'astral': '\uD86E[\uDC20-\uDFFF]|[\uD86F-\uD872][\uDC00-\uDFFF]|\uD873[\uDC00-\uDEAF]'
    },
    {
        'name': 'InCJK_Unified_Ideographs_Extension_F',
        'astral': '\uD873[\uDEB0-\uDFFF]|[\uD874-\uD879][\uDC00-\uDFFF]|\uD87A[\uDC00-\uDFEF]'
    },
    {
        'name': 'InCarian',
        'astral': '\uD800[\uDEA0-\uDEDF]'
    },
    {
        'name': 'InCaucasian_Albanian',
        'astral': '\uD801[\uDD30-\uDD6F]'
    },
    {
        'name': 'InChakma',
        'astral': '\uD804[\uDD00-\uDD4F]'
    },
    {
        'name': 'InCham',
        'bmp': '\uAA00-\uAA5F'
    },
    {
        'name': 'InCherokee',
        'bmp': '\u13A0-\u13FF'
    },
    {
        'name': 'InCherokee_Supplement',
        'bmp': '\uAB70-\uABBF'
    },
    {
        'name': 'InChess_Symbols',
        'astral': '\uD83E[\uDE00-\uDE6F]'
    },
    {
        'name': 'InCombining_Diacritical_Marks',
        'bmp': '\u0300-\u036F'
    },
    {
        'name': 'InCombining_Diacritical_Marks_Extended',
        'bmp': '\u1AB0-\u1AFF'
    },
    {
        'name': 'InCombining_Diacritical_Marks_For_Symbols',
        'bmp': '\u20D0-\u20FF'
    },
    {
        'name': 'InCombining_Diacritical_Marks_Supplement',
        'bmp': '\u1DC0-\u1DFF'
    },
    {
        'name': 'InCombining_Half_Marks',
        'bmp': '\uFE20-\uFE2F'
    },
    {
        'name': 'InCommon_Indic_Number_Forms',
        'bmp': '\uA830-\uA83F'
    },
    {
        'name': 'InControl_Pictures',
        'bmp': '\u2400-\u243F'
    },
    {
        'name': 'InCoptic',
        'bmp': '\u2C80-\u2CFF'
    },
    {
        'name': 'InCoptic_Epact_Numbers',
        'astral': '\uD800[\uDEE0-\uDEFF]'
    },
    {
        'name': 'InCounting_Rod_Numerals',
        'astral': '\uD834[\uDF60-\uDF7F]'
    },
    {
        'name': 'InCuneiform',
        'astral': '\uD808[\uDC00-\uDFFF]'
    },
    {
        'name': 'InCuneiform_Numbers_And_Punctuation',
        'astral': '\uD809[\uDC00-\uDC7F]'
    },
    {
        'name': 'InCurrency_Symbols',
        'bmp': '\u20A0-\u20CF'
    },
    {
        'name': 'InCypriot_Syllabary',
        'astral': '\uD802[\uDC00-\uDC3F]'
    },
    {
        'name': 'InCyrillic',
        'bmp': '\u0400-\u04FF'
    },
    {
        'name': 'InCyrillic_Extended_A',
        'bmp': '\u2DE0-\u2DFF'
    },
    {
        'name': 'InCyrillic_Extended_B',
        'bmp': '\uA640-\uA69F'
    },
    {
        'name': 'InCyrillic_Extended_C',
        'bmp': '\u1C80-\u1C8F'
    },
    {
        'name': 'InCyrillic_Supplement',
        'bmp': '\u0500-\u052F'
    },
    {
        'name': 'InDeseret',
        'astral': '\uD801[\uDC00-\uDC4F]'
    },
    {
        'name': 'InDevanagari',
        'bmp': '\u0900-\u097F'
    },
    {
        'name': 'InDevanagari_Extended',
        'bmp': '\uA8E0-\uA8FF'
    },
    {
        'name': 'InDingbats',
        'bmp': '\u2700-\u27BF'
    },
    {
        'name': 'InDogra',
        'astral': '\uD806[\uDC00-\uDC4F]'
    },
    {
        'name': 'InDomino_Tiles',
        'astral': '\uD83C[\uDC30-\uDC9F]'
    },
    {
        'name': 'InDuployan',
        'astral': '\uD82F[\uDC00-\uDC9F]'
    },
    {
        'name': 'InEarly_Dynastic_Cuneiform',
        'astral': '\uD809[\uDC80-\uDD4F]'
    },
    {
        'name': 'InEgyptian_Hieroglyphs',
        'astral': '\uD80C[\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2F]'
    },
    {
        'name': 'InElbasan',
        'astral': '\uD801[\uDD00-\uDD2F]'
    },
    {
        'name': 'InEmoticons',
        'astral': '\uD83D[\uDE00-\uDE4F]'
    },
    {
        'name': 'InEnclosed_Alphanumeric_Supplement',
        'astral': '\uD83C[\uDD00-\uDDFF]'
    },
    {
        'name': 'InEnclosed_Alphanumerics',
        'bmp': '\u2460-\u24FF'
    },
    {
        'name': 'InEnclosed_CJK_Letters_And_Months',
        'bmp': '\u3200-\u32FF'
    },
    {
        'name': 'InEnclosed_Ideographic_Supplement',
        'astral': '\uD83C[\uDE00-\uDEFF]'
    },
    {
        'name': 'InEthiopic',
        'bmp': '\u1200-\u137F'
    },
    {
        'name': 'InEthiopic_Extended',
        'bmp': '\u2D80-\u2DDF'
    },
    {
        'name': 'InEthiopic_Extended_A',
        'bmp': '\uAB00-\uAB2F'
    },
    {
        'name': 'InEthiopic_Supplement',
        'bmp': '\u1380-\u139F'
    },
    {
        'name': 'InGeneral_Punctuation',
        'bmp': '\u2000-\u206F'
    },
    {
        'name': 'InGeometric_Shapes',
        'bmp': '\u25A0-\u25FF'
    },
    {
        'name': 'InGeometric_Shapes_Extended',
        'astral': '\uD83D[\uDF80-\uDFFF]'
    },
    {
        'name': 'InGeorgian',
        'bmp': '\u10A0-\u10FF'
    },
    {
        'name': 'InGeorgian_Extended',
        'bmp': '\u1C90-\u1CBF'
    },
    {
        'name': 'InGeorgian_Supplement',
        'bmp': '\u2D00-\u2D2F'
    },
    {
        'name': 'InGlagolitic',
        'bmp': '\u2C00-\u2C5F'
    },
    {
        'name': 'InGlagolitic_Supplement',
        'astral': '\uD838[\uDC00-\uDC2F]'
    },
    {
        'name': 'InGothic',
        'astral': '\uD800[\uDF30-\uDF4F]'
    },
    {
        'name': 'InGrantha',
        'astral': '\uD804[\uDF00-\uDF7F]'
    },
    {
        'name': 'InGreek_And_Coptic',
        'bmp': '\u0370-\u03FF'
    },
    {
        'name': 'InGreek_Extended',
        'bmp': '\u1F00-\u1FFF'
    },
    {
        'name': 'InGujarati',
        'bmp': '\u0A80-\u0AFF'
    },
    {
        'name': 'InGunjala_Gondi',
        'astral': '\uD807[\uDD60-\uDDAF]'
    },
    {
        'name': 'InGurmukhi',
        'bmp': '\u0A00-\u0A7F'
    },
    {
        'name': 'InHalfwidth_And_Fullwidth_Forms',
        'bmp': '\uFF00-\uFFEF'
    },
    {
        'name': 'InHangul_Compatibility_Jamo',
        'bmp': '\u3130-\u318F'
    },
    {
        'name': 'InHangul_Jamo',
        'bmp': '\u1100-\u11FF'
    },
    {
        'name': 'InHangul_Jamo_Extended_A',
        'bmp': '\uA960-\uA97F'
    },
    {
        'name': 'InHangul_Jamo_Extended_B',
        'bmp': '\uD7B0-\uD7FF'
    },
    {
        'name': 'InHangul_Syllables',
        'bmp': '\uAC00-\uD7AF'
    },
    {
        'name': 'InHanifi_Rohingya',
        'astral': '\uD803[\uDD00-\uDD3F]'
    },
    {
        'name': 'InHanunoo',
        'bmp': '\u1720-\u173F'
    },
    {
        'name': 'InHatran',
        'astral': '\uD802[\uDCE0-\uDCFF]'
    },
    {
        'name': 'InHebrew',
        'bmp': '\u0590-\u05FF'
    },
    {
        'name': 'InHigh_Private_Use_Surrogates',
        'bmp': '\uDB80-\uDBFF'
    },
    {
        'name': 'InHigh_Surrogates',
        'bmp': '\uD800-\uDB7F'
    },
    {
        'name': 'InHiragana',
        'bmp': '\u3040-\u309F'
    },
    {
        'name': 'InIPA_Extensions',
        'bmp': '\u0250-\u02AF'
    },
    {
        'name': 'InIdeographic_Description_Characters',
        'bmp': '\u2FF0-\u2FFF'
    },
    {
        'name': 'InIdeographic_Symbols_And_Punctuation',
        'astral': '\uD81B[\uDFE0-\uDFFF]'
    },
    {
        'name': 'InImperial_Aramaic',
        'astral': '\uD802[\uDC40-\uDC5F]'
    },
    {
        'name': 'InIndic_Siyaq_Numbers',
        'astral': '\uD83B[\uDC70-\uDCBF]'
    },
    {
        'name': 'InInscriptional_Pahlavi',
        'astral': '\uD802[\uDF60-\uDF7F]'
    },
    {
        'name': 'InInscriptional_Parthian',
        'astral': '\uD802[\uDF40-\uDF5F]'
    },
    {
        'name': 'InJavanese',
        'bmp': '\uA980-\uA9DF'
    },
    {
        'name': 'InKaithi',
        'astral': '\uD804[\uDC80-\uDCCF]'
    },
    {
        'name': 'InKana_Extended_A',
        'astral': '\uD82C[\uDD00-\uDD2F]'
    },
    {
        'name': 'InKana_Supplement',
        'astral': '\uD82C[\uDC00-\uDCFF]'
    },
    {
        'name': 'InKanbun',
        'bmp': '\u3190-\u319F'
    },
    {
        'name': 'InKangxi_Radicals',
        'bmp': '\u2F00-\u2FDF'
    },
    {
        'name': 'InKannada',
        'bmp': '\u0C80-\u0CFF'
    },
    {
        'name': 'InKatakana',
        'bmp': '\u30A0-\u30FF'
    },
    {
        'name': 'InKatakana_Phonetic_Extensions',
        'bmp': '\u31F0-\u31FF'
    },
    {
        'name': 'InKayah_Li',
        'bmp': '\uA900-\uA92F'
    },
    {
        'name': 'InKharoshthi',
        'astral': '\uD802[\uDE00-\uDE5F]'
    },
    {
        'name': 'InKhmer',
        'bmp': '\u1780-\u17FF'
    },
    {
        'name': 'InKhmer_Symbols',
        'bmp': '\u19E0-\u19FF'
    },
    {
        'name': 'InKhojki',
        'astral': '\uD804[\uDE00-\uDE4F]'
    },
    {
        'name': 'InKhudawadi',
        'astral': '\uD804[\uDEB0-\uDEFF]'
    },
    {
        'name': 'InLao',
        'bmp': '\u0E80-\u0EFF'
    },
    {
        'name': 'InLatin_1_Supplement',
        'bmp': '\x80-\xFF'
    },
    {
        'name': 'InLatin_Extended_A',
        'bmp': '\u0100-\u017F'
    },
    {
        'name': 'InLatin_Extended_Additional',
        'bmp': '\u1E00-\u1EFF'
    },
    {
        'name': 'InLatin_Extended_B',
        'bmp': '\u0180-\u024F'
    },
    {
        'name': 'InLatin_Extended_C',
        'bmp': '\u2C60-\u2C7F'
    },
    {
        'name': 'InLatin_Extended_D',
        'bmp': '\uA720-\uA7FF'
    },
    {
        'name': 'InLatin_Extended_E',
        'bmp': '\uAB30-\uAB6F'
    },
    {
        'name': 'InLepcha',
        'bmp': '\u1C00-\u1C4F'
    },
    {
        'name': 'InLetterlike_Symbols',
        'bmp': '\u2100-\u214F'
    },
    {
        'name': 'InLimbu',
        'bmp': '\u1900-\u194F'
    },
    {
        'name': 'InLinear_A',
        'astral': '\uD801[\uDE00-\uDF7F]'
    },
    {
        'name': 'InLinear_B_Ideograms',
        'astral': '\uD800[\uDC80-\uDCFF]'
    },
    {
        'name': 'InLinear_B_Syllabary',
        'astral': '\uD800[\uDC00-\uDC7F]'
    },
    {
        'name': 'InLisu',
        'bmp': '\uA4D0-\uA4FF'
    },
    {
        'name': 'InLow_Surrogates',
        'bmp': '\uDC00-\uDFFF'
    },
    {
        'name': 'InLycian',
        'astral': '\uD800[\uDE80-\uDE9F]'
    },
    {
        'name': 'InLydian',
        'astral': '\uD802[\uDD20-\uDD3F]'
    },
    {
        'name': 'InMahajani',
        'astral': '\uD804[\uDD50-\uDD7F]'
    },
    {
        'name': 'InMahjong_Tiles',
        'astral': '\uD83C[\uDC00-\uDC2F]'
    },
    {
        'name': 'InMakasar',
        'astral': '\uD807[\uDEE0-\uDEFF]'
    },
    {
        'name': 'InMalayalam',
        'bmp': '\u0D00-\u0D7F'
    },
    {
        'name': 'InMandaic',
        'bmp': '\u0840-\u085F'
    },
    {
        'name': 'InManichaean',
        'astral': '\uD802[\uDEC0-\uDEFF]'
    },
    {
        'name': 'InMarchen',
        'astral': '\uD807[\uDC70-\uDCBF]'
    },
    {
        'name': 'InMasaram_Gondi',
        'astral': '\uD807[\uDD00-\uDD5F]'
    },
    {
        'name': 'InMathematical_Alphanumeric_Symbols',
        'astral': '\uD835[\uDC00-\uDFFF]'
    },
    {
        'name': 'InMathematical_Operators',
        'bmp': '\u2200-\u22FF'
    },
    {
        'name': 'InMayan_Numerals',
        'astral': '\uD834[\uDEE0-\uDEFF]'
    },
    {
        'name': 'InMedefaidrin',
        'astral': '\uD81B[\uDE40-\uDE9F]'
    },
    {
        'name': 'InMeetei_Mayek',
        'bmp': '\uABC0-\uABFF'
    },
    {
        'name': 'InMeetei_Mayek_Extensions',
        'bmp': '\uAAE0-\uAAFF'
    },
    {
        'name': 'InMende_Kikakui',
        'astral': '\uD83A[\uDC00-\uDCDF]'
    },
    {
        'name': 'InMeroitic_Cursive',
        'astral': '\uD802[\uDDA0-\uDDFF]'
    },
    {
        'name': 'InMeroitic_Hieroglyphs',
        'astral': '\uD802[\uDD80-\uDD9F]'
    },
    {
        'name': 'InMiao',
        'astral': '\uD81B[\uDF00-\uDF9F]'
    },
    {
        'name': 'InMiscellaneous_Mathematical_Symbols_A',
        'bmp': '\u27C0-\u27EF'
    },
    {
        'name': 'InMiscellaneous_Mathematical_Symbols_B',
        'bmp': '\u2980-\u29FF'
    },
    {
        'name': 'InMiscellaneous_Symbols',
        'bmp': '\u2600-\u26FF'
    },
    {
        'name': 'InMiscellaneous_Symbols_And_Arrows',
        'bmp': '\u2B00-\u2BFF'
    },
    {
        'name': 'InMiscellaneous_Symbols_And_Pictographs',
        'astral': '\uD83C[\uDF00-\uDFFF]|\uD83D[\uDC00-\uDDFF]'
    },
    {
        'name': 'InMiscellaneous_Technical',
        'bmp': '\u2300-\u23FF'
    },
    {
        'name': 'InModi',
        'astral': '\uD805[\uDE00-\uDE5F]'
    },
    {
        'name': 'InModifier_Tone_Letters',
        'bmp': '\uA700-\uA71F'
    },
    {
        'name': 'InMongolian',
        'bmp': '\u1800-\u18AF'
    },
    {
        'name': 'InMongolian_Supplement',
        'astral': '\uD805[\uDE60-\uDE7F]'
    },
    {
        'name': 'InMro',
        'astral': '\uD81A[\uDE40-\uDE6F]'
    },
    {
        'name': 'InMultani',
        'astral': '\uD804[\uDE80-\uDEAF]'
    },
    {
        'name': 'InMusical_Symbols',
        'astral': '\uD834[\uDD00-\uDDFF]'
    },
    {
        'name': 'InMyanmar',
        'bmp': '\u1000-\u109F'
    },
    {
        'name': 'InMyanmar_Extended_A',
        'bmp': '\uAA60-\uAA7F'
    },
    {
        'name': 'InMyanmar_Extended_B',
        'bmp': '\uA9E0-\uA9FF'
    },
    {
        'name': 'InNKo',
        'bmp': '\u07C0-\u07FF'
    },
    {
        'name': 'InNabataean',
        'astral': '\uD802[\uDC80-\uDCAF]'
    },
    {
        'name': 'InNew_Tai_Lue',
        'bmp': '\u1980-\u19DF'
    },
    {
        'name': 'InNewa',
        'astral': '\uD805[\uDC00-\uDC7F]'
    },
    {
        'name': 'InNumber_Forms',
        'bmp': '\u2150-\u218F'
    },
    {
        'name': 'InNushu',
        'astral': '\uD82C[\uDD70-\uDEFF]'
    },
    {
        'name': 'InOgham',
        'bmp': '\u1680-\u169F'
    },
    {
        'name': 'InOl_Chiki',
        'bmp': '\u1C50-\u1C7F'
    },
    {
        'name': 'InOld_Hungarian',
        'astral': '\uD803[\uDC80-\uDCFF]'
    },
    {
        'name': 'InOld_Italic',
        'astral': '\uD800[\uDF00-\uDF2F]'
    },
    {
        'name': 'InOld_North_Arabian',
        'astral': '\uD802[\uDE80-\uDE9F]'
    },
    {
        'name': 'InOld_Permic',
        'astral': '\uD800[\uDF50-\uDF7F]'
    },
    {
        'name': 'InOld_Persian',
        'astral': '\uD800[\uDFA0-\uDFDF]'
    },
    {
        'name': 'InOld_Sogdian',
        'astral': '\uD803[\uDF00-\uDF2F]'
    },
    {
        'name': 'InOld_South_Arabian',
        'astral': '\uD802[\uDE60-\uDE7F]'
    },
    {
        'name': 'InOld_Turkic',
        'astral': '\uD803[\uDC00-\uDC4F]'
    },
    {
        'name': 'InOptical_Character_Recognition',
        'bmp': '\u2440-\u245F'
    },
    {
        'name': 'InOriya',
        'bmp': '\u0B00-\u0B7F'
    },
    {
        'name': 'InOrnamental_Dingbats',
        'astral': '\uD83D[\uDE50-\uDE7F]'
    },
    {
        'name': 'InOsage',
        'astral': '\uD801[\uDCB0-\uDCFF]'
    },
    {
        'name': 'InOsmanya',
        'astral': '\uD801[\uDC80-\uDCAF]'
    },
    {
        'name': 'InPahawh_Hmong',
        'astral': '\uD81A[\uDF00-\uDF8F]'
    },
    {
        'name': 'InPalmyrene',
        'astral': '\uD802[\uDC60-\uDC7F]'
    },
    {
        'name': 'InPau_Cin_Hau',
        'astral': '\uD806[\uDEC0-\uDEFF]'
    },
    {
        'name': 'InPhags_Pa',
        'bmp': '\uA840-\uA87F'
    },
    {
        'name': 'InPhaistos_Disc',
        'astral': '\uD800[\uDDD0-\uDDFF]'
    },
    {
        'name': 'InPhoenician',
        'astral': '\uD802[\uDD00-\uDD1F]'
    },
    {
        'name': 'InPhonetic_Extensions',
        'bmp': '\u1D00-\u1D7F'
    },
    {
        'name': 'InPhonetic_Extensions_Supplement',
        'bmp': '\u1D80-\u1DBF'
    },
    {
        'name': 'InPlaying_Cards',
        'astral': '\uD83C[\uDCA0-\uDCFF]'
    },
    {
        'name': 'InPrivate_Use_Area',
        'bmp': '\uE000-\uF8FF'
    },
    {
        'name': 'InPsalter_Pahlavi',
        'astral': '\uD802[\uDF80-\uDFAF]'
    },
    {
        'name': 'InRejang',
        'bmp': '\uA930-\uA95F'
    },
    {
        'name': 'InRumi_Numeral_Symbols',
        'astral': '\uD803[\uDE60-\uDE7F]'
    },
    {
        'name': 'InRunic',
        'bmp': '\u16A0-\u16FF'
    },
    {
        'name': 'InSamaritan',
        'bmp': '\u0800-\u083F'
    },
    {
        'name': 'InSaurashtra',
        'bmp': '\uA880-\uA8DF'
    },
    {
        'name': 'InSharada',
        'astral': '\uD804[\uDD80-\uDDDF]'
    },
    {
        'name': 'InShavian',
        'astral': '\uD801[\uDC50-\uDC7F]'
    },
    {
        'name': 'InShorthand_Format_Controls',
        'astral': '\uD82F[\uDCA0-\uDCAF]'
    },
    {
        'name': 'InSiddham',
        'astral': '\uD805[\uDD80-\uDDFF]'
    },
    {
        'name': 'InSinhala',
        'bmp': '\u0D80-\u0DFF'
    },
    {
        'name': 'InSinhala_Archaic_Numbers',
        'astral': '\uD804[\uDDE0-\uDDFF]'
    },
    {
        'name': 'InSmall_Form_Variants',
        'bmp': '\uFE50-\uFE6F'
    },
    {
        'name': 'InSogdian',
        'astral': '\uD803[\uDF30-\uDF6F]'
    },
    {
        'name': 'InSora_Sompeng',
        'astral': '\uD804[\uDCD0-\uDCFF]'
    },
    {
        'name': 'InSoyombo',
        'astral': '\uD806[\uDE50-\uDEAF]'
    },
    {
        'name': 'InSpacing_Modifier_Letters',
        'bmp': '\u02B0-\u02FF'
    },
    {
        'name': 'InSpecials',
        'bmp': '\uFFF0-\uFFFF'
    },
    {
        'name': 'InSundanese',
        'bmp': '\u1B80-\u1BBF'
    },
    {
        'name': 'InSundanese_Supplement',
        'bmp': '\u1CC0-\u1CCF'
    },
    {
        'name': 'InSuperscripts_And_Subscripts',
        'bmp': '\u2070-\u209F'
    },
    {
        'name': 'InSupplemental_Arrows_A',
        'bmp': '\u27F0-\u27FF'
    },
    {
        'name': 'InSupplemental_Arrows_B',
        'bmp': '\u2900-\u297F'
    },
    {
        'name': 'InSupplemental_Arrows_C',
        'astral': '\uD83E[\uDC00-\uDCFF]'
    },
    {
        'name': 'InSupplemental_Mathematical_Operators',
        'bmp': '\u2A00-\u2AFF'
    },
    {
        'name': 'InSupplemental_Punctuation',
        'bmp': '\u2E00-\u2E7F'
    },
    {
        'name': 'InSupplemental_Symbols_And_Pictographs',
        'astral': '\uD83E[\uDD00-\uDDFF]'
    },
    {
        'name': 'InSupplementary_Private_Use_Area_A',
        'astral': '[\uDB80-\uDBBF][\uDC00-\uDFFF]'
    },
    {
        'name': 'InSupplementary_Private_Use_Area_B',
        'astral': '[\uDBC0-\uDBFF][\uDC00-\uDFFF]'
    },
    {
        'name': 'InSutton_SignWriting',
        'astral': '\uD836[\uDC00-\uDEAF]'
    },
    {
        'name': 'InSyloti_Nagri',
        'bmp': '\uA800-\uA82F'
    },
    {
        'name': 'InSyriac',
        'bmp': '\u0700-\u074F'
    },
    {
        'name': 'InSyriac_Supplement',
        'bmp': '\u0860-\u086F'
    },
    {
        'name': 'InTagalog',
        'bmp': '\u1700-\u171F'
    },
    {
        'name': 'InTagbanwa',
        'bmp': '\u1760-\u177F'
    },
    {
        'name': 'InTags',
        'astral': '\uDB40[\uDC00-\uDC7F]'
    },
    {
        'name': 'InTai_Le',
        'bmp': '\u1950-\u197F'
    },
    {
        'name': 'InTai_Tham',
        'bmp': '\u1A20-\u1AAF'
    },
    {
        'name': 'InTai_Viet',
        'bmp': '\uAA80-\uAADF'
    },
    {
        'name': 'InTai_Xuan_Jing_Symbols',
        'astral': '\uD834[\uDF00-\uDF5F]'
    },
    {
        'name': 'InTakri',
        'astral': '\uD805[\uDE80-\uDECF]'
    },
    {
        'name': 'InTamil',
        'bmp': '\u0B80-\u0BFF'
    },
    {
        'name': 'InTangut',
        'astral': '[\uD81C-\uD821][\uDC00-\uDFFF]'
    },
    {
        'name': 'InTangut_Components',
        'astral': '\uD822[\uDC00-\uDEFF]'
    },
    {
        'name': 'InTelugu',
        'bmp': '\u0C00-\u0C7F'
    },
    {
        'name': 'InThaana',
        'bmp': '\u0780-\u07BF'
    },
    {
        'name': 'InThai',
        'bmp': '\u0E00-\u0E7F'
    },
    {
        'name': 'InTibetan',
        'bmp': '\u0F00-\u0FFF'
    },
    {
        'name': 'InTifinagh',
        'bmp': '\u2D30-\u2D7F'
    },
    {
        'name': 'InTirhuta',
        'astral': '\uD805[\uDC80-\uDCDF]'
    },
    {
        'name': 'InTransport_And_Map_Symbols',
        'astral': '\uD83D[\uDE80-\uDEFF]'
    },
    {
        'name': 'InUgaritic',
        'astral': '\uD800[\uDF80-\uDF9F]'
    },
    {
        'name': 'InUnified_Canadian_Aboriginal_Syllabics',
        'bmp': '\u1400-\u167F'
    },
    {
        'name': 'InUnified_Canadian_Aboriginal_Syllabics_Extended',
        'bmp': '\u18B0-\u18FF'
    },
    {
        'name': 'InVai',
        'bmp': '\uA500-\uA63F'
    },
    {
        'name': 'InVariation_Selectors',
        'bmp': '\uFE00-\uFE0F'
    },
    {
        'name': 'InVariation_Selectors_Supplement',
        'astral': '\uDB40[\uDD00-\uDDEF]'
    },
    {
        'name': 'InVedic_Extensions',
        'bmp': '\u1CD0-\u1CFF'
    },
    {
        'name': 'InVertical_Forms',
        'bmp': '\uFE10-\uFE1F'
    },
    {
        'name': 'InWarang_Citi',
        'astral': '\uD806[\uDCA0-\uDCFF]'
    },
    {
        'name': 'InYi_Radicals',
        'bmp': '\uA490-\uA4CF'
    },
    {
        'name': 'InYi_Syllables',
        'bmp': '\uA000-\uA48F'
    },
    {
        'name': 'InYijing_Hexagram_Symbols',
        'bmp': '\u4DC0-\u4DFF'
    },
    {
        'name': 'InZanabazar_Square',
        'astral': '\uD806[\uDE00-\uDE4F]'
    }
];

},{}],123:[function(require,module,exports){
module.exports = [
    {
        'name': 'C',
        'alias': 'Other',
        'isBmpLast': true,
        'bmp': '\0-\x1F\x7F-\x9F\xAD\u0378\u0379\u0380-\u0383\u038B\u038D\u03A2\u0530\u0557\u0558\u058B\u058C\u0590\u05C8-\u05CF\u05EB-\u05EE\u05F5-\u0605\u061C\u061D\u06DD\u070E\u070F\u074B\u074C\u07B2-\u07BF\u07FB\u07FC\u082E\u082F\u083F\u085C\u085D\u085F\u086B-\u089F\u08B5\u08BE-\u08D2\u08E2\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FF\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A77-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0AF8\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0BFF\u0C0D\u0C11\u0C29\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5B-\u0C5F\u0C64\u0C65\u0C70-\u0C77\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0CFF\u0D04\u0D0D\u0D11\u0D45\u0D49\u0D50-\u0D53\u0D64\u0D65\u0D80\u0D81\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DE5\u0DF0\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E86\u0E89\u0E8B\u0E8C\u0E8E-\u0E93\u0E98\u0EA0\u0EA4\u0EA6\u0EA8\u0EA9\u0EAC\u0EBA\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F6\u13F7\u13FE\u13FF\u169D-\u169F\u16F9-\u16FF\u170D\u1715-\u171F\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180E\u180F\u181A-\u181F\u1879-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE\u1AAF\u1ABF-\u1AFF\u1B4C-\u1B4F\u1B7D-\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C89-\u1C8F\u1CBB\u1CBC\u1CC8-\u1CCF\u1CFA-\u1CFF\u1DFA\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u200B-\u200F\u202A-\u202E\u2060-\u206F\u2072\u2073\u208F\u209D-\u209F\u20C0-\u20CF\u20F1-\u20FF\u218C-\u218F\u2427-\u243F\u244B-\u245F\u2B74\u2B75\u2B96\u2B97\u2BC9\u2BFF\u2C2F\u2C5F\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E4F-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u3130\u318F\u31BB-\u31BF\u31E4-\u31EF\u321F\u32FF\u4DB6-\u4DBF\u9FF0-\u9FFF\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA6F8-\uA6FF\uA7BA-\uA7F6\uA82C-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C6-\uA8CD\uA8DA-\uA8DF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F\uAB66-\uAB6F\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uF8FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFE\uFDFF\uFE1A-\uFE1F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD-\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFFB\uFFFE\uFFFF',
        'astral': '\uD800[\uDC0C\uDC27\uDC3B\uDC3E\uDC4E\uDC4F\uDC5E-\uDC7F\uDCFB-\uDCFF\uDD03-\uDD06\uDD34-\uDD36\uDD8F\uDD9C-\uDD9F\uDDA1-\uDDCF\uDDFE-\uDE7F\uDE9D-\uDE9F\uDED1-\uDEDF\uDEFC-\uDEFF\uDF24-\uDF2C\uDF4B-\uDF4F\uDF7B-\uDF7F\uDF9E\uDFC4-\uDFC7\uDFD6-\uDFFF]|\uD801[\uDC9E\uDC9F\uDCAA-\uDCAF\uDCD4-\uDCD7\uDCFC-\uDCFF\uDD28-\uDD2F\uDD64-\uDD6E\uDD70-\uDDFF\uDF37-\uDF3F\uDF56-\uDF5F\uDF68-\uDFFF]|\uD802[\uDC06\uDC07\uDC09\uDC36\uDC39-\uDC3B\uDC3D\uDC3E\uDC56\uDC9F-\uDCA6\uDCB0-\uDCDF\uDCF3\uDCF6-\uDCFA\uDD1C-\uDD1E\uDD3A-\uDD3E\uDD40-\uDD7F\uDDB8-\uDDBB\uDDD0\uDDD1\uDE04\uDE07-\uDE0B\uDE14\uDE18\uDE36\uDE37\uDE3B-\uDE3E\uDE49-\uDE4F\uDE59-\uDE5F\uDEA0-\uDEBF\uDEE7-\uDEEA\uDEF7-\uDEFF\uDF36-\uDF38\uDF56\uDF57\uDF73-\uDF77\uDF92-\uDF98\uDF9D-\uDFA8\uDFB0-\uDFFF]|\uD803[\uDC49-\uDC7F\uDCB3-\uDCBF\uDCF3-\uDCF9\uDD28-\uDD2F\uDD3A-\uDE5F\uDE7F-\uDEFF\uDF28-\uDF2F\uDF5A-\uDFFF]|\uD804[\uDC4E-\uDC51\uDC70-\uDC7E\uDCBD\uDCC2-\uDCCF\uDCE9-\uDCEF\uDCFA-\uDCFF\uDD35\uDD47-\uDD4F\uDD77-\uDD7F\uDDCE\uDDCF\uDDE0\uDDF5-\uDDFF\uDE12\uDE3F-\uDE7F\uDE87\uDE89\uDE8E\uDE9E\uDEAA-\uDEAF\uDEEB-\uDEEF\uDEFA-\uDEFF\uDF04\uDF0D\uDF0E\uDF11\uDF12\uDF29\uDF31\uDF34\uDF3A\uDF45\uDF46\uDF49\uDF4A\uDF4E\uDF4F\uDF51-\uDF56\uDF58-\uDF5C\uDF64\uDF65\uDF6D-\uDF6F\uDF75-\uDFFF]|\uD805[\uDC5A\uDC5C\uDC5F-\uDC7F\uDCC8-\uDCCF\uDCDA-\uDD7F\uDDB6\uDDB7\uDDDE-\uDDFF\uDE45-\uDE4F\uDE5A-\uDE5F\uDE6D-\uDE7F\uDEB8-\uDEBF\uDECA-\uDEFF\uDF1B\uDF1C\uDF2C-\uDF2F\uDF40-\uDFFF]|\uD806[\uDC3C-\uDC9F\uDCF3-\uDCFE\uDD00-\uDDFF\uDE48-\uDE4F\uDE84\uDE85\uDEA3-\uDEBF\uDEF9-\uDFFF]|\uD807[\uDC09\uDC37\uDC46-\uDC4F\uDC6D-\uDC6F\uDC90\uDC91\uDCA8\uDCB7-\uDCFF\uDD07\uDD0A\uDD37-\uDD39\uDD3B\uDD3E\uDD48-\uDD4F\uDD5A-\uDD5F\uDD66\uDD69\uDD8F\uDD92\uDD99-\uDD9F\uDDAA-\uDEDF\uDEF9-\uDFFF]|\uD808[\uDF9A-\uDFFF]|\uD809[\uDC6F\uDC75-\uDC7F\uDD44-\uDFFF]|[\uD80A\uD80B\uD80E-\uD810\uD812-\uD819\uD823-\uD82B\uD82D\uD82E\uD830-\uD833\uD837\uD839\uD83F\uD87B-\uD87D\uD87F-\uDB3F\uDB41-\uDBFF][\uDC00-\uDFFF]|\uD80D[\uDC2F-\uDFFF]|\uD811[\uDE47-\uDFFF]|\uD81A[\uDE39-\uDE3F\uDE5F\uDE6A-\uDE6D\uDE70-\uDECF\uDEEE\uDEEF\uDEF6-\uDEFF\uDF46-\uDF4F\uDF5A\uDF62\uDF78-\uDF7C\uDF90-\uDFFF]|\uD81B[\uDC00-\uDE3F\uDE9B-\uDEFF\uDF45-\uDF4F\uDF7F-\uDF8E\uDFA0-\uDFDF\uDFE2-\uDFFF]|\uD821[\uDFF2-\uDFFF]|\uD822[\uDEF3-\uDFFF]|\uD82C[\uDD1F-\uDD6F\uDEFC-\uDFFF]|\uD82F[\uDC6B-\uDC6F\uDC7D-\uDC7F\uDC89-\uDC8F\uDC9A\uDC9B\uDCA0-\uDFFF]|\uD834[\uDCF6-\uDCFF\uDD27\uDD28\uDD73-\uDD7A\uDDE9-\uDDFF\uDE46-\uDEDF\uDEF4-\uDEFF\uDF57-\uDF5F\uDF79-\uDFFF]|\uD835[\uDC55\uDC9D\uDCA0\uDCA1\uDCA3\uDCA4\uDCA7\uDCA8\uDCAD\uDCBA\uDCBC\uDCC4\uDD06\uDD0B\uDD0C\uDD15\uDD1D\uDD3A\uDD3F\uDD45\uDD47-\uDD49\uDD51\uDEA6\uDEA7\uDFCC\uDFCD]|\uD836[\uDE8C-\uDE9A\uDEA0\uDEB0-\uDFFF]|\uD838[\uDC07\uDC19\uDC1A\uDC22\uDC25\uDC2B-\uDFFF]|\uD83A[\uDCC5\uDCC6\uDCD7-\uDCFF\uDD4B-\uDD4F\uDD5A-\uDD5D\uDD60-\uDFFF]|\uD83B[\uDC00-\uDC70\uDCB5-\uDDFF\uDE04\uDE20\uDE23\uDE25\uDE26\uDE28\uDE33\uDE38\uDE3A\uDE3C-\uDE41\uDE43-\uDE46\uDE48\uDE4A\uDE4C\uDE50\uDE53\uDE55\uDE56\uDE58\uDE5A\uDE5C\uDE5E\uDE60\uDE63\uDE65\uDE66\uDE6B\uDE73\uDE78\uDE7D\uDE7F\uDE8A\uDE9C-\uDEA0\uDEA4\uDEAA\uDEBC-\uDEEF\uDEF2-\uDFFF]|\uD83C[\uDC2C-\uDC2F\uDC94-\uDC9F\uDCAF\uDCB0\uDCC0\uDCD0\uDCF6-\uDCFF\uDD0D-\uDD0F\uDD6C-\uDD6F\uDDAD-\uDDE5\uDE03-\uDE0F\uDE3C-\uDE3F\uDE49-\uDE4F\uDE52-\uDE5F\uDE66-\uDEFF]|\uD83D[\uDED5-\uDEDF\uDEED-\uDEEF\uDEFA-\uDEFF\uDF74-\uDF7F\uDFD9-\uDFFF]|\uD83E[\uDC0C-\uDC0F\uDC48-\uDC4F\uDC5A-\uDC5F\uDC88-\uDC8F\uDCAE-\uDCFF\uDD0C-\uDD0F\uDD3F\uDD71\uDD72\uDD77-\uDD79\uDD7B\uDDA3-\uDDAF\uDDBA-\uDDBF\uDDC3-\uDDCF\uDE00-\uDE5F\uDE6E-\uDFFF]|\uD869[\uDED7-\uDEFF]|\uD86D[\uDF35-\uDF3F]|\uD86E[\uDC1E\uDC1F]|\uD873[\uDEA2-\uDEAF]|\uD87A[\uDFE1-\uDFFF]|\uD87E[\uDE1E-\uDFFF]|\uDB40[\uDC00-\uDCFF\uDDF0-\uDFFF]'
    },
    {
        'name': 'Cc',
        'alias': 'Control',
        'bmp': '\0-\x1F\x7F-\x9F'
    },
    {
        'name': 'Cf',
        'alias': 'Format',
        'bmp': '\xAD\u0600-\u0605\u061C\u06DD\u070F\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB',
        'astral': '\uD804[\uDCBD\uDCCD]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]'
    },
    {
        'name': 'Cn',
        'alias': 'Unassigned',
        'bmp': '\u0378\u0379\u0380-\u0383\u038B\u038D\u03A2\u0530\u0557\u0558\u058B\u058C\u0590\u05C8-\u05CF\u05EB-\u05EE\u05F5-\u05FF\u061D\u070E\u074B\u074C\u07B2-\u07BF\u07FB\u07FC\u082E\u082F\u083F\u085C\u085D\u085F\u086B-\u089F\u08B5\u08BE-\u08D2\u0984\u098D\u098E\u0991\u0992\u09A9\u09B1\u09B3-\u09B5\u09BA\u09BB\u09C5\u09C6\u09C9\u09CA\u09CF-\u09D6\u09D8-\u09DB\u09DE\u09E4\u09E5\u09FF\u0A00\u0A04\u0A0B-\u0A0E\u0A11\u0A12\u0A29\u0A31\u0A34\u0A37\u0A3A\u0A3B\u0A3D\u0A43-\u0A46\u0A49\u0A4A\u0A4E-\u0A50\u0A52-\u0A58\u0A5D\u0A5F-\u0A65\u0A77-\u0A80\u0A84\u0A8E\u0A92\u0AA9\u0AB1\u0AB4\u0ABA\u0ABB\u0AC6\u0ACA\u0ACE\u0ACF\u0AD1-\u0ADF\u0AE4\u0AE5\u0AF2-\u0AF8\u0B00\u0B04\u0B0D\u0B0E\u0B11\u0B12\u0B29\u0B31\u0B34\u0B3A\u0B3B\u0B45\u0B46\u0B49\u0B4A\u0B4E-\u0B55\u0B58-\u0B5B\u0B5E\u0B64\u0B65\u0B78-\u0B81\u0B84\u0B8B-\u0B8D\u0B91\u0B96-\u0B98\u0B9B\u0B9D\u0BA0-\u0BA2\u0BA5-\u0BA7\u0BAB-\u0BAD\u0BBA-\u0BBD\u0BC3-\u0BC5\u0BC9\u0BCE\u0BCF\u0BD1-\u0BD6\u0BD8-\u0BE5\u0BFB-\u0BFF\u0C0D\u0C11\u0C29\u0C3A-\u0C3C\u0C45\u0C49\u0C4E-\u0C54\u0C57\u0C5B-\u0C5F\u0C64\u0C65\u0C70-\u0C77\u0C8D\u0C91\u0CA9\u0CB4\u0CBA\u0CBB\u0CC5\u0CC9\u0CCE-\u0CD4\u0CD7-\u0CDD\u0CDF\u0CE4\u0CE5\u0CF0\u0CF3-\u0CFF\u0D04\u0D0D\u0D11\u0D45\u0D49\u0D50-\u0D53\u0D64\u0D65\u0D80\u0D81\u0D84\u0D97-\u0D99\u0DB2\u0DBC\u0DBE\u0DBF\u0DC7-\u0DC9\u0DCB-\u0DCE\u0DD5\u0DD7\u0DE0-\u0DE5\u0DF0\u0DF1\u0DF5-\u0E00\u0E3B-\u0E3E\u0E5C-\u0E80\u0E83\u0E85\u0E86\u0E89\u0E8B\u0E8C\u0E8E-\u0E93\u0E98\u0EA0\u0EA4\u0EA6\u0EA8\u0EA9\u0EAC\u0EBA\u0EBE\u0EBF\u0EC5\u0EC7\u0ECE\u0ECF\u0EDA\u0EDB\u0EE0-\u0EFF\u0F48\u0F6D-\u0F70\u0F98\u0FBD\u0FCD\u0FDB-\u0FFF\u10C6\u10C8-\u10CC\u10CE\u10CF\u1249\u124E\u124F\u1257\u1259\u125E\u125F\u1289\u128E\u128F\u12B1\u12B6\u12B7\u12BF\u12C1\u12C6\u12C7\u12D7\u1311\u1316\u1317\u135B\u135C\u137D-\u137F\u139A-\u139F\u13F6\u13F7\u13FE\u13FF\u169D-\u169F\u16F9-\u16FF\u170D\u1715-\u171F\u1737-\u173F\u1754-\u175F\u176D\u1771\u1774-\u177F\u17DE\u17DF\u17EA-\u17EF\u17FA-\u17FF\u180F\u181A-\u181F\u1879-\u187F\u18AB-\u18AF\u18F6-\u18FF\u191F\u192C-\u192F\u193C-\u193F\u1941-\u1943\u196E\u196F\u1975-\u197F\u19AC-\u19AF\u19CA-\u19CF\u19DB-\u19DD\u1A1C\u1A1D\u1A5F\u1A7D\u1A7E\u1A8A-\u1A8F\u1A9A-\u1A9F\u1AAE\u1AAF\u1ABF-\u1AFF\u1B4C-\u1B4F\u1B7D-\u1B7F\u1BF4-\u1BFB\u1C38-\u1C3A\u1C4A-\u1C4C\u1C89-\u1C8F\u1CBB\u1CBC\u1CC8-\u1CCF\u1CFA-\u1CFF\u1DFA\u1F16\u1F17\u1F1E\u1F1F\u1F46\u1F47\u1F4E\u1F4F\u1F58\u1F5A\u1F5C\u1F5E\u1F7E\u1F7F\u1FB5\u1FC5\u1FD4\u1FD5\u1FDC\u1FF0\u1FF1\u1FF5\u1FFF\u2065\u2072\u2073\u208F\u209D-\u209F\u20C0-\u20CF\u20F1-\u20FF\u218C-\u218F\u2427-\u243F\u244B-\u245F\u2B74\u2B75\u2B96\u2B97\u2BC9\u2BFF\u2C2F\u2C5F\u2CF4-\u2CF8\u2D26\u2D28-\u2D2C\u2D2E\u2D2F\u2D68-\u2D6E\u2D71-\u2D7E\u2D97-\u2D9F\u2DA7\u2DAF\u2DB7\u2DBF\u2DC7\u2DCF\u2DD7\u2DDF\u2E4F-\u2E7F\u2E9A\u2EF4-\u2EFF\u2FD6-\u2FEF\u2FFC-\u2FFF\u3040\u3097\u3098\u3100-\u3104\u3130\u318F\u31BB-\u31BF\u31E4-\u31EF\u321F\u32FF\u4DB6-\u4DBF\u9FF0-\u9FFF\uA48D-\uA48F\uA4C7-\uA4CF\uA62C-\uA63F\uA6F8-\uA6FF\uA7BA-\uA7F6\uA82C-\uA82F\uA83A-\uA83F\uA878-\uA87F\uA8C6-\uA8CD\uA8DA-\uA8DF\uA954-\uA95E\uA97D-\uA97F\uA9CE\uA9DA-\uA9DD\uA9FF\uAA37-\uAA3F\uAA4E\uAA4F\uAA5A\uAA5B\uAAC3-\uAADA\uAAF7-\uAB00\uAB07\uAB08\uAB0F\uAB10\uAB17-\uAB1F\uAB27\uAB2F\uAB66-\uAB6F\uABEE\uABEF\uABFA-\uABFF\uD7A4-\uD7AF\uD7C7-\uD7CA\uD7FC-\uD7FF\uFA6E\uFA6F\uFADA-\uFAFF\uFB07-\uFB12\uFB18-\uFB1C\uFB37\uFB3D\uFB3F\uFB42\uFB45\uFBC2-\uFBD2\uFD40-\uFD4F\uFD90\uFD91\uFDC8-\uFDEF\uFDFE\uFDFF\uFE1A-\uFE1F\uFE53\uFE67\uFE6C-\uFE6F\uFE75\uFEFD\uFEFE\uFF00\uFFBF-\uFFC1\uFFC8\uFFC9\uFFD0\uFFD1\uFFD8\uFFD9\uFFDD-\uFFDF\uFFE7\uFFEF-\uFFF8\uFFFE\uFFFF',
        'astral': '\uD800[\uDC0C\uDC27\uDC3B\uDC3E\uDC4E\uDC4F\uDC5E-\uDC7F\uDCFB-\uDCFF\uDD03-\uDD06\uDD34-\uDD36\uDD8F\uDD9C-\uDD9F\uDDA1-\uDDCF\uDDFE-\uDE7F\uDE9D-\uDE9F\uDED1-\uDEDF\uDEFC-\uDEFF\uDF24-\uDF2C\uDF4B-\uDF4F\uDF7B-\uDF7F\uDF9E\uDFC4-\uDFC7\uDFD6-\uDFFF]|\uD801[\uDC9E\uDC9F\uDCAA-\uDCAF\uDCD4-\uDCD7\uDCFC-\uDCFF\uDD28-\uDD2F\uDD64-\uDD6E\uDD70-\uDDFF\uDF37-\uDF3F\uDF56-\uDF5F\uDF68-\uDFFF]|\uD802[\uDC06\uDC07\uDC09\uDC36\uDC39-\uDC3B\uDC3D\uDC3E\uDC56\uDC9F-\uDCA6\uDCB0-\uDCDF\uDCF3\uDCF6-\uDCFA\uDD1C-\uDD1E\uDD3A-\uDD3E\uDD40-\uDD7F\uDDB8-\uDDBB\uDDD0\uDDD1\uDE04\uDE07-\uDE0B\uDE14\uDE18\uDE36\uDE37\uDE3B-\uDE3E\uDE49-\uDE4F\uDE59-\uDE5F\uDEA0-\uDEBF\uDEE7-\uDEEA\uDEF7-\uDEFF\uDF36-\uDF38\uDF56\uDF57\uDF73-\uDF77\uDF92-\uDF98\uDF9D-\uDFA8\uDFB0-\uDFFF]|\uD803[\uDC49-\uDC7F\uDCB3-\uDCBF\uDCF3-\uDCF9\uDD28-\uDD2F\uDD3A-\uDE5F\uDE7F-\uDEFF\uDF28-\uDF2F\uDF5A-\uDFFF]|\uD804[\uDC4E-\uDC51\uDC70-\uDC7E\uDCC2-\uDCCC\uDCCE\uDCCF\uDCE9-\uDCEF\uDCFA-\uDCFF\uDD35\uDD47-\uDD4F\uDD77-\uDD7F\uDDCE\uDDCF\uDDE0\uDDF5-\uDDFF\uDE12\uDE3F-\uDE7F\uDE87\uDE89\uDE8E\uDE9E\uDEAA-\uDEAF\uDEEB-\uDEEF\uDEFA-\uDEFF\uDF04\uDF0D\uDF0E\uDF11\uDF12\uDF29\uDF31\uDF34\uDF3A\uDF45\uDF46\uDF49\uDF4A\uDF4E\uDF4F\uDF51-\uDF56\uDF58-\uDF5C\uDF64\uDF65\uDF6D-\uDF6F\uDF75-\uDFFF]|\uD805[\uDC5A\uDC5C\uDC5F-\uDC7F\uDCC8-\uDCCF\uDCDA-\uDD7F\uDDB6\uDDB7\uDDDE-\uDDFF\uDE45-\uDE4F\uDE5A-\uDE5F\uDE6D-\uDE7F\uDEB8-\uDEBF\uDECA-\uDEFF\uDF1B\uDF1C\uDF2C-\uDF2F\uDF40-\uDFFF]|\uD806[\uDC3C-\uDC9F\uDCF3-\uDCFE\uDD00-\uDDFF\uDE48-\uDE4F\uDE84\uDE85\uDEA3-\uDEBF\uDEF9-\uDFFF]|\uD807[\uDC09\uDC37\uDC46-\uDC4F\uDC6D-\uDC6F\uDC90\uDC91\uDCA8\uDCB7-\uDCFF\uDD07\uDD0A\uDD37-\uDD39\uDD3B\uDD3E\uDD48-\uDD4F\uDD5A-\uDD5F\uDD66\uDD69\uDD8F\uDD92\uDD99-\uDD9F\uDDAA-\uDEDF\uDEF9-\uDFFF]|\uD808[\uDF9A-\uDFFF]|\uD809[\uDC6F\uDC75-\uDC7F\uDD44-\uDFFF]|[\uD80A\uD80B\uD80E-\uD810\uD812-\uD819\uD823-\uD82B\uD82D\uD82E\uD830-\uD833\uD837\uD839\uD83F\uD87B-\uD87D\uD87F-\uDB3F\uDB41-\uDB7F][\uDC00-\uDFFF]|\uD80D[\uDC2F-\uDFFF]|\uD811[\uDE47-\uDFFF]|\uD81A[\uDE39-\uDE3F\uDE5F\uDE6A-\uDE6D\uDE70-\uDECF\uDEEE\uDEEF\uDEF6-\uDEFF\uDF46-\uDF4F\uDF5A\uDF62\uDF78-\uDF7C\uDF90-\uDFFF]|\uD81B[\uDC00-\uDE3F\uDE9B-\uDEFF\uDF45-\uDF4F\uDF7F-\uDF8E\uDFA0-\uDFDF\uDFE2-\uDFFF]|\uD821[\uDFF2-\uDFFF]|\uD822[\uDEF3-\uDFFF]|\uD82C[\uDD1F-\uDD6F\uDEFC-\uDFFF]|\uD82F[\uDC6B-\uDC6F\uDC7D-\uDC7F\uDC89-\uDC8F\uDC9A\uDC9B\uDCA4-\uDFFF]|\uD834[\uDCF6-\uDCFF\uDD27\uDD28\uDDE9-\uDDFF\uDE46-\uDEDF\uDEF4-\uDEFF\uDF57-\uDF5F\uDF79-\uDFFF]|\uD835[\uDC55\uDC9D\uDCA0\uDCA1\uDCA3\uDCA4\uDCA7\uDCA8\uDCAD\uDCBA\uDCBC\uDCC4\uDD06\uDD0B\uDD0C\uDD15\uDD1D\uDD3A\uDD3F\uDD45\uDD47-\uDD49\uDD51\uDEA6\uDEA7\uDFCC\uDFCD]|\uD836[\uDE8C-\uDE9A\uDEA0\uDEB0-\uDFFF]|\uD838[\uDC07\uDC19\uDC1A\uDC22\uDC25\uDC2B-\uDFFF]|\uD83A[\uDCC5\uDCC6\uDCD7-\uDCFF\uDD4B-\uDD4F\uDD5A-\uDD5D\uDD60-\uDFFF]|\uD83B[\uDC00-\uDC70\uDCB5-\uDDFF\uDE04\uDE20\uDE23\uDE25\uDE26\uDE28\uDE33\uDE38\uDE3A\uDE3C-\uDE41\uDE43-\uDE46\uDE48\uDE4A\uDE4C\uDE50\uDE53\uDE55\uDE56\uDE58\uDE5A\uDE5C\uDE5E\uDE60\uDE63\uDE65\uDE66\uDE6B\uDE73\uDE78\uDE7D\uDE7F\uDE8A\uDE9C-\uDEA0\uDEA4\uDEAA\uDEBC-\uDEEF\uDEF2-\uDFFF]|\uD83C[\uDC2C-\uDC2F\uDC94-\uDC9F\uDCAF\uDCB0\uDCC0\uDCD0\uDCF6-\uDCFF\uDD0D-\uDD0F\uDD6C-\uDD6F\uDDAD-\uDDE5\uDE03-\uDE0F\uDE3C-\uDE3F\uDE49-\uDE4F\uDE52-\uDE5F\uDE66-\uDEFF]|\uD83D[\uDED5-\uDEDF\uDEED-\uDEEF\uDEFA-\uDEFF\uDF74-\uDF7F\uDFD9-\uDFFF]|\uD83E[\uDC0C-\uDC0F\uDC48-\uDC4F\uDC5A-\uDC5F\uDC88-\uDC8F\uDCAE-\uDCFF\uDD0C-\uDD0F\uDD3F\uDD71\uDD72\uDD77-\uDD79\uDD7B\uDDA3-\uDDAF\uDDBA-\uDDBF\uDDC3-\uDDCF\uDE00-\uDE5F\uDE6E-\uDFFF]|\uD869[\uDED7-\uDEFF]|\uD86D[\uDF35-\uDF3F]|\uD86E[\uDC1E\uDC1F]|\uD873[\uDEA2-\uDEAF]|\uD87A[\uDFE1-\uDFFF]|\uD87E[\uDE1E-\uDFFF]|\uDB40[\uDC00\uDC02-\uDC1F\uDC80-\uDCFF\uDDF0-\uDFFF]|[\uDBBF\uDBFF][\uDFFE\uDFFF]'
    },
    {
        'name': 'Co',
        'alias': 'Private_Use',
        'bmp': '\uE000-\uF8FF',
        'astral': '[\uDB80-\uDBBE\uDBC0-\uDBFE][\uDC00-\uDFFF]|[\uDBBF\uDBFF][\uDC00-\uDFFD]'
    },
    {
        'name': 'Cs',
        'alias': 'Surrogate',
        'bmp': '\uD800-\uDFFF'
    },
    {
        'name': 'L',
        'alias': 'Letter',
        'bmp': 'A-Za-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u05D0-\u05EA\u05EF-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1878\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005\u3006\u3031-\u3035\u303B\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEF\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6E5\uA717-\uA71F\uA722-\uA788\uA78B-\uA7B9\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC',
        'astral': '\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF40\uDF42-\uDF49\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2\uDD00-\uDD23\uDF00-\uDF1C\uDF27\uDF30-\uDF45]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD44\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF1A]|\uD806[\uDC00-\uDC2B\uDCA0-\uDCDF\uDCFF\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE83\uDE86-\uDE89\uDE9D\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD89\uDD98\uDEE0-\uDEF2]|\uD808[\uDC00-\uDF99]|\uD809[\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDE40-\uDE7F\uDF00-\uDF44\uDF50\uDF93-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFF1]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]'
    },
    {
        'name': 'LC',
        'alias': 'Cased_Letter',
        'bmp': 'A-Za-z\xB5\xC0-\xD6\xD8-\xF6\xF8-\u01BA\u01BC-\u01BF\u01C4-\u0293\u0295-\u02AF\u0370-\u0373\u0376\u0377\u037B-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0560-\u0588\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FD-\u10FF\u13A0-\u13F5\u13F8-\u13FD\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1D00-\u1D2B\u1D6B-\u1D77\u1D79-\u1D9A\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2134\u2139\u213C-\u213F\u2145-\u2149\u214E\u2183\u2184\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2C7B\u2C7E-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\uA640-\uA66D\uA680-\uA69B\uA722-\uA76F\uA771-\uA787\uA78B-\uA78E\uA790-\uA7B9\uA7FA\uAB30-\uAB5A\uAB60-\uAB65\uAB70-\uABBF\uFB00-\uFB06\uFB13-\uFB17\uFF21-\uFF3A\uFF41-\uFF5A',
        'astral': '\uD801[\uDC00-\uDC4F\uDCB0-\uDCD3\uDCD8-\uDCFB]|\uD803[\uDC80-\uDCB2\uDCC0-\uDCF2]|\uD806[\uDCA0-\uDCDF]|\uD81B[\uDE40-\uDE7F]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDD00-\uDD43]'
    },
    {
        'name': 'Ll',
        'alias': 'Lowercase_Letter',
        'bmp': 'a-z\xB5\xDF-\xF6\xF8-\xFF\u0101\u0103\u0105\u0107\u0109\u010B\u010D\u010F\u0111\u0113\u0115\u0117\u0119\u011B\u011D\u011F\u0121\u0123\u0125\u0127\u0129\u012B\u012D\u012F\u0131\u0133\u0135\u0137\u0138\u013A\u013C\u013E\u0140\u0142\u0144\u0146\u0148\u0149\u014B\u014D\u014F\u0151\u0153\u0155\u0157\u0159\u015B\u015D\u015F\u0161\u0163\u0165\u0167\u0169\u016B\u016D\u016F\u0171\u0173\u0175\u0177\u017A\u017C\u017E-\u0180\u0183\u0185\u0188\u018C\u018D\u0192\u0195\u0199-\u019B\u019E\u01A1\u01A3\u01A5\u01A8\u01AA\u01AB\u01AD\u01B0\u01B4\u01B6\u01B9\u01BA\u01BD-\u01BF\u01C6\u01C9\u01CC\u01CE\u01D0\u01D2\u01D4\u01D6\u01D8\u01DA\u01DC\u01DD\u01DF\u01E1\u01E3\u01E5\u01E7\u01E9\u01EB\u01ED\u01EF\u01F0\u01F3\u01F5\u01F9\u01FB\u01FD\u01FF\u0201\u0203\u0205\u0207\u0209\u020B\u020D\u020F\u0211\u0213\u0215\u0217\u0219\u021B\u021D\u021F\u0221\u0223\u0225\u0227\u0229\u022B\u022D\u022F\u0231\u0233-\u0239\u023C\u023F\u0240\u0242\u0247\u0249\u024B\u024D\u024F-\u0293\u0295-\u02AF\u0371\u0373\u0377\u037B-\u037D\u0390\u03AC-\u03CE\u03D0\u03D1\u03D5-\u03D7\u03D9\u03DB\u03DD\u03DF\u03E1\u03E3\u03E5\u03E7\u03E9\u03EB\u03ED\u03EF-\u03F3\u03F5\u03F8\u03FB\u03FC\u0430-\u045F\u0461\u0463\u0465\u0467\u0469\u046B\u046D\u046F\u0471\u0473\u0475\u0477\u0479\u047B\u047D\u047F\u0481\u048B\u048D\u048F\u0491\u0493\u0495\u0497\u0499\u049B\u049D\u049F\u04A1\u04A3\u04A5\u04A7\u04A9\u04AB\u04AD\u04AF\u04B1\u04B3\u04B5\u04B7\u04B9\u04BB\u04BD\u04BF\u04C2\u04C4\u04C6\u04C8\u04CA\u04CC\u04CE\u04CF\u04D1\u04D3\u04D5\u04D7\u04D9\u04DB\u04DD\u04DF\u04E1\u04E3\u04E5\u04E7\u04E9\u04EB\u04ED\u04EF\u04F1\u04F3\u04F5\u04F7\u04F9\u04FB\u04FD\u04FF\u0501\u0503\u0505\u0507\u0509\u050B\u050D\u050F\u0511\u0513\u0515\u0517\u0519\u051B\u051D\u051F\u0521\u0523\u0525\u0527\u0529\u052B\u052D\u052F\u0560-\u0588\u10D0-\u10FA\u10FD-\u10FF\u13F8-\u13FD\u1C80-\u1C88\u1D00-\u1D2B\u1D6B-\u1D77\u1D79-\u1D9A\u1E01\u1E03\u1E05\u1E07\u1E09\u1E0B\u1E0D\u1E0F\u1E11\u1E13\u1E15\u1E17\u1E19\u1E1B\u1E1D\u1E1F\u1E21\u1E23\u1E25\u1E27\u1E29\u1E2B\u1E2D\u1E2F\u1E31\u1E33\u1E35\u1E37\u1E39\u1E3B\u1E3D\u1E3F\u1E41\u1E43\u1E45\u1E47\u1E49\u1E4B\u1E4D\u1E4F\u1E51\u1E53\u1E55\u1E57\u1E59\u1E5B\u1E5D\u1E5F\u1E61\u1E63\u1E65\u1E67\u1E69\u1E6B\u1E6D\u1E6F\u1E71\u1E73\u1E75\u1E77\u1E79\u1E7B\u1E7D\u1E7F\u1E81\u1E83\u1E85\u1E87\u1E89\u1E8B\u1E8D\u1E8F\u1E91\u1E93\u1E95-\u1E9D\u1E9F\u1EA1\u1EA3\u1EA5\u1EA7\u1EA9\u1EAB\u1EAD\u1EAF\u1EB1\u1EB3\u1EB5\u1EB7\u1EB9\u1EBB\u1EBD\u1EBF\u1EC1\u1EC3\u1EC5\u1EC7\u1EC9\u1ECB\u1ECD\u1ECF\u1ED1\u1ED3\u1ED5\u1ED7\u1ED9\u1EDB\u1EDD\u1EDF\u1EE1\u1EE3\u1EE5\u1EE7\u1EE9\u1EEB\u1EED\u1EEF\u1EF1\u1EF3\u1EF5\u1EF7\u1EF9\u1EFB\u1EFD\u1EFF-\u1F07\u1F10-\u1F15\u1F20-\u1F27\u1F30-\u1F37\u1F40-\u1F45\u1F50-\u1F57\u1F60-\u1F67\u1F70-\u1F7D\u1F80-\u1F87\u1F90-\u1F97\u1FA0-\u1FA7\u1FB0-\u1FB4\u1FB6\u1FB7\u1FBE\u1FC2-\u1FC4\u1FC6\u1FC7\u1FD0-\u1FD3\u1FD6\u1FD7\u1FE0-\u1FE7\u1FF2-\u1FF4\u1FF6\u1FF7\u210A\u210E\u210F\u2113\u212F\u2134\u2139\u213C\u213D\u2146-\u2149\u214E\u2184\u2C30-\u2C5E\u2C61\u2C65\u2C66\u2C68\u2C6A\u2C6C\u2C71\u2C73\u2C74\u2C76-\u2C7B\u2C81\u2C83\u2C85\u2C87\u2C89\u2C8B\u2C8D\u2C8F\u2C91\u2C93\u2C95\u2C97\u2C99\u2C9B\u2C9D\u2C9F\u2CA1\u2CA3\u2CA5\u2CA7\u2CA9\u2CAB\u2CAD\u2CAF\u2CB1\u2CB3\u2CB5\u2CB7\u2CB9\u2CBB\u2CBD\u2CBF\u2CC1\u2CC3\u2CC5\u2CC7\u2CC9\u2CCB\u2CCD\u2CCF\u2CD1\u2CD3\u2CD5\u2CD7\u2CD9\u2CDB\u2CDD\u2CDF\u2CE1\u2CE3\u2CE4\u2CEC\u2CEE\u2CF3\u2D00-\u2D25\u2D27\u2D2D\uA641\uA643\uA645\uA647\uA649\uA64B\uA64D\uA64F\uA651\uA653\uA655\uA657\uA659\uA65B\uA65D\uA65F\uA661\uA663\uA665\uA667\uA669\uA66B\uA66D\uA681\uA683\uA685\uA687\uA689\uA68B\uA68D\uA68F\uA691\uA693\uA695\uA697\uA699\uA69B\uA723\uA725\uA727\uA729\uA72B\uA72D\uA72F-\uA731\uA733\uA735\uA737\uA739\uA73B\uA73D\uA73F\uA741\uA743\uA745\uA747\uA749\uA74B\uA74D\uA74F\uA751\uA753\uA755\uA757\uA759\uA75B\uA75D\uA75F\uA761\uA763\uA765\uA767\uA769\uA76B\uA76D\uA76F\uA771-\uA778\uA77A\uA77C\uA77F\uA781\uA783\uA785\uA787\uA78C\uA78E\uA791\uA793-\uA795\uA797\uA799\uA79B\uA79D\uA79F\uA7A1\uA7A3\uA7A5\uA7A7\uA7A9\uA7AF\uA7B5\uA7B7\uA7B9\uA7FA\uAB30-\uAB5A\uAB60-\uAB65\uAB70-\uABBF\uFB00-\uFB06\uFB13-\uFB17\uFF41-\uFF5A',
        'astral': '\uD801[\uDC28-\uDC4F\uDCD8-\uDCFB]|\uD803[\uDCC0-\uDCF2]|\uD806[\uDCC0-\uDCDF]|\uD81B[\uDE60-\uDE7F]|\uD835[\uDC1A-\uDC33\uDC4E-\uDC54\uDC56-\uDC67\uDC82-\uDC9B\uDCB6-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDCCF\uDCEA-\uDD03\uDD1E-\uDD37\uDD52-\uDD6B\uDD86-\uDD9F\uDDBA-\uDDD3\uDDEE-\uDE07\uDE22-\uDE3B\uDE56-\uDE6F\uDE8A-\uDEA5\uDEC2-\uDEDA\uDEDC-\uDEE1\uDEFC-\uDF14\uDF16-\uDF1B\uDF36-\uDF4E\uDF50-\uDF55\uDF70-\uDF88\uDF8A-\uDF8F\uDFAA-\uDFC2\uDFC4-\uDFC9\uDFCB]|\uD83A[\uDD22-\uDD43]'
    },
    {
        'name': 'Lm',
        'alias': 'Modifier_Letter',
        'bmp': '\u02B0-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0374\u037A\u0559\u0640\u06E5\u06E6\u07F4\u07F5\u07FA\u081A\u0824\u0828\u0971\u0E46\u0EC6\u10FC\u17D7\u1843\u1AA7\u1C78-\u1C7D\u1D2C-\u1D6A\u1D78\u1D9B-\u1DBF\u2071\u207F\u2090-\u209C\u2C7C\u2C7D\u2D6F\u2E2F\u3005\u3031-\u3035\u303B\u309D\u309E\u30FC-\u30FE\uA015\uA4F8-\uA4FD\uA60C\uA67F\uA69C\uA69D\uA717-\uA71F\uA770\uA788\uA7F8\uA7F9\uA9CF\uA9E6\uAA70\uAADD\uAAF3\uAAF4\uAB5C-\uAB5F\uFF70\uFF9E\uFF9F',
        'astral': '\uD81A[\uDF40-\uDF43]|\uD81B[\uDF93-\uDF9F\uDFE0\uDFE1]'
    },
    {
        'name': 'Lo',
        'alias': 'Other_Letter',
        'bmp': '\xAA\xBA\u01BB\u01C0-\u01C3\u0294\u05D0-\u05EA\u05EF-\u05F2\u0620-\u063F\u0641-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u0800-\u0815\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0972-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E45\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u1100-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16F1-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17DC\u1820-\u1842\u1844-\u1878\u1880-\u1884\u1887-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C77\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u2135-\u2138\u2D30-\u2D67\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3006\u303C\u3041-\u3096\u309F\u30A1-\u30FA\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEF\uA000-\uA014\uA016-\uA48C\uA4D0-\uA4F7\uA500-\uA60B\uA610-\uA61F\uA62A\uA62B\uA66E\uA6A0-\uA6E5\uA78F\uA7F7\uA7FB-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9E0-\uA9E4\uA9E7-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA6F\uAA71-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB\uAADC\uAAE0-\uAAEA\uAAF2\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF66-\uFF6F\uFF71-\uFF9D\uFFA0-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC',
        'astral': '\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF40\uDF42-\uDF49\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF]|\uD801[\uDC50-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDD00-\uDD23\uDF00-\uDF1C\uDF27\uDF30-\uDF45]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD44\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF1A]|\uD806[\uDC00-\uDC2B\uDCFF\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE83\uDE86-\uDE89\uDE9D\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD89\uDD98\uDEE0-\uDEF2]|\uD808[\uDC00-\uDF99]|\uD809[\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50]|\uD821[\uDC00-\uDFF1]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]'
    },
    {
        'name': 'Lt',
        'alias': 'Titlecase_Letter',
        'bmp': '\u01C5\u01C8\u01CB\u01F2\u1F88-\u1F8F\u1F98-\u1F9F\u1FA8-\u1FAF\u1FBC\u1FCC\u1FFC'
    },
    {
        'name': 'Lu',
        'alias': 'Uppercase_Letter',
        'bmp': 'A-Z\xC0-\xD6\xD8-\xDE\u0100\u0102\u0104\u0106\u0108\u010A\u010C\u010E\u0110\u0112\u0114\u0116\u0118\u011A\u011C\u011E\u0120\u0122\u0124\u0126\u0128\u012A\u012C\u012E\u0130\u0132\u0134\u0136\u0139\u013B\u013D\u013F\u0141\u0143\u0145\u0147\u014A\u014C\u014E\u0150\u0152\u0154\u0156\u0158\u015A\u015C\u015E\u0160\u0162\u0164\u0166\u0168\u016A\u016C\u016E\u0170\u0172\u0174\u0176\u0178\u0179\u017B\u017D\u0181\u0182\u0184\u0186\u0187\u0189-\u018B\u018E-\u0191\u0193\u0194\u0196-\u0198\u019C\u019D\u019F\u01A0\u01A2\u01A4\u01A6\u01A7\u01A9\u01AC\u01AE\u01AF\u01B1-\u01B3\u01B5\u01B7\u01B8\u01BC\u01C4\u01C7\u01CA\u01CD\u01CF\u01D1\u01D3\u01D5\u01D7\u01D9\u01DB\u01DE\u01E0\u01E2\u01E4\u01E6\u01E8\u01EA\u01EC\u01EE\u01F1\u01F4\u01F6-\u01F8\u01FA\u01FC\u01FE\u0200\u0202\u0204\u0206\u0208\u020A\u020C\u020E\u0210\u0212\u0214\u0216\u0218\u021A\u021C\u021E\u0220\u0222\u0224\u0226\u0228\u022A\u022C\u022E\u0230\u0232\u023A\u023B\u023D\u023E\u0241\u0243-\u0246\u0248\u024A\u024C\u024E\u0370\u0372\u0376\u037F\u0386\u0388-\u038A\u038C\u038E\u038F\u0391-\u03A1\u03A3-\u03AB\u03CF\u03D2-\u03D4\u03D8\u03DA\u03DC\u03DE\u03E0\u03E2\u03E4\u03E6\u03E8\u03EA\u03EC\u03EE\u03F4\u03F7\u03F9\u03FA\u03FD-\u042F\u0460\u0462\u0464\u0466\u0468\u046A\u046C\u046E\u0470\u0472\u0474\u0476\u0478\u047A\u047C\u047E\u0480\u048A\u048C\u048E\u0490\u0492\u0494\u0496\u0498\u049A\u049C\u049E\u04A0\u04A2\u04A4\u04A6\u04A8\u04AA\u04AC\u04AE\u04B0\u04B2\u04B4\u04B6\u04B8\u04BA\u04BC\u04BE\u04C0\u04C1\u04C3\u04C5\u04C7\u04C9\u04CB\u04CD\u04D0\u04D2\u04D4\u04D6\u04D8\u04DA\u04DC\u04DE\u04E0\u04E2\u04E4\u04E6\u04E8\u04EA\u04EC\u04EE\u04F0\u04F2\u04F4\u04F6\u04F8\u04FA\u04FC\u04FE\u0500\u0502\u0504\u0506\u0508\u050A\u050C\u050E\u0510\u0512\u0514\u0516\u0518\u051A\u051C\u051E\u0520\u0522\u0524\u0526\u0528\u052A\u052C\u052E\u0531-\u0556\u10A0-\u10C5\u10C7\u10CD\u13A0-\u13F5\u1C90-\u1CBA\u1CBD-\u1CBF\u1E00\u1E02\u1E04\u1E06\u1E08\u1E0A\u1E0C\u1E0E\u1E10\u1E12\u1E14\u1E16\u1E18\u1E1A\u1E1C\u1E1E\u1E20\u1E22\u1E24\u1E26\u1E28\u1E2A\u1E2C\u1E2E\u1E30\u1E32\u1E34\u1E36\u1E38\u1E3A\u1E3C\u1E3E\u1E40\u1E42\u1E44\u1E46\u1E48\u1E4A\u1E4C\u1E4E\u1E50\u1E52\u1E54\u1E56\u1E58\u1E5A\u1E5C\u1E5E\u1E60\u1E62\u1E64\u1E66\u1E68\u1E6A\u1E6C\u1E6E\u1E70\u1E72\u1E74\u1E76\u1E78\u1E7A\u1E7C\u1E7E\u1E80\u1E82\u1E84\u1E86\u1E88\u1E8A\u1E8C\u1E8E\u1E90\u1E92\u1E94\u1E9E\u1EA0\u1EA2\u1EA4\u1EA6\u1EA8\u1EAA\u1EAC\u1EAE\u1EB0\u1EB2\u1EB4\u1EB6\u1EB8\u1EBA\u1EBC\u1EBE\u1EC0\u1EC2\u1EC4\u1EC6\u1EC8\u1ECA\u1ECC\u1ECE\u1ED0\u1ED2\u1ED4\u1ED6\u1ED8\u1EDA\u1EDC\u1EDE\u1EE0\u1EE2\u1EE4\u1EE6\u1EE8\u1EEA\u1EEC\u1EEE\u1EF0\u1EF2\u1EF4\u1EF6\u1EF8\u1EFA\u1EFC\u1EFE\u1F08-\u1F0F\u1F18-\u1F1D\u1F28-\u1F2F\u1F38-\u1F3F\u1F48-\u1F4D\u1F59\u1F5B\u1F5D\u1F5F\u1F68-\u1F6F\u1FB8-\u1FBB\u1FC8-\u1FCB\u1FD8-\u1FDB\u1FE8-\u1FEC\u1FF8-\u1FFB\u2102\u2107\u210B-\u210D\u2110-\u2112\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u2130-\u2133\u213E\u213F\u2145\u2183\u2C00-\u2C2E\u2C60\u2C62-\u2C64\u2C67\u2C69\u2C6B\u2C6D-\u2C70\u2C72\u2C75\u2C7E-\u2C80\u2C82\u2C84\u2C86\u2C88\u2C8A\u2C8C\u2C8E\u2C90\u2C92\u2C94\u2C96\u2C98\u2C9A\u2C9C\u2C9E\u2CA0\u2CA2\u2CA4\u2CA6\u2CA8\u2CAA\u2CAC\u2CAE\u2CB0\u2CB2\u2CB4\u2CB6\u2CB8\u2CBA\u2CBC\u2CBE\u2CC0\u2CC2\u2CC4\u2CC6\u2CC8\u2CCA\u2CCC\u2CCE\u2CD0\u2CD2\u2CD4\u2CD6\u2CD8\u2CDA\u2CDC\u2CDE\u2CE0\u2CE2\u2CEB\u2CED\u2CF2\uA640\uA642\uA644\uA646\uA648\uA64A\uA64C\uA64E\uA650\uA652\uA654\uA656\uA658\uA65A\uA65C\uA65E\uA660\uA662\uA664\uA666\uA668\uA66A\uA66C\uA680\uA682\uA684\uA686\uA688\uA68A\uA68C\uA68E\uA690\uA692\uA694\uA696\uA698\uA69A\uA722\uA724\uA726\uA728\uA72A\uA72C\uA72E\uA732\uA734\uA736\uA738\uA73A\uA73C\uA73E\uA740\uA742\uA744\uA746\uA748\uA74A\uA74C\uA74E\uA750\uA752\uA754\uA756\uA758\uA75A\uA75C\uA75E\uA760\uA762\uA764\uA766\uA768\uA76A\uA76C\uA76E\uA779\uA77B\uA77D\uA77E\uA780\uA782\uA784\uA786\uA78B\uA78D\uA790\uA792\uA796\uA798\uA79A\uA79C\uA79E\uA7A0\uA7A2\uA7A4\uA7A6\uA7A8\uA7AA-\uA7AE\uA7B0-\uA7B4\uA7B6\uA7B8\uFF21-\uFF3A',
        'astral': '\uD801[\uDC00-\uDC27\uDCB0-\uDCD3]|\uD803[\uDC80-\uDCB2]|\uD806[\uDCA0-\uDCBF]|\uD81B[\uDE40-\uDE5F]|\uD835[\uDC00-\uDC19\uDC34-\uDC4D\uDC68-\uDC81\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB5\uDCD0-\uDCE9\uDD04\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD38\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD6C-\uDD85\uDDA0-\uDDB9\uDDD4-\uDDED\uDE08-\uDE21\uDE3C-\uDE55\uDE70-\uDE89\uDEA8-\uDEC0\uDEE2-\uDEFA\uDF1C-\uDF34\uDF56-\uDF6E\uDF90-\uDFA8\uDFCA]|\uD83A[\uDD00-\uDD21]'
    },
    {
        'name': 'M',
        'alias': 'Mark',
        'bmp': '\u0300-\u036F\u0483-\u0489\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09FE\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AFA-\u0AFF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0C00-\u0C04\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0D00-\u0D03\u0D3B\u0D3C\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F\u109A-\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u180B-\u180D\u1885\u1886\u18A9\u1920-\u192B\u1930-\u193B\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F\u1AB0-\u1ABE\u1B00-\u1B04\u1B34-\u1B44\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BE6-\u1BF3\u1C24-\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF7-\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u20D0-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA66F-\uA672\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C5\uA8E0-\uA8F1\uA8FF\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9E5\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F',
        'astral': '\uD800[\uDDFD\uDEE0\uDF76-\uDF7A]|\uD802[\uDE01-\uDE03\uDE05\uDE06\uDE0C-\uDE0F\uDE38-\uDE3A\uDE3F\uDEE5\uDEE6]|\uD803[\uDD24-\uDD27\uDF46-\uDF50]|\uD804[\uDC00-\uDC02\uDC38-\uDC46\uDC7F-\uDC82\uDCB0-\uDCBA\uDD00-\uDD02\uDD27-\uDD34\uDD45\uDD46\uDD73\uDD80-\uDD82\uDDB3-\uDDC0\uDDC9-\uDDCC\uDE2C-\uDE37\uDE3E\uDEDF-\uDEEA\uDF00-\uDF03\uDF3B\uDF3C\uDF3E-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF62\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC35-\uDC46\uDC5E\uDCB0-\uDCC3\uDDAF-\uDDB5\uDDB8-\uDDC0\uDDDC\uDDDD\uDE30-\uDE40\uDEAB-\uDEB7\uDF1D-\uDF2B]|\uD806[\uDC2C-\uDC3A\uDE01-\uDE0A\uDE33-\uDE39\uDE3B-\uDE3E\uDE47\uDE51-\uDE5B\uDE8A-\uDE99]|\uD807[\uDC2F-\uDC36\uDC38-\uDC3F\uDC92-\uDCA7\uDCA9-\uDCB6\uDD31-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD45\uDD47\uDD8A-\uDD8E\uDD90\uDD91\uDD93-\uDD97\uDEF3-\uDEF6]|\uD81A[\uDEF0-\uDEF4\uDF30-\uDF36]|\uD81B[\uDF51-\uDF7E\uDF8F-\uDF92]|\uD82F[\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDCD0-\uDCD6\uDD44-\uDD4A]|\uDB40[\uDD00-\uDDEF]'
    },
    {
        'name': 'Mc',
        'alias': 'Spacing_Mark',
        'bmp': '\u0903\u093B\u093E-\u0940\u0949-\u094C\u094E\u094F\u0982\u0983\u09BE-\u09C0\u09C7\u09C8\u09CB\u09CC\u09D7\u0A03\u0A3E-\u0A40\u0A83\u0ABE-\u0AC0\u0AC9\u0ACB\u0ACC\u0B02\u0B03\u0B3E\u0B40\u0B47\u0B48\u0B4B\u0B4C\u0B57\u0BBE\u0BBF\u0BC1\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCC\u0BD7\u0C01-\u0C03\u0C41-\u0C44\u0C82\u0C83\u0CBE\u0CC0-\u0CC4\u0CC7\u0CC8\u0CCA\u0CCB\u0CD5\u0CD6\u0D02\u0D03\u0D3E-\u0D40\u0D46-\u0D48\u0D4A-\u0D4C\u0D57\u0D82\u0D83\u0DCF-\u0DD1\u0DD8-\u0DDF\u0DF2\u0DF3\u0F3E\u0F3F\u0F7F\u102B\u102C\u1031\u1038\u103B\u103C\u1056\u1057\u1062-\u1064\u1067-\u106D\u1083\u1084\u1087-\u108C\u108F\u109A-\u109C\u17B6\u17BE-\u17C5\u17C7\u17C8\u1923-\u1926\u1929-\u192B\u1930\u1931\u1933-\u1938\u1A19\u1A1A\u1A55\u1A57\u1A61\u1A63\u1A64\u1A6D-\u1A72\u1B04\u1B35\u1B3B\u1B3D-\u1B41\u1B43\u1B44\u1B82\u1BA1\u1BA6\u1BA7\u1BAA\u1BE7\u1BEA-\u1BEC\u1BEE\u1BF2\u1BF3\u1C24-\u1C2B\u1C34\u1C35\u1CE1\u1CF2\u1CF3\u1CF7\u302E\u302F\uA823\uA824\uA827\uA880\uA881\uA8B4-\uA8C3\uA952\uA953\uA983\uA9B4\uA9B5\uA9BA\uA9BB\uA9BD-\uA9C0\uAA2F\uAA30\uAA33\uAA34\uAA4D\uAA7B\uAA7D\uAAEB\uAAEE\uAAEF\uAAF5\uABE3\uABE4\uABE6\uABE7\uABE9\uABEA\uABEC',
        'astral': '\uD804[\uDC00\uDC02\uDC82\uDCB0-\uDCB2\uDCB7\uDCB8\uDD2C\uDD45\uDD46\uDD82\uDDB3-\uDDB5\uDDBF\uDDC0\uDE2C-\uDE2E\uDE32\uDE33\uDE35\uDEE0-\uDEE2\uDF02\uDF03\uDF3E\uDF3F\uDF41-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF62\uDF63]|\uD805[\uDC35-\uDC37\uDC40\uDC41\uDC45\uDCB0-\uDCB2\uDCB9\uDCBB-\uDCBE\uDCC1\uDDAF-\uDDB1\uDDB8-\uDDBB\uDDBE\uDE30-\uDE32\uDE3B\uDE3C\uDE3E\uDEAC\uDEAE\uDEAF\uDEB6\uDF20\uDF21\uDF26]|\uD806[\uDC2C-\uDC2E\uDC38\uDE39\uDE57\uDE58\uDE97]|\uD807[\uDC2F\uDC3E\uDCA9\uDCB1\uDCB4\uDD8A-\uDD8E\uDD93\uDD94\uDD96\uDEF5\uDEF6]|\uD81B[\uDF51-\uDF7E]|\uD834[\uDD65\uDD66\uDD6D-\uDD72]'
    },
    {
        'name': 'Me',
        'alias': 'Enclosing_Mark',
        'bmp': '\u0488\u0489\u1ABE\u20DD-\u20E0\u20E2-\u20E4\uA670-\uA672'
    },
    {
        'name': 'Mn',
        'alias': 'Nonspacing_Mark',
        'bmp': '\u0300-\u036F\u0483-\u0487\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u0711\u0730-\u074A\u07A6-\u07B0\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u0902\u093A\u093C\u0941-\u0948\u094D\u0951-\u0957\u0962\u0963\u0981\u09BC\u09C1-\u09C4\u09CD\u09E2\u09E3\u09FE\u0A01\u0A02\u0A3C\u0A41\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A70\u0A71\u0A75\u0A81\u0A82\u0ABC\u0AC1-\u0AC5\u0AC7\u0AC8\u0ACD\u0AE2\u0AE3\u0AFA-\u0AFF\u0B01\u0B3C\u0B3F\u0B41-\u0B44\u0B4D\u0B56\u0B62\u0B63\u0B82\u0BC0\u0BCD\u0C00\u0C04\u0C3E-\u0C40\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C81\u0CBC\u0CBF\u0CC6\u0CCC\u0CCD\u0CE2\u0CE3\u0D00\u0D01\u0D3B\u0D3C\u0D41-\u0D44\u0D4D\u0D62\u0D63\u0DCA\u0DD2-\u0DD4\u0DD6\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0F18\u0F19\u0F35\u0F37\u0F39\u0F71-\u0F7E\u0F80-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102D-\u1030\u1032-\u1037\u1039\u103A\u103D\u103E\u1058\u1059\u105E-\u1060\u1071-\u1074\u1082\u1085\u1086\u108D\u109D\u135D-\u135F\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4\u17B5\u17B7-\u17BD\u17C6\u17C9-\u17D3\u17DD\u180B-\u180D\u1885\u1886\u18A9\u1920-\u1922\u1927\u1928\u1932\u1939-\u193B\u1A17\u1A18\u1A1B\u1A56\u1A58-\u1A5E\u1A60\u1A62\u1A65-\u1A6C\u1A73-\u1A7C\u1A7F\u1AB0-\u1ABD\u1B00-\u1B03\u1B34\u1B36-\u1B3A\u1B3C\u1B42\u1B6B-\u1B73\u1B80\u1B81\u1BA2-\u1BA5\u1BA8\u1BA9\u1BAB-\u1BAD\u1BE6\u1BE8\u1BE9\u1BED\u1BEF-\u1BF1\u1C2C-\u1C33\u1C36\u1C37\u1CD0-\u1CD2\u1CD4-\u1CE0\u1CE2-\u1CE8\u1CED\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302D\u3099\u309A\uA66F\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA825\uA826\uA8C4\uA8C5\uA8E0-\uA8F1\uA8FF\uA926-\uA92D\uA947-\uA951\uA980-\uA982\uA9B3\uA9B6-\uA9B9\uA9BC\uA9E5\uAA29-\uAA2E\uAA31\uAA32\uAA35\uAA36\uAA43\uAA4C\uAA7C\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEC\uAAED\uAAF6\uABE5\uABE8\uABED\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F',
        'astral': '\uD800[\uDDFD\uDEE0\uDF76-\uDF7A]|\uD802[\uDE01-\uDE03\uDE05\uDE06\uDE0C-\uDE0F\uDE38-\uDE3A\uDE3F\uDEE5\uDEE6]|\uD803[\uDD24-\uDD27\uDF46-\uDF50]|\uD804[\uDC01\uDC38-\uDC46\uDC7F-\uDC81\uDCB3-\uDCB6\uDCB9\uDCBA\uDD00-\uDD02\uDD27-\uDD2B\uDD2D-\uDD34\uDD73\uDD80\uDD81\uDDB6-\uDDBE\uDDC9-\uDDCC\uDE2F-\uDE31\uDE34\uDE36\uDE37\uDE3E\uDEDF\uDEE3-\uDEEA\uDF00\uDF01\uDF3B\uDF3C\uDF40\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC38-\uDC3F\uDC42-\uDC44\uDC46\uDC5E\uDCB3-\uDCB8\uDCBA\uDCBF\uDCC0\uDCC2\uDCC3\uDDB2-\uDDB5\uDDBC\uDDBD\uDDBF\uDDC0\uDDDC\uDDDD\uDE33-\uDE3A\uDE3D\uDE3F\uDE40\uDEAB\uDEAD\uDEB0-\uDEB5\uDEB7\uDF1D-\uDF1F\uDF22-\uDF25\uDF27-\uDF2B]|\uD806[\uDC2F-\uDC37\uDC39\uDC3A\uDE01-\uDE0A\uDE33-\uDE38\uDE3B-\uDE3E\uDE47\uDE51-\uDE56\uDE59-\uDE5B\uDE8A-\uDE96\uDE98\uDE99]|\uD807[\uDC30-\uDC36\uDC38-\uDC3D\uDC3F\uDC92-\uDCA7\uDCAA-\uDCB0\uDCB2\uDCB3\uDCB5\uDCB6\uDD31-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD45\uDD47\uDD90\uDD91\uDD95\uDD97\uDEF3\uDEF4]|\uD81A[\uDEF0-\uDEF4\uDF30-\uDF36]|\uD81B[\uDF8F-\uDF92]|\uD82F[\uDC9D\uDC9E]|\uD834[\uDD67-\uDD69\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDCD0-\uDCD6\uDD44-\uDD4A]|\uDB40[\uDD00-\uDDEF]'
    },
    {
        'name': 'N',
        'alias': 'Number',
        'bmp': '0-9\xB2\xB3\xB9\xBC-\xBE\u0660-\u0669\u06F0-\u06F9\u07C0-\u07C9\u0966-\u096F\u09E6-\u09EF\u09F4-\u09F9\u0A66-\u0A6F\u0AE6-\u0AEF\u0B66-\u0B6F\u0B72-\u0B77\u0BE6-\u0BF2\u0C66-\u0C6F\u0C78-\u0C7E\u0CE6-\u0CEF\u0D58-\u0D5E\u0D66-\u0D78\u0DE6-\u0DEF\u0E50-\u0E59\u0ED0-\u0ED9\u0F20-\u0F33\u1040-\u1049\u1090-\u1099\u1369-\u137C\u16EE-\u16F0\u17E0-\u17E9\u17F0-\u17F9\u1810-\u1819\u1946-\u194F\u19D0-\u19DA\u1A80-\u1A89\u1A90-\u1A99\u1B50-\u1B59\u1BB0-\u1BB9\u1C40-\u1C49\u1C50-\u1C59\u2070\u2074-\u2079\u2080-\u2089\u2150-\u2182\u2185-\u2189\u2460-\u249B\u24EA-\u24FF\u2776-\u2793\u2CFD\u3007\u3021-\u3029\u3038-\u303A\u3192-\u3195\u3220-\u3229\u3248-\u324F\u3251-\u325F\u3280-\u3289\u32B1-\u32BF\uA620-\uA629\uA6E6-\uA6EF\uA830-\uA835\uA8D0-\uA8D9\uA900-\uA909\uA9D0-\uA9D9\uA9F0-\uA9F9\uAA50-\uAA59\uABF0-\uABF9\uFF10-\uFF19',
        'astral': '\uD800[\uDD07-\uDD33\uDD40-\uDD78\uDD8A\uDD8B\uDEE1-\uDEFB\uDF20-\uDF23\uDF41\uDF4A\uDFD1-\uDFD5]|\uD801[\uDCA0-\uDCA9]|\uD802[\uDC58-\uDC5F\uDC79-\uDC7F\uDCA7-\uDCAF\uDCFB-\uDCFF\uDD16-\uDD1B\uDDBC\uDDBD\uDDC0-\uDDCF\uDDD2-\uDDFF\uDE40-\uDE48\uDE7D\uDE7E\uDE9D-\uDE9F\uDEEB-\uDEEF\uDF58-\uDF5F\uDF78-\uDF7F\uDFA9-\uDFAF]|\uD803[\uDCFA-\uDCFF\uDD30-\uDD39\uDE60-\uDE7E\uDF1D-\uDF26\uDF51-\uDF54]|\uD804[\uDC52-\uDC6F\uDCF0-\uDCF9\uDD36-\uDD3F\uDDD0-\uDDD9\uDDE1-\uDDF4\uDEF0-\uDEF9]|\uD805[\uDC50-\uDC59\uDCD0-\uDCD9\uDE50-\uDE59\uDEC0-\uDEC9\uDF30-\uDF3B]|\uD806[\uDCE0-\uDCF2]|\uD807[\uDC50-\uDC6C\uDD50-\uDD59\uDDA0-\uDDA9]|\uD809[\uDC00-\uDC6E]|\uD81A[\uDE60-\uDE69\uDF50-\uDF59\uDF5B-\uDF61]|\uD81B[\uDE80-\uDE96]|\uD834[\uDEE0-\uDEF3\uDF60-\uDF78]|\uD835[\uDFCE-\uDFFF]|\uD83A[\uDCC7-\uDCCF\uDD50-\uDD59]|\uD83B[\uDC71-\uDCAB\uDCAD-\uDCAF\uDCB1-\uDCB4]|\uD83C[\uDD00-\uDD0C]'
    },
    {
        'name': 'Nd',
        'alias': 'Decimal_Number',
        'bmp': '0-9\u0660-\u0669\u06F0-\u06F9\u07C0-\u07C9\u0966-\u096F\u09E6-\u09EF\u0A66-\u0A6F\u0AE6-\u0AEF\u0B66-\u0B6F\u0BE6-\u0BEF\u0C66-\u0C6F\u0CE6-\u0CEF\u0D66-\u0D6F\u0DE6-\u0DEF\u0E50-\u0E59\u0ED0-\u0ED9\u0F20-\u0F29\u1040-\u1049\u1090-\u1099\u17E0-\u17E9\u1810-\u1819\u1946-\u194F\u19D0-\u19D9\u1A80-\u1A89\u1A90-\u1A99\u1B50-\u1B59\u1BB0-\u1BB9\u1C40-\u1C49\u1C50-\u1C59\uA620-\uA629\uA8D0-\uA8D9\uA900-\uA909\uA9D0-\uA9D9\uA9F0-\uA9F9\uAA50-\uAA59\uABF0-\uABF9\uFF10-\uFF19',
        'astral': '\uD801[\uDCA0-\uDCA9]|\uD803[\uDD30-\uDD39]|\uD804[\uDC66-\uDC6F\uDCF0-\uDCF9\uDD36-\uDD3F\uDDD0-\uDDD9\uDEF0-\uDEF9]|\uD805[\uDC50-\uDC59\uDCD0-\uDCD9\uDE50-\uDE59\uDEC0-\uDEC9\uDF30-\uDF39]|\uD806[\uDCE0-\uDCE9]|\uD807[\uDC50-\uDC59\uDD50-\uDD59\uDDA0-\uDDA9]|\uD81A[\uDE60-\uDE69\uDF50-\uDF59]|\uD835[\uDFCE-\uDFFF]|\uD83A[\uDD50-\uDD59]'
    },
    {
        'name': 'Nl',
        'alias': 'Letter_Number',
        'bmp': '\u16EE-\u16F0\u2160-\u2182\u2185-\u2188\u3007\u3021-\u3029\u3038-\u303A\uA6E6-\uA6EF',
        'astral': '\uD800[\uDD40-\uDD74\uDF41\uDF4A\uDFD1-\uDFD5]|\uD809[\uDC00-\uDC6E]'
    },
    {
        'name': 'No',
        'alias': 'Other_Number',
        'bmp': '\xB2\xB3\xB9\xBC-\xBE\u09F4-\u09F9\u0B72-\u0B77\u0BF0-\u0BF2\u0C78-\u0C7E\u0D58-\u0D5E\u0D70-\u0D78\u0F2A-\u0F33\u1369-\u137C\u17F0-\u17F9\u19DA\u2070\u2074-\u2079\u2080-\u2089\u2150-\u215F\u2189\u2460-\u249B\u24EA-\u24FF\u2776-\u2793\u2CFD\u3192-\u3195\u3220-\u3229\u3248-\u324F\u3251-\u325F\u3280-\u3289\u32B1-\u32BF\uA830-\uA835',
        'astral': '\uD800[\uDD07-\uDD33\uDD75-\uDD78\uDD8A\uDD8B\uDEE1-\uDEFB\uDF20-\uDF23]|\uD802[\uDC58-\uDC5F\uDC79-\uDC7F\uDCA7-\uDCAF\uDCFB-\uDCFF\uDD16-\uDD1B\uDDBC\uDDBD\uDDC0-\uDDCF\uDDD2-\uDDFF\uDE40-\uDE48\uDE7D\uDE7E\uDE9D-\uDE9F\uDEEB-\uDEEF\uDF58-\uDF5F\uDF78-\uDF7F\uDFA9-\uDFAF]|\uD803[\uDCFA-\uDCFF\uDE60-\uDE7E\uDF1D-\uDF26\uDF51-\uDF54]|\uD804[\uDC52-\uDC65\uDDE1-\uDDF4]|\uD805[\uDF3A\uDF3B]|\uD806[\uDCEA-\uDCF2]|\uD807[\uDC5A-\uDC6C]|\uD81A[\uDF5B-\uDF61]|\uD81B[\uDE80-\uDE96]|\uD834[\uDEE0-\uDEF3\uDF60-\uDF78]|\uD83A[\uDCC7-\uDCCF]|\uD83B[\uDC71-\uDCAB\uDCAD-\uDCAF\uDCB1-\uDCB4]|\uD83C[\uDD00-\uDD0C]'
    },
    {
        'name': 'P',
        'alias': 'Punctuation',
        'bmp': '!-#%-\\*,-\\/:;\\?@\\[-\\]_\\{\\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4E\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65',
        'astral': '\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDF55-\uDF59]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDF3C-\uDF3E]|\uD806[\uDC3B\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]'
    },
    {
        'name': 'Pc',
        'alias': 'Connector_Punctuation',
        'bmp': '_\u203F\u2040\u2054\uFE33\uFE34\uFE4D-\uFE4F\uFF3F'
    },
    {
        'name': 'Pd',
        'alias': 'Dash_Punctuation',
        'bmp': '\\-\u058A\u05BE\u1400\u1806\u2010-\u2015\u2E17\u2E1A\u2E3A\u2E3B\u2E40\u301C\u3030\u30A0\uFE31\uFE32\uFE58\uFE63\uFF0D'
    },
    {
        'name': 'Pe',
        'alias': 'Close_Punctuation',
        'bmp': '\\)\\]\\}\u0F3B\u0F3D\u169C\u2046\u207E\u208E\u2309\u230B\u232A\u2769\u276B\u276D\u276F\u2771\u2773\u2775\u27C6\u27E7\u27E9\u27EB\u27ED\u27EF\u2984\u2986\u2988\u298A\u298C\u298E\u2990\u2992\u2994\u2996\u2998\u29D9\u29DB\u29FD\u2E23\u2E25\u2E27\u2E29\u3009\u300B\u300D\u300F\u3011\u3015\u3017\u3019\u301B\u301E\u301F\uFD3E\uFE18\uFE36\uFE38\uFE3A\uFE3C\uFE3E\uFE40\uFE42\uFE44\uFE48\uFE5A\uFE5C\uFE5E\uFF09\uFF3D\uFF5D\uFF60\uFF63'
    },
    {
        'name': 'Pf',
        'alias': 'Final_Punctuation',
        'bmp': '\xBB\u2019\u201D\u203A\u2E03\u2E05\u2E0A\u2E0D\u2E1D\u2E21'
    },
    {
        'name': 'Pi',
        'alias': 'Initial_Punctuation',
        'bmp': '\xAB\u2018\u201B\u201C\u201F\u2039\u2E02\u2E04\u2E09\u2E0C\u2E1C\u2E20'
    },
    {
        'name': 'Po',
        'alias': 'Other_Punctuation',
        'bmp': '!-#%-\'\\*,\\.\\/:;\\?@\\\xA1\xA7\xB6\xB7\xBF\u037E\u0387\u055A-\u055F\u0589\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u166D\u166E\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u1805\u1807-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2016\u2017\u2020-\u2027\u2030-\u2038\u203B-\u203E\u2041-\u2043\u2047-\u2051\u2053\u2055-\u205E\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00\u2E01\u2E06-\u2E08\u2E0B\u2E0E-\u2E16\u2E18\u2E19\u2E1B\u2E1E\u2E1F\u2E2A-\u2E2E\u2E30-\u2E39\u2E3C-\u2E3F\u2E41\u2E43-\u2E4E\u3001-\u3003\u303D\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFE10-\uFE16\uFE19\uFE30\uFE45\uFE46\uFE49-\uFE4C\uFE50-\uFE52\uFE54-\uFE57\uFE5F-\uFE61\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF07\uFF0A\uFF0C\uFF0E\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3C\uFF61\uFF64\uFF65',
        'astral': '\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDF55-\uDF59]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDF3C-\uDF3E]|\uD806[\uDC3B\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]'
    },
    {
        'name': 'Ps',
        'alias': 'Open_Punctuation',
        'bmp': '\\(\\[\\{\u0F3A\u0F3C\u169B\u201A\u201E\u2045\u207D\u208D\u2308\u230A\u2329\u2768\u276A\u276C\u276E\u2770\u2772\u2774\u27C5\u27E6\u27E8\u27EA\u27EC\u27EE\u2983\u2985\u2987\u2989\u298B\u298D\u298F\u2991\u2993\u2995\u2997\u29D8\u29DA\u29FC\u2E22\u2E24\u2E26\u2E28\u2E42\u3008\u300A\u300C\u300E\u3010\u3014\u3016\u3018\u301A\u301D\uFD3F\uFE17\uFE35\uFE37\uFE39\uFE3B\uFE3D\uFE3F\uFE41\uFE43\uFE47\uFE59\uFE5B\uFE5D\uFF08\uFF3B\uFF5B\uFF5F\uFF62'
    },
    {
        'name': 'S',
        'alias': 'Symbol',
        'bmp': '\\$\\+<->\\^`\\|~\xA2-\xA6\xA8\xA9\xAC\xAE-\xB1\xB4\xB8\xD7\xF7\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u03F6\u0482\u058D-\u058F\u0606-\u0608\u060B\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u07FE\u07FF\u09F2\u09F3\u09FA\u09FB\u0AF1\u0B70\u0BF3-\u0BFA\u0C7F\u0D4F\u0D79\u0E3F\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u17DB\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u2044\u2052\u207A-\u207C\u208A-\u208C\u20A0-\u20BF\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116-\u2118\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u2140-\u2144\u214A-\u214D\u214F\u218A\u218B\u2190-\u2307\u230C-\u2328\u232B-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u2767\u2794-\u27C4\u27C7-\u27E5\u27F0-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2B73\u2B76-\u2B95\u2B98-\u2BC8\u2BCA-\u2BFE\u2CE5-\u2CEA\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFB\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u309B\u309C\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u32FE\u3300-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA700-\uA716\uA720\uA721\uA789\uA78A\uA828-\uA82B\uA836-\uA839\uAA77-\uAA79\uAB5B\uFB29\uFBB2-\uFBC1\uFDFC\uFDFD\uFE62\uFE64-\uFE66\uFE69\uFF04\uFF0B\uFF1C-\uFF1E\uFF3E\uFF40\uFF5C\uFF5E\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFFC\uFFFD',
        'astral': '\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9B\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD805\uDF3F|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDE8\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD83B[\uDCAC\uDCB0\uDEF0\uDEF1]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD10-\uDD6B\uDD70-\uDDAC\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED4\uDEE0-\uDEEC\uDEF0-\uDEF9\uDF00-\uDF73\uDF80-\uDFD8]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDD00-\uDD0B\uDD10-\uDD3E\uDD40-\uDD70\uDD73-\uDD76\uDD7A\uDD7C-\uDDA2\uDDB0-\uDDB9\uDDC0-\uDDC2\uDDD0-\uDDFF\uDE60-\uDE6D]'
    },
    {
        'name': 'Sc',
        'alias': 'Currency_Symbol',
        'bmp': '\\$\xA2-\xA5\u058F\u060B\u07FE\u07FF\u09F2\u09F3\u09FB\u0AF1\u0BF9\u0E3F\u17DB\u20A0-\u20BF\uA838\uFDFC\uFE69\uFF04\uFFE0\uFFE1\uFFE5\uFFE6',
        'astral': '\uD83B\uDCB0'
    },
    {
        'name': 'Sk',
        'alias': 'Modifier_Symbol',
        'bmp': '\\^`\xA8\xAF\xB4\xB8\u02C2-\u02C5\u02D2-\u02DF\u02E5-\u02EB\u02ED\u02EF-\u02FF\u0375\u0384\u0385\u1FBD\u1FBF-\u1FC1\u1FCD-\u1FCF\u1FDD-\u1FDF\u1FED-\u1FEF\u1FFD\u1FFE\u309B\u309C\uA700-\uA716\uA720\uA721\uA789\uA78A\uAB5B\uFBB2-\uFBC1\uFF3E\uFF40\uFFE3',
        'astral': '\uD83C[\uDFFB-\uDFFF]'
    },
    {
        'name': 'Sm',
        'alias': 'Math_Symbol',
        'bmp': '\\+<->\\|~\xAC\xB1\xD7\xF7\u03F6\u0606-\u0608\u2044\u2052\u207A-\u207C\u208A-\u208C\u2118\u2140-\u2144\u214B\u2190-\u2194\u219A\u219B\u21A0\u21A3\u21A6\u21AE\u21CE\u21CF\u21D2\u21D4\u21F4-\u22FF\u2320\u2321\u237C\u239B-\u23B3\u23DC-\u23E1\u25B7\u25C1\u25F8-\u25FF\u266F\u27C0-\u27C4\u27C7-\u27E5\u27F0-\u27FF\u2900-\u2982\u2999-\u29D7\u29DC-\u29FB\u29FE-\u2AFF\u2B30-\u2B44\u2B47-\u2B4C\uFB29\uFE62\uFE64-\uFE66\uFF0B\uFF1C-\uFF1E\uFF5C\uFF5E\uFFE2\uFFE9-\uFFEC',
        'astral': '\uD835[\uDEC1\uDEDB\uDEFB\uDF15\uDF35\uDF4F\uDF6F\uDF89\uDFA9\uDFC3]|\uD83B[\uDEF0\uDEF1]'
    },
    {
        'name': 'So',
        'alias': 'Other_Symbol',
        'bmp': '\xA6\xA9\xAE\xB0\u0482\u058D\u058E\u060E\u060F\u06DE\u06E9\u06FD\u06FE\u07F6\u09FA\u0B70\u0BF3-\u0BF8\u0BFA\u0C7F\u0D4F\u0D79\u0F01-\u0F03\u0F13\u0F15-\u0F17\u0F1A-\u0F1F\u0F34\u0F36\u0F38\u0FBE-\u0FC5\u0FC7-\u0FCC\u0FCE\u0FCF\u0FD5-\u0FD8\u109E\u109F\u1390-\u1399\u1940\u19DE-\u19FF\u1B61-\u1B6A\u1B74-\u1B7C\u2100\u2101\u2103-\u2106\u2108\u2109\u2114\u2116\u2117\u211E-\u2123\u2125\u2127\u2129\u212E\u213A\u213B\u214A\u214C\u214D\u214F\u218A\u218B\u2195-\u2199\u219C-\u219F\u21A1\u21A2\u21A4\u21A5\u21A7-\u21AD\u21AF-\u21CD\u21D0\u21D1\u21D3\u21D5-\u21F3\u2300-\u2307\u230C-\u231F\u2322-\u2328\u232B-\u237B\u237D-\u239A\u23B4-\u23DB\u23E2-\u2426\u2440-\u244A\u249C-\u24E9\u2500-\u25B6\u25B8-\u25C0\u25C2-\u25F7\u2600-\u266E\u2670-\u2767\u2794-\u27BF\u2800-\u28FF\u2B00-\u2B2F\u2B45\u2B46\u2B4D-\u2B73\u2B76-\u2B95\u2B98-\u2BC8\u2BCA-\u2BFE\u2CE5-\u2CEA\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u2FF0-\u2FFB\u3004\u3012\u3013\u3020\u3036\u3037\u303E\u303F\u3190\u3191\u3196-\u319F\u31C0-\u31E3\u3200-\u321E\u322A-\u3247\u3250\u3260-\u327F\u328A-\u32B0\u32C0-\u32FE\u3300-\u33FF\u4DC0-\u4DFF\uA490-\uA4C6\uA828-\uA82B\uA836\uA837\uA839\uAA77-\uAA79\uFDFD\uFFE4\uFFE8\uFFED\uFFEE\uFFFC\uFFFD',
        'astral': '\uD800[\uDD37-\uDD3F\uDD79-\uDD89\uDD8C-\uDD8E\uDD90-\uDD9B\uDDA0\uDDD0-\uDDFC]|\uD802[\uDC77\uDC78\uDEC8]|\uD805\uDF3F|\uD81A[\uDF3C-\uDF3F\uDF45]|\uD82F\uDC9C|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD64\uDD6A-\uDD6C\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDE8\uDE00-\uDE41\uDE45\uDF00-\uDF56]|\uD836[\uDC00-\uDDFF\uDE37-\uDE3A\uDE6D-\uDE74\uDE76-\uDE83\uDE85\uDE86]|\uD83B\uDCAC|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD10-\uDD6B\uDD70-\uDDAC\uDDE6-\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFA]|\uD83D[\uDC00-\uDED4\uDEE0-\uDEEC\uDEF0-\uDEF9\uDF00-\uDF73\uDF80-\uDFD8]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDD00-\uDD0B\uDD10-\uDD3E\uDD40-\uDD70\uDD73-\uDD76\uDD7A\uDD7C-\uDDA2\uDDB0-\uDDB9\uDDC0-\uDDC2\uDDD0-\uDDFF\uDE60-\uDE6D]'
    },
    {
        'name': 'Z',
        'alias': 'Separator',
        'bmp': ' \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000'
    },
    {
        'name': 'Zl',
        'alias': 'Line_Separator',
        'bmp': '\u2028'
    },
    {
        'name': 'Zp',
        'alias': 'Paragraph_Separator',
        'bmp': '\u2029'
    },
    {
        'name': 'Zs',
        'alias': 'Space_Separator',
        'bmp': ' \xA0\u1680\u2000-\u200A\u202F\u205F\u3000'
    }
];

},{}],124:[function(require,module,exports){
module.exports = [
    {
        'name': 'ASCII',
        'bmp': '\0-\x7F'
    },
    {
        'name': 'Alphabetic',
        'bmp': 'A-Za-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0345\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u05B0-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05EF-\u05F2\u0610-\u061A\u0620-\u0657\u0659-\u065F\u066E-\u06D3\u06D5-\u06DC\u06E1-\u06E8\u06ED-\u06EF\u06FA-\u06FC\u06FF\u0710-\u073F\u074D-\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0817\u081A-\u082C\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u08D4-\u08DF\u08E3-\u08E9\u08F0-\u093B\u093D-\u094C\u094E-\u0950\u0955-\u0963\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD-\u09C4\u09C7\u09C8\u09CB\u09CC\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09F0\u09F1\u09FC\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3E-\u0A42\u0A47\u0A48\u0A4B\u0A4C\u0A51\u0A59-\u0A5C\u0A5E\u0A70-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD-\u0AC5\u0AC7-\u0AC9\u0ACB\u0ACC\u0AD0\u0AE0-\u0AE3\u0AF9-\u0AFC\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D-\u0B44\u0B47\u0B48\u0B4B\u0B4C\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCC\u0BD0\u0BD7\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4C\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C80-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCC\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CF1\u0CF2\u0D00-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4C\u0D4E\u0D54-\u0D57\u0D5F-\u0D63\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E46\u0E4D\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0ECD\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F71-\u0F81\u0F88-\u0F97\u0F99-\u0FBC\u1000-\u1036\u1038\u103B-\u103F\u1050-\u1062\u1065-\u1068\u106E-\u1086\u108E\u109C\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135F\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1713\u1720-\u1733\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17B3\u17B6-\u17C8\u17D7\u17DC\u1820-\u1878\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u1938\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A1B\u1A20-\u1A5E\u1A61-\u1A74\u1AA7\u1B00-\u1B33\u1B35-\u1B43\u1B45-\u1B4B\u1B80-\u1BA9\u1BAC-\u1BAF\u1BBA-\u1BE5\u1BE7-\u1BF1\u1C00-\u1C35\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5\u1CF6\u1D00-\u1DBF\u1DE7-\u1DF4\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u24B6-\u24E9\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEF\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA674-\uA67B\uA67F-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7B9\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA827\uA840-\uA873\uA880-\uA8C3\uA8C5\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA90A-\uA92A\uA930-\uA952\uA960-\uA97C\uA980-\uA9B2\uA9B4-\uA9BF\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA60-\uAA76\uAA7A\uAA7E-\uAABE\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF5\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABEA\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC',
        'astral': '\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2\uDD00-\uDD27\uDF00-\uDF1C\uDF27\uDF30-\uDF45]|\uD804[\uDC00-\uDC45\uDC82-\uDCB8\uDCD0-\uDCE8\uDD00-\uDD32\uDD44-\uDD46\uDD50-\uDD72\uDD76\uDD80-\uDDBF\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE34\uDE37\uDE3E\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEE8\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D-\uDF44\uDF47\uDF48\uDF4B\uDF4C\uDF50\uDF57\uDF5D-\uDF63]|\uD805[\uDC00-\uDC41\uDC43-\uDC45\uDC47-\uDC4A\uDC80-\uDCC1\uDCC4\uDCC5\uDCC7\uDD80-\uDDB5\uDDB8-\uDDBE\uDDD8-\uDDDD\uDE00-\uDE3E\uDE40\uDE44\uDE80-\uDEB5\uDF00-\uDF1A\uDF1D-\uDF2A]|\uD806[\uDC00-\uDC38\uDCA0-\uDCDF\uDCFF\uDE00-\uDE32\uDE35-\uDE3E\uDE50-\uDE83\uDE86-\uDE97\uDE9D\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC3E\uDC40\uDC72-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD41\uDD43\uDD46\uDD47\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD8E\uDD90\uDD91\uDD93-\uDD96\uDD98\uDEE0-\uDEF6]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF36\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDE40-\uDE7F\uDF00-\uDF44\uDF50-\uDF7E\uDF93-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFF1]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9E]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43\uDD47]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD83C[\uDD30-\uDD49\uDD50-\uDD69\uDD70-\uDD89]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]'
    },
    {
        'name': 'Any',
        'isBmpLast': true,
        'bmp': '\0-\uFFFF',
        'astral': '[\uD800-\uDBFF][\uDC00-\uDFFF]'
    },
    {
        'name': 'Default_Ignorable_Code_Point',
        'bmp': '\xAD\u034F\u061C\u115F\u1160\u17B4\u17B5\u180B-\u180E\u200B-\u200F\u202A-\u202E\u2060-\u206F\u3164\uFE00-\uFE0F\uFEFF\uFFA0\uFFF0-\uFFF8',
        'astral': '\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|[\uDB40-\uDB43][\uDC00-\uDFFF]'
    },
    {
        'name': 'Lowercase',
        'bmp': 'a-z\xAA\xB5\xBA\xDF-\xF6\xF8-\xFF\u0101\u0103\u0105\u0107\u0109\u010B\u010D\u010F\u0111\u0113\u0115\u0117\u0119\u011B\u011D\u011F\u0121\u0123\u0125\u0127\u0129\u012B\u012D\u012F\u0131\u0133\u0135\u0137\u0138\u013A\u013C\u013E\u0140\u0142\u0144\u0146\u0148\u0149\u014B\u014D\u014F\u0151\u0153\u0155\u0157\u0159\u015B\u015D\u015F\u0161\u0163\u0165\u0167\u0169\u016B\u016D\u016F\u0171\u0173\u0175\u0177\u017A\u017C\u017E-\u0180\u0183\u0185\u0188\u018C\u018D\u0192\u0195\u0199-\u019B\u019E\u01A1\u01A3\u01A5\u01A8\u01AA\u01AB\u01AD\u01B0\u01B4\u01B6\u01B9\u01BA\u01BD-\u01BF\u01C6\u01C9\u01CC\u01CE\u01D0\u01D2\u01D4\u01D6\u01D8\u01DA\u01DC\u01DD\u01DF\u01E1\u01E3\u01E5\u01E7\u01E9\u01EB\u01ED\u01EF\u01F0\u01F3\u01F5\u01F9\u01FB\u01FD\u01FF\u0201\u0203\u0205\u0207\u0209\u020B\u020D\u020F\u0211\u0213\u0215\u0217\u0219\u021B\u021D\u021F\u0221\u0223\u0225\u0227\u0229\u022B\u022D\u022F\u0231\u0233-\u0239\u023C\u023F\u0240\u0242\u0247\u0249\u024B\u024D\u024F-\u0293\u0295-\u02B8\u02C0\u02C1\u02E0-\u02E4\u0345\u0371\u0373\u0377\u037A-\u037D\u0390\u03AC-\u03CE\u03D0\u03D1\u03D5-\u03D7\u03D9\u03DB\u03DD\u03DF\u03E1\u03E3\u03E5\u03E7\u03E9\u03EB\u03ED\u03EF-\u03F3\u03F5\u03F8\u03FB\u03FC\u0430-\u045F\u0461\u0463\u0465\u0467\u0469\u046B\u046D\u046F\u0471\u0473\u0475\u0477\u0479\u047B\u047D\u047F\u0481\u048B\u048D\u048F\u0491\u0493\u0495\u0497\u0499\u049B\u049D\u049F\u04A1\u04A3\u04A5\u04A7\u04A9\u04AB\u04AD\u04AF\u04B1\u04B3\u04B5\u04B7\u04B9\u04BB\u04BD\u04BF\u04C2\u04C4\u04C6\u04C8\u04CA\u04CC\u04CE\u04CF\u04D1\u04D3\u04D5\u04D7\u04D9\u04DB\u04DD\u04DF\u04E1\u04E3\u04E5\u04E7\u04E9\u04EB\u04ED\u04EF\u04F1\u04F3\u04F5\u04F7\u04F9\u04FB\u04FD\u04FF\u0501\u0503\u0505\u0507\u0509\u050B\u050D\u050F\u0511\u0513\u0515\u0517\u0519\u051B\u051D\u051F\u0521\u0523\u0525\u0527\u0529\u052B\u052D\u052F\u0560-\u0588\u10D0-\u10FA\u10FD-\u10FF\u13F8-\u13FD\u1C80-\u1C88\u1D00-\u1DBF\u1E01\u1E03\u1E05\u1E07\u1E09\u1E0B\u1E0D\u1E0F\u1E11\u1E13\u1E15\u1E17\u1E19\u1E1B\u1E1D\u1E1F\u1E21\u1E23\u1E25\u1E27\u1E29\u1E2B\u1E2D\u1E2F\u1E31\u1E33\u1E35\u1E37\u1E39\u1E3B\u1E3D\u1E3F\u1E41\u1E43\u1E45\u1E47\u1E49\u1E4B\u1E4D\u1E4F\u1E51\u1E53\u1E55\u1E57\u1E59\u1E5B\u1E5D\u1E5F\u1E61\u1E63\u1E65\u1E67\u1E69\u1E6B\u1E6D\u1E6F\u1E71\u1E73\u1E75\u1E77\u1E79\u1E7B\u1E7D\u1E7F\u1E81\u1E83\u1E85\u1E87\u1E89\u1E8B\u1E8D\u1E8F\u1E91\u1E93\u1E95-\u1E9D\u1E9F\u1EA1\u1EA3\u1EA5\u1EA7\u1EA9\u1EAB\u1EAD\u1EAF\u1EB1\u1EB3\u1EB5\u1EB7\u1EB9\u1EBB\u1EBD\u1EBF\u1EC1\u1EC3\u1EC5\u1EC7\u1EC9\u1ECB\u1ECD\u1ECF\u1ED1\u1ED3\u1ED5\u1ED7\u1ED9\u1EDB\u1EDD\u1EDF\u1EE1\u1EE3\u1EE5\u1EE7\u1EE9\u1EEB\u1EED\u1EEF\u1EF1\u1EF3\u1EF5\u1EF7\u1EF9\u1EFB\u1EFD\u1EFF-\u1F07\u1F10-\u1F15\u1F20-\u1F27\u1F30-\u1F37\u1F40-\u1F45\u1F50-\u1F57\u1F60-\u1F67\u1F70-\u1F7D\u1F80-\u1F87\u1F90-\u1F97\u1FA0-\u1FA7\u1FB0-\u1FB4\u1FB6\u1FB7\u1FBE\u1FC2-\u1FC4\u1FC6\u1FC7\u1FD0-\u1FD3\u1FD6\u1FD7\u1FE0-\u1FE7\u1FF2-\u1FF4\u1FF6\u1FF7\u2071\u207F\u2090-\u209C\u210A\u210E\u210F\u2113\u212F\u2134\u2139\u213C\u213D\u2146-\u2149\u214E\u2170-\u217F\u2184\u24D0-\u24E9\u2C30-\u2C5E\u2C61\u2C65\u2C66\u2C68\u2C6A\u2C6C\u2C71\u2C73\u2C74\u2C76-\u2C7D\u2C81\u2C83\u2C85\u2C87\u2C89\u2C8B\u2C8D\u2C8F\u2C91\u2C93\u2C95\u2C97\u2C99\u2C9B\u2C9D\u2C9F\u2CA1\u2CA3\u2CA5\u2CA7\u2CA9\u2CAB\u2CAD\u2CAF\u2CB1\u2CB3\u2CB5\u2CB7\u2CB9\u2CBB\u2CBD\u2CBF\u2CC1\u2CC3\u2CC5\u2CC7\u2CC9\u2CCB\u2CCD\u2CCF\u2CD1\u2CD3\u2CD5\u2CD7\u2CD9\u2CDB\u2CDD\u2CDF\u2CE1\u2CE3\u2CE4\u2CEC\u2CEE\u2CF3\u2D00-\u2D25\u2D27\u2D2D\uA641\uA643\uA645\uA647\uA649\uA64B\uA64D\uA64F\uA651\uA653\uA655\uA657\uA659\uA65B\uA65D\uA65F\uA661\uA663\uA665\uA667\uA669\uA66B\uA66D\uA681\uA683\uA685\uA687\uA689\uA68B\uA68D\uA68F\uA691\uA693\uA695\uA697\uA699\uA69B-\uA69D\uA723\uA725\uA727\uA729\uA72B\uA72D\uA72F-\uA731\uA733\uA735\uA737\uA739\uA73B\uA73D\uA73F\uA741\uA743\uA745\uA747\uA749\uA74B\uA74D\uA74F\uA751\uA753\uA755\uA757\uA759\uA75B\uA75D\uA75F\uA761\uA763\uA765\uA767\uA769\uA76B\uA76D\uA76F-\uA778\uA77A\uA77C\uA77F\uA781\uA783\uA785\uA787\uA78C\uA78E\uA791\uA793-\uA795\uA797\uA799\uA79B\uA79D\uA79F\uA7A1\uA7A3\uA7A5\uA7A7\uA7A9\uA7AF\uA7B5\uA7B7\uA7B9\uA7F8-\uA7FA\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABBF\uFB00-\uFB06\uFB13-\uFB17\uFF41-\uFF5A',
        'astral': '\uD801[\uDC28-\uDC4F\uDCD8-\uDCFB]|\uD803[\uDCC0-\uDCF2]|\uD806[\uDCC0-\uDCDF]|\uD81B[\uDE60-\uDE7F]|\uD835[\uDC1A-\uDC33\uDC4E-\uDC54\uDC56-\uDC67\uDC82-\uDC9B\uDCB6-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDCCF\uDCEA-\uDD03\uDD1E-\uDD37\uDD52-\uDD6B\uDD86-\uDD9F\uDDBA-\uDDD3\uDDEE-\uDE07\uDE22-\uDE3B\uDE56-\uDE6F\uDE8A-\uDEA5\uDEC2-\uDEDA\uDEDC-\uDEE1\uDEFC-\uDF14\uDF16-\uDF1B\uDF36-\uDF4E\uDF50-\uDF55\uDF70-\uDF88\uDF8A-\uDF8F\uDFAA-\uDFC2\uDFC4-\uDFC9\uDFCB]|\uD83A[\uDD22-\uDD43]'
    },
    {
        'name': 'Noncharacter_Code_Point',
        'bmp': '\uFDD0-\uFDEF\uFFFE\uFFFF',
        'astral': '[\uD83F\uD87F\uD8BF\uD8FF\uD93F\uD97F\uD9BF\uD9FF\uDA3F\uDA7F\uDABF\uDAFF\uDB3F\uDB7F\uDBBF\uDBFF][\uDFFE\uDFFF]'
    },
    {
        'name': 'Uppercase',
        'bmp': 'A-Z\xC0-\xD6\xD8-\xDE\u0100\u0102\u0104\u0106\u0108\u010A\u010C\u010E\u0110\u0112\u0114\u0116\u0118\u011A\u011C\u011E\u0120\u0122\u0124\u0126\u0128\u012A\u012C\u012E\u0130\u0132\u0134\u0136\u0139\u013B\u013D\u013F\u0141\u0143\u0145\u0147\u014A\u014C\u014E\u0150\u0152\u0154\u0156\u0158\u015A\u015C\u015E\u0160\u0162\u0164\u0166\u0168\u016A\u016C\u016E\u0170\u0172\u0174\u0176\u0178\u0179\u017B\u017D\u0181\u0182\u0184\u0186\u0187\u0189-\u018B\u018E-\u0191\u0193\u0194\u0196-\u0198\u019C\u019D\u019F\u01A0\u01A2\u01A4\u01A6\u01A7\u01A9\u01AC\u01AE\u01AF\u01B1-\u01B3\u01B5\u01B7\u01B8\u01BC\u01C4\u01C7\u01CA\u01CD\u01CF\u01D1\u01D3\u01D5\u01D7\u01D9\u01DB\u01DE\u01E0\u01E2\u01E4\u01E6\u01E8\u01EA\u01EC\u01EE\u01F1\u01F4\u01F6-\u01F8\u01FA\u01FC\u01FE\u0200\u0202\u0204\u0206\u0208\u020A\u020C\u020E\u0210\u0212\u0214\u0216\u0218\u021A\u021C\u021E\u0220\u0222\u0224\u0226\u0228\u022A\u022C\u022E\u0230\u0232\u023A\u023B\u023D\u023E\u0241\u0243-\u0246\u0248\u024A\u024C\u024E\u0370\u0372\u0376\u037F\u0386\u0388-\u038A\u038C\u038E\u038F\u0391-\u03A1\u03A3-\u03AB\u03CF\u03D2-\u03D4\u03D8\u03DA\u03DC\u03DE\u03E0\u03E2\u03E4\u03E6\u03E8\u03EA\u03EC\u03EE\u03F4\u03F7\u03F9\u03FA\u03FD-\u042F\u0460\u0462\u0464\u0466\u0468\u046A\u046C\u046E\u0470\u0472\u0474\u0476\u0478\u047A\u047C\u047E\u0480\u048A\u048C\u048E\u0490\u0492\u0494\u0496\u0498\u049A\u049C\u049E\u04A0\u04A2\u04A4\u04A6\u04A8\u04AA\u04AC\u04AE\u04B0\u04B2\u04B4\u04B6\u04B8\u04BA\u04BC\u04BE\u04C0\u04C1\u04C3\u04C5\u04C7\u04C9\u04CB\u04CD\u04D0\u04D2\u04D4\u04D6\u04D8\u04DA\u04DC\u04DE\u04E0\u04E2\u04E4\u04E6\u04E8\u04EA\u04EC\u04EE\u04F0\u04F2\u04F4\u04F6\u04F8\u04FA\u04FC\u04FE\u0500\u0502\u0504\u0506\u0508\u050A\u050C\u050E\u0510\u0512\u0514\u0516\u0518\u051A\u051C\u051E\u0520\u0522\u0524\u0526\u0528\u052A\u052C\u052E\u0531-\u0556\u10A0-\u10C5\u10C7\u10CD\u13A0-\u13F5\u1C90-\u1CBA\u1CBD-\u1CBF\u1E00\u1E02\u1E04\u1E06\u1E08\u1E0A\u1E0C\u1E0E\u1E10\u1E12\u1E14\u1E16\u1E18\u1E1A\u1E1C\u1E1E\u1E20\u1E22\u1E24\u1E26\u1E28\u1E2A\u1E2C\u1E2E\u1E30\u1E32\u1E34\u1E36\u1E38\u1E3A\u1E3C\u1E3E\u1E40\u1E42\u1E44\u1E46\u1E48\u1E4A\u1E4C\u1E4E\u1E50\u1E52\u1E54\u1E56\u1E58\u1E5A\u1E5C\u1E5E\u1E60\u1E62\u1E64\u1E66\u1E68\u1E6A\u1E6C\u1E6E\u1E70\u1E72\u1E74\u1E76\u1E78\u1E7A\u1E7C\u1E7E\u1E80\u1E82\u1E84\u1E86\u1E88\u1E8A\u1E8C\u1E8E\u1E90\u1E92\u1E94\u1E9E\u1EA0\u1EA2\u1EA4\u1EA6\u1EA8\u1EAA\u1EAC\u1EAE\u1EB0\u1EB2\u1EB4\u1EB6\u1EB8\u1EBA\u1EBC\u1EBE\u1EC0\u1EC2\u1EC4\u1EC6\u1EC8\u1ECA\u1ECC\u1ECE\u1ED0\u1ED2\u1ED4\u1ED6\u1ED8\u1EDA\u1EDC\u1EDE\u1EE0\u1EE2\u1EE4\u1EE6\u1EE8\u1EEA\u1EEC\u1EEE\u1EF0\u1EF2\u1EF4\u1EF6\u1EF8\u1EFA\u1EFC\u1EFE\u1F08-\u1F0F\u1F18-\u1F1D\u1F28-\u1F2F\u1F38-\u1F3F\u1F48-\u1F4D\u1F59\u1F5B\u1F5D\u1F5F\u1F68-\u1F6F\u1FB8-\u1FBB\u1FC8-\u1FCB\u1FD8-\u1FDB\u1FE8-\u1FEC\u1FF8-\u1FFB\u2102\u2107\u210B-\u210D\u2110-\u2112\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u2130-\u2133\u213E\u213F\u2145\u2160-\u216F\u2183\u24B6-\u24CF\u2C00-\u2C2E\u2C60\u2C62-\u2C64\u2C67\u2C69\u2C6B\u2C6D-\u2C70\u2C72\u2C75\u2C7E-\u2C80\u2C82\u2C84\u2C86\u2C88\u2C8A\u2C8C\u2C8E\u2C90\u2C92\u2C94\u2C96\u2C98\u2C9A\u2C9C\u2C9E\u2CA0\u2CA2\u2CA4\u2CA6\u2CA8\u2CAA\u2CAC\u2CAE\u2CB0\u2CB2\u2CB4\u2CB6\u2CB8\u2CBA\u2CBC\u2CBE\u2CC0\u2CC2\u2CC4\u2CC6\u2CC8\u2CCA\u2CCC\u2CCE\u2CD0\u2CD2\u2CD4\u2CD6\u2CD8\u2CDA\u2CDC\u2CDE\u2CE0\u2CE2\u2CEB\u2CED\u2CF2\uA640\uA642\uA644\uA646\uA648\uA64A\uA64C\uA64E\uA650\uA652\uA654\uA656\uA658\uA65A\uA65C\uA65E\uA660\uA662\uA664\uA666\uA668\uA66A\uA66C\uA680\uA682\uA684\uA686\uA688\uA68A\uA68C\uA68E\uA690\uA692\uA694\uA696\uA698\uA69A\uA722\uA724\uA726\uA728\uA72A\uA72C\uA72E\uA732\uA734\uA736\uA738\uA73A\uA73C\uA73E\uA740\uA742\uA744\uA746\uA748\uA74A\uA74C\uA74E\uA750\uA752\uA754\uA756\uA758\uA75A\uA75C\uA75E\uA760\uA762\uA764\uA766\uA768\uA76A\uA76C\uA76E\uA779\uA77B\uA77D\uA77E\uA780\uA782\uA784\uA786\uA78B\uA78D\uA790\uA792\uA796\uA798\uA79A\uA79C\uA79E\uA7A0\uA7A2\uA7A4\uA7A6\uA7A8\uA7AA-\uA7AE\uA7B0-\uA7B4\uA7B6\uA7B8\uFF21-\uFF3A',
        'astral': '\uD801[\uDC00-\uDC27\uDCB0-\uDCD3]|\uD803[\uDC80-\uDCB2]|\uD806[\uDCA0-\uDCBF]|\uD81B[\uDE40-\uDE5F]|\uD835[\uDC00-\uDC19\uDC34-\uDC4D\uDC68-\uDC81\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB5\uDCD0-\uDCE9\uDD04\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD38\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD6C-\uDD85\uDDA0-\uDDB9\uDDD4-\uDDED\uDE08-\uDE21\uDE3C-\uDE55\uDE70-\uDE89\uDEA8-\uDEC0\uDEE2-\uDEFA\uDF1C-\uDF34\uDF56-\uDF6E\uDF90-\uDFA8\uDFCA]|\uD83A[\uDD00-\uDD21]|\uD83C[\uDD30-\uDD49\uDD50-\uDD69\uDD70-\uDD89]'
    },
    {
        'name': 'White_Space',
        'bmp': '\t-\r \x85\xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000'
    }
];

},{}],125:[function(require,module,exports){
module.exports = [
    {
        'name': 'Adlam',
        'astral': '\uD83A[\uDD00-\uDD4A\uDD50-\uDD59\uDD5E\uDD5F]'
    },
    {
        'name': 'Ahom',
        'astral': '\uD805[\uDF00-\uDF1A\uDF1D-\uDF2B\uDF30-\uDF3F]'
    },
    {
        'name': 'Anatolian_Hieroglyphs',
        'astral': '\uD811[\uDC00-\uDE46]'
    },
    {
        'name': 'Arabic',
        'bmp': '\u0600-\u0604\u0606-\u060B\u060D-\u061A\u061C\u061E\u0620-\u063F\u0641-\u064A\u0656-\u066F\u0671-\u06DC\u06DE-\u06FF\u0750-\u077F\u08A0-\u08B4\u08B6-\u08BD\u08D3-\u08E1\u08E3-\u08FF\uFB50-\uFBC1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFD\uFE70-\uFE74\uFE76-\uFEFC',
        'astral': '\uD803[\uDE60-\uDE7E]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB\uDEF0\uDEF1]'
    },
    {
        'name': 'Armenian',
        'bmp': '\u0531-\u0556\u0559-\u0588\u058A\u058D-\u058F\uFB13-\uFB17'
    },
    {
        'name': 'Avestan',
        'astral': '\uD802[\uDF00-\uDF35\uDF39-\uDF3F]'
    },
    {
        'name': 'Balinese',
        'bmp': '\u1B00-\u1B4B\u1B50-\u1B7C'
    },
    {
        'name': 'Bamum',
        'bmp': '\uA6A0-\uA6F7',
        'astral': '\uD81A[\uDC00-\uDE38]'
    },
    {
        'name': 'Bassa_Vah',
        'astral': '\uD81A[\uDED0-\uDEED\uDEF0-\uDEF5]'
    },
    {
        'name': 'Batak',
        'bmp': '\u1BC0-\u1BF3\u1BFC-\u1BFF'
    },
    {
        'name': 'Bengali',
        'bmp': '\u0980-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09FE'
    },
    {
        'name': 'Bhaiksuki',
        'astral': '\uD807[\uDC00-\uDC08\uDC0A-\uDC36\uDC38-\uDC45\uDC50-\uDC6C]'
    },
    {
        'name': 'Bopomofo',
        'bmp': '\u02EA\u02EB\u3105-\u312F\u31A0-\u31BA'
    },
    {
        'name': 'Brahmi',
        'astral': '\uD804[\uDC00-\uDC4D\uDC52-\uDC6F\uDC7F]'
    },
    {
        'name': 'Braille',
        'bmp': '\u2800-\u28FF'
    },
    {
        'name': 'Buginese',
        'bmp': '\u1A00-\u1A1B\u1A1E\u1A1F'
    },
    {
        'name': 'Buhid',
        'bmp': '\u1740-\u1753'
    },
    {
        'name': 'Canadian_Aboriginal',
        'bmp': '\u1400-\u167F\u18B0-\u18F5'
    },
    {
        'name': 'Carian',
        'astral': '\uD800[\uDEA0-\uDED0]'
    },
    {
        'name': 'Caucasian_Albanian',
        'astral': '\uD801[\uDD30-\uDD63\uDD6F]'
    },
    {
        'name': 'Chakma',
        'astral': '\uD804[\uDD00-\uDD34\uDD36-\uDD46]'
    },
    {
        'name': 'Cham',
        'bmp': '\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA5C-\uAA5F'
    },
    {
        'name': 'Cherokee',
        'bmp': '\u13A0-\u13F5\u13F8-\u13FD\uAB70-\uABBF'
    },
    {
        'name': 'Common',
        'bmp': '\0-@\\[-`\\{-\xA9\xAB-\xB9\xBB-\xBF\xD7\xF7\u02B9-\u02DF\u02E5-\u02E9\u02EC-\u02FF\u0374\u037E\u0385\u0387\u0589\u0605\u060C\u061B\u061F\u0640\u06DD\u08E2\u0964\u0965\u0E3F\u0FD5-\u0FD8\u10FB\u16EB-\u16ED\u1735\u1736\u1802\u1803\u1805\u1CD3\u1CE1\u1CE9-\u1CEC\u1CEE-\u1CF3\u1CF5-\u1CF7\u2000-\u200B\u200E-\u2064\u2066-\u2070\u2074-\u207E\u2080-\u208E\u20A0-\u20BF\u2100-\u2125\u2127-\u2129\u212C-\u2131\u2133-\u214D\u214F-\u215F\u2189-\u218B\u2190-\u2426\u2440-\u244A\u2460-\u27FF\u2900-\u2B73\u2B76-\u2B95\u2B98-\u2BC8\u2BCA-\u2BFE\u2E00-\u2E4E\u2FF0-\u2FFB\u3000-\u3004\u3006\u3008-\u3020\u3030-\u3037\u303C-\u303F\u309B\u309C\u30A0\u30FB\u30FC\u3190-\u319F\u31C0-\u31E3\u3220-\u325F\u327F-\u32CF\u3358-\u33FF\u4DC0-\u4DFF\uA700-\uA721\uA788-\uA78A\uA830-\uA839\uA92E\uA9CF\uAB5B\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE66\uFE68-\uFE6B\uFEFF\uFF01-\uFF20\uFF3B-\uFF40\uFF5B-\uFF65\uFF70\uFF9E\uFF9F\uFFE0-\uFFE6\uFFE8-\uFFEE\uFFF9-\uFFFD',
        'astral': '\uD800[\uDD00-\uDD02\uDD07-\uDD33\uDD37-\uDD3F\uDD90-\uDD9B\uDDD0-\uDDFC\uDEE1-\uDEFB]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDC00-\uDCF5\uDD00-\uDD26\uDD29-\uDD66\uDD6A-\uDD7A\uDD83\uDD84\uDD8C-\uDDA9\uDDAE-\uDDE8\uDEE0-\uDEF3\uDF00-\uDF56\uDF60-\uDF78]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDFCB\uDFCE-\uDFFF]|\uD83B[\uDC71-\uDCB4]|\uD83C[\uDC00-\uDC2B\uDC30-\uDC93\uDCA0-\uDCAE\uDCB1-\uDCBF\uDCC1-\uDCCF\uDCD1-\uDCF5\uDD00-\uDD0C\uDD10-\uDD6B\uDD70-\uDDAC\uDDE6-\uDDFF\uDE01\uDE02\uDE10-\uDE3B\uDE40-\uDE48\uDE50\uDE51\uDE60-\uDE65\uDF00-\uDFFF]|\uD83D[\uDC00-\uDED4\uDEE0-\uDEEC\uDEF0-\uDEF9\uDF00-\uDF73\uDF80-\uDFD8]|\uD83E[\uDC00-\uDC0B\uDC10-\uDC47\uDC50-\uDC59\uDC60-\uDC87\uDC90-\uDCAD\uDD00-\uDD0B\uDD10-\uDD3E\uDD40-\uDD70\uDD73-\uDD76\uDD7A\uDD7C-\uDDA2\uDDB0-\uDDB9\uDDC0-\uDDC2\uDDD0-\uDDFF\uDE60-\uDE6D]|\uDB40[\uDC01\uDC20-\uDC7F]'
    },
    {
        'name': 'Coptic',
        'bmp': '\u03E2-\u03EF\u2C80-\u2CF3\u2CF9-\u2CFF'
    },
    {
        'name': 'Cuneiform',
        'astral': '\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC70-\uDC74\uDC80-\uDD43]'
    },
    {
        'name': 'Cypriot',
        'astral': '\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F]'
    },
    {
        'name': 'Cyrillic',
        'bmp': '\u0400-\u0484\u0487-\u052F\u1C80-\u1C88\u1D2B\u1D78\u2DE0-\u2DFF\uA640-\uA69F\uFE2E\uFE2F'
    },
    {
        'name': 'Deseret',
        'astral': '\uD801[\uDC00-\uDC4F]'
    },
    {
        'name': 'Devanagari',
        'bmp': '\u0900-\u0950\u0953-\u0963\u0966-\u097F\uA8E0-\uA8FF'
    },
    {
        'name': 'Dogra',
        'astral': '\uD806[\uDC00-\uDC3B]'
    },
    {
        'name': 'Duployan',
        'astral': '\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9C-\uDC9F]'
    },
    {
        'name': 'Egyptian_Hieroglyphs',
        'astral': '\uD80C[\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]'
    },
    {
        'name': 'Elbasan',
        'astral': '\uD801[\uDD00-\uDD27]'
    },
    {
        'name': 'Ethiopic',
        'bmp': '\u1200-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u137C\u1380-\u1399\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E'
    },
    {
        'name': 'Georgian',
        'bmp': '\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u10FF\u1C90-\u1CBA\u1CBD-\u1CBF\u2D00-\u2D25\u2D27\u2D2D'
    },
    {
        'name': 'Glagolitic',
        'bmp': '\u2C00-\u2C2E\u2C30-\u2C5E',
        'astral': '\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]'
    },
    {
        'name': 'Gothic',
        'astral': '\uD800[\uDF30-\uDF4A]'
    },
    {
        'name': 'Grantha',
        'astral': '\uD804[\uDF00-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF50\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]'
    },
    {
        'name': 'Greek',
        'bmp': '\u0370-\u0373\u0375-\u0377\u037A-\u037D\u037F\u0384\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03E1\u03F0-\u03FF\u1D26-\u1D2A\u1D5D-\u1D61\u1D66-\u1D6A\u1DBF\u1F00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FC4\u1FC6-\u1FD3\u1FD6-\u1FDB\u1FDD-\u1FEF\u1FF2-\u1FF4\u1FF6-\u1FFE\u2126\uAB65',
        'astral': '\uD800[\uDD40-\uDD8E\uDDA0]|\uD834[\uDE00-\uDE45]'
    },
    {
        'name': 'Gujarati',
        'bmp': '\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AF1\u0AF9-\u0AFF'
    },
    {
        'name': 'Gunjala_Gondi',
        'astral': '\uD807[\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD8E\uDD90\uDD91\uDD93-\uDD98\uDDA0-\uDDA9]'
    },
    {
        'name': 'Gurmukhi',
        'bmp': '\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A76'
    },
    {
        'name': 'Han',
        'bmp': '\u2E80-\u2E99\u2E9B-\u2EF3\u2F00-\u2FD5\u3005\u3007\u3021-\u3029\u3038-\u303B\u3400-\u4DB5\u4E00-\u9FEF\uF900-\uFA6D\uFA70-\uFAD9',
        'astral': '[\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]'
    },
    {
        'name': 'Hangul',
        'bmp': '\u1100-\u11FF\u302E\u302F\u3131-\u318E\u3200-\u321E\u3260-\u327E\uA960-\uA97C\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uFFA0-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC'
    },
    {
        'name': 'Hanifi_Rohingya',
        'astral': '\uD803[\uDD00-\uDD27\uDD30-\uDD39]'
    },
    {
        'name': 'Hanunoo',
        'bmp': '\u1720-\u1734'
    },
    {
        'name': 'Hatran',
        'astral': '\uD802[\uDCE0-\uDCF2\uDCF4\uDCF5\uDCFB-\uDCFF]'
    },
    {
        'name': 'Hebrew',
        'bmp': '\u0591-\u05C7\u05D0-\u05EA\u05EF-\u05F4\uFB1D-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFB4F'
    },
    {
        'name': 'Hiragana',
        'bmp': '\u3041-\u3096\u309D-\u309F',
        'astral': '\uD82C[\uDC01-\uDD1E]|\uD83C\uDE00'
    },
    {
        'name': 'Imperial_Aramaic',
        'astral': '\uD802[\uDC40-\uDC55\uDC57-\uDC5F]'
    },
    {
        'name': 'Inherited',
        'bmp': '\u0300-\u036F\u0485\u0486\u064B-\u0655\u0670\u0951\u0952\u1AB0-\u1ABE\u1CD0-\u1CD2\u1CD4-\u1CE0\u1CE2-\u1CE8\u1CED\u1CF4\u1CF8\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u200C\u200D\u20D0-\u20F0\u302A-\u302D\u3099\u309A\uFE00-\uFE0F\uFE20-\uFE2D',
        'astral': '\uD800[\uDDFD\uDEE0]|\uD804\uDF3B|\uD834[\uDD67-\uDD69\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD]|\uDB40[\uDD00-\uDDEF]'
    },
    {
        'name': 'Inscriptional_Pahlavi',
        'astral': '\uD802[\uDF60-\uDF72\uDF78-\uDF7F]'
    },
    {
        'name': 'Inscriptional_Parthian',
        'astral': '\uD802[\uDF40-\uDF55\uDF58-\uDF5F]'
    },
    {
        'name': 'Javanese',
        'bmp': '\uA980-\uA9CD\uA9D0-\uA9D9\uA9DE\uA9DF'
    },
    {
        'name': 'Kaithi',
        'astral': '\uD804[\uDC80-\uDCC1\uDCCD]'
    },
    {
        'name': 'Kannada',
        'bmp': '\u0C80-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2'
    },
    {
        'name': 'Katakana',
        'bmp': '\u30A1-\u30FA\u30FD-\u30FF\u31F0-\u31FF\u32D0-\u32FE\u3300-\u3357\uFF66-\uFF6F\uFF71-\uFF9D',
        'astral': '\uD82C\uDC00'
    },
    {
        'name': 'Kayah_Li',
        'bmp': '\uA900-\uA92D\uA92F'
    },
    {
        'name': 'Kharoshthi',
        'astral': '\uD802[\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE38-\uDE3A\uDE3F-\uDE48\uDE50-\uDE58]'
    },
    {
        'name': 'Khmer',
        'bmp': '\u1780-\u17DD\u17E0-\u17E9\u17F0-\u17F9\u19E0-\u19FF'
    },
    {
        'name': 'Khojki',
        'astral': '\uD804[\uDE00-\uDE11\uDE13-\uDE3E]'
    },
    {
        'name': 'Khudawadi',
        'astral': '\uD804[\uDEB0-\uDEEA\uDEF0-\uDEF9]'
    },
    {
        'name': 'Lao',
        'bmp': '\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF'
    },
    {
        'name': 'Latin',
        'bmp': 'A-Za-z\xAA\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02B8\u02E0-\u02E4\u1D00-\u1D25\u1D2C-\u1D5C\u1D62-\u1D65\u1D6B-\u1D77\u1D79-\u1DBE\u1E00-\u1EFF\u2071\u207F\u2090-\u209C\u212A\u212B\u2132\u214E\u2160-\u2188\u2C60-\u2C7F\uA722-\uA787\uA78B-\uA7B9\uA7F7-\uA7FF\uAB30-\uAB5A\uAB5C-\uAB64\uFB00-\uFB06\uFF21-\uFF3A\uFF41-\uFF5A'
    },
    {
        'name': 'Lepcha',
        'bmp': '\u1C00-\u1C37\u1C3B-\u1C49\u1C4D-\u1C4F'
    },
    {
        'name': 'Limbu',
        'bmp': '\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1940\u1944-\u194F'
    },
    {
        'name': 'Linear_A',
        'astral': '\uD801[\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]'
    },
    {
        'name': 'Linear_B',
        'astral': '\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA]'
    },
    {
        'name': 'Lisu',
        'bmp': '\uA4D0-\uA4FF'
    },
    {
        'name': 'Lycian',
        'astral': '\uD800[\uDE80-\uDE9C]'
    },
    {
        'name': 'Lydian',
        'astral': '\uD802[\uDD20-\uDD39\uDD3F]'
    },
    {
        'name': 'Mahajani',
        'astral': '\uD804[\uDD50-\uDD76]'
    },
    {
        'name': 'Makasar',
        'astral': '\uD807[\uDEE0-\uDEF8]'
    },
    {
        'name': 'Malayalam',
        'bmp': '\u0D00-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D44\u0D46-\u0D48\u0D4A-\u0D4F\u0D54-\u0D63\u0D66-\u0D7F'
    },
    {
        'name': 'Mandaic',
        'bmp': '\u0840-\u085B\u085E'
    },
    {
        'name': 'Manichaean',
        'astral': '\uD802[\uDEC0-\uDEE6\uDEEB-\uDEF6]'
    },
    {
        'name': 'Marchen',
        'astral': '\uD807[\uDC70-\uDC8F\uDC92-\uDCA7\uDCA9-\uDCB6]'
    },
    {
        'name': 'Masaram_Gondi',
        'astral': '\uD807[\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD47\uDD50-\uDD59]'
    },
    {
        'name': 'Medefaidrin',
        'astral': '\uD81B[\uDE40-\uDE9A]'
    },
    {
        'name': 'Meetei_Mayek',
        'bmp': '\uAAE0-\uAAF6\uABC0-\uABED\uABF0-\uABF9'
    },
    {
        'name': 'Mende_Kikakui',
        'astral': '\uD83A[\uDC00-\uDCC4\uDCC7-\uDCD6]'
    },
    {
        'name': 'Meroitic_Cursive',
        'astral': '\uD802[\uDDA0-\uDDB7\uDDBC-\uDDCF\uDDD2-\uDDFF]'
    },
    {
        'name': 'Meroitic_Hieroglyphs',
        'astral': '\uD802[\uDD80-\uDD9F]'
    },
    {
        'name': 'Miao',
        'astral': '\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]'
    },
    {
        'name': 'Modi',
        'astral': '\uD805[\uDE00-\uDE44\uDE50-\uDE59]'
    },
    {
        'name': 'Mongolian',
        'bmp': '\u1800\u1801\u1804\u1806-\u180E\u1810-\u1819\u1820-\u1878\u1880-\u18AA',
        'astral': '\uD805[\uDE60-\uDE6C]'
    },
    {
        'name': 'Mro',
        'astral': '\uD81A[\uDE40-\uDE5E\uDE60-\uDE69\uDE6E\uDE6F]'
    },
    {
        'name': 'Multani',
        'astral': '\uD804[\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA9]'
    },
    {
        'name': 'Myanmar',
        'bmp': '\u1000-\u109F\uA9E0-\uA9FE\uAA60-\uAA7F'
    },
    {
        'name': 'Nabataean',
        'astral': '\uD802[\uDC80-\uDC9E\uDCA7-\uDCAF]'
    },
    {
        'name': 'New_Tai_Lue',
        'bmp': '\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u19DE\u19DF'
    },
    {
        'name': 'Newa',
        'astral': '\uD805[\uDC00-\uDC59\uDC5B\uDC5D\uDC5E]'
    },
    {
        'name': 'Nko',
        'bmp': '\u07C0-\u07FA\u07FD-\u07FF'
    },
    {
        'name': 'Nushu',
        'astral': '\uD81B\uDFE1|\uD82C[\uDD70-\uDEFB]'
    },
    {
        'name': 'Ogham',
        'bmp': '\u1680-\u169C'
    },
    {
        'name': 'Ol_Chiki',
        'bmp': '\u1C50-\u1C7F'
    },
    {
        'name': 'Old_Hungarian',
        'astral': '\uD803[\uDC80-\uDCB2\uDCC0-\uDCF2\uDCFA-\uDCFF]'
    },
    {
        'name': 'Old_Italic',
        'astral': '\uD800[\uDF00-\uDF23\uDF2D-\uDF2F]'
    },
    {
        'name': 'Old_North_Arabian',
        'astral': '\uD802[\uDE80-\uDE9F]'
    },
    {
        'name': 'Old_Permic',
        'astral': '\uD800[\uDF50-\uDF7A]'
    },
    {
        'name': 'Old_Persian',
        'astral': '\uD800[\uDFA0-\uDFC3\uDFC8-\uDFD5]'
    },
    {
        'name': 'Old_Sogdian',
        'astral': '\uD803[\uDF00-\uDF27]'
    },
    {
        'name': 'Old_South_Arabian',
        'astral': '\uD802[\uDE60-\uDE7F]'
    },
    {
        'name': 'Old_Turkic',
        'astral': '\uD803[\uDC00-\uDC48]'
    },
    {
        'name': 'Oriya',
        'bmp': '\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B77'
    },
    {
        'name': 'Osage',
        'astral': '\uD801[\uDCB0-\uDCD3\uDCD8-\uDCFB]'
    },
    {
        'name': 'Osmanya',
        'astral': '\uD801[\uDC80-\uDC9D\uDCA0-\uDCA9]'
    },
    {
        'name': 'Pahawh_Hmong',
        'astral': '\uD81A[\uDF00-\uDF45\uDF50-\uDF59\uDF5B-\uDF61\uDF63-\uDF77\uDF7D-\uDF8F]'
    },
    {
        'name': 'Palmyrene',
        'astral': '\uD802[\uDC60-\uDC7F]'
    },
    {
        'name': 'Pau_Cin_Hau',
        'astral': '\uD806[\uDEC0-\uDEF8]'
    },
    {
        'name': 'Phags_Pa',
        'bmp': '\uA840-\uA877'
    },
    {
        'name': 'Phoenician',
        'astral': '\uD802[\uDD00-\uDD1B\uDD1F]'
    },
    {
        'name': 'Psalter_Pahlavi',
        'astral': '\uD802[\uDF80-\uDF91\uDF99-\uDF9C\uDFA9-\uDFAF]'
    },
    {
        'name': 'Rejang',
        'bmp': '\uA930-\uA953\uA95F'
    },
    {
        'name': 'Runic',
        'bmp': '\u16A0-\u16EA\u16EE-\u16F8'
    },
    {
        'name': 'Samaritan',
        'bmp': '\u0800-\u082D\u0830-\u083E'
    },
    {
        'name': 'Saurashtra',
        'bmp': '\uA880-\uA8C5\uA8CE-\uA8D9'
    },
    {
        'name': 'Sharada',
        'astral': '\uD804[\uDD80-\uDDCD\uDDD0-\uDDDF]'
    },
    {
        'name': 'Shavian',
        'astral': '\uD801[\uDC50-\uDC7F]'
    },
    {
        'name': 'Siddham',
        'astral': '\uD805[\uDD80-\uDDB5\uDDB8-\uDDDD]'
    },
    {
        'name': 'SignWriting',
        'astral': '\uD836[\uDC00-\uDE8B\uDE9B-\uDE9F\uDEA1-\uDEAF]'
    },
    {
        'name': 'Sinhala',
        'bmp': '\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2-\u0DF4',
        'astral': '\uD804[\uDDE1-\uDDF4]'
    },
    {
        'name': 'Sogdian',
        'astral': '\uD803[\uDF30-\uDF59]'
    },
    {
        'name': 'Sora_Sompeng',
        'astral': '\uD804[\uDCD0-\uDCE8\uDCF0-\uDCF9]'
    },
    {
        'name': 'Soyombo',
        'astral': '\uD806[\uDE50-\uDE83\uDE86-\uDEA2]'
    },
    {
        'name': 'Sundanese',
        'bmp': '\u1B80-\u1BBF\u1CC0-\u1CC7'
    },
    {
        'name': 'Syloti_Nagri',
        'bmp': '\uA800-\uA82B'
    },
    {
        'name': 'Syriac',
        'bmp': '\u0700-\u070D\u070F-\u074A\u074D-\u074F\u0860-\u086A'
    },
    {
        'name': 'Tagalog',
        'bmp': '\u1700-\u170C\u170E-\u1714'
    },
    {
        'name': 'Tagbanwa',
        'bmp': '\u1760-\u176C\u176E-\u1770\u1772\u1773'
    },
    {
        'name': 'Tai_Le',
        'bmp': '\u1950-\u196D\u1970-\u1974'
    },
    {
        'name': 'Tai_Tham',
        'bmp': '\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA0-\u1AAD'
    },
    {
        'name': 'Tai_Viet',
        'bmp': '\uAA80-\uAAC2\uAADB-\uAADF'
    },
    {
        'name': 'Takri',
        'astral': '\uD805[\uDE80-\uDEB7\uDEC0-\uDEC9]'
    },
    {
        'name': 'Tamil',
        'bmp': '\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BFA'
    },
    {
        'name': 'Tangut',
        'astral': '\uD81B\uDFE0|[\uD81C-\uD820][\uDC00-\uDFFF]|\uD821[\uDC00-\uDFF1]|\uD822[\uDC00-\uDEF2]'
    },
    {
        'name': 'Telugu',
        'bmp': '\u0C00-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58-\u0C5A\u0C60-\u0C63\u0C66-\u0C6F\u0C78-\u0C7F'
    },
    {
        'name': 'Thaana',
        'bmp': '\u0780-\u07B1'
    },
    {
        'name': 'Thai',
        'bmp': '\u0E01-\u0E3A\u0E40-\u0E5B'
    },
    {
        'name': 'Tibetan',
        'bmp': '\u0F00-\u0F47\u0F49-\u0F6C\u0F71-\u0F97\u0F99-\u0FBC\u0FBE-\u0FCC\u0FCE-\u0FD4\u0FD9\u0FDA'
    },
    {
        'name': 'Tifinagh',
        'bmp': '\u2D30-\u2D67\u2D6F\u2D70\u2D7F'
    },
    {
        'name': 'Tirhuta',
        'astral': '\uD805[\uDC80-\uDCC7\uDCD0-\uDCD9]'
    },
    {
        'name': 'Ugaritic',
        'astral': '\uD800[\uDF80-\uDF9D\uDF9F]'
    },
    {
        'name': 'Vai',
        'bmp': '\uA500-\uA62B'
    },
    {
        'name': 'Warang_Citi',
        'astral': '\uD806[\uDCA0-\uDCF2\uDCFF]'
    },
    {
        'name': 'Yi',
        'bmp': '\uA000-\uA48C\uA490-\uA4C6'
    },
    {
        'name': 'Zanabazar_Square',
        'astral': '\uD806[\uDE00-\uDE47]'
    }
];

},{}],126:[function(require,module,exports){
"use strict";

var _citysdk = _interopRequireDefault(require("citysdk"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

/*
 browserify src/index.js -o bundle.js -t [ babelify --presets [ @babel/preset-env ]
 */
console.log("BLOOPING IN THE BLOOPER");
(0, _citysdk["default"])({
  "vintage": "2017",
  "geoHierarchy": {
    "state": {
      "lat": 28.2639,
      "lng": -80.7214
    },
    "county": "*"
  },
  "sourcePath": ["acs", "acs5"],
  "values": ["B19083_001E"],
  // GINI index
  "geoResolution": "500k"
}, function (e, r) {
  return console.log(r);
});

},{"citysdk":49}]},{},[126]);
