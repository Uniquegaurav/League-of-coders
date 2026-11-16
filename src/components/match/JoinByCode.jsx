import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

// Accepts a raw room code or a pasted invite link.
const extractCode = (value) => {
  const match = value.trim().match(/(?:\/m\/)?([A-Za-z0-9]{4,8})\/?$/);
  return match ? match[1].toUpperCase() : '';
};

export default function JoinByCode({ compact }) {
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
        placeholder={compact ? 'Room code' : 'Enter room code or paste invite link'}
        className="input font-mono uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal"
        aria-label="Room code"
      />
      <button type="submit" disabled={!code} className="btn-secondary shrink-0">
        Join <ArrowRight className="h-4 w-4" />
      </button>
    </form>
  );
}
