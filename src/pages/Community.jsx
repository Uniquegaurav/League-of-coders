import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import clsx from 'clsx';
import { toast } from 'sonner';
import { ExternalLink, Hash, Heart, MessageCircle, PenSquare, Send, Swords, Trash2, X } from 'lucide-react';
import { api } from '../lib/api';
import { timeAgo } from '../lib/format';
import { useAuth } from '../context/AuthContext';
import { useSocial } from '../context/SocialContext';
import { Avatar, EmptyState, PageBanner, PageLoader, Spinner } from '../components/ui';
import fiber from '../assets/bg/fiber.jpg';
import FriendsHub from '../components/social/FriendsHub';
import { FriendsPanel } from '../components/social/FriendBits';

const FILTERS = [
  ['', 'Everything'],
  ['discussion', 'Discussions'],
  ['match', 'Battle results'],
];

function Composer({ onCreated, onCancel }) {
  const [form, setForm] = useState({ title: '', body: '', link: '', tags: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { post } = await api.posts.create(form);
      onCreated(post);
      setForm({ title: '', body: '', link: '', tags: '' });
      toast.success('Posted!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="card space-y-3 p-5">
      <input className="input text-base font-semibold" placeholder="What's on your mind?" maxLength={140} value={form.title} onChange={set('title')} autoFocus />
      <textarea className="input min-h-[110px] resize-y" placeholder="Share an approach, ask for help, announce a tournament…" maxLength={8000} value={form.body} onChange={set('body')} />
      <div className="grid gap-3 sm:grid-cols-2">
        <input className="input" placeholder="Link (optional)" value={form.link} onChange={set('link')} />
        <input className="input" placeholder="Tags, comma separated (e.g. dp, graphs)" value={form.tags} onChange={set('tags')} />
      </div>
      <div className="flex justify-end gap-2">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={busy || !form.title.trim()}>
          {busy ? <Spinner className="h-4 w-4" /> : <Send className="h-4 w-4" />} Post
        </button>
      </div>
    </form>
  );
}

function Comments({ post, onChange }) {
  const { user } = useAuth();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? post.comments : post.comments.slice(-3);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      const { post: updated } = await api.posts.comment(post.id, text);
      onChange(updated);
      setText('');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (commentId) => {
    try {
      const { post: updated } = await api.posts.removeComment(post.id, commentId);
      onChange(updated);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="mt-4 space-y-3 border-t border-ink-800 pt-4">
      {post.comments.length > 3 && !showAll && (
        <button className="text-xs text-brand-400 hover:underline" onClick={() => setShowAll(true)}>
          View all {post.comments.length} comments
        </button>
      )}
      {visible.map((c) => (
        <div key={c.id} className="group flex gap-3">
          <Avatar name={c.author.name} src={c.author.avatar} size={28} />
          <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm bg-ink-800/70 px-3 py-2">
            <p className="text-xs">
              <Link to={`/u/${c.author.id}`} className="font-semibold text-ink-200 hover:underline">
                {c.author.name}
              </Link>
              <span className="text-ink-500"> · {timeAgo(c.createdAt)}</span>
            </p>
            <p className="whitespace-pre-wrap break-words text-sm text-ink-300">{c.body}</p>
          </div>
          {user && (user.id === c.author.id || user.id === post.author.id) && (
            <button className="self-center text-ink-600 opacity-0 transition hover:text-hard group-hover:opacity-100" onClick={() => remove(c.id)} aria-label="Delete comment">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      ))}
      {user ? (
        <form onSubmit={submit} className="flex gap-2">
          <input className="input py-2" placeholder="Write a comment…" maxLength={2000} value={text} onChange={(e) => setText(e.target.value)} />
          <button className="btn-secondary px-3" disabled={busy || !text.trim()} aria-label="Send comment">
            <Send className="h-4 w-4" />
          </button>
        </form>
      ) : (
        <p className="text-xs text-ink-500">
          <Link to="/login" className="text-brand-400 hover:underline">
            Sign in
          </Link>{' '}
          to join the conversation.
        </p>
      )}
    </div>
  );
}

function PostCard({ post, onChange, onDelete, onTag }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(post.comments.length > 0 && post.comments.length <= 2);

  const like = async () => {
    if (!user) return toast('Sign in to like posts');
    onChange({ ...post, liked: !post.liked, likes: post.likes + (post.liked ? -1 : 1) });
    try {
      const { post: updated } = await api.posts.like(post.id);
      onChange(updated);
    } catch (err) {
      onChange(post);
      toast.error(err.message);
    }
    return undefined;
  };

  const remove = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await api.posts.remove(post.id);
      onDelete(post.id);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <article className="card p-5">
      <header className="flex items-start gap-3">
        <Avatar name={post.author.name} src={post.author.avatar} size={40} />
        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <Link to={`/u/${post.author.id}`} className="font-semibold text-white hover:underline">
              {post.author.name}
            </Link>
            <span className="text-ink-500"> · {timeAgo(post.createdAt)}</span>
          </p>
          {post.kind === 'match' && (
            <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-brand-400">
              <Swords className="h-3 w-3" /> Battle result
            </span>
          )}
        </div>
        {user?.id === post.author.id && (
          <button className="btn-ghost p-1.5 text-ink-500 hover:text-hard" onClick={remove} aria-label="Delete post">
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </header>
      <h3 className="mt-3 font-display text-lg font-semibold text-white">{post.title}</h3>
      {post.body && <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-ink-300">{post.body}</p>}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {post.link && (
          <a href={post.link} target="_blank" rel="noreferrer noopener" className="chip hover:border-brand-500 hover:text-white">
            <ExternalLink className="h-3 w-3" /> {new URL(post.link).hostname}
          </a>
        )}
        {post.matchCode && (
          <Link to={`/m/${post.matchCode}`} className="chip hover:border-brand-500 hover:text-white">
            <Swords className="h-3 w-3" /> View battle {post.matchCode}
          </Link>
        )}
        {post.tags.map((t) => (
          <button key={t} onClick={() => onTag(t)} className="chip hover:text-white">
            <Hash className="h-3 w-3" />
            {t}
          </button>
        ))}
      </div>
      <footer className="mt-4 flex gap-1">
        <button onClick={like} className={clsx('btn-ghost btn-sm', post.liked && 'text-hard')}>
          <Heart className={clsx('h-4 w-4', post.liked && 'fill-current')} /> {post.likes || ''}
        </button>
        <button onClick={() => setOpen((o) => !o)} className="btn-ghost btn-sm">
          <MessageCircle className="h-4 w-4" /> {post.comments.length || ''} {post.comments.length === 1 ? 'comment' : 'comments'}
        </button>
      </footer>
      {open && <Comments post={post} onChange={onChange} />}
    </article>
  );
}

function Feed() {
  const { user } = useAuth();
  const [kind, setKind] = useState('');
  const [tag, setTag] = useState('');
  const [posts, setPosts] = useState(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [composing, setComposing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const load = useCallback(
    async (nextPage) => {
      const res = await api.posts.list({ kind: kind || undefined, tag: tag || undefined, page: nextPage });
      setTotal(res.total);
      setPage(nextPage);
      setPosts((prev) => (nextPage === 1 ? res.posts : [...(prev || []), ...res.posts]));
    },
    [kind, tag]
  );

  useEffect(() => {
    setPosts(null);
    load(1).catch((err) => {
      toast.error(err.message);
      setPosts([]);
    });
  }, [load]);

  const replace = (updated) => setPosts((ps) => ps.map((p) => (p.id === updated.id ? updated : p)));

  return (
    <div className={clsx('grid grid-cols-1 gap-6', user && 'lg:grid-cols-[minmax(0,1fr)_320px]')}>
    <div className="min-w-0 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="text-ink-400">Battle recaps, approaches, challenges and announcements.</p>
        {user ? (
          !composing && (
            <button className="btn-primary" onClick={() => setComposing(true)}>
              <PenSquare className="h-4 w-4" /> New post
            </button>
          )
        ) : (
          <Link to="/login" state={{ from: '/community' }} className="btn-secondary">
            Sign in to post
          </Link>
        )}
      </div>

      {composing && (
        <Composer
          onCancel={() => setComposing(false)}
          onCreated={(post) => {
            setPosts((ps) => [post, ...(ps || [])]);
            setComposing(false);
          }}
        />
      )}

      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map(([value, label]) => (
          <button key={value} onClick={() => setKind(value)} className={clsx('btn btn-sm', kind === value ? 'bg-ink-800 text-white' : 'text-ink-400 hover:text-white')}>
            {label}
          </button>
        ))}
        {tag && (
          <button onClick={() => setTag('')} className="chip border-brand-500 text-white">
            #{tag} <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {!posts ? (
        <PageLoader />
      ) : posts.length ? (
        <div className="space-y-4">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} onChange={replace} onDelete={(id) => setPosts((ps) => ps.filter((x) => x.id !== id))} onTag={setTag} />
          ))}
          {posts.length < total && (
            <div className="flex justify-center">
              <button
                className="btn-secondary"
                disabled={loadingMore}
                onClick={async () => {
                  setLoadingMore(true);
                  await load(page + 1).catch((err) => toast.error(err.message));
                  setLoadingMore(false);
                }}
              >
                {loadingMore && <Spinner className="h-4 w-4" />} Load more
              </button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState icon={MessageCircle} title="Nothing here yet">
          Start the conversation, or finish a battle and share the result.
        </EmptyState>
      )}
    </div>
    {user && (
      <aside className="hidden space-y-5 lg:block">
        <FriendsPanel />
      </aside>
    )}
    </div>
  );
}

const TABS = [
  ['feed', 'Feed'],
  ['friends', 'Friends'],
];

export default function Community() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'friends' ? 'friends' : 'feed';
  const social = useSocial();

  useEffect(() => {
    document.title = 'Community · League of Coders';
  }, []);

  return (
    <div className="space-y-6">
      <PageBanner
        image={fiber}
        title="Community"
        actions={
          <div className="inline-flex rounded-xl border border-ink-700 bg-ink-950/60 p-1">
            {TABS.map(([key, label]) => (
              <button
                key={key}
                onClick={() => setParams(key === 'feed' ? {} : { tab: key }, { replace: true })}
                className={clsx('relative inline-flex items-center gap-2 rounded-lg px-4 py-1.5 text-sm font-semibold transition', tab === key ? 'bg-ink-700 text-white' : 'text-ink-400 hover:text-white')}
              >
                {label}
                {key === 'friends' && social?.incoming.length > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-hard px-1 text-[10px] text-white">{social.incoming.length}</span>
                )}
              </button>
            ))}
          </div>
        }
      >
        Share results, follow friends and find your next rival.
      </PageBanner>
      {tab === 'friends' ? <FriendsHub /> : <Feed />}
    </div>
  );
}
