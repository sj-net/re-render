import { IStoreConfig } from './store';

/**
 * Predefined middleware types that define their execution behavior.
 */
export type MiddlewareType =
    | 'before' // Runs before an action is executed.
    | 'after' // Runs after an action is executed.
    | 'both'; // Runs before and after an action.

/**
 * Base interface for all middleware types.
 * Provides a standard execution function for processing state changes.
 */
export interface Middleware<T> {
    name: string; // Middleware name
    type: MiddlewareType; // Defines when it runs (before/after/both or a specific function like logging)

    /**
     * Middleware execution function.
     *
     * @param storeName - The name of the store where the action occurs.
     * @param actionName - The action being executed.
     * @param prevState - The state before the action is applied.
     * @param nextState - The state after the action is applied.
     * @param config - The store configuration.
     * @param args - Additional arguments.
     */
    fn: (
        storeName: string,
        actionName: string,
        prevState: T,
        nextState: T,
        config: IStoreConfig<T>,
        ...args: any[]
    ) => void;
}