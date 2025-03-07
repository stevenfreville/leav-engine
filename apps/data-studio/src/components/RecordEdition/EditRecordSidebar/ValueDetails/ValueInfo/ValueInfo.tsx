// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
import {RecordCard, themeVars} from '@leav/ui';
import {useEditRecordModalReducer} from 'components/RecordEdition/editRecordModalReducer/useEditRecordModalReducer';
import PropertiesList from 'components/shared/PropertiesList';
import {IRecordPropertyLink, IRecordPropertyTree} from 'graphQL/queries/records/getRecordPropertiesQuery';
import {useTranslation} from 'react-i18next';
import styled from 'styled-components';
import {checkTypeIsLink, getValueVersionLabel, isTypeStandard} from 'utils';
import {AttributeFormat} from '_gqlTypes/globalTypes';
import {PreviewSize} from '_types/types';
import isEmpty from 'lodash/isEmpty';

const Wrapper = styled.div`
    padding: 1rem;
`;

const ValueLengthWrapper = styled.div`
    background: ${themeVars.activeColor};
    padding: 0px 15px;
    border-radius: 1em;
    width: fit-content;
`;

const Title = styled.div`
    margin-bottom: 1rem;
    display: flex;
    gap: 1rem;
`;

const DisplayValueId = styled.div`
    font-style: italic;
    color: rgba(0, 0, 0, 0.4);
    font-size: 10px;
    position: relative;
    left: 81%;
    margin-bottom: 10px;
`;

function ValueInfo(): JSX.Element {
    const {t} = useTranslation();
    const {state} = useEditRecordModalReducer();
    const {value, attribute} = state.activeValue;

    const valueDetailsContent = value?.modified_at
        ? [
              {
                  title: isTypeStandard(attribute.type)
                      ? t('record_edition.created_at')
                      : t('record_edition.link_created_at'),
                  value: `${new Date(value.created_at * 1000).toLocaleString()} ${
                      value?.created_by ? ` ${t('record_edition.by')} ${value.created_by.whoAmI.label}` : ''
                  }`
              },
              {
                  title: t('record_edition.modified_at'),
                  value: `${new Date(value.modified_at * 1000).toLocaleString()} ${
                      value?.modified_by ? ` ${t('record_edition.by')} ${value.modified_by.whoAmI.label}` : ''
                  }`
              }
          ]
        : [];

    if (value?.version && !isEmpty(value?.version)) {
        valueDetailsContent.push({
            title: t('values_version.version'),
            value: getValueVersionLabel(value.version)
        });
    }

    if (state?.record && value?.id_value && !isEmpty(value?.id_value)) {
        valueDetailsContent.push({
            title: t('record_edition.attribute.id'),
            value: value?.id_value
        });
    }

    const canCountValueLength =
        isTypeStandard(attribute.type) && attribute.format === AttributeFormat.text && !!state.activeValue.value;

    if (!valueDetailsContent.length && !canCountValueLength) {
        return null;
    }

    const valueLength = canCountValueLength ? String(state.activeValue.editingValue).length : null;
    const valueDetailsSectionTitle = isTypeStandard(attribute.type)
        ? t('record_edition.value_details')
        : t('record_edition.link_details');

    const valueWhoAmI = isTypeStandard(attribute.type)
        ? null
        : checkTypeIsLink(attribute.type)
        ? (value as IRecordPropertyLink)?.linkValue?.whoAmI
        : (value as IRecordPropertyTree)?.treeValue?.record?.whoAmI;

    return (
        <Wrapper>
            <Title>
                {valueDetailsSectionTitle}:
                {canCountValueLength && (
                    <ValueLengthWrapper>{t('record_edition.value_length', {length: valueLength})}</ValueLengthWrapper>
                )}
            </Title>
            {valueWhoAmI && (
                <RecordCard record={valueWhoAmI} size={PreviewSize.big} tile style={{marginBottom: '1rem'}} />
            )}
            <PropertiesList items={valueDetailsContent} />
        </Wrapper>
    );
}

export default ValueInfo;
