export interface Provider {
  id: string;
  name: string;
  icon: string;
  is_enabled: boolean;
  api_key?: string;
  base_url?: string;
  provider_type?: string;
}

export interface Model {
  id: string;
  provider_id: string;
  name: string;
  is_enabled: boolean;
  group_name?: string | null;
  capabilities?: string[];
  capabilities_source?: "auto" | "manual";
}

export interface ActiveModelSelection {
  activeProviderId: string | null;
  activeModelId: string | null;
}
