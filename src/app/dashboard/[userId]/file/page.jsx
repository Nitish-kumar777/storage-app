'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function RecentFiles({ userId }) {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [expandedFile, setExpandedFile] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [filesPerPage] = useState(5)
  const [downloadStatus, setDownloadStatus] = useState({})

  useEffect(() => {
    const fetchFiles = async () => {
      try {
        const res = await fetch(`/api/user/${userId}/files`)
        const data = await res.json()

        if (data.success) {
          setFiles(data.files)
        }
      } catch (error) {
        console.error('Failed to fetch files:', error)
      } finally {
        setLoading(false)
      }
    }

    if (userId) fetchFiles()
  }, [userId])

  // Pagination logic
  const indexOfLastFile = currentPage * filesPerPage
  const indexOfFirstFile = indexOfLastFile - filesPerPage
  const currentFiles = files.slice(indexOfFirstFile, indexOfLastFile)
  const totalPages = Math.ceil(files.length / filesPerPage)

  const handleDelete = async (file) => {
    if (!file._id) {
      alert('File ID is missing. Cannot delete.')
      return
    }

    const confirm = window.confirm('Are you sure you want to delete this file?')
    if (!confirm) return

    try {
      const res = await fetch(`/api/user/${userId}/files`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fileId: file._id,
          cloudinaryPublicId: file.cloudinaryPublicId // Include if exists
        }),
      })

      if (!res.ok) throw new Error('Failed to delete file')
      
      setFiles(prev => prev.filter(f => f._id !== file._id))
    } catch (err) {
      console.error('Error deleting file:', err)
      alert(err.message)
    }
  }

  const handleDownload = async (file) => {
    const fileId = file._id
    setDownloadStatus(prev => ({ ...prev, [fileId]: 'starting' }))

    try {
      // For direct downloadable links
      if (file.directDownload) {
        setDownloadStatus(prev => ({ ...prev, [fileId]: 'downloading' }))
        
        const response = await fetch(file.fileUrl)
        const blob = await response.blob()
        
        // Create download link
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.fileName || `file_${fileId}`
        document.body.appendChild(a)
        a.click()
        
        // Cleanup
        setTimeout(() => {
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)
          setDownloadStatus(prev => ({ ...prev, [fileId]: 'completed' }))
          setTimeout(() => setDownloadStatus(prev => ({ ...prev, [fileId]: undefined })), 2000)
        }, 100)
        
        return
      }

      // For files needing server processing
      setDownloadStatus(prev => ({ ...prev, [fileId]: 'preparing' }))
      
      const response = await fetch(`/api/user/${userId}/files/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          cloudinaryPublicId: file.cloudinaryPublicId
        }),
      })

      if (!response.ok) throw new Error('Download failed')

      // Get content length for progress tracking
      const contentLength = response.headers.get('Content-Length')
      const reader = response.body.getReader()
      let receivedLength = 0
      let chunks = []
      
      setDownloadStatus(prev => ({ ...prev, [fileId]: 'downloading' }))

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        chunks.push(value)
        receivedLength += value.length
        
        // Update progress if we know total size
        if (contentLength) {
          const progress = Math.round((receivedLength / contentLength) * 100)
          setDownloadStatus(prev => ({ ...prev, [fileId]: `downloading ${progress}%` }))
        }
      }

      // Combine chunks
      const blob = new Blob(chunks)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = file.fileName || `file_${fileId}`
      document.body.appendChild(a)
      a.click()
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        setDownloadStatus(prev => ({ ...prev, [fileId]: 'completed' }))
        setTimeout(() => setDownloadStatus(prev => ({ ...prev, [fileId]: undefined })), 2000)
      }, 100)

    } catch (error) {
      console.error('Download failed:', error)
      setDownloadStatus(prev => ({ ...prev, [fileId]: 'failed' }))
      setTimeout(() => setDownloadStatus(prev => ({ ...prev, [fileId]: undefined })), 3000)
    }
  }

  // Download button component
  const DownloadButton = ({ file }) => {
    const fileId = file._id
    const status = downloadStatus[fileId]
    
    const getButtonText = () => {
      if (!status) return 'Download'
      if (status === 'starting') return 'Preparing...'
      if (status === 'preparing') return 'Preparing...'
      if (status.startsWith('downloading')) return status
      if (status === 'completed') return '✓ Downloaded'
      if (status === 'failed') return '✕ Failed'
      return 'Download'
    }


    return (
      <button
        onClick={() => handleDownload(file)}
        disabled={!!status && status !== 'completed' && status !== 'failed'}
        className={`text-sm hover:underline ${
          status === 'completed' ? 'text-green-600' :
          status === 'failed' ? 'text-red-500' :
          'text-blue-600'
        }`}
      >
        {getButtonText()}
      </button>
    )
  }

  const toggleExpand = (fileId) => {
    setExpandedFile(expandedFile === fileId ? null : fileId)
  }

  if (loading) return <p className='text-gary-500'>Loading recent files...</p>

  if (files.length === 0) {
    return <div className="text-gray-500 italic">No recent files found</div>
  }

  return (
    <div>

      {/* Files List */}
      <ul className="space-y-4 mb-6">
        {currentFiles.map((file) => (
          <li key={file._id} className="border border-gray-300 rounded p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-medium text-black">{file.fileName}</p>
                <p className="text-sm text-gray-500">
                  {(file.fileSize/1024).toFixed(1)} KB • {file.fileType}
                </p>
              </div>
              <div className="flex gap-4">
                <Link
                  href={file.fileUrl}
                  target="_blank"
                  className="text-blue-600 text-sm hover:underline"
                >
                  Open
                </Link>
                <button
                  onClick={() => handleDelete(file)}
                  className="text-red-500 text-sm hover:underline"
                >
                  Delete
                </button>
                <DownloadButton file={file} />

                <button
                  onClick={() => toggleExpand(file._id)}
                  className="text-gray-600 text-sm hover:underline"
                >
                  {expandedFile === file._id ? 'Less' : 'More'}
                </button>
              </div>
            </div>

            {expandedFile === file._id && (
              <div className="mt-3 p-3 bg-gray-50 text-gray-600 rounded">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Uploaded:</span>
                    <span> {new Date(file.uploadedAt).toLocaleString()}</span>
                  </div>
                  
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(p-1, 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span>Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage(p => Math.min(p+1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}