import { createStore } from './store'
import { EnvironmentObject } from './environment'
import { createLogger } from './logger'
import { createIntegration } from './integration'
import { identityPlugin } from './plugins/identity'

import {
    Iotes,
    CreateIotes,
    DeviceDispatchable,
    HostDispatchable,
} from './types'

import {
    createDeviceDispatchable,
    createHostDispatchable,
    loopbackGuard,
} from './utils'

const insertMetadata = <Payload extends { [key: string]: any }>(
    dispatchable: HostDispatchable | DeviceDispatchable<Payload>,
    meta: {[key: string]: string | number},
) => (
        Object.keys(dispatchable).reduce((a, key) => ({
            ...a,
            [key]: { ...dispatchable[key], ...meta },
        }), {})
    )


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

    try {
        createIntegration(strategy({
            hostDispatch: host$.dispatch,
            deviceDispatch: device$.dispatch,
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
            const hostDispatchable = insertMetadata(dispatchable, { '@@source': client.name, '@@bus': 'Host' })
            host$.dispatch(hostDispatchable)
        },
        deviceDispatch: <Payload extends {[key: string] : any}>(
            dispatchable: DeviceDispatchable<Payload>,
        ) => {
            env.logger.info(`Device dispatch recieved ${JSON.stringify(dispatchable, null, 2)}`)
            const deviceDispatchable = insertMetadata(dispatchable, { '@@source': client.name, '@@bus': 'Device' })
            device$.dispatch(deviceDispatchable)
        },
    })
}

export {
    createIotes,
    createDeviceDispatchable,
    createHostDispatchable,
    loopbackGuard,
}
