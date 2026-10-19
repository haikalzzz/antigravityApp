const express = require('express');
const router = express.Router();
const biodataController = require('../controllers/biodataController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Semua endpoint biodata diproteksi menggunakan token Bearer
router.use(authenticateToken);

router.get('/', biodataController.getAllBiodata);
router.get('/:id', biodataController.getBiodataById);
router.post('/', biodataController.createBiodata);
router.put('/:id', biodataController.updateBiodata);
router.patch('/:id', biodataController.updateBiodata);
router.delete('/:id', biodataController.deleteBiodata);

module.exports = router;
