import React, { useState, useEffect, useRef } from 'react';

const ActionMenu = ({
  formId,
  status,
  isPublic,
  urlSlug,
  onEdit,
  onArchive,
  onTogglePublic,
  onDownloadCSV,
  buttonClassName = '',
}) => {
  const [showActions, setShowActions] = useState(false);
  const actionsRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (actionsRef.current && !actionsRef.current.contains(event.target)) {
        setShowActions(false);
      }
    };

    if (showActions) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showActions]);

  return (
    <div className="relative" ref={actionsRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setShowActions(!showActions);
        }}
        className={buttonClassName}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
          />
        </svg>
      </button>

      {showActions && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-surface border border-border rounded-lg shadow-card-hover z-50">
          <div className="py-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEdit(formId);
                setShowActions(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-surface-secondary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit Form
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePublic && onTogglePublic(formId, !isPublic);
                setShowActions(false);
              }}
              className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-surface-secondary ${
                isPublic
                  ? 'text-orange-700 hover:text-orange-800'
                  : 'text-green-700 hover:text-green-800'
              }`}
            >
              {isPublic ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 9m-3.172-.172L12 12m0 0l2.829 2.829"
                    />
                  </svg>
                  Make Internal
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                  Make Public
                </>
              )}
            </button>
            {isPublic && (
              <div className="px-3 py-2 text-xs text-gray-500 border-t border-gray-100">
                <span className="font-mono">/f/{urlSlug}</span>
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDownloadCSV && onDownloadCSV(formId);
                setShowActions(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-surface-secondary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Download CSV
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onArchive(formId);
                setShowActions(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-surface-secondary"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 8l4 4 4-4m0 0l4-4m-4 4v11"
                />
              </svg>
              {status === 'Archived' ? 'Unarchive' : 'Archive'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActionMenu;

