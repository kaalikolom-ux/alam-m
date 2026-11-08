import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AdminTabErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("AdminTabErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center space-y-3 my-4">
          <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="size-5" />
          </div>
          <h3 className="font-semibold text-sm text-foreground">
            {this.props.fallbackTitle || "এই অংশটি লোড করতে সমস্যা হয়েছে"}
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {this.state.error?.message || "একটি অনাকাঙ্ক্ষিত ত্রুটি ঘটেছে। পুনরায় চেষ্টা করুন।"}
          </p>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              if (this.props.onReset) this.props.onReset();
            }}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="size-3.5" />
            <span>আবার চেষ্টা করুন</span>
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
