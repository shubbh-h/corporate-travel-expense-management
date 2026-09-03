const express = require('express');
const router = express.Router();

const tripController = require('../controllers/tripController');
const {
  createTripValidator,
  updateTripValidator,
  cancelTripValidator,
  approveTripValidator,
  rejectTripValidator,
  addCommentValidator,
  listQueryValidator,
} = require('../validators/tripValidator');
const validateRequest = require('../middleware/validateRequest');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roles');

// All trip routes require an authenticated user.
router.use(protect);

// ---------- Employee ----------
router.post('/', createTripValidator, validateRequest, tripController.createTrip);
router.get('/my', listQueryValidator, validateRequest, tripController.getMyTrips);
router.patch('/:id', updateTripValidator, validateRequest, tripController.updateTrip);
router.patch('/:id/cancel', cancelTripValidator, validateRequest, tripController.cancelTrip);

// ---------- Manager ----------
router.get('/team/pending', authorize('Manager', 'Admin'), listQueryValidator, validateRequest, tripController.getTeamPendingTrips);
router.patch('/:id/approve', authorize('Manager', 'Admin'), approveTripValidator, validateRequest, tripController.approveTrip);
router.patch('/:id/reject', authorize('Manager', 'Admin'), rejectTripValidator, validateRequest, tripController.rejectTrip);
router.post('/:id/comments', authorize('Manager', 'Admin'), addCommentValidator, validateRequest, tripController.addComment);

// ---------- Admin ----------
router.get('/stats', authorize('Admin'), tripController.getTripStatistics);
router.get('/', authorize('Admin'), listQueryValidator, validateRequest, tripController.getAllTrips);
router.delete('/:id', authorize('Admin'), tripController.softDeleteTrip);

// ---------- Shared (owner, owner's manager, or Admin - enforced in tripService) ----------
router.get('/:id', tripController.getTripById);

module.exports = router;
