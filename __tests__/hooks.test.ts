import {
    TopologyMap, Store, Iotes,
} from '../src/types'
import { createIotes, createDeviceDispatchable } from '../src'
import { createLocalStoreAndStrategy } from '../src/strategies/local'
import { createHistory } from '../src/hooks'

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
            lifecycleHooks: [createHistory()],
        })
    })

    test('History is sent to new subs', async () => {
        let result: any = null

        let i = 0

        while (i < 3) {
            localModule.deviceDispatch(createDeviceDispatchable('TEST', 'UPDATE', { count: i }))

            i += 1
        }

        await new Promise((res, rej) => setTimeout(() => { res() }, 10))

        localModule.deviceSubscribe((state) => { result = state.IOTES_HISTORY_HOOK }, ['IOTES_HISTORY_HOOK'])

        await new Promise((res, rej) => setTimeout(() => { res() }, 10))

        const testResults = result.payload.history
            .filter((e: any) => Object.keys(e)[0] === 'TEST')
            .map((e: any) => e.TEST)

        expect(testResults.length).toBeGreaterThan(0)
    })

    test('History records each event once', async () => {
        let result: any = null

        let i = 0

        while (i < 3) {
            localModule.deviceDispatch(createDeviceDispatchable('TEST', 'UPDATE', { count: i }))

            i += 1
        }

        await new Promise((res, _) => setTimeout(() => { res() }, 10))

        localModule.deviceSubscribe((state) => { result = state.IOTES_HISTORY_HOOK }, ['IOTES_HISTORY_HOOK'])

        await new Promise((res, _) => setTimeout(() => { res() }, 10))

        const testResults = result.payload.history
            .filter((e) => Object.keys(e)[0] === 'TEST')
            .map((e) => e.TEST)

        expect(testResults[0].payload.count).toEqual(0)
        expect(testResults[1].payload.count).toEqual(1)
        expect(testResults[2].payload.count).toEqual(2)
    })

    test('History loads remote function', async () => {
        let result: any = null

        const getRemote = async () => {
            const dataEmpty: any[] = [null, null, null]
            const data = dataEmpty.map((e, i) => createDeviceDispatchable('TEST', 'UPDATE', { count: i }))
            await new Promise((res, _) => setTimeout(() => { res() }, 20))
            return data
        }

        const iotes = createIotes({
            topology: testTopologoy,
            strategy: createLocalStrategy,
            lifecycleHooks: [createHistory(getRemote)],
        })

        await new Promise((res, _) => setTimeout(() => { res() }, 30))

        iotes.deviceSubscribe((state) => { result = state.IOTES_HISTORY_HOOK }, ['IOTES_HISTORY_HOOK'])

        await new Promise((res, _) => setTimeout(() => { res() }, 10))

        const testResults = result.payload.history
            .filter((e) => Object.keys(e)[0] === 'TEST')
            .map((e) => e.TEST)

        expect(testResults[0].payload.count).toEqual(0)
        expect(testResults[1].payload.count).toEqual(1)
        expect(testResults[2].payload.count).toEqual(2)
    })
})
