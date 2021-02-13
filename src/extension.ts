import { commands, ExtensionContext } from "vscode";
import { breakerCommand, COMMAND_NAME } from "./command";

export function activate(context: ExtensionContext) {
	context.subscriptions.push(
		commands.registerCommand(COMMAND_NAME, breakerCommand),
	);
}
