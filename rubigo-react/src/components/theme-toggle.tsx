"use client";

import { useTheme } from "./theme-provider";
import { Button } from "./ui/button";

export function ThemeToggle() {
    const { resolvedTheme, setTheme, theme } = useTheme();

    const cycleTheme = () => {
        // Cycle: system -> light -> dark -> system
        if (theme === "system") {
            setTheme("light");
        } else if (theme === "light") {
            setTheme("dark");
        } else {
            setTheme("system");
        }
    };

    const icon = resolvedTheme === "dark" ? "🌙" : "☀️";
    const label = theme === "system" ? "Auto" : theme === "light" ? "Light" : "Dark";

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={cycleTheme}
            title={`Theme: ${label}`}
        >
            <span className="mr-1">{icon}</span>
            <span className="text-xs text-zinc-500">{label}</span>
        </Button>
    );
}
