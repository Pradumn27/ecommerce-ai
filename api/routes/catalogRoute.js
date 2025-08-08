const express = require('express');
const {
  getCatalog,
  getCatalogProduct,
  getCategories,
  aiSearch,
} = require('../controllers/catalogController');

const router = express.Router();

router.get('/catalog', getCatalog);
router.get('/catalog/:id', getCatalogProduct);
router.get('/categories', getCategories);
router.post('/catalog/search', aiSearch);

module.exports = router;
