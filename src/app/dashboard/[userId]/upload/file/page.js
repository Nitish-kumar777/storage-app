'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

// Supported file types with their icons
const FILE_TYPES = {
  'image/*': { icon: '🖼️', label: 'Image' },
  'video/*': { icon: '🎥', label: 'Video' },
  'audio/*': { icon: '🎵', label: 'Audio' },
  'application/pdf': { icon: '📄', label: 'PDF' },
  'application/msword': { icon: '📝', label: 'Word' },
  'application/vnd.ms-powerpoint': { icon: '📊', label: 'PowerPoint' },
  'application/vnd.ms-excel': { icon: '📈', label: 'Excel' },
  'text/plain': { icon: '📃', label: 'Text' },
  'application/zip': { icon: '🗄️', label: 'Zip' },
  'default': { icon: '📁', label: 'File' }
}

export default function FileUpload() {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)
  const router = useRouter()
  const { userId } = useParams()
  const { user } = useAuth()

  // Verify user matches the URL userId
  if (user && user.uid !== userId) {
    router.push(`/dashboard/${user.uid}/upload/file`)
    return null
  }

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    // Validate file size (max 100MB)
    if (selectedFile.size > 100 * 1024 * 1024) {
      setError('File size exceeds 100MB limit')
      return
    }

    setFile(selectedFile)
    setError('')

    // Create preview for images/videos
    if (selectedFile.type.includes('image/') || selectedFile.type.includes('video/')) {
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result)
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }

  // Clear file selection
  const clearFile = () => {
    setFile(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Get file icon based on type
  const getFileIcon = (fileType) => {
    const type = Object.keys(FILE_TYPES).find(type => {
      if (type.endsWith('/*')) {
        return fileType.startsWith(type.split('/*')[0])
      }
      return fileType === type
    })
    return FILE_TYPES[type || 'default']
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file')
      return
    }

    setIsUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('userId', userId)

      const response = await fetch('/api/upload/file', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Upload failed')

      router.push(`/dashboard/${userId}/upload/success?url=${encodeURIComponent(data.url)}&type=file&fileName=${encodeURIComponent(file.name)}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Upload File</h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {preview ? (
              file.type.includes('image/') ? (
                <div className="mb-4">
                  <img 
                    src={preview} 
                    alt="Preview" 
                    className="max-h-60 mx-auto rounded-md object-contain"
                  />
                </div>
              ) : file.type.includes('video/') ? (
                <div className="mb-4">
                  <video 
                    controls 
                    className="max-h-60 mx-auto rounded-md"
                  >
                    <source src={preview} type={file.type} />
                    Your browser does not support the video tag.
                  </video>
                </div>
              ) : null
            ) : file ? (
              <div className="flex flex-col items-center justify-center mb-4">
                <span className="text-4xl mb-2">
                  {getFileIcon(file.type).icon}
                </span>
                <p className="text-gray-700 font-medium">{file.name}</p>
                <p className="text-sm text-gray-500">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB • {getFileIcon(file.type).label}
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center">
                <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-500 mb-2">Drag and drop files here or</p>
              </div>
            )}

            <label className="cursor-pointer">
              <span className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                {file ? 'Change File' : 'Select File'}
              </span>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*, video/*, audio/*, .pdf, .doc, .docx, .ppt, .pptx, .xls, .xlsx, .txt, .zip"
              />
            </label>

            {file && (
              <button
                type="button"
                onClick={clearFile}
                className="ml-3 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Remove
              </button>
            )}
          </div>

          <div className="text-xs text-gray-500">
            Supported formats: Images (JPEG, PNG, GIF), Videos (MP4, MOV), 
            Audio (MP3, WAV), Documents (PDF, DOC, PPT, XLS), 
            Text (TXT), Archives (ZIP) • Max 100MB
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
              disabled={isUploading || !file}
              className={`px-4 py-2 rounded-md text-sm font-medium text-white ${isUploading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'} ${!file ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isUploading ? 'Uploading...' : 'Upload File'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}