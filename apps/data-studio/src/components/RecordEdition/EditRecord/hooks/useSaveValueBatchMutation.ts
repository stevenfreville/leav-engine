// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
import {ApolloError, useApolloClient, useMutation} from '@apollo/client';
import {ErrorTypes, objectToNameValueArray} from '@leav/utils';
import {saveValueBatchMutation} from 'graphQL/mutations/values/saveValueBatchMutation';
import {useValuesCacheUpdate} from 'hooks/useValuesCacheUpdate';
import {useTranslation} from 'react-i18next';
import {SAVE_VALUE_BATCH, SAVE_VALUE_BATCHVariables} from '_gqlTypes/SAVE_VALUE_BATCH';
import {APICallStatus, FieldSubmitMultipleFunc} from '../_types';

export interface ISaveValueBatchHook {
    saveValues: FieldSubmitMultipleFunc;
    loading: boolean;
}

export default function useSaveValueBatchMutation(): ISaveValueBatchHook {
    const {cache} = useApolloClient();
    const [executeSaveValueBatch, {loading}] = useMutation<SAVE_VALUE_BATCH, SAVE_VALUE_BATCHVariables>(
        saveValueBatchMutation
    );
    const updateValuesCache = useValuesCacheUpdate();
    const {t} = useTranslation();

    return {
        saveValues: async (record, values, version, deleteEmpty = false) => {
            try {
                const saveRes = await executeSaveValueBatch({
                    variables: {
                        library: record.library.id,
                        recordId: record.id,
                        values: values.map(valueToSave => ({
                            attribute: valueToSave.attribute,
                            id_value: valueToSave.idValue,
                            value: valueToSave.value !== null ? String(valueToSave.value) : null,
                            metadata: valueToSave.metadata
                                ? objectToNameValueArray(valueToSave.metadata).map(({name, value}) => ({
                                      name,
                                      value: String(value)
                                  }))
                                : null
                        })),
                        version: version
                            ? objectToNameValueArray(version).map(v => ({treeId: v.name, treeNodeId: v.value.id}))
                            : null,
                        deleteEmpty
                    }
                });
                const {values: savedValues, errors} = saveRes.data.saveValueBatch;

                updateValuesCache(record, savedValues);

                const status =
                    errors?.length && savedValues.length
                        ? APICallStatus.PARTIAL
                        : errors?.length && !savedValues.length
                        ? APICallStatus.ERROR
                        : APICallStatus.SUCCESS;

                return {
                    status,
                    ...saveRes.data.saveValueBatch
                };
            } catch (err) {
                const gqlError = (err as ApolloError).graphQLErrors?.[0];

                const message = gqlError?.extensions?.code
                    ? gqlError.extensions.code === ErrorTypes.VALIDATION_ERROR
                        ? Object.values(gqlError.extensions.fields).join('\n')
                        : t(`error.${gqlError.extensions.code}`)
                    : (err as Error).message;

                return {status: APICallStatus.ERROR, error: message};
            }
        },
        loading
    };
}
