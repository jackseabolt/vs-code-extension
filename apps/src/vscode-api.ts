/**
 * There is no available @types/vscode
 * for front-end - this code allows us
 * get vsCode
 */
declare function acquireVsCodeApi(): {
  postMessage: (message: unknown) => void;
  getState?: () => unknown;
  setState?: (state: unknown) => void;
};

export const vscode = acquireVsCodeApi();
