import { useEffect, useState } from 'react';
import { Button } from '../buttons';
import { BottomSheet, Panel, PanelBody, PanelFooter, PanelHeader } from '../panels';
import { NumericKeypad, type NumericKeypadProps } from './NumericKeypad';

type NumericKeypadCoreProps = Omit<NumericKeypadProps, 'value' | 'onChange'>;

export interface NumericKeypadSheetProps extends NumericKeypadCoreProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (value: number) => void;
  value: number;
  title?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  maxHeight?: string;
}

export function NumericKeypadSheet({
  open,
  onClose,
  onConfirm,
  value,
  title,
  confirmLabel = 'OK',
  cancelLabel = 'Annuler',
  maxHeight = '56vh',
  ...keypadProps
}: NumericKeypadSheetProps) {
  const [draft, setDraft] = useState(value);
  const [openSession, setOpenSession] = useState(0);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft(value);

      setOpenSession((c) => c + 1);
    }
  }, [open, value]);

  const handleCancel = () => {
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(draft);
    onClose();
  };

  return (
    <BottomSheet isOpen={open} onClose={handleCancel} maxHeight={maxHeight} zIndex={50}>
      <Panel
        variant="parchment"
        padding="none"
        className="flex max-h-[inherit] flex-col rounded-b-none rounded-t-2xl shadow-2xl"
      >
        <div className="flex touch-none justify-center pb-0.5 pt-2" data-bottom-sheet-drag-region>
          <div className="h-1 w-[38px] rounded-full bg-[rgba(60,38,25,.32)]" />
        </div>
        {title && (
          <PanelHeader
            variant="parchment"
            size="md"
            className="flex-shrink-0 touch-none"
            data-bottom-sheet-drag-region
          >
            <span>{title}</span>
          </PanelHeader>
        )}
        <PanelBody
          className="flex-1 overflow-y-auto overscroll-contain"
          data-bottom-sheet-scrollable
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          <NumericKeypad
            key={openSession}
            clearOnFirstDigit
            {...keypadProps}
            value={draft}
            onChange={setDraft}
          />
        </PanelBody>
        <PanelFooter variant="parchment" className="flex-shrink-0">
          <Button type="button" variant="neutral" size="md" onClick={handleCancel}>
            {cancelLabel}
          </Button>
          <Button type="button" variant="info" size="md" onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </PanelFooter>
      </Panel>
    </BottomSheet>
  );
}
