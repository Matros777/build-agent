import { browserRequest } from "./cdp";

export async function runBrowser(
  _ctx: any,
  action: string,
  args: Record<string, string | undefined> = {},
) {
  return browserRequest(action, args);
}