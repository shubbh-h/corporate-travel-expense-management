const asyncHandler = require('express-async-handler');
const tripService = require('../services/tripService');

// @route POST /api/trips
const createTrip = asyncHandler(async (req, res) => {
  const trip = await tripService.createTrip(req.user, req.body);
  res.status(201).json({ success: true, message: 'Trip created successfully', data: { trip } });
});

// @route GET /api/trips/my
const getMyTrips = asyncHandler(async (req, res) => {
  const result = await tripService.getMyTrips(req.user._id, req.query);
  res.status(200).json({ success: true, data: result });
});

// @route GET /api/trips/:id
const getTripById = asyncHandler(async (req, res) => {
  const trip = await tripService.getTripById(req.user, req.params.id);
  res.status(200).json({ success: true, data: { trip } });
});

// @route PATCH /api/trips/:id
const updateTrip = asyncHandler(async (req, res) => {
  const trip = await tripService.updateTrip(req.user, req.params.id, req.body);
  res.status(200).json({ success: true, message: 'Trip updated successfully', data: { trip } });
});

// @route PATCH /api/trips/:id/cancel
const cancelTrip = asyncHandler(async (req, res) => {
  const trip = await tripService.cancelTrip(req.user, req.params.id, req.body.cancellationReason);
  res.status(200).json({ success: true, message: 'Trip cancelled successfully', data: { trip } });
});

// @route GET /api/trips/team/pending
const getTeamPendingTrips = asyncHandler(async (req, res) => {
  const result = await tripService.getTeamPendingTrips(req.user._id, req.query);
  res.status(200).json({ success: true, data: result });
});

// @route PATCH /api/trips/:id/approve
const approveTrip = asyncHandler(async (req, res) => {
  const trip = await tripService.approveTrip(req.user, req.params.id, req.body);
  res.status(200).json({ success: true, message: 'Trip approved successfully', data: { trip } });
});

// @route PATCH /api/trips/:id/reject
const rejectTrip = asyncHandler(async (req, res) => {
  const trip = await tripService.rejectTrip(req.user, req.params.id, req.body);
  res.status(200).json({ success: true, message: 'Trip rejected successfully', data: { trip } });
});

// @route POST /api/trips/:id/comments
const addComment = asyncHandler(async (req, res) => {
  const trip = await tripService.addTripComment(req.user, req.params.id, req.body.message);
  res.status(201).json({ success: true, message: 'Comment added successfully', data: { trip } });
});

// @route GET /api/trips
const getAllTrips = asyncHandler(async (req, res) => {
  const result = await tripService.getAllTrips(req.query);
  res.status(200).json({ success: true, data: result });
});

// @route GET /api/trips/stats
const getTripStatistics = asyncHandler(async (req, res) => {
  const stats = await tripService.getTripStatistics();
  res.status(200).json({ success: true, data: stats });
});

// @route DELETE /api/trips/:id
const softDeleteTrip = asyncHandler(async (req, res) => {
  const result = await tripService.softDeleteTrip(req.user, req.params.id);
  res.status(200).json({ success: true, message: result.message });
});

module.exports = {
  createTrip,
  getMyTrips,
  getTripById,
  updateTrip,
  cancelTrip,
  getTeamPendingTrips,
  approveTrip,
  rejectTrip,
  addComment,
  getAllTrips,
  getTripStatistics,
  softDeleteTrip,
};
