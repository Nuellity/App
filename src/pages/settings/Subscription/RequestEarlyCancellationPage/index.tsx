import React, {useMemo} from 'react';
import {View} from 'react-native';
import Button from '@components/Button';
import FeedbackSurvey from '@components/FeedbackSurvey';
import FixedFooter from '@components/FixedFooter';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import ScreenWrapper from '@components/ScreenWrapper';
import ScrollView from '@components/ScrollView';
import Text from '@components/Text';
import TextLink from '@components/TextLink';
import useCancellationType from '@hooks/useCancellationType';
import useLocalize from '@hooks/useLocalize';
import useThemeStyles from '@hooks/useThemeStyles';
import Navigation from '@libs/Navigation/Navigation';
import * as Report from '@userActions/Report';
import * as Subscription from '@userActions/Subscription';
import type {FeedbackSurveyOptionID} from '@src/CONST';
import CONST from '@src/CONST';
import ROUTES from '@src/ROUTES';

function RequestEarlyCancellationPage() {
    const {translate} = useLocalize();
    const styles = useThemeStyles();

    const cancellationType = useCancellationType();

    const handleSubmit = (cancellationReason: FeedbackSurveyOptionID, cancellationNote = '') => {
        Subscription.cancelBillingSubscription(cancellationReason, cancellationNote);
    };

    const acknowledgmentText = useMemo(
        () => (
            <Text>
                {translate('subscription.requestEarlyCancellation.acknowledgement.part1')}
                <TextLink href={CONST.TERMS_URL}>{translate('subscription.requestEarlyCancellation.acknowledgement.link')}</TextLink>
                {translate('subscription.requestEarlyCancellation.acknowledgement.part2')}
            </Text>
        ),
        [translate],
    );

    const manualCancellationContent = useMemo(
        () => (
            <View style={[styles.flexGrow1, styles.justifyContentBetween, styles.mh5]}>
                <View>
                    <Text style={styles.textHeadline}>{translate('subscription.requestEarlyCancellation.requestSubmitted.title')}</Text>
                    <Text style={[styles.mt1, styles.textNormalThemeText]}>
                        {translate('subscription.requestEarlyCancellation.requestSubmitted.subtitle.part1')}
                        <TextLink onPress={() => Report.navigateToConciergeChat()}>{translate('subscription.requestEarlyCancellation.requestSubmitted.subtitle.link')}</TextLink>
                        {translate('subscription.requestEarlyCancellation.requestSubmitted.subtitle.part2')}
                    </Text>
                </View>
                <FixedFooter style={styles.ph0}>
                    <Button
                        success
                        text={translate('common.done')}
                        onPress={() => Navigation.goBack()}
                        large
                    />
                </FixedFooter>
            </View>
        ),
        [styles, translate],
    );

    const automaticCancellationContent = useMemo(
        () => (
            <View style={[styles.flexGrow1, styles.justifyContentBetween, styles.mh5]}>
                <View>
                    <Text style={styles.textHeadline}>{translate('subscription.requestEarlyCancellation.subscriptionCanceled.title')}</Text>
                    <Text style={[styles.mt1, styles.textNormalThemeText]}>{translate('subscription.requestEarlyCancellation.subscriptionCanceled.subtitle')}</Text>
                    <Text style={[styles.mv4, styles.textNormalThemeText]}>{translate('subscription.requestEarlyCancellation.subscriptionCanceled.info')}</Text>
                    <Text>
                        {translate('subscription.requestEarlyCancellation.subscriptionCanceled.preventFutureActivity.part1')}
                        <TextLink onPress={() => Navigation.navigate(ROUTES.SETTINGS_WORKSPACES)}>
                            {translate('subscription.requestEarlyCancellation.subscriptionCanceled.preventFutureActivity.link')}
                        </TextLink>
                        {translate('subscription.requestEarlyCancellation.subscriptionCanceled.preventFutureActivity.part2')}
                    </Text>
                </View>
                <FixedFooter style={styles.ph0}>
                    <Button
                        success
                        text={translate('common.done')}
                        onPress={() => Navigation.goBack()}
                        large
                    />
                </FixedFooter>
            </View>
        ),
        [styles, translate],
    );

    const surveyContent = useMemo(
        () => (
            <FeedbackSurvey
                title={translate('subscription.subscriptionSettings.helpUsImprove')}
                description={translate('subscription.requestEarlyCancellation.subtitle')}
                onSubmit={handleSubmit}
                optionRowStyles={styles.flex1}
                footerText={<Text style={[styles.mb2, styles.mt4]}>{acknowledgmentText}</Text>}
            />
        ),
        [acknowledgmentText, styles, translate],
    );

    let screenContent: React.ReactNode;

    switch (cancellationType) {
        case CONST.CANCELLATION_TYPE.MANUAL:
            screenContent = manualCancellationContent;
            break;
        case CONST.CANCELLATION_TYPE.AUTOMATIC:
            screenContent = automaticCancellationContent;
            break;
        default:
            screenContent = surveyContent;
    }

    return (
        <ScreenWrapper
            testID={RequestEarlyCancellationPage.displayName}
            includeSafeAreaPaddingBottom={false}
            shouldEnablePickerAvoiding={false}
            shouldEnableMaxHeight
        >
            <HeaderWithBackButton
                title={translate('subscription.requestEarlyCancellation.title')}
                onBackButtonPress={Navigation.goBack}
            />
            <ScrollView contentContainerStyle={[styles.flexGrow1, styles.pt3]}>{screenContent}</ScrollView>
        </ScreenWrapper>
    );
}

RequestEarlyCancellationPage.displayName = 'RequestEarlyCancellationPage';

export default RequestEarlyCancellationPage;
