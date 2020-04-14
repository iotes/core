import { Strategy, Store } from '../../types';
declare type DeviceTypes = 'RFID_READER' | 'ROTARY_ENCODER';
export declare const createLocalStoreAndStrategy: () => [Store, Strategy<undefined, DeviceTypes>];
export {};
