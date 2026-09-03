const multer = require('multer');

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
const IMAGE_ONLY_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/**
 * Profile pictures are image-only; every other upload type (receipts,
 * passport, visa, insurance, trip documents) accepts PDF/JPG/JPEG/PNG as
 * specified. req.params.uploadType is already populated at this point,
 * since Express resolves route params before running route middleware.
 */
const fileFilter = (req, file, cb) => {
  const uploadType = req.params.uploadType;
  const allowed = uploadType === 'profile-picture' ? IMAGE_ONLY_MIME_TYPES : ALLOWED_MIME_TYPES;

  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const allowedLabel = uploadType === 'profile-picture' ? 'JPG, JPEG, PNG' : 'PDF, JPG, JPEG, PNG';
    cb(new Error(`Unsupported file type. Allowed types: ${allowedLabel}`), false);
  }
};

// Buffered in memory (not written to disk, not sent through
// multer-storage-cloudinary) so uploadService retains full control over the
// Cloudinary public_id (UUID-based) and folder structure per upload type.
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE_BYTES, files: 1 },
});

module.exports = { uploadSingleFile: upload.single('file') };
