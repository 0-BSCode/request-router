import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, expect, test, vi } from "vite-plus/test";
import { Route as Workspace } from "#/routes/index";
import { Route as Legacy } from "#/routes/app";
import { Route as Reference } from "#/routes/reference";
import { Route as SignIn } from "#/routes/sign-in";

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock("#/lib/session", () => ({ getSession }));
beforeEach(() => getSession.mockReset());

test("the root workspace rejects visitors without an authorized session", async () => {
  getSession.mockResolvedValue(null);
  await expect(Workspace.options.beforeLoad!({} as never)).rejects.toMatchObject({
    options: { to: "/sign-in" },
  });
});

test("the root workspace receives the authorized reviewer context", async () => {
  const user = { id: "reviewer", name: "Reviewer", email: "reviewer@example.test" };
  getSession.mockResolvedValue(user);
  await expect(Workspace.options.beforeLoad!({} as never)).resolves.toEqual({ user });
  expect(Workspace.options.component).toBeTypeOf("function");
});

test("the legacy route redirects to root and renders no duplicate workspace", () => {
  expect(() => Legacy.options.beforeLoad!({} as never)).toThrow(
    expect.objectContaining({ options: expect.objectContaining({ to: "/", replace: true }) }),
  );
  expect(Legacy.options.component).toBeUndefined();
});

test("sign-in remains accessible without a session, preventing a redirect loop", async () => {
  getSession.mockResolvedValue(null);
  await expect(SignIn.options.beforeLoad!({} as never)).resolves.toBeUndefined();
});

test("sign-in sends authorized reviewers to the root workspace", async () => {
  getSession.mockResolvedValue({ id: "reviewer" });
  await expect(SignIn.options.beforeLoad!({} as never)).rejects.toMatchObject({
    options: { to: "/", replace: true },
  });
});

test("the reference page rejects visitors without an authorized session", async () => {
  getSession.mockResolvedValue(null);
  await expect(Reference.options.beforeLoad!({} as never)).rejects.toMatchObject({
    options: { to: "/sign-in" },
  });
});

test("the reference page shows the static API reference to authorized reviewers", async () => {
  const user = { id: "reviewer" };
  getSession.mockResolvedValue(user);
  await expect(Reference.options.beforeLoad!({} as never)).resolves.toEqual({ user });
  const html = renderToStaticMarkup(createElement(Reference.options.component!));
  expect(html).toContain("POST /api/mock/tasks");
  expect(html).not.toContain("Process message");
});

test("the root workspace renders only the tester", () => {
  const html = renderToStaticMarkup(createElement(Workspace.options.component!));
  expect(html).toContain("Process message");
  expect(html).not.toContain("/api/mock/tasks");
  expect(html).not.toContain('role="tab"');
});
