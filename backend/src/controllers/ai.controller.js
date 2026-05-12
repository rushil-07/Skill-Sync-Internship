const aiService = require('../services/ai.service')
const path = require('path')
const mammoth = require('mammoth')
const { PDFParse } = require('pdf-parse')

async function extractBriefTextFromFile(file) {
    if (!file) return ''

    const ext = path.extname(file.originalname || '').toLowerCase()

    if (ext === '.pdf') {
        const parser = new PDFParse({ data: file.buffer })
        const result = await parser.getText()
        if (typeof parser.destroy === 'function') {
            await parser.destroy()
        }
        return result.text || ''
    }

    if (ext === '.docx') {
        const result = await mammoth.extractRawText({ buffer: file.buffer })
        return result.value || ''
    }

    if (ext === '.txt' || ext === '.md') {
        return file.buffer.toString('utf8')
    }

    const error = new Error('Unsupported file type. Upload PDF, DOCX, TXT, MD, or use pasted text.')
    error.statusCode = 400
    throw error
}

async function getSkillGapAnalysis(req, res) {
    try {
        const result = await aiService.getSkillGapAnalysis(req.params.projectId)
        res.status(200).json(result)
    } catch (error) {
        console.error('getSkillGapAnalysis error:', error)
        res.status(error.statusCode || 500).json({
            message: error.message || 'Server error',
        })
    }
}

async function getProjectMatches(req, res) {
    try {
        const result = await aiService.getProjectMatchesForUser(req.user.id)
        res.status(200).json(result)
    } catch (error) {
        console.error('getProjectMatches error:', error)
        res.status(error.statusCode || 500).json({
            message: error.message || 'Server error',
        })
    }
}

async function getPredictiveAnalytics(req, res) {
    try {
        const result = await aiService.recalculateAndPersistProjectSuccessScore(req.params.projectId)
        res.status(200).json(result)
    } catch (error) {
        console.error('getPredictiveAnalytics error:', error)
        res.status(error.statusCode || 500).json({
            message: error.message || 'Server error',
        })
    }
}

async function suggestTaskAssignees(req, res) {
    try {
        const result = await aiService.suggestTaskAssignees(req.params.taskId, {
            persistSuggestion: req.body?.persist_suggestion !== false,
        })

        res.status(200).json(result)
    } catch (error) {
        console.error('suggestTaskAssignees error:', error)
        res.status(error.statusCode || 500).json({
            message: error.message || 'Server error',
        })
    }
}

async function getTeamAssembly(req, res) {
    try {
        const result = await aiService.getTeamAssemblyRecommendations(req.params.projectId)
        res.status(200).json(result)
    } catch (error) {
        console.error('getTeamAssembly error:', error)
        res.status(error.statusCode || 500).json({
            message: error.message || 'Server error',
        })
    }
}

async function parseBrief(req, res) {
    try {
        const extractedText = await extractBriefTextFromFile(req.file)
        const briefText = extractedText || req.body?.brief_text

        const result = await aiService.parseProjectBrief(
            briefText,
            req.body?.project_name
        )

        res.status(200).json({
            ...result,
            source: req.file ? 'file_upload' : 'pasted_text',
            uploaded_file_name: req.file?.originalname || null,
        })
    } catch (error) {
        console.error('parseBrief error:', error)
        res.status(error.statusCode || 500).json({
            message: error.message || 'Server error',
        })
    }
}


module.exports = {
    getSkillGapAnalysis,
    getProjectMatches,
    getPredictiveAnalytics,
    suggestTaskAssignees,
    getTeamAssembly,
    parseBrief,
}

