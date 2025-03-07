// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
import {useMutation, useQuery} from '@apollo/client';
import {ErrorDisplay, Loading, useLang} from '@leav/ui';
import {Table} from 'antd';
import {ColumnsType} from 'antd/lib/table';
import TreeIcon from 'components/shared/TreeIcon';
import {saveUserData} from 'graphQL/mutations/userData/saveUserData';
import {getUserDataQuery} from 'graphQL/queries/userData/getUserData';
import {useApplicationTrees} from 'hooks/useApplicationTrees';
import {useTranslation} from 'react-i18next';
import {Link} from 'react-router-dom';
import styled from 'styled-components';
import {getTreeLink, localizedTranslation} from 'utils';
import {GET_USER_DATA, GET_USER_DATAVariables} from '_gqlTypes/GET_USER_DATA';
import {SAVE_USER_DATA, SAVE_USER_DATAVariables} from '../../../_gqlTypes/SAVE_USER_DATA';
import FavoriteStar from '../FavoriteStar';

export const FAVORITE_TREES_KEY = 'favorites_trees_ids';

const TreeLink = styled(Link)`
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 0.5rem;
    width: 100%;
    color: inherit;
`;

const ListHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 1rem;
    margin: 1rem;
    font-weight: bold;
    font-size: 1.2em;
`;

interface IListItem {
    key: string;
    id: string;
    label: string;
    isFavorite: boolean;
}

function TreeList(): JSX.Element {
    const {t} = useTranslation();
    const {lang} = useLang();

    const {trees, loading: treesLoading, error: treesError} = useApplicationTrees();
    const userDataQuery = useQuery<GET_USER_DATA, GET_USER_DATAVariables>(getUserDataQuery, {
        variables: {keys: [FAVORITE_TREES_KEY]}
    });

    const [updateFavoritesMutation] = useMutation<SAVE_USER_DATA, SAVE_USER_DATAVariables>(saveUserData, {
        ignoreResults: true
    });

    if (treesLoading || userDataQuery.loading) {
        return <Loading />;
    }

    if (treesError || userDataQuery.error) {
        return <ErrorDisplay message={treesError || userDataQuery.error.message} />;
    }

    const favoriteIds = userDataQuery.data?.userData?.data[FAVORITE_TREES_KEY] ?? [];

    const list: IListItem[] = trees
        .map(tree => ({
            key: tree.id,
            id: tree.id,
            label: localizedTranslation(tree.label, lang),
            isFavorite: !!favoriteIds.includes(tree.id)
        }))
        .sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite));

    const columns: ColumnsType<IListItem> = [
        {
            title: t('home.label'),
            dataIndex: 'label',
            key: 'label',
            render: (label, item) => {
                return (
                    <TreeLink to={getTreeLink(item.id)}>
                        <TreeIcon style={{fontSize: '1.2rem'}} /> {label}
                    </TreeLink>
                );
            }
        },
        {
            title: <></>,
            dataIndex: 'isFavorite',
            key: 'isFavorite',
            width: 20,
            render: (isFavorite, item) => {
                const _handleFavoriteToggle = async (wasFavorite: boolean) => {
                    const {id} = item;

                    await updateFavoritesMutation({
                        variables: {
                            key: FAVORITE_TREES_KEY,
                            value: wasFavorite ? favoriteIds.filter(e => e !== id) : favoriteIds.concat([id]),
                            global: false
                        }
                    });
                };

                return (
                    <FavoriteStar
                        key="trees_favorites"
                        isFavorite={isFavorite}
                        onToggle={_handleFavoriteToggle}
                        hoverTrigger=".ant-table-row"
                    />
                );
            }
        }
    ];

    if (!trees.length) {
        return null;
    }

    return (
        <div className="wrapper-page" data-testid="trees-list">
            <ListHeader>
                <TreeIcon style={{fontSize: '1.5rem'}} />
                {t('home.trees')}
            </ListHeader>
            <Table bordered columns={columns} dataSource={list} loading={treesLoading} pagination={false} />
        </div>
    );
}

export default TreeList;
