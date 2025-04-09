'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

export default function FolderUpload() {
  const [files, setFiles] = useState([])
  const [folderName, setFolderName] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const { userId } = useParams()
  const { user } = useAuth()

  // Verify user matches the URL userId
  if (user && user.uid !== userId) {
    router.push(`/dashboard/${user.uid}/upload/folder`)
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!files.length) {
      setError('Please select files')
      return
    }
    if (!folderName.trim()) {
      setError('Please enter a folder name')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const formData = new FormData()
      files.forEach(file => formData.append('files', file))
      formData.append('userId', userId)
      formData.append('folderName', folderName.trim())

      const response = await fetch('/api/upload/folder', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Upload failed')

      router.push(`/dashboard/${userId}/upload/success?count=${files.length}&folder=${encodeURIComponent(folderName)}&type=folder`)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Upload Folder</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Folder Name
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter folder name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Files
            </label>
            <input
              type="file"
              onChange={(e) => setFiles(Array.from(e.target.files))}
              multiple
              webkitdirectory="true"
              mozdirectory="true"
              directory="true"
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-green-50 file:text-green-700
                hover:file:bg-green-100"
              required
            />
            {files.length > 0 && (
              <p className="mt-2 text-sm text-gray-500">
                {files.length} files selected
              </p>
            )}
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <div className="flex justify-between items-center">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/${userId}`)}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className={`px-4 py-2 rounded-md text-sm font-medium text-white ${isUploading ? 'bg-green-400' : 'bg-green-600 hover:bg-green-700'}`}
            >
              {isUploading ? 'Uploading...' : 'Upload Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}