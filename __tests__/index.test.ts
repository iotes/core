import {
    TopologyMap, Store, Iotes,
} from '../src/types'
import { createIotes, createDeviceDispatchable } from '../src'
import { createLocalStoreAndStrategy } from '../src/strategies/local'
import { createStore } from '../src/store'

// Test data

type DeviceTypes = 'RFID_READER' | 'ROTARY_ENCODER'

const testTopologoy: TopologyMap<{}, DeviceTypes> = {
    client: { name: 'test' },
    hosts: [{ name: 'testapp/0', host: 'localhost', port: '8888' }],
    devices: [
        {
            hostName: 'testapp/0',
            type: 'RFID_READER',
            name: 'READER/1',
            channel: 1,
        },
        {
            hostName: 'testapp/0',
            type: 'ROTARY_ENCODER',
            name: 'ENCODER/1',
            channel: 2,
        },
    ],
}

// Tests

let createLocalStrategy: any
let localStore: Store

afterAll(() => {
    localStore = null
})

/* Tests store module implementation only */

describe('Store module ', () => {
    beforeEach(() => {
        localStore = createStore({})
    })

    afterEach(() => {
        localStore = null
    })

    test('Can create Store ', () => {
        expect(() => {
            createStore({})
        }).not.toThrowError()
        expect(localStore).toHaveProperty('subscribe')
        expect(localStore).toHaveProperty('dispatch')
    })

    test('Can subscribe ', () => {
        expect(() => localStore.subscribe((state) => state)).not.toThrowError()
    })

    test('Can dispatch ', () => {
        let result: any = null
        localStore.subscribe((state) => { result = state })
        localStore.dispatch({ test: { payload: 'test', '@@source': 'test' } })
        expect(result.test.payload).toBe('test')
    })

    test('Inserts metadata correctly ', () => {
        let result: any = null
        localStore.subscribe((state) => { result = state })
        localStore.dispatch({ test: { payload: 'test', '@@source': 'test' } })
        expect(result).toMatchObject({ test: { payload: 'test' } })
    })


    test('Handles malformed dispatch ', () => {
        let result: any = null
        localStore.subscribe((state) => { result = state })
        localStore.dispatch({ test: { payload: 'test', '@@source': 'test' } })
        // @ts-ignore
        localStore.dispatch('what')
        // @ts-ignore
        localStore.dispatch(['thing', 'thing'])
        // @ts-ignore
        localStore.dispatch(1)
        // @ts-ignore
        localStore.dispatch({ payload: 'test' })
        // @ts-ignore
        localStore.dispatch('what')
        // @ts-ignore
        localStore.dispatch(['thing', 'thing'])
        // @ts-ignore
        localStore.dispatch(1)

        expect(result.test.payload).toBe('test')
    })

    test('Handles multiple devices correctly', () => {
        let result: any = null
        localStore.subscribe((state) => { result = state })

        localStore.dispatch(createDeviceDispatchable('reader/1', 'RFID_READER', { sample: 'test' }, { timestamp: '1234', host: 'local' }))
        localStore.dispatch(createDeviceDispatchable('reader/2', 'RFID_READER', { sample: 'test' }, { timestamp: '1234', host: 'local' }))
        localStore.dispatch(createDeviceDispatchable('reader/1', 'RFID_READER', { sample: 'newTest' }, { timestamp: '1234', host: 'local' }))

        expect(result).toMatchObject({
            'reader/1': {
                name: 'reader/1',
                type: 'RFID_READER',
                meta: { timestamp: '1234', host: 'local' },
                payload: { sample: 'newTest' },
            },
            'reader/2': {
                type: 'RFID_READER',
                name: 'reader/2',
                meta: { timestamp: '1234', host: 'local' },
                payload: { sample: 'test' },
            },
        })
    })

    test('Loopback is guarded against', () => {
        let result: any = null
        localStore.subscribe((state) => { result = state })

        localStore.dispatch(createDeviceDispatchable('reader/1', 'RFID_READER', { signal: 'test' }))
        localStore.dispatch({ ...result['reader/1'], sample: 'newTest' })

        expect(result['reader/1'].payload).toEqual({ signal: 'test' })
    })

    test('Pre Update Hooks Functions Correctly ', () => {
        // This strips metadata.. I dont know if thats right
        localStore = createStore({
            hooks: {
                preUpdateHooks: [
                    (s: any) => ({ hook: { payload: `second_${s.hook.payload}` } }),
                    (_) => ({ hook: { payload: 'hook' } }),
                ],
            },
        })

        let result: any = null

        localStore.subscribe((state) => { result = state })

        localStore.dispatch(createDeviceDispatchable('reader/1', 'RFID_READER', { signal: 'test' }))

        expect(result.hook.payload).toBe('second_hook')
    })

    test('Pre Subscribe Hooks Functions Correctly ', () => {
        let result: any = null

        localStore = createStore({
            hooks: {
                preSubscribeHooks: [() => { result = 'PRE' }],
            },
        })

        localStore.subscribe((_) => {})

        expect(result).toBe('PRE')
    })

    test('Post Subscribe Hooks Functions Correctly ', () => {
        localStore = createStore({
            hooks: {
                postSubscribeHooks: [
                    (newSubsciber) => {
                        const [subscription, selection] = newSubsciber
                        subscription({ hook: { payload: 'hook' } })
                    },
                ],
            },
        })

        let result: any = null

        localStore.subscribe((state) => { result = state })

        expect(result.hook.payload).toBe('hook')
    })
})

