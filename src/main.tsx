import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { isCapacitorBuild } from "@/lib/platform";

createRoot(document.getElementById("root")!).render(<App />);

if (!isCapacitorBuild()) {
  const pwaModule = "virtual:pwa-register";
  import(/* @vite-ignore */ pwaModule)
    .then((m: { registerSW: (opts: { immediate: boolean }) => void }) => {
      m.registerSW({ immediate: true });
    })
    .catch(() => undefined);
}
