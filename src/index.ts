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
} from './types'

import {
    createDeviceDispatchable,
    createHostDispatchable,
    insertMetadata,
    mapDispatchable,
} from './utils'

const createIotes: CreateIotes = ({
    topology,
    strategy,
    plugin = identityPlugin,
    logLevel,
    logger,
}): Iotes => {
    // Set up logger
    EnvironmentObject.logger = createLogger(logger, logLevel)
    const env = EnvironmentObject

    // Set up stores
    EnvironmentObject.stores = {
        ...EnvironmentObject.stores,
        host$: createStore(),
        device$: createStore(),
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
