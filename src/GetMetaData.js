export function getTabId() {

  let tabId = sessionStorage.getItem("tabId");

  if (!tabId) {
    tabId = crypto.randomUUID();
    sessionStorage.setItem("tabId", tabId);
  }

  return tabId;
}