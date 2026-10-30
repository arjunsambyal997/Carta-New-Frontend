"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** What to show instead of the crashed part; a function gets a `reset` that tries rendering the children again. */
  fallback: ReactNode | ((reset: () => void) => ReactNode);
  /** Clears the error when any of these change (e.g. the route), so a crash does not stick across pages. */
  resetKeys?: unknown[];
}

interface State {
  failed: boolean;
}

const changed = (a: unknown[] = [], b: unknown[] = []) =>
  a.length !== b.length || a.some((v, i) => !Object.is(v, b[i]));

/**
 * Keeps a crash in one part of the screen (search, banner, a widget) from taking down the whole page.
 * Page-level crashes are already handled by app/error.tsx; this is for the pieces around and inside a page.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Part of the page failed to render", error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.failed && changed(prev.resetKeys, this.props.resetKeys)) this.reset();
  }

  reset = () => this.setState({ failed: false });

  render() {
    if (!this.state.failed) return this.props.children;
    const { fallback } = this.props;
    return typeof fallback === "function" ? fallback(this.reset) : fallback;
  }
}
