const express        = require('express')
const authController = require('../controllers/auth.controller')

const router = express.Router()

router.post('/register',       authController.registerUser)
router.post('/login',          authController.loginUser)
router.post('/logout',         authController.logoutUser)
router.post('/forgot-password',authController.forgotPassword)
router.post('/reset-password', authController.resetPassword)
router.post('/verify-token',   authController.verifyResetToken)

module.exports = router