import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="font-display text-2xl font-bold text-white">Something broke</p>
        <p className="mt-2 text-ink-400">An unexpected error happened while rendering this page.</p>
        <button className="btn-primary mt-6" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    );
  }
}
