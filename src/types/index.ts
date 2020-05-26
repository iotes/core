// Hosts
export type HostMap<StrategyConfig> = HostConfig<StrategyConfig | undefined>[]

/**
   * The configuration object for a device
   * @param name The host name. This must be unique
   * @param host host address, eg '127.0.0.1'
   * @param port port name, eg '8000'
   * match hosts defined in HostConfig
   */
export type HostConfig<StrategyConfig> = {
    name: string
    host: string
    port: string
    strategyConfig?: StrategyConfig
}

export type HostConnectionType = 'CONNECT' | 'DISCONNECT' | 'RECONNECTING' | 'DEVICE_CONNECT' | 'DEVICE_DISCONNECT'

export type HostFactory<StrategyConfig, DeviceTypes extends string> = (
    hostConfig: HostConfig<StrategyConfig>,
    clientConfig: ClientConfig,
) => Promise<DeviceFactory<DeviceTypes>>

// Devices

export type DeviceMap<DeviceTypes> = DeviceConfig<DeviceTypes>[]

/**
   * The configuration object for a device
   * @param type One of the avaliable device types that should be defined by the strategy in use
   * @param name The device name. This must be unique
   * @param channel An optional parameter for tighter definition of how the device connects
   * with the iot device
   * @param hostName The name of the host which this device should connect to, must
   * match hosts defined in HostConfig
   */
export type DeviceConfig<DeviceTypes> = {
    type: DeviceTypes
    name: string
    channel?: number
    hostName: string
}

export type DeviceFactory<DeviceTypes extends string> = {
    [ key in DeviceTypes ]: (
        device: DeviceConfig<DeviceTypes>
    ) => Promise<{
        type: DeviceTypes,
        name: string,
        channel?: number,
    }>
}

// Client

/**
   * The configuration object for a device
   * @param name The name of the client. This must be set in order to prevent an
   * infinite loop occuring on dispatch
   */
export type ClientConfig = {
  name: string
}

// Store
export type Metadata<Meta extends {
  [key: string]: string | number | boolean | {[key: string]: boolean}
} = {
  '@@iotes_timestamp': string,
  '@@iotes_storeId': {[key: string]: boolean},
}> = () => Meta


// Integration
export type Integration = <StrategyConfig, DeviceTypes extends string>(
    hostFactory: HostFactory<StrategyConfig, DeviceTypes>,
    topologyMap: TopologyMap<StrategyConfig, DeviceTypes>,
) => void

export type PhidgetReactConfig = {
    host: string
    password?: string
    mqttHost?: string
    strategy?: string
}

// Logger
export interface Logger {
    log: (log: string) => any
    info: (info: string) => any
    warn: (warning: string) => any
    error: (error: string) => any
}

export type LogLevel = 'SILENT' | 'INFO' | 'LOG' | 'WARN' | 'DEBUG' | 'ERROR'

// Dispatchables
export type State = { [key: string]: {[key: string] : any } }

export type Dispatchable = State | Error

export type ErrorDispatchable = { message: string, code?: string, level: LogLevel }

/**
   * Defines the form of dispatchable object for communication with a device
   */
export type DeviceDispatchable<
  Payload extends {[key: string]: any }
> = {[name: string] : {
    name: string,
    type: string,
    payload: Payload
    meta?: {[key: string]: any }
    source?: string,
    error?: ErrorDispatchable
}}

/**
   * Defines the form of dispatchable object for communication with a device
   * @param type: Action description from host
   * @param name: The name of the host
   * @param meta: Optional - any metadata to include
   * @param payload: An body to be received by the host
   */
export type HostDispatchable<Payload = any> = { [name: string] : {
    type: HostConnectionType
    name: string
    payload: Payload
    meta?: {[key: string]: string | number}
    source?: string,
    error?: ErrorDispatchable
}}

export type Subscription = (state: State) => any

export type Selector = string[]

export type Middleware = (dispatchable: Dispatchable) => Dispatchable

export type Subscriber = [Subscription, Selector | undefined, Middleware[]]

export type Store = {
    dispatch: (dispatchable: Dispatchable) => void
    subscribe: (subscription: Subscription, selector?: Selector, middleware?: Middleware[]) => void
}

// Strategy

/**
   * Defines the form of dispatchable object for communication with a device
   * @param client: Configuration of the client application
   * @param hosts: A map of host configurations
   * @param devices: A map of device configuration
   */
export type TopologyMap<StrategyConfig, DeviceTypes extends string> = {
    client: ClientConfig
    hosts: HostMap<StrategyConfig>
    devices: DeviceMap<DeviceTypes>
}

