const test = require('node:test')
const assert = require('node:assert/strict')

test('express app loads without starting the server', () => {
    const app = require('../src/app')

    assert.equal(typeof app, 'function')
    assert.equal(typeof app.use, 'function')
    assert.equal(typeof app.handle, 'function')
})
