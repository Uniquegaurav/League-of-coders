import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { CheckCircle2, Info, MessageSquare, Send } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

const time = (at) => new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function ChatPanel({ code, messages, className }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const send = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setSending(true);
    try {
      await api.matches.chat(code, value);
      setText('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={clsx('card flex min-h-0 flex-col', className)}>
      <div className="flex items-center gap-2 border-b border-ink-800 px-4 py-3">
        <MessageSquare className="h-4 w-4 text-ink-400" />
        <p className="text-sm font-semibold text-white">Room chat</p>
      </div>
      <div ref={listRef} className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-3">
        {messages.map((m) => {
          if (m.kind === 'chat') {
            const mine = m.user === user?.id;
            return (
              <div key={m.id} className={clsx('flex flex-col', mine && 'items-end')}>
                <span className="text-[11px] text-ink-500">
                  {mine ? 'You' : m.name} · {time(m.at)}
                </span>
                <span
                  className={clsx(
                    'mt-0.5 max-w-[85%] break-words rounded-2xl px-3 py-1.5 text-sm',
                    mine ? 'rounded-tr-sm bg-brand-500/90 text-white' : 'rounded-tl-sm bg-ink-800 text-ink-200'
                  )}
                >
                  {m.text}
                </span>
              </div>
            );
          }
          const Icon = m.kind === 'solve' ? CheckCircle2 : Info;
          return (
            <p key={m.id} className={clsx('flex items-start gap-1.5 text-xs', m.kind === 'solve' ? 'text-easy' : 'text-ink-400')}>
              <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{m.text}</span>
            </p>
          );
        })}
        {!messages.length && <p className="py-6 text-center text-xs text-ink-500">Say hi 👋</p>}
      </div>
      {user ? (
        <form onSubmit={send} className="flex gap-2 border-t border-ink-800 p-3">
          <input className="input py-2" maxLength={500} placeholder="Message the room…" value={text} onChange={(e) => setText(e.target.value)} />
          <button type="submit" disabled={sending || !text.trim()} className="btn-primary px-3" aria-label="Send">
            <Send className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <p className="border-t border-ink-800 p-3 text-center text-xs text-ink-400">
          <Link to="/login" className="text-brand-400 hover:underline">
            Sign in
          </Link>{' '}
          to chat
        </p>
      )}
    </div>
  );
}
