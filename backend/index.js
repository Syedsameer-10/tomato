import "dotenv/config";

import app from "./app.js";

const PORT = process.env.PORT || process.env.BACKEND_PORT || 3001;

if (!process.env.VERCEL) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

export default app;
