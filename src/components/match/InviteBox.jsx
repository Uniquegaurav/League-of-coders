import { useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { inviteUrl } from '../../lib/format';
import { InviteFriends } from '../social/FriendBits';

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand('copy');
    el.remove();
    return ok;
  }
}

export default function InviteBox({ code, name }) {
  const [copied, setCopied] = useState(null);
  const url = inviteUrl(code);

  const doCopy = async (what) => {
    if (await copy(what === 'link' ? url : code)) {
      setCopied(what);
      toast.success(what === 'link' ? 'Invite link copied' : 'Room code copied');
      setTimeout(() => setCopied(null), 1800);
    }
  };

  const share = async () => {
    try {
      await navigator.share({ title: name, text: `Join my coding battle "${name}" on League of Coders`, url });
    } catch {
      /* user dismissed the share sheet */
    }
  };

  return (
    <div className="card p-5">
      <p className="label">Invite players</p>
      <div className="flex items-center gap-3">
        <button
          onClick={() => doCopy('code')}
          className="group flex items-center gap-2 rounded-xl border border-ink-700 bg-ink-950/60 px-4 py-2 font-mono text-2xl font-bold tracking-[0.3em] text-white hover:border-brand-500"
          title="Copy room code"
        >
          {code}
          {copied === 'code' ? <Check className="h-4 w-4 text-easy" /> : <Copy className="h-4 w-4 text-ink-500 group-hover:text-ink-300" />}
        </button>
      </div>
      <div className="mt-3 flex gap-2">
        <input readOnly value={url} className="input font-mono text-xs" onFocus={(e) => e.target.select()} />
        <button onClick={() => doCopy('link')} className="btn-primary shrink-0">
          {copied === 'link' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} Copy link
        </button>
        {typeof navigator !== 'undefined' && navigator.share && (
          <button onClick={share} className="btn-secondary shrink-0 px-3" aria-label="Share">
            <Share2 className="h-4 w-4" />
          </button>
        )}
      </div>
      <p className="mt-2 text-xs text-ink-500">Anyone with the link can join until the match starts, and spectate after.</p>
      <InviteFriends code={code} />
    </div>
  );
}
