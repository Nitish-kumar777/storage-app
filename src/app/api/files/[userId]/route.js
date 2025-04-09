import { NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import File from '@/models/File'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
})

export async function GET(request, { params }) {
  try {
    await dbConnect()
    const userId = params.userId

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get files from MongoDB
    const mongoFiles = await File.find({ userId }).sort({ uploadedAt: -1 })

    // Get files from Cloudinary
    let cloudinaryFiles = []
    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: `user_uploads/${userId}`,
        max_results: 500
      })
      cloudinaryFiles = result.resources
    } catch (cloudinaryError) {
      console.error('Cloudinary error:', cloudinaryError)
    }

    // Calculate total storage used
    const totalUsed = [
      ...mongoFiles.map(file => file.fileSize || 0),
      ...cloudinaryFiles.map(file => file.bytes || 0)
    ].reduce((sum, size) => sum + size, 0)

    // 1GB storage limit
    const storageLimit = 1 * 1024 * 1024 * 1024

    return NextResponse.json({
      success: true,
      storageInfo: {
        used: totalUsed,
        limit: storageLimit
      },
      files: [
        ...mongoFiles.map(f => ({
          fileId: f._id.toString(),
          fileName: f.name,
          fileSize: f.fileSize,
          fileType: 'mongo',
          fileUrl: f.url,
          uploadedAt: f.uploadedAt
        })),
        ...cloudinaryFiles.map(f => ({
          fileId: f.public_id,
          fileName: f.public_id.split('/').pop(),
          fileSize: f.bytes,
          fileType: 'cloudinary',
          fileUrl: f.secure_url,
          uploadedAt: f.created_at
        }))
      ]
    })

  } catch (error) {
    console.error('Error fetching files:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request, { params }) {
  try {
    await dbConnect()
    const userId = params.userId
    const { fileId, fileType } = await request.json()

    if (!userId || !fileId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (fileType === 'cloudinary') {
      await cloudinary.uploader.destroy(fileId)
    } else {
      await File.findOneAndDelete({ _id: fileId, userId })
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}