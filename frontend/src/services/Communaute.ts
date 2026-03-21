import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
    getPosts,
    getAnonymousPosts,
    createPost,
    deletePost,
    likePost,
    getComments,
    createComment,
    getLeaderboard,
    getGroups,
    createGroup,
    joinGroup,
} from "./taskService"
import type { Post, Comment, LeaderboardUser, Group } from "./taskService"

export function useCommunaute() {

    const navigate = useNavigate()

    const [activeTab, setActiveTabState] = useState<"feed" | "anonymous" | "groups">("feed")
    const [activeGroupId, setActiveGroupId] = useState<number | null>(null)

    const [posts, setPosts] = useState<Post[]>([])
    const [anonPosts, setAnonPosts] = useState<Post[]>([])
    const [groups, setGroups] = useState<Group[]>([])
    const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([])
    const [loading, setLoading] = useState(true)

    const [newPost, setNewPost] = useState("")
    const [postType, setPostType] = useState("free")
    const [isAnonymous, setIsAnonymous] = useState(false)
    const [showPostForm, setShowPostForm] = useState(false)

    const [openCommentsPostId, setOpenCommentsPostId] = useState<number | null>(null)
    const [comments, setComments] = useState<Record<number, Comment[]>>({})
    const [newComment, setNewComment] = useState("")
    const [commentAnonymous, setCommentAnonymous] = useState(false)

    const [showGroupForm, setShowGroupForm] = useState(false)
    const [groupName, setGroupName] = useState("")
    const [groupDesc, setGroupDesc] = useState("")
    const [groupEmoji, setGroupEmoji] = useState("💬")
    const [groupCategory, setGroupCategory] = useState("general")
    const [groupPrivate, setGroupPrivate] = useState(false)

    useEffect(() => {
        loadAll()
    }, [])

    async function loadAll() {
        try {
            const [p, anon, g, l] = await Promise.all([
                getPosts(),
                getAnonymousPosts(),
                getGroups(),
                getLeaderboard(),
            ])
            setPosts(p)
            setAnonPosts(anon)
            setGroups(g)
            setLeaderboard(l)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    async function refreshFeed(tab = activeTab, groupId = activeGroupId) {
        try {
            if (tab === "anonymous") {
                const anon = await getAnonymousPosts()
                setAnonPosts(anon)
            } else if (tab === "groups" && groupId) {
                const [p, l] = await Promise.all([getPosts(groupId), getLeaderboard(groupId)])
                setPosts(p)
                setLeaderboard(l)
            } else {
                const [p, l] = await Promise.all([getPosts(), getLeaderboard()])
                setPosts(p)
                setLeaderboard(l)
            }
        } catch (err) {
            console.error(err)
        }
    }

    function handleSwitchTab(tab: "feed" | "anonymous" | "groups") {
        setActiveTabState(tab)
        setActiveGroupId(null)
        setShowPostForm(false)
        setOpenCommentsPostId(null)
    }

    async function handleOpenGroup(groupId: number) {
        setActiveGroupId(groupId)
        setActiveTabState("groups")
        try {
            const [p, l] = await Promise.all([getPosts(groupId), getLeaderboard(groupId)])
            setPosts(p)
            setLeaderboard(l)
        } catch (err) {
            console.error(err)
        }
    }

    async function handleBackToGroups() {
        setActiveGroupId(null)
        const [p, l] = await Promise.all([getPosts(), getLeaderboard()])
        setPosts(p)
        setLeaderboard(l)
    }

    async function handleCreatePost() {
        if (!newPost.trim()) return
        try {
            await createPost({
                content: newPost,
                type: postType,
                group_id: activeGroupId ?? undefined,
                is_anonymous: activeTab === "anonymous" ? true : isAnonymous,
            })
            setNewPost("")
            setShowPostForm(false)
            setIsAnonymous(false)
            await refreshFeed()
        } catch (err) {
            console.error(err)
            alert("Failed to create post")
        }
    }

    async function handleDeletePost(postId: number) {
        try {
            await deletePost(postId)
            if (activeTab === "anonymous") {
                setAnonPosts(prev => prev.filter(p => p.id !== postId))
            } else {
                setPosts(prev => prev.filter(p => p.id !== postId))
            }
        } catch (err) {
            console.error(err)
        }
    }

    async function handleLike(postId: number) {
        try {
            await likePost(postId)
            await refreshFeed()
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
            const comment = await createComment(postId, newComment, commentAnonymous)
            setComments(prev => ({ ...prev, [postId]: [...(prev[postId] ?? []), comment] }))
            const setter = activeTab === "anonymous" ? setAnonPosts : setPosts
            setter(prev => prev.map(p => p.id === postId
                ? { ...p, comments_count: p.comments_count + 1 }
                : p
            ))
            setNewComment("")
            setCommentAnonymous(false)
        } catch (err) {
            console.error(err)
        }
    }

    async function handleJoinGroup(groupId: number) {
        try {
            const result = await joinGroup(groupId)
            setGroups(prev => prev.map(g => g.id === groupId ? {
                ...g,
                is_member: result.joined ? 1 : 0,
                member_count: (g.member_count ?? 0) + (result.joined ? 1 : -1),
            } : g))
        } catch (err) {
            console.error(err)
        }
    }

    async function handleCreateGroup() {
        if (!groupName.trim()) return
        try {
            const group = await createGroup({
                name: groupName,
                description: groupDesc,
                emoji: groupEmoji,
                category: groupCategory,
                is_private: groupPrivate,
            })
            setGroups(prev => [group, ...prev])
            setShowGroupForm(false)
            setGroupName("")
            setGroupDesc("")
            setGroupEmoji("💬")
            setGroupCategory("general")
            setGroupPrivate(false)
        } catch (err) {
            console.error(err)
            alert("Failed to create group")
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
        const diff = Math.floor((Date.now() - date.getTime()) / 1000)
        if (diff < 60) return "À l'instant"
        if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`
        if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)} h`
        return `Il y a ${Math.floor(diff / 86400)} j`
    }

    const displayedPosts = activeTab === "anonymous" ? anonPosts : posts

    return {
        navigate,
        loading,
        activeTab,
        setActiveTab: handleSwitchTab,
        activeGroupId,
        posts: displayedPosts,
        groups,
        leaderboard,
        newPost, setNewPost,
        postType, setPostType,
        isAnonymous, setIsAnonymous,
        showPostForm, setShowPostForm,
        openCommentsPostId,
        comments,
        newComment, setNewComment,
        commentAnonymous, setCommentAnonymous,
        showGroupForm, setShowGroupForm,
        groupName, setGroupName,
        groupDesc, setGroupDesc,
        groupEmoji, setGroupEmoji,
        groupCategory, setGroupCategory,
        groupPrivate, setGroupPrivate,
        handleCreatePost,
        handleDeletePost,
        handleLike,
        handleOpenComments,
        handleCreateComment,
        handleJoinGroup,
        handleCreateGroup,
        handleOpenGroup,
        handleBackToGroups,
        getDivisionFromXp,
        formatDate,
    }
}