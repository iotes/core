import { Direction, State } from '../types'

export const direction = (d: Direction) => (state: State) => {
    if (d === undefined || d === null) return state
    if (d === 'B') return state
    return Object.entries(state).reduce((a, [key, value]) => {
        const shouldInclude = (d === value['@@iotes_direction'])
        return shouldInclude ? { ...a, [key]: value } : {}
    }, {})
}
