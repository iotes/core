import {
    TopologyMap, Store, Iotes,
} from '../src/types'
import { createIotes, createDeviceDispatchable } from '../src'
import { createLocalStoreAndStrategy } from '../src/strategies/local'
import { history } from '../src/hooks'
import { createStore } from '../src/store'
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

describe('History Hook', () => {
    beforeEach(async () => {
        [localStore, createLocalStrategy] = createLocalStoreAndStrategy()
        localModule = createIotes({
            topology: testTopologoy,
            strategy: createLocalStrategy,
        })
    })

    test('History is sent to new subs', async () => {
        let result: any = null

        let i = 1

        while (i < 3) {
            localModule.deviceDispatch(createDeviceDispatchable('TEST', 'UPDATE', { count: i }))
            localModule.deviceDispatch(createDeviceDispatchable('TEST', 'UPDATE', { count: i }))
            localModule.deviceDispatch(createDeviceDispatchable('TEST', 'UPDATE', { count: i }))

            i += 1
        }

        await new Promise((res, rej) => setTimeout(() => { res() }, 10))

        localModule.deviceSubscribe((state) => { result = state }, undefined, [direction('O')])

        await new Promise((res, rej) => setTimeout(() => { res() }, 10))

        console.log(result)
    })
})
