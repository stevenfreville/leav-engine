// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
import {AttributeFormats, AttributeTypes, IAttribute} from '../../_types/attribute';
import toBooleanAction from './toBooleanAction';

describe('toBooleanAction', () => {
    const action = toBooleanAction().action;
    const attrText: IAttribute = {id: 'test_attr', format: AttributeFormats.NUMERIC, type: AttributeTypes.SIMPLE};
    const ctx = {attribute: attrText};
    test('toBoolean', async () => {
        expect(action(true, {}, ctx)).toBe(true);
        expect(action(false, {}, ctx)).toBe(false);
        expect(action(1, {}, ctx)).toBe(true);
        expect(action(0, {}, ctx)).toBe(false);
        expect(action('true', {}, ctx)).toBe(true);
        expect(action('false', {}, ctx)).toBe(false);
        expect(action('totot', {}, ctx)).toBe(true);
        expect(action(null, {}, ctx)).toBe(false);
    });
});
