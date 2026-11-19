import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { api } from '../../lib/api';
import { track } from '../../lib/analytics';
import { useAuth } from '../../context/AuthContext';
import { Spinner } from '../ui';

// Accepts a raw room code or a pasted invite link.
const extractCode = (value) => {
  const match = value.trim().match(/(?:\/m\/)?([A-Za-z0-9]{4,8})\/?$/);
  return match ? match[1].toUpperCase() : '';
};

// `onImage` gives it a frosted look with a visible border, for use over the page backdrop.
export default function JoinByCode({ compact, onImage }) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const code = extractCode(value);

  // Pressing Join adds a verified player to the lobby, so they show up in the player list right away.
  // Anyone else (signed out, unverified, or a battle already running) just lands in the room.
  const join = async () => {
    if (!user?.leetcode?.verified) return navigate(`/m/${code}`);
    setBusy(true);
    try {
      await api.matches.join(code);
      track('match_joined', { via: 'code' });
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
      navigate(`/m/${code}`);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (code && !busy) join();
      }}
      className="flex w-full gap-2"
    >
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={compact ? 'Room code' : onImage ? 'Have a room code? Paste it or the invite link' : 'Enter room code or paste invite link'}
        className={clsx(
          'input font-mono uppercase tracking-widest placeholder:font-sans placeholder:normal-case placeholder:tracking-normal',
          onImage && 'border-white/25 bg-ink-950/70 py-3 placeholder:text-ink-300 backdrop-blur-md hover:border-white/40'
        )}
        aria-label="Room code"
      />
      {/* Join only makes sense once there is a code to join, so it appears when one is typed. */}
      {code && (
        <button
          type="submit"
          disabled={busy}
          className={clsx('btn-primary pop-in-x shrink-0', onImage && 'py-3')}
        >
          {busy && <Spinner className="h-4 w-4" />} Join {code} <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </form>
  );
}
