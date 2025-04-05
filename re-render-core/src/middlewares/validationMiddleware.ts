import { Diff } from 'deep-diff';
import { logDiff } from '../helper';
import { Middleware } from '../types/middleware';

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
        validations?.[actionName]?.(prevState, nextState);
    },
};
