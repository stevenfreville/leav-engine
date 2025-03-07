// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
import {EventAction} from '@leav/utils';
import {IEventsManagerDomain} from 'domain/eventsManager/eventsManagerDomain';
import {GetCoreEntityByIdFunc} from 'domain/helpers/getCoreEntityById';
import {IValidateHelper} from 'domain/helpers/validate';
import {ILibraryPermissionDomain} from 'domain/permission/libraryPermissionDomain';
import {IValueDomain} from 'domain/value/valueDomain';
import {IAttributeWithRevLink} from 'infra/attributeTypes/attributeTypesRepo';
import {ICachesService} from 'infra/cache/cacheService';
import {ILibraryRepo} from 'infra/library/libraryRepo';
import {IRecordRepo} from 'infra/record/recordRepo';
import {ITreeRepo} from 'infra/tree/treeRepo';
import {IValueRepo} from 'infra/value/valueRepo';
import moment from 'moment';
import {join} from 'path';
import {IUtils} from 'utils/utils';
import * as Config from '_types/config';
import {IListWithCursor} from '_types/list';
import {IPreview} from '_types/preview';
import {IStandardValue,IValue,IValuesOptions} from '_types/value';
import PermissionError from '../../errors/PermissionError';
import ValidationError from '../../errors/ValidationError';
import {getPreviewUrl} from '../../utils/preview/preview';
import {ActionsListEvents} from '../../_types/actionsList';
import {AttributeFormats,AttributeTypes,IAttribute,IAttributeFilterOptions} from '../../_types/attribute';
import {Errors} from '../../_types/errors';
import {ILibrary,LibraryBehavior} from '../../_types/library';
import {LibraryPermissionsActions,RecordPermissionsActions} from '../../_types/permissions';
import {IQueryInfos} from '../../_types/queryInfos';
import {
    AttributeCondition,
    IRecord,
    IRecordFilterOption,
    IRecordIdentity,
    IRecordIdentityConf,
    IRecordSort,
    Operator,
    TreeCondition
} from '../../_types/record';
import {IAttributeDomain} from '../attribute/attributeDomain';
import {IRecordPermissionDomain} from '../permission/recordPermissionDomain';
import getAttributesFromField from './helpers/getAttributesFromField';
import {SendRecordUpdateEventHelper} from './helpers/sendRecordUpdateEvent';
import {ICreateRecordResult,IFindRecordParams,IRecordFilterLight} from './_types';

/**
 * Simple list of filters (fieldName: filterValue) to apply to get records.
 */
const allowedTypeOperator = {
    string: [
        AttributeCondition.EQUAL,
        AttributeCondition.NOT_EQUAL,
        AttributeCondition.BEGIN_WITH,
        AttributeCondition.END_WITH,
        AttributeCondition.CONTAINS,
        AttributeCondition.NOT_CONTAINS,
        AttributeCondition.START_ON,
        AttributeCondition.START_BEFORE,
        AttributeCondition.START_AFTER,
        AttributeCondition.END_ON,
        AttributeCondition.END_BEFORE,
        AttributeCondition.END_AFTER,
        TreeCondition.CLASSIFIED_IN,
        TreeCondition.NOT_CLASSIFIED_IN
    ],
    number: [
        AttributeCondition.EQUAL,
        AttributeCondition.NOT_EQUAL,
        AttributeCondition.GREATER_THAN,
        AttributeCondition.LESS_THAN,
        AttributeCondition.START_ON,
        AttributeCondition.START_BEFORE,
        AttributeCondition.START_AFTER,
        AttributeCondition.END_ON,
        AttributeCondition.END_BEFORE,
        AttributeCondition.END_AFTER,
        AttributeCondition.VALUES_COUNT_EQUAL,
        AttributeCondition.VALUES_COUNT_GREATER_THAN,
        AttributeCondition.VALUES_COUNT_LOWER_THAN
    ],
    boolean: [AttributeCondition.EQUAL, AttributeCondition.NOT_EQUAL],
    null: [
        AttributeCondition.EQUAL,
        AttributeCondition.NOT_EQUAL,
        AttributeCondition.IS_EMPTY,
        AttributeCondition.IS_NOT_EMPTY,
        AttributeCondition.TODAY,
        AttributeCondition.YESTERDAY,
        AttributeCondition.TOMORROW,
        AttributeCondition.LAST_MONTH,
        AttributeCondition.NEXT_MONTH
    ],
    object: [AttributeCondition.BETWEEN]
};

export interface IRecordDomain {
    createRecord(params: {library: string; values?: IValue[]; ctx: IQueryInfos}): Promise<ICreateRecordResult>;

    /**
     * Update record
     * Must be used to update metadata (modified_at, ...) only
     */
    updateRecord({
        library,
        recordData,
        ctx
    }: {
        library: string;
        recordData: IRecord;
        ctx: IQueryInfos;
    }): Promise<IRecord>;

    deleteRecord({library, id, ctx}: {library: string; id: string; ctx: IQueryInfos}): Promise<IRecord>;

    /**
     * Search records
     * Filters to apply on records selection
     * Fields to retrieve on each records
     */
    find({params, ctx}: {params: IFindRecordParams; ctx: IQueryInfos}): Promise<IListWithCursor<IRecord>>;

    getRecordFieldValue(params: {
        library: string;
        record: IRecord;
        attributeId: string;
        options?: IValuesOptions;
        ctx: IQueryInfos;
    }): Promise<IValue | IValue[]>;

    getRecordIdentity(record: IRecord, ctx: IQueryInfos): Promise<IRecordIdentity>;

    deactivateRecord(record: IRecord, ctx: IQueryInfos): Promise<IRecord>;

    activateRecord(record: IRecord, ctx: IQueryInfos): Promise<IRecord>;

    deactivateRecordsBatch(params: {
        libraryId: string;
        recordsIds?: string[];
        filters?: IRecordFilterLight[];
        ctx: IQueryInfos;
    }): Promise<IRecord[]>;

    purgeInactiveRecords(params: {libraryId: string; ctx: IQueryInfos}): Promise<IRecord[]>;
}

interface IDeps {
    config?: Config.IConfig;
    'core.infra.record'?: IRecordRepo;
    'core.domain.attribute'?: IAttributeDomain;
    'core.domain.value'?: IValueDomain;
    'core.domain.permission.record'?: IRecordPermissionDomain;
    'core.domain.permission.library'?: ILibraryPermissionDomain;
    'core.domain.helpers.getCoreEntityById'?: GetCoreEntityByIdFunc;
    'core.domain.helpers.validate'?: IValidateHelper;
    'core.domain.record.helpers.sendRecordUpdateEvent'?: SendRecordUpdateEventHelper;
    'core.infra.library'?: ILibraryRepo;
    'core.infra.tree'?: ITreeRepo;
    'core.infra.value'?: IValueRepo;
    'core.domain.eventsManager'?: IEventsManagerDomain;
    'core.infra.cache.cacheService'?: ICachesService;
    'core.utils'?: IUtils;
}

