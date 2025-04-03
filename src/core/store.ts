import { isAsyncFunction } from '../helper';
import { diff } from 'deep-diff';
import { configureDevTools } from './devTools';
import {
    IAction,
    ISelector,
    StoreHooks,
    WithStateFunction,
    WithoutStateFunction,
} from '../types/common';
import {
    IStoreConfig,
    IStoreMetadata,
    IStore,
    InlineStoreConfig,
} from '../types/store';
import merge from 'lodash.merge';
import cloneDeep from 'lodash.clonedeep';
import { initialState } from '../../tests/setup';

let globalConfig: IStoreConfig<any> = {
    logging: {
        level: 'info',
        logger: console,
        timestamp: true,
        colorize: true,
    },
    globalErrorHandler: (error, name, lastGoodState) => {
        globalConfig.logging.logger.error(` [${name}]: ${error.message}`);
        globalConfig.logging.logger.debug(lastGoodState);
    },
    afterMiddlewares: [],
    beforeMiddlewares: [],
    transformers: [],
    rollbackOnError: true,
    logDiff: true,
    devTools: false,
    useImmer: {},
};

export function setGlobalConfig(config: Partial<IStoreConfig<any>>) {
    globalConfig = merge(globalConfig, config);
}

export function getGlobalConfig() {
    return globalConfig;
}

export function createStore<
    TState,
    TActions extends IAction,
    TSelectors extends ISelector
>(
    metadata: IStoreMetadata<TState, TActions, TSelectors>
): IStore<TState, TActions, TSelectors> {
    const { storeName, actions, selectors } = metadata;
    const mergedConfig = { ...globalConfig, ...metadata.storeConfig };
    const validations = metadata.validations || {};
    let state = cloneDeep(initialState) as TState; // use initial state from tests.

    const setState = (
        updater: ((draft: TState) => void) | Partial<TState>,
        actionName: string = '_',
        inlineConfig?: InlineStoreConfig<TState>,
        ...middlewareArgs: any[]
    ) => {
        let localMergedConfig = cloneDeep(mergedConfig);

        if (inlineConfig) {
            if (inlineConfig.rollbackOnError) {
                localMergedConfig.rollbackOnError =
                    inlineConfig.rollbackOnError;
            }
            if (inlineConfig.logDiff !== undefined) {
                localMergedConfig.logDiff = inlineConfig.logDiff;
            }
            if (inlineConfig.useImmer) {
                localMergedConfig.useImmer = inlineConfig.useImmer;
            }
            if (inlineConfig.transformers) {
                localMergedConfig.transformers = inlineConfig.transformers;
            }
            if (inlineConfig.beforeMiddlewares) {
                localMergedConfig.beforeMiddlewares =
                    inlineConfig.beforeMiddlewares;
            }
            if (inlineConfig.afterMiddlewares) {
                localMergedConfig.afterMiddlewares =
                    inlineConfig.afterMiddlewares;
            }
        }

        const prevState = cloneDeep(state);
        let nextState = cloneDeep(state);

        try {
            // Step 1: Run Transformers if any or get next state from updater.
            if (
                typeof updater === 'function' &&
                localMergedConfig.transformers.length > 0
            ) {
                for (const transformer of localMergedConfig.transformers) {
                    nextState = transformer.fn(
                        storeName,
                        actionName,
                        prevState,
                        nextState,
                        localMergedConfig,
                        updater
                    );
                }
            } else {
                if (typeof updater === 'function') {
                    throw new Error(
                        'You must use a transformer like immerTransformer to use updater as a function.'
                    );
                } else {
                    nextState = merge(state, updater);
                }
            }

            // Step 2: Check for state changes. Return when there are no changes.
            let stateDiff = diff(prevState, nextState);
            if (!stateDiff) {
                // No changes in state, so return early.
                globalConfig.logging.logger.info(
                    `[${storeName}] No changes in state for action "${actionName}".`
                );
                return;
            }

            // Step 3: Run Middleware Before Update
            for (const middleware of localMergedConfig.beforeMiddlewares) {
                middleware.fn(
                    storeName,
                    actionName,
                    prevState,
                    cloneDeep(nextState), // avoid updating state from inside middleware.
                    localMergedConfig,
                    stateDiff,
                    validations,
                    ...middlewareArgs
                );
            }

            // Step 4: Commit State
            state = nextState;

            // Step 5: Run Middleware After Update
            for (const middleware of localMergedConfig.afterMiddlewares) {
                middleware.fn(
                    storeName,
                    actionName,
                    prevState,
                    cloneDeep(nextState), // avoid updating state from inside middleware.
                    localMergedConfig,
                    stateDiff,
                    ...middlewareArgs
                );
            }

            // Step 6: Notify Subscribers
            notify();
        } catch (error: any) {
            if (localMergedConfig.rollbackOnError) {
                state = prevState;
                notify();
            }
            mergedConfig.globalErrorHandler(error, storeName, state);

            throw error; // Re-throw the error after handling it.
        }
    };

    const setStateAsync = async (
        updater: ((draft: TState) => void) | Partial<TState>,
        actionName?: string,
        inlineConfig?: InlineStoreConfig<TState>,
        ...middlewareArgs: any[]
    ): Promise<void> => {
        try {
            setState(updater, actionName, inlineConfig, ...middlewareArgs);
        } catch (error) {
            return Promise.reject(error);
        }
    };

    const listeners: Set<(newState: TState) => void> = new Set();

    const notify = () => {
        const snapshot = cloneDeep<TState>(state);
        listeners.forEach((listener) => listener(snapshot)); // ensure everyone get's same state.
    };

    const subscribe = (listener: (newState: TState) => void) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    };

    const unsubscribe = (listener: (newState: TState) => void) => {
        listeners.delete(listener);
    };

    const getState = (): TState => cloneDeep(state); // return a copy of state so that state is not returned while setState is in progress.

    const reHydrate = async () => {
        if (!mergedConfig.persist) {
            return;
        }

        let persistEngine = mergedConfig.persist;
        let persistedState = await persistEngine.migrate();

        try {
            if (persistedState) {
                state = merge(state, persistedState);
                persistEngine.onRehydrateSuccess?.(state, storeName);
            }
        } catch (error: any) {
            persistEngine.onRehydrateFailure?.(error, storeName);
        }
    };

    const persistAPI = {
        reHydrate,
        clear: async () => mergedConfig.persist?.clearPersistedState(),
    };

    var store: IStore<TState, TActions, TSelectors> = {
        getState,
        setState,
        actions: createActions(
            actions,
            setState,
            setStateAsync,
            getState,
            mergedConfig
        ),
        selectors: createSelectors(selectors, getState),
        subscribe,
        unsubscribe,
        setStateAsync,
        persist: persistAPI,
        destroy: () => {
            listeners.clear();
            persistAPI.clear();
        },
        hooks: createHooks(getState),
    };

    if (mergedConfig.devTools && typeof window !== 'undefined') {
        configureDevTools(storeName, store);
    }

    return store;
}

