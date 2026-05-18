const IMAGEKIT_UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload'
const IMAGEKIT_API_URL = 'https://api.imagekit.io/v1'

function getConfig() {
    return {
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
        projectBriefsFolder: process.env.IMAGEKIT_PROJECT_BRIEFS_FOLDER || '/skillsync/project-briefs',
        taskAttachmentsFolder: process.env.IMAGEKIT_TASK_ATTACHMENTS_FOLDER || '/skillsync/task-attachments',
    }
}

function isConfigured() {
    return Boolean(getConfig().privateKey)
}

function assertConfigured() {
    if (isConfigured()) return

    const error = new Error('ImageKit is not configured. Add IMAGEKIT_PRIVATE_KEY to backend/.env and restart the backend.')
    error.statusCode = 503
    throw error
}

function toSafeFileName(fileName = 'upload') {
    const cleaned = String(fileName)
        .replace(/[^\w.\-() ]+/g, '-')
        .replace(/\s+/g, ' ')
        .trim()

    return cleaned || 'upload'
}

function authHeader(privateKey) {
    return `Basic ${Buffer.from(`${privateKey}:`).toString('base64')}`
}

async function uploadFile(file, { folder, tags = [] } = {}) {
    assertConfigured()

    if (!file?.buffer) {
        const error = new Error('file is required')
        error.statusCode = 400
        throw error
    }

    const { privateKey } = getConfig()
    const form = new FormData()
    const blob = new Blob([file.buffer], { type: file.mimetype || 'application/octet-stream' })

    form.append('file', blob, toSafeFileName(file.originalname))
    form.append('fileName', toSafeFileName(file.originalname))
    form.append('useUniqueFileName', 'true')
    if (folder) form.append('folder', folder)
    if (tags.length) form.append('tags', tags.join(','))

    const response = await fetch(IMAGEKIT_UPLOAD_URL, {
        method: 'POST',
        headers: {
            Authorization: authHeader(privateKey),
        },
        body: form,
    })

    const data = await response.json().catch(() => ({}))
    if (!response.ok) {
        const error = new Error(data.message || 'ImageKit upload failed')
        error.statusCode = response.status
        throw error
    }

    return {
        file_id: data.fileId,
        name: data.name || file.originalname,
        url: data.url,
        thumbnail_url: data.thumbnailUrl || null,
        type: file.mimetype,
        size_bytes: file.size,
        imagekit_path: data.filePath || null,
    }
}

async function deleteFile(fileId) {
    assertConfigured()
    if (!fileId) return

    const { privateKey } = getConfig()
    const response = await fetch(`${IMAGEKIT_API_URL}/files/${encodeURIComponent(fileId)}`, {
        method: 'DELETE',
        headers: {
            Authorization: authHeader(privateKey),
        },
    })

    if (!response.ok && response.status !== 404) {
        const data = await response.json().catch(() => ({}))
        const error = new Error(data.message || 'ImageKit delete failed')
        error.statusCode = response.status
        throw error
    }
}

module.exports = {
    getConfig,
    isConfigured,
    uploadFile,
    deleteFile,
    __test__: {
        toSafeFileName,
    },
}
