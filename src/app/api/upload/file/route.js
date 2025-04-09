import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import File from '@/models/File';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true // Always use HTTPS
});

// Supported file types and max sizes
const SUPPORTED_TYPES = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/quicktime', 'video/x-msvideo',
    'audio/mpeg', 'audio/wav', 'audio/mp3',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'application/zip'
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(req) {
    try {
        await dbConnect();
        
        // 1. Validate request
        const formData = await req.formData();
        const file = formData.get('file');
        const userId = formData.get('userId');

        if (!file || !userId) {
            return NextResponse.json(
                { error: 'File and userId are required' },
                { status: 400 }
            );
        }

        // 2. Validate file type
        if (!SUPPORTED_TYPES.includes(file.type)) {
            return NextResponse.json(
                { error: 'Unsupported file type' },
                { status: 400 }
            );
        }

        // 3. Validate file size
        const fileBuffer = await file.arrayBuffer();
        if (fileBuffer.byteLength > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File size exceeds ${MAX_FILE_SIZE/1024/1024}MB limit` },
                { status: 400 }
            );
        }

        // 4. Check user storage (1GB limit)
        const userFiles = await File.find({ userId });
        const totalStorageUsed = userFiles.reduce((sum, f) => sum + f.fileSize, 0);
        
        if (totalStorageUsed + fileBuffer.byteLength > 1073741824) {
            return NextResponse.json(
                { 
                    error: 'Storage limit reached (1GB)',
                    used: totalStorageUsed,
                    limit: 1073741824
                },
                { status: 403 }
            );
        }

        // 5. Upload to Cloudinary with resource type detection
        const base64String = `data:${file.type};base64,${Buffer.from(fileBuffer).toString('base64')}`;
        
        let uploadOptions = {
            folder: `user_uploads/${userId}`,
            use_filename: true,
            unique_filename: false,
            overwrite: false,
            resource_type: 'auto' // Auto-detect image/video/raw
        };

        // Special handling for different file types
        if (file.type.startsWith('video/')) {
            uploadOptions.resource_type = 'video';
            uploadOptions.chunk_size = 6000000; // 6MB chunks for large videos
        } else if (file.type.startsWith('audio/')) {
            uploadOptions.resource_type = 'video'; // Cloudinary treats audio as video
        }

        const result = await cloudinary.uploader.upload(base64String, uploadOptions);

        // 6. Save to database with additional metadata
        const fileDoc = await File.create({
            userId,
            fileName: file.name,
            fileType: file.type,
            fileSize: result.bytes,
            fileUrl: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            width: result.width || null,
            height: result.height || null,
            duration: result.duration || null,
            uploadedAt: new Date()
        });

        // 7. Return response with additional metadata
        return NextResponse.json({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            fileName: fileDoc.fileName,
            fileSize: fileDoc.fileSize,
            fileType: fileDoc.fileType,
            metadata: {
                width: fileDoc.width,
                height: fileDoc.height,
                duration: fileDoc.duration,
                format: fileDoc.format
            }
        });

    } catch (error) {
        console.error('Upload error:', error);
        
        // Handle Cloudinary-specific errors
        if (error.message.includes('File size too large')) {
            return NextResponse.json(
                { error: 'File exceeds Cloudinary size limits' },
                { status: 400 }
            );
        }

        return NextResponse.json(
            { 
                error: 'Internal server error',
                details: process.env.NODE_ENV === 'development' ? error.message : null
            },
            { status: 500 }
        );
    }
}