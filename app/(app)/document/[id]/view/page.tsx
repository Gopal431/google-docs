"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft } from "lucide-react"
import TiptapEditor from "@/components/tiptap-editor"

type DocumentData = {
  id: string
  title: string
  content: any
  status: "draft" | "published"
  user_id: string
}

export default function ViewDocumentPage({ params }: { params: { id: string } }) {
  const [document, setDocument] = useState<DocumentData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    fetchDocument()
  }, [params.id])

  const fetchDocument = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("documents").select("*").eq("id", params.id).single()

      if (error) {
        throw error
      }

      if (!data) {
        router.push("/")
        return
      }

      // Only allow viewing published documents
      if (data.status !== "published") {
        toast({
          title: "Access denied",
          description: "This document is not published for viewing",
          variant: "destructive",
        })
        router.push("/")
        return
      }

      setDocument(data as DocumentData)
    } catch (error) {
      console.error("Error fetching document:", error)
      toast({
        title: "Error",
        description: "Failed to fetch document",
        variant: "destructive",
      })
      router.push("/")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!document) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-medium">{document.title}</h1>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <div className="mx-auto max-w-4xl p-8">
          <TiptapEditor
            initialContent={typeof document.content === "string" ? JSON.parse(document.content) : document.content}
            editable={false}
          />
        </div>
      </main>
    </div>
  )
}
