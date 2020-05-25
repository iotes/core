import {
    DeviceDispatchable, HostDispatchable,
    CreateDeviceDispatchable, CreateHostDispatchable, Dispatchable,
} from '../types'

export const createDeviceDispatchable: CreateDeviceDispatchable = (
    name, type, payload, meta = {}, source, error,
) => ({
    [name]: {
        type,
        name,
        source,
        payload,
        meta,
        error: error || null,
    },
})

export const createHostDispatchable: CreateHostDispatchable = (
    name, type, payload, meta = {}, source, error,
) => ({
    [name]: {
        type,
        name,
        source,
        payload,
        meta,
        error: error || null,
    },
})

type O = {[key: string]: any}

export const mapDispatchable = (dispatchable: Dispatchable, fn: (e: O) => O) => (
    Object.entries(dispatchable).reduce((a, entry) => {
        const [device, body] = entry

        return ({
            ...a,
            [device]: fn(body),
        })
    }, {})
)

export const insertMetadata = <Payload extends { [key: string]: any }>(
    dispatchable: HostDispatchable | DeviceDispatchable<Payload>,
    meta: {[key: string]: string | number},
) => (
        mapDispatchable(dispatchable, ((e) => (
            { ...e, meta: { ...e.meta, ...meta } }
        )))
    )
