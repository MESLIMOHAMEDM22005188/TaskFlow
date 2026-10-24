import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
    getObjectives, getObjectiveTemplates, createObjective,
    adoptTemplate, updateObjectiveProgress, updateObjectiveStatus, deleteObjective
} from "./taskService"
import type { Objective, ObjectiveTemplate } from "./taskService"
import { LOCAL_OBJECTIVE_CATALOG } from "../data/objectiveCatalog"

function normalizeObjectiveTitle(value: string | null | undefined) {
    return (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().replace(/\s+/g, " ").toLocaleLowerCase("fr-FR")
}

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
                const merged: ObjectiveTemplate[] = [...LOCAL_OBJECTIVE_CATALOG]
                const knownTitles = new Set(LOCAL_OBJECTIVE_CATALOG.map(template => normalizeObjectiveTitle(template.title)))
                for (const template of tmps) {
                    const key = normalizeObjectiveTitle(template.title)
                    if (!knownTitles.has(key)) {
                        merged.push(template)
                        knownTitles.add(key)
                    }
                }
                setTemplates(merged)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                // Le catalogue local reste utilisable si l'API des modèles est indisponible.
                setTemplates(LOCAL_OBJECTIVE_CATALOG)
                setLoading(false)
            })
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
            const template = templates.find(item => item.id === templateId)
            if (templateId < 0 && template) {
                const alreadyActive = objectives.some(objective =>
                    objective.status === "active" &&
                    normalizeObjectiveTitle(objective.title) === normalizeObjectiveTitle(template.title)
                )
                if (alreadyActive) {
                    alert("Cet objectif est déjà présent dans ta liste.")
                    return
                }
                let computedDeadline: string | null = null
                if (template.suggested_days) {
                    const date = new Date()
                    date.setDate(date.getDate() + template.suggested_days)
                    computedDeadline = String(date.getFullYear()) + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0")
                }
                const obj = await createObjective({
                    title: template.title,
                    description: template.description || undefined,
                    emoji: template.emoji || undefined,
                    target_value: template.target_value,
                    target_unit: template.target_unit || undefined,
                    deadline: computedDeadline
                })
                setObjectives(prev => [obj, ...prev])
            } else {
                const obj = await adoptTemplate(templateId)
                setObjectives(prev => [obj, ...prev])
            }
            setShowCatalogue(false)
        } catch (err) {
            console.error(err)
            alert("Impossible d’ajouter cet objectif. Réessaie dans un instant.")
        }
    }

    async function handleUpdateProgress(id: number, current_value: number) {
        const safeValue = Math.max(0, Math.floor(Number(current_value) || 0))
        const previous = objectives.find(objective => objective.id === id)
        if (!previous) return

        const numericTarget = previous.target_value == null ? null : Number(previous.target_value)
        const optimisticStatus = numericTarget !== null && safeValue >= numericTarget
            ? "completed"
            : previous.status === "completed" ? "active" : previous.status

        // Met à jour l'interface sans attendre le serveur.
        setObjectives(prev => prev.map(objective =>
            objective.id === id
                ? { ...objective, current_value: safeValue, status: optimisticStatus }
                : objective
        ))

        try {
            const updated = await updateObjectiveProgress(id, safeValue)
            setObjectives(prev => prev.map(objective => objective.id === id ? updated : objective))
        } catch (err) {
            console.error("Impossible d’enregistrer la progression de l’objectif :", err)
            // Retour à la valeur précédente si l'API refuse la modification.
            setObjectives(prev => prev.map(objective => objective.id === id ? previous : objective))
            alert("La progression n’a pas pu être enregistrée. Vérifie ta connexion puis réessaie.")
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