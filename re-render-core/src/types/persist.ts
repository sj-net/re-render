export interface IPersistStorage<T> {
    /**
     * Fetches a stored value by its key.
     * 
     * @param key - The key associated with the stored value.
     * @returns A promise resolving to the retrieved value or `null` if not found.
     */
    getItem: (key: string) => Promise<any>;

    /**
     * Stores a value under a given key.
     * 
     * @param key - The key under which the value will be stored.
     * @param value - The value to be persisted.
     */
    setItem: (key: string, value: any) => Promise<void>;

    /**
     * Removes a stored value by its key.
     * 
     * @param key - The key of the item to be removed.
     */
    removeItem: (key: string) => Promise<void>;

    /**
     * Clears all stored data.
     * 
     * WARNING: This affects all stored state, use cautiously.
     */
    clear: () => Promise<void>;

    /**
     * Purges stored state but may keep metadata (e.g., versioning data).
     */
    purge: () => Promise<void>;

    /**
     * Transforms the state **before persisting** it.
     * 
     * Example: Serializing an object before storing.
     */
    preWriteTransform?: (state: T) => any;

    /**
     * Transforms the state **after rehydrating** it from storage.
     * 
     * Example: Parsing stored JSON before using it.
     */
    postReadTransform?: (state: T) => any;
}


export interface IPersistEngine<T> {
    /**
     * The **storage engine** responsible for persisting state.
     * 
     * Example: Can be localStorage, IndexedDB, or custom storage.
     */
    storage: IPersistStorage<T>;

    /**
     * Function to migrate persisted state to a new version.
     * 
     * Returns the **updated state** after migration.
     */
    migrate: () => Promise<T>;

    /**
     * Called when **state persistence fails**.
     * 
     * Helps with logging or retry mechanisms.
     */
    writeFailHandler?: (err: Error) => void;

    /**
     * Configuration options for persistence behavior.
     */
    options: IPersistOptions<T>;

    /**
     * Called when **migration fails**.
     * 
     * Provides details like the failed version and store name.
     */
    onMigrationFailure?: (
        err: Error,
        versionFailed: number,
        storeName: string
    ) => void;

    /**
     * Called when **migration succeeds**.
     * 
     * Provides the **migrated state and version**.
     */
    onMigrationSuccess?: (state: T, version: number, storeName: string) => void;

    /**
     * Called when **state persistence succeeds**.
     * 
     * Useful for logging or analytics.
     */
    onPersistSuccess?: (
        state: T,
        storeName: string,
        actionName: string
    ) => void;

    /**
     * Called when **state persistence fails**.
     * 
     * Provides error details, store name, and the action name that triggered persistence.
     */
    onPersistFailure?: (
        err: Error,
        storeName: string,
        actionName: string
    ) => void;

    /**
     * Called when **state rehydration succeeds**.
     * 
     * Useful for debugging or UI updates.
     */
    onRehydrateSuccess?: (state: T, storeName: string) => void;

    /**
     * Called when **state rehydration fails**.
     * 
     * Provides error details and store name.
     */
    onRehydrateFailure?: (err: Error, storeName: string) => void;

    /**
     * Retrieves the latest **hydrated state** from storage.
     */
    getHydratedState: () => Promise<any>;

    /**
     * Saves the current **state to storage**.
     */
    persistState: (state: T) => Promise<void>;

    /**
     * Clears the **persisted state** from storage.
     */
    clearPersistedState: () => Promise<void>;
}
export interface IPersistOptions<T> {
    /**
     * The **storage key** where the state is saved.
     */
    key: string;

    /**
     * The **state version** to track migrations.
     */
    version: number;

    /**
     * **Whitelisted keys** that should be persisted.
     * 
     * Example: Only persist `['userSettings', 'theme']`.
     */
    whitelist?: Array<string>;

    /**
     * **Blacklisted keys** that should NOT be persisted.
     * 
     * Example: Ignore `['temporaryData', 'cache']`.
     */
    blacklist?: Array<string>;

    /**
     * If `true`, **automatically rehydrates** state after retrieving it.
     */
    isAutoRehydrate?: boolean;

    /**
     * **State migration functions** for different versions.
     * 
     * Example:
     * ```ts
     * migrateVersions: {
     *    1: (storedState) => ({ ...storedState, newField: 'default' }),
     *    2: (storedState) => removeOldFields(storedState)
     * }
     * ```
     */
    migrateVersions?: {
        [key: number]: (storedState: T, version: number) => T;
    };

    /**
     * **Throttle time (ms)** for persisting state updates.
     * 
     * Helps prevent excessive writes.
     */
    throttle?: number;
}
