import {
    DeviceDispatchable, HostDispatchable, HostConnectionType,
    CreateDeviceDispatchable, CreateHostDispatchable, ErrorDispatchable,
} from '../types'

export const createDeviceDispatchable: CreateDeviceDispatchable = <
  Types extends string = string, Payload extends {[key: string]: any} = {}
>(
        name: string,
        type: Types,
        payload: Payload,
        error?: ErrorDispatchable,
    ): DeviceDispatchable<Payload> => ({
        [name]: {
            type,
            name,
            meta: {
                timestamp: Date.now().toString(),
                host: '',
            },
            payload,
            error: error || null,
        },
    })

export const createHostDispatchable: CreateHostDispatchable = <
    Payload extends {[key: string]: any} = {}
> (
        name: string,
        type: HostConnectionType,
        payload: Payload,
        error?: ErrorDispatchable,
    ): HostDispatchable<Payload> => ({
        [name]: {
            type,
            name,
            meta: {},
            payload,
            error: error || null,
        },
    })
