import { useEffect } from "react";

type MoveDir = "up" | "down" | "left" | "right";

export function useKeyboardControls(move: (dir: MoveDir) => void) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") move("up");
      else if (e.key === "ArrowDown" || e.key === "s" || e.key === "S") move("down");
      else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") move("left");
      else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") move("right");
      e.preventDefault();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [move]);
}
