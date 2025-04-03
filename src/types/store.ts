import {
    IAction,
    ISelector,
    StoreHooks,
    WithoutStateFunction,
    WithStateFunction,
} from './common';
import { ILoggerOptions } from './logger';
import { Middleware } from './middleware';
import { IPersistEngine } from './persist';
import { StateTransformer } from './transformers';

export interface IStoreConfig<T> {
    /**
     * `logging` defines the logging configuration for the store.
     *
     * Purpose:
     * - Controls how state changes are logged.
     * - Helps with **debugging and performance monitoring**.
     */
    logging: ILoggerOptions;

    /**
     * `beforeMiddlewares` is an array of middleware functions that execute **before** state updates.
     *
     * Purpose:
     * - Allows validation, transformation, or side effects before modifying the state.
     * - Can **prevent state updates** by throwing errors or modifying the update.
     *
     * Example:
     * ```ts
     * beforeMiddlewares: [
     *     (state, action) => { console.log("Before action:", action); }
     * ]
     * ```
     */
    beforeMiddlewares: Middleware<any>[];

    /**
     * `afterMiddlewares` is an array of middleware functions that execute **after** state updates.
     *
     * Purpose:
     * - Used for **logging, side effects, analytics**, etc.
     * - Executes after state modifications are applied.
     *
     * Example:
     * ```ts
     * afterMiddlewares: [
     *     (state, action) => { console.log("After action:", action); }
     * ]
     * ```
     */
    afterMiddlewares: Middleware<any>[];

    /**
     * `transformers` define **state transformation functions**.
     *
     * Purpose:
     * - Modify state **before** and **after** an action is performed.
     * - Can be used for **serialization, encryption, or format adjustments**.
     *
     * Example:
     * ```ts
     * transformers: [
     *     (state) => JSON.stringify(state),  // Convert state to string before saving
     *     (state) => JSON.parse(state)       // Convert string back to object after retrieval
     * ]
     * ```
     */
    transformers: StateTransformer<any>[];

    /**
     * `persist` defines an optional persistence engine for the store.
     *
     * Purpose:
     * - Enables **state persistence** across sessions.
     * - Stores data using local storage, IndexedDB, or other storage mechanisms.
     *
     * Behavior:
     * - If provided, state changes will be **persisted automatically**.
     * - The store rehydrates state from the persist engine on initialization.
     */
    persist?: IPersistEngine<T>;

    /**
     * `globalErrorHandler` is a **centralized error handler** for all store operations.
     *
     * Purpose:
     * - Catches **unexpected errors** in state updates and middleware execution.
     * - Allows rollback or logging of critical failures.
     *
     * Behavior:
     * - Receives the error, action name, and the last known good state.
     * - Can **recover from failures** by rolling back to the previous state.
     *
     * Example:
     * ```ts
     * globalErrorHandler: (error, actionName, lastState) => {
     *     console.error(`Error in action ${actionName}:`, error);
     *     restoreState(lastState); // Rollback mechanism
     * }
     * ```
     */
    globalErrorHandler: (
        error: Error,
        name: string,
        lastGoodState: any
    ) => void;

    /**
     * `rollbackOnError` determines whether to **revert state changes** if an error occurs.
     *
     * Purpose:
     * - Ensures state consistency in case of failures.
     * - Uses the **last known good state** for rollback.
     *
     * Behavior:
     * - If `true`, the state is restored to the last valid state after an error.
     */
    rollbackOnError: boolean;

    /**
     * `useImmer` enables Immer.js for **immutable state updates**.
     *
     * Purpose:
     * - Simplifies **state modifications** with direct mutations.
     * - Ensures **safe, predictable state updates**.
     *
     * Behavior:
     * - If `produce` is provided, it wraps state updates inside Immer’s `produce` function.
     * - If `useImmer` is disabled, manual immutability handling is required.
     */
    useImmer: { produce?: (state: any, recipe: (draft: any) => void) => any };

    /**
     * `logDiff` enables **detailed state change logging**.
     *
     * Purpose:
     * - Provides a **diff-based log** of state changes for debugging.
     * - Useful for tracking modifications in complex state objects.
     *
     * Behavior:
     * - If `true`, logs **before and after** states with differences.
     */
    logDiff: boolean;

    /**
     * `devTools` enables integration with **developer tools** for debugging.
     *
     * Purpose:
     * - Allows visualization of state changes in dev tools.
     * - Helps developers track actions, mutations, and time travel debugging.
     *
     * Behavior:
     * - If `true`, integrates with debugging tools like **Redux DevTools**.
     */
    devTools: boolean;
}


// Allow only the properties defined in IStoreConfig to be passed to InlineStoreConfig
// and make them optional. This is useful for inline store configuration.
export interface InlineStoreConfig<T>
    extends Partial<
        Pick<
            IStoreConfig<T>,
            | 'rollbackOnError'
            | 'useImmer'
            | 'transformers'
            | 'beforeMiddlewares'
            | 'afterMiddlewares'
            | 'logDiff'
        >
    > {}

export interface IStore<
    TState,
    TAction extends IAction,
    TSelectors extends ISelector
