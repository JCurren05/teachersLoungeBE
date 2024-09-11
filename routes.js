import express from "express";
import {
  approvePost,
  deletePost,
  getApprovedUsers,
  getPendingUsers,
  getUserPosts,
  getPostComments,
  getPostLikes,
  createNewUser,
  createNewPost,
  getAllApprovedPosts,
  getPendingPosts,
  approveUser,
  deleteUser,
  connectDB,
  createNewCommunity,
  getAllCommunities,
  joinCommunity,
  leaveCommunity,
  likePost,
  getUserCommunities,
  getCommunityApprovedPosts,
  createNewCommunityPost,
  searchUser,
  addComment,
  getComment,
  getCommentByCommentID,
  addCommentToPost,
  getCommentsByPostID,
  updateComment,
  deleteComment,
  createConversation,
  getConversations,
  sendMessage,
  getMessages,
  getLastMessage,
  getUserInfo,
  checkIfFriended,
  friendUser,
  unfriendUser,
  getFriendsList,
  getCategories
} from "./dbLogic.js";
import { fileHelper, s3Delete, s3Upload } from "./fileManagement.js";
import { login, register } from "./auth.js";
import { userAuth } from "./middleware/authMiddleware.js";
import bodyParser from "body-parser";
const app = express();
const router = express.Router();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

router.post("/register", register);
router.post("/login", login);
router.get("/getApprovedUsers", userAuth, getApprovedUsers);
router.get("/getPendingUsers",userAuth, getPendingUsers);
router.get("/getUserPosts",userAuth, getUserPosts);
router.get("/getPostComments",userAuth, getPostComments);
router.get("/getPostLikes",userAuth, getPostLikes);
router.post("/likePost", userAuth, likePost);
router.post("/createNewUser",userAuth, createNewUser);
router.post("/createNewPost",userAuth, createNewPost);
router.get("/getAllApprovedPosts",userAuth, getAllApprovedPosts);
router.get("/getPendingPosts",userAuth, getPendingPosts);
router.post("/approvePost",userAuth, approvePost);
router.post("/deletePost",userAuth, deletePost, s3Delete);
router.post("/deleteUser",userAuth, deleteUser);
router.post("/approveUser",userAuth, approveUser);
router.post("/createNewPost",userAuth, createNewPost);
router.post("/createNewCommunity",userAuth, createNewCommunity);
router.get("/getAllCommunities",userAuth, getAllCommunities);
router.post("/joinCommunity",userAuth, joinCommunity);
router.delete("/leaveCommunity",userAuth, leaveCommunity)
router.get("/getUserCommunities", userAuth, getUserCommunities);
router.get("/getCommunityApprovedPosts", getCommunityApprovedPosts);
router.post("/createNewCommunityPost", createNewCommunityPost);
router.get("/searchUser", userAuth, searchUser);
router.post("/addComment", userAuth, addComment);
router.post("/getComment", userAuth, getComment);
router.post("/getCommentByCommentID", userAuth, getCommentByCommentID);
router.post("/addCommentToPost", userAuth, addCommentToPost);
router.get("/getCommentsByPostID", userAuth, getCommentsByPostID);
router.put("/updateComment", userAuth, updateComment);
router.delete("/deleteComment", userAuth, deleteComment);
router.post("/createConversation", createConversation);
router.get("/getConversations", getConversations);
router.post("/sendMessage", sendMessage);
router.get("/getMessages", getMessages);
router.get("/getLastMessage", getLastMessage);
router.get("/getUserInfo", getUserInfo);
router.get("/checkIfFriended", checkIfFriended);
router.post("/friendUser", friendUser);
router.delete("/unfriendUser", unfriendUser);
router.get("/getFriendsList", getFriendsList);
router.get("/getCategories", getCategories);

router.post("/fileUpload", fileHelper.single("file"), async (req, res) => {
  try {
    s3Upload(req, res);
  } catch (error) {
    res.status(400).send(error);
  }
});

router.use("/", (req, res, next) => {
  res.status(404).json({ error: "page not found" });
});
export default router;
