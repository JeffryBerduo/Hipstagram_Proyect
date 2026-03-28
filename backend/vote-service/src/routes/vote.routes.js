const express = require("express");
const router  = express.Router();

const { verifyToken } = require("../middlewares/auth.middleware");
const { castVote, getVotes, getMyVote } = require("../controllers/vote.controller");

router.post("/",            verifyToken, castVote);
router.get ("/:post_id",    verifyToken, getVotes);
router.get ("/:post_id/me", verifyToken, getMyVote);

module.exports = router;
