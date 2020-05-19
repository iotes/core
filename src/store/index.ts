import {
    Store,
    Dispatchable,
    State,
    Selector,
    Subscriber,
    Subscription,
    Metadata,
    StoreHooks,
    Middleware,
} from '../types'
import { EnvironmentObject } from '../environment'

const createStoreId = ():string => `iotes_${Math.random().toString(16).substr(2, 8)}`

const createDefaultMetadata = (storeId: string): Metadata => () => ({
    '@@iotes_timestamp': Date.now().toString(),
    '@@iotes_storeId': { [storeId]: true },
})

type AnyFunction = (...args: any[]) => any

const compose = (
    ...fns: AnyFunction[]
) => (
    state: State = {},
) => (
    fns.reduceRight((v, fn) => fn(v), state)
)

const maybe = (fn: AnyFunction | null | undefined, ...args: any[]) => {
    if (!fn) return undefined
    return fn(...args)
}

const maybesOf = (fns: AnyFunction[]) => (
    fns.map((fn) => (...args: any[]) => maybe(fn, ...args))
)

type StoreArgs = {
  hooks?: StoreHooks
  errorHandler?: (error: Error, currentState?: State) => State
}

export const createStore = ({
    hooks,
    errorHandler,
}: StoreArgs): Store => {
    const storeId = createStoreId()
    const metadata = createDefaultMetadata(storeId)

    // hooks
    const {
        preSubscribeHooks = [() => {}],
        postSubscribeHooks = [(subscriber: Subscriber) => {}],
        preUpdateHooks = [(s: State) => s],
    } = hooks || {}

    const { logger } = EnvironmentObject
    type ShouldUpdateState = boolean

    let state: State = {}
    let subscribers: Subscriber[] = []

    const subscribe = (
        subscription: Subscription,
        selector?: Selector,
        middlewares: Middleware[] = [(s) => s],
    ) => {
        const subscriber: Subscriber = [subscription, selector, middlewares]
        preSubscribeHooks.forEach((preSubscribeHook) => { preSubscribeHook() })
        subscribers = [...subscribers, subscriber]
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

    const updateSubscribers = (newState: State) => {
        logger.log(`Subscriber to receive state: ${JSON.stringify(state, null, 2)}`)
        subscribers.forEach((subscriber: Subscriber) => {
            const [subscription, selector, middlewares] = subscriber
            const shouldUpdate: boolean = selector ? !!selector.filter((s) => newState[s])[0] : true
            if (!shouldUpdate) return

            const stateSelection = selector ? applySelectors(selector) : state
            const hookAppliedState = compose(...preUpdateHooks)(stateSelection)
            const middlewareAppliedState = compose(...maybesOf(middlewares))(newState) || {}
            if (Object.keys(middlewareAppliedState).length !== 0) {
                subscription({ ...hookAppliedState, ...middlewareAppliedState })
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

        // Check if this store has previously sene dispatchable
        const deltaDispatchable: State = Object.keys(dispatchable).filter((key: string) => {
            const storesFromDispatchable = dispatchable[key]?.['@@iotes_storeId']
            if (storesFromDispatchable && storesFromDispatchable[storeId]) return false
            return true
        }).reduce(
            (a, key) => ({ ...a, [key]: dispatchable[key] }), {},
        )

        if (isObjectLiteral(deltaDispatchable)) {
            const metaDispatchable = Object.keys(deltaDispatchable).reduce((a, key) => (
                { ...a, [key]: { ...deltaDispatchable[key], ...metadata() } }
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
