import type {ReactNode} from 'react';
import type {ValueOf} from 'type-fest';
import type {FileObject} from '@components/AttachmentModal';
import type CONST from '@src/CONST';
import type {IOUType} from '@src/CONST';

type PickerOptions = {
    /** A callback that will be called with the selected attachment. */
    onPicked: (file: FileObject) => void;
    /** A callback that will be called without a selected attachment. */
    onCanceled?: () => void;
};

/**
 * A function used to open a picker with specified options.
 *
 * @param options - The options for the picker, including callbacks for handling picked file and cancellation.
 */
type OpenPickerFunction = (options: PickerOptions) => void;

type AttachmentPickerProps = {
    /**
     * A renderProp with the following interface
     *
     * @example
     * <AttachmentPicker>
     * {({openPicker}) => (
     *     <Button
     *         onPress={() => {
     *             openPicker({
     *                 onPicked: (file) => {
     *                     // Display or upload File
     *                 },
     *             });
     *         }}
     *     />
     * )}
     * </AttachmentPicker>
     * */
    children: (props: {openPicker: OpenPickerFunction}) => ReactNode;

    /** The types of files that can be selected with this picker. */
    type?: ValueOf<typeof CONST.ATTACHMENT_PICKER_TYPE>;

    /** Last screen to save for navigating after granting camera permission from settings in ios */
    lastScreen?: IOUType | '';
};

export default AttachmentPickerProps;
