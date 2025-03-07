// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
import {FloatingMenu, FloatingMenuAction} from '@leav/ui';
import DeleteValueBtn from 'components/RecordEdition/EditRecord/shared/DeleteValueBtn';
import ValueDetailsBtn from 'components/RecordEdition/EditRecord/shared/ValueDetailsBtn';
import EditRecordBtn from 'components/RecordEdition/EditRecordBtn';
import {RecordProperty} from 'graphQL/queries/records/getRecordPropertiesQuery';
import {ReactNode} from 'react';
import {useTranslation} from 'react-i18next';
import {RECORD_FORM_recordForm_elements_attribute} from '_gqlTypes/RECORD_FORM';
import {IRecordIdentityWhoAmI} from '_types/types';

interface IFloatingMenuHandlerProps {
    record: IRecordIdentityWhoAmI;
    onDelete: (record: IRecordIdentityWhoAmI) => void;
    value: RecordProperty;
    attribute: RECORD_FORM_recordForm_elements_attribute;
    isReadOnly: boolean;
    children?: ReactNode;
}

function FloatingMenuHandler({
    record,
    onDelete,
    value,
    attribute,
    isReadOnly,
    children
}: IFloatingMenuHandlerProps): JSX.Element {
    const {t} = useTranslation();
    const _handleDelete = () => onDelete(record);

    const menuActions: FloatingMenuAction[] = [
        {
            title: t('global.edit'),
            button: <EditRecordBtn record={record} shape="circle" />
        },
        {
            title: t('record_edition.value_details'),
            button: <ValueDetailsBtn value={value} attribute={attribute} />
        }
    ];

    if (!isReadOnly) {
        menuActions.push({
            title: t('global.delete'),
            button: <DeleteValueBtn onDelete={_handleDelete} />
        });
    }

    return (
        <div>
            {children}
            <FloatingMenu actions={menuActions} />
        </div>
    );
}

export default FloatingMenuHandler;
