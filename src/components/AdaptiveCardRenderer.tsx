import React, { useState } from 'react';
import { WebexAdaptiveCard, WebexCardElement } from '../types/webex';
import { CheckCircle2, ExternalLink, Send } from 'lucide-react';

interface AdaptiveCardRendererProps {
  card: WebexAdaptiveCard;
  onSubmitAction?: (actionTitle: string, formValues: Record<string, unknown>) => void;
  interactive?: boolean;
}

export const AdaptiveCardRenderer: React.FC<AdaptiveCardRendererProps> = ({
  card,
  onSubmitAction,
  interactive = true,
}) => {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null);

  const handleInputChange = (id: string, val: string) => {
    setFormValues((prev) => ({ ...prev, [id]: val }));
  };

  const handleSubmit = (actionTitle: string, extraData?: Record<string, unknown>) => {
    const payload = {
      ...extraData,
      ...formValues,
    };
    setSubmittedStatus(`Action "${actionTitle}" triggered! Response payload recorded.`);
    if (onSubmitAction) {
      onSubmitAction(actionTitle, payload);
    }
    setTimeout(() => setSubmittedStatus(null), 4000);
  };

  const renderElement = (el: WebexCardElement, key: number | string) => {
    switch (el.type) {
      case 'TextBlock': {
        const sizeClass =
          el.size === 'extraLarge'
            ? 'text-lg font-bold'
            : el.size === 'large'
            ? 'text-base font-bold'
            : el.size === 'medium'
            ? 'text-sm font-semibold'
            : el.size === 'small'
            ? 'text-xs'
            : 'text-xs';

        const weightClass =
          el.weight === 'bolder' ? 'font-bold' : el.weight === 'lighter' ? 'font-light' : 'font-normal';

        const colorClass =
          el.color === 'attention'
            ? 'text-rose-400'
            : el.color === 'good'
            ? 'text-emerald-400'
            : el.color === 'warning'
            ? 'text-amber-400'
            : el.color === 'accent'
            ? 'text-cyan-400'
            : el.color === 'light'
            ? 'text-slate-400'
            : 'text-slate-200';

        return (
          <div key={key} className={`${sizeClass} ${weightClass} ${colorClass} leading-snug my-1`}>
            {el.text}
          </div>
        );
      }

      case 'FactSet': {
        return (
          <div key={key} className="my-2.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-700/50 space-y-1">
            {el.facts?.map((fact, fIdx) => (
              <div key={fIdx} className="grid grid-cols-3 text-xs gap-2">
                <span className="font-semibold text-slate-400 truncate">{fact.title}</span>
                <span className="col-span-2 text-slate-200 truncate">{fact.value}</span>
              </div>
            ))}
          </div>
        );
      }

      case 'Input.Text': {
        return (
          <div key={key} className="my-2">
            {el.isMultiline ? (
              <textarea
                value={formValues[el.id || ''] || ''}
                onChange={(e) => el.id && handleInputChange(el.id, e.target.value)}
                placeholder={el.placeholder || 'Type here...'}
                disabled={!interactive}
                rows={2}
                className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            ) : (
              <input
                type="text"
                value={formValues[el.id || ''] || ''}
                onChange={(e) => el.id && handleInputChange(el.id, e.target.value)}
                placeholder={el.placeholder || 'Type here...'}
                disabled={!interactive}
                className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
              />
            )}
          </div>
        );
      }

      case 'Input.ChoiceSet': {
        return (
          <div key={key} className="my-2 space-y-1.5">
            {el.placeholder && <div className="text-[11px] text-slate-400 mb-1">{el.placeholder}</div>}
            <div className="space-y-1">
              {el.choices?.map((choice, cIdx) => (
                <label
                  key={cIdx}
                  className="flex items-center space-x-2 text-xs text-slate-300 bg-slate-900/40 hover:bg-slate-900/80 px-2.5 py-1.5 rounded-md border border-slate-800 cursor-pointer transition-colors"
                >
                  <input
                    type="radio"
                    name={el.id || 'choice'}
                    value={choice.value}
                    checked={formValues[el.id || ''] === choice.value}
                    onChange={(e) => el.id && handleInputChange(el.id, e.target.value)}
                    disabled={!interactive}
                    className="text-cyan-500 focus:ring-cyan-500 focus:ring-1 border-slate-700"
                  />
                  <span>{choice.title}</span>
                </label>
              ))}
            </div>
          </div>
        );
      }

      case 'Input.Date': {
        return (
          <div key={key} className="my-2">
            <input
              type="date"
              value={formValues[el.id || ''] || ''}
              onChange={(e) => el.id && handleInputChange(el.id, e.target.value)}
              disabled={!interactive}
              className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200"
            />
          </div>
        );
      }

      case 'ColumnSet': {
        return (
          <div key={key} className="grid grid-cols-2 gap-2 my-2">
            {el.columns?.map((col, colIdx) => (
              <div key={colIdx} className="space-y-1">
                {col.items.map((subItem, sIdx) => renderElement(subItem, `${key}-col-${colIdx}-${sIdx}`))}
              </div>
            ))}
          </div>
        );
      }

      case 'Image': {
        return (
          <div key={key} className="my-2 rounded-lg overflow-hidden border border-slate-800">
            <img src={el.url} alt="Card attachment" className="max-h-48 object-cover w-full" />
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-800/90 shadow-xl overflow-hidden max-w-lg my-2">
      {/* Cisco Adaptive Card Top Header Badge */}
      <div className="bg-slate-900/90 px-3.5 py-1.5 border-b border-slate-700/70 flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
          Cisco Webex Adaptive Card
        </span>
        <span className="text-[10px] text-slate-400 font-mono">v{card.version || '1.3'}</span>
      </div>

      {/* Card Content Body */}
      <div className="p-4 space-y-1.5">
        {card.body?.map((el, idx) => renderElement(el, idx))}
      </div>

      {/* Actions */}
      {card.actions && card.actions.length > 0 && (
        <div className="px-4 pb-4 pt-1 flex flex-wrap gap-2 border-t border-slate-700/40 mt-2">
          {card.actions.map((act, actIdx) => {
            if (act.type === 'Action.OpenUrl') {
              return (
                <a
                  key={actIdx}
                  href={act.url || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-600 transition-colors"
                >
                  <span>{act.title}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              );
            }

            return (
              <button
                key={actIdx}
                onClick={() => handleSubmit(act.title, act.data)}
                disabled={!interactive}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-sm shadow-cyan-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                <Send className="w-3 h-3" />
                <span>{act.title}</span>
              </button>
            );
          })}
        </div>
      )}

      {submittedStatus && (
        <div className="mx-4 mb-3 p-2 bg-emerald-950/80 border border-emerald-700/70 rounded-lg text-emerald-300 text-xs flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{submittedStatus}</span>
        </div>
      )}
    </div>
  );
};
