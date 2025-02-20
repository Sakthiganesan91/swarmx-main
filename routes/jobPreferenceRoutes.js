const express = require('express');
const router = express.Router();
const jobPreferenceController = require('../controller/jobPreferenceController');

// Save preference
router.post('/preferences', jobPreferenceController.savePreference);

router.get('/get-sub-keywords', jobPreferenceController.getSubKeyword)

// Create a keyword
router.post('/keywords', jobPreferenceController.createKeyword);

// Create a subkeyword
router.post('/keywords/:id/subkeywords', jobPreferenceController.createSubKeyword);

// Delete a keyword
router.delete('/keywords/:id', jobPreferenceController.deleteKeyword);

// Delete a subkeyword
router.delete('/keywords/:id/subkeywords/:subId', jobPreferenceController.deleteSubKeyword);

module.exports = router;
