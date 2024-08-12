import React, {useEffect} from 'react';
import {View} from 'react-native';
import {useOnyx, withOnyx} from 'react-native-onyx';
import type {OnyxEntry} from 'react-native-onyx';
import ScreenWrapper from '@components/ScreenWrapper';
import useActiveWorkspaceFromNavigationState from '@hooks/useActiveWorkspaceFromNavigationState';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import {updateLastScreen} from '@libs/actions/App';
import {updateLastAccessedWorkspace} from '@libs/actions/Policy/Policy';
import * as Browser from '@libs/Browser';
import interceptAnonymousUser from '@libs/interceptAnonymousUser';
import TopBar from '@libs/Navigation/AppNavigator/createCustomBottomTabNavigator/TopBar';
import Navigation from '@libs/Navigation/Navigation';
import Performance from '@libs/Performance';
import * as ReportUtils from '@libs/ReportUtils';
import SidebarLinksData from '@pages/home/sidebar/SidebarLinksData';
import * as IOU from '@userActions/IOU';
import Timing from '@userActions/Timing';
import type {IOUType} from '@src/CONST';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';

/**
 * Function called when a pinned chat is selected.
 */
const startTimer = () => {
    Timing.start(CONST.TIMING.SWITCH_REPORT);
    Performance.markStart(CONST.TIMING.SWITCH_REPORT);
};

type BaseSidebarScreenOnyxProps = {
    /** last visited screen */
    lastScreen: OnyxEntry<IOUType | ''>;
};

type BaseSidebarScreenProps = BaseSidebarScreenOnyxProps;

function BaseSidebarScreen({lastScreen}: BaseSidebarScreenProps) {
    const styles = useThemeStyles();
    const activeWorkspaceID = useActiveWorkspaceFromNavigationState();
    const {translate} = useLocalize();
    const [activeWorkspace] = useOnyx(`${ONYXKEYS.COLLECTION.POLICY}${activeWorkspaceID ?? -1}`);

    useEffect(() => {
        Performance.markStart(CONST.TIMING.SIDEBAR_LOADED);
        Timing.start(CONST.TIMING.SIDEBAR_LOADED, true);
    }, []);

    useEffect(() => {
        if (!!activeWorkspace || activeWorkspaceID === undefined) {
            return;
        }

        Navigation.navigateWithSwitchPolicyID({policyID: undefined});
        updateLastAccessedWorkspace(undefined);
    }, [activeWorkspace, activeWorkspaceID]);

    /**
     * Navigate to scan receipt screen after it enabling camera permission from setting
     * This will only works for ios application because we are saving last screen only for ios
     */
    useEffect(() => {
        if (!lastScreen) {
            return;
        }
        interceptAnonymousUser(() => {
            updateLastScreen('');
            IOU.startMoneyRequest(
                lastScreen,
                // When starting to create an expense from the global FAB, there is not an existing report yet. A random optimistic reportID is generated and used
                // for all of the routes in the creation flow.
                ReportUtils.generateReportID(),
            );
        });
    }, []);

    return (
        <ScreenWrapper
            includeSafeAreaPaddingBottom={false}
            shouldEnableKeyboardAvoidingView={false}
            style={[styles.sidebar, Browser.isMobile() ? styles.userSelectNone : {}, styles.pb0]}
            testID={BaseSidebarScreen.displayName}
            includePaddingTop={false}
        >
            {({insets}) => (
                <>
                    <TopBar
                        breadcrumbLabel={translate('common.inbox')}
                        activeWorkspaceID={activeWorkspaceID}
                    />
                    <View style={[styles.flex1]}>
                        <SidebarLinksData
                            onLinkClick={startTimer}
                            insets={insets}
                        />
                    </View>
                </>
            )}
        </ScreenWrapper>
    );
}

BaseSidebarScreen.displayName = 'BaseSidebarScreen';

export default withOnyx<BaseSidebarScreenProps, BaseSidebarScreenOnyxProps>({
    lastScreen: {
        key: ONYXKEYS.LAST_SCREEN,
    },
})(BaseSidebarScreen);
