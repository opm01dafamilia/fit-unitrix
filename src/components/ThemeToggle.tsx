import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const isDark = theme !== "light";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center gap-2 px-4 py-2 rounded-full border border-border/50 bg-secondary/60 backdrop-blur-sm transition-all hover:bg-secondary/80 active:scale-[0.97]"
    >
      {isDark ? (
        <>
          <Sun className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-foreground">Modo Claro</span>
        </>
      ) : (
        <>
          <Moon className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold text-foreground">Modo Escuro</span>
        </>
      )}
    </button>
  );
};

export default ThemeToggle;
