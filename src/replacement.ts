import * as ts from "typescript";
import { Context } from "./create-context";

export interface Replacement {
    from: number;
    to: number;
    value: string;
}

const calculateIndentCountOfLine = (elements: ts.NodeArray<ts.Node>, { sourceFile, editorConfig }: Context) => {
    const { line } = sourceFile.getLineAndCharacterOfPosition(elements.pos);

    const fullLine = sourceFile.text.split("\n")[line];
    const indexOfFirstChar = fullLine.indexOf(fullLine.trim()[0]);

    const indentSize = editorConfig.indentSize;
    return Math.floor(indexOfFirstChar / indentSize);
};

/**
 * TODO:
 * - support for non trailing comma
 */
const replaceList = (elements: ts.NodeArray<ts.Node>, context: Context): Replacement => {
    const { printer, indentCharacter, sourceFile } = context;

    const indentCount = calculateIndentCountOfLine(elements, context);
    const indentOfElements = Array.from(Array(indentCount + 1)).map(_i => indentCharacter).join('');

    const replacement = elements
        .map(parameter => printer.printNode(ts.EmitHint.Unspecified, parameter, sourceFile))
        .map(parameter => `${indentOfElements}${parameter},\n`)
        .join("");

    const indentOfFollowingLine = Array.from(Array(indentCount)).map(_i => indentCharacter).join('');

    return {
        from: elements.pos,
        to: elements.end,
        value: `\n${replacement}${indentOfFollowingLine}`
    };
};

export const getListReplacement = (node: ts.Node, context: Context): Replacement => {
    switch (node.kind) {
        case ts.SyntaxKind.NamedImports:
        case ts.SyntaxKind.NamedExports:
        case ts.SyntaxKind.ObjectBindingPattern:
            const parent = (node as ts.NamedImports);
            // To trim possible whitespace at the end of the list.
            const trimEnd = (node.end - parent.elements.end - 1) || 0;
            const replacement = replaceList(parent.elements, context);

            return {
                ...replacement,
                to: replacement.to + trimEnd
            };
        case ts.SyntaxKind.ArrowFunction:
        case ts.SyntaxKind.FunctionType:
        case ts.SyntaxKind.FunctionDeclaration:
        case ts.SyntaxKind.MethodDeclaration:
        case ts.SyntaxKind.MethodSignature:
        case ts.SyntaxKind.Constructor:
            return replaceList((node as ts.SignatureDeclarationBase).parameters, context);
        case ts.SyntaxKind.CallExpression:
            return replaceList((node as ts.CallExpression).arguments, context);
        case ts.SyntaxKind.ObjectLiteralExpression:
            return replaceList((node as ts.ObjectLiteralExpression).properties, context);
        case ts.SyntaxKind.ArrayLiteralExpression:
            return replaceList((node as ts.ArrayLiteralExpression).elements, context);
    }

    throw new Error("Should never happen");
};
