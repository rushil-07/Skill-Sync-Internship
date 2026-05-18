const test = require('node:test')
const assert = require('node:assert/strict')

const { __test__ } = require('../src/services/projectCompletion.service')

test('getLevelIndex returns rank positions and falls back to BEGINNER rank', () => {
    assert.equal(__test__.getLevelIndex('BEGINNER'), 0)
    assert.equal(__test__.getLevelIndex('INTERMEDIATE'), 1)
    assert.equal(__test__.getLevelIndex('ADVANCED'), 2)
    assert.equal(__test__.getLevelIndex('EXPERT'), 3)
    assert.equal(__test__.getLevelIndex('UNKNOWN'), 0)
})

test('getPromotedLevel promotes by one level without exceeding project cap', () => {
    assert.equal(__test__.getPromotedLevel('BEGINNER', 'EXPERT'), 'INTERMEDIATE')
    assert.equal(__test__.getPromotedLevel('INTERMEDIATE', 'ADVANCED'), 'ADVANCED')
    assert.equal(__test__.getPromotedLevel('ADVANCED', 'ADVANCED'), 'ADVANCED')
    assert.equal(__test__.getPromotedLevel('EXPERT', 'EXPERT'), 'EXPERT')
})
