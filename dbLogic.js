import pool from "./database.js";
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
  const client = await pool.connect();

  try {
    const sql = 'SELECT * FROM USERS WHERE email = $1';
    const results = await client.query(sql, [req.body.username]);

    if (results.rows.length > 0) {
      const user = results.rows[0];
      const match = true; // Replace this with actual password comparison logic
      // const match = await bcrypt.compare(req.body.password, user.Password);

      if (!match) {
        return res.status(400).json({ message: "Incorrect password" });
      }

      const token = generateToken(req.body.username);
      return res.status(200).json({
        message: "User logged in successfully",
        user: {
          Email: user.email,
          FirstName: user.firstname,
          LastName: user.lastname,
          SchoolID: user.schoolid,
          Role: user.role,
        },
        token: token,
      });
    } else {
      return res.status(400).json({ message: "User doesn't exist" });
    }
  } catch (error) {
    console.error(error.stack);
    return res.status(500).json({ message: "Server error: " + error.stack });
  } finally {
    client.release();
  }
};

// Registers a new user onto the app
const registerNewUser = async (req, res, next) => {
  console.log(req.body);

  try {
    // Query to check if the user already exists
    const checkUserQuery = "SELECT * FROM USERS WHERE email = $1";
    const checkUserResult = await pool.query(checkUserQuery, [req.body.username]);

    // User already exists
    if (checkUserResult.rows.length > 0) {
      const user = checkUserResult.rows[0];
      return res.status(400).json({
        message: "This username is already taken",
        data: {
          Email: user.email,
          FirstName: user.firstname,
          LastName: user.lastname,
          SchoolID: user.schoolid,
          Role: user.role,
        },
      });
    }

    // Hash user's password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    // Generate JWT for the user
    const token = generateToken(req.body.username);

    // Insert new user into the database
    const insertUserQuery = 
      "INSERT INTO USERS (Email, FirstName, LastName, Password, SchoolID, Role) VALUES ($1, $2, $3, $4, $5, $6)";
    await pool.query(insertUserQuery, [
      req.body.username,
      req.body.firstName,
      req.body.lastName,
      hashedPassword,
      1, // Assuming 1 is a placeholder for SchoolID
      req.body.role
    ]);

    // Respond with success message and user data
    return res.status(200).json({
      Email: req.body.username,
      FirstName: req.body.firstName,
      LastName: req.body.lastName,
      SchoolID: 1,
      Role: req.body.role,
      token: token,
    });

  } catch (error) {
    console.error(error.stack);
    return res.status(500).json({ message: "Server error: " + error.stack });
  }
};

//Functions dealing with users

//Required fields in req.body: email, fname, lname, schoolId
const createNewUser = async (req, res, next) => {
  const sql = 
    "INSERT INTO USERS (Email, FirstName, LastName, SchoolID) VALUES ($1, $2, $3, $4)";

  try {
    // Execute the query with pool.query
    const results = await pool.query(sql, [
      req.body.email,    
      req.body.fname,    
      req.body.lname,    
      req.body.schoolId  
    ]);

    // Send a success response with the query results
    return res.status(200).json({ data: results });

  } catch (error) {
    console.error(error.stack);
    return res.status(500).json({ message: error.stack });
  }
};
const getSpecificUser = (req, res, next) => {
  //TODO- this will be the same as getApprovedUsers but add a WHERE for the email
};

const promoteUser = (req, res, next) => {
  //This function does not have an endpoint, at the time of writing, have not determined a system for making a user and Admin
  var sql =
    "UPDATE USERS SET Role =" +
    connection.escape("Admin") +
    " WHERE (USERS.Email= " +
    connection.escape(req.body.email) +
    ")";
  pool.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: error.stack });
    }
    return res.status(200).json({ message: "Success" });
  });
};

const approveUser = (req, res, next) => {
  var sql =
    "UPDATE USERS SET Role =" +
    connection.escape("Approved") +
    " WHERE (USERS.Email= " +
    connection.escape(req.body.email) +
    ")";
  pool.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: error.stack });
    }
    return res.status(200).json({ message: "Success" });
  });
};