// ✅ Optimized Action Execution (No Redundant Wrapping)
function createActions<TState, TActions extends IAction>(
    actions: WithStateFunction<TState, TActions>,
    setState: (updater: (draft: TState) => void, actionName: string) => void,
    setStateAsync: (
        updater: (draft: TState) => void,
        actionName: string
    ) => Promise<void>,
    getState: () => TState,
    mergedConfig: IStoreConfig<TState>
): WithoutStateFunction<TActions> {
    return new Proxy({} as WithoutStateFunction<TActions>, {
        get(_, key: string) {
            const action = actions[key as keyof TActions];
            if (!action) return undefined;

            return isAsyncFunction(action)
                ? async (...args: Parameters<TActions[keyof TActions]>) => {
                      await setStateAsync(
                          (state) => action(state, ...args),
                          key
                      );
                  }
                : (...args: Parameters<TActions[keyof TActions]>) => {
                      setState((state) => action(state, ...args), key);
                  };
        },
    });
}

function createSelectors<TState, TSelectors extends ISelector>(
    selectors: WithStateFunction<TState, TSelectors>,
    getState: () => TState
): WithoutStateFunction<TSelectors> {
    return new Proxy({} as WithoutStateFunction<TSelectors>, {
        get(_, key: string) {
            const selector = selectors[key as keyof TSelectors];
            if (!selector) return undefined;

            return (...args: Parameters<TSelectors[keyof TSelectors]>) =>
                selector(getState(), ...args);
        },
    });
}

function createHooks<TState>(getState: () => TState): StoreHooks<TState> {
    function createProxy(path: string[] = []): any {
        return new Proxy(() => getState(), {
            get(target, prop: string) {
                if (typeof prop !== 'string') return undefined;

                // If it's a hook request (e.g., "useTheme")
                if (prop.startsWith('use')) {
                    const key = prop.slice(3, 4).toLowerCase() + prop.slice(4); // "useTheme" -> "theme"
                    return () => safeGet(target(), [...path, key]);
                }

                // If it's a nested object, return another Proxy for deeper access
                const nextValue = safeGet(target(), [...path, prop]);
                if (
                    typeof nextValue === 'object' &&
                    nextValue !== null &&
                    !Array.isArray(nextValue)
                ) {
                    return createProxy([...path, prop]);
                }

                return undefined; // Avoid exposing non-object properties
            },
        });
    }

    return createProxy();
}

function safeGet<T>(obj: any, path: string[]): T | null {
    return path.reduce(
        (acc, key) => (acc && acc[key] !== undefined ? acc[key] : null),
        obj
    );
}
