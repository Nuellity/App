import type {StackScreenProps} from '@react-navigation/stack';
import React, {useEffect, useMemo, useState} from 'react';
import {View} from 'react-native';
import type {OnyxEntry} from 'react-native-onyx';
import {withOnyx} from 'react-native-onyx';
import ConfirmModal from '@components/ConfirmModal';
import HeaderWithBackButton from '@components/HeaderWithBackButton';
import * as Expensicons from '@components/Icon/Expensicons';
import MenuItem from '@components/MenuItem';
import MenuItemWithTopDescription from '@components/MenuItemWithTopDescription';
import OfflineWithFeedback from '@components/OfflineWithFeedback';
import ScreenWrapper from '@components/ScreenWrapper';
import ScrollView from '@components/ScrollView';
import Switch from '@components/Switch';
import Text from '@components/Text';
import TextLink from '@components/TextLink';
import useLocalize from '@hooks/useLocalize';
import usePolicy from '@hooks/usePolicy';
import useThemeStyles from '@hooks/useThemeStyles';
import * as CurrencyUtils from '@libs/CurrencyUtils';
import * as ErrorUtils from '@libs/ErrorUtils';
import Navigation from '@libs/Navigation/Navigation';
import {isControlPolicy} from '@libs/PolicyUtils';
import type {SettingsNavigatorParamList} from '@navigation/types';
import NotFoundPage from '@pages/ErrorPage/NotFoundPage';
import AccessOrNotFoundWrapper from '@pages/workspace/AccessOrNotFoundWrapper';
import * as Category from '@userActions/Policy/Category';
import CONST from '@src/CONST';
import ONYXKEYS from '@src/ONYXKEYS';
import ROUTES from '@src/ROUTES';
import type SCREENS from '@src/SCREENS';
import type * as OnyxTypes from '@src/types/onyx';

type CategorySettingsPageOnyxProps = {
    /** Collection of categories attached to a policy */
    policyCategories: OnyxEntry<OnyxTypes.PolicyCategories>;
};

type CategorySettingsPageProps = CategorySettingsPageOnyxProps & StackScreenProps<SettingsNavigatorParamList, typeof SCREENS.WORKSPACE.CATEGORY_SETTINGS>;

