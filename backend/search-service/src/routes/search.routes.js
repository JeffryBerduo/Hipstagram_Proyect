const express = require("express");
const router  = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { search, explore } = require("../controllers/search.controller");

router.get("/",       verifyToken, search);
router.get("/explore",verifyToken, explore);

module.exports = router;
