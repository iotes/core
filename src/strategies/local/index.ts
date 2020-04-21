import {
    DeviceFactory,
    HostFactory,
    DeviceConfig,
    HostConfig,
    DeviceDispatchable,
    Strategy,
    Store,
    ClientConfig,
    Iotes,
    State,
    Selector,
    Subscription,
} from '../../types'
import { createDeviceDispatchable, createHostDispatchable } from '../../utils'
import { createStore } from '../../store'

type DeviceTypes = 'RFID_READER' | 'ROTARY_ENCODER'

const defeatLoopbackGuard = (deviceName: string, state: State): State => {
    let newState: {} | null
    if (state[deviceName]?.['@@iotes_storeId']) {
        const { '@@iotes_storeId': n, ...ns } = state[deviceName]
        newState = ns
    }

    return newState || state
}


const createDeviceFactory = async <StrategyConfig> (
    hostConfig: HostConfig<StrategyConfig>,
    client: ClientConfig,
    deviceDispatch: <Payload extends {
      [key: string]: any
    } >(dispatchable: DeviceDispatchable<Payload>) => void,
    deviceSubscribe: any,
    store: Store,
): Promise<DeviceFactory<DeviceTypes>> => {
    // RFID READER
    const createRfidReader = async (device: DeviceConfig<'RFID_READER'>) => {
        const { name, type } = device

        // resigster trasmitter
        deviceSubscribe((state: any) => {
            store.dispatch({
                [name]:
                state[name]?.payload?.defeatLoopbackGuard
                    ? state
                    : defeatLoopbackGuard(name, state),
            })
        }, [name])

        await setTimeout(() => {
            deviceDispatch(
                createDeviceDispatchable(name, type, { value: Date.now() }),
            )
        }, 10)

        return device
    }

    // ROTARY ENCODER
    const createRotaryEncoder = async (device: DeviceConfig<'ROTARY_ENCODER'>) => {
        const { type, name } = device

        // resigster trasmitter
        deviceSubscribe((state: any) => {
            const rm = state[name]
            store.dispatch(createDeviceDispatchable(name, rm.type, rm.source, rm.payload))
        }, [name])


        // Register listeners
        /*
        await setTimeout(() => {
            deviceDispatch(
                createDeviceDispatchable(name, type, 'EXTERNAL', { value: Date.now() }),
            )
        }, 10)
        */

        return device
    }

    return {
        RFID_READER: createRfidReader,
        ROTARY_ENCODER: createRotaryEncoder,
    }
}

export const createLocalStoreAndStrategy = (): [Store, Strategy<undefined, DeviceTypes>] => {
    const store$ = createStore()

    return [
        store$,
        <StrategyConfig>(
            I: Iotes,
        ): HostFactory<StrategyConfig, DeviceTypes> => async (
            hostConfig: HostConfig<StrategyConfig>,
            clientConfig: ClientConfig,
        ): Promise<DeviceFactory<DeviceTypes>> => {
            const { name } = clientConfig

            const {
                hostDispatch,
                deviceDispatch,
                hostSubscribe,
                deviceSubscribe,
            } = I

            hostSubscribe((state: any) => {
                store$.dispatch(
                    createHostDispatchable(hostConfig.name, 'CONNECT', {
                        signal: 'test',
                    }),
                )
            })

            // Test host dispatch
            await new Promise((res) => {
                setTimeout(() => {
                    hostDispatch(
                        createHostDispatchable(hostConfig.name, 'CONNECT', {}),
                    )
                    res()
                }, 10)
            })

            return createDeviceFactory(
                hostConfig,
                clientConfig,
                deviceDispatch,
                deviceSubscribe,
                store$,
            )
        },
    ]
}