> {
    /**
     * Retrieves the current state of the store.
     *
     * Purpose:
     * - Provides **direct access** to the state without triggering re-renders.
     * - Used internally by selectors and middleware for efficient state retrieval.
     *
     * Behavior:
     * - Returns the **latest immutable snapshot** of the state.
     * - Does **not** track changes automatically (not reactive).
     *
     * Example:
     * ```ts
     * const state = store.getState();  // ✅ Fetches the current state
     * console.log(state.user.name);    // ✅ Logs "Alice"
     * ```
     */
    getState: () => TState;

    /**
     * Updates the state synchronously.
     *
     * Purpose:
     * - Modifies the state by applying a **partial update** or a full replacement.
     * - Ensures **immutability** by working with a draft state.
     * - Supports **local configuration** for specific updates.
     *
     * Behavior:
     * - Accepts a function `(draft) => void` or a new state value.
     * - Uses **Immer (if enabled)** to handle immutable updates efficiently.
     * - **Batches updates** to reduce unnecessary renders.
     *
     * Example:
     * ```ts
     * store.setState((state) => {
     *     state.user.name = "Bob";
     * }, "setName");
     * ```
     */
    setState: (
        updater: ((draft: TState) => void) | TState | Partial<TState>,
        actionName?: string,
        localConfig?: InlineStoreConfig<TState>,
        ...args: any[]
    ) => void;

    /**
     * Updates the state asynchronously.
     *
     * Purpose:
     * - Allows state updates within **async functions** without blocking execution.
     * - Ensures **consistent and ordered** updates in async workflows.
     *
     * Behavior:
     * - Works similarly to `setState`, but returns a `Promise<void>`.
     * - **Does not auto-batch** async calls unless explicitly handled.
     * - Supports **awaiting side effects** before applying updates.
     *
     * Example:
     * ```ts
     * await store.setStateAsync(async (state) => {
     *     const userData = await fetchUser();
     *     state.user = userData;
     * }, "loadUser");
     * ```
     */
    setStateAsync: (
        updater: ((draft: TState) => void) | TState | Partial<TState>,
        actionName?: string,
        localConfig?: InlineStoreConfig<TState>,
        ...args: any[]
    ) => Promise<void>;

    /**
     * Subscribes a listener to state changes.
     *
     * Purpose:
     * - Allows **external components** to react to state updates.
     * - Used internally by hooks and UI components for reactive updates.
     *
     * Behavior:
     * - Accepts a callback function that runs **whenever the state changes**.
     * - Returns an **unsubscribe function** to remove the listener.
     *
     * Example:
     * ```ts
     * const unsubscribe = store.subscribe(() => {
     *     console.log("State updated!", store.getState());
     * });
     *
     * // Later, to remove the listener
     * unsubscribe();
     * ```
     */
    subscribe: (listener: () => void) => () => void;

    /**
     * Unsubscribes a listener from state changes.
     *
     * Purpose:
     * - Manually removes a previously added listener.
     * - Useful for cleanup when components unmount.
     *
     * Behavior:
     * - If the listener was not found, it does nothing.
     *
     * Example:
     * ```ts
     * const listener = () => console.log("State updated");
     * store.subscribe(listener);
     * store.unsubscribe(listener);
     * ```
     */
    unsubscribe: (listener: () => void) => void;

    /**
     * `actions` contains functions that modify the state.
     *
     * Purpose:
     * - Defines **state mutation functions** that update specific properties.
     * - Provides an **encapsulated API** for modifying state without direct access.
     * - Supports **both synchronous and asynchronous actions**.
     *
     * Behavior:
     * - **Synchronous actions** update the state immediately.
     * - **Asynchronous actions** use `await` before applying state updates.
     * - Uses `setState()` internally to **ensure immutability and batching**.
     *
     * Example:
     * ```ts
     * const actions = getActions({
     *     setName: (state, name: string) => { state.user.name = name; },
     *     toggleDarkMode: (state) => { state.settings.darkMode = !state.settings.darkMode; }
     * });
     *
     * actions.setName("Bob");        // ✅ Updates state.user.name to "Bob"
     * actions.toggleDarkMode();      // ✅ Toggles dark mode
     * ```
     */
    actions: WithoutStateFunction<TAction>;

    /**
     * `selectors` provide **computed, derived values** from the state.
     *
     * Purpose:
     * - Allows efficient **state retrieval and transformation** without unnecessary re-renders.
     * - **Prevents redundant computations** by extracting only necessary state parts.
     * - Uses `getState()` to fetch the latest state **without causing reactivity issues**.
     * - Meant for custom selectors which cannot be found in the hooks.
     *
     * Behavior:
     * - **Pure functions**: Selectors **do not modify the state**—they only extract data.
     * - Uses **arguments** to return dynamic computed values.
     * - Can be used **inside React components without triggering re-renders**.
     *
     * Example:
     * ```ts
     * const selectors = getSelectors({
     *     getUserFullName: (state) => `${state.user.firstName} ${state.user.lastName}`,
     *     isDarkModeEnabled: (state) => state.settings.darkMode
     * });
     *
     * const fullName = selectors.getUserFullName();  // ✅ "Alice Doe"
     * const isDark = selectors.isDarkModeEnabled();  // ✅ true/false
     * ```
     */
    selectors: WithoutStateFunction<TSelectors>;

    /**
     * Provides state persistence and rehydration.
     *
     * Purpose:
     * - Enables **state persistence** across page reloads or app restarts.
     * - Allows clearing stored data when needed.
     *
     * Behavior:
     * - `reHydrate()` loads the persisted state asynchronously.
     * - `clear()` wipes the persisted state.
     *
     * Example:
     * ```ts
     * await store.persist.reHydrate(); // ✅ Restores saved state
     * await store.persist.clear();     // ✅ Clears stored state
     * ```
     */
    persist: {
        reHydrate: () => Promise<void>;
        clear: () => Promise<void>;
    };

    /**
     * Destroys the store and removes all listeners.
     *
     * Purpose:
     * - Ensures **proper cleanup** when the store is no longer needed.
     * - Used for debugging, hot-reloading, or when replacing the store instance.
     *
     * Behavior:
     * - Clears all state updates and subscriptions.
     * - **Does not persist state** after destruction.
     *
     * Example:
     * ```ts
     * store.destroy();  // ✅ Completely removes the store
     * ```
     */
    destroy: () => void;

    /**
     * `hooks` dynamically generates accessors (hooks) for each state property.
     *
     * Purpose:
     * - Provides a structured way to **access state values** via functions (`usePropertyName()`).
     * - Supports **nested objects**, enabling `Parent.useChild()` syntax.
     * - Ensures **safe access** to deeply nested properties, preventing runtime errors.
     * - Works with **both primitive and object-based state properties**.
     * - **Skips arrays** to avoid unnecessary function wrapping.
     *
     * Behavior:
     * - If a property is a **primitive**, a function `usePropertyName()` is created.
     * - If a property is an **object**, a namespaced object `Parent.useChild()` is created.
     * - If a property is **null/undefined**, the function returns `null` safely.
     *
     * Example:
     * ```ts
     * const hooks = createHooks(() => ({
     *     user: { name: "Alice", age: 30 },
     *     settings: { darkMode: true }
     * }));
     *
     * const name = hooks.useUser().name;   // ✅ Access "Alice"
     * const darkMode = hooks.useSettings(); // ✅ Access { darkMode: true }
     * ```
     */
    hooks: StoreHooks<TState>;
}

