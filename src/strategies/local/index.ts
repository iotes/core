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
} from '../../types'
import { createDeviceDispatchable, createHostDispatchable } from '../../utils'
import { createStore } from '../../store'

type DeviceTypes = 'RFID_READER' | 'ROTARY_ENCODER'


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
            let newState: null
            if (state[name]?.['@@storeId']) {
                const { '@@storeId': none, ...ns } = state[name]
                newState = ns
            }

            if (newState) {
                store.dispatch({ [name]: newState })
            }
        })

        await setTimeout(() => {
            deviceDispatch(
                createDeviceDispatchable(name, type, 'EXTERNAL', { value: Date.now() }),
            )
        }, 10)

        return device
    }

    // ROTARY ENCODER
    const createRotaryEncoder = async (device: DeviceConfig<'ROTARY_ENCODER'>) => {
        const { type, name } = device

        // resigster trasmitter
        deviceSubscribe((state: any) => {
            let newState: null
            if (state[name]?.['@@storeId']) {
                const { '@@storeId': none, ...ns } = state[name]
                newState = ns
            }

            if (newState) {
                store.dispatch({ [name]: newState })
            }
        })


        // Register listeners
        await setTimeout(() => {
            deviceDispatch(
                createDeviceDispatchable(name, type, 'EXTERNAL', { value: Date.now() }),
            )
        }, 10)

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
                    createHostDispatchable(hostConfig.name, 'CONNECT', 'LOCAL', {
                        signal: 'test',
                    }),
                )
            })

            // Test host dispatch
            await new Promise((res) => {
                setTimeout(() => {
                    hostDispatch(
                        createHostDispatchable(hostConfig.name, 'CONNECT', 'LOCAL', {}),
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