const deleteUser = (req, res, next) => {
  var sql =
    "DELETE FROM USERS where USERS.Email=" + connection.escape(req.body.email);
  pool.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: error.stack });
    }
    return res.status(200).json({ message: "Success" });
  });
};

const getApprovedUsers = (req, res, next) => {
  console.log('getApprovedUsers hit');
  pool.query(
    "select * from USERS where (USERS.Role= " +
      connection.escape("Approved") +
      ") OR (USERS.Role=" +
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
  console.log('getPendingUsers hit');
  pool.query(
    "select * from USERS where USERS.Role= " + connection.escape("Guest"),
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
  pool.query(sql, function (error, results) {
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

  pool.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: error.stack });
    }
  });

  // Delete record from post table
  sql = "DELETE FROM POST where POST.PostID=" + connection.escape(req.body.id);
  pool.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: error.stack });
    }
    next();
  });
};

const getPendingPosts = (req, res, next) => {
  console.log('getPendingPosts hit');
  pool.query(
    "select * from POST where POST.Approved =0",
    function (error, results, fields) {
      if (error) {
        console.log('error here 2')
        console.error(error);
        return res.status(500).json({ message: error.stack });
      }

      return res.status(200).json({ data: results });
    }
  );
};

//Gets post based on a user
const getUserPosts = (req, res, next) => {
  console.log('getUserPosts hit');
  const sql =  "select * from POST where email=$1";
  pool.query(
    sql,[req.body.user],
    function (error, results) {
      if (error) {
        console.log('error here 3')
        console.error(error);
        return res.status(500).json({ message: error.stack });
      }
      return res.status(200).json({ data: results });
    }
  );
};

const getAllApprovedPosts = async (req, res, next) => {
  const client = await pool.connect();

  try {
    console.log('getAllApprovedPost hit');
    const sql = 'SELECT * FROM post';
    const results = await client.query('SELECT * FROM post');
    
    console.log('This runs');
    return res.status(200).json({ data: results });
  } catch (error) {
    console.log(error);
    console.log('Error fetching approved posts');
    return res.status(500).json({ message: "Server error, try again" });
  } finally {
    client.release();
  }
};


//Database functionality with likes and comments has not been implemented yet but these functions are how we imagine that would happen...
const getPostComments = (req, res, next) => {
  console.log('getPostComments hit');
  pool.query(
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
  pool.query(sql, function (error, results) {
    // Return error if any
    if (error) {
      return res.status(500).json({ message: "Server error, try again" });
    }

    return res.status(200).json({ message: "Successfully liked the post!" });
  });
};

// Gets the number of likes for a post
const getPostLikes = (req, res, next) => {
  console.log('getPostLikeshit');
  pool.query(
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
  pool.query(sql, function (error, results) {
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
  pool.query(sql, function (error, results) {
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
      pool.query(sql, function (error, results) {
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
  console.log('getAllCommunities hit');
  const sql = "SELECT * FROM COMMUNITY";

  // Run insert query
  pool.query(sql, function (error, results) {
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
  pool.query(sql, function (error, results) {
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
  pool.query(sql, function (error, results) {
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
  console.log('getUserCommunities hit');
  const email = req.query.email;
  const sql =
    "SELECT c.CommunityID, c.CommunityName FROM COMMUNITY c JOIN COMMUNITY_MEMBERS cm ON c.CommunityID = cm.CommunityID WHERE cm.Email = ?";

  pool.query(sql, [email], function (error, results) {
    if (error) {
      return res.status(500).json({ message: "Server error, try again" });
    }

    return res.status(200).json({ data: results });
  });
};

const getCommunityApprovedPosts = (req, res, next) => {
  console.log('getCommApprovedPosts hit');
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

  pool.query(sql, function (error, results, fields) {
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
  pool.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: "Server error, try again" });
    }
    return res.status(200).json({ data: results });
  });
};

// Searches for a user
const searchUser = async (req, res, next) => {
  const searchQuery = req.query.searchQuery;
  console.log(searchQuery);
  console.log('searchUser hit');

  if (searchQuery !== "") {
    const sql = `SELECT * FROM USERS 
                 WHERE FirstName LIKE $1 
                 OR LastName LIKE $1`;

    try {
      const client = await pool.connect();

      const result = await client.query(sql, [`%${searchQuery}%`]);

      console.log(result.rows);

      client.release();

      return res.status(200).json({ data: result.rows });
    } catch (error) {
      console.error("Error executing search query:", error.stack);
      return res.status(500).json({ message: "Server error, try again" });
    }
  } else {
    return res.status(400).json({ message: "Search query cannot be empty" });
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
  pool.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: error.stack });
    }
    return res.status(200).json({ data: results });
  });
};

const getComment = (req, res, next) => {
  console.log('getComment hit');
  var sql =
    "SELECT * FROM COMMENT WHERE Email =" +
    connection.escape(req.body.email) +
    " AND Content=" +
    connection.escape(req.body.content);
  pool.query(sql, function (error, results, fields) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: error.stack });
    }
    return res.status(200).json({ data: results });
  });
};

const getCommentByCommentID = (req, res, next) => {
  console.log('getCommentbyCommentID hit');
  var sql =
    "SELECT * FROM COMMENT WHERE CommentId =" +
    connection.escape(req.body.commentId);
  pool.query(sql, function (error, results, fields) {
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
  pool.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: error.stack });
    }
    return res.status(200).json({ data: results });
  });
};

