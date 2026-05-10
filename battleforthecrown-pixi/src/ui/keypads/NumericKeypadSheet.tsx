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
}

export function NumericKeypadSheet({
  open,
  onClose,
  onConfirm,
  value,
  title,
  confirmLabel = 'OK',
  cancelLabel = 'Annuler',
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
    <BottomSheet isOpen={open} onClose={handleCancel} maxHeight="85vh" zIndex={50}>
      <Panel
        variant="parchment"
        padding="none"
        className="rounded-t-2xl rounded-b-none shadow-2xl flex flex-col max-h-[85vh]"
      >
        {title && (
          <PanelHeader
            variant="parchment"
            size="md"
            className="flex-shrink-0 rounded-t-2xl"
          >
            <span>{title}</span>
          </PanelHeader>
        )}
        <PanelBody className="flex-1 overflow-y-auto">
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
