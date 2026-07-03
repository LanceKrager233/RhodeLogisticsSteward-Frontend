import { Component, type ErrorInfo, type ReactNode } from "react";
import styles from "../styles/editor.module.css";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("Editor render failed", error, errorInfo);
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <div className={styles.appFrame} data-focus-mode={false} data-sidebar-collapsed>
        <main className={styles.workspace} data-sidebar-collapsed>
          <section className={styles.canvasStage}>
            <div className={styles.error} role="alert">
              编辑器遇到异常：{this.state.error.message}
            </div>
            <button
              className={styles.primaryAction}
              onClick={() => this.setState({ error: null })}
              type="button"
            >
              重试
            </button>
          </section>
        </main>
      </div>
    );
  }
}
