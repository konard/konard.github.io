/** Address persistence may fail (quota, inactive document); UI state must survive. */
export function replaceAddress(url) {
  try {
    window.history.replaceState(window.history.state, '', url);
    return null;
  } catch (error) {
    return error;
  }
}
