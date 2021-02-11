import { parse } from "editorconfig";

export interface Config {
    indentStyle: "tab" | "space" | "unset"
    indentSize: number
    endOfLine: "lf" | "crlf" | "unset"
}

export const loadEditorConfig = async (): Promise<Config> => {
    try {
        const cfg = await parse(".editorconfig");
        const indentStyle = cfg.indent_style || "space";
        return {
            indentStyle,
            indentSize: typeof cfg.indent_size === "number"
                ? cfg.indent_size
                : indentStyle === "tab"
                    ? 1
                    : 4,
            endOfLine: cfg.end_of_line || "lf"
        };
    } catch (err) {
        return {
            indentStyle: "space",
            indentSize: 4,
            endOfLine: "lf"
        };
    }
};
