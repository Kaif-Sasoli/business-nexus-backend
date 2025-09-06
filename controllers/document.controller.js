import documentModel from "../models/document.model.js";
import entrepreneurModel from "../models/entrepreneurProfile.model.js";
import fs from "fs";
import path from "path";

// Upload Document 
export const uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const  uploadedBy  = req.user.id;

    // Find entrepreneur profile
    const entrepreneur = await entrepreneurModel.findOne({ userId: uploadedBy });
    if (!entrepreneur) {
      return res.status(404).json({ message: "Entrepreneur profile not found" });
    }

    // Current startup storage usage
    const currentUsage = entrepreneur.startups.storageUsed || 0;
    const storageLimit = entrepreneur.startups.storageLimit || 1024 * 1024 * 1024; // 1GB default

    // Check storage limit
    if (currentUsage + req.file.size > storageLimit) {
      // Delete file immediately to avoid orphaned uploads
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "Storage limit (1GB) exceeded" });
    }

    // Save document
    const doc = await documentModel.create({
      name: req.body.name || req.file.originalname, 
      type: req.file.mimetype,
      size: req.file.size,
      path: `/uploads/${req.file.filename}`,
      uploadedBy,
    });

    // Update storage usage
    entrepreneur.startups.storageUsed = currentUsage + req.file.size;
    await entrepreneur.save();

    res.status(201).json({ message: "File uploaded successfully", doc });
  } catch (error) {
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};

//  Get All Documents 
export const getDocuments = async (req, res) => {
  try {
    const docs = await documentModel
      .find()
      .populate("uploadedBy", "name email role");
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching documents", error: error.message });
  }
};

//  Delete Document
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await documentModel.findById(id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    const entrepreneur = await entrepreneurModel.findOne({ userId: doc.uploadedBy });
    if (!entrepreneur) {
      return res.status(404).json({ message: "Entrepreneur profile not found" });
    }

    // Update storage usage
    entrepreneur.startups.storageUsed = Math.max(
      0,
      entrepreneur.startups.storageUsed - doc.size
    );
    await entrepreneur.save();

    // Remove main file
    if (doc.path) {
      const filePath = path.resolve(`./public${doc.path}`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Remove signature file if exists
    if (doc.signature) {
      const signaturePath = path.resolve(`./public${doc.signature}`);
      if (fs.existsSync(signaturePath)) {
        fs.unlinkSync(signaturePath);
      }
    }

    // Delete DB record
    await doc.deleteOne();
    res.json({ message: "Document deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed", error: error.message });
  }
};

// Add E-signature
export const addSignature = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await documentModel.findById(id);
    if (!doc) return res.status(404).json({ message: "Document not found" });

    if (!req.file) {
      return res.status(400).json({ message: "No signature uploaded" });
    }

    // Replace old signature if exists
    if (doc.signature) {
      const oldPath = path.resolve(`.${doc.signature}`);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    doc.signature = `/uploads/${req.file.filename}`;
    await doc.save();

    res.json({ message: "Signature added successfully", doc });
  } catch (error) {
    res.status(500).json({ message: "Signature upload failed", error: error.message });
  }
};


export const documentPreview = async (req, res) => {
    try {
    const { id } = req.params;
    const doc = await documentModel.findById(id);
    if (!doc) return res.status(404).send("File not found");


    const filePath = path.resolve(`./public${doc.path}`); // path like "/uploads/xyz.pdf"
    if (!fs.existsSync(filePath)) return res.status(404).send("File not found on disk");


    res.setHeader("Content-Type", doc.type || "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=3600");
    return res.sendFile(filePath);
    } catch (err) {
    console.error(err);
    res.status(500).send("Error retrieving file");
    }
};

// Download Document
export const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await documentModel.findById(id);
    if (!doc) return res.status(404).send("File not found");

    const filePath = path.resolve(`./public${doc.path}`);
    if (!fs.existsSync(filePath)) return res.status(404).send("File not found on disk");

    res.setHeader("Content-Type", doc.type || "application/octet-stream");
    res.setHeader("Content-Disposition", `attachment; filename="${doc.name}"`);
    return res.sendFile(filePath);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error downloading file");
  }
};

export const entrepreneurStorage = async (req, res) => {
  try {
    // const { entrepreneurId } = req.params;
    const entrepreneurId = req.user.id


    // find entrepreneur profile by userId or _id
    const entrepreneur = await entrepreneurModel.findOne({
      userId: entrepreneurId, 
    }).lean();

    if (!entrepreneur) {
      return res.status(404).json({ message: "Entrepreneur profile not found" });
    }

    // get startup object (since startups is not an array in your schema)
    const startup = entrepreneur.startups;
    if (!startup) {
      return res.status(404).json({ message: "No startup found for entrepreneur" });
    }

    const storageUsed = startup.storageUsed || 0;
    const storageLimit = startup.storageLimit || 1024 * 1024 * 1024; // default 1GB
    const available = Math.max(0, storageLimit - storageUsed);

    return res.json({
      entrepreneurId: entrepreneur.userId,
      used: storageUsed,
      available,
      limit: storageLimit,
    });
  } catch (error) {
    console.error("Error fetching storage:", error);
    res.status(500).json({ message: "Server error" });
  }
};