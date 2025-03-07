// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
import Joi from 'joi';
import ValidationError from '../../errors/ValidationError';
import {AttributeTypes} from '../../_types/attribute';
import {Errors} from '../../_types/errors';
import {mockAttrSimple} from '../../__tests__/mocks/attribute';
import {mockCtx} from '../../__tests__/mocks/shared';
import actionListDomain from './actionsListDomain';

describe('handleJoiError', () => {
    test('handleJoiError', async () => {
        const domain = actionListDomain();
        const mockError = {
            details: [
                {
                    message: 'boom'
                }
            ]
        };

        const res = domain.handleJoiError({id: 'test', type: AttributeTypes.SIMPLE}, mockError as Joi.ValidationError);
        expect(res).toMatchObject({
            test: {
                msg: 'FORMAT_ERROR',
                vars: {
                    details: 'boom'
                }
            }
        });
    });
});

describe('runActionsList', () => {
    const val = {
        id_value: '999',
        value: 'test_val'
    };

    const ctx = {
        library: 'test_lib',
        attribute: {id: 'test_attr', type: AttributeTypes.SIMPLE},
        lang: 'en',
        defaultLang: 'fr'
    };

    test('Should run a list of actions', async () => {
        const domain = actionListDomain();
        const availActions = [
            {
                name: 'validate',
                action: jest.fn().mockReturnValue('test_val')
            },
            {
                name: 'convert',
                action: jest.fn().mockReturnValue('test_val')
            }
        ];

        domain.getAvailableActions = jest.fn().mockReturnValue(availActions);

        const res = await domain.runActionsList(
            [
                {id: 'convert', name: 'Convert', params: [{name: 'firstArg', value: 'test'}], is_system: false},
                {id: 'validate', name: 'Validate', is_system: true}
            ],
            val,
            ctx
        );

        expect(res).toEqual(val);
    });

    test('Should throw if an action throws', async () => {
        const domain = actionListDomain();
        const availActions = [
            {
                name: 'validate',
                action: jest.fn().mockImplementation(() => {
                    throw new ValidationError({test_attr: Errors.ERROR});
                })
            },
            {
                name: 'convert',
                action: jest.fn().mockReturnValue('test_val')
            }
        ];

        domain.getAvailableActions = jest.fn().mockReturnValue(availActions);

        await expect(
            domain.runActionsList(
                [
                    {id: 'convert', name: 'Convert', params: [{name: 'firstArg', value: 'test'}], is_system: false},
                    {id: 'validate', name: 'validate', is_system: true}
                ],
                val,
                ctx
            )
        ).rejects.toThrow(ValidationError);
    });

    test('Should throw an exception with custom message', async () => {
        const domain = actionListDomain();
        const availActions = [
            {
                name: 'validate',
                action: jest.fn().mockImplementation(() => {
                    throw new ValidationError({test_attr: Errors.ERROR}, 'validation Error', true);
                })
            },
            {
                name: 'convert',
                action: jest.fn().mockReturnValue('test_val')
            }
        ];

        domain.getAvailableActions = jest.fn().mockReturnValue(availActions);

        const res = domain.runActionsList(
            [
                {id: 'convert', name: 'Convert', params: [{name: 'firstArg', value: 'test'}], is_system: false},
                {id: 'validate', name: 'validate', is_system: true, error_message: {en: 'test error message'}}
            ],
            val,
            ctx
        );

        await expect(res).rejects.toThrow(ValidationError);
        await expect(res).rejects.toHaveProperty('fields.test_attr', 'test error message');
    });

    test('Should throw an exception with custom message from system while a error_message "en" has been set', async () => {
        const textctx = {
            ...mockCtx,
            attribute: {...mockAttrSimple, id: 'test_attr'},
            lang: 'fr',
            defaultLang: 'fr'
        };
        const domain = actionListDomain();
        const availActions = [
            {
                name: 'validate',
                action: jest.fn().mockImplementation(() => {
                    throw new ValidationError({test_attr: Errors.ERROR}, 'validation Error', true);
                })
            },
            {
                name: 'convert',
                action: jest.fn().mockReturnValue('test_val')
            }
        ];

        domain.getAvailableActions = jest.fn().mockReturnValue(availActions);

        const res = domain.runActionsList(
            [
                {id: 'convert', name: 'Convert', params: [{name: 'firstArg', value: 'test'}], is_system: false},
                {id: 'validate', name: 'validate', is_system: true, error_message: {en: 'test error message'}}
            ],
            val,
            textctx
        );
        await expect(res).rejects.toThrow(ValidationError);
        await expect(res).rejects.toHaveProperty('fields.test_attr', Errors.ERROR);
    });
});
