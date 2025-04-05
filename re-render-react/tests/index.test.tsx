import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, render } from '@testing-library/react';
import { createStore } from '../../src/react';
import { produce } from 'immer';
import { IAction, ISelector } from '../../src';
import { loggerMiddleware } from '../../src/core/middlewares/loggerMiddleware';
import { validationMiddleware } from '../../src/core/middlewares/validationMiddleware';
import { immerTransformer } from '../../src/core/transformers/immerTransformer';

import { IStore } from '../../src/types/store';
import '@testing-library/jest-dom';
import { useEffect } from 'react';
import { initialState } from '../setup';


interface IProfile {
    name: string;
    age: number;
    status?: string;
}

export interface ICounterState {
    profile: IProfile;
    count: number;
}

export interface ICounterActions extends IAction {}

export interface ICounterSelectors extends ISelector {}

describe('createHooks', () => {
    let store: IStore<ICounterState, ICounterActions, ICounterSelectors>;

    beforeEach(() => {
        store = createStore({
            storeName: 'counter',
            initialState,
            actions: {},
            selectors: {},
            validations: {},
            storeConfig: {
                beforeMiddlewares: [validationMiddleware],
                afterMiddlewares: [loggerMiddleware],
                rollbackOnError: true,
                logDiff: true,
                useImmer: {
                    produce: produce,
                },
                transformers: [immerTransformer],
            },
        }) as IStore<ICounterState, ICounterActions, ICounterSelectors>;
    });
    it('should return correct state value', () => {
        const { result } = renderHook(() => store.hooks.useCount());
        expect(result.current).toBe(0);
    });

    it('should re-render on state change', () => {
        const { result, rerender } = renderHook(() => store.hooks.useCount());
        expect(result.current).toBe(0);
        act(() => {
            store.setState((state) => {
                state.count = 5;
            });
        });

        rerender();

        expect(result.current).toBe(5);
    });

    it('should support nested state selectors', () => {
        const { result } = renderHook(() => store.hooks.profile.useAge());
        expect(result.current).toBe(0);

        act(() => {
            store.setState((state) => {
                state.profile = {
                    age: 25,
                    name: 'John Doe',
                    status: 'active',
                };
            });
        });

        expect(result.current).toBe(25);
    });

    it('should not re-render if the subscribed value does not change', () => {
        let renderCount = 0;

        const TestComponent = () => {
            const count = store.hooks.useCount();
            useEffect(() => {
                renderCount++;
            }, [count]);
            return null;
        };

        render(<TestComponent />);

        expect(renderCount).toBe(1);

        // Update unrelated state
        act(() => {
            store.setState((s) => {
                s.profile.name = 'new name';
            });
        });

        expect(renderCount).toBe(1); // Should not re-render
    });

    it('should only re-render the component using updated state slice', () => {
        let countRender = 0;
        let profileRender = 0;

        const CountComponent = () => {
            const count = store.hooks.useCount();
            useEffect(() => {
                countRender++;
            }, [count]);
            return null;
        };

        const ProfileComponent = () => {
            const name = store.hooks.profile.useName();
            useEffect(() => {
                profileRender++;
            }, [name]);
            return null;
        };

        render(
            <>
                <CountComponent />
                <ProfileComponent />
            </>
        );

        expect(countRender).toBe(1);
        expect(profileRender).toBe(1);

        // Update only counter
        act(() => {
            store.setState((s) => {
                s.count += 1;
            });
        });

        expect(countRender).toBe(2); // CountComponent re-rendered
        expect(profileRender).toBe(1); // ProfileComponent did not
    });

    it('should not re-render nested hooks when sibling properties change', () => {
        let ageRender = 0;
        let nameRender = 0;

        const AgeComponent = () => {
            const age = store.hooks.profile.useAge();
            useEffect(() => {
                ageRender++;
            }, [age]);
            return null;
        };

        const NameComponent = () => {
            const name = store.hooks.profile.useName();
            useEffect(() => {
                nameRender++;
            }, [name]);
            return null;
        };

        render(
            <>
                <AgeComponent />
                <NameComponent />
            </>
        );

        expect(ageRender).toBe(1);
        expect(nameRender).toBe(1);

        // Only update name
        act(() => {
            store.setState((s) => {
                s.profile.name = 'New Name';
            });
        });

        expect(nameRender).toBe(2);
        expect(ageRender).toBe(1); // ✅ no re-render for age
    });

    it('should not re-render if the same value is set', () => {
        let renderCount = 0;
    
        const CountComponent = () => {
            const count = store.hooks.useCount();
            useEffect(() => {
                renderCount++;
            }, [count]);
            return null;
        };
    
        render(<CountComponent />);
        expect(renderCount).toBe(1);
    
        act(() => {
            store.setState((s) => {
                s.count = 0; // Already 0
            });
        });
    
        expect(renderCount).toBe(1); // ✅ still 1
    });
    
});
