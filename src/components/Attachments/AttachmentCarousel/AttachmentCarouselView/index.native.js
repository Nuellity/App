import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {View, Keyboard} from 'react-native';
import _ from 'underscore';
import addEncryptedAuthTokenToURL from '../../../../libs/addEncryptedAuthTokenToURL';
import AttachmentCarouselPager from '../../AttachmentCarouselPager';
import styles from '../../../../styles/styles';
import CarouselButtons from '../CarouselButtons';
import AttachmentView from '../../AttachmentView';
import propTypes from './propTypes';
import CONST from '../../../../CONST';

function AttachmentCarouselView({attachments, initialPage, initialActiveSource, containerDimensions, onClose, onNavigate}) {
    const pagerRef = useRef(null);

    // Inverting the list for touchscreen devices that can swipe or have an animation when scrolling
    // promotes the natural feeling of swiping left/right to go to the next/previous image
    const reversedAttachments = useMemo(() => attachments.reverse(), [attachments]);

    const processedItems = useMemo(() => _.map(reversedAttachments, (item) => ({key: item.source, url: addEncryptedAuthTokenToURL(item.source)})), [reversedAttachments]);

    const reversePage = useCallback((page) => Math.max(0, Math.min(attachments.length - page - 1, attachments.length)), [attachments.length]);

    const [page, setPage] = useState(reversePage(initialPage));
    const [activeSource, setActiveSource] = useState(initialActiveSource);
    const [isPinchGestureRunning, setIsPinchGestureRunning] = useState(true);
    const [shouldShowArrows, setShouldShowArrows] = useState(true);

    const autoHideArrowTimeout = useRef(null);

    /**
     * Cancels the automatic hiding of the arrows.
     */
    const cancelAutoHideArrow = useCallback(() => clearTimeout(autoHideArrowTimeout.current), []);

    /**
     * Automatically hide the arrows if there is no interaction for 3 seconds.
     */
    const autoHideArrow = useCallback(() => {
        cancelAutoHideArrow();
        autoHideArrowTimeout.current = setTimeout(() => {
            setShouldShowArrows(false);
        }, CONST.ARROW_HIDE_DELAY);
    }, [cancelAutoHideArrow]);

    const showArrows = useCallback(() => {
        setShouldShowArrows(true);
        autoHideArrow();
    }, [autoHideArrow]);

    /**
     * Updates the page state when the user navigates between attachments
     * @param {Object} item
     * @param {number} index
     */
    const updatePage = useCallback(
        (newPageIndex) => {
            Keyboard.dismiss();
            showArrows();

            const item = reversedAttachments[newPageIndex];

            setPage(newPageIndex);
            setActiveSource(item.source);

            onNavigate(item);
        },
        [onNavigate, reversedAttachments, showArrows],
    );

    /**
     * Increments or decrements the index to get another selected item
     * @param {Number} deltaSlide
     */
    const cycleThroughAttachments = useCallback(
        (deltaSlide) => {
            const nextPageIndex = page + deltaSlide;
            updatePage(nextPageIndex);
            pagerRef.current.setPage(nextPageIndex);

            autoHideArrow();
        },
        [autoHideArrow, page, updatePage],
    );

    /**
     * Defines how a single attachment should be rendered
     * @param {{ isAuthTokenRequired: Boolean, source: String, file: { name: String } }} item
     * @returns {JSX.Element}
     */
    const renderItem = useCallback(
        ({item}) => (
            <AttachmentView
                item={item}
                isFocused={activeSource === item.source}
                isUsedInCarousel
            />
        ),
        [activeSource],
    );

    useEffect(() => {
        autoHideArrow();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <View style={[styles.flex1, styles.attachmentCarouselButtonsContainer]}>
            <CarouselButtons
                shouldShowArrows={shouldShowArrows && !isPinchGestureRunning}
                page={reversePage(page)}
                attachments={attachments}
                onBack={() => cycleThroughAttachments(-1)}
                onForward={() => cycleThroughAttachments(1)}
                autoHideArrow={autoHideArrow}
                cancelAutoHideArrow={cancelAutoHideArrow}
            />

            {containerDimensions.width > 0 && containerDimensions.height > 0 && (
                <AttachmentCarouselPager
                    items={processedItems}
                    renderItem={renderItem}
                    initialIndex={page}
                    onPageSelected={({nativeEvent: {position: newPage}}) => updatePage(newPage)}
                    onTap={() => (shouldShowArrows ? setShouldShowArrows(false) : showArrows())}
                    onPinchGestureChange={(newIsPinchGestureRunning) => {
                        setIsPinchGestureRunning(newIsPinchGestureRunning);
                        if (!newIsPinchGestureRunning && !shouldShowArrows) showArrows();
                    }}
                    onSwipeDown={onClose}
                    containerWidth={containerDimensions.width}
                    containerHeight={containerDimensions.height}
                    ref={pagerRef}
                />
            )}
        </View>
    );
}

AttachmentCarouselView.propTypes = propTypes;

export default AttachmentCarouselView;