export default function ({
    config = null,
    'core.infra.record': recordRepo = null,
    'core.domain.attribute': attributeDomain = null,
    'core.domain.value': valueDomain = null,
    'core.domain.permission.record': recordPermissionDomain = null,
    'core.domain.permission.library': libraryPermissionDomain = null,
    'core.domain.helpers.getCoreEntityById': getCoreEntityById = null,
    'core.domain.helpers.validate': validateHelper = null,
    'core.domain.record.helpers.sendRecordUpdateEvent': sendRecordUpdateEvent = null,
    'core.infra.library': libraryRepo = null,
    'core.infra.tree': treeRepo = null,
    'core.infra.value': valueRepo = null,
    'core.domain.eventsManager': eventsManager = null,
    'core.infra.cache.cacheService': cacheService = null,
    'core.utils': utils = null
}: IDeps = {}): IRecordDomain {
    /**
     * Extract value from record if it's available (attribute simple), or fetch it from DB
     *
     * @param record
     * @param attribute
     * @param library
     * @param options
     * @param ctx
     */
    const _extractRecordValue = async (
        record: IRecord,
        attribute: IAttribute,
        library: string,
        options: IValuesOptions,
        ctx: IQueryInfos
    ): Promise<IValue[]> => {
        let values: IValue[];

        if (typeof record[attribute.id] !== 'undefined') {
            // Format attribute field into simple value
            values = [
                {
                    value:
                        attribute.type === AttributeTypes.SIMPLE_LINK && typeof record[attribute.id] === 'string'
                            ? {id: record[attribute.id]}
                            : record[attribute.id]
                }
            ];

            // Apply actionsList
            values = await Promise.all(
                values.map(v =>
                    valueDomain.runActionsList({
                        listName: ActionsListEvents.GET_VALUE,
                        value: v,
                        attribute,
                        record,
                        library,
                        ctx
                    })
                )
            );
        } else {
            values = await valueDomain.getValues({
                library,
                recordId: record.id,
                attribute: attribute.id,
                options,
                ctx
            });
        }

        return values;
    };

    const _checkLogicExpr = async (filters: IRecordFilterLight[]) => {
        const stack = [];
        const output = [];

        // convert to Reverse Polish Notation
        for (const f of filters) {
            await _validationFilter(f);

            if (!_isOperatorFilter(f)) {
                output.push(f);
            } else if (f.operator !== Operator.CLOSE_BRACKET) {
                stack.push(f);
            } else {
                let e: IRecordFilterOption = stack.pop();

                while (e && e.operator !== Operator.OPEN_BRACKET) {
                    output.push(e);
                    e = stack.pop();
                }

                if (!e) {
                    throw new ValidationError({id: Errors.INVALID_FILTERS_EXPRESSION});
                }
            }
        }

        const rpn = output.concat(stack.reverse());

        // validation filters logical expression (order)
        let stackSize = 0;

        for (const e of rpn) {
            stackSize += !_isOperatorFilter(e) ? 1 : -1;

            if (stackSize <= 0) {
                throw new ValidationError({id: Errors.INVALID_FILTERS_EXPRESSION});
            }
        }

        if (stackSize !== 1) {
            throw new ValidationError({id: Errors.INVALID_FILTERS_EXPRESSION});
        }
    };

    const _getSimpleLinkedRecords = async (
        library: string,
        value: string,
        ctx: IQueryInfos
    ): Promise<Array<{attribute: string; records: IRecord[]}>> => {
        const filters: IAttributeFilterOptions = {type: [AttributeTypes.SIMPLE_LINK], linked_library: library};
        // get all attributes linked to the library param
        const attributes = await attributeDomain.getAttributes({
            params: {
                filters
            },
            ctx
        });

        const linkedValuesToDel: Array<{records: IRecord[]; attribute: string}> = [];
        const libraryAttributes: {[library: string]: IAttribute[]} = {};

        // Get libraries using link attributes
        for (const attr of attributes.list) {
            const libs = await libraryRepo.getLibrariesUsingAttribute(attr.id, ctx);
            for (const l of libs) {
                libraryAttributes[l] = !!libraryAttributes[l] ? [...libraryAttributes[l], attr] : [attr];
            }
        }

        for (const [lib, attrs] of Object.entries(libraryAttributes)) {
            for (const attr of attrs) {
                let reverseLink: IAttribute;
                if (!!attr.reverse_link) {
                    reverseLink = await attributeDomain.getAttributeProperties({
                        id: attr.reverse_link as string,
                        ctx
                    });
                }

                const records = await recordRepo.find({
                    libraryId: lib,
                    filters: [
                        {attributes: [{...attr, reverse_link: reverseLink}], condition: AttributeCondition.EQUAL, value}
                    ],
                    ctx
                });

                if (records.list.length) {
                    linkedValuesToDel.push({records: records.list, attribute: attr.id});
                }
            }
        }

        return linkedValuesToDel;
    };

    const _isRelativeDateCondition = (condition: AttributeCondition): boolean => {
        return (
            condition === AttributeCondition.TODAY ||
            condition === AttributeCondition.TOMORROW ||
            condition === AttributeCondition.YESTERDAY ||
            condition === AttributeCondition.NEXT_MONTH ||
            condition === AttributeCondition.LAST_MONTH
        );
    };

    const _isNumericCondition = (condition: AttributeCondition): boolean => {
        return (
            condition === AttributeCondition.VALUES_COUNT_EQUAL ||
            condition === AttributeCondition.VALUES_COUNT_GREATER_THAN ||
            condition === AttributeCondition.VALUES_COUNT_LOWER_THAN
        );
    };

    const _isAttributeFilter = (filter: IRecordFilterLight): boolean => {
        return (
            filter.condition in AttributeCondition &&
            typeof filter.field !== 'undefined' &&
            (typeof filter.value !== 'undefined' ||
                filter.condition === AttributeCondition.IS_EMPTY ||
                filter.condition === AttributeCondition.IS_NOT_EMPTY ||
                _isRelativeDateCondition(filter.condition as AttributeCondition))
        );
    };

    const _isClassifiedFilter = (filter: IRecordFilterLight): boolean => {
        return filter.condition in TreeCondition && typeof filter.treeId !== 'undefined';
    };

    const _isOperatorFilter = (filter: IRecordFilterLight): boolean => filter.operator in Operator;

    const _validationFilter = async (filter: IRecordFilterLight): Promise<void> => {
        if (typeof filter.condition === 'undefined' && typeof filter.operator === 'undefined') {
            throw new ValidationError({
                id: Errors.INVALID_FILTER_FORMAT,
                message: 'Filter must have a condition or operator'
            });
        }

        if (filter.condition in AttributeCondition && !_isAttributeFilter(filter)) {
            throw new ValidationError({
                id: Errors.INVALID_FILTER_FORMAT,
                message: 'Attribute filter must have condition, field and value'
            });
        }

        if (filter.condition in TreeCondition && !_isClassifiedFilter(filter)) {
            throw new ValidationError({
                id: Errors.INVALID_FILTER_FORMAT,
                message: 'Classified filter must have condition, value and treeId'
            });
        }
    };

    const _getPreviews = async ({
        conf,
        lib,
        record,
        visitedLibraries = [],
        ctx
    }: {
        conf: IRecordIdentityConf;
        lib: ILibrary;
        record: IRecord;
        visitedLibraries?: string[];
        ctx: IQueryInfos;
    }) => {
        const previewBaseUrl = getPreviewUrl();
        visitedLibraries.push(lib.id);

        let previewRecord: IRecord;

        // On a file, previews are accessible straight on the record
        // Otherwise, we fetch values of the previews attribute
        let previewsAttributeId;
        let fileLibraryId;
        if (lib.behavior === LibraryBehavior.FILES) {
            previewRecord = record;
            previewsAttributeId = utils.getPreviewsAttributeName(lib.id);
            fileLibraryId = lib.id;
        } else {
            const previewAttribute = conf.preview;
            if (!previewAttribute) {
                return null;
            }
            const previewAttributeProps = await attributeDomain.getAttributeProperties({id: previewAttribute, ctx});

            const previewValues = await ret.getRecordFieldValue({
                library: lib.id,
                record,
                attributeId: previewAttribute,
                options: {forceArray: true, version: ctx.version},
                ctx
            });

            if (!(previewValues as IValue[]).length) {
                return null;
            }

            const previewAttributeLibraryProps = (
                await libraryRepo.getLibraries({
                    params: {
                        filters: {id: previewAttributeProps.linked_library}
                    },
                    ctx
                })
            ).list[0];

            if (!previewAttributeLibraryProps) {
                return null;
            }

            previewRecord = previewValues[0].value;

            if (previewAttributeLibraryProps.behavior !== LibraryBehavior.FILES) {
                // To avoid infinite loop, we check if the library has already been visited. If so, we return null
                // For example, if the users' library preview is set to "created_by",
                // we'll retrieve the user's creator, then we'll retrieve the creator's creator, and so on...
                return !visitedLibraries.includes(previewAttributeLibraryProps.id)
                    ? _getPreviews({
                          record: previewRecord,
                          lib: previewAttributeLibraryProps,
                          conf: previewAttributeLibraryProps.recordIdentityConf,
                          visitedLibraries,
                          ctx
                      })
                    : null;
            }

            previewsAttributeId = utils.getPreviewsAttributeName(previewRecord.library);
            fileLibraryId = previewRecord.library;
        }

        // Get value of the previews field. We're calling getRecordFieldValue to apply actions_list if any
        const filePreviewsValue = await ret.getRecordFieldValue({
            library: fileLibraryId,
            record: previewRecord,
            attributeId: previewsAttributeId,
            options: {forceArray: true},
            ctx
        });

        const previews = filePreviewsValue[0]?.raw_value ?? {};

        const previewsWithUrl: IPreview = Object.entries(previews)
            .map(value => {
                const [key, url] = value;

                if (!url || url.toString() === '') {
                    // avoid broken image
                    return {[key]: null};
                }

                // add host url to preview
                const absoluteUrl = join(previewBaseUrl, url.toString());

                return {[key]: absoluteUrl};
            })
            .reduce((obj, o) => ({...obj, ...o}), {});

        previewsWithUrl.file = previewRecord;
        previewsWithUrl.original = `/${config.files.originalsPathPrefix}/${previewRecord.library}/${previewRecord.id}`;

        return previewsWithUrl;
    };

    const _getLibraryIconPreview = async (library: ILibrary, ctx: IQueryInfos) => {
        const cacheKey = `${utils.getCoreEntityCacheKey('library', library.id)}:icon_preview`;

        const _execute = async () => {
            // Retrieve library icon
            const libraryIcon = library.icon;

            if (!libraryIcon?.libraryId || !libraryIcon?.recordId) {
                return null;
            }

            const libraryIconRecord = await ret.find({
                params: {
                    library: libraryIcon.libraryId,
                    filters: [{condition: AttributeCondition.EQUAL, field: 'id', value: libraryIcon.recordId}]
                },
                ctx
            });

            if (!libraryIconRecord?.list?.length) {
                return null;
            }

            const libraryIconLib = await getCoreEntityById<ILibrary>('library', libraryIcon.libraryId, ctx);
            return _getPreviews({
                conf: libraryIconLib.recordIdentityConf,
                lib: libraryIconLib,
                record: libraryIconRecord.list[0],
                ctx
            });
        };

        return cacheService.memoize({key: cacheKey, func: _execute, storeNulls: true, ctx});
    };

    const _getLabel = async (record: IRecord, visitedLibraries: string[] = [], ctx: IQueryInfos): Promise<string> => {
        if (!record) {
            return null;
        }
        visitedLibraries.push(record.library);

        const lib = record?.library ? await getCoreEntityById<ILibrary>('library', record.library, ctx) : null;

        if (!lib) {
            throw new ValidationError({id: Errors.UNKNOWN_LIBRARY});
        }

        const conf = lib.recordIdentityConf || {};
        const valuesOptions: IValuesOptions = {
            version: ctx.version ?? null
        };

        let label: string = null;
        if (conf.label) {
            const labelAttributeProps = await attributeDomain.getAttributeProperties({id: conf.label, ctx});

            const labelValues = await valueDomain.getValues({
                library: lib.id,
                recordId: record.id,
                attribute: conf.label,
                options: valuesOptions,
                ctx
            });

            if (!labelValues.length) {
                return null;
            }

            if (utils.isLinkAttribute(labelAttributeProps)) {
                const linkValue = labelValues.pop().value;

                // To avoid infinite loop, we check if the library has already been visited. If so, we return the id.
                // For example, if the users' library label is set to "created_by",
                // we'll retrieve the user's creator, then we'll retrieve the creator's creator, and so on...
                if (visitedLibraries.includes(labelAttributeProps.linked_library)) {
                    return linkValue.id;
                }

                label = await _getLabel(linkValue, visitedLibraries, ctx);
            } else if (utils.isTreeAttribute(labelAttributeProps)) {
                label = await _getLabel(labelValues.pop().value.record, visitedLibraries, ctx);
            } else {
                label = labelValues.pop().value;
            }
        }

        return label;
    };

    const _getColor = async (record: IRecord, visitedLibraries: string[] = [], ctx: IQueryInfos): Promise<string> => {
        if (!record) {
            return null;
        }
        visitedLibraries.push(record.library);

        const lib = record?.library ? await getCoreEntityById<ILibrary>('library', record.library, ctx) : null;

        if (!lib) {
            throw new ValidationError({id: Errors.UNKNOWN_LIBRARY});
        }

        const conf = lib.recordIdentityConf || {};
        const valuesOptions: IValuesOptions = {
            version: ctx.version ?? null
        };

        let color: string = null;
        if (conf.color) {
            const colorAttributeProps = await attributeDomain.getAttributeProperties({id: conf.color, ctx});

            const colorValues = await valueDomain.getValues({
                library: lib.id,
                recordId: record.id,
                attribute: conf.color,
                options: valuesOptions,
                ctx
            });

            if (!colorValues.length) {
                return null;
            }

            if (utils.isLinkAttribute(colorAttributeProps)) {
                const linkValue = colorValues.pop().value;

                // To avoid infinite loop, we check if the library has already been visited. If so, we return null
                // For example, if the users' library color is set to "created_by",
                // we'll retrieve the user's creator, then we'll retrieve the creator's creator, and so on...
                if (visitedLibraries.includes(colorAttributeProps.linked_library)) {
                    return null;
                }

                color = await _getColor(linkValue, visitedLibraries, ctx);
            } else if (utils.isTreeAttribute(colorAttributeProps)) {
                const treeValue = colorValues.pop().value.record;
                color = await _getColor(treeValue, visitedLibraries, ctx);
            } else {
                color = colorValues.pop().value;
            }
        }

        return color;
    };

    const _getSubLabel = async (
        record: IRecord,
        visitedLibraries: string[] = [],
        ctx: IQueryInfos
    ): Promise<string> => {
        if (!record) {
            return null;
        }
        visitedLibraries.push(record.library);

        const lib = record?.library ? await getCoreEntityById<ILibrary>('library', record.library, ctx) : null;

        if (!lib) {
            throw new ValidationError({id: Errors.UNKNOWN_LIBRARY});
        }

        const conf = lib.recordIdentityConf || {};
        const valuesOptions: IValuesOptions = {
            version: ctx.version ?? null
        };
        let subLabel: string = null;
        if (conf.subLabel) {
            const subLabelAttributeProps = await attributeDomain.getAttributeProperties({id: conf.subLabel, ctx});

            const subLabelValues = await valueDomain.getValues({
                library: lib.id,
                recordId: record.id,
                attribute: conf.subLabel,
                options: valuesOptions,
                ctx
            });

            if (conf.subLabel === 'id') {
                subLabelValues[0].value = record.id;
            }

            if (!subLabelValues.length) {
                return null;
            }

            if (utils.isLinkAttribute(subLabelAttributeProps)) {
                const linkValue = subLabelValues.pop().value;

                // To avoid infinite loop, we check if the library has already been visited. If so, we return null
                // For example, if the users' library color is set to "created_by",
                // we'll retrieve the user's creator, then we'll retrieve the creator's creator, and so on...
                if (visitedLibraries.includes(subLabelAttributeProps.linked_library)) {
                    return null;
                }
                subLabel = await _getSubLabel(linkValue, visitedLibraries, ctx);
            } else if (utils.isTreeAttribute(subLabelAttributeProps)) {
                const treeValue = subLabelValues.pop().value.record;
                subLabel = await _getSubLabel(treeValue, visitedLibraries, ctx);
            } else {
                subLabel = subLabelValues.pop().value;
            }
        }
        return subLabel;
    };

    const _getRecordIdentity = async (record: IRecord, ctx: IQueryInfos): Promise<IRecordIdentity> => {
        const lib = await getCoreEntityById<ILibrary>('library', record.library, ctx);

        if (!lib) {
            throw new ValidationError({id: Errors.UNKNOWN_LIBRARY});
        }

        const conf = lib.recordIdentityConf || {};
        const valuesOptions: IValuesOptions = {
            version: ctx.version ?? null
        };

        let label: string = null;
        if (conf.label) {
            label = await _getLabel(record, [], ctx);
        }

        let subLabel: string = null;
        if (conf.subLabel) {
            subLabel = await _getSubLabel(record, [], ctx);
        }

        let color: string = null;
        if (conf.color) {
            color = await _getColor(record, [], ctx);
        }

        let preview: IPreview = null;
        if (conf.preview || lib.behavior === LibraryBehavior.FILES) {
            preview = (await _getPreviews({conf, lib, record, ctx})) ?? null;
        }

        //look in tree if not defined on current record
        if ((color === null || preview === null) && conf.treeColorPreview) {
            const treeValues = await valueDomain.getValues({
                library: lib.id,
                recordId: record.id,
                attribute: conf.treeColorPreview,
                options: valuesOptions,
                ctx
            });

            if (treeValues.length) {
                // for now we look through first element (discard others if linked to multiple leaves of tree)
                const treeAttrProps = await attributeDomain.getAttributeProperties({id: conf.treeColorPreview, ctx});
                const ancestors = await treeRepo.getElementAncestors({
                    treeId: treeAttrProps.linked_tree,
                    nodeId: treeValues[0].value.id,
                    ctx
                });

                const inheritedData = await ancestors.reduceRight(
                    async (resProm: Promise<{color: string; preview: IPreview}>, ancestor) => {
                        const res = await resProm; // cause async function so res is a promise
                        if (res.color !== null && res.preview !== null) {
                            // already found data, nothing to do
                            return res;
                        }
                        const ancestorIdentity = await _getRecordIdentity(ancestor.record, ctx);

                        return {
                            color: res.color === null ? ancestorIdentity.color : res.color,
                            preview: res.preview === null ? ancestorIdentity.preview : res.preview
                        };
                    },
                    Promise.resolve({color, preview})
                );
                color = color === null ? inheritedData.color : color;
                preview = preview === null ? inheritedData.preview : preview;
            }
        }

        // If no preview found, or preview is not available, use library icon if any
        if (
            preview === null ||
            !Object.keys(preview?.file?.[utils.getPreviewsAttributeName(preview?.file?.library)] ?? {}).length
        ) {
            preview = await _getLibraryIconPreview(lib, ctx);
        }

        const identity = {
            id: record.id,
            library: lib,
            label,
            subLabel,
            color,
            preview
        };

        return identity;
    };

    const ret: IRecordDomain = {
        async createRecord({library, values, ctx}) {
            const recordData = {
                created_at: moment().unix(),
                created_by: String(ctx.userId),
                modified_at: moment().unix(),
                modified_by: String(ctx.userId),
                active: true
            };

            const canCreate = await libraryPermissionDomain.getLibraryPermission({
                action: LibraryPermissionsActions.CREATE_RECORD,
                userId: ctx.userId,
                libraryId: library,
                ctx
            });

            if (!canCreate) {
                throw new PermissionError(LibraryPermissionsActions.CREATE_RECORD);
            }

            if (values?.length) {
                // First, check if values are ok. If not, we won't create the record at all
                const res = await Promise.allSettled(
                    values.map(async v => {
                        const attributeProps = await attributeDomain.getAttributeProperties({
                            id: v.attribute,
                            ctx
                        });
                        return valueDomain.runActionsList({
                            listName: ActionsListEvents.SAVE_VALUE,
                            value: v,
                            attribute: attributeProps,
                            library,
                            ctx
                        });
                    })
                );

                const errors = res
                    .filter(r => r.status === 'rejected')
                    .map(err => {
                        const rejection = err as PromiseRejectedResult;
                        const errorAttribute = rejection.reason.context.attributeId;

                        return {
                            type: rejection.reason.type,
                            attributeId: errorAttribute,
                            id_value: rejection.reason.context.value.id_value,
                            input: rejection.reason.context.value.value,
                            message: utils.translateError(rejection.reason.fields[errorAttribute], ctx.lang)
                        };
                    });

                if (errors.length) {
                    return {record: null, valuesErrors: errors};
                }
            }

            const newRecord = await recordRepo.createRecord({libraryId: library, recordData, ctx});

            if (values?.length) {
                // Make sure we don't any id_value hanging on as we're on creation here
                const cleanValues = values.map(v => ({...v, id_value: null}));

                await valueDomain.saveValueBatch({
                    library,
                    recordId: newRecord.id,
                    values: cleanValues,
                    ctx
                });
            }

            eventsManager.sendDatabaseEvent(
                {
                    action: EventAction.RECORD_SAVE,
                    topic: {
                        record: {
                            id: newRecord.id,
                            libraryId: newRecord.library
                        }
                    },
                    after: newRecord
                },
                ctx
            );

            return {record: newRecord, valuesErrors: null};
        },
        async updateRecord({library, recordData, ctx}): Promise<IRecord> {
            const {old: oldRecord, new: savedRecord} = await recordRepo.updateRecord({libraryId: library, recordData});

            eventsManager.sendDatabaseEvent(
                {
                    action: EventAction.RECORD_SAVE,
                    topic: {
                        record: {
                            id: savedRecord.id,
                            libraryId: savedRecord.library
                        }
                    },
                    before: oldRecord,
                    after: recordData
                },
                ctx
            );

            await sendRecordUpdateEvent({recordData, library}, null, ctx);

            return savedRecord;
        },
        async deleteRecord({library, id, ctx}): Promise<IRecord> {
            await validateHelper.validateLibrary(library, ctx);

            // Check permission
            const canDelete = await recordPermissionDomain.getRecordPermission({
                action: RecordPermissionsActions.DELETE_RECORD,
                userId: ctx.userId,
                library,
                recordId: id,
                ctx
            });

            if (!canDelete) {
                throw new PermissionError(RecordPermissionsActions.DELETE_RECORD);
            }

            const simpleLinkedRecords = await _getSimpleLinkedRecords(library, id, ctx);

            // delete simple linked values
            for (const e of simpleLinkedRecords) {
                for (const r of e.records) {
                    await valueDomain.deleteValue({
                        library: r.library,
                        recordId: r.id,
                        attribute: e.attribute,
                        ctx
                    });
                }
            }

            // Delete linked values (advanced, advanced link and tree)
            await valueRepo.deleteAllValuesByRecord({libraryId: library, recordId: id, ctx});

            // Remove element from all trees
            const libraryTrees = await treeRepo.getTrees({
                params: {
                    filters: {
                        library
                    }
                },
                ctx
            });

            // For each tree, get all record nodes
            await Promise.all(
                libraryTrees.list.map(async tree => {
                    const nodes = await treeRepo.getNodesByRecord({
                        treeId: tree.id,
                        record: {
                            id,
                            library
                        },
                        ctx
                    });

                    for (const node of nodes) {
                        await treeRepo.deleteElement({
                            treeId: tree.id,
                            nodeId: node,
                            deleteChildren: true,
                            ctx
                        });
                    }
                })
            );

            // Everything is clean, we can actually delete the record
            const deletedRecord = await recordRepo.deleteRecord({libraryId: library, recordId: id, ctx});

            eventsManager.sendDatabaseEvent(
                {
                    action: EventAction.RECORD_DELETE,
                    topic: {
                        record: {
                            libraryId: deletedRecord.library,
                            id: deletedRecord.id
                        }
                    },
                    before: deletedRecord
                },
                ctx
            );

            return deletedRecord;
        },
        async find({params, ctx}: {params: IFindRecordParams; ctx: IQueryInfos}): Promise<IListWithCursor<IRecord>> {
            const {library, sort, pagination, withCount, retrieveInactive = false} = params;
            const {filters = [] as IRecordFilterLight[], fulltextSearch} = params;
            const fullFilters: IRecordFilterOption[] = [];
            let fullSort: IRecordSort;

            const isLibraryAccessible = await libraryPermissionDomain.getLibraryPermission({
                libraryId: params.library,
                userId: ctx.userId,
                action: LibraryPermissionsActions.ACCESS_LIBRARY,
                ctx
            });

            if (!isLibraryAccessible) {
                throw new PermissionError(LibraryPermissionsActions.ACCESS_LIBRARY);
            }

            if (filters.length) {
                await _checkLogicExpr(filters);
            }

            // Hydrate filters with attribute properties and cast filters values if needed
            for (const f of filters) {
                let filter: IRecordFilterOption = {};

                if (_isAttributeFilter(f)) {
                    const attributes = await getAttributesFromField({
                        field: f.field,
                        condition: f.condition,
                        deps: {
                            'core.domain.attribute': attributeDomain,
                            'core.infra.library': libraryRepo,
                            'core.infra.tree': treeRepo
                        },
                        ctx
                    });

                    // Set reverse links if necessary.
                    const attrsRepo = (await Promise.all(
                        attributes.map(async a =>
                            !!a.reverse_link
                                ? {
                                      ...a,
                                      reverse_link: await attributeDomain.getAttributeProperties({
                                          id: a.reverse_link as string,
                                          ctx
                                      })
                                  }
                                : a
                        )
                    )) as IAttributeWithRevLink[];

                    let value: any = f.value ?? null;
                    const lastAttr: IAttribute = attrsRepo[attrsRepo.length - 1];

                    if (value !== null) {
                        if (
                            lastAttr.format === AttributeFormats.NUMERIC ||
                            (lastAttr.format === AttributeFormats.DATE &&
                                f.condition !== AttributeCondition.BETWEEN &&
                                !_isRelativeDateCondition(filter.condition as AttributeCondition)) ||
                            _isNumericCondition(f.condition as AttributeCondition)
                        ) {
                            value = Number(f.value);
                        } else if (lastAttr.format === AttributeFormats.BOOLEAN) {
                            value = f.value === 'true';
                        } else if (
                            lastAttr.format === AttributeFormats.DATE &&
                            f.condition === AttributeCondition.BETWEEN
                        ) {
                            value = JSON.parse(f.value);

                            if (typeof value.from === 'undefined' || typeof value.to === 'undefined') {
                                throw new ValidationError({condition: Errors.INVALID_FILTER_CONDITION_VALUE});
                            }
                        }
                    }

                    const valueType = value === null ? 'null' : typeof value;
                    if (
                        (f.condition && !allowedTypeOperator[valueType].includes(f.condition)) ||
                        (f.condition === AttributeCondition.BETWEEN &&
                            (typeof value.from === 'undefined' || typeof value.to === 'undefined'))
                    ) {
                        throw new ValidationError({condition: Errors.INVALID_FILTER_CONDITION_VALUE});
                    }

                    filter = {attributes: attrsRepo, value, condition: f.condition};
                } else {
                    filter = f;
                }

                fullFilters.push(filter);
            }

            // Check sort fields
            if (sort) {
                const sortAttributes = await getAttributesFromField({
                    field: sort.field,
                    condition: null,
                    deps: {
                        'core.domain.attribute': attributeDomain,
                        'core.infra.library': libraryRepo,
                        'core.infra.tree': treeRepo
                    },
                    ctx
                });

                const sortAttributesRepo = (await Promise.all(
                    sortAttributes.map(async a =>
                        !!a.reverse_link
                            ? {
                                  ...a,
                                  reverse_link: await attributeDomain.getAttributeProperties({
                                      id: a.reverse_link as string,
                                      ctx
                                  })
                              }
                            : a
                    )
                )) as IAttributeWithRevLink[];

                fullSort = {
                    attributes: sortAttributesRepo,
                    order: sort.order
                };
            }

            const records = await recordRepo.find({
                libraryId: library,
                filters: fullFilters,
                sort: fullSort,
                pagination,
                withCount,
                retrieveInactive,
                fulltextSearch,
                ctx
            });

            return records;
        },
        getRecordIdentity: _getRecordIdentity,
        async getRecordFieldValue({library, record, attributeId, options, ctx}) {
            const attrProps = await attributeDomain.getAttributeProperties({id: attributeId, ctx});
            let values = await _extractRecordValue(record, attrProps, library, options, ctx);

            const hasNoValue = values.length === 0;
            if (hasNoValue) {
                values = [
                    {
                        value: null
                    }
                ];
            }

            const forceArray = options?.forceArray ?? false;

            //TODO: fix "[object]" on input after edit
            let formattedValues = await Promise.all(
                values.map(async v => {
                    const formattedValue = await valueDomain.formatValue({
                        attribute: attrProps,
                        value: v,
                        record,
                        library,
                        ctx
                    });

                    if (attrProps.metadata_fields && formattedValue.metadata) {
                        for (const metadataField of attrProps.metadata_fields) {
                            if (!formattedValue.metadata[metadataField]) {
                                continue;
                            }

                            const metadataAttributeProps = await attributeDomain.getAttributeProperties({
                                id: metadataField,
                                ctx
                            });

                            formattedValue.metadata[metadataField] = await valueDomain.runActionsList({
                                listName: ActionsListEvents.GET_VALUE,
                                attribute: metadataAttributeProps,
                                library,
                                value: formattedValue.metadata[metadataField] as IStandardValue,
                                ctx
                            });
                        }
                    }

                    return formattedValue;
                })
            );

            // sort of flatMap cause _formatRecordValue can return multiple values for 1 input val (think heritage)
            formattedValues = formattedValues.reduce((acc, v) => {
                if (Array.isArray(v.value)) {
                    acc = [
                        ...acc,
                        ...v.value.map(vpart => ({
                            value: vpart,
                            attribute: v.attribute
                        }))
                    ];
                } else {
                    acc.push(v);
                }
                return acc;
            }, []);

            if (hasNoValue) {
                // remove null values or values that do not represent a record
                formattedValues = formattedValues.filter(
                    v =>
                        v.value !== null &&
                        typeof v.value === 'object' &&
                        v.value.hasOwnProperty('id') &&
                        v.value.hasOwnProperty('library')
                );
            }

            return attrProps.multiple_values || forceArray ? formattedValues : formattedValues[0] || null;
        },
        async deactivateRecord(record: IRecord, ctx: IQueryInfos): Promise<IRecord> {
            const savedVal = await valueDomain.saveValue({
                library: record.library,
                recordId: record.id,
                attribute: 'active',
                value: {value: false},
                ctx
            });

            return {...record, active: savedVal.value};
        },
        async activateRecord(record: IRecord, ctx: IQueryInfos): Promise<IRecord> {
            const savedVal = await valueDomain.saveValue({
                library: record.library,
                recordId: record.id,
                attribute: 'active',
                value: {value: true},
                ctx
            });

            return {...record, active: savedVal.value};
        },
        async deactivateRecordsBatch({libraryId, recordsIds, filters, ctx}) {
            let recordsToDeactivate: string[] = recordsIds ?? [];

            if (filters) {
                const records = await this.find({
                    params: {
                        library: libraryId,
                        filters,
                        options: {forceArray: true, forceGetAllValues: true},
                        retrieveInactive: false,
                        withCount: false
                    },
                    ctx
                });
                recordsToDeactivate = records.list.map(record => record.id);
            }

            if (!recordsToDeactivate.length) {
                return [];
            }

            const inactiveRecords = await Promise.all(
                recordsToDeactivate.map(recordId => this.deactivateRecord({id: recordId, library: libraryId}, ctx))
            );

            return inactiveRecords;
        },
        async purgeInactiveRecords({libraryId, ctx}): Promise<IRecord[]> {
            const inactiveRecords = await this.find({
                params: {
                    library: libraryId,
                    filters: [{field: 'active', condition: AttributeCondition.EQUAL, value: 'false'}]
                },
                ctx
            });

            const purgedRecords: IRecord[] = [];
            for (const record of inactiveRecords.list) {
                purgedRecords.push(
                    await this.deleteRecord({
                        library: libraryId,
                        id: record.id,
                        ctx
                    })
                );
            }

            return purgedRecords;
        }
    };

    return ret;
}