/* Tests full strategy implementation. Uses local strategy as it Integration that uses timeouts to
simulate devices being connected and/or disconnected */

let localModule: Iotes
describe('Iotes core', () => {
    beforeEach(async () => {
        [localStore, createLocalStrategy] = createLocalStoreAndStrategy()
        localModule = createIotes({
            topology: testTopologoy,
            strategy: createLocalStrategy,
        })
    })

    afterEach(() => {
        localModule = null
    })

    test('Can create Integration', () => {
        expect(() => {
            localModule = createIotes({
                topology: testTopologoy,
                strategy: createLocalStrategy,
            })
        }).not.toThrowError()
        expect(localModule).toHaveProperty('hostSubscribe')
        expect(localModule).toHaveProperty('deviceSubscribe')
        expect(localModule).toHaveProperty('hostSubscribe')
        expect(localModule).toHaveProperty('deviceDispatch')
    })

    test('Integrated host dispatches correctly', async () => {
        let result: any = null
        localModule.hostSubscribe((state: any) => { result = state })

        await new Promise((res, rej) => setTimeout(() => {
            if (result) {
                res()
            }
            rej(Error('Result Empty'))
        }, 20))

        expect(result[testTopologoy.hosts[0].name].type).toBe('CONNECT')
    })

    test('Integrated devices dispatch correctly', async () => {
        let result: any = null
        localModule.deviceSubscribe((state: any) => { result = state })

        await new Promise((res, rej) => setTimeout(() => {
            if (result) {
                res()
            }
            rej(Error('Result Empty'))
        }, 100))

        expect(result[testTopologoy.devices[0].name].type).toBe('RFID_READER')
    })


    test('App dispatched to integrated decives correctly', async () => {
        let result: any = {}
        const deviceName = 'READER/1'
        localStore.subscribe((state) => { result = state })

        await new Promise((res, rej) => setTimeout(() => {
            if (result) {
                res()
            }
            rej()
        }, 100))


        localModule.deviceDispatch(createDeviceDispatchable(deviceName, 'RFID_READER', { signal: 'test' }))

        expect(result[deviceName].payload).toEqual({ signal: 'test' })
    })

    test('Metadata is instered correctly', async () => {
        let result: any = {}
        const deviceName = 'READER/1'
        localStore.subscribe((state) => { result = state })

        await new Promise((res, rej) => setTimeout(() => {
            if (result) {
                res()
            }
            rej()
        }, 100))

        localModule.deviceDispatch(createDeviceDispatchable(deviceName, 'TTTTT', { signal: 'test' }))

        expect(result[deviceName]).toHaveProperty('@@iotes_direction')
        expect(result[deviceName].meta).toHaveProperty('busChannel')
    })

    test('Selectors work as expected', async () => {
        let result: number = 0
        localStore.subscribe((state) => {
            result += 1
        }, ['ENCODER/1'])

        await new Promise((res, rej) => setTimeout(() => {
            res()
        }, 10))

        localModule.deviceDispatch(createDeviceDispatchable('READER/1', 'READER/1', { signal: 'test' }))
        localModule.deviceDispatch(createDeviceDispatchable('ENCODER/1', 'ENCODER/1', { signal: 'test' }))

        expect(result).toBe(1)
    })

    test('App dispatched to Integration host correctly', async () => {
        let result: any = null
        const hostName = 'testapp/0'
        const signal = 'test'
        localStore.subscribe((state) => { result = state })
        await new Promise((res, rej) => setTimeout(() => {
            if (result) {
                res()
            }
            rej(Error('Result Empty'))
        }, 500))


        expect(result[hostName].payload).toEqual({ signal })
    })
})

describe('Lifecycle Hooks ', () => {
    test('Hooks are accepted', async () => {
        let result: any = null

        createIotes({
            topology: testTopologoy,
            strategy: createLocalStrategy,
            lifecycleHooks: [() => ({
                preCreate: () => { result = 'CREATE' },
            })],
        })

        expect(result).toBe('CREATE')
    })

    test('Async hooks do not block', () => {
        let result: any = null

        const iotes = createIotes({
            topology: testTopologoy,
            strategy: createLocalStrategy,
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
    beforeEach(async () => {
        [localStore, createLocalStrategy] = createLocalStoreAndStrategy()
        localModule = createIotes({
            topology: testTopologoy,
            strategy: createLocalStrategy,
        })
    })

    afterEach(() => {
        localModule = null
    })

    test('Middleware modifies dispatch', () => {
        let result: any = null

        localModule.deviceSubscribe(
            (state) => { result = state },
            undefined,
            [(_) => ({ middleware: { payload: 'MIDDLEWARE' } })],
        )

        localModule.deviceDispatch(createDeviceDispatchable('NONE', 'RFID_READER', { signal: 'test' }))

        expect(result.middleware.payload).toEqual('MIDDLEWARE')
    })


    test('Subscriber does not receive on {}', () => {
        let result: any = null

        localModule.deviceSubscribe(
            (state) => { result = state },
            undefined,
            [(_) => ({})],
        )

        localModule.deviceDispatch(createDeviceDispatchable('NONE', 'RFID_READER', { signal: 'test' }))

        expect(result).toEqual(null)
    })

    test('Subscriber does not receive on null', () => {
        let result: any = null

        localModule.deviceSubscribe(
            (state) => { result = state },
            undefined,
            [(_) => null],
        )

        localModule.deviceDispatch(createDeviceDispatchable('NONE', 'RFID_READER', { signal: 'test' }))

        expect(result).toEqual(null)
    })
})
