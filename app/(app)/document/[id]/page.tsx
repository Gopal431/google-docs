"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Save, ArrowLeft, Share } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import TiptapEditor from "@/components/tiptap-editor"
import { useDebounce } from "@/hooks/use-debounce"

type DocumentData = {
  id: string
  title: string
  content: any
  status: "draft" | "published"
  user_id: string
}

export default function DocumentPage({ params }: { params: { id: string } }) {
  const [document, setDocument] = useState<DocumentData | null>(null)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState<any>(null)
  const [status, setStatus] = useState<"draft" | "published">("draft")
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const debouncedContent = useDebounce(content, 1000)
  const debouncedTitle = useDebounce(title, 1000)
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      fetchDocument()
    }
  }, [user, params.id])

  useEffect(() => {
    if (debouncedContent && document) {
      saveDocument()
    }
  }, [debouncedContent, debouncedTitle])

  const fetchDocument = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.from("documents").select("*").eq("id", params.id).single()

      if (error) {
        throw error
      }

      if (!data) {
        router.push("/dashboard")
        return
      }

      setDocument(data as DocumentData)
      setTitle(data.title)
      setContent(typeof data.content === "string" ? JSON.parse(data.content) : data.content)
      setStatus(data.status as "draft" | "published")
    } catch (error) {
      console.error("Error fetching document:", error)
      toast({
        title: "Error",
        description: "Failed to fetch document",
        variant: "destructive",
      })
      router.push("/dashboard")
    } finally {
      setIsLoading(false)
    }
  }

  const saveDocument = async () => {
    if (!document || !user) return

    setIsSaving(true)
    try {
      const { error } = await supabase
        .from("documents")
        .update({
          title,
          content: typeof content === "string" ? content : JSON.stringify(content),
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", document.id)

      if (error) {
        throw error
      }
    } catch (error) {
      console.error("Error saving document:", error)
      toast({
        title: "Error",
        description: "Failed to save document",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusChange = async (newStatus: "draft" | "published") => {
    setStatus(newStatus)
    try {
      const { error } = await supabase
        .from("documents")
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq("id", document?.id)

      if (error) {
        throw error
      }

      toast({
        title: "Status updated",
        description: `Document is now ${newStatus === "published" ? "published" : "saved as draft"}`,
      })
    } catch (error) {
      console.error("Error updating status:", error)
      toast({
        title: "Error",
        description: "Failed to update document status",
        variant: "destructive",
      })
    }
  }

  const handleManualSave = async () => {
    await saveDocument()
    toast({
      title: "Document saved",
      description: "Your document has been saved successfully",
    })
  }

  const shareDocument = async () => {
    if (!document) return

    // Copy the shareable link to clipboard
    const shareableLink = `${window.location.origin}/document/${document.id}/view`
    await navigator.clipboard.writeText(shareableLink)
    toast({
      title: "Link copied",
      description: "Shareable link copied to clipboard",
    })
  }

  if (isLoading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="max-w-md border-none text-xl font-medium focus-visible:ring-0"
            placeholder="Untitled Document"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={status} onValueChange={(value) => handleStatusChange(value as "draft" | "published")}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={shareDocument}>
            <Share className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button size="sm" onClick={handleManualSave} disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-4xl p-8">
          {content && <TiptapEditor initialContent={content} onChange={setContent} />}
        </div>
      </div>
    </div>
  )
}
