type Nullable<T> = T | null | undefined;

export type SelectorFn<T> = (...args: []) => T;
export type ActionFn<T> = (state: T, ...args: any[]) => void;

export type WithStateFunction<TState, TActions extends IAction> = {
    [K in keyof TActions]: (
        state: TState,
        ...args: Parameters<TActions[K]>
    ) => ReturnType<TActions[K]>;
};

export type WithoutStateFunction<T extends IAction> = {
    [K in keyof T]: T[K] extends (...args: infer A) => any
        ? (...args: A) => void | Promise<void> // This returns the action without any state
        : never;
};

export interface IAction {
    [key: string]: ActionFn<any>;
}

export interface ISelector {
    [key: string]: (...args: any[]) => any;
}

/**
 * Generates strongly typed React hooks for accessing store state.
 */
export type StoreHooks<TState> = {
    /**
     * Generates a hook for each top-level state property.
     * Example: `useUser()` for `user` in state.
     */
    [K in keyof TState as `use${Capitalize<string & K>}`]-?: () =>
        | TState[K]
        | null
        | undefined;
} & {
    /**
     * Recursively generates hooks for nested objects.
     * Example: If `state.user` is an object, `useUser` will provide nested hooks.
     */
    [K in keyof TState as TState[K] extends object
        ? TState[K] extends any[]
            ? never
            : K
        : never]-?: StoreHooks<NonNullable<TState[K]>>;
} & {
    /**
     * Ensures optional or nullable objects still generate hooks for deeply nested access.
     * Example: If `state.user` is an object, `user.useName` will provide nested hooks.
     */
    [K in keyof TState as TState[K] extends Nullable<object>
        ? TState[K] extends any[]
            ? never
            : K
        : never]-?: StoreHooks<NonNullable<TState[K]>>;
};
