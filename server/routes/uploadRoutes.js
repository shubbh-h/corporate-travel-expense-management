const express = require('express');
const router = express.Router();

const uploadController = require('../controllers/uploadController');
const { uploadSingleFile } = require('../middleware/upload');
const { protect } = require('../middleware/auth');

// All upload routes require an authenticated user; ownership is enforced in uploadService.
router.use(protect);

router.post('/:uploadType', uploadSingleFile, uploadController.uploadFile);

// publicId/resourceType travel via body/query rather than a URL param, since
// Cloudinary public IDs (tripwise/<folder>/<userId>/<uuid>) contain slashes.
router.delete('/file', uploadController.deleteFile);
router.get('/file/metadata', uploadController.getFileMetadata);

module.exports = router;
