import { useEffect, useState } from 'react';
import { ApiError } from '@/api';
import { useUiStore } from '@/stores/ui';

function notifyReportDeleteError(err: unknown, fallback: string) {
  useUiStore.getState().pushToast({
    tone: 'error',
    title: 'Suppression impossible',
    description: err instanceof ApiError ? err.message : fallback,
    ttlMs: 4000,
  });
}

type UseReportLifecycleResult = {
  isDeleting: boolean;
  handleDelete: () => Promise<void>;
};

export function useReportLifecycle({
  reportId,
  isRead,
  markRead,
  deleteAsync,
  onClose,
  deleteErrorLabel,
}: {
  reportId: string;
  isRead: boolean | undefined;
  markRead: (args: { reportId: string }) => void;
  deleteAsync: (args: { reportId: string }) => Promise<unknown>;
  onClose: () => void;
  deleteErrorLabel: string;
}): UseReportLifecycleResult {
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (isRead !== false) return;
    markRead({ reportId });
  }, [isRead, reportId, markRead]);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAsync({ reportId });
      onClose();
    } catch (err) {
      notifyReportDeleteError(err, deleteErrorLabel);
    } finally {
      setIsDeleting(false);
    }
  };

  return { isDeleting, handleDelete };
}
