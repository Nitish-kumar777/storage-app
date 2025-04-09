'use client'

import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/app/components/auth/ProtectedRoute'
import Link from 'next/link'
import RecentFiles from './file/page'
import { useEffect, useState } from 'react'

export default function Dashboard() {
    const { user } = useAuth()
    const [storage, setStorage] = useState({ used: 0, limit: 1 * 1024 * 1024 * 1024 }) // Default 1GB limit
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStorageInfo = async () => {
            if (!user?.uid) return
            try {
                const res = await fetch(`/api/files/${user.uid}`)
                const data = await res.json()
                if (data.success) {
                    setStorage(data.storageInfo)
                }
            } catch (err) {
                console.error('Error fetching storage info:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchStorageInfo()
    }, [user?.uid])

    if (!user) return <div>Please sign in</div>

    // Convert bytes to MB/GB
    const formatSize = (bytes) => {
        if (bytes >= 1073741824) {
            return (bytes / 1073741824).toFixed(2) + ' GB'
        }
        return (bytes / 1048576).toFixed(2) + ' MB'
    }

    const usedFormatted = formatSize(storage.used)
    const limitFormatted = formatSize(storage.limit)
    const percentage = Math.min(100, (storage.used / storage.limit * 100).toFixed(1));
    const getProgressColor = () => {
        if (percentage > 90) return 'bg-red-600'
        if (percentage > 70) return 'bg-orange-500'
        return 'bg-blue-600'
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-100 p-8">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white w-full rounded-lg shadow-md p-6 mb-6">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center space-x-4">
                                <img
                                    src={user.photoURL}
                                    alt="Profile"
                                    className="w-12 h-12 rounded-full"
                                />
                                <div>
                                    <h1 className="text-2xl font-bold text-black">Welcome, {user.displayName}</h1>
                                    <p className="text-gray-600">{user.email}</p>
                                </div>
                            </div>
                            <div className='flex space-x-4 flex-wrap gap-2 justify-end items-center'>
                                <Link
                                    href={`/dashboard/${user.uid}/upload/file`}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition"
                                >
                                    Upload Files
                                </Link>
                                <Link
                                    href={`/dashboard/${user.uid}/upload/folder`}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition"
                                >
                                    Upload folder
                                </Link>
                            </div>
                        </div>

                        {/* Storage Section */}
                        <div className="border-t pt-4">
                            <h2 className="text-xl font-semibold mb-4">Your Storage</h2>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div
                                    className={`h-2.5 rounded-full transition-all duration-500 ease-in-out ${getProgressColor()}`}
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>
                            <p className="text-sm text-gray-500 mt-2">
                                {loading ? 'Calculating...' : `${usedFormatted} of ${limitFormatted} used (${percentage}%)`}
                            </p>
                        </div>

                        {/* Recent files section */}
                        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
                            <h2 className="text-xl font-semibold mb-4">Recent Files</h2>
                            <RecentFiles userId={user.uid} />
                        </div>
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    )
}