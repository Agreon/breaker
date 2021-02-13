import { parse } from "editorconfig";
import ts = require("typescript");

interface Config {
    indentStyle: "tab" | "space" | "unset"
    indentSize: number
    endOfLine: "lf" | "crlf" | "unset"
}

const loadEditorConfig = async (): Promise<Config> => {
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

export interface Context {
    sourceFile: ts.SourceFile
    printer: ts.Printer
    indentCharacter: string
    editorConfig: Config
}

export const createContext = async (sourceFile: ts.SourceFile): Promise<Context> => {
    const config = await loadEditorConfig();

    const indentCharacter = Array.from(Array(config.indentSize))
    .map(_i => config.indentStyle === "tab" ? "\t" : " ")
    .join("");

    const printer = ts.createPrinter({
        newLine: config.endOfLine === "lf"
            ? ts.NewLineKind.LineFeed
            : ts.NewLineKind.CarriageReturnLineFeed
    });

    return {
        indentCharacter,
        printer,
        sourceFile,
        editorConfig: config
    };
};