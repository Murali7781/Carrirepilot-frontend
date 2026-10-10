import { Component } from 'react';

export default class AppErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="app-recovery" role="alert">
          <section>
            <p className="eyebrow">CAREERPILOT</p>
            <h1>This page could not be loaded</h1>
            <p>Try reloading the application. If the problem continues, return to your dashboard.</p>
            <div className="app-recovery-actions">
              <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
                Reload application
              </button>
              <a className="btn btn-outline-secondary" href="/dashboard">Go to dashboard</a>
            </div>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}
