'use client';

import { Modal } from './Modal';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'default';
}

export function ConfirmDialog({
  isOpen, onClose, onConfirm, title, message,
  confirmText = 'Confirm', cancelText = 'Cancel', variant = 'default',
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-gray-600 dark:text-dark-secondary mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 rounded-ios bg-ios-gray-6 dark:bg-dark-elevated text-gray-700 dark:text-dark-label font-medium text-sm hover:bg-ios-gray-4 dark:hover:bg-dark-separator transition-colors"
        >
          {cancelText}
        </button>
        <button
          onClick={() => { onConfirm(); onClose(); }}
          className={`px-4 py-2 rounded-ios font-medium text-sm text-white transition-colors ${
            variant === 'danger' ? 'bg-ios-red hover:bg-ios-red/90' : 'bg-ios-blue hover:bg-ios-blue/90'
          }`}
        >
          {confirmText}
        </button>
      </div>
    </Modal>
  );
}
