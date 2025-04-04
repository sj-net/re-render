import differ, { Diff } from 'deep-diff';
import { Middleware } from './types/middleware';
import { IStoreConfig } from './types/store';

// ✅ Function to log only modified state
export function logDiff<T>(
    storeName: string,
    actionName: string,
    config: IStoreConfig<T>,
    diff?: Diff<T, T>[] | undefined
) {
    if (diff) {
        let logger = config.logging.logger;

        diff.forEach((elem: any) => {
            const { kind } = elem;
            const output = render(elem, storeName, actionName);

            if (kind === 'A' && elem.item) {
                if (elem.item.kind === 'N') {
                    logger.log(
                        `%c ARRAY ITEM ADDED`,
                        style('N'),
                        ...[
                            storeName,
                            actionName,
                            `${elem.path.join('.')}[${elem.index}]`,
                            elem.item.rhs,
                        ]
                    );
                } else if (elem.item.kind === 'D') {
                    logger.log(
                        `%c ARRAY ITEM DELETED`,
                        style('D'),
                        ...[
                            storeName,
                            actionName,
                            `${elem.path.join('.')}[${elem.index}]`,
                            elem.item.lhs,
                        ]
                    );
                }
            } else
                logger.log(
                    `%c ${dictionary.get(kind)?.text}`,
                    style(kind),
                    ...render(elem, storeName, actionName)
                );
        });
    }
}

const dictionary = new Map([
    ['E', { color: '#2196F3', text: 'PROPERTY CHANGED:' }],
    ['N', { color: '#4CAF50', text: 'PROPERTY ADDED:' }],
    ['D', { color: '#F44336', text: 'PROPERTY DELETED:' }],
    ['A', { color: '#FF9800', text: 'ARRAY CHANGED:' }],
]);

export function style(kind: string) {
    return `color: ${dictionary.get(kind)?.color}; FONT-SIZE: 1em;`;
}

export function render(diff: any, storeName: string, actionName: string) {
    const { kind, path, lhs, rhs, index, item } = diff;

    switch (kind) {
        case 'E':
            return [storeName, actionName, path?.join('.'), lhs, '→', rhs];
        case 'N':
            return [storeName, actionName, path?.join('.'), rhs];
        case 'D':
            return [storeName, actionName, path?.join('.')];
        case 'A': {
            return [
                storeName,
                actionName,
                `${path?.join('.')}[${index}]`,
                item,
            ];
        }
        default:
            return [];
    }
}

export const throwValidationError = (msg: string) => {
    throw new ValidationError(`[Validation Error] ${msg}. So action ignored.`);
};

export class ValidationError extends Error {
    constructor(message: string) {
        super(message); // Call the parent constructor with the message
        this.name = 'Validation Error'; // Set the error name to be the custom type name
    }
}

export const isAsyncFunction = (fn: Function) =>
    Object.prototype.toString.call(fn) === '[object AsyncFunction]';

export function safeGet<T>(obj: any, path: string[]): T | null {
    return path.reduce(
        (acc, key) => (acc && acc[key] !== undefined ? acc[key] : null),
        obj
    );
}
