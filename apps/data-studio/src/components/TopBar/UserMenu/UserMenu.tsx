// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
import {RecordCard} from '@leav/ui';
import styled from 'styled-components';
import {PreviewSize} from '_types/types';
import {useUser} from '../../../hooks/UserHook/UserHook';

const Wrapper = styled.div`
    & {
        display: flex;
        flex-flow: row nowrap;
        align-items: center;
        justify-content: center;
        width: 12rem;
    }
`;

function UserMenu(): JSX.Element {
    const [user] = useUser();

    if (!user) {
        return null;
    }

    return (
        <Wrapper>
            <RecordCard record={user.userWhoAmI} size={PreviewSize.tiny} withLibrary={false} style={{color: '#000'}} />
        </Wrapper>
    );
}

export default UserMenu;
