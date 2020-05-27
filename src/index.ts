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
    StoreHook,
    StrategyHook,
} from './types'

import {
    createDeviceDispatchable,
    createHostDispatchable,
    maybePipe,
    mapDispatchable,
} from './utils'

const HookFactory = (hooks: IotesHooks = []) => {
    const defaultHook: Omit<IotesEvents, 'host' | 'device'> = {
        preCreate: () => {},
        postCreate: () => {},
    }

    const defaultStoreHook: StoreHook & StrategyHook = {
        preSubscribe: (s) => s,
        preMiddleware: (d) => d,
        postMiddleware: (d) => d,
        postSubscribe: (_) => {},
        preUpdate: (s) => s,
        preDispatch: (d) => d,
    }


    const createdHooks: IotesEvents[] = hooks
        .filter((e) => e)
        .filter((e) => typeof e === 'function')
        .map((hook) => hook())
        .map((hook) => ({
            ...defaultHook,
            ...hook,
            host: { ...defaultStoreHook, ...hook.host },
            device: { ...defaultStoreHook, ...hook.device },
        }))

    return {
        preCreateHooks: createdHooks.map((e) => e.preCreate),
        postCreateHooks: createdHooks.map((e) => e.postCreate),
        hostHooks: {
            preSubscribeHooks: createdHooks.map((e) => e.host.preSubscribe),
            postSubscribeHooks: createdHooks.map((e) => e.host.postSubscribe),
            preMiddlewareHooks: createdHooks.map((e) => e.host.preMiddleware),
            postMiddlewareHooks: createdHooks.map((e) => e.host.postMiddleware),
            preUpdateHooks: createdHooks.map((e) => e.host.preUpdate),
        },
        deviceHooks: {
            preSubscribeHooks: createdHooks.map((e) => e.device.preSubscribe),
            postSubscribeHooks: createdHooks.map((e) => e.device.postSubscribe),
            preMiddlewareHooks: createdHooks.map((e) => e.device.preMiddleware),
            postMiddlewareHooks: createdHooks.map((e) => e.device.postMiddleware),
            preUpdateHooks: createdHooks.map((e) => e.device.preUpdate),
        },
        strategyHooks: {
            host: {
                preDispatchHooks: createdHooks.map((e) => e.host.preDispatch),
            },
            device: {
                preDispatchHooks: createdHooks.map((e) => e.device.preDispatch),
            },
        },
    }
}

const createIotes: CreateIotes = ({
    topology,
    strategy,
    plugin = identityPlugin,
    logLevel,
    logger,
    lifecycleHooks = [],
}): Iotes => {
    // Set up logger
    EnvironmentObject.logger = createLogger(logger, logLevel)
    const env = EnvironmentObject

    // set up hooks
    const createdHooks = HookFactory(lifecycleHooks)
    const {
        preCreateHooks, postCreateHooks, deviceHooks, hostHooks, strategyHooks,
    } = createdHooks

    // Run pre create hooks
    preCreateHooks.forEach((preCreateHook) => {
        preCreateHook()
    })

    // Set up stores
    EnvironmentObject.stores = {
        ...EnvironmentObject.stores,
        host$: createStore({ channel: 'HOST', hooks: hostHooks }),
        device$: createStore({ channel: 'DEVICE', hooks: deviceHooks }),
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
        }, strategyHooks), topology)
    } catch (error) {
        if (error && error.length > 0) { throw Error(error) }
        throw Error('Failed to create Integration for unknown reasons. Did you pass the result of a function call instead of a function?')
    }

    const iotes = {
        hostSubscribe: host$.subscribe,
        deviceSubscribe: device$.subscribe,
        // wrap dispatch with source value
        hostDispatch: (dispatchable: HostDispatchable) => {
            env.logger.info(`Host dispatch recieved ${dispatchable}`)
            createDirectionalDispatch(host$.dispatch, 'O')(dispatchable)
        },
        deviceDispatch: <Payload extends {[key: string] : any}>(
            dispatchable: DeviceDispatchable<Payload>,
        ) => {
            env.logger.info(`Device dispatch recieved ${JSON.stringify(dispatchable, null, 2)}`)
            createDirectionalDispatch(device$.dispatch, 'O')(dispatchable)
        },
    }

    // Run post create hooks
    postCreateHooks.forEach((postCreateHook) => {
        postCreateHook(iotes)
    })

    return plugin(iotes)
}

// EXPORTS
export {
    createIotes,
    createDeviceDispatchable,
    createHostDispatchable,
    maybePipe,
    mapDispatchable,
}
