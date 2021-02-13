import * as ts from "typescript";

const findSelectedNode = (sourceFile: ts.SourceFile, offset: number) => {
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

    return selectedNode;
};

const findNextParentWithList = (node: ts.Node): ts.Node | null => {
    switch (node.kind) {
        case ts.SyntaxKind.NamedImports:
        case ts.SyntaxKind.NamedExports:
        case ts.SyntaxKind.ObjectBindingPattern:
        case ts.SyntaxKind.ArrowFunction:
        case ts.SyntaxKind.FunctionType:
        case ts.SyntaxKind.FunctionDeclaration:
        case ts.SyntaxKind.MethodDeclaration:
        case ts.SyntaxKind.MethodSignature:
        case ts.SyntaxKind.Constructor:
        case ts.SyntaxKind.CallExpression:
        case ts.SyntaxKind.ObjectLiteralExpression:
        case ts.SyntaxKind.ArrayLiteralExpression:
            return node;
    }

    if (node.parent) {
        return findNextParentWithList(node.parent);
    }

    return null;
};

export const getListToBreak = (sourceFile: ts.SourceFile, offset: number): ts.Node | null => {
    const selectedNode = findSelectedNode(sourceFile, offset);
    if (!selectedNode) {
        return null;
    }

    return findNextParentWithList(selectedNode);
};