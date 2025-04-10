'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'

// File type configuration with icons
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
  const [uploadProgress, setUploadProgress] = useState(0)
  const [recentUploads, setRecentUploads] = useState([])
  const fileInputRef = useRef(null)
  const router = useRouter()
  const { userId } = useParams()
  const { user } = useAuth()

  // Fetch recent uploads
  useEffect(() => {
    const fetchRecentUploads = async () => {
      try {
        const res = await fetch(`/api/user/${userId}/files?limit=5`)
        const data = await res.json()
        if (data.success) {
          setRecentUploads(data.files)
        }
      } catch (err) {
        console.error('Failed to fetch recent uploads:', err)
      }
    }
    
    if (userId) fetchRecentUploads()
  }, [userId])

  // Redirect if user doesn't match
  if (user && user.uid !== userId) {
    router.push(`/dashboard/${user.uid}/upload/file`)
    return null
  }

  // Safe file type icon getter
  const getFileIcon = (fileType) => {
    if (!fileType) return FILE_TYPES['default']
    
    const type = Object.keys(FILE_TYPES).find(type => {
      if (type.endsWith('/*')) {
        const prefix = type.split('/*')[0]
        return typeof fileType === 'string' && fileType.startsWith(prefix)
      }
      return fileType === type
    })
    
    return FILE_TYPES[type || 'default']
  }

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (!selectedFile) return

    // Validate file size (100MB max)
    if (selectedFile.size > 100 * 1024 * 1024) {
      setError('File size exceeds 100MB limit')
      return
    }

    setFile(selectedFile)
    setError('')

    // Create preview for media files
    if (selectedFile.type.includes('image/') || 
        selectedFile.type.includes('video/') || 
        selectedFile.type.includes('audio/')) {
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result)
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }

  // Clear selected file
  const clearFile = () => {
    setFile(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle file upload
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a file')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
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

      // Update recent uploads
      setRecentUploads(prev => [{
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        uploadedAt: new Date().toISOString(),
        url: data.url
      }, ...prev.slice(0, 4)])

      // Redirect to success page
      router.push(`/dashboard/${userId}/upload/success?url=${encodeURIComponent(data.url)}&type=file&fileName=${encodeURIComponent(file.name)}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Upload File</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                {preview ? (
                  file.type.includes('image/') ? (
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="max-h-60 mx-auto rounded-md object-contain mb-4"
                    />
                  ) : file.type.includes('video/') ? (
                    <video 
                      controls 
                      className="max-h-60 mx-auto rounded-md mb-4"
                    >
                      <source src={preview} type={file.type} />
                    </video>
                  ) : file.type.includes('audio/') ? (
                    <audio 
                      controls 
                      className="w-full mb-4"
                    >
                      <source src={preview} type={file.type} />
                    </audio>
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

              {/* Progress bar */}
              {isUploading && (
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

              <div className="text-xs text-gray-500">
                Supported formats: Images, Videos, Audio, Documents (PDF, Word, Excel, PowerPoint), 
                Text files, ZIP archives • Max 100MB
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
                  {isUploading ? `Uploading ${uploadProgress}%` : 'Upload File'}
                </button>
              </div>
            </form>
          </div>

          {/* Recent Uploads Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Uploads</h2>
            {recentUploads.length > 0 ? (
              <ul className="space-y-3">
                {recentUploads.map((upload, index) => (
                  <li key={index} className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <span className="text-2xl mr-3">
                      {getFileIcon(upload.fileType).icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {upload.fileName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(upload.fileSize / (1024 * 1024)).toFixed(2)} MB • 
                        {new Date(upload.uploadedAt).toLocaleString()}
                      </p>
                    </div>
                    <a 
                      href={upload.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Open
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No recent uploads</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}