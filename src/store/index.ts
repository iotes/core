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

const createDefaultMetadata: Metadata = () => ({
    '@@timestamp': Date.now().toString(),
    '@@wasHandledByStore': true,
})

export const createStore = (
    metadata: Metadata = createDefaultMetadata,
    errorHandler?: (error: Error, currentState?: State) => State,
): Store => {
    const { logger } = EnvironmentObject
    type ShouldUpdateState = boolean

    let state: State = {}
    let subscribers: Subscriber[] = []

    const subscribe = (subscription: Subscription, selector?: Selector) => {
        const subscriber: Subscriber = [subscription, selector]
        subscribers = [...subscribers, subscriber]
    }

    const applySelectors = (selectors: string[]) => (
        selectors.reduce((
            a: { [key: string]: any },
            selector: string,
        ) => (
            state[selector]
                ? { ...a, ...state[selector] }
                : a
        ),
        {})
    )

    const updateSubscribers = () => {
        logger.log(`Subscriber to receive state: ${JSON.stringify(state, null, 2)}`)
        subscribers.forEach((subscriber: Subscriber) => {
            const [subscription, selector] = subscriber
            const stateSelection = selector ? applySelectors(selector) : state
            if (Object.keys(stateSelection).length !== 0) subscription(stateSelection)

            subscription(state)
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

        const deltaDispatchable: State = Object.keys(dispatchable).filter((key: string) => (
            dispatchable[key] ? !dispatchable[key]['@@wasHandledByStore'] : false
        )).reduce(
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

        if (shouldUpdateState) setState(unwrappedDispatchable, updateSubscribers)
    }

    return {
        dispatch,
        subscribe,
    }
}
