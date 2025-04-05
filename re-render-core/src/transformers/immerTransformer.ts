import { StateTransformer } from "../types/transformers";

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
        if (!config.useImmer.produce) {
            throw new Error('Immer produce function not defined.');
        }
        return config.useImmer.produce(nextState, (draft) => updater(draft));
    },
};
