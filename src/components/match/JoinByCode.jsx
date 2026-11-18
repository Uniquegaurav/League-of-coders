import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { ArrowRight } from 'lucide-react';

// Accepts a raw room code or a pasted invite link.
const extractCode = (value) => {
  const match = value.trim().match(/(?:\/m\/)?([A-Za-z0-9]{4,8})\/?$/);
  return match ? match[1].toUpperCase() : '';
};

// `onImage` gives it a frosted look with a visible border, for use over the page backdrop.
export default function JoinByCode({ compact, onImage }) {
  const [value, setValue] = useState('');
  const navigate = useNavigate();
  const code = extractCode(value);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (code) navigate(`/m/${code}`);
      }}
      className="flex w-full gap-2"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={compact ? 'Room code' : onImage ? 'Room code or invite link' : 'Enter room code or paste invite link'}
        className={clsx(
          'input font-mono uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal',
          onImage && 'border-white/25 bg-ink-950/70 py-3 placeholder:text-ink-300 backdrop-blur-md hover:border-white/40'
        )}
        aria-label="Room code"
      />
      <button
        type="submit"
        disabled={!code}
        className={clsx(
          'btn-secondary shrink-0',
          onImage && 'border-white/25 bg-ink-950/70 py-3 text-white backdrop-blur-md hover:border-white/40 disabled:text-ink-300 disabled:opacity-100'
        )}
      >
        Join <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
