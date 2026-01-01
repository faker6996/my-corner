export interface ActionCapabilities {
  canView: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canDisplay: boolean;
}

export function buildActionCapabilities(actionCodes: string[]): ActionCapabilities {
  const set = new Set(actionCodes || []);
  return {
    canView: set.has("view"),
    canCreate: set.has("create"),
    canUpdate: set.has("update"),
    canDelete: set.has("delete"),
    canDisplay: set.has("display"),
  };
}

