import {
    DeviceDispatchable, HostDispatchable, HostConnectionType,
    CreateDeviceDispatchable, CreateHostDispatchable, ErrorDispatchable,
} from '../types'

export const createDeviceDispatchable: CreateDeviceDispatchable = <
  Types extends string = string,
  Payload extends {[key: string]: any} = {},
  Meta extends {[key: string]: any} = {}
>(
        name: string,
        type: Types,
        payload: Payload,
        meta?: Meta,
        error?: ErrorDispatchable,
    ): DeviceDispatchable<Payload> => ({
        [name]: {
            type,
            name,
            payload,
            meta,
            error: error || null,
        },
    })

export const createHostDispatchable: CreateHostDispatchable = <
    Payload extends {[key: string]: any} = {},
    Meta extends {[key: string]: any} = {}
> (
        name: string,
        type: HostConnectionType,
        payload: Payload,
        meta?: Meta,
        error?: ErrorDispatchable,
    ): HostDispatchable<Payload> => ({
        [name]: {
            type,
            name,
            payload,
            meta,
            error: error || null,
        },
    })

export const loopbackGuard = (
    deviceName: string,
    state: {[key: string]: { [key: string]: unknown, '@@source': string } },
    client: {[key: string]: unknown, name: string },
    callback: (...args: any[]) => void,
) => {
    if (state[deviceName] && state[deviceName]['@@source'] === client.name) {
        callback()
    }
}
