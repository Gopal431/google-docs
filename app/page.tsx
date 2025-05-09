"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { FcGoogle } from "react-icons/fc"

export default function LoginPage() {
  const { user, isLoading, signInWithGoogle } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user && !isLoading) {
      router.push("/dashboard")
    }
  }, [user, isLoading, router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-6 shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Google Docs Clone</h1>
          <p className="mt-2 text-gray-600">Sign in to access your documents</p>
        </div>
        <div className="mt-8 space-y-6">
          <Button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-2"
            variant="outline"
            size="lg"
            disabled={isLoading}
          >
            <FcGoogle className="h-5 w-5" />
            Sign in with Google
          </Button>
        </div>
      </div>
    </div>
  )
}
