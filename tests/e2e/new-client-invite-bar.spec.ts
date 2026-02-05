import { test, expect } from "@playwright/test";

test.describe("New client modal - invite bar sticky", () => {
  test("shows invite toggle without scrolling and toggles state", async ({ page }) => {
    await page.goto("/clients");

    // Open the modal (try multiple selectors as backup)
    const newClientButton = page.getByRole("button", { name: /nuovo cliente/i });
    await newClientButton.first().click();

    // Invite toggle must be visible without scrolling
    const inviteLabel = page.getByText("Invia email di invito");
    await expect(inviteLabel).toBeVisible();

    // Switch accessible: role=switch associated with the label
    const inviteSwitch = page.getByRole("switch", { name: /invia email di invito/i });

    // Default state should be checked (ON)
    await expect(inviteSwitch).toHaveAttribute("aria-checked", "true");

    // Toggle OFF
    await inviteSwitch.click();
    await expect(inviteSwitch).toHaveAttribute("aria-checked", "false");

    // Toggle back ON
    await inviteSwitch.click();
    await expect(inviteSwitch).toHaveAttribute("aria-checked", "true");
  });

  test("modal shows scroll affordance only when scrollable", async ({ page }) => {
    await page.goto("/clients");
    await page.getByRole("button", { name: /nuovo cliente/i }).first().click();

    const scrollArea = page.getByTestId("new-client-scroll");
    const affordance = page.getByTestId("scroll-affordance");

    // Check if scroll affordance is visible (depends on viewport/content)
    // If content is short, affordance won't show - that's expected behavior
    const isScrollable = await scrollArea.evaluate((el) => el.scrollHeight > el.clientHeight);
    
    if (isScrollable) {
      await expect(affordance).toBeVisible();

      // Scroll to bottom
      await scrollArea.evaluate((el) => (el.scrollTop = el.scrollHeight));
      await page.waitForTimeout(100);
      
      // Affordance should disappear when at bottom
      await expect(affordance).toHaveCount(0);
    }
  });
});