function CategorySettingsPage({
    route: {
        params: {backTo, policyID, categoryName},
    },
    policyCategories,
    navigation,
}: CategorySettingsPageProps) {
    const styles = useThemeStyles();
    const {translate} = useLocalize();
    const [deleteCategoryConfirmModalVisible, setDeleteCategoryConfirmModalVisible] = useState(false);
    const policy = usePolicy(policyID);

    const policyCategory = policyCategories?.[categoryName] ?? Object.values(policyCategories ?? {}).find((category) => category.previousCategoryName === categoryName);
    const policyCurrency = policy?.outputCurrency ?? CONST.CURRENCY.USD;
    const policyCategoryExpenseLimitType = policyCategory?.expenseLimitType ?? CONST.POLICY.EXPENSE_LIMIT_TYPES.EXPENSE;

    const areCommentsRequired = policyCategory?.areCommentsRequired ?? false;

    const navigateBack = () => {
        if (backTo) {
            Navigation.goBack(ROUTES.SETTINGS_CATEGORIES_ROOT.getRoute(policyID, backTo));
            return;
        }
        Navigation.goBack();
    };

    useEffect(() => {
        if (policyCategory?.name === categoryName || !policyCategory) {
            return;
        }
        navigation.setParams({categoryName: policyCategory?.name});
    }, [categoryName, navigation, policyCategory]);

    const flagAmountsOverText = useMemo(() => {
        if (policyCategory?.maxExpenseAmount === CONST.DISABLED_MAX_EXPENSE_VALUE || !policyCategory?.maxExpenseAmount) {
            return '';
        }

        return `${CurrencyUtils.convertToDisplayString(policyCategory?.maxExpenseAmount, policyCurrency)} ${CONST.DOT_SEPARATOR} ${translate(
            `workspace.rules.categoryRules.expenseLimitTypes.${policyCategoryExpenseLimitType}`,
        )}`;
    }, [policyCategory?.maxExpenseAmount, policyCategoryExpenseLimitType, policyCurrency, translate]);

    const approverText = useMemo(() => {
        return policy?.rules?.approvalRules?.find((rule) => rule.applyWhen.some((when) => when.value === categoryName))?.approver ?? '';
    }, [categoryName, policy?.rules?.approvalRules]);

    const defaultTaxRateText = useMemo(() => {
        return policy?.rules?.expenseRules?.find((rule) => rule.applyWhen.some((when) => when.value === categoryName))?.tax?.field_id_TAX?.externalID ?? '';
    }, [categoryName, policy?.rules?.expenseRules]);

    if (!policyCategory) {
        return <NotFoundPage />;
    }

    const updateWorkspaceRequiresCategory = (value: boolean) => {
        Category.setWorkspaceCategoryEnabled(policyID, {[policyCategory.name]: {name: policyCategory.name, enabled: value}});
    };

    const navigateToEditCategory = () => {
        if (backTo) {
            Navigation.navigate(ROUTES.SETTINGS_CATEGORY_EDIT.getRoute(policyID, policyCategory.name, backTo));
            return;
        }
        Navigation.navigate(ROUTES.WORKSPACE_CATEGORY_EDIT.getRoute(policyID, policyCategory.name));
    };

    const deleteCategory = () => {
        Category.deleteWorkspaceCategories(policyID, [categoryName]);
        setDeleteCategoryConfirmModalVisible(false);
        navigateBack();
    };

    const isThereAnyAccountingConnection = Object.keys(policy?.connections ?? {}).length !== 0;

    return (
        <AccessOrNotFoundWrapper
            accessVariants={[CONST.POLICY.ACCESS_VARIANTS.ADMIN, CONST.POLICY.ACCESS_VARIANTS.PAID]}
            policyID={policyID}
            featureName={CONST.POLICY.MORE_FEATURES.ARE_CATEGORIES_ENABLED}
        >
            <ScreenWrapper
                includeSafeAreaPaddingBottom={false}
                style={[styles.defaultModalContainer]}
                testID={CategorySettingsPage.displayName}
            >
                <HeaderWithBackButton
                    title={categoryName}
                    onBackButtonPress={navigateBack}
                />
                <ConfirmModal
                    isVisible={deleteCategoryConfirmModalVisible}
                    onConfirm={deleteCategory}
                    onCancel={() => setDeleteCategoryConfirmModalVisible(false)}
                    title={translate('workspace.categories.deleteCategory')}
                    prompt={translate('workspace.categories.deleteCategoryPrompt')}
                    confirmText={translate('common.delete')}
                    cancelText={translate('common.cancel')}
                    danger
                />
                <ScrollView contentContainerStyle={styles.flexGrow1}>
                    <OfflineWithFeedback
                        errors={ErrorUtils.getLatestErrorMessageField(policyCategory)}
                        pendingAction={policyCategory?.pendingFields?.enabled}
                        errorRowStyles={styles.mh5}
                        onClose={() => Category.clearCategoryErrors(policyID, categoryName)}
                    >
                        <View style={[styles.mt2, styles.mh5]}>
                            <View style={[styles.flexRow, styles.mb5, styles.mr2, styles.alignItemsCenter, styles.justifyContentBetween]}>
                                <Text style={[styles.flexShrink1, styles.mr2]}>{translate('workspace.categories.enableCategory')}</Text>
                                <Switch
                                    isOn={policyCategory.enabled}
                                    accessibilityLabel={translate('workspace.categories.enableCategory')}
                                    onToggle={updateWorkspaceRequiresCategory}
                                />
                            </View>
                        </View>
                    </OfflineWithFeedback>
                    <OfflineWithFeedback pendingAction={policyCategory.pendingFields?.name}>
                        <MenuItemWithTopDescription
                            title={policyCategory.name}
                            description={translate(`common.name`)}
                            onPress={navigateToEditCategory}
                            shouldShowRightIcon
                        />
                    </OfflineWithFeedback>
                    <OfflineWithFeedback pendingAction={policyCategory.pendingFields?.['GL Code']}>
                        <MenuItemWithTopDescription
                            title={policyCategory['GL Code']}
                            description={translate(`workspace.categories.glCode`)}
                            onPress={() => {
                                if (!isControlPolicy(policy)) {
                                    Navigation.navigate(
                                        ROUTES.WORKSPACE_UPGRADE.getRoute(
                                            policyID,
                                            CONST.UPGRADE_FEATURE_INTRO_MAPPING.glAndPayrollCodes.alias,
                                            ROUTES.WORKSPACE_CATEGORY_GL_CODE.getRoute(policyID, policyCategory.name),
                                        ),
                                    );
                                    return;
                                }
                                Navigation.navigate(ROUTES.WORKSPACE_CATEGORY_GL_CODE.getRoute(policyID, policyCategory.name));
                            }}
                            shouldShowRightIcon
                        />
                    </OfflineWithFeedback>
                    <OfflineWithFeedback pendingAction={policyCategory.pendingFields?.['Payroll Code']}>
                        <MenuItemWithTopDescription
                            title={policyCategory['Payroll Code']}
                            description={translate(`workspace.categories.payrollCode`)}
                            onPress={() => {
                                if (!isControlPolicy(policy)) {
                                    Navigation.navigate(
                                        ROUTES.WORKSPACE_UPGRADE.getRoute(
                                            policyID,
                                            CONST.UPGRADE_FEATURE_INTRO_MAPPING.glAndPayrollCodes.alias,
                                            ROUTES.WORKSPACE_CATEGORY_PAYROLL_CODE.getRoute(policyID, policyCategory.name),
                                        ),
                                    );
                                    return;
                                }
                                Navigation.navigate(ROUTES.WORKSPACE_CATEGORY_PAYROLL_CODE.getRoute(policyID, policyCategory.name));
                            }}
                            shouldShowRightIcon
                        />
                    </OfflineWithFeedback>

                    {policy?.areRulesEnabled && (
                        <>
                            <View style={[styles.mh5, styles.pt3, styles.borderTop]}>
                                <Text style={[styles.textNormal, styles.textStrong, styles.mv3]}>{translate('workspace.rules.categoryRules.title')}</Text>
                            </View>
                            <OfflineWithFeedback
                                errors={ErrorUtils.getLatestErrorMessageField(policyCategory)}
                                pendingAction={policyCategory?.pendingFields?.areCommentsRequired}
                                errorRowStyles={styles.mh5}
                                onClose={() => Category.clearCategoryErrors(policyID, categoryName)}
                            >
                                <View style={[styles.mt2, styles.mh5]}>
                                    <View style={[styles.flexRow, styles.mb5, styles.mr2, styles.alignItemsCenter, styles.justifyContentBetween]}>
                                        <Text style={[styles.flexShrink1, styles.mr2]}>{translate('workspace.rules.categoryRules.requireDescription')}</Text>
                                        <Switch
                                            isOn={policyCategory?.areCommentsRequired ?? false}
                                            accessibilityLabel={translate('workspace.rules.categoryRules.requireDescription')}
                                            onToggle={() => Category.setPolicyCategoryDescriptionRequired(policyID, categoryName, !areCommentsRequired)}
                                        />
                                    </View>
                                </View>
                            </OfflineWithFeedback>
                            {policyCategory?.areCommentsRequired && (
                                <OfflineWithFeedback pendingAction={policyCategory.pendingFields?.commentHint}>
                                    <MenuItemWithTopDescription
                                        title={policyCategory?.commentHint}
                                        description={translate(`workspace.categories.descriptionHint`)}
                                        onPress={() => {
                                            Navigation.navigate(ROUTES.WORSKPACE_CATEGORY_DESCRIPTION_HINT.getRoute(policyID, policyCategory.name));
                                        }}
                                        shouldShowRightIcon
                                    />
                                </OfflineWithFeedback>
                            )}
                            <OfflineWithFeedback>
                                <MenuItemWithTopDescription
                                    title={approverText}
                                    description={translate(`workspace.categories.approver`)}
                                    onPress={() => {
                                        Navigation.navigate(ROUTES.WORSKPACE_CATEGORY_APPROVER.getRoute(policyID, policyCategory.name));
                                    }}
                                    shouldShowRightIcon
                                />
                            </OfflineWithFeedback>
                            {policy?.tax?.trackingEnabled && (
                                <OfflineWithFeedback>
                                    <MenuItemWithTopDescription
                                        title={defaultTaxRateText}
                                        description={translate(`workspace.categories.defaultTaxRate`)}
                                        onPress={() => {
                                            Navigation.navigate(ROUTES.WORSKPACE_CATEGORY_DEFAULT_TAX_RATE.getRoute(policyID, policyCategory.name));
                                        }}
                                        shouldShowRightIcon
                                    />
                                </OfflineWithFeedback>
                            )}
                            {!policy?.areWorkflowsEnabled && (
                                <Text style={[styles.flexRow, styles.alignItemsCenter, styles.mv2, styles.mh5]}>
                                    <Text style={[styles.textLabel, styles.colorMuted]}>Go to</Text>{' '}
                                    <TextLink
                                        style={[styles.link, styles.label]}
                                        onPress={() => Navigation.navigate(ROUTES.WORKSPACE_MORE_FEATURES.getRoute(policyID))}
                                    >
                                        more features
                                    </TextLink>{' '}
                                    <Text style={[styles.textLabel, styles.colorMuted]}>and enable workflows, then add approvals to unlock this feature</Text>.
                                </Text>
                            )}
                            <OfflineWithFeedback pendingAction={policyCategory.pendingFields?.maxExpenseAmount}>
                                <MenuItemWithTopDescription
                                    title={flagAmountsOverText}
                                    description={translate(`workspace.categories.flagAmountsOver`)}
                                    onPress={() => {
                                        Navigation.navigate(ROUTES.WORSKPACE_CATEGORY_FLAG_AMOUNTS_OVER.getRoute(policyID, policyCategory.name));
                                    }}
                                    shouldShowRightIcon
                                />
                            </OfflineWithFeedback>
                            <OfflineWithFeedback pendingAction={policyCategory.pendingFields?.maxExpenseAmountNoReceipt}>
                                <MenuItemWithTopDescription
                                    title={``}
                                    description={translate(`workspace.rules.categoryRules.requireReceiptsOver`)}
                                    onPress={() => {
                                        Navigation.navigate(ROUTES.WORSKPACE_CATEGORY_REQUIRE_RECEIPTS_OVER.getRoute(policyID, policyCategory.name));
                                    }}
                                    shouldShowRightIcon
                                />
                            </OfflineWithFeedback>
                        </>
                    )}

                    {!isThereAnyAccountingConnection && (
                        <MenuItem
                            icon={Expensicons.Trashcan}
                            title={translate('common.delete')}
                            onPress={() => setDeleteCategoryConfirmModalVisible(true)}
                        />
                    )}
                </ScrollView>
            </ScreenWrapper>
        </AccessOrNotFoundWrapper>
    );
}

CategorySettingsPage.displayName = 'CategorySettingsPage';

export default withOnyx<CategorySettingsPageProps, CategorySettingsPageOnyxProps>({
    policyCategories: {
        key: ({route}) => `${ONYXKEYS.COLLECTION.POLICY_CATEGORIES}${route.params.policyID}`,
    },
})(CategorySettingsPage);
