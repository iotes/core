import { Direction, State, Middleware } from '../types'

export const direction = (d: Direction): Middleware => (state: State) => {
    if (d === undefined || d === null) return state
    if (d === 'B') return state
    return Object.entries(state).reduce((a, [key, value]) => {
        const shouldInclude = (d === value['@@iotes_direction'])
        return shouldInclude ? { ...a, [key]: value } : {}
    }, {})
}


export const debounce = (time: number): Middleware => {
    let shouldDispatch = true

    return (state: State) => {
        if (!shouldDispatch) return null

        shouldDispatch = false
        setTimeout(() => { shouldDispatch = true }, time)
        return state
    }
}
