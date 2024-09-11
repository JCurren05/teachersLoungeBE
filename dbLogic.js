import connection from "./database.js";
import bcrypt from "bcrypt";
import { generateToken } from "./utils/tokenGenerator.js";

//Functions to connect to DB
const connectDB = (req, res, next) => {
  connection.connect(function (err) {
    if (err) {
      console.error("Database connection failed: " + err.stack);
    }
    console.log("Connected to database.");
  });
};
const disconnectDB = (req, res, next) => {
  connection.end(function (err) {
    if (err) {
      console.error("Failed to disconnect from db" + err.stack);
    }
  });
  console.log("Disconnected from database");
};

//Functions for logging in and registering

// Logs in the user to the app
const verifyUserLogin = async (req, res, next) => {
  // Query to check for user
  connection.query(
    'select * from USER where USER.email="' + req.body.username + '";',
    async function (error, results) {
      // Return error if any
      if (error) {
        console.error(error.stack);
        return res
          .status(500)
          .json({ message: "Server error: " + error.stack });
      }

      if (results[0] != null) {
        // Get user from results
        let user = results[0];

        // Compare passwords
        const match = await bcrypt.compare(
          req.body.password,
          results[0].Password
        );
        if (!match) {
          return res.status(400).json({ message: "Incorrect password" });
        }

        // Generate token for user
        const token = generateToken(req.body.username);

        return res.status(200).json({
          message: "User logged in successfully",
          user: {
            Email: results[0].Email,
            FirstName: results[0].FirstName,
            LastName: results[0].LastName,
            SchoolID: results[0].SchoolID,
            Role: results[0].Role,
          },
          token: token,
        });
      } else {
        return res
          .status(400)
          .json({ message: "User doesn't exist", test: "AHHHH" });
      }
    }
  );
};

// Registers a new user onto the app
const registerNewUser = async (req, res, next) => {
  // query to check if user exists
  var q =
    "select * from USER where USER.email=" +
    connection.escape(req.body.username) +
    ";";
  connection.query(q, async function (error, results) {
    // Error with querying data
    if (error) {
      console.error(error.stack);
      return res
        .status(500)
        .json({ message: "Error with query: " + error.stack });
    }

    // User already exists
    if (results[0] != null) {
      return res.status(400).json({
        message: "This username is already taken",
        data: {
          Email: results[0].Email,
          FirstName: results[0].FirstName,
          LastName: results[0].LastName,
          SchoolID: results[0].SchoolID,
          Role: results[0].Role,
        },
      });
    } else {
      // Hash user's password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(req.body.password, salt);

      // Generate jwt for the user
      const token = generateToken(req.body.username);

      // Insert query
      q =
        "INSERT INTO USER (Email,FirstName,LastName,Password,SchoolID,Role) VALUES(" +
        connection.escape(req.body.username) +
        "," +
        connection.escape(req.body.firstName) +
        "," +
        connection.escape(req.body.lastName) +
        "," +
        connection.escape(hashedPassword) +
        "," +
        1 +
        "," +
        connection.escape(req.body.role) +
        ")";

      // Run insert query
      connection.query(q, function (error, results) {
        // Return error if any
        if (error) {
          console.error(error.stack);
          return res
            .status(500)
            .json({ message: "Error with query: " + error.stack });
        } else {
          return res.status(200).json({
            Email: req.body.username,
            FirstName: req.body.firstName,
            LastName: req.body.lastName,
            SchoolID: 1,
            Role: req.body.role,
            token: token,
          });
        }
      });
    }
  });
};

//Functions dealing with users

//Required fields in req.body: email, fname, lname, schoolId
const createNewUser = (req, res, next) => {
  var sql =
    "INSERT INTO USER (Email, FirstName, LastName, SchoolID) VALUES (" +
    connection.escape(req.body.email) +
    "," +
    connection.escape(req.body.fname) +
    "," +
    connection.escape(req.body.lname) +
    "," +
    connection.escape(req.body.schoolId) +
    ")";
  connection.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: error.stack });
    }
    return res.status(200).json({ data: results });
  });
};

const getSpecificUser = (req, res, next) => {
  //TODO- this will be the same as getApprovedUsers but add a WHERE for the email
};

