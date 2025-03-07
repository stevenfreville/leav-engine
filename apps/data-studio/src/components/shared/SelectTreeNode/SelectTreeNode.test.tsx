// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
import userEvent from '@testing-library/user-event';
import {treeNodeChildrenQuery} from 'graphQL/queries/trees/getTreeNodeChildren';
import {LibraryBehavior} from '_gqlTypes/globalTypes';
import {act, render, screen, waitFor} from '_tests/testUtils';
import {mockTreeNodePermissions} from '__mocks__/common/treeElements';
import SelectTreeNode from './SelectTreeNode';

describe('SelectTreeNode', () => {
    test('Render tree and navigate', async () => {
        const mocks = [
            {
                request: {
                    query: treeNodeChildrenQuery,
                    variables: {
                        treeId: 'treeId',
                        node: null,
                        pagination: {limit: 20, offset: 0}
                    }
                },
                result: {
                    data: {
                        treeNodeChildren: {
                            totalCount: 1,
                            list: [
                                {
                                    id: 'id1',
                                    record: {
                                        id: 'id1',
                                        active: true,
                                        whoAmI: {
                                            id: 'id1',
                                            label: 'label1',
                                            color: null,
                                            library: {
                                                id: 'categories',
                                                label: {fr: 'Catégories'},
                                                behavior: LibraryBehavior.standard,
                                                gqlNames: {
                                                    type: 'Categorie',
                                                    query: 'categories',
                                                    __typename: 'LibraryGraphqlNames'
                                                },
                                                __typename: 'Library'
                                            },
                                            preview: null,
                                            __typename: 'RecordIdentity'
                                        },
                                        __typename: 'Categorie'
                                    },
                                    childrenCount: 1,
                                    permissions: mockTreeNodePermissions
                                }
                            ]
                        }
                    }
                }
            },
            {
                request: {
                    query: treeNodeChildrenQuery,
                    variables: {
                        treeId: 'treeId',
                        node: 'id1',
                        pagination: {limit: 20, offset: 0}
                    }
                },
                result: {
                    data: {
                        treeNodeChildren: {
                            totalCount: 1,
                            list: [
                                {
                                    id: 'id2',
                                    record: {
                                        id: 'id2',
                                        active: true,
                                        whoAmI: {
                                            __typename: 'RecordIdentity',
                                            id: 'id2',
                                            label: 'label2',
                                            color: null,
                                            library: {
                                                id: 'categories',
                                                label: {fr: 'Catégories'},
                                                behavior: LibraryBehavior.standard,
                                                gqlNames: {
                                                    type: 'Categorie',
                                                    query: 'categories',
                                                    __typename: 'LibraryGraphqlNames'
                                                },
                                                __typename: 'Library'
                                            },
                                            preview: null
                                        },
                                        __typename: 'Categorie'
                                    },
                                    childrenCount: 0,
                                    permissions: mockTreeNodePermissions,
                                    __typename: 'TreeNode'
                                }
                            ]
                        }
                    }
                }
            }
        ];

        await act(async () => {
            render(<SelectTreeNode tree={{id: 'treeId', label: {fr: 'Tree Label'}}} onSelect={jest.fn()} />, {
                apolloMocks: mocks,
                cacheSettings: {
                    possibleTypes: {
                        Record: ['Categorie']
                    }
                }
            });
        });

        await waitFor(() => screen.getByText('Tree Label'));
        expect(screen.getByText('Tree Label')).toBeInTheDocument();

        // Expand node => fetch children
        await act(async () => {
            userEvent.click(screen.getAllByRole('img', {name: 'toggle-children'}).pop());
        });
        expect(screen.getByText('label2')).toBeInTheDocument();
    });
});
