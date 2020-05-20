import {
    IotesHook, Subscriber, IotesEvents, Iotes, Dispatchable,
} from '../types'

import { createDeviceDispatchable } from '../index'

type HistoryHookStatus = 'LOCAL_ONLY' | 'REMOTE_ONLY' | 'ALL'

const historyHook: IotesHook = (
    remoteSource?: () => Promise<{data: any[], etag: string}>,
    shouldLoadLocal: boolean = false,
): IotesEvents => {
    let history: any[] = []
    let localHistory: any[] = []

    const setHistory = (newHistory: any[]) => {
        history = newHistory
    }

    const setLocalHistory = (newHistory: any[]) => {
        if (typeof window !== 'undefined') {
            localHistory = newHistory
            window.localStorage.setItem('IOTES_LOCAL_HISTORY', JSON.stringify(localHistory))
        }
    }

    let status: HistoryHookStatus = 'LOCAL_ONLY'

    const postCreate = async (iotes: Iotes) => {
        if (shouldLoadLocal && typeof window !== 'undefined') {
            let fromLocalStorage: any[]
            try {
                fromLocalStorage = JSON.parse(localStorage.getItem('IOTES_LOCAL_HISTORY'))
            } catch {
                console.warn('Unable to retreive local history from local storage,')
                fromLocalStorage = []
            }

            setLocalHistory([...localHistory, ...fromLocalStorage])

            if (localHistory.length > 0) {
                createDeviceDispatchable('IOTES_HISTORY_HOOK', 'LOCAL_ONLY', { localHistory })
            }
        }

        if (remoteSource) {
            const { data = [] } = await remoteSource()
            setHistory([...data, ...history])
            status = 'ALL'
            createDeviceDispatchable('IOTES_HISTORY_HOOK', 'REMOTE_ONLY', { history })
        }
    }

    const postSubscribe = (newSubscriber: Subscriber) => {
        const [subscription] = newSubscriber
        subscription(createDeviceDispatchable('IOTES_HISTORY_HOOK', status, { history }))
    }

    const postMiddleware = (dispatchable: Dispatchable) => {
        console.log('dispatchable', dispatchable)
        setLocalHistory([...localHistory, dispatchable])
        setHistory([...history, dispatchable])
        return dispatchable
    }

    return {
        postCreate,
        postSubscribe,
        postMiddleware,
    }
}

export const history = historyHook