const promoteUser = (req, res, next) => {
  //This function does not have an endpoint, at the time of writing, have not determined a system for making a user and Admin
  var sql =
    "UPDATE USER SET Role =" +
    connection.escape("Admin") +
    " WHERE (USER.Email= " +
    connection.escape(req.body.email) +
    ")";
  connection.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: error.stack });
    }
    return res.status(200).json({ message: "Success" });
  });
};

const approveUser = (req, res, next) => {
  var sql =
    "UPDATE USER SET Role =" +
    connection.escape("Approved") +
    " WHERE (USER.Email= " +
    connection.escape(req.body.email) +
    ")";
  connection.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: error.stack });
    }
    return res.status(200).json({ message: "Success" });
  });
};

const deleteUser = (req, res, next) => {
  var sql =
    "DELETE FROM USER where USER.Email=" + connection.escape(req.body.email);
  connection.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: error.stack });
    }
    return res.status(200).json({ message: "Success" });
  });
};

const getApprovedUsers = (req, res, next) => {
  connection.query(
    "select * from USER where (USER.Role= " +
      connection.escape("Approved") +
      ") OR (USER.Role=" +
      connection.escape("Admin") +
      ")",
    function (error, results) {
      if (error) {
        console.error(error.stack);
        return res.status(500).json({ message: error.stack });
      }
      return res.status(200).json({ data: results });
    }
  );
};

const getPendingUsers = (req, res, next) => {
  connection.query(
    "select * from USER where USER.Role= " + connection.escape("Guest"),
    function (error, results) {
      if (error) {
        console.error(error.stack);
        return res.status(500).json({ message: error.stack });
      }
      return res.status(200).json({ data: results });
    }
  );
};

//Functions dealing with posts

const approvePost = (req, res, next) => {
  var sql =
    "UPDATE POST SET Approved =" +
    connection.escape(1) +
    " WHERE (POST.PostID= " +
    connection.escape(req.body.id) +
    ")";
  connection.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: error.stack });
    }
    return res.status(200).json({ message: "Success" });
  });
};

const deletePost = (req, res, next) => {
  // Delete all records from post_likes table
  let sql =
    "DELETE FROM POST_LIKES where POST_LIKES.PostID = " +
    connection.escape(req.body.id);

  connection.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: error.stack });
    }
  });

  // Delete record from post table
  sql = "DELETE FROM POST where POST.PostID=" + connection.escape(req.body.id);
  connection.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: error.stack });
    }
    next();
  });
};
const getAllApprovedPosts = (req, res, next) => {
  var category = Number(req.query.category);

  var sql =
    category === 0
      ? `SELECT P.*, SUM(PLikes.PostID IS NOT NULL) AS likesCount 
        FROM POST P 
        LEFT JOIN POST_LIKES PLikes ON P.PostID = PLikes.PostID 
        WHERE P.Approved = 1 AND P.CommunityID=0 
        GROUP BY P.PostID`
      : `SELECT P.*, SUM(PLikes.PostID IS NOT NULL) AS likesCount 
        FROM POST P 
        LEFT JOIN POST_LIKES PLikes ON P.PostID = PLikes.PostID 
        WHERE P.Approved = 1 AND P.CategoryID = ${connection.escape(
          category
        )} AND P.CommunityID=0
        GROUP BY P.PostID`;

  connection.query(sql, function (error, results, fields) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: error.stack });
    }

    return res.status(200).json({ data: results });
  });
};

const getPendingPosts = (req, res, next) => {
  connection.query(
    "select * from POST where POST.Approved =0",
    function (error, results, fields) {
      if (error) {
        console.error(error.stack);
        return res.status(500).json({ message: error.stack });
      }

      return res.status(200).json({ data: results });
    }
  );
};

//Gets post based on a user
const getUserPosts = (req, res, next) => {
  connection.query(
    "select * from POST where POST.email=" + connection.escape(req.body.user),
    function (error, results, fields) {
      if (error) {
        console.error(error.stack);
        return res.status(500).json({ message: error.stack });
      }
      return res.status(200).json({ data: results });
    }
  );
};

//Database functionality with likes and comments has not been implemented yet but these functions are how we imagine that would happen...
const getPostComments = (req, res, next) => {
  connection.query(
    "select * from COMMENTS_TO_POST where COMMENTS_TO_POST.postId=" +
      connection.escape(req.body.postId),
    function (error, results, fields) {
      if (error) {
        console.error(error.stack);
        return res.status(500).json({ message: error.stack });
      }
      return res.status(200).json({ data: results });
    }
  );
};

// Adds a like to a post
const likePost = (req, res, next) => {
  const sql =
    "INSERT INTO POST_LIKES (PostID, Email) VALUES (" +
    connection.escape(req.body.postId) +
    "," +
    connection.escape(req.body.userEmail) +
    ")";

  // Execute query
  connection.query(sql, function (error, results) {
    // Return error if any
    if (error) {
      return res.status(500).json({ message: "Server error, try again" });
    }

    return res.status(200).json({ message: "Successfully liked the post!" });
  });
};

// Gets the number of likes for a post
const getPostLikes = (req, res, next) => {
  connection.query(
    "select COUNT(*) as likeCount from POST_LIKES where POST_LIKES.POSTID=" +
      connection.escape(req.body.postID),
    function (error, results, fields) {
      if (error) {
        console.error(error.stack);
        return res.status(500).json({ message: "Server error, try again" });
      }

      return res.status(200).json({ likeCount: results[0].likeCount });
    }
  );
};

const createNewPost = (req, res, next) => {
  var sql =
    "INSERT INTO POST(Content,Email, CategoryID,FileUrl,FileDisplayName,FileType,awsFileLoc) VALUES (" +
    connection.escape(req.body.content) +
    "," +
    connection.escape(req.body.email) +
    "," +
    connection.escape(req.body.category) +
    "," +
    connection.escape(req.body.fileUrl) +
    "," +
    connection.escape(req.body.fileDisplayName) +
    "," +
    connection.escape(req.body.fileType) +
    "," +
    connection.escape(req.body.awsFileLoc) +
    ")";
  connection.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: "Server error, try again" });
    }
    return res.status(200).json({ data: results });
  });
};

// Creates a community with the provided name
const createNewCommunity = (req, res, next) => {
  let sql =
    "SELECT * FROM COMMUNITY WHERE CommunityName = '" +
    req.body.communityName +
    "';";

  // Check if community exists
  connection.query(sql, function (error, results) {
    // Return error if any
    if (error) {
      return res.status(500).json({ message: "Server error, try again" });
    }

    // Create community if it doesn't exist
    if (results[0] == null) {
      sql =
        "INSERT INTO COMMUNITY(CommunityName) VALUES (" +
        connection.escape(req.body.communityName) +
        ")";

      // Run insert query
      connection.query(sql, function (error, results) {
        // Return error if any
        if (error) {
          return res.status(500).json({ message: "Server error, try again" });
        }

        return res
          .status(201)
          .json({ message: "Community created successfully" });
      });
    } else {
      return res.status(500).json({ message: "Community already exists!" });
    }
  });
};

// Gets all communities
const getAllCommunities = (req, res, next) => {
  const sql = "SELECT * FROM COMMUNITY";

  // Run insert query
  connection.query(sql, function (error, results) {
    // Return error if any
    if (error) {
      return res.status(500).json({ message: "Server error, try again" });
    }

    return res.status(200).json({ data: results });
  });
};

// Joins a specified user to the specified community
const joinCommunity = (req, res, next) => {
  let sql =
    "INSERT INTO COMMUNITY_MEMBERS VALUES (" +
    connection.escape(req.body.communityID) +
    "," +
    connection.escape(req.body.userEmail) +
    ");";

  // Run insert query
  connection.query(sql, function (error, results) {
    // Return error if any
    if (error) {
      return res.status(500).json({ message: "Server error, try again" });
    }

    return res
      .status(201)
      .json({ message: "User joined community successfully" });
  });
};

// Leaves a specified user from the specified community
const leaveCommunity = (req, res, next) => {
  let sql =
    "DELETE FROM COMMUNITY_MEMBERS WHERE CommunityID = " +
    connection.escape(req.query.communityID) +
    " AND Email =" +
    connection.escape(req.query.userEmail) +
    ";";

  // Run delete query
  connection.query(sql, function (error, results) {
    // Return error if any
    if (error) {
      return res.status(500).json({ message: "Server error, try again" });
    }

    return res
      .status(200)
      .json({ message: "User removed from community successfully" });
  });
};

// Returns the communties a user is in
const getUserCommunities = (req, res, next) => {
  const email = req.query.email;
  const sql =
    "SELECT c.CommunityID, c.CommunityName FROM COMMUNITY c JOIN COMMUNITY_MEMBERS cm ON c.CommunityID = cm.CommunityID WHERE cm.Email = ?";

  connection.query(sql, [email], function (error, results) {
    if (error) {
      return res.status(500).json({ message: "Server error, try again" });
    }

    return res.status(200).json({ data: results });
  });
};

