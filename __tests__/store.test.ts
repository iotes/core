// Tests
import {
    Store,
} from '../src/types'
import { createDeviceDispatchable } from '../src'
import { createStore } from '../src/store'

// MODULE
let store: Store

// TESTS STORE ONLY
describe('Store module ', () => {
    // SET UP
    beforeEach(() => {
        store = createStore({ channel: 'TEST' })
    })

    afterEach(() => {
        store = null
    })

    // TESTS
    test('Can create Store ', () => {
        expect(() => {
            createStore({ channel: 'TEST' })
        }).not.toThrowError()
        expect(store).toHaveProperty('subscribe')
        expect(store).toHaveProperty('dispatch')
    })

    test('Can subscribe ', () => {
        expect(() => store.subscribe((state) => state)).not.toThrowError()
    })

    test('Can dispatch ', () => {
        let result: any = null
        store.subscribe((state) => { result = state })
        store.dispatch({ test: { payload: 'test', '@@source': 'test' } })
        expect(result.test.payload).toBe('test')
    })

    test('Inserts metadata correctly ', () => {
        let result: any = null
        store.subscribe((state) => { result = state })
        store.dispatch({ test: { payload: 'test', '@@source': 'test' } })
        expect(result).toMatchObject({ test: { payload: 'test' } })
    })


    test('Handles malformed dispatch ', () => {
        let result: any = null
        store.subscribe((state) => { result = state })
        store.dispatch({ test: { payload: 'test', '@@source': 'test' } })
        // Ignoring as TS will catch these errors before compiliation otherwise
        // @ts-ignore
        store.dispatch('what')
        // @ts-ignore
        store.dispatch(['thing', 'thing'])
        // @ts-ignore
        store.dispatch(1)
        // @ts-ignore
        store.dispatch({ payload: 'test' })
        // @ts-ignore
        store.dispatch('what')
        // @ts-ignore
        store.dispatch(['thing', 'thing'])
        // @ts-ignore
        store.dispatch(1)

        expect(result.test.payload).toBe('test')
    })

    test('Handles multiple devices correctly', () => {
        let result: any = null
        store.subscribe((state) => { result = state })

        store.dispatch(createDeviceDispatchable('reader/1', 'RFID_READER', { sample: 'test' }, { timestamp: '1234', host: 'local' }))
        store.dispatch(createDeviceDispatchable('reader/2', 'RFID_READER', { sample: 'test' }, { timestamp: '1234', host: 'local' }))
        store.dispatch(createDeviceDispatchable('reader/1', 'RFID_READER', { sample: 'newTest' }, { timestamp: '1234', host: 'local' }))

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
        store.subscribe((state) => { result = state })

        store.dispatch(createDeviceDispatchable('reader/1', 'RFID_READER', { signal: 'test' }))
        store.dispatch({ ...result['reader/1'], sample: 'newTest' })

        expect(result['reader/1'].payload).toEqual({ signal: 'test' })
    })

    test('Pre Update Hooks Functions Correctly ', () => {
        // This strips metadata.. I dont know if thats right
        store = createStore({
            channel: 'TEST',
            hooks: {
                preUpdateHooks: [
                    () => ({ hook: { payload: 'hook' } }),
                    (s: any) => ({ hook: { payload: `second_${s.hook.payload}` } }),
                ],
            },
        })

        let result: any = null

        store.subscribe((state) => { result = state })
        store.dispatch(createDeviceDispatchable('reader/1', 'RFID_READER', { signal: 'test' }))

        expect(result.hook.payload).toBe('second_hook')
    })

    test('Pre Subscribe Hooks Functions Correctly ', () => {
        let result: any = null

        store = createStore({
            channel: 'TEST',
            hooks: {
                preSubscribeHooks: [(s) => {
                    result = 'PRE'
                    return s
                }],
            },
        })

        store.subscribe((_) => {})

        expect(result).toBe('PRE')
    })

    test('Post Subscribe Hooks Functions Correctly ', () => {
        store = createStore({
            channel: 'TEST',
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

        store.subscribe((state) => { result = state })

        expect(result.hook.payload).toBe('hook')
    })
})
