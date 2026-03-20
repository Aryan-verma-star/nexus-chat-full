import { useEffect, useState } from "react";
import { X, Copy, Check, RefreshCw, Zap, Link2, Eye, EyeOff, Send, Clock } from "lucide-react";
import { toast } from "sonner";

interface IntegrationCardsProps {
  open: boolean;
  onClose: () => void;
}

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  webhookUrl: string;
  webhookSecret?: string;
  lastSync?: string;
  enabled: boolean;
  badge?: string;
}

export function IntegrationCards({ open, onClose }: IntegrationCardsProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: "fiverr",
      name: "Fiverr",
      description: "Receive job notifications from Fiverr",
      icon: "F",
      connected: false,
      webhookUrl: "https://Nexus-chat-app-nexus-chat.hf.space/api/webhooks/fiverr",
      enabled: true,
    },
    {
      id: "upwork",
      name: "Upwork",
      description: "Receive job notifications from Upwork",
      icon: "U",
      connected: false,
      webhookUrl: "https://Nexus-chat-app-nexus-chat.hf.space/api/webhooks/upwork",
      enabled: true,
    },
    {
      id: "youtube",
      name: "YouTube",
      description: "Get notified when new videos are uploaded",
      icon: "YT",
      connected: false,
      enabled: false,
      badge: "Coming Soon",
    },
    {
      id: "custom",
      name: "Custom Integration",
      description: "Connect your own webhook endpoint",
      icon: "+",
      connected: false,
      enabled: false,
      badge: "Coming Soon",
    },
  ]);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [testingWebhook, setTestingWebhook] = useState<string | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [open, onClose]);

  const handleCopyWebhook = async (webhookUrl: string, id: string) => {
    try {
      await navigator.clipboard.writeText(webhookUrl);
      setCopiedId(id);
      toast.success("Webhook URL copied to clipboard");
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const toggleSecretVisibility = (id: string) => {
    setVisibleSecrets((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleTestWebhook = async (integration: Integration) => {
    if (!integration.webhookUrl) return;

    setTestingWebhook(integration.id);
    try {
      const response = await fetch(integration.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          test: true,
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok || response.status === 405) {
        toast.success(`${integration.name} webhook is reachable`);
      } else {
        toast.error(`${integration.name} webhook returned error: ${response.status}`);
      }

      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === integration.id
            ? { ...i, lastSync: new Date().toLocaleString() }
            : i
        )
      );
    } catch (err: any) {
      toast.error(`Failed to test webhook: ${err.message}`);
    } finally {
      setTestingWebhook(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="flex h-[85vh] w-full max-w-2xl flex-col rounded-xl border border-border bg-card shadow-2xl animate-scale-in">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="font-display text-lg font-bold text-foreground flex items-center gap-2">
            <Link2 className="h-5 w-5 text-primary" />
            Integrations
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {integrations.map((integration) => (
            <div
              key={integration.id}
              className={`rounded-xl border p-4 transition-all ${
                integration.enabled
                  ? "border-border bg-card hover:border-primary/30"
                  : "border-border/50 bg-muted/20 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl font-display text-lg font-bold ${
                      integration.enabled
                        ? "bg-primary/20 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {integration.icon}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-display font-semibold text-foreground">
                        {integration.name}
                      </h3>
                      {integration.badge && (
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {integration.badge}
                        </span>
                      )}
                      {integration.enabled && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            integration.connected
                              ? "bg-primary/20 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {integration.connected ? "Connected" : "Not configured"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {integration.description}
                    </p>
                  </div>
                </div>

                {integration.enabled && integration.connected && (
                  <div className="flex items-center gap-1 text-primary">
                    <Zap className="h-4 w-4" />
                    <span className="text-xs font-medium">Active</span>
                  </div>
                )}
              </div>

              {integration.enabled && (
                <>
                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Webhook URL
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 truncate rounded-lg border border-border bg-input px-3 py-2 font-mono text-xs text-muted-foreground">
                          {integration.webhookUrl}
                        </div>
                        <button
                          onClick={() =>
                            handleCopyWebhook(integration.webhookUrl, integration.id)
                          }
                          className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          title="Copy webhook URL"
                        >
                          {copiedId === integration.id ? (
                            <Check className="h-4 w-4 text-primary" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {integration.webhookSecret && (
                      <div>
                        <label className="mb-1 block text-xs font-medium text-muted-foreground">
                          Webhook Secret
                        </label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 truncate rounded-lg border border-border bg-input px-3 py-2 font-mono text-xs text-muted-foreground">
                            {visibleSecrets[integration.id]
                              ? integration.webhookSecret
                              : "••••••••••••••••"}
                          </div>
                          <button
                            onClick={() => toggleSecretVisibility(integration.id)}
                            className="shrink-0 rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            title={visibleSecrets[integration.id] ? "Hide" : "Show"}
                          >
                            {visibleSecrets[integration.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {integration.lastSync && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>Last sync: {integration.lastSync}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => handleTestWebhook(integration)}
                      disabled={testingWebhook === integration.id}
                      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-all hover:bg-muted disabled:opacity-50"
                    >
                      {testingWebhook === integration.id ? (
                        <>
                          <RefreshCw className="h-3 w-3 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <Send className="h-3 w-3" />
                          Test Webhook
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          <div className="rounded-xl border border-dashed border-border bg-muted/10 p-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted/50">
              <svg
                className="h-6 w-6 text-muted-foreground"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <h3 className="font-display text-sm font-semibold text-foreground mb-1">
              Need a Custom Integration?
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Contact your administrator to set up custom webhooks for your workflow.
            </p>
            <button className="rounded-lg bg-muted px-4 py-2 text-xs font-medium text-muted-foreground cursor-not-allowed">
              Coming Soon
            </button>
          </div>
        </div>

        <div className="border-t border-border p-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg bg-muted px-4 py-2 font-display text-sm font-medium text-foreground transition-colors hover:bg-muted/80"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
