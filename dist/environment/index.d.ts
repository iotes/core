import { Logger, Store } from '../types';
interface EnvironmentObject {
    logger: Logger;
    stores?: {
        [key: string]: Store;
    } | {
        [key: string]: undefined;
    };
}
export declare const EnvironmentObject: EnvironmentObject;
export {};
