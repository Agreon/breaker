import * as ts from "typescript";
import { Range, window } from "vscode";
import { createContext } from "./create-context";
import { getListToBreak } from "./parsing";
import { getListReplacement } from "./replacement";

export const COMMAND_NAME = "extension.breaker";

export const breakerCommand = async () => {
    const editor = window.activeTextEditor;
    if (!editor) {
        window.showInformationMessage("Please only execute the command with an active file");
        return;
    }

    const sourceFile = ts.createSourceFile("x.ts", editor.document.getText(), ts.ScriptTarget.ESNext, true);
    const offset = editor.document.offsetAt(editor.selection.active);

    const listToBreak = getListToBreak(sourceFile, offset);
    if (!listToBreak) {
        window.showErrorMessage("No list to break found");
        return;
    }

    const replacement = getListReplacement(listToBreak,await createContext(sourceFile));

    await editor.edit(
        editBuilder => {
            editBuilder.replace(
                new Range(
                    editor.document.positionAt(replacement.from),
                    editor.document.positionAt(replacement.to)
                ),
                replacement.value
            );
        },
    );

    // TODO: Make optional
    // await editor.document.save();
};