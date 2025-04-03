# ReRender - Lightweight State Management

ReRender is a **high-performance, minimal, and flexible state management** library designed for JavaScript and TypeScript. It focuses on **performance, simplicity, and flexibility**, making it suitable for any project.

Inspired by [Zustand](https://github.com/pmndrs/zustand).

Why another state management library ?

1. Multiple stores under same app.
2. Simplified middleware system.
3. In built - Logger, Validation, Persistance and DevTools
4. Pure TypeScript.
5. Redux inspired actions and selectors.
6. No Reducers and dispatch.
7. No proper dev tools extension for zustand. In built dev tool will help

Basically I wanted a mix of Redux & Zustand concepts.

## Features

-   **Lightweight**: Minimal footprint with only dependency of deep-diff
-   **High Performance**: Optimized updates, avoiding unnecessary re-renders.
-   **Middleware Support**: Global and per-store middlewares for logging, side effects, etc.
-   **Validation**: Built-in validation before state updates.
-   **State Persistence**: Store state in localStorage/sessionStorage.
-   **Vanilla JS & TypeScript**: Works with both.
-   **DevTools Support**: Exposes internal state for debugging.

## Installation (Not yet pushed to npm/yarn)

```sh
yarn add re-render
# or
npm install re-render
```

## Usage

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

const counterStore = createStore<
    ICounterState,
    ICounterActions,
    ICounterSelectors
>(
    'counter',
    {
        count: 0,
        foo: 's',
    },
    {
        increment: (state: ICounterState) => {
            state.count++;
        },
        decrement: (state: ICounterState) => {
            state.count--;
        },
    },
    {
        isEven: (state: ICounterState) => state.count % 2 === 0,
        isOdd: (state: ICounterState) => state.count % 2 !== 0,
        getCount: (state: ICounterState) => state.count,
        isDivisibleBy: (state: ICounterState, divisor: number) =>
            state.count % divisor === 0,
    },
    {},
    {
        increment: (prevState, nextState) => {
            if (nextState.count >= 10) {
                throwValidationError('Count cannot become greater than 10!');
            }
        },

        decrement: (prevState, nextState) => {
            if (nextState.count < 0) {
                throwValidationError('Count cannot become negative!');
            }
        },
    }
);

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
```

### Middleware (Synchronous Only)

```ts
const store = createStore({
    name: 'auth',
    initialState: { user: null },
    actions: (set) => ({
        login: (user) => set({ user }),
        logout: () => set({ user: null }),
    }),
    middlewares: [
        loggerMiddleware,
    ],
});
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

ReRender automatically registers stores to `window.__rerender_devtools__`, allowing debugging in a separate UI.

## License

MIT
