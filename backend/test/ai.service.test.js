const test = require('node:test')
const assert = require('node:assert/strict')

const { __test__ } = require('../src/services/ai.service')

test('normalizeText trims and lowercases safely', () => {
    assert.equal(__test__.normalizeText('  React JS  '), 'react js')
    assert.equal(__test__.normalizeText(null), '')
})

test('clamp bounds numeric scores', () => {
    assert.equal(__test__.clamp(120, 0, 100), 100)
    assert.equal(__test__.clamp(-5, 0, 100), 0)
    assert.equal(__test__.clamp(42, 0, 100), 42)
})

test('average returns zero for empty lists and averages numbers', () => {
    assert.equal(__test__.average([]), 0)
    assert.equal(__test__.average([80, 90, 100]), 90)
})

test('buildCourseSuggestion returns provider links for known skill families', () => {
    const reactCourse = __test__.buildCourseSuggestion('React', 'Frontend', 'INTERMEDIATE')
    assert.equal(reactCourse.provider, 'Frontend Masters')
    assert.match(reactCourse.course_url, /frontendmasters\.com/)

    const dataCourse = __test__.buildCourseSuggestion('Python', 'Data & AI', 'ADVANCED')
    assert.equal(dataCourse.provider, 'Coursera')
    assert.match(dataCourse.course_url, /coursera\.org/)
})

test('parseJsonFromGeminiResponse extracts structured JSON text', () => {
    const payload = {
        candidates: [
            {
                content: {
                    parts: [
                        {
                            text: '```json\n{\"name\":\"Campus Portal\",\"budget\":50000}\n```',
                        },
                    ],
                },
            },
        ],
    }

    assert.deepEqual(__test__.parseJsonFromGeminiResponse(payload), {
        name: 'Campus Portal',
        budget: 50000,
    })
})
