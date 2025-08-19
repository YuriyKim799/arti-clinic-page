import React from 'react';

type Props = { children: React.ReactNode; fallback?: React.ReactNode };
type State = { hasError: boolean };

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: any, info: any) {
    console.error('UI error:', error, info);
  }
  render() {
    if (this.state.hasError)
      return (
        this.props.fallback ?? (
          <div style={{ padding: 20 }}>
            Произошла ошибка. Обновите страницу.
          </div>
        )
      );
    return this.props.children;
  }
}
