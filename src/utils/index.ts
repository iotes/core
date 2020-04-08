import {
    DeviceDispatchable, HostDispatchable, HostConnectionType,
    CreateDeviceDispatchable, CreateHostDispatchable,
} from '../types'

export const createDeviceDispatchable: CreateDeviceDispatchable = <
  Types extends string = string, Payload extends {[key: string]: any} = {}
>(
        name: string,
        type: Types,
        payload: Payload,
    ): DeviceDispatchable<Payload> => ({
        [name]: {
            type,
            name,
            meta: {
                timestamp: Date.now().toString(),
                host: '',
            },
            payload,
        },
    })

export const createHostDispatchable: CreateHostDispatchable = <
    Payload extends {[key: string]: any} = {}
> (
        name: string,
        type: HostConnectionType,
        payload: Payload,
    ): HostDispatchable<Payload> => ({
        [name]: {
            type,
            name,
            meta: {},
            payload,
        },
    })
