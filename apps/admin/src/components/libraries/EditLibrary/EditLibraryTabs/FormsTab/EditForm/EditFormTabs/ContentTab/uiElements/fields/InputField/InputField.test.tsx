// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
import {render} from 'enzyme';
import React from 'react';
import InputField from './InputField';

describe('InputField', () => {
    test('Snapshot test', async () => {
        const comp = render(<InputField settings={{}} />);

        expect(comp).toMatchSnapshot();
    });
});
