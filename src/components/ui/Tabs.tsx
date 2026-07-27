interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: "underline" | "pill";
}

export function Tabs({
  tabs,
  activeTab,
  onChange,
  variant = "underline",
}: TabsProps) {
  if (variant === "pill") {
    return (
      <div className="inline-flex rounded-xl bg-bg-elevated p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`no-drag rounded-lg px-5 py-2 text-sm font-medium transition ${
              activeTab === tab.id
                ? "bg-[var(--accent)] text-white"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-6 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`no-drag relative pb-3 text-sm font-medium transition ${
            activeTab === tab.id
              ? "text-[var(--accent)]"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          {tab.label}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-[var(--accent)]" />
          )}
        </button>
      ))}
    </div>
  );
}
