# Note:

1. I have developed this as I wanted this in one of my project.
2. I do not have any plans or time to push this to package manaeger as of now.
3. Feel free to fork and use it just a internal code in your project.
4. If you want to contribute please send a PR.

# ReRender - Lightweight State Management

ReRender is a **high-performance, minimal, and flexible state management** library designed for JavaScript and TypeScript. It focuses on **performance, simplicity, and flexibility**, making it suitable for any project.

Inspired by [Zustand](https://github.com/pmndrs/zustand).

Why another state management library ?

1. I need multiple stores under same app like zustand.
2. Need actions and selectors like redux but not reducers.
3. Simple middlewares and transformers. Zustand middlewares are too complicated when used in typescript.
4. A good dev tools. Redux has one but redux itself is too complicated. And zustand doesn't have a solid one.
5. In built middlewares for logging, validations and persistance.
6. In built transformer for immer.
7. Generated custom hooks to access all props of a state using Proxy. To avoid subscribing whole state object and avoid unnecessary component proccessing and rerender.
8. A pure vanilla implementation and a simple react wrapper on top of it which works for both react and non react projects.

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

### Middleware (Synchronous Only)

```ts
const store = createStore({
    name: 'auth',
    initialState: { user: null },
    actions: (set) => ({
        login: (user) => set({ user }),
        logout: () => set({ user: null }),
    }),
    middlewares: [loggerMiddleware],
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
