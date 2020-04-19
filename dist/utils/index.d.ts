import { DeviceDispatchable, HostDispatchable, CreateDeviceDispatchable, CreateHostDispatchable } from '../types';
export declare const createDeviceDispatchable: CreateDeviceDispatchable;
export declare const createHostDispatchable: CreateHostDispatchable;
export declare const insertMetadata: <Payload extends {
    [key: string]: any;
}>(dispatchable: HostDispatchable<any> | DeviceDispatchable<Payload>, meta: {
    [key: string]: string | number;
}) => {};
