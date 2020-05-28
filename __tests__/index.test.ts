import {
    StrategyConfig,
    DeviceTypes,
    createTestStrategy,
    config,
    wait,
} from '@iotes/strategy-test'

import {
    createIotes,
    createDeviceDispatchable,
    createHostDispatchable,
} from '../src'

import {
    Store,
    Iotes,
    Strategy,
} from '../src/types'

// MODULE
let remote: Store
let strategy: Strategy<StrategyConfig, DeviceTypes>
let iotes: Iotes

describe('Iotes core', () => {
    // SET UP
    beforeEach(() => {
        [remote, strategy] = createTestStrategy()
        iotes = createIotes({
            topology: config.topology,
            strategy,
        })
    })

    afterEach(() => {
        iotes = null
    })

    // TESTS
    test('Can create Integration', () => {
        expect(() => {
            iotes = createIotes({
                topology: config.topology,
                strategy,
            })
        }).not.toThrowError()
        expect(iotes).toHaveProperty('hostSubscribe')
        expect(iotes).toHaveProperty('deviceSubscribe')
        expect(iotes).toHaveProperty('hostSubscribe')
        expect(iotes).toHaveProperty('deviceDispatch')
    })

    test('Integrated host dispatches correctly', async () => {
        let result: any = null
        iotes.hostSubscribe((state: any) => { result = state })

        await wait()

        expect(result[config.topology.hosts[0].name].type).toBe('CONNECT')
    })

    test('Integrated devices dispatch correctly', async () => {
        let result: any = null

        remote.subscribe((state: any) => { result = state })

        await wait()

        iotes.deviceDispatch(createDeviceDispatchable('DEVICE_ONE', 'TEST', {}))

        expect(result[config.topology.devices[0].name]).not.toBeUndefined()
        expect(result[config.topology.devices[0].name].type).toBe('TEST')
        expect(result[config.topology.devices[0].name].payload).toEqual({})
    })


    test('App dispatched to integrated decives correctly', async () => {
        let result: any = {}

        remote.subscribe((state) => { result = state })

        await wait()

        iotes.deviceDispatch(createDeviceDispatchable('DEVICE_ONE', 'UPDATE', { signal: 'test' }))

        expect(result.DEVICE_ONE.payload).toEqual({ signal: 'test' })
    })

    test('Metadata is inserted correctly', async () => {
        let result: any = {}

        remote.subscribe((state) => { result = state })

        await wait()

        iotes.deviceDispatch(createDeviceDispatchable('DEVICE_ONE', 'UPDATE', { signal: 'test' }))

        expect(result.DEVICE_ONE).toHaveProperty('@@iotes_direction')
        expect(result.DEVICE_ONE).toHaveProperty('@@iotes_channel')
        expect(result.DEVICE_ONE['@@iotes_channel']).toEqual('TEST')
    })

    test('Selectors cause update to be recieved from specified devices only ', async () => {
        let result: number = 0
        remote.subscribe((_) => { result += 1 }, ['DEVICE_ONE'])

        await wait()

        iotes.deviceDispatch(createDeviceDispatchable('DEVICE_ONE', 'UPDATE', { signal: 'test' }))
        iotes.deviceDispatch(createDeviceDispatchable('DEVICE_TWO', 'UPDATE', { signal: 'test' }))

        expect(result).toBe(1)
    })

    test('App dispatched to Integration host correctly', async () => {
        let result: any = null

        remote.subscribe((state) => { result = state })

        await wait()

        iotes.hostDispatch(createHostDispatchable('TEST_HOST', 'CONNECT', { test: true }))

        expect(result[config.topology.hosts[0].name].payload).toEqual({ test: true })
    })
})

describe('Lifecycle Hooks ', () => {
    test('Hooks are accepted', async () => {
        let result: any = null

        createIotes({
            topology: config.topology,
            strategy,
            lifecycleHooks: [() => ({
                preCreate: () => { result = 'CREATE' },
            })],
        })

        expect(result).toBe('CREATE')
    })

    test('Async hooks do not block', () => {
        let result: any = null

        iotes = createIotes({
            topology: config.topology,
            strategy,
            lifecycleHooks: [
                () => ({
                    preCreate: () => { setTimeout(() => 100) },
                    postCreate: () => { setTimeout(() => 100) },
                }),
                () => ({
                    preCreate: () => { result = 'PRE' },
                    postCreate: () => { result = 'POST' },
                }),
            ],
        })

        expect(iotes).toHaveProperty('hostSubscribe')
        expect(iotes).toHaveProperty('deviceSubscribe')
        expect(iotes).toHaveProperty('hostSubscribe')
        expect(iotes).toHaveProperty('deviceDispatch')
        expect(result).toEqual('POST')
    })
})

describe('Middlewares ', () => {
    // SET UP
    beforeEach(async () => {
        [remote, strategy] = createTestStrategy()
        iotes = createIotes({
            topology: config.topology,
            strategy,
        })
    })

    afterEach(() => {
        iotes = null
    })

    // TESTS
    test('Middleware modifies dispatch', () => {
        let result: any = null

        iotes.deviceSubscribe(
            (state) => { result = state },
            undefined,
            [(_) => ({ middleware: { payload: 'MIDDLEWARE' } })],
        )

        iotes.deviceDispatch(createDeviceDispatchable('DEVICE_ONE', 'UPDATE', { signal: 'test' }))

        expect(result.middleware.payload).toEqual('MIDDLEWARE')
    })

    test('Subscriber does not receive on {}', () => {
        let result: any = null

        iotes.deviceSubscribe(
            (state) => { result = state },
            undefined,
            [(_) => ({})],
        )

        iotes.deviceDispatch(createDeviceDispatchable('NONE', 'RFID_READER', { signal: 'test' }))

        expect(result).toEqual(null)
    })

    test('Subscriber does not receive on null', () => {
        let result: any = null

        iotes.deviceSubscribe(
            (state) => { result = state },
            undefined,
            [(_) => null],
        )

        iotes.deviceDispatch(createDeviceDispatchable('NONE', 'RFID_READER', { signal: 'test' }))

        expect(result).toEqual(null)
    })
})