const getCommunityApprovedPosts = (req, res, next) => {
  var community = Number(req.query.communityID);
  var category = Number(req.query.category);
  var sql =
    category === 0
      ? `SELECT P.*, SUM(PLikes.PostID IS NOT NULL) AS likesCount 
      FROM POST P 
      LEFT JOIN POST_LIKES PLikes ON P.PostID = PLikes.PostID 
      WHERE P.Approved = 1 AND P.CommunityID= ${connection.escape(community)} 
      GROUP BY P.PostID`
      : `SELECT P.*, SUM(PLikes.PostID IS NOT NULL) AS likesCount 
      FROM POST P 
      LEFT JOIN POST_LIKES PLikes ON P.PostID = PLikes.PostID 
      WHERE P.Approved = 1 AND P.CategoryID = ${connection.escape(
        category
      )} AND P.CommunityID= ${connection.escape(community)} 
      GROUP BY P.PostID`;

  connection.query(sql, function (error, results, fields) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: error.stack });
    }

    return res.status(200).json({ data: results });
  });
};

const createNewCommunityPost = (req, res, next) => {
  var sql =
    "INSERT INTO POST(Content,Email, CategoryID,FileUrl,FileDisplayName,FileType,awsFileLoc, CommunityID) VALUES (" +
    connection.escape(req.body.content) +
    "," +
    connection.escape(req.body.email) +
    "," +
    connection.escape(req.body.category) +
    "," +
    connection.escape(req.body.fileUrl) +
    "," +
    connection.escape(req.body.fileDisplayName) +
    "," +
    connection.escape(req.body.fileType) +
    "," +
    connection.escape(req.body.awsFileLoc) +
    "," +
    connection.escape(req.body.communityId) +
    ")";
  connection.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: "Server error, try again" });
    }
    return res.status(200).json({ data: results });
  });
};

// Searches for a user
const searchUser = (req, res, next) => {
  // Create a regular expression to search for the query
  const searchQuery = req.query.searchQuery;

  if (searchQuery !== "") {
    const sql = `SELECT * FROM USER 
    WHERE FirstName LIKE ${connection.escape("%" + searchQuery + "%")} 
    OR LastName LIKE ${connection.escape("%" + searchQuery + "%")}`;

    connection.query(sql, function (error, results, fields) {
      if (error) {
        console.error(error.stack);
        return res.status(500).json({ message: error.stack });
      }

      return res.status(200).json({ data: results });
    });
  }
};

const addComment = (req, res, next) => {
  var sql =
    "INSERT INTO COMMENT(Content,Email, Time) VALUES (" +
    connection.escape(req.body.content) +
    "," +
    connection.escape(req.body.email) +
    "," +
    connection.escape(req.body.time) +
    ")";
  connection.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: error.stack });
    }
    return res.status(200).json({ data: results });
  });
};

const getComment = (req, res, next) => {
  var sql =
    "SELECT * FROM COMMENT WHERE Email =" +
    connection.escape(req.body.email) +
    " AND Content=" +
    connection.escape(req.body.content);
  connection.query(sql, function (error, results, fields) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: error.stack });
    }
    return res.status(200).json({ data: results });
  });
};

const getCommentByCommentID = (req, res, next) => {
  var sql =
    "SELECT * FROM COMMENT WHERE CommentId =" +
    connection.escape(req.body.commentId);
  connection.query(sql, function (error, results, fields) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: error.stack });
    }
    return res.status(200).json({ data: results });
  });
};

const addCommentToPost = (req, res, next) => {
  var sql =
    "INSERT INTO COMMENTS_TO_POST(Email, CommentId, PostId) VALUES (" +
    connection.escape(req.body.email) +
    "," +
    connection.escape(req.body.commentId) +
    "," +
    connection.escape(req.body.postId) +
    ")";
  connection.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: error.stack });
    }
    return res.status(200).json({ data: results });
  });
};

