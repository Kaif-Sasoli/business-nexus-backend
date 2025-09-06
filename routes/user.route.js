import { Router } from 'express'
import * as userController from '../controllers/user.controller.js'
import { auth } from '../middlewares/authMiddleware.js'
import { body } from 'express-validator'
import upload from '../middlewares/clouldinaryUpload.js';
import multer from "multer";


const router = Router();

router.patch('/update', auth(['entrepreneur', 'investor']), 
    (req, res, next) => {
        upload.single("avatar")(req, res, function (err) {
          if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({ error: "File too large. Max size is 800KB." });
          } else if (err) {
            return res.status(400).json({ error: err.message });
          }
          next();
        });
      },
    [
      // Full Name
      body("name")
        .trim()
        .escape()
        .notEmpty().withMessage("Name is required")
        .isLength({ min: 4 }).withMessage("Name must be at least 4 characters"),
  
      // Location
      body("location")
        .optional()
        .trim()
        .escape(),
  
      // Bio
      body("bio")
        .optional()
        .trim()
        .escape(),
  ],
    userController.updateUserProfile
);

router.get("/:id",  userController.getUserById);

export default router;
