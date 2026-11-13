import { useEffect, useState } from "react";
import { Child } from "./components/Child";
import { Parent } from "./components/Parent";
import { PrintSheet } from "./components/PrintSheet";
import { flushSave, isLoaded, loadState, useAppState } from "./store";

export default function App() {
  const app = useAppState();
  const [ready, setReady] = useState(isLoaded());
  const [parent, setParent] = useState(false);

  useEffect(() => {
    if (!ready) void loadState().then(() => setReady(true));
  }, [ready]);

  // Save immediately when the window is hidden or closed.
  useEffect(() => {
    const onHide = () => void flushSave();
    window.addEventListener("beforeunload", onHide);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("beforeunload", onHide);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = app.settings.lang;
  }, [app.settings.lang]);

  if (!ready) return <div className="screen loading" />;

  return (
    <>
      <div className="app-root">
        {parent ? <Parent onExit={() => setParent(false)} /> : <Child onOpenParent={() => setParent(true)} />}
      </div>
      <PrintSheet />
    </>
  );
}
