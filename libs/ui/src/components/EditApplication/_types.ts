// Copyright LEAV Solutions 2017
// This file is released under LGPL V3
// License text available at https://www.gnu.org/licenses/lgpl-3.0.txt
import {TabsProps} from 'antd';

export interface IEditApplicationProps {
    applicationId?: string;
    onSetSubmitFunction?: (submitFunction: () => Promise<void>) => void;
    activeTab?: 'info' | string;
    tabContentStyle?: React.CSSProperties;
    additionalTabs?: TabsProps['items'];
}
