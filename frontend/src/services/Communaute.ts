import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
    getPosts, createPost, deletePost, likePost,
    getComments, createComment, getLeaderboard
} from "./taskService"
import type { Post, Comment, LeaderboardUser } from "./taskService"

export function useCommunaute() {

    const navigate = useNavigate()

    const [posts, setPosts] = useState<Post[]>([])
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
    const [loading, setLoading] = useState(true)

    const [newPost, setNewPost] = useState("")
    const [postType, setPostType] = useState("free")
    const [showPostForm, setShowPostForm] = useState(false)

    const [openCommentsPostId, setOpenCommentsPostId] = useState<number | null>(null)
    const [comments, setComments] = useState<Record<number, Comment[]>>({})
    const [newComment, setNewComment] = useState("")

    useEffect(() => {
        Promise.all([getPosts(), getLeaderboard()])
            .then(([p, l]) => {
                setPosts(p)
                setLeaderboard(l)
                setLoading(false)
            })
            .catch(err => console.error(err))
    }, [])

    async function handleCreatePost() {
        if (!newPost.trim()) return
        try {
            const post = await createPost({ content: newPost, type: postType })
            setPosts(prev => [post, ...prev])
            setNewPost("")
            setShowPostForm(false)
        } catch (err) {
            console.error(err)
            alert("Failed to create post")
        }
    }

    async function handleDeletePost(id: number) {
        try {
            await deletePost(id)
            setPosts(prev => prev.filter(p => p.id !== id))
        } catch (err) {
            console.error(err)
        }
    }

    async function handleLike(id: number) {
        try {
            const result = await likePost(id)
            setPosts(prev => prev.map(p => p.id === id ? {
                ...p,
                liked_by_me: result.liked ? 1 : 0,
                likes_count: result.liked ? p.likes_count + 1 : p.likes_count - 1
            } : p))
        } catch (err) {
            console.error(err)
        }
    }

    async function handleOpenComments(postId: number) {
        if (openCommentsPostId === postId) {
            setOpenCommentsPostId(null)
            return
        }
        setOpenCommentsPostId(postId)
        if (!comments[postId]) {
            try {
                const data = await getComments(postId)
                setComments(prev => ({ ...prev, [postId]: data }))
            } catch (err) {
                console.error(err)
            }
        }
    }

    async function handleCreateComment(postId: number) {
        if (!newComment.trim()) return
        try {
            const comment = await createComment(postId, newComment)
            setComments(prev => ({
                ...prev,
                [postId]: [...(prev[postId] ?? []), comment]
            }))
            setPosts(prev => prev.map(p => p.id === postId ? {
                ...p,
                comments_count: p.comments_count + 1
            } : p))
            setNewComment("")
        } catch (err) {
            console.error(err)
        }
    }

    function getDivisionFromXp(xp: number): string {
        const divisions = [
            { name: "Fer", min: 0 },
            { name: "Bronze", min: 500 },
            { name: "Argent", min: 1500 },
            { name: "Or", min: 3000 },
            { name: "Platine", min: 6000 },
            { name: "Émeraude", min: 10000 },
            { name: "Diamant", min: 15000 },
            { name: "Maître", min: 22000 },
            { name: "Grand Maître", min: 30000 },
            { name: "Challenger", min: 40000 },
        ]
        return [...divisions].reverse().find(d => xp >= d.min)?.name ?? "Fer"
    }

    function formatDate(dateStr: string): string {
        const date = new Date(dateStr)
        const now = new Date()
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
        if (diff < 60) return "À l'instant"
        if (diff < 3600) return `Il y a ${Math.floor(diff / 60)}min`
        if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`
        return `Il y a ${Math.floor(diff / 86400)}j`
    }

    return {
        navigate,
        loading,
        posts,
        leaderboard,
        newPost, setNewPost,
        postType, setPostType,
        showPostForm, setShowPostForm,
        openCommentsPostId,
        comments,
        newComment, setNewComment,
        handleCreatePost,
        handleDeletePost,
        handleLike,
        handleOpenComments,
        handleCreateComment,
        getDivisionFromXp,
        formatDate,
    }
}