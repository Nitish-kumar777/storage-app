import { NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import File from '@/models/File'
import cloudinary from '@/lib/cloudinary'

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

    // Get only MongoDB files
    const files = await File.find({ userId }).sort({ uploadedAt: -1 })

    // Calculate storage used
    const totalUsed = files.reduce((sum, file) => sum + (file.fileSize || 0), 0)
    const storageLimit = 1 * 1024 * 1024 * 1024 // 1GB

    return NextResponse.json({
      success: true,
      files,
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

    const { fileId, cloudinaryPublicId } = await request.json()

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'fileId is required' },
        { status: 400 }
      )
    }

    // Delete from MongoDB
    const mongoResult = await File.findOneAndDelete({
      _id: fileId,
      userId: userId
    })

    // Delete from Cloudinary if public_id exists
    if (cloudinaryPublicId) {
      await cloudinary.uploader.destroy(cloudinaryPublicId)
    }

    return NextResponse.json({
      success: true,
      message: 'File deleted from both MongoDB and Cloudinary'
    })

  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}