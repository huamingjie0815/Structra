import { Component, type ErrorInfo, type ReactNode } from "react";

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Structra crashed.", error, info);
  }

  private retry = () => {
    this.setState({ error: null });
  };

  private reload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <main className="app-error-boundary" role="alert">
        <section className="app-error-panel">
          <div className="brand-mark">ST</div>
          <div>
            <p className="app-error-kicker">Structra</p>
            <h1>编辑器遇到运行时错误</h1>
            <p className="app-error-message">
              当前视图已停止渲染。你的本地文件不会被上传；可以先重试当前界面，或重新加载应用回到最近的本机缓存状态。
            </p>
          </div>
          <div className="app-error-actions">
            <button onClick={this.retry}>重试</button>
            <button onClick={this.reload}>重新加载</button>
          </div>
          <details className="app-error-details">
            <summary>错误详情</summary>
            <pre>{this.state.error.stack || this.state.error.message}</pre>
          </details>
        </section>
      </main>
    );
  }
}
