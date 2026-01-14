const express = require('express')
const router = express.Router()
const auth = require('../middleware/authMiddleware')
const allowRoles = require('../middleware/role.middleware')
const authController = require('../controllers/authController')

// Auth
router.post('/register', authController.register)
router.post('/login', authController.login)

// Admin-only
router.get('/pending', auth, allowRoles('Admin'), authController.pending)
router.post('/approve/:id', auth, allowRoles('Admin'), authController.approve)
router.get('/counts', auth, allowRoles('Admin'), authController.counts)

// NEW: List approved users (filter by role with ?role=Viewer|Engineer|Admin)
router.get('/users', auth, allowRoles('Admin'), authController.users)

// NEW: Reject pending user
router.post('/reject/:id', auth, allowRoles('Admin'), authController.rejectUser)

// NEW: Update user role
router.post('/role/:id', auth, allowRoles('Admin'), authController.updateUserRole)

// NEW: Suspend / Reactivate user (Admin)
router.post('/suspend/:id', auth, allowRoles('Admin'), authController.suspendUser)
router.post('/reactivate/:id', auth, allowRoles('Admin'), authController.reactivateUser)

module.exports = router