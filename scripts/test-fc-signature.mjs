import assert from 'node:assert/strict'
import { createProxyAwareSigner, boundaryNote } from '../src/adapters/fcSignature.ts'

const signer = createProxyAwareSigner({ secretId: 'sid', secretKey: 'skey', useProxy: false })
const h = await signer.headers()
assert.equal(h['X-CR-SecretId'], 'sid')
assert.match(h['X-CR-Timestamp'], /^\d{10}$/)
assert.match(h['X-CR-Signature'], /^[0-9a-f]{64}$/)
assert.match(boundaryNote, /后端代理/)
assert.equal(signer.boundaryNote, boundaryNote)
const proxied = createProxyAwareSigner({ secretId: 'sid', secretKey: 'skey', useProxy: true })
assert.deepEqual(await proxied.headers(), {})
console.log('fcSignature OK')
