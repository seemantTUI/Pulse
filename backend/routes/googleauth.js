const express = require('express');
const router = express.Router();

const {login} = require('../controllers/googleLoginController');

router.post('/login', login);

module.exports = router;