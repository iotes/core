import { Store, State, Metadata } from '../types';
export declare const createStore: (metadata?: Metadata<{
    '@@timestamp': string;
}>, errorHandler?: (error: Error, currentState?: State) => State) => Store;
