import { Component } from 'react';

export default class PracticeErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Practice session error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      const errMsg = this.state.error?.message || String(this.state.error);
      return (
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl shadow-2xl p-8 w-full max-w-2xl mx-auto text-center">
          <p className="text-red-300 font-medium mb-2">Something went wrong loading practice.</p>
          {errMsg && <p className="text-slate-500 text-xs mb-2 font-mono max-w-md mx-auto truncate" title={errMsg}>{errMsg}</p>}
          <p className="text-slate-400 text-sm mb-6">You can try again or go back to the map.</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium"
            >
              Try again
            </button>
            <button
              onClick={() => this.props.onClose?.()}
              className="px-4 py-2 bg-slate-600 hover:bg-slate-500 text-white rounded-xl font-medium"
            >
              Back to map
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