export type Strategy<StrategyConfig, DeviceTypes extends string> = (
  Iotes: Iotes,
  StrategyHooks: StrategyHooks
) => HostFactory<StrategyConfig, DeviceTypes>
// Iotes

// This is the return type without plugins

/**
   * The Iotes communication methods
   * @param hostDispatch: Dispatches messages on the host bus
   * @param deviceDispatch: Dispatches messages on the device bus
   * @param hostSubscribe: Subscribes to the host bus
   * @param hostSubscribe: Subscribes to the device bus
   */
export type Iotes = {
    hostDispatch: <Payload extends {[key: string]: any}>(
        dispatchable: HostDispatchable<Payload>
    ) => void
    deviceDispatch: <Payload extends {[key: string]: any}>(
        dispatchable: DeviceDispatchable<Payload>
    ) => void
    hostSubscribe: (
        subscription: Subscription, selector?: Selector, middleware?: Middleware[]
    ) => void
    deviceSubscribe: (
        subscription: Subscription, selector?: Selector, middleware?: Middleware[]
    ) => void
}

export type CreateIotes = <StrategyConfig, DeviceTypes extends string>(config: {
    topology: TopologyMap<StrategyConfig, DeviceTypes >
    strategy: Strategy<StrategyConfig, DeviceTypes>
    plugin?: (iotes: Iotes) => any
    logLevel?: LogLevel
    logger?: Logger
    lifecycleHooks?: IotesHooks
}) => Iotes

export type CreateHostDispatchable = <
    Payload extends {[key: string]: any } = {},
    Meta extends {[key: string]: any} = {}
>(
    name: string,
    type: HostConnectionType,
    payload: Payload,
    meta?: Meta | {},
    source?: string,
    error?: ErrorDispatchable
) => HostDispatchable<Payload>

export type CreateDeviceDispatchable = <
    DeviceDispatchableType extends string = string,
    Payload extends {[key: string]: any } = {},
    Meta extends {[key: string]: any} = {},
>(
    name: string,
    type: DeviceDispatchableType,
    payload: Payload,
    meta?: Meta | {},
    source?: string,
    error?: ErrorDispatchable,
) => DeviceDispatchable<Payload>

export type LoopbackGuard = (
    deviceName: string,
    state: State,
    dispatchable: State,
    callback: (...args: any[]) => void
) => void

export type Direction = 'I' | 'O' | 'B'

export type AnyFunction = (...args: any[]) => any

export type StoreArgs = {
  channel: string,
  hooks?: StoreHooks
  errorHandler?: (error: Error, currentState?: State) => State
}

// Middlewares and Hooks

export type StoreHook = {
    preSubscribe?: (newSubscriber: Subscriber) => Subscriber,
    postSubscribe?: (newSubscriber: Subscriber) => void,
    preUpdate?: Middleware, // pipes
    preMiddleware?: Middleware, // pipes
    postMiddleware?: Middleware, // pipes
}

export type StrategyHook = {
    preDispatch?: Middleware,
}


export type IotesEvents = {
  preCreate?: () => void, // must not be async
  postCreate? : (iotes: Iotes) => void,
  host?: StoreHook & StrategyHook
  device?: StoreHook & StrategyHook,
}

export type StrategyHooks = {
  host: {
    preDispatchHooks: Middleware[]
  },
  device: {
    preDispatchHooks: Middleware[]
  }
}

export type StoreHooks = {
  preSubscribeHooks?: ((s: Subscriber) => Subscriber)[]
  postSubscribeHooks?: ((s: Subscriber) => void)[]
  preMiddlewareHooks?: Middleware[],
  postMiddlewareHooks?: Middleware[],
  preUpdateHooks?: Middleware[]
}

export type IotesHook = () => IotesEvents

export type CreateIotesHook<T extends Array<any>> = (...args: T) => IotesHook

export type IotesHooks = IotesHook[]

declare const createIotes: CreateIotes
declare const createDeviceDispatchable: CreateDeviceDispatchable
declare const createHostDispatchable: CreateHostDispatchable
declare const pipe: Pipe
declare const maybePipe: MaybePipe

// utils

export type Pipe = (...fns: AnyFunction[]) => <T>(state: T) => any
export type MaybePipe = (...fns: AnyFunction[]) => <T>(state: T) => any

export {
    createIotes,
    createDeviceDispatchable,
    createHostDispatchable,
    pipe,
    maybePipe,
}
