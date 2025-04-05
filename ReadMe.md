# re-render: Lightweight State Management

re-render is a **high-performance, minimal, and flexible state management** library designed for JavaScript and TypeScript. It focuses on **performance, simplicity, and flexibility**, making it suitable for any project.

Why another state management library ?

1. I need multiple stores under same app like zustand.
2. Need actions and selectors like redux but not reducers.
3. Simple middlewares and transformers. Zustand middlewares are too complicated when used in typescript.
4. A good dev tools. Redux has one but redux itself is too complicated. And zustand doesn't have a solid one.
5. In built middlewares for logging, validations and persistance.
6. In built transformer for immer.
7. Generated custom hooks to access all props of a state using Proxy. To avoid subscribing whole state object and avoid unnecessary component proccessing and rerender.
8. A pure vanilla implementation and a simple react wrapper on top of it which works for both react and non react projects.

## Available Packages

1. re-render-core - A pure typescript based store management library.
2. re-render-react - A react hook based libary on top of re-render-core. This provides a new method named `createReactStore`.

## Usage

```
npm i re-renoder-core // for vanilla
npm i re-render-react // for react

```

### Basic Store

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

const counterStore = createStore<ICounterState, ICounterActions, ICounterSelectors>({
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
    validations: {
        increment: (_prevState, nextState) => {
            if (nextState.count >= validationErrorMaxValue) {
                throwValidationError(
                    `Count cannot become greater than ${validationErrorMaxValue}.`
                );
            }
        },

        decrement: (_prevState, nextState) => {
            if (nextState.count < 0) {
                throwValidationError('Count cannot become negative!');
            }
        },
        _: (_prevState, nextState) => {
            // global validation for all actions in this store.
            if (nextState.count < 0) {
                throwValidationError('Count cannot become negative!');
            }
        },
    },
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
});

// usage

counterStore.setState((state) => {
    state.count = 1;
}); // sets count to 1

counterStore.setState((state) => {
    state.count += 1;
}); // sets count to 2

counterStore.setState({
    count: 3,
}); // sets count to 3

counterStore.setState({
    foo: 'render',
}); // sets foo to render

counterStore.setState((state) => {
    state.count += 1;
}); // sets count to count + 1

counterStore.actions.increment(); // calls the increment action and does +1
counterStore.actions.decrement(); // calls the increment action and does -1
console.log(counterStore.getState().count); // access current count using getState()
console.log(counterStore.selectors.getCount()); // access current count using selector
console.log(counterStore.selectors.isEven()); // check if count is even using selector
console.log(counterStore.selectors.isOdd()); // check if count is odd using selector
console.log(counterStore.selectors.isDivisibleBy(7)); // check if count is divisble by give number 7 using selector

// hooks usage in both react and vanilla projects.
// For object like this
{
    count: 0,
    names: [],
    profile: {
        age: 0,
        name: '',
    },
};
// usage is
let age = store.hooks.profile.useAge(); // this works in both react and non react becuase the core app also creates simple hooks object on store api to be compatible with react hooks concept. Check the tests/react/index.text.tsx for react hooks examples.

```

### Transformers

A transformer is something that changes the state before setting it. Currently only immerTransformer is available.

```ts
export const immerTransformer: StateTransformer<any> = {
    name: 'immerTransformer',
    fn: (
        _storeName,
        _actionName,
        _prevState,
        nextState,
        config,
        updater,
        ..._args: any[]
    ) => {
        if (config.useImmer.produce) {
            const { produce } = config.useImmer;
            return produce(nextState, (draft) => {
                // Apply the changes to the draft state
                updater(draft);
            });
        } else {
            throw new Error(
                'immerTransformer: produce function is not defined in config.'
            );
        }
    },
};
```

### Middleware (Synchronous Only)

```ts
export const loggerMiddleware: Middleware<any> = {
    name: 'logger',
    type: 'after',
    fn: (
        storeName: string,
        actionName: string,
        _prevState,
        _nextState,
        config,
        diff: Diff<any, any>[] | undefined,
        ...args: any[]
    ) => {
        if (!config.logDiff) return;
        logDiff(storeName, actionName, config, diff);
    },
};

export const validationMiddleware: Middleware<any> = {
    name: 'validation',
    type: 'before',
    fn: (
        _storeName: string,
        actionName: string,
        prevState,
        nextState,
        _config,
        _diff: any,
        validations: any,
        ..._args: any[]
    ) => {
        if (validations) {
            if (Object.keys(validations).includes(actionName)) {
                validations[actionName](prevState, nextState);
            }
        }
    },
};
```

### State Persistence (Not fully tested)

```ts
const persistedStore = createStore({
    name: 'theme',
    initialState: { darkMode: false },
    persist: true, // Uses localStorage by default
    actions: (set) => ({
        toggleTheme: () => set((state) => ({ darkMode: !state.darkMode })),
    }),
});
```

### DevTools Integration (WIP)

re-render automatically adds all store objects to `window.__rerender_devtools__`, allowing dev tools in a separate UI.

Dev tools window is yet to be developed.

## License

MIT

## Credits:

If this library helped you please give the credits linking to this repo.
