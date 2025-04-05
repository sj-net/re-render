import { IAction, ISelector } from './types/common';
import { IStore } from './types/store';

export function configureDevTools<
    TState,
    TActions extends IAction,
    TSelectors extends ISelector
>(storeName: string, store: IStore<TState, TActions, TSelectors>) {
    const _window = window as any;
    if (!_window.__rerender_devtools__) {
        _window.__rerender_devtools__ = {};
    }
    if (!_window.__rerender_devtools__[storeName]) {
        _window.__rerender_devtools__[storeName] = store;
    } else {
        console.warn(`[Store] Store with name "${storeName}" already exists.`);
    }
}
