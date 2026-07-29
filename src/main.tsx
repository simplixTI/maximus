import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { isCapacitorBuild } from "@/lib/platform";

createRoot(document.getElementById("root")!).render(<App />);

if (!isCapacitorBuild()) {
  // Direct string literal (no @vite-ignore) so Vite resolves the virtual
  // module at build time. Using a variable + @vite-ignore left the browser
  // trying to GET "virtual:pwa-register" as a literal URL, which failed CORS.
  import("virtual:pwa-register")
    .then((m) => {
      m.registerSW({ immediate: true });
    })
    .catch(() => undefined);
}
