'use client'
import { signInWithPopup } from "firebase/auth"
import { auth, provider } from "@/lib/firebase"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"

export default function GoogleSignIn() {
  const router = useRouter()
  const { user } = useAuth()

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, provider)
      router.push('/dashboard/`{userid}`') // Redirect after login
    } catch (error) {
      console.error("Error signing in:", error)
    }
  }

  if (user) {
    router.push('/dashboard/`{userid}`') // Redirect if already logged in
  }


  return (
    <div className="flex justify-center items-center min-h-screen">
      <button
        onClick={handleGoogleSignIn}
        className="bg-white text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow hover:bg-gray-100 flex items-center"
      >
        <svg
          className="w-6 h-6 mr-2"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M12.545 10.239v3.821h5.445c-0.712 2.315-2.647 3.972-5.445 3.972-3.332 0-6.033-2.701-6.033-6.032s2.701-6.032 6.033-6.032c1.498 0 2.866 0.549 3.921 1.453l2.814-2.814c-1.786-1.667-4.166-2.683-6.735-2.683-5.522 0-10 4.477-10 10s4.478 10 10 10c8.396 0 10-7.524 10-10 0-0.61-0.052-1.219-0.153-1.816h-9.847z" />
        </svg>
        Sign in with Google
      </button>
    </div>
  );
}