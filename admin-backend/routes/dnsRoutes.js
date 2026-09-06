const express = require('express');
const router = express.Router();
const dnsController = require('../controllers/dnsController');

router.get('/', dnsController.getDnsWhitelist);
router.post('/', dnsController.addDnsWhitelist);
router.delete('/:id', dnsController.deleteDnsWhitelist);

module.exports = router;
