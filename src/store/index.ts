import {
    Store,
    Dispatchable,
    State,
    Selector,
    Subscriber,
    Subscription,
    Metadata,
    StoreArgs,
    Middleware,
} from '../types'
import { pipe, maybesOf } from '../utils'

import { EnvironmentObject } from '../environment'

const createStoreId = ():string => `iotes_${Math.random().toString(16).substr(2, 8)}`

const createDefaultMetadata = (storeId: string, channel: string): Metadata => () => ({
    '@@iotes_timestamp': Date.now().toString(),
    '@@iotes_storeId': { [storeId]: true },
    '@@iotes_channel': channel,
})

export const createStore = ({
    channel,
    hooks = {},
    errorHandler,
}: StoreArgs): Store => {
    const storeId = createStoreId()
    const metadata = createDefaultMetadata(storeId, channel)

    // hooks
    const {
        preSubscribeHooks = [(subscriber: Subscriber) => subscriber],
        postSubscribeHooks = [(_: Subscriber) => {}],
        preMiddlewareHooks = [(d: Dispatchable) => d],
        postMiddlewareHooks = [(d: Dispatchable) => d],
        preUpdateHooks = [(s: State) => s],
    } = hooks || {}

    const { logger } = EnvironmentObject
    type ShouldUpdateState = boolean

    const nullSubscriber: Subscriber = [(_: State) => {}, [], []]

    let state: State = {}
    let subscribers: Subscriber[] = [nullSubscriber]

    const subscribe = (
        subscription: Subscription,
        selector?: Selector,
        middlewares: Middleware[] = [(s) => s],
    ) => {
        const subscriber: Subscriber = [subscription, selector, middlewares]
        const postHooksSubscriber = pipe(...maybesOf(preSubscribeHooks))(subscriber)
        subscribers = [...subscribers, postHooksSubscriber]
        postSubscribeHooks.forEach((postSubscribeHook) => { postSubscribeHook(subscriber) })
    }

    const applySelectors = (selectors: string[]) => (
        selectors.reduce((
            a: { [key: string]: any },
            selector: string,
        ) => (
            state[selector]
                ? { ...a, [selector]: state[selector] }
                : a
        ),
        {})
    )

    const updateSubscribers = (dispatchable: State) => {
        logger.log(`Subscriber to receive state: ${JSON.stringify(state, null, 2)}`)

        const preUpdateAppliedState = (
            pipe(...maybesOf(preUpdateHooks))(dispatchable) || {}
        )

        subscribers.forEach((subscriber: Subscriber) => {
            const [subscription, selector, middlewares] = subscriber

            const stateSelection = selector ? applySelectors(selector) : state

            // Apply middlewares
            const preMiddlewareAppliedState: State = (
                pipe(...maybesOf(preMiddlewareHooks))(preUpdateAppliedState) || {}
            )

            const middlewareAppliedState: State = (
                pipe(...maybesOf(middlewares))(preMiddlewareAppliedState) || {}
            )

            const postMiddlewareAppliedState: State = (
                pipe(...postMiddlewareHooks)(middlewareAppliedState) || {}
            )

            const shouldUpdate: boolean = selector
                ? !!selector.filter((s) => preUpdateAppliedState[s])[0]
                : true
            if (!shouldUpdate) return


            // Dipatch to subs
            if (Object.keys(postMiddlewareAppliedState).length !== 0) {
                subscription({ ...stateSelection, ...postMiddlewareAppliedState })
            }
        })
    }

    const isObjectLiteral = (testCase:{[key: string] : {[key: string]: any}}) => {
        if (Object.getPrototypeOf(testCase) !== Object.getPrototypeOf({})) return false


        if (Object.keys(testCase).some((e) => (
            Object.getPrototypeOf(testCase[e]) !== Object.getPrototypeOf({})
        ))) {
            return false
        }

        let keys = []
        try {
            keys = Object.keys(testCase)
            if (keys.length === 0) return false
        } catch {
            return false
        }

        return keys.reduce((a: boolean, v: string | number) => (testCase[v] ? a : false), true)
    }

    const unwrapDispatchable = (dispatchable: Dispatchable): [State, ShouldUpdateState] => {
        if (dispatchable instanceof Error) return [errorHandler(dispatchable, state), false]

        // Check if this store has previously seen dispatchable
        const deltaDispatchable: State = Object.keys(dispatchable).filter((key: string) => {
            const storesFromDispatchable = dispatchable[key]?.['@@iotes_storeId']
            if (storesFromDispatchable && storesFromDispatchable[storeId]) return false
            return true
        }).reduce(
            (a, key) => ({ ...a, [key]: dispatchable[key] }), {},
        )

        if (isObjectLiteral(deltaDispatchable)) {
            const dispatchableId = {
                '@@iotes_dispatchableId': `iotes_dId_${Math.random().toString(16).substr(2, 8)}`,
            }

            const mdata = metadata()

            const metaDispatchable = Object.keys(deltaDispatchable).reduce((a, key) => (
                {
                    ...a,
                    [key]: {
                        ...dispatchableId,
                        ...deltaDispatchable[key],
                        ...mdata,
                        '@@iotes_storeId': {
                            ...deltaDispatchable[key]['@@iotes_storeId'],
                            ...mdata['@@iotes_storeId'],
                        },
                    },
                }
            ), {})

            return [metaDispatchable, true]
        }

        return [{}, false]
    }

    const setState = (newState: State, callback: () => void) => {
        state = { ...state, ...newState }
        callback()
    }

    const dispatch = (dispatchable: Dispatchable) => {
        const [unwrappedDispatchable, shouldUpdateState] = unwrapDispatchable(dispatchable)

        if (shouldUpdateState) {
            setState(unwrappedDispatchable, () => { updateSubscribers(unwrappedDispatchable) })
        }
    }

    return {
        dispatch,
        subscribe,
    }
}