export interface IStoreMetadata<
    TState,
    TActions extends IAction,
    TSelectors extends ISelector
> {
    /**
     * `storeName` represents the unique identifier for the store.
     *
     * Purpose:
     * - Helps in debugging, logging, and differentiating multiple stores.
     * - Used internally for tracking store instances.
     */
    storeName: string;

    /**
     * `initialState` defines the default state when the store is first created.
     *
     * Purpose:
     * - Acts as the **starting point** for state values.
     * - Used for **resetting the store** when needed.
     */
    initialState: TState;

    /**
     * `actions` define state mutation functions that modify store data.
     *
     * Purpose:
     * - Provides an **encapsulated API** for state modifications.
     * - Ensures controlled state updates through predefined functions.
     * - Supports both **synchronous and asynchronous** operations.
     *
     * Behavior:
     * - Functions receive the current state as the first argument.
     * - Actions update the state via **immer's draft mechanism**.
     */
    actions: WithStateFunction<TState, TActions>;

    /**
     * `selectors` are functions that compute derived values from the state.
     *
     * Purpose:
     * - Optimizes **data retrieval** by allowing computed values instead of raw state access.
     * - Helps **avoid unnecessary re-renders** by selecting only required parts of the state.
     *
     * Behavior:
     * - Selectors **do not modify the state**; they only extract computed values.
     * - Can accept arguments to compute dynamic outputs.
     */
    selectors: WithStateFunction<TState, TSelectors>;

    /**
     * `storeConfig` contains optional configurations for the store.
     *
     * Purpose:
     * - Provides **customization options** for store behavior.
     * - Can define middleware, persistence settings, and other store-level settings.
     *
     * Behavior:
     * - This is an optional property. If not provided, defaults are used.
     */
    storeConfig?: Partial<IStoreConfig<TState>>;

    /**
     * `validations` define custom validation logic for state updates.
     *
     * Purpose:
     * - Ensures **data integrity** by enforcing constraints before allowing state changes.
     * - Prevents **invalid state mutations** by throwing errors when conditions are not met.
     *
     * Behavior:
     * - A validation function receives the `prevState` and `nextState`.
     * - If validation fails, it **throws an error** to prevent the update.
     * - Each validation is **tied to a specific action name**.
     *
     * Example:
     * ```ts
     * validations: {
     *     setAge: (prevState, nextState) => {
     *         if (nextState.user.age < 0) throw new Error("Age cannot be negative.");
     *     }
     * }
     * ```
     */
    validations?: {
        [key: string]: (prevState: TState, nextState: TState) => void;
    };
}
