const express = require("express");

const router = express.Router();

const authMiddleware =
    require("../middleware/authMiddleware");

const {
    searchUsers,
    createPrivateConversation,
    getConversations,
    getMessages,
    sendMessage,
    deleteMessage
} = require("../controllers/chatController");


// =========================================
// SEARCH USERS
// GET /api/chat/users/search?q=keyword
// =========================================

router.get(
    "/users/search",
    authMiddleware,
    searchUsers
);


// =========================================
// GET MY CONVERSATIONS
// GET /api/chat/conversations
// =========================================

router.get(
    "/conversations",
    authMiddleware,
    getConversations
);


// =========================================
// CREATE PRIVATE CONVERSATION
// POST /api/chat/conversations
//
// Body:
// {
//     "user_id": 2
// }
// =========================================

router.post(
    "/conversations",
    authMiddleware,
    createPrivateConversation
);


// =========================================
// GET MESSAGES
// GET /api/chat/conversations/:id/messages
// =========================================

router.get(
    "/conversations/:id/messages",
    authMiddleware,
    getMessages
);


// =========================================
// SEND MESSAGE
// POST /api/chat/messages
//
// Body:
// {
//     "conversation_id": 1,
//     "message": "Halo",
//     "message_type": "text"
// }
// =========================================

router.post(
    "/messages",
    authMiddleware,
    sendMessage
);


// =========================================
// DELETE MESSAGE
// DELETE /api/chat/messages/:id
// =========================================

router.delete(
    "/messages/:id",
    authMiddleware,
    deleteMessage
);


module.exports = router;