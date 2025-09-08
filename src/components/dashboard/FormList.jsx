import React from 'react';
import { useNavigate } from 'react-router-dom';
import ActionMenu from './ActionMenu';

const FormList = ({
  title,
  description,
  status,
  responses,
  date,
  path,
  onEdit,
  onArchive,
  onTogglePublic,
  onDownloadCSV,
  formId,
  isPublic,
  urlSlug,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (isPublic && urlSlug) {
      navigate(`/f/${urlSlug}`);
    } else if (path) {
      navigate(path);
    }
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'Public':
        return 'bg-success-50 text-success-700 border-success-500/20';
      case 'Internal':
        return 'bg-blue-50 text-blue-700 border-blue-500/20';
      case 'Archived':
        return 'bg-purple-50 text-purple-700 border-purple-500/20';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-300/20';
    }
  };

  return (
    <div className="@container group">
      <article
        className={`card-base group-hover:card-hover p-4 @sm:p-6 focus-within:ring-2 focus-within:ring-brand-500/20 ${path ? 'cursor-pointer' : ''}`}
        onClick={handleClick}
        tabIndex={path ? 0 : undefined}
        role={path ? 'button' : 'article'}
        onKeyDown={(e) => path && (e.key === 'Enter' || e.key === ' ') && handleClick()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className={`status-badge border ${getStatusStyles(status)}`}>
                {status}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base @sm:text-lg font-semibold text-gray-900 group-hover:text-brand-700 transition-colors truncate">{title}</h3>
              <p className="text-gray-600 text-sm @sm:text-base mt-1 line-clamp-1">{description}</p>
            </div>
          </div>
          <div className="flex items-center gap-6 flex-shrink-0 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{date}</span>
            </div>
            <div className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a2 2 0 01-2-2v-6a2 2 0 012-2h2m5-3V3a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
              </svg>
              <span className="font-semibold text-brand-600">{responses}</span>
            </div>
            {path && (
              <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            )}
            <ActionMenu
              formId={formId}
              status={status}
              isPublic={isPublic}
              urlSlug={urlSlug}
              onEdit={onEdit}
              onArchive={onArchive}
              onTogglePublic={onTogglePublic}
              onDownloadCSV={onDownloadCSV}
              buttonClassName="p-1 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
            />
          </div>
        </div>
      </article>
    </div>
  );
};

export default FormList;

