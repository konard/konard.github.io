/** Use the owned, portal-based listbox just as a pointer user does. */
export async function chooseSelect(control, value) {
  await control.click();
  await control
    .page()
    .getByRole('option')
    .and(control.page().locator(`[data-value="${value}"]`))
    .click();
}
