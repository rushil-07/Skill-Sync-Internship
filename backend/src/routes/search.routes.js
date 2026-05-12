const express = require('express')

const searchController = require('../controllers/search.controller')
const { authUser } = require('../middlewares/auth.middleware')

const router = express.Router()

router.get('/global', authUser, searchController.globalSearch)

module.exports = router
