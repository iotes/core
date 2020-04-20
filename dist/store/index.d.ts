import { Store, State } from '../types';
export declare const createStore: (errorHandler?: (error: Error, currentState?: State) => State) => Store;