const getCommentsByPostID = async (req, res, next) => {
  console.log('getCommentsByPostID hit');
  const postId = Number(req.query.postId);

  const sql = 'SELECT * FROM COMMENTS_TO_POST WHERE PostID = $1';

  const client = await pool.connect();

  try {
    const results = await client.query(sql, [postId]);
    return res.status(200).json({ data: results.rows });
  } catch (error) {
    console.error(error.stack);
    return res.status(500).json({ message: error.stack });
  } finally {
    client.release();
  }
};

const updateComment = (req, res, next) => {
  var sql =
    "UPDATE COMMENT SET Content=" +
    connection.escape(req.body.content) +
    " WHERE CommentID=" +
    connection.escape(req.body.commentId);
  pool.query(sql, function (error, results) {
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
  pool.query(sql, function (error, results) {
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

  pool.query(sql, function (error, results) {
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

      pool.query(sql, function (error, results) {
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
        pool.query(sql, function (error, results) {
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
        pool.query(sql, function (error, results) {
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
const getConversations = async (req, res, next) => {
  console.log('getConversations hit');
  const userEmail = req.query.userEmail;

  const sql = `
    SELECT c.ConversationID, GROUP_CONCAT(cm.Email) AS members
    FROM CONVERSATION AS c
    LEFT JOIN CONVERSATION_MEMBERS AS cm ON c.ConversationID = cm.ConversationID
    WHERE c.ConversationID IN (
      SELECT ConversationID
      FROM CONVERSATION_MEMBERS
      WHERE Email = $1
    )
    GROUP BY c.ConversationID;
  `;

  const client = await pool.connect();

  try {
    const results = await client.query(sql, [userEmail]);

    let conversations = results.rows.map(row => {
      let members = row.members.split(",");
      let title = members.find(email => email !== userEmail)?.split("@")[0];

      return {
        conversationId: row.ConversationID,
        members,
        title
      };
    });

    return res.status(200).json({ data: conversations });
  } catch (error) {
    console.error(error.stack);
    return res.status(500).json({ message: "Server error, try again" });
  } finally {
    client.release();
  }
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

  pool.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: "Server error, try again" });
    }

    return res.status(200).json({ message: "Message sent successfully" });
  });
};

// Gets messages for a conversation
const getMessages = (req, res, next) => {
  console.log('getMessages hit');
  const conversationId = Number(req.query.conversationId);

  const sql = `SELECT * FROM MESSAGE WHERE ConversationID = ${connection.escape(
    conversationId
  )};`;

  pool.query(sql, function (error, results) {
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

  pool.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: "Server error, try again" });
    }

    return res.status(200).json({ data: results });
  });
};

const getUserInfo = async (req, res, next) => {
  console.log('getUserInfo hit');
  const userEmail = req.query.userEmail;

  const sql = `SELECT U.email, U.firstname, U.lastname, U.schoolid, U.role 
               FROM USERS AS U WHERE U.email = $1`;

  try {
    const client = await pool.connect();

    const result = await client.query(sql, [userEmail]);

    client.release();

    return res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error("Error executing user info query:", error.stack);
    return res.status(500).json({ message: "Server error, try again" });
  }
};

// Check if one user friended another, requires both ways to be friends
const checkIfFriended = async (req, res, next) => {
  console.log('check if friended hit');
  const frienderEmail = req.query.frienderEmail;
  const friendeeEmail = req.query.friendeeEmail;

  const sql = `SELECT * FROM FRIENDS WHERE Friendee = $1 AND Friender = $2`;

  try {
    const client = await pool.connect();

    const result = await client.query(sql, [friendeeEmail, frienderEmail]);

    client.release();

    return res.status(200).json({ data: result.rows });
  } catch (error) {
    console.error("Error executing checkIfFriended query:", error.stack);
    return res.status(500).json({ message: "Server error, try again" });
  }
};

// Friends a user, requires both to friend each other to be friends
const friendUser = async (req, res, next) => {
  console.log('friend user hit');
  const frienderEmail = req.body.frienderEmail;
  const friendeeEmail = req.body.friendeeEmail;

  const sql = `INSERT INTO FRIENDS (Friendee, Friender) VALUES ($1, $2)`;

  try {
    const client = await pool.connect();

    await client.query(sql, [friendeeEmail, frienderEmail]);

    client.release();

    return res.status(201).json({ message: "User friended successfully" });
  } catch (error) {
    console.error("Error executing friendUser query:", error.stack);
    return res.status(500).json({ message: "Server error, try again" });
  }
};

const unfriendUser = (req, res, next) => {
  const frienderEmail = req.query.frienderEmail;
  const friendeeEmail = req.query.friendeeEmail;

  const sql = `DELETE FROM FRIENDS WHERE Friendee = 
              ${connection.escape(friendeeEmail)} AND Friender = 
              ${connection.escape(frienderEmail)};`;

  pool.query(sql, function (error, results) {
    if (error) {
      console.error(error.stack);
      return res.status(500).json({ message: "Server error, try again" });
    }
    return res.status(201).json({ message: "User unfriended successfully" });
  });
};

const getFriendsList = async (req, res, next) => {
  console.log('getFriends hit');
  const userEmail = req.query.userEmail;

  const sql = `SELECT U.Email, U.FirstName, U.LastName, U.SchoolID, U.Role
               FROM USERS AS U JOIN 
                  (SELECT Friendee AS FriendEmail FROM FRIENDS
                   WHERE Friender = $1
                   INTERSECT 
                   SELECT Friender AS FriendEmail FROM FRIENDS
                   WHERE Friendee = $1) AS FriendsTable
               ON FriendsTable.FriendEmail = U.Email;`;

  try {
      const client = await pool.connect();

      const result = await client.query(sql, [userEmail]);

      client.release();

      return res.status(200).json({ data: result.rows });
  } catch (error) {
      console.error("Error retrieving friends list:", error.stack);
      return res.status(500).json({ message: "Server error, try again" });
  }
};

const getCategories = async (req, res, next) => {
  const client = await pool.connect();

  try {
    const sql = 'SELECT * FROM category';
    const results = await client.query(sql);

    return res.status(200).json({ data: results.rows });
  } catch (error) {
    console.log('Error fetching categories');
    console.error(error);
    return res.status(500).json({ message: "Server error, try again" });
  } finally {
    client.release();
  }
};

const getTest = (req, res, next) => {
  const sql = 'SELECT * FROM USERS';
  pool.query(sql, function (error, results) {
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
  getCategories,
  getTest
};
