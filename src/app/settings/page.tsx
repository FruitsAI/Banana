import SettingsContainer from "@/components/settings/settings-container";

export default function SettingsPage() {
  return (
    <div className="flex h-full w-full overflow-hidden relative" style={{ gridColumn: '2 / -1' }}>
      <SettingsContainer />
    </div>
  );
}
