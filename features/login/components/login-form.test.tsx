import { screen } from "@testing-library/react";
import { LoginForm } from "@/features/login/components/login-form";
import { renderWithProviders } from "@/tests/render-with-providers";
import { expect, test, vi } from "vitest";

// Plain jsdom has no Next router context and login-form calls useRouter
// unconditionally — stub it at the module boundary.
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
}));

test("LoginForm renders email, password fields and submit button", () => {
  renderWithProviders(<LoginForm />);

  expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /login/i }),
  ).toBeInTheDocument();
});
