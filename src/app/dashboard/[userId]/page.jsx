'use client'

import { useAuth } from '@/context/AuthContext'
import ProtectedRoute from '@/app/components/auth/ProtectedRoute'
import Link from 'next/link'
import RecentFiles from './file/page'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'

export default function Dashboard() {
    const { user } = useAuth()
    const [storage, setStorage] = useState({ used: 0, limit: 1 * 1024 * 1024 * 1024 })
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

    const formatSize = (bytes) => {
        if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB'
        return (bytes / 1048576).toFixed(2) + ' MB'
    }

    const usedFormatted = formatSize(storage.used)
    const limitFormatted = formatSize(storage.limit)
    const percentage = Math.min(100, (storage.used / storage.limit * 100).toFixed(1))
    const getProgressColor = () => {
        if (percentage > 90) return 'bg-red-600'
        if (percentage > 70) return 'bg-orange-500'
        return 'bg-blue-600'
    }

    return (
        <ProtectedRoute>
            <div className="min-h-screen relative overflow-hidden bg-gray-400">
                {/* 🔥 Animated Background */}

                <div className="relative z-10 p-8">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="bg-white w-full rounded-2xl shadow-xl p-6 mb-6 hover:shadow-2xl transition-shadow duration-300"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center space-x-4">
                                    <img
                                        src={user.photoURL}
                                        alt="Profile"
                                        className="w-14 h-14 rounded-full shadow-md"
                                    />
                                    <div>
                                        <h1 className="text-2xl font-bold text-black animate-pulse">{`Welcome, ${user.displayName}`}</h1>
                                        <p className="text-gray-600">{user.email}</p>
                                    </div>
                                </div>
                                <div className='flex space-x-3 flex-wrap gap-2 justify-end items-center'>
                                    <Link
                                        href={`/dashboard/${user.uid}/upload/file`}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-transform hover:scale-105"
                                    >
                                        Upload File
                                    </Link>
                                    <Link
                                        href={`/dashboard/${user.uid}/upload/folder`}
                                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-transform hover:scale-105"
                                    >
                                        Upload Folder
                                    </Link>
                                </div>
                            </div>

                            {/* Storage Section */}
                            <div className="border-t pt-4">
                                <h2 className="text-xl font-semibold mb-4 text-black">Your Storage</h2>
                                <div className="w-full bg-gray-200 rounded-full h-3">
                                    <div
                                        className={`h-3 rounded-full transition-all duration-500 ease-in-out ${getProgressColor()}`}
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                                <p className="text-sm text-gray-500 mt-2">
                                    {loading ? 'Calculating...' : `${usedFormatted} of ${limitFormatted} used (${percentage}%)`}
                                </p>
                            </div>

                            {/* Recent Files */}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white rounded-lg shadow-md p-6 mt-6"
                            >
                                <h2 className="text-xl font-semibold mb-4 text-black">Recent Files</h2>
                                <RecentFiles userId={user.uid} />
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
</div>
        </ProtectedRoute>
    )
}
