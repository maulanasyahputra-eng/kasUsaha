const express = require("express");

const router = express.Router();


/* =========================================
   CONTROLLER
========================================= */

const {
    searchUsers,
    getMyProfile,
    updateProfile,
    getUserProfile
} = require("../controllers/userController");


/* =========================================
   AUTH MIDDLEWARE
========================================= */

const authMiddleware =
    require("../middleware/authMiddleware");


/* =========================================
   SEARCH USERS

   GET
   /api/users/search?keyword=628123456789

   Bisa mencari:
   - nomor telepon
   - username
   - nama
========================================= */

router.get(
    "/search",
    authMiddleware,
    searchUsers
);


/* =========================================
   MY PROFILE

   GET
   /api/users/me
========================================= */

router.get(
    "/me",
    authMiddleware,
    getMyProfile
);


/* =========================================
   UPDATE PROFILE

   PUT
   /api/users/profile

   Body contoh:

   {
       "username": "maulana123",
       "full_name": "Maulana Syahputra",
       "bio": "Halo, saya Maulana"
   }
========================================= */

router.put(
    "/profile",
    authMiddleware,
    updateProfile
);


/* =========================================
   USER PROFILE

   GET
   /api/users/:id

   Untuk melihat profil
   pengguna lain.
========================================= */

router.get(
    "/:id",
    authMiddleware,
    getUserProfile
);


/* =========================================
   EXPORT
========================================= */

module.exports = router;