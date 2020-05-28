import {
    TopologyMap, Store, Iotes,
} from '../src/types'
import { createIotes, createDeviceDispatchable } from '../src'
import { createLocalStoreAndStrategy } from '../src/strategies/local'
import { direction, debounce } from '../src/middlewares'

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
let localModule: Iotes
let createLocalStrategy: any
let localStore: Store

describe('Direction middleware', () => {
    beforeEach(async () => {
        [localStore, createLocalStrategy] = createLocalStoreAndStrategy()
        localModule = createIotes({
            topology: testTopologoy,
            strategy: createLocalStrategy,
        })
    })

    test('Only receives in one direction', async () => {
        let resultIn: any = null
        let resultOut: any = null

        localModule.deviceSubscribe(
            (_) => {
                resultOut = 'OUT'
                resultIn = null
            },
            undefined,
            [direction('O')],
        )

        localModule.deviceSubscribe(
            (_) => {
                resultIn = 'IN'
            },
            undefined,
            [direction('I')],
        )

        localModule.deviceDispatch(createDeviceDispatchable('NONE', 'RFID_READER', { signal: 'test' }))

        expect(resultIn).toEqual(null)
        expect(resultOut).toEqual('OUT')

        // Wait for something to come in
        await new Promise((res, rej) => setTimeout(() => {
            if (resultIn && resultOut) {
                res()
            }
            rej()
        }, 100))

        expect(resultIn).toEqual('IN')
        expect(resultOut).toEqual('OUT')
    })
})


describe('Debounce Middleware', () => {
    beforeEach(async () => {
        [localStore, createLocalStrategy] = createLocalStoreAndStrategy()
        localModule = createIotes({
            topology: testTopologoy,
            strategy: createLocalStrategy,
        })
    })

    test('debounces', async () => {
        let result: any = null
        let i = 1

        localModule.deviceSubscribe(
            (state) => { result = state },
            undefined,
            [debounce(50)],
        )

        localModule.deviceDispatch(createDeviceDispatchable('debounce', 'UPDATE', { i }))
        i += 1

        const timer = setInterval(() => {
            if (i > 10) clearInterval(timer)
            localModule.deviceDispatch(createDeviceDispatchable('debounce', 'UPDATE', { i }))
            i += 1
        }, 5)

        // Wait for something to come in
        await new Promise((res, rej) => setTimeout(() => {
            if (result) {
                res()
            }
            rej()
        }, 35))

        expect(result.debounce.payload.i).toEqual(1)

        await new Promise((res, rej) => setTimeout(() => {
            if (result) {
                res()
            }
            rej()
        }, 20))

        expect(result.debounce.payload.i).toEqual(10)
    })
})
