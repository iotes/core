export declare type HostMap<StrategyConfig> = HostConfig<StrategyConfig | undefined>[];
/**
   * The configuration object for a device
   * @param name The host name. This must be unique
   * @param host host address, eg '127.0.0.1'
   * @param port port name, eg '8000'
   * match hosts defined in HostConfig
   */
export declare type HostConfig<StrategyConfig> = {
    name: string;
    host: string;
    port: string;
    strategyConfig?: StrategyConfig;
};
export declare type HostConnectionType = 'CONNECT' | 'DISCONNECT' | 'RECONNECTING' | 'DEVICE_CONNECT' | 'DEVICE_DISCONNECT';
export declare type HostFactory<StrategyConfig, DeviceTypes extends string> = (hostConfig: HostConfig<StrategyConfig>, clientConfig: ClientConfig) => Promise<DeviceFactory<DeviceTypes>>;
export declare type DeviceMap<DeviceTypes> = DeviceConfig<DeviceTypes>[];
/**
   * The configuration object for a device
   * @param type One of the avaliable device types that should be defined by the strategy in use
   * @param name The device name. This must be unique
   * @param channel An optional parameter for tighter definition of how the device connects
   * with the iot device
   * @param hostName The name of the host which this device should connect to, must
   * match hosts defined in HostConfig
   */
export declare type DeviceConfig<DeviceTypes> = {
    type: DeviceTypes;
    name: string;
    channel?: number;
    hostName: string;
};
export declare type DeviceFactory<DeviceTypes extends string> = {
    [key in DeviceTypes]: (device: DeviceConfig<DeviceTypes>) => Promise<{
        type: DeviceTypes;
        name: string;
        channel?: number;
    }>;
};
/**
   * The configuration object for a device
   * @param name The name of the client. This must be set in order to prevent an
   * infinite loop occuring on dispatch
   */
export declare type ClientConfig = {
    name: string;
};
export declare type Metadata<Meta extends {
    [key: string]: string | number;
} = {
    '@@timestamp': string;
}> = () => Meta;
export declare type Integration = <StrategyConfig, DeviceTypes extends string>(hostFactory: HostFactory<StrategyConfig, DeviceTypes>, topologyMap: TopologyMap<StrategyConfig, DeviceTypes>) => void;
export declare type PhidgetReactConfig = {
    host: string;
    password?: string;
    mqttHost?: string;
    strategy?: string;
};
export interface Logger {
    log: (log: string) => any;
    info: (info: string) => any;
    warn: (warning: string) => any;
    error: (error: string) => any;
}
export declare type LogLevel = 'SILENT' | 'INFO' | 'LOG' | 'WARN' | 'DEBUG' | 'ERROR';
export declare type State = {
    [key: string]: {
        [key: string]: any;
    };
};
export declare type Dispatchable = State | Error;
export declare type ErrorDispatchable = {
    message: string;
    code?: string;
    level: LogLevel;
};
/**
   * Defines the form of dispatchable object for communication with a device
   */
export declare type DeviceDispatchable<Payload extends {
    [key: string]: any;
}> = {
    [name: string]: {
        name: string;
        type: string;
        meta?: {
            [key: string]: any;
        };
        payload: Payload;
        error?: ErrorDispatchable;
    };
};
/**
   * Defines the form of dispatchable object for communication with a device
   * @param type: Action description from host
   * @param name: The name of the host
   * @param meta: Optional - any metadata to include
   * @param payload: An body to be received by the host
   */
export declare type HostDispatchable<Payload = any> = {
    [name: string]: {
        type: HostConnectionType;
        name: string;
        meta?: {
            [key: string]: string | number;
        };
        payload: Payload;
        error?: ErrorDispatchable;
    };
};
export declare type Subscription = (state: State) => any;
export declare type Selector = string[];
export declare type Subscriber = [Subscription, Selector | undefined];
export interface Store {
    dispatch: (dispatchable: Dispatchable) => void;
    subscribe: (subscription: Subscription, selector?: Selector) => void;
}
/**
   * Defines the form of dispatchable object for communication with a device
   * @param client: Configuration of the client application
   * @param hosts: A map of host configurations
   * @param devices: A map of device configuration
   */
export declare type TopologyMap<StrategyConfig, DeviceTypes extends string> = {
    client: ClientConfig;
    hosts: HostMap<StrategyConfig>;
    devices: DeviceMap<DeviceTypes>;
};
export declare type Strategy<StrategyConfig, DeviceTypes extends string> = (Iotes: Iotes) => HostFactory<StrategyConfig, DeviceTypes>;
/**
   * The Iotes communication methods
   * @param hostDispatch: Dispatches messages on the host bus
   * @param deviceDispatch: Dispatches messages on the device bus
   * @param hostSubscribe: Subscribes to the host bus
   * @param hostSubscribe: Subscribes to the device bus
   */
export declare type Iotes = {
    hostDispatch: <Payload extends {
        [key: string]: any;
    }>(dispatchable: HostDispatchable<Payload>) => void;
    deviceDispatch: <Payload extends {
        [key: string]: any;
    }>(dispatchable: DeviceDispatchable<Payload>) => void;
    hostSubscribe: (subscription: Subscription, selector?: Selector) => void;
    deviceSubscribe: (subscription: Subscription, selector?: Selector) => void;
};
export declare type CreateIotes = <StrategyConfig, DeviceTypes extends string>(config: {
    topology: TopologyMap<StrategyConfig, DeviceTypes>;
    strategy: Strategy<StrategyConfig, DeviceTypes>;
    plugin?: (iotes: Iotes) => any;
    logLevel?: LogLevel;
    logger?: Logger;
}) => Iotes;
export declare type CreateHostDispatchable = <Payload extends {
    [key: string]: any;
} = {}, Meta extends {
    [key: string]: any;
} = {}>(name: string, type: HostConnectionType, payload: Payload, meta?: Meta, error?: ErrorDispatchable) => HostDispatchable<Payload>;
export declare type CreateDeviceDispatchable = <DeviceDispatchableType extends string = string, Payload extends {
    [key: string]: any;
} = {}, Meta extends {
    [key: string]: any;
} = {}>(name: string, type: DeviceDispatchableType, payload: Payload, meta?: Meta, error?: ErrorDispatchable) => DeviceDispatchable<Payload>;
export declare type LoopbackGuard = (deviceName: string, state: {
    [key: string]: {
        [key: string]: unknown;
        '@@source': string;
    };
}, client: {
    [key: string]: unknown;
    name: string;
}, callback: (...args: any[]) => void) => void;
declare const createIotes: CreateIotes;
declare const createDeviceDispatchable: CreateDeviceDispatchable;
declare const createHostDispatchable: CreateHostDispatchable;
declare const loopbackGuard: LoopbackGuard;
export { createIotes, createDeviceDispatchable, createHostDispatchable, loopbackGuard, };
