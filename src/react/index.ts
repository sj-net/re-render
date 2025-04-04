import { createStore as coreCreateStore } from '../core/store';
import { safeGet } from '../helper';
import { IAction, ISelector, StoreHooks } from '../types/common';
import { IStoreMetadata, IStore } from '../types/store';
import { useSyncExternalStore } from 'react';

export function createStore<
    TState,
    TActions extends IAction,
    TSelectors extends ISelector
>(
    metadata: IStoreMetadata<TState, TActions, TSelectors>
): IStore<TState, TActions, TSelectors> {
    var api = coreCreateStore(metadata);
    return {
        ...api,
        hooks: createHooks<TState>(() => api.getState(), api.subscribe),
    };
}

// Final createHooks implementation
export function createHooks<TState>(
    getState: () => TState,
    subscribe: (listener: () => void) => () => void
): StoreHooks<TState> {
    const builder = new HookBuilder(getState, subscribe);
    return builder.getProxy();
}

class HookBuilder<TState> {
    private getState: () => TState;
    private subscribe: (fn: () => void) => () => void;
    private proxyCache = new Map<string, any>();
    private hookKeyCache = new Map<string, string>();

    constructor(
        getState: () => TState,
        subscribe: (fn: () => void) => () => void
    ) {
        this.getState = getState;
        this.subscribe = subscribe;
    }

    private getHookKey(prop: string): string {
        if (!this.hookKeyCache.has(prop)) {
            const key = prop.slice(3, 4).toLowerCase() + prop.slice(4);
            this.hookKeyCache.set(prop, key);
        }
        return this.hookKeyCache.get(prop)!;
    }

    public getProxy(path: string[] = []): any {
        const cacheKey = path.join('.');
        if (this.proxyCache.has(cacheKey)) return this.proxyCache.get(cacheKey);

        const proxy = new Proxy(
            {},
            {
                get: (_, prop: string) => {
                    if (typeof prop !== 'string') return undefined;

                    if (prop.startsWith('use')) {
                        const stateKey = this.getHookKey(prop);
                        const hookPath = [...path, stateKey];

                        const hook = () =>
                            useSyncExternalStore(
                                this.subscribe,
                                () => safeGet(this.getState(), hookPath),
                                () => safeGet(this.getState(), hookPath)
                            );

                        hook.displayName = `use${hookPath
                            .map((p) => p[0].toUpperCase() + p.slice(1))
                            .join('')}`;

                        return hook;
                    }

                    const nextValue = safeGet(this.getState(), [...path, prop]);
                    if (
                        typeof nextValue === 'object' &&
                        nextValue !== null &&
                        !Array.isArray(nextValue)
                    ) {
                        return this.getProxy([...path, prop]);
                    }

                    return undefined;
                },
            }
        );

        if (import.meta.env?.MODE === 'development') Object.freeze(proxy);
        this.proxyCache.set(cacheKey, proxy);
        return proxy;
    }
}
