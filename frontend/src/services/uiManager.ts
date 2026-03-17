import type { Dispatch, SetStateAction } from "react"

export function toggle(
    setter: Dispatch<SetStateAction<boolean>>
) {
    setter(prev => !prev)
}

export function closeAll(
    setTask: Dispatch<SetStateAction<boolean>>,
    setTheme: Dispatch<SetStateAction<boolean>>
) {
    setTask(false)
    setTheme(false)
}