import { Diff } from 'deep-diff';
import { logDiff } from '../helper';
import { Middleware } from '../types/middleware';

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
