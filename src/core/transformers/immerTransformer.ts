import { StateTransformer } from "../../types/transformers";

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
