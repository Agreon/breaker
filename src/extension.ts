import { commands, ExtensionContext, languages } from "vscode";
import { breakerCommand, COMMAND_NAME } from "./command";

export function activate(context: ExtensionContext) {

	context.subscriptions.push(
		commands.registerCommand(COMMAND_NAME, breakerCommand),
		// languages.registerCodeActionsProvider(["javascript","typescript"], )
	);


}
