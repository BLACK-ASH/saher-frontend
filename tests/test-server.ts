import { setupServer } from "msw/node";

// No default handlers — each test registers handlers inline via server.use()
// so fixtures live beside their assertions.
export const server = setupServer();
