import { IStoreConfig } from "./store";

/**
 * Defines a state transformation function that modifies state before or after an action.
 */
export interface StateTransformer<T> {
    name: string; // Name of the transformer

    /**
     * Transformation function that modifies the state.
     *
     * @param storeName - The name of the store where the action occurs.
     * @param actionName - The action being executed.
     * @param prevState - The state before the action is applied.
     * @param nextState - The state after the action is applied.
     * @param config - The store configuration.
     * @param updater - A function or partial update to modify the state.
     * @param args - Additional arguments for customization.
     * @returns The transformed state.
     */
    fn: (
        storeName: string,
        actionName: string,
        prevState: T,
        nextState: T,
        config: IStoreConfig<T>,
        updater: ((draft: T) => void) | Partial<T> | T,
        ...args: any[]
    ) => T;
}
