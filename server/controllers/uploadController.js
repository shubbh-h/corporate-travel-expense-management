const asyncHandler = require('express-async-handler');
const uploadService = require('../services/uploadService');

// @route POST /api/uploads/:uploadType
const uploadFile = asyncHandler(async (req, res) => {
  const metadata = await uploadService.uploadFile(req.user, req.params.uploadType, req.file);
  res.status(201).json({ success: true, message: 'File uploaded successfully', data: { file: metadata } });
});

// @route DELETE /api/uploads/file
const deleteFile = asyncHandler(async (req, res) => {
  const result = await uploadService.deleteFile(req.user, req.body.publicId, req.body.resourceType);
  res.status(200).json({ success: true, message: result.message });
});

// @route GET /api/uploads/file/metadata
const getFileMetadata = asyncHandler(async (req, res) => {
  const metadata = await uploadService.getFileMetadata(req.user, req.query.publicId, req.query.resourceType);
  res.status(200).json({ success: true, data: { file: metadata } });
});

module.exports = { uploadFile, deleteFile, getFileMetadata };
