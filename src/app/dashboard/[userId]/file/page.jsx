'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function RecentFiles({ userId }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await fetch(`/api/user/${userId}/files`)
        const data = await res.json()

        if (data.success) {
          setFiles(data.files.slice(0, 8)) // only recent 8 files
        }
      } catch (error) {
        console.error('Failed to fetch files:', error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) fetchFiles()
  }, [userId])

  const handleDelete = async (fileId, fileType) => {
    if (!fileId || !fileType) {
      console.error('Missing fileId or fileType', { fileId, fileType })
      alert('Failed to delete: missing file information')
      return
    }

    const confirm = window.confirm('Are you sure you want to delete this file?')
    if (!confirm) return

    try {
      // Map common file formats to their MIME types for Cloudinary check
      const formatToMime = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        mp4: 'video/mp4',
        mov: 'video/quicktime',
        avi: 'video/x-msvideo',
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ppt: 'application/vnd.ms-powerpoint',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        txt: 'text/plain',
        zip: 'application/zip'
      }

      // Normalize the file type (convert format to MIME type if needed)
      const normalizedType = formatToMime[fileType.toLowerCase()] || fileType

      const isCloudinaryFile = [
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
      ].includes(normalizedType)

      const res = await fetch(`/api/user/${userId}/files`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fileId,
          fileType: isCloudinaryFile ? 'cloudinary' : 'mongo'
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Failed to delete file')
      }

      const data = await res.json()
      if (data.success) {
        setFiles(prev => prev.filter(file =>
          (file.fileId !== fileId) && (file.public_id !== fileId)
        ))
      }
    } catch (err) {
      console.error('Error deleting file:', err)
      alert(err.message)
    }
  }

  if (loading) return <p>Loading recent files...</p>

  if (files.length === 0) {
    return <div className="text-gray-500 italic">No recent files. Upload some files to get started!</div>
  }

  return (
    <ul className="space-y-4">
      {files.map((file, idx) => (
        <li key={idx} className="border border-gray-200 rounded p-3">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-black">{file.fileName || file.public_id}</p>
              <p className="text-sm text-gray-500">
                {(file.fileSize ? (file.fileSize / 1024).toFixed(1) : (file.bytes / 1024).toFixed(1))} KB •
                {file.fileType || file.format}
              </p>
            </div>
            <div className="flex gap-4">
              <Link
                href={file.fileUrl || file.secure_url}
                target="_blank"
                className="text-blue-600 text-sm hover:underline"
                rel="noopener noreferrer"
              >
                Open
              </Link>
              <button
                onClick={() => handleDelete(file.fileId || file.public_id, file.fileType || file.format)}
                className="text-red-500 text-sm hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}