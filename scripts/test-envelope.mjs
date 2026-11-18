import assert from 'node:assert/strict'
import { unwrapBody, unwrapRows } from '../src/services/envelope.ts'

assert.equal(unwrapBody({ code: 0, msg: 'ok', data: { url: 'u' } }).url, 'u')
assert.throws(() => unwrapBody({ code: 1, msg: 'bad' }), /bad/)
assert.throws(() => unwrapBody({ code: 0, msg: 'ok' }), /EMPTY_BODY/)
assert.deepEqual(
  unwrapRows({ code: 0, msg: 'ok', rows: [1, 2], total: 2 }),
  { rows: [1, 2], total: 2 }
)
assert.deepEqual(
  unwrapRows({ code: 0, msg: 'ok', row: [3], total: 1 }),
  { rows: [3], total: 1 }
)
assert.throws(() => unwrapRows({ code: 1, msg: 'bad rows' }), /bad rows/)
console.log('envelope OK')