const getCommentsByPostID = (req, res, next) => {
  var postId = Number(req.query.postId);

  var sql = `SELECT * FROM COMMENTS_TO_POST WHERE PostID = ${connection.escape(
    postId
  )}`;

  // var sql =
  //   "SELECT * FROM COMMENTS_TO_POST WHERE PostID = " +
  //   connection.escape(req.body.postId);
  connection.query(sql, function (error, results, fields) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: error.stack });
    }
    return res.status(200).json({ data: results });
  });
};

const updateComment = (req, res, next) => {
  var sql =
    "UPDATE COMMENT SET Content=" +
    connection.escape(req.body.content) +
    " WHERE CommentID=" +
    connection.escape(req.body.commentId);
  connection.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: "Server error, try again" });
    }
    return res.status(200).json({ message: "Comment updated successfully" });
  });
};

const deleteComment = (req, res, next) => {
  var sql =
    "DELETE FROM COMMENT WHERE CommentID=" +
    connection.escape(req.body.commentId);
  connection.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: "Server error, try again" });
    }
    return res.status(200).json({ message: "Comment deleted successfully" });
  });
};

// Creates a new conversation
const createConversation = (req, res, next) => {
  // Get sender and receiver email
  const senderEmail = req.body.senderEmail;
  const receiverEmail = req.body.receiverEmail;
  let conversationId = null;

  // Check if conversation already exists
  let sql = `SELECT *
            FROM CONVERSATION_MEMBERS cm1
            JOIN CONVERSATION_MEMBERS cm2 ON cm1.ConversationID = cm2.ConversationID
            WHERE cm1.Email = ${connection.escape(senderEmail)}
            AND cm2.Email = ${connection.escape(receiverEmail)}; `;

  connection.query(sql, function (error, results) {
    if (error) {
      return res
        .status(500)
        .json({ message: "Server error, Couldn't create conversation" });
    }

    if (results.length > 0) {
      return res.status(500).json({ message: "Conversation already exists" });
    } else {
      // Create conversation
      sql = `INSERT INTO CONVERSATION(Title) 
  VALUES ('Default Conversation');`;

      connection.query(sql, function (error, results) {
        if (error) {
          console.error(error.stack);
          return res
            .status(500)
            .json({ message: "Server error, Couldn't create conversation" });
        }

        // Set conversation ID
        conversationId = results.insertId;

        // Insert 1st member of conversation
        sql = `INSERT INTO CONVERSATION_MEMBERS(ConversationID, Email) 
VALUES (${connection.escape(conversationId)}, ${connection.escape(
          senderEmail
        )});`;
        connection.query(sql, function (error, results) {
          if (error) {
            console.error(error.stack);
            return res
              .status(500)
              .json({ message: "Server error, Couldn't add sender" });
          }
        });

        // Insert 2nd member of conversation
        sql = `INSERT INTO CONVERSATION_MEMBERS(ConversationID, Email) 
VALUES (${connection.escape(conversationId)}, ${connection.escape(
          receiverEmail
        )});`;
        connection.query(sql, function (error, results) {
          if (error) {
            console.error(error.stack);
            return res
              .status(500)
              .json({ message: "Server error, Couldn't add receiver" });
          }

          return res
            .status(200)
            .json({ message: "Conversation created successfully" });
        });
      });
    }
  });
};

// Gets conversations for a user
const getConversations = (req, res, next) => {
  // Get user email
  const userEmail = req.query.userEmail;

  // Get conversations
  let sql = `SELECT c.ConversationID, GROUP_CONCAT(cm.Email) AS members
            FROM CONVERSATION AS c
            LEFT JOIN CONVERSATION_MEMBERS AS cm ON c.ConversationID = cm.ConversationID
            WHERE c.ConversationID IN (
                                  SELECT ConversationID
                                  FROM CONVERSATION_MEMBERS
                                  WHERE Email = ${connection.escape(userEmail)}
                                )
            GROUP BY c.ConversationID;`;

  connection.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: "Server error, try again" });
    }

    // Format results properly
    let conversations = [];
    for (let i = 0; i < results.length; i++) {
      let conversation = {
        conversationId: results[i].ConversationID,
        members: results[i].members.split(","),
      };
      conversation.members.forEach((email) => {
        if (email !== userEmail) {
          conversation.title = email.split("@")[0];
        }
      });

      conversations.push(conversation);
    }

    return res.status(200).json({ data: conversations });
  });
};

