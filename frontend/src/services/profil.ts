import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getProfil, updateProfil } from "./taskService"

export function useProfil() {

    const navigate = useNavigate()

    const [username, setUsername] = useState("")
    const [bio, setBio] = useState("")
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(true)
    const [saved, setSaved] = useState(false)
    const [stats, setStats] = useState({ tasksCompleted: 0, themesCreated: 0, communityPosts: 0 })

    useEffect(() => {
        getProfil()
            .then(data => {
                setUsername(data.username ?? "")
                setBio(data.bio ?? "")
                setEmail(data.email)
                setStats(data.stats)
                setLoading(false)
            })
            .catch(err => console.error(err))
    }, [])

    async function handleSave() {
        try {
            await updateProfil({ username, bio })
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } catch (err) {
            console.error(err)
            alert("Failed to save profile")
        }
    }

    function handleLogout() {
        localStorage.removeItem("token")
        navigate("/login")
    }

    return {
        navigate,
        username, setUsername,
        bio, setBio,
        email,
        loading,
        saved,
        handleSave,
        handleLogout,
        stats,
    }
}