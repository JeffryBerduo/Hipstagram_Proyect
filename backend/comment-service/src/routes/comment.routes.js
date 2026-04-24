const express = require("express");
const router  = express.Router();

const { verifyToken, verifyAdmin } = require("../middlewares/auth.middleware");
const { getComments, createComment, deleteComment, adminDeleteComment } = require("../controllers/comment.controller");

router.get   ("/:post_id",      verifyToken,              getComments);
router.post  ("/:post_id",      verifyToken,              createComment);
router.delete("/admin/:id",     verifyToken, verifyAdmin, adminDeleteComment);
router.delete("/:id",           verifyToken,              deleteComment);

module.exports = router;