// Sends a message
const sendMessage = (req, res, next) => {
  const message = req.body.message;
  const conversationId = Number(req.body.conversationId);
  const senderEmail = req.body.senderEmail;

  const sql = `INSERT INTO MESSAGE(Content, ConversationID, Sender)
              VALUES (${connection.escape(message)}, ${connection.escape(
    conversationId
  )}, ${connection.escape(senderEmail)});`;

  connection.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: "Server error, try again" });
    }

    return res.status(200).json({ message: "Message sent successfully" });
  });
};

// Gets messages for a conversation
const getMessages = (req, res, next) => {
  const conversationId = Number(req.query.conversationId);

  const sql = `SELECT * FROM MESSAGE WHERE ConversationID = ${connection.escape(
    conversationId
  )};`;

  connection.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: "Server error, try again" });
    }

    return res.status(200).json({ data: results });
  });
};

// Gets the last message in a conversation
const getLastMessage = (req, res, next) => {
  const conversationId = Number(req.query.conversationId);

  const sql = `SELECT * FROM MESSAGE
              WHERE ConversationID = ${connection.escape(conversationId)}
              ORDER BY MessageID DESC
              LIMIT 1;
              `;

  connection.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: "Server error, try again" });
    }

    return res.status(200).json({ data: results });
  });
};

const getUserInfo = (req, res, next) => {
  const userEmail = req.query.userEmail;
  const sql = `SELECT U.Email, U.FirstName, U.LastName, U.SchoolID, U.Role 
              FROM USER AS U WHERE Email=${connection.escape(userEmail)}`;

  connection.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: "Server error, try again" });
    }

    return res.status(200).json({ data: results });
  });
};

// Check if one user friended another, requires both ways to be friends
const checkIfFriended = (req, res, next) => {
  const frienderEmail = req.query.frienderEmail;
  const friendeeEmail = req.query.friendeeEmail;
  const sql = `SELECT * FROM FRIENDS WHERE Friendee=
              ${connection.escape(friendeeEmail)} AND 
              Friender=${connection.escape(frienderEmail)}`;

  connection.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: "Server error, try again" });
    }

    return res.status(200).json({ data: results });
  });
};

// Friends a user, requires both to friend each other to be friends
const friendUser = (req, res, next) => {
  const frienderEmail = req.body.frienderEmail;
  const friendeeEmail = req.body.friendeeEmail;

  const sql = `INSERT INTO FRIENDS (Friendee, Friender) VALUES 
              (${connection.escape(friendeeEmail)}, 
              ${connection.escape(frienderEmail)});`;

  connection.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: "Server error, try again" });
    }
    return res.status(201).json({ message: "User friended successfully" });
  });
};

const unfriendUser = (req, res, next) => {
  const frienderEmail = req.query.frienderEmail;
  const friendeeEmail = req.query.friendeeEmail;

  const sql = `DELETE FROM FRIENDS WHERE Friendee = 
              ${connection.escape(friendeeEmail)} AND Friender = 
              ${connection.escape(frienderEmail)};`;

  connection.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: "Server error, try again" });
    }
    return res.status(201).json({ message: "User unfriended successfully" });
  });
};

const getFriendsList = (req, res, next) => {
  const userEmail = req.query.userEmail;
  const sql = `SELECT U.Email, U.FirstName, U.LastName, U.SchoolID, U.Role
              FROM USER AS U JOIN 
                (SELECT Friendee AS FriendEmail FROM FRIENDS
                WHERE Friender = ${connection.escape(userEmail)}
                INTERSECT SELECT Friender AS FriendEmail FROM FRIENDS
                WHERE Friendee = ${connection.escape(userEmail)}
                ) AS FriendsTable ON FriendsTable.FriendEmail = U.Email;`;

  connection.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: "Server error, try again" });
    }

    return res.status(200).json({ data: results });
  });
};

const getCategories = (req, res, next) => {
  const sql = 'SELECT * FROM CATEGORY';
  connection.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: "Server error, try again" });
    }

    return res.status(200).json({ data: results });
  });
};

export {
  approvePost,
  deletePost,
  deleteUser,
  approveUser,
  connectDB,
  disconnectDB,
  getApprovedUsers,
  getPendingUsers,
  getPendingPosts,
  verifyUserLogin,
  registerNewUser,
  getUserPosts,
  getPostComments,
  getPostLikes,
  likePost,
  createNewUser,
  createNewPost,
  getAllApprovedPosts,
  createNewCommunity,
  getAllCommunities,
  joinCommunity,
  leaveCommunity,
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
};
