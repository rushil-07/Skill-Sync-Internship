const test = require('node:test')
const assert = require('node:assert/strict')

const imagekitService = require('../src/services/imagekit.service')

test('ImageKit service sanitizes unsafe upload filenames', () => {
    assert.equal(
        imagekitService.__test__.toSafeFileName('../bad:name?.pdf'),
        '..-bad-name-.pdf'
    )
})

test('ImageKit service reports missing private key clearly', async () => {
    const originalKey = process.env.IMAGEKIT_PRIVATE_KEY
    delete process.env.IMAGEKIT_PRIVATE_KEY

    await assert.rejects(
        () => imagekitService.uploadFile({
            originalname: 'brief.pdf',
            mimetype: 'application/pdf',
            size: 10,
            buffer: Buffer.from('demo'),
        }),
        /ImageKit is not configured/
    )

    if (originalKey) process.env.IMAGEKIT_PRIVATE_KEY = originalKey
})
