const express = require('express');
const router = express.Router();
const {list, getById, getByName} = require('../../controllers/api/apiGenresController');

// genres
router
    .get('/', list)
    .get('/name/:name?', getByName)
    .get('/:id', getById)
    

module.exports = router;