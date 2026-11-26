import { useState } from 'react';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const SPLIT_MIN = 20;
const SPLIT_MAX = 80;

// The line between the problem and the editor: drag it, or use the arrows to give one side the room.
export default function SplitHandle({ containerRef, split, onChange }) {
  const [dragging, setDragging] = useState(false);

  const startDrag = (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const rect = containerRef.current.getBoundingClientRect();
    setDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    const move = (ev) => {
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      onChange(Math.round(Math.min(SPLIT_MAX, Math.max(SPLIT_MIN, pct))));
    };
    const up = () => {
      setDragging(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const arrow = 'rounded-md border border-ink-700 bg-ink-900 p-0.5 text-ink-400 shadow transition hover:border-brand-500 hover:text-white';
  return (
    <div
      role="separator"
      aria-orientation="vertical"
      title="Drag to resize, double-click to reset"
      onPointerDown={startDrag}
      onDoubleClick={() => onChange(50)}
      className="group relative hidden w-3 shrink-0 cursor-col-resize justify-center xl:flex"
    >
      <div className={clsx('h-full transition-all', dragging ? 'w-0.5 bg-brand-500' : 'w-px bg-ink-800 group-hover:w-0.5 group-hover:bg-brand-500')} />
      <div className="absolute top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1" onPointerDown={(e) => e.stopPropagation()}>
        {split > 0 && (
          <button type="button" className={arrow} title={split > 50 ? 'Even split' : 'Expand editor'} onClick={() => onChange(split > 50 ? 50 : 0)}>
            <ChevronLeft className="h-3.5 w-3.5" />
          </button>
        )}
        {split < 100 && (
          <button type="button" className={arrow} title={split < 50 ? 'Even split' : 'Expand problem'} onClick={() => onChange(split < 50 ? 50 : 100)}>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
