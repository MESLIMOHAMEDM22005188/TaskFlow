import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
    getObjectives, getObjectiveTemplates, createObjective,
    adoptTemplate, updateObjectiveProgress, updateObjectiveStatus, deleteObjective
} from "./taskService"
import type { Objective, ObjectiveTemplate } from "./taskService"

export function useObjectifs() {

    const navigate = useNavigate()

    const [objectives, setObjectives] = useState<Objective[]>([])
    const [templates, setTemplates] = useState<ObjectiveTemplate[]>([])
    const [loading, setLoading] = useState(true)

    const [showCreateForm, setShowCreateForm] = useState(false)
    const [showCatalogue, setShowCatalogue] = useState(false)

    // form états
    const [title, setTitle] = useState("")
    const [description, setDescription] = useState("")
    const [emoji, setEmoji] = useState("")
    const [targetValue, setTargetValue] = useState("")
    const [targetUnit, setTargetUnit] = useState("")
    const [deadline, setDeadline] = useState("")

    useEffect(() => {
        Promise.all([getObjectives(), getObjectiveTemplates()])
            .then(([objs, tmps]) => {
                setObjectives(objs)
                setTemplates(tmps)
                setLoading(false)
            })
            .catch(err => console.error(err))
    }, [])

    async function handleCreateObjective() {
        if (!title.trim()) return
        try {
            const obj = await createObjective({
                title,
                description: description || undefined,
                emoji: emoji || undefined,
                target_value: targetValue ? Number(targetValue) : null,
                target_unit: targetUnit || undefined,
                deadline: deadline || null
            })
            setObjectives(prev => [obj, ...prev])
            setTitle("")
            setDescription("")
            setEmoji("")
            setTargetValue("")
            setTargetUnit("")
            setDeadline("")
            setShowCreateForm(false)
        } catch (err) {
            console.error(err)
            alert("Failed to create objective")
        }
    }

    async function handleAdoptTemplate(templateId: number) {
        try {
            const obj = await adoptTemplate(templateId)
            setObjectives(prev => [obj, ...prev])
            setShowCatalogue(false)
        } catch (err) {
            console.error(err)
            alert("Failed to adopt objective")
        }
    }

    async function handleUpdateProgress(id: number, current_value: number) {
        try {
            const updated = await updateObjectiveProgress(id, current_value)
            setObjectives(prev => prev.map(o => o.id === id ? updated : o))
        } catch (err) {
            console.error(err)
        }
    }

    async function handleAbandon(id: number) {
        try {
            const updated = await updateObjectiveStatus(id, "abandoned")
            setObjectives(prev => prev.map(o => o.id === id ? updated : o))
        } catch (err) {
            console.error(err)
        }
    }

    async function handleDelete(id: number) {
        try {
            await deleteObjective(id)
            setObjectives(prev => prev.filter(o => o.id !== id))
        } catch (err) {
            console.error(err)
        }
    }

    const activeObjectives = objectives.filter(o => o.status === "active")
    const completedObjectives = objectives.filter(o => o.status === "completed")

    return {
        navigate,
        loading,
        objectives,
        templates,
        activeObjectives,
        completedObjectives,
        showCreateForm, setShowCreateForm,
        showCatalogue, setShowCatalogue,
        title, setTitle,
        description, setDescription,
        emoji, setEmoji,
        targetValue, setTargetValue,
        targetUnit, setTargetUnit,
        deadline, setDeadline,
        handleCreateObjective,
        handleAdoptTemplate,
        handleUpdateProgress,
        handleAbandon,
        handleDelete,
    }
}