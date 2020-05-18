import { createStore } from './store'
import { EnvironmentObject } from './environment'
import { createLogger } from './logger'
import { createIntegration } from './integrate'
import { identityPlugin } from './plugins/identity'

import {
    Iotes,
    CreateIotes,
    DeviceDispatchable,
    HostDispatchable,
    Dispatchable,
    Direction,
    IotesHooks,
    IotesEvents,
    IotesHook,
} from './types'

import {
    createDeviceDispatchable,
    createHostDispatchable,
    insertMetadata,
    mapDispatchable,
} from './utils'

const HookFactory = (hooks: IotesHooks = []) => {
    const defaultHook: IotesEvents = {
        preCreate: () => {},
        postCreate: () => {},
        preSubscribe: () => {},
        postSubscribe: (s) => {},
        preUpdate: (d) => d,
    }

    const createdHooks: IotesEvents[] = hooks
        .filter((e) => e)
        .map((hook) => ({ ...defaultHook, ...hook() }))

    return {
        preCreateHooks: createdHooks.map((e) => e.preCreate),
        postCreateHooks: createdHooks.map((e) => e.postCreate),
        preSubscribeHooks: createdHooks.map((e) => e.preSubscribe),
        postSubscribeHooks: createdHooks.map((e) => e.postSubscribe),
        preUpdateHooks: createdHooks.map((e) => e.preUpdate),
    }
}

const createIotes: CreateIotes = ({
    topology,
    strategy,
    plugin = identityPlugin,
    logLevel,
    logger,
    hooks,
}): Iotes => {
    // Set up logger
    EnvironmentObject.logger = createLogger(logger, logLevel)
    const env = EnvironmentObject

    // set up hooks
    const createdHooks = HookFactory(hooks)
    const { preCreateHooks, postCreateHooks, ...storeHooks } = createdHooks

    // Run pre create hooks
    preCreateHooks.forEach((preCreateHook) => preCreateHook())

    // Set up stores
    EnvironmentObject.stores = {
        ...EnvironmentObject.stores,
        host$: createStore({ hooks: storeHooks }),
        device$: createStore({ hooks: storeHooks }),
    }

    const { host$, device$ } = EnvironmentObject.stores

    const createDirectionalDispatch = (
        dispatch: (e: any) => void, direction: Direction,
    ) => (dispatchable: Dispatchable) => (
        dispatch(mapDispatchable(dispatchable, (e) => ({ ...e, '@@iotes_direction': direction })))
    )

    try {
        createIntegration(strategy({
            hostDispatch: createDirectionalDispatch(host$.dispatch, 'I'),
            deviceDispatch: createDirectionalDispatch(device$.dispatch, 'I'),
            hostSubscribe: host$.subscribe,
            deviceSubscribe: device$.subscribe,
        }), topology)
    } catch (error) {
        if (error && error.length > 0) { throw Error(error) }
        throw Error('Failed to create Integration for unknown reasons. Did you pass the result of a function call instead of a function?')
    }

    const { client } = topology

    // Run post create hooks
    postCreateHooks.forEach((postCreateHook) => postCreateHook())

    return plugin({
        hostSubscribe: host$.subscribe,
        deviceSubscribe: device$.subscribe,
        // wrap dispatch with source value
        hostDispatch: (dispatchable: HostDispatchable) => {
            env.logger.info(`Host dispatch recieved ${dispatchable}`)
            const hostDispatchable = insertMetadata(dispatchable, { busChannel: 'HOST' })
            createDirectionalDispatch(host$.dispatch, 'O')(hostDispatchable)
        },
        deviceDispatch: <Payload extends {[key: string] : any}>(
            dispatchable: DeviceDispatchable<Payload>,
        ) => {
            env.logger.info(`Device dispatch recieved ${JSON.stringify(dispatchable, null, 2)}`)
            const deviceDispatchable = insertMetadata(dispatchable, { busChannel: 'DEVICE' })
            createDirectionalDispatch(device$.dispatch, 'O')(deviceDispatchable)
        },
    })
}

export {
    createIotes,
    createDeviceDispatchable,
    createHostDispatchable,
}
