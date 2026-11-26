import React, { useState, useEffect, useCallback } from 'react';

/**
 * UniLMS Enterprise Standard Confirmation Dialog
 * Supports 4 semantic variants:
 * - 'primary' (Purple/Indigo) -> Standard saves, additions, schedule creations
 * - 'success' (Emerald)        -> Final publishes, fee collections, grade approvals
 * - 'warning' (Amber)          -> Overwrite changes, gate bypasses, exam submissions
 * - 'danger'  (Rose/Red)       -> Deletions, rejections, revocations, cancellations
 */
export const ConfirmModal = ({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed with this operation?',
  details = null,
  confirmText = 'Confirm & Proceed',
  cancelText = 'Cancel',
  variant = 'primary',
  icon = null,
  loading = false,
  onConfirm,
  onCancel
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onCancel && onCancel();
      } else if (e.key === 'Enter' && !loading) {
        onConfirm && onConfirm();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, loading, onConfirm, onCancel]);

  if (!isOpen) return null;

  const variantStyles = {
    primary: {
      bgIcon: 'rgba(124, 58, 237, 0.1)',
      colorIcon: '#7C3AED',
      defaultIcon: 'fa-solid fa-circle-question',
      btnBg: '#7C3AED',
      btnBorder: '#7C3AED',
      btnColor: '#FFFFFF',
      badgeBg: 'rgba(124, 58, 237, 0.08)',
      badgeColor: '#7C3AED',
      label: 'CONFIRMATION'
    },
    success: {
      bgIcon: 'rgba(16, 185, 129, 0.12)',
      colorIcon: '#059669',
      defaultIcon: 'fa-solid fa-circle-check',
      btnBg: '#059669',
      btnBorder: '#059669',
      btnColor: '#FFFFFF',
      badgeBg: 'rgba(16, 185, 129, 0.1)',
      badgeColor: '#059669',
      label: 'VERIFY & SAVE'
    },
    warning: {
      bgIcon: 'rgba(245, 158, 11, 0.12)',
      colorIcon: '#D97706',
      defaultIcon: 'fa-solid fa-triangle-exclamation',
      btnBg: '#D97706',
      btnBorder: '#D97706',
      btnColor: '#FFFFFF',
      badgeBg: 'rgba(245, 158, 11, 0.1)',
      badgeColor: '#B45309',
      label: 'PROCEED WITH CAUTION'
    },
    danger: {
      bgIcon: 'rgba(239, 68, 68, 0.12)',
      colorIcon: '#DC2626',
      defaultIcon: 'fa-solid fa-trash-can',
      btnBg: '#DC2626',
      btnBorder: '#DC2626',
      btnColor: '#FFFFFF',
      badgeBg: 'rgba(239, 68, 68, 0.1)',
      badgeColor: '#DC2626',
      label: 'DESTRUCTIVE ACTION'
    }
  };

  const currentTheme = variantStyles[variant] || variantStyles.primary;
  const displayIcon = icon || currentTheme.defaultIcon;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        WebkitBackdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !loading) {
          onCancel && onCancel();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        style={{
          background: 'var(--card-bg, #ffffff)',
          border: '1px solid var(--border-color, #E2E8F0)',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '500px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.03)',
          overflow: 'hidden',
          animation: 'scaleIn 0.2s ease-out',
          position: 'relative'
        }}
      >
        {/* Top Accent Header Bar */}
        <div style={{ height: '4px', background: currentTheme.btnBg, width: '100%' }} />

        <div style={{ padding: '26px 28px' }}>
          {/* Header Row with Icon and Badge */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '14px',
                background: currentTheme.bgIcon,
                color: currentTheme.colorIcon,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                flexShrink: 0
              }}
            >
              <i className={displayIcon}></i>
            </div>

            <span
              style={{
                background: currentTheme.badgeBg,
                color: currentTheme.badgeColor,
                fontSize: '11px',
                fontWeight: '800',
                letterSpacing: '0.5px',
                padding: '4px 10px',
                borderRadius: '6px',
                textTransform: 'uppercase'
              }}
            >
              {currentTheme.label}
            </span>
          </div>

          {/* Title & Narrative */}
          <h3
            style={{
              margin: '0 0 8px 0',
              fontSize: '18px',
              fontWeight: '800',
              color: 'var(--text-primary, #0F172A)',
              letterSpacing: '-0.3px',
              lineHeight: 1.35
            }}
          >
            {title}
          </h3>

          <p
            style={{
              margin: '0 0 16px 0',
              fontSize: '13.5px',
              color: 'var(--text-secondary, #475569)',
              lineHeight: 1.55
            }}
          >
            {message}
          </p>

          {/* Optional Details Box / Change Summary */}
          {details && (
            <div
              style={{
                background: 'var(--bg-main, #F8FAFC)',
                border: '1px solid var(--border-color, #E2E8F0)',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '20px',
                fontSize: '12.5px',
                color: 'var(--text-secondary, #334155)'
              }}
            >
              {typeof details === 'string' ? (
                <div>{details}</div>
              ) : Array.isArray(details) ? (
                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                  {details.map((d, i) => (
                    <li key={i} style={{ marginBottom: i === details.length - 1 ? 0 : '4px' }}>
                      {d}
                    </li>
                  ))}
                </ul>
              ) : (
                details
              )}
            </div>
          )}

          {/* Actions Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '10px', marginTop: '22px' }}>
            <button
              type="button"
              disabled={loading}
              onClick={onCancel}
              className="btn btn-outline"
              style={{
                padding: '10px 18px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--text-secondary, #64748B)',
                borderColor: '#CBD5E1',
                background: '#FFFFFF',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {cancelText}
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className="btn btn-primary"
              style={{
                padding: '10px 22px',
                borderRadius: '10px',
                fontSize: '13px',
                fontWeight: '800',
                background: currentTheme.btnBg,
                borderColor: currentTheme.btnBorder,
                color: currentTheme.btnColor,
                boxShadow: `0 4px 14px ${currentTheme.bgIcon}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin"></i>
                  <span>Processing...</span>
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * useConfirmDialog Hook
 * Allows any React component across all 5 modules to trigger an enterprise confirmation modal
 * asynchronously with `const ok = await confirm({ title, message, ... })`.
 */
export const useConfirmDialog = () => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: '',
    message: '',
    details: null,
    confirmText: 'Confirm & Proceed',
    cancelText: 'Cancel',
    variant: 'primary',
    icon: null,
    resolve: null
  });

  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title: options.title || 'Confirm Action',
        message: options.message || 'Are you sure you want to proceed?',
        details: options.details || null,
        confirmText: options.confirmText || options.confirmLabel || 'Confirm & Proceed',
        cancelText: options.cancelText || 'Cancel',
        variant: options.variant || (options.isDestructive ? 'danger' : 'primary'),
        icon: options.icon || null,
        onConfirmCb: options.onConfirm,
        resolve
      });
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    if (dialogState.onConfirmCb) {
      try {
        await dialogState.onConfirmCb();
      } catch (err) {
        console.error('Confirm callback error:', err);
      }
    }
    if (dialogState.resolve) dialogState.resolve(true);
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, [dialogState]);

  const handleCancel = useCallback(() => {
    if (dialogState.resolve) dialogState.resolve(false);
    setDialogState((prev) => ({ ...prev, isOpen: false }));
  }, [dialogState]);

  const ConfirmDialog = useCallback(() => {
    return (
      <ConfirmModal
        isOpen={dialogState.isOpen}
        title={dialogState.title}
        message={dialogState.message}
        details={dialogState.details}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        variant={dialogState.variant}
        icon={dialogState.icon}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    );
  }, [dialogState, handleConfirm, handleCancel]);

  return {
    confirm,
    confirmAction: confirm,
    ConfirmDialog,
    ConfirmModal: ConfirmDialog
  };
};

export default ConfirmModal;
