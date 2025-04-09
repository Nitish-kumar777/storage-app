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

    // Get files from MongoDB with fileSize
    const mongoFiles = await File.find({ userId }).sort({ uploadedAt: -1 })

    // Get files from Cloudinary
    let cloudinaryFiles = []
    try {
      const result = await cloudinary.api.resources({
        type: 'upload',
        prefix: `user_uploads/${userId}`,
        max_results: 100
      })
      cloudinaryFiles = result.resources
    } catch (cloudinaryError) {
      console.error('Cloudinary error:', cloudinaryError)
    }

    // Calculate total storage used (combining MongoDB and Cloudinary)
    const totalUsed = [
      ...mongoFiles.map(file => file.fileSize || 0),
      ...cloudinaryFiles.map(file => file.bytes || 0)
    ].reduce((sum, size) => sum + size, 0)

    // Set storage limit (1GB in bytes)
    const storageLimit = 1 * 1024 * 1024 * 1024

    return NextResponse.json({
      success: true,
      files: [...mongoFiles, ...cloudinaryFiles],
      storageInfo: {
        used: totalUsed,
        limit: storageLimit
      }
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

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Parse the request body
    const { fileId, fileType } = await request.json()

    if (!fileId || !fileType) {
      return NextResponse.json(
        { success: false, error: 'fileId and fileType are required' },
        { status: 400 }
      )
    }

    let result
    if (fileType === 'cloudinary') {
      // Delete from Cloudinary
      result = await cloudinary.uploader.destroy(fileId)
      if (result.result !== 'ok') {
        throw new Error('Cloudinary deletion failed')
      }
    } else {
      // Delete from MongoDB
      result = await File.findOneAndDelete({
        _id: fileId,
        userId: userId
      })
      
      if (!result) {
        throw new Error('File not found or not owned by user')
      }
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Server error during deletion' 
      },
      { status: 500 }
    )
  }
}