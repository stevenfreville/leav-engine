// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
import gql from 'graphql-tag';
import {GET_USER_userWhoAmI} from '_gqlTypes/GET_USER';

export interface IGetUser {
    userId: string;
    userPermissions: any;
    userWhoAmI: GET_USER_userWhoAmI;
}

export const getUser = gql`
    query GET_USER {
        userId @client
        userPermissions @client
        userWhoAmI @client {
            id
            label
            subLabel
            color
            preview
            library {
                id
                behavior
                label
                gqlNames {
                    query
                    type
                }
            }
        }
    }
`;
