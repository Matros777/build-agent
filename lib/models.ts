export type AgentModel = {
  id: string;        // model id for the provider
  name: string;      // display name
  context: string;   // context window size label
  provider: "asi1";
  desc: string;      // short description
};

// ASI1 — облачная модель (единственный провайдер, по умолчанию)
const ASI1_MODELS: AgentModel[] = [
  { id: "asi1", name: "ASI1", context: "550K", provider: "asi1", desc: "ASI1 cloud model (550K context)" },
];

export const AGENT_MODELS: AgentModel[] = [...ASI1_MODELS];

export const DEFAULT_MODEL = AGENT_MODELS.find(
  (m) => m.id === "asi1",
) ?? AGENT_MODELS[0];

export function getModelById(id: string): AgentModel {
  return AGENT_MODELS.find((m) => m.id === id) ?? DEFAULT_MODEL;
}
