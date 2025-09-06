import express from "express";
import upload from "../middlewares/multer.js";
import { auth } from "../middlewares/authMiddleware.js";
import * as documentController from "../controllers/document.controller.js";

const router = express.Router();

router.post("/upload", auth(["entrepreneur"]), 
    upload.single("file"), 
    documentController.uploadDocument
);

router.get("/", auth(["entrepreneur", "investor"]), 
    documentController.getDocuments
);

// router.get("/download/:id", auth(["entrepreneur", "investor"]), 
//     documentController.downloadDocument);

router.delete("/:id", auth(["entrepreneur"]), 
    documentController.deleteDocument
);


// Add signature
router.post("/:id/signature", auth(["entrepreneur"]), 
upload.single("signature"), documentController.addSignature);


router.get("/file/:id", documentController.documentPreview)

router.get("/download/:id", documentController.downloadDocument);

router.get("/storage", auth(["entrepreneur"]), documentController.entrepreneurStorage )

export default router;
