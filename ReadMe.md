
# re-render: Lightweight State Management

re-render is a **high-performance, minimal, and flexible state management** library designed for JavaScript and TypeScript. It focuses on **performance, simplicity, and flexibility**, making it suitable for any project.

## Why another state management library?

1. I need multiple stores under the same app like Zustand.
2. Need actions and selectors like Redux but not reducers.
3. Simple middlewares and transformers. Zustand middlewares are too complicated when used in TypeScript.
4. A good dev tools experience. Redux has one but is too complicated. Zustand doesn't have a solid one.
5. Inbuilt middlewares for logging, validations, and persistence.
6. Inbuilt transformer for Immer.
7. Custom hooks generated using Proxy to access state props individually, avoiding full object subscriptions and unnecessary component processing.
8. Pure vanilla implementation with a simple React wrapper that works for both React and non-React projects.

## Available Packages

1. **re-render-core** - A pure TypeScript store management library.
2. **re-render-react** - A React hook-based library on top of re-render-core providing `createReactStore`.

## Installation

```bash
npm i re-render-core     # for vanilla
npm i re-render-react    # for React
```

## Example Store

```ts
interface ICounterState {
    count: number;
    foo: string;
}

interface ICounterActions extends IAction {
    increment: () => void;
    decrement: () => void;
}

interface ICounterSelectors extends ISelector {
    isEven: () => boolean;
    isOdd: () => boolean;
    getCount: () => number;
    isDivisibleBy: (divisor: number) => boolean;
}
```

```ts
const counterStore = createStore<ICounterState, ICounterActions, ICounterSelectors>({
    storeName: 'counter',
    initialState: { count: 0, foo: '' },
    actions: {
        increment: (state) => { state.count++; },
        decrement: (state) => { state.count--; },
        add: (state, by) => { state.count += by; },
        resetAsync: async (state) => { state.count = 0; },
    },
    selectors: {
        isEven: (state) => state.count % 2 === 0,
        isOdd: (state) => state.count % 2 !== 0,
        getCount: (state) => state.count,
        isDivisibleBy: (state, divisor) => state.count % divisor === 0,
    },
    validations: {
        increment: (_prev, next) => {
            if (next.count >= 100)
                throwValidationError('Count cannot exceed 100.');
        },
        decrement: (_prev, next) => {
            if (next.count < 0)
                throwValidationError('Count cannot be negative!');
        },
        _: (_prev, next) => {
            if (next.count < 0)
                throwValidationError('Count cannot be negative!');
        },
    },
    storeConfig: {
        beforeMiddlewares: [validationMiddleware],
        afterMiddlewares: [loggerMiddleware],
        rollbackOnError: true,
        logDiff: true,
        useImmer: { produce },
        transformers: [immerTransformer],
    },
});
```

### Store Usage

```ts
counterStore.actions.increment();
console.log(counterStore.getState().count);
console.log(counterStore.selectors.getCount());
console.log(counterStore.selectors.isEven());
```

#### Hook-style access (React and Vanilla compatible)

```ts
// given state:
{
  count: 0,
  names: [],
  profile: { age: 0, name: '' }
}

let age = store.hooks.profile.useAge(); // works in both React and non-React
```

## Transformers

```ts
export const immerTransformer: StateTransformer<any> = {
    name: 'immerTransformer',
    fn: (storeName, actionName, prevState, nextState, config, updater) => {
        if (!config.useImmer.produce) {
            throw new Error('Immer produce function not defined.');
        }
        return config.useImmer.produce(nextState, (draft) => updater(draft));
    },
};
```

## Middleware (Sync Only)

```ts
export const loggerMiddleware: Middleware<any> = {
    name: 'logger',
    type: 'after',
    fn: (storeName, actionName, _prev, _next, config, diff) => {
        if (config.logDiff) logDiff(storeName, actionName, config, diff);
    },
};

export const validationMiddleware: Middleware<any> = {
    name: 'validation',
    type: 'before',
    fn: (storeName, actionName, prev, next, _config, _diff, validations) => {
        validations?.[actionName]?.(prev, next);
    },
};
```

## Persistence (Not Fully Tested)

```ts
const persistedStore = createStore({
    name: 'theme',
    initialState: { darkMode: false },
    persist: true,
    actions: (set) => ({
        toggleTheme: () => set((state) => ({ darkMode: !state.darkMode })),
    }),
});
```

## DevTools Integration (WIP)

Stores are added to `window.__rerender_devtools__`. DevTools UI is WIP.

## License

MIT

## Credits

If this library helped you, please give credit by linking to this repo.
