'use client'
import { useSearchParams, useParams } from 'next/navigation'
import Link from 'next/link'

export default function UploadSuccess() {
  const searchParams = useSearchParams()
  const { userId } = useParams()
  const url = searchParams.get('url')
  const count = searchParams.get('count')
  const folder = searchParams.get('folder')
  const type = searchParams.get('type')

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
          <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {type === 'folder' ? `Folder "${folder}" Uploaded!` : 'File Uploaded Successfully!'}
        </h1>
        
        {type === 'folder' ? (
          <p className="text-gray-600 mb-6">{count} files were added to your collection.</p>
        ) : (
          <div className="mb-6">
            <p className="text-gray-600 mb-2">Your file is now available at:</p>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all text-sm"
            >
              {url}
            </a>
          </div>
        )}

        <div className="flex justify-center gap-4 mt-8">
          <Link
            href={`/dashboard/${userId}/upload/${type === 'folder' ? 'folder' : 'file'}`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
          >
            Upload Another {type === 'folder' ? 'Folder' : 'File'}
          </Link>
          <Link
            href={`/dashboard/${userId}`}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 text-sm font-medium hover:bg-gray-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}