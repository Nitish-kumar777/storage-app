import { NextResponse } from 'next/server'
import dbConnect from '@/lib/dbConnect'
import File from '@/models/File'
import cloudinary from '@/lib/cloudinary'

export async function POST(request, { params }) {
  try {
    await dbConnect()
    const { fileId, cloudinaryPublicId } = await request.json()

    // Validate request
    if (!fileId) {
      return new NextResponse(
        JSON.stringify({ error: 'File ID is required' }),
        { status: 400 }
      )
    }

    // Verify file exists and belongs to user
    const file = await File.findOne({ _id: fileId, userId: params.userId })
    if (!file) {
      return new NextResponse(
        JSON.stringify({ error: 'File not found' }),
        { status: 404 }
      )
    }

    // Handle Cloudinary files
    if (cloudinaryPublicId) {
      // Generate signed download URL
      const url = cloudinary.url(cloudinaryPublicId, {
        flags: 'attachment',
        resource_type: 'auto',
        sign_url: true,
        expires_at: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
      })
      
      return NextResponse.json({ downloadUrl: url })
    }

    // Handle direct file URLs
    if (file.fileUrl) {
      return NextResponse.json({ downloadUrl: file.fileUrl })
    }

    // Handle binary data in MongoDB (advanced)
    if (file.fileData) {
      // Convert buffer to Uint8Array
      const uint8Array = new Uint8Array(file.fileData.buffer.data)
      
      return new NextResponse(uint8Array, {
        headers: {
          'Content-Type': file.fileType,
          'Content-Disposition': `attachment; filename="${file.fileName}"`,
          'Content-Length': file.fileSize.toString()
        }
      })
    }

    throw new Error('No downloadable content found')

  } catch (error) {
    console.error('Download error:', error)
    return new NextResponse(
      JSON.stringify({ error: error.message }),
      { status: 500 }
    )
  }
}