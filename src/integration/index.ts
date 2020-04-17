import {
    HostConfig,
    DeviceFactory,
    Integration,
    HostFactory,
    TopologyMap,
    ClientConfig,
} from '../types'
import { EnvironmentObject } from '../environment'

export const createIntegration: Integration = <StrategyConfig, DeviceTypes extends string>(
    hostFactory: HostFactory<StrategyConfig, DeviceTypes>,
    topologyMap: TopologyMap<StrategyConfig, DeviceTypes>,
): void => {
    const { logger } = EnvironmentObject
    const { hosts, devices, client } = topologyMap

    Promise.all(
        hosts.map(async (hostConfig: HostConfig<StrategyConfig>) => {
            logger.info(`Creating host ${hostConfig.name}`)
            const deviceFactory = await hostFactory(hostConfig, client).catch(() => {
                throw Error(`Failed to create Factory ${hostConfig.name})`)
            })
            return [hostConfig.name, deviceFactory]
        }),
    ).then((deviceFactories) => {
        const deviceFactoriesIndex: {[key: string]: any} = deviceFactories.reduce(
            (a, v:[string, any]) => ({ ...a, [v[0]]: v[1] }), {},
        )
        // connect device
        Promise.all(
            devices.map((device) => {
                // Select device creation method from correct host
                logger.info(`Creating device of type: ${device.type} on ${device.hostName}`)
                return deviceFactoriesIndex[device.hostName][device.type]({ ...device, client })
                    .catch((error: any) => {
                        console.warn(`Failed to create Device ${device.name} on host ${device.hostName}, details: ${error}`)
                    })
            }),
        ).catch((err) => {
            console.warn(
                'Failed to create Devices one of more Devices from topology map. Check chosen strategy has a method to handle the device type you need',
            )
        })
    }).catch(() => {
        throw Error(
            'Failed to create one or more Host Factories from topology map. Cannot continue',
        )
    })
}
