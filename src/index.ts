// src/index.ts

// Import necessary functions or classes from your library
import { createStore, setGlobalConfig } from './core/store'; // Adjust according to your actual code structure

import { IAction, ISelector, SelectorFn } from './types/common'; // Adjust according to your actual code structure
import { logDiff, throwValidationError, ValidationError } from './helper';
import { Middleware } from './types/middleware';

// Expose the core functions or classes to be available to consumers of the library
export {
    createStore,
    setGlobalConfig,
    IAction,
    ISelector,
    Middleware,
    SelectorFn,
    logDiff,
    throwValidationError,
    ValidationError,
};
