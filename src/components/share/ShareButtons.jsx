import { useState } from 'react';
import clsx from 'clsx';
import { toast } from 'sonner';
import { Check, Download, Link2, Linkedin, MessageCircle, Share2, Twitter } from 'lucide-react';
import { track } from '../../lib/analytics';
import { Spinner } from '../ui';

async function copyText(text) {
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

const open = (url) => window.open(url, '_blank', 'noopener,noreferrer,width=640,height=640');

/**
 * Share row used on results, profiles, lobbies and challenges.
 * `kind` only labels the analytics event. `image` adds a "Save image" button for the preview card.
 */
export default function ShareButtons({ url, copyUrl, text, kind, image, imageName = 'league-of-coders.png', className, compact = false }) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const shared = (channel) => track('share_clicked', { kind, channel });

  const channels = [
    {
      key: 'linkedin',
      label: 'LinkedIn',
      icon: Linkedin,
      go: () => open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`),
    },
    {
      key: 'x',
      label: 'X',
      icon: Twitter,
      go: () => open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`),
    },
    {
      key: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      go: () => open(`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`),
    },
  ];

  const copy = async () => {
    if (await copyText(copyUrl || url)) {
      setCopied(true);
      shared('copy');
      toast.success('Link copied');
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const saveImage = async () => {
    setSaving(true);
    try {
      const res = await fetch(image);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = imageName;
      a.click();
      setTimeout(() => URL.revokeObjectURL(href), 1000);
      shared('image');
    } catch {
      toast.error('Could not load the image. Try again in a moment.');
    } finally {
      setSaving(false);
    }
  };

  const native = async () => {
    try {
      await navigator.share({ title: 'League of Coders', text, url: copyUrl || url });
      shared('native');
    } catch {
      /* dismissed */
    }
  };

  return (
    <div className={clsx('flex flex-wrap gap-2', className)}>
      {channels.map(({ key, label, icon: Icon, go }) => (
        <button
          key={key}
          type="button"
          className="btn-secondary btn-sm"
          onClick={() => {
            shared(key);
            go();
          }}
          aria-label={`Share on ${label}`}
        >
          <Icon className="h-3.5 w-3.5" />
          {!compact && label}
        </button>
      ))}
      <button type="button" className="btn-secondary btn-sm" onClick={copy}>
        {copied ? <Check className="h-3.5 w-3.5 text-easy" /> : <Link2 className="h-3.5 w-3.5" />}
        {!compact && 'Copy link'}
      </button>
      {image && (
        <button type="button" className="btn-secondary btn-sm" onClick={saveImage} disabled={saving}>
          {saving ? <Spinner className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
          {!compact && 'Save image'}
        </button>
      )}
      {typeof navigator !== 'undefined' && navigator.share && (
        <button type="button" className="btn-secondary btn-sm px-2.5" onClick={native} aria-label="More sharing options">
          <Share2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
