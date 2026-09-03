const crypto = require('crypto');
const cloudinary = require('cloudinary').v2;
const User = require('../models/User');
const AppError = require('../utils/AppError');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Supported upload categories. `folder` scopes where the file lands in
 * Cloudinary; `resourceType` tells Cloudinary how to store it; `updatesUserProfile`
 * marks the one category with an existing, unambiguous MongoDB field to persist
 * to (User.profilePicture). The rest (receipts, passport, visa, insurance, trip
 * documents) are intentionally NOT written into Trip/Expense documents here -
 * attaching an uploaded file to a specific trip/expense is that module's own
 * business logic, out of scope for this generic, standalone upload service.
 * Those uploads simply return Cloudinary metadata for the caller to use.
 */
const UPLOAD_TYPES = {
  receipt: { folder: 'receipts', resourceType: 'auto' },
  passport: { folder: 'passport', resourceType: 'auto' },
  visa: { folder: 'visa', resourceType: 'auto' },
  insurance: { folder: 'insurance', resourceType: 'auto' },
  'profile-picture': { folder: 'avatars', resourceType: 'image', updatesUserProfile: true },
  'trip-document': { folder: 'trip-documents', resourceType: 'auto' },
};

const getUploadConfig = (uploadType) => {
  const config = UPLOAD_TYPES[uploadType];
  if (!config) {
    throw new AppError(`Unsupported upload type: ${uploadType}. Allowed: ${Object.keys(UPLOAD_TYPES).join(', ')}`, 400);
  }
  return config;
};

const isAdmin = (user) => (user.role?.name || '').toLowerCase() === 'admin';

/**
 * Business rule: "Employees can upload only their own files. Admins can
 * access all files." Ownership is encoded directly in the Cloudinary
 * public_id path (tripwise/<folder>/<uploaderId>/<uuid>) at upload time,
 * since no separate MongoDB file-tracking model exists for this module.
 */
const assertOwnsFile = (user, publicId) => {
  if (isAdmin(user)) return;

  const segments = String(publicId).split('/');
  const ownerId = segments[2]; // tripwise / <folder> / <ownerId> / <uuid>

  if (!ownerId || ownerId !== String(user._id)) {
    throw new AppError('You can only access your own files', 403);
  }
};

const uploadBufferToCloudinary = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) return reject(err);
      resolve(result);
    });
    stream.end(buffer);
  });

// ============================================================
// Upload
// ============================================================

const uploadFile = async (user, uploadType, file) => {
  if (!file) throw new AppError('No file was provided', 400);

  const config = getUploadConfig(uploadType);
  const uuid = crypto.randomUUID();
  const publicId = `tripwise/${config.folder}/${user._id}/${uuid}`;

  let result;
  try {
    result = await uploadBufferToCloudinary(file.buffer, {
      public_id: publicId,
      resource_type: config.resourceType,
    });
  } catch (err) {
    throw new AppError(`File upload failed: ${err.message}`, 502);
  }

  const metadata = {
    uploadType,
    url: result.secure_url,
    publicId: result.public_id,
    resourceType: result.resource_type,
    format: result.format,
    sizeBytes: result.bytes,
    originalName: file.originalname,
    uploadedBy: user._id,
    uploadedAt: new Date(),
  };

  if (config.updatesUserProfile) {
    await User.findByIdAndUpdate(user._id, {
      profilePicture: { url: metadata.url, publicId: metadata.publicId },
    });
  }

  return metadata;
};

// ============================================================
// Delete
// ============================================================

/**
 * Explicit, user-initiated deletion of a single file. Distinct from the
 * "do not delete files permanently when soft deleting records" rule, which
 * governs Trip/Expense soft-delete flows (untouched by this module) - this
 * endpoint IS the deliberate "please delete this specific file" action.
 */
const deleteFile = async (user, publicId, resourceTypeHint) => {
  if (!publicId) throw new AppError('publicId is required', 400);
  assertOwnsFile(user, publicId);

  const candidateTypes = resourceTypeHint ? [resourceTypeHint] : ['image', 'raw', 'video'];
  let deleted = false;

  for (const resourceType of candidateTypes) {
    // eslint-disable-next-line no-await-in-loop
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    if (result.result === 'ok') {
      deleted = true;
      break;
    }
  }

  if (!deleted) throw new AppError('File not found', 404);

  // Keep the User record consistent if the deleted file was their active profile picture.
  const matchingUser = await User.findOne({ _id: user._id, 'profilePicture.publicId': publicId });
  if (matchingUser) {
    matchingUser.profilePicture = { url: '', publicId: '' };
    await matchingUser.save({ validateBeforeSave: false });
  }

  return { message: 'File deleted successfully' };
};

// ============================================================
// Metadata
// ============================================================

const getFileMetadata = async (user, publicId, resourceTypeHint) => {
  if (!publicId) throw new AppError('publicId is required', 400);
  assertOwnsFile(user, publicId);

  const candidateTypes = resourceTypeHint ? [resourceTypeHint] : ['image', 'raw', 'video'];

  for (const resourceType of candidateTypes) {
    try {
      // eslint-disable-next-line no-await-in-loop
      const result = await cloudinary.api.resource(publicId, { resource_type: resourceType });
      return {
        publicId: result.public_id,
        url: result.secure_url,
        resourceType: result.resource_type,
        format: result.format,
        sizeBytes: result.bytes,
        createdAt: result.created_at,
      };
    } catch (err) {
      // "not found" for this resource_type - try the next candidate before giving up.
      if (err.http_code !== 404) throw new AppError(`Failed to fetch file metadata: ${err.message}`, 502);
    }
  }

  throw new AppError('File not found', 404);
};

module.exports = { uploadFile, deleteFile, getFileMetadata };
