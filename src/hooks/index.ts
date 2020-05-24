import {
    CreateIotesHook, IotesHook, Subscriber, IotesEvents, Iotes, Dispatchable,
} from '../types'

import { createDeviceDispatchable } from '../index'

type HistoryHookStatus = 'LOCAL_ONLY' | 'REMOTE_ONLY' | 'ALL'

type HistoryHookArgs = [
    (() => Promise<any[]>)?,
    boolean?
]

const historyHook: CreateIotesHook<HistoryHookArgs> = (
    remoteSource = async () => [],
    shouldLoadLocal = false,
): IotesHook => (): IotesEvents => {
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
        const { deviceDispatch } = iotes

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
                deviceDispatch(createDeviceDispatchable('IOTES_HISTORY_HOOK', 'LOCAL_ONLY', { localHistory }))
            }
        }

        if (remoteSource) {
            const data = await remoteSource()
            if (data[0]) {
                setHistory([...data, ...history])
                status = 'ALL'
                deviceDispatch(createDeviceDispatchable('IOTES_HISTORY_HOOK', 'REMOTE_ONLY', { history }))
            }
        }
    }

    const postSubscribe = (newSubscriber: Subscriber) => {
        const [subscription] = newSubscriber

        subscription(createDeviceDispatchable('IOTES_HISTORY_HOOK', status, { history }))
    }

    const preUpdate = (dispatchable: Dispatchable) => {
        setLocalHistory([...localHistory, dispatchable])
        setHistory([...history, dispatchable])
        return dispatchable
    }

    return {
        postCreate,
        device: {
            postSubscribe,
            preUpdate,
        },
        host: {
            postSubscribe,
            preUpdate,
        },
    }
}

export const createHistory = historyHook
