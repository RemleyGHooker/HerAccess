import { useEffect } from "react";

export default function EscapeButton() {
  const handleExit = () => {
    try {
      // Directly assign to window.location to force navigation in current tab
      window.location.assign("https://www.google.com/search?q=pro life");
    } catch (error) {
      console.error("Redirect failed:", error);
      // Fallback method
      window.location.href = "https://www.google.com";
    }
  };

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleExit();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, []);

  return (
    <button
      onClick={handleExit}
      className="fixed top-4 right-4 z-50 px-4 py-2 bg-pink-700 text-white rounded hover:bg-pink-800 transition-colors"
      style={{ visibility: "visible" }}
    >
      Escape
    </button>
  );
}