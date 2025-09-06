import express from 'express'
import *  as authController from '../controllers/auth.controller.js'
import * as emailController from '../controllers/email.controller.js'
import { body, validationResult } from 'express-validator'
import { auth } from '../middlewares/authMiddleware.js'

const router = express.Router();

router.post('/register', 
  // Validation
     [
    // Full Name
    body("name")
      .trim()
      .escape() 
      .notEmpty().withMessage("Name is required")
      .isLength({ min: 4 }).withMessage("Name must be at least 4 characters"),

    // Email
    body("email")
      .normalizeEmail()
      .isEmail().withMessage("Please provide a valid email address"),

    // Password
    body("password")
      .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
      .matches(/\d/).withMessage("Password must contain a number")
      .trim().escape(),

    // Role
    body("role")
      .isIn(["investor", "entrepreneur"]).withMessage("Role must be investor or entrepreneur")
  ],
    authController.register);

router.post('/verify-email', 
    emailController.verifyEmail
);

router.post('/signin', 
   // Validation
   [
      // Email
    body("email")
      .normalizeEmail()
      .isEmail().withMessage("Please provide a valid email address"),
    
    // Password
    body("password")
      .isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
      .matches(/\d/).withMessage("Password must contain a number")
      .trim().escape(),

   ],
   authController.signIn
);

// Resend Email
router.post('/resend-mail',
    // Validation  
    [
    // Email
    body("email")
      .normalizeEmail()
      .isEmail().withMessage("Please provide a valid email address")
    ],
     emailController.resendEmail
);

router.post('/logout', auth(["entrepreneur", "investor"]), authController.logout);

export default router;