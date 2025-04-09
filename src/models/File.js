import mongoose from 'mongoose';

const FileSchema = new mongoose.Schema({
    userId: { type: String, required: true }, // Firebase Auth user ID
    fileName: String,
    fileSize: Number, // Store size in bytes
    fileUrl: String,
    uploadedAt: { type: Date, default: Date.now }
});

export default mongoose.models.File || mongoose.model('File', FileSchema);
