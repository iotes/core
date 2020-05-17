import {
    Store,
    Dispatchable,
    State,
    Selector,
    Subscriber,
    Subscription,
    Metadata,
} from '../types'
import { EnvironmentObject } from '../environment'

const createStoreId = ():string => `iotes_${Math.random().toString(16).substr(2, 8)}`

const createDefaultMetadata = (storeId: string): Metadata => () => ({
    '@@iotes_timestamp': Date.now().toString(),
    '@@iotes_storeId': { [storeId]: true },
})

type IotesEvents = {
  preCreate?: ((args: any | any[]) => void), // blocks creation
  postCreate? : ((args: any | any[]) => void),
  preSubscribe?: ((args: any | any[]) => void),
  postSubscribe?: (newSubscriber: Subscriber) => {},
  preUpdate?: (dispatchable: Dispatchable) => Dispatchable,
}

type IotesHook = (args: any | any[]) => IotesEvents

type IotesHooks = IotesHook[]

const HookFactory = (hooks: IotesHooks) => {

    // const createdHooks: IotesEvents[] = hooks.forEach((hook) => hook())

    // return {
    //  preCreates: hooks.map((e) => e.preCreate)
    // }
}

export const createStore = (
    hooks: IotesHooks,
    errorHandler?: (error: Error, currentState?: State) => State,
): Store => {
    const storeId = createStoreId()
    const metadata = createDefaultMetadata(storeId)

    const { logger } = EnvironmentObject
    type ShouldUpdateState = boolean

    let state: State = {}
    let subscribers: Subscriber[] = []

    const subscribe = (subscription: Subscription, selector?: Selector) => {
        const subscriber: Subscriber = [subscription, selector]
        preSubscribes(subscriber)
        subscribers = [...subscribers, subscriber]
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
            const [subscription, selector] = subscriber
            const shouldUpdate: boolean = selector ? !!selector.filter((s) => newState[s])[0] : true
            if (!shouldUpdate) return

            const stateSelection = selector ? applySelectors(selector) : state
            if (Object.keys(stateSelection).length !== 0) {
                subscription(stateSelection)
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
