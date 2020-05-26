import {
    DeviceDispatchable,
    HostDispatchable,
    CreateDeviceDispatchable,
    CreateHostDispatchable,
    Dispatchable,
    AnyFunction,
    MaybePipe,
    Pipe,
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

export const pipe: Pipe = (
    ...fns: AnyFunction[]
) => <T>(
    state: T,
) => (Array.from(fns).reduce((v, fn) => fn(v), state))

export const maybe = (fn: AnyFunction | undefined | null, ...args: any[]) => {
    if (typeof fn !== 'function') return undefined

    return fn(...args)
}

export const maybesOf = (fns: AnyFunction[]) => (
    fns.map((fn) => (...args: any[]) => maybe(fn, ...args))
)

export const maybePipe: MaybePipe = (...fns: AnyFunction[]) => pipe(...maybesOf(fns))
