import { describe, expect, it } from 'vitest';
import { createStore } from '../src';
import { produce } from 'immer';
import { loggerMiddleware } from '../src/core/middlewares/loggerMiddleware';
import { validationMiddleware } from '../src/core/middlewares/validationMiddleware';
import { immerTransformer } from '../src/core/transformers/immerTransformer';
import {
    createPersistEngine,
    DefaultPersistEngine,
} from '../src/core/persist/DefaultPersistEngine';
import { getGlobalConfig } from '../src/core/store';
import { persistMiddleware } from '../src/core/middlewares/persistMiddleware';
import {
    ICounterState,
    ICounterActions,
    ICounterSelectors,
    initialState,
} from './setup';
import { IStore } from '../src/types/store';
import { IPersistEngine } from '../src/types/persist';
import { WebStorage } from '../src/core/persist/storage/webStorage';

const createCounterStore = (
    persistEngine?: IPersistEngine<ICounterState>
): IStore<ICounterState, ICounterActions, ICounterSelectors> => {
    if (!persistEngine)
        persistEngine = createPersistEngine<ICounterState>(
            'counter',
            1,
            new WebStorage(),
            getGlobalConfig().logging,
            {
                isAutoRehydrate: true,
            }
        );

    return createStore<ICounterState, ICounterActions, ICounterSelectors>({
        storeName: 'counter',
        initialState,
        actions: {
            increment: (state: ICounterState) => {
                state.count++;
            },
            decrement: (state: ICounterState) => {
                state.count--;
            },
            add: (state: ICounterState, by: number) => {
                state.count = state.count + by;
            },
            resetAsync: async (state: ICounterState) => {
                state.count = 0;
            },
        },
        selectors: {
            isEven: (state: ICounterState) => state.count % 2 === 0,
            isOdd: (state: ICounterState) => state.count % 2 !== 0,
            getCount: (state: ICounterState) => state.count,
            isDivisibleBy: (state: ICounterState, divisor: number) =>
                state.count % divisor === 0,
            getNames: (state: ICounterState) => state.names,
        },
        validations: {},
        storeConfig: {
            beforeMiddlewares: [validationMiddleware],
            afterMiddlewares: [loggerMiddleware, persistMiddleware],
            rollbackOnError: true,
            logDiff: false,
            useImmer: {
                produce: produce,
            },
            transformers: [immerTransformer],
            persist: persistEngine,
        },
    });
};

const sessionStorageEngine = () =>
    createPersistEngine<ICounterState>(
        'counter',
        1,
        new WebStorage('sessionStorage'),
        getGlobalConfig().logging,
        {
            isAutoRehydrate: true,
        }
    );

describe('Persist State Management', () => {
    let store: IStore<ICounterState, ICounterActions, ICounterSelectors>;

    it('LocalStorage: should persist state upon store recreation.', async () => {
        store = createCounterStore();
        store.actions.increment();
        store = createCounterStore();
        await store.persist.reHydrate();
        expect(store.selectors.getCount()).toEqual(1);
    });

    it('LocalStorage: should clear persisted storage', async () => {
        store = createCounterStore();
        store.actions.increment();
        store = createCounterStore();
        await store.persist.reHydrate();
        expect(store.selectors.getCount()).toEqual(1);
        await store.persist.clear();
        store = createCounterStore();
        expect(store.selectors.getCount()).toEqual(0);
    });

    it('SessionStorage: should persist state upon store recreation.', async () => {
        store = createCounterStore(sessionStorageEngine());
        store.actions.increment();
        store = createCounterStore(sessionStorageEngine());
        await store.persist.reHydrate();
        expect(store.selectors.getCount()).toEqual(1);
    });

    it('SessionStorage: should clear persisted storage', async () => {
        store = createCounterStore(sessionStorageEngine());
        store.actions.increment();
        store = createCounterStore(sessionStorageEngine());
        await store.persist.reHydrate();
        expect(store.selectors.getCount()).toEqual(1);
        await store.persist.clear();
        store = createCounterStore(sessionStorageEngine());
        expect(store.selectors.getCount()).toEqual(0);
    });

    it('Migrate from old version to new version', async () => {
        store = createCounterStore(
            new DefaultPersistEngine<ICounterState>(
                {
                    key: 'migrate',
                    version: 1,
                },
                new WebStorage(),
                getGlobalConfig().logging
            )
        );
        store.actions.increment();

        store = createCounterStore(
            new DefaultPersistEngine<ICounterState>(
                {
                    key: 'migrate',
                    version: 2,
                    migrateVersions: {
                        2: (storedState, version) => {
                            storedState.migrated = true;
                            storedState.migratedVersion = version;
                            return storedState;
                        },
                    },
                },
                new WebStorage(),
                getGlobalConfig().logging
            )
        );
        await store.persist.reHydrate();
        expect(store.getState().migrated).toBe(true);
        expect(store.getState().migratedVersion).toBe(2);
    });
});
