import * as ts from "typescript";
import { Range, window, workspace } from "vscode";
import {parse} from "editorconfig";

export const COMMAND_NAME = "extension.breaker";

/**
 * TODO:
 * - .editorconfig reader?
 *   - tabs or spaces
 *   - indent level
 */

/**
 * Types
 * NamedImports (elements): NodeArray
 * ArrowFunction (parameters): FunctionLikeDeclarationBase, SignatureDeclarationBase, NodeArray
 * CallExpression (arguments): NodeArray
 */
const findNextParentWithChildrenList = (node: ts.Node): ts.Node | null => {
    // TODO: Extend this list
    switch (node.kind) {
        // elements
        case ts.SyntaxKind.NamedImports:
            return node;
        // parameters
        case ts.SyntaxKind.ArrowFunction:
        case ts.SyntaxKind.FunctionType:
        case ts.SyntaxKind.FunctionDeclaration:
            return node;
        // arguments
        case ts.SyntaxKind.CallExpression:
            return node;
    }

    if (node.parent) {
        return findNextParentWithChildrenList(node.parent);
    }

    return null;
};
const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });

const breakNamedImports = (node: ts.NamedImports, context: Context): string => {
    const result = printer.printNode(ts.EmitHint.Unspecified, node, context.sourceFile);

    return result
        .replace(/,/g, ",\n")
        .replace('{', "{\n")
        // TODO: Trailing comma support
        .replace('}', "\n}");
};

const breakNode = (node: ts.Node, context: Context): string => {
    switch (node.kind) {
        case ts.SyntaxKind.NamedImports:
            return breakNamedImports(node as ts.NamedImports, context);
    }

    return "";
};

interface Config {
    indentStyle: "tab" | "space" | "unset"
    indentSize: number | "tab" | "unset"
}

interface Context {
    config: Config
    sourceFile: ts.SourceFile
}

const loadEditorConfig = async (): Promise<Config> => {
    try {
        const cfg = await parse(".editorconfig");
        return {
            indentStyle: cfg.indent_style || "space",
            indentSize: cfg.indent_size || 4
        };
    } catch (err) {
        return {
            indentStyle: "space",
            indentSize: 4,
        };
    }
};

export const breakerCommand = async () => {
    const editor = window.activeTextEditor;

    if (!editor) {
        window.showInformationMessage(
            "Please only execute the command with an active file"
        );
        return;
    }
    const { document } = editor;


    const config = await loadEditorConfig();


    const sourceFile = ts.createSourceFile("x.ts", editor.document.getText(), ts.ScriptTarget.ESNext, true);
    const offset = editor.document.offsetAt(editor.selection.active);
    let selectedNode: ts.Node | null = null;

    const traverse = (node: ts.Node) => {
        // We've gone too far
        if (node.pos === null || node.pos > offset || node.end < offset) {
            return;
        }

        // We've reached a node below
        if (selectedNode === null || node.pos > selectedNode.pos) {
            selectedNode = node;
        }

        ts.forEachChild(node, traverse);
    };

    traverse(sourceFile);

    if (!selectedNode) {
        window.showInformationMessage("Unexpected error");
        return;
    }

    const parentWithChildList = findNextParentWithChildrenList(selectedNode);

    if (!parentWithChildList) {
        window.showInformationMessage("Unexpected error");
        return;
    }

    await editor.edit(
        editBuilder => {
            editBuilder.replace(
                new Range(
                    document.positionAt(parentWithChildList.pos + 1),
                    document.positionAt(parentWithChildList.end)
                ),
                breakNode(parentWithChildList, {sourceFile, config})
            );
        },
        { undoStopBefore: false, undoStopAfter: false }
    );

    // TODO: Make optional
    await editor.document.save();
};