// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { changeNote } from './helpers';
const ENDPOINT = "https://insta-presence.onrender.com";

const outputChannel = vscode.window.createOutputChannel("My Extension");

function updateUsername(context: vscode.ExtensionContext, resolveIfExists: boolean) {
	if (resolveIfExists) {
		const potentialUsername = context.globalState.get("USERNAME"); 
		if (typeof(potentialUsername) === "string" && potentialUsername.length > 1) {
			return new Promise(resolve => {setTimeout(resolve, 1);}); 
		}
	}

	return vscode.window.showInputBox({
		prompt: "Please type in your instagram username.", 
		placeHolder: "<your instagram username>", 
		title: "Instagram Username"
	}).then((username: string | undefined) => {
		if (username !== undefined) {context.globalState.update("USERNAME", username);}
	}); 
}

function updatePassword(context: vscode.ExtensionContext, resolveIfExists: boolean) {
	if (resolveIfExists) {
		const potentialPassword = context.globalState.get("PASSWORD"); 
		if (typeof(potentialPassword) === "string" && potentialPassword.length > 1) {
			return new Promise(resolve => {setTimeout(resolve, 1);}); 
		}
	}

	return vscode.window.showInputBox({
		prompt: "Please type in your instagram password.", 
		placeHolder: "<your instagram password>", 
		title: "Instagram Password", 
		password: true
	}).then((username: string | undefined) => {
		if (username !== undefined) {context.globalState.update("PASSWORD", username);}
	}); 
}

export function activate(context: vscode.ExtensionContext) {
	console.log("activated extensions ....");
	console.log("Extension activated."); 

	const disposable = vscode.commands.registerCommand('insta-presence.start', () => {
		vscode.window.showInformationMessage('Starting VSCode Extension for Instagram Presence.');
	});

	const credentialsReset = vscode.commands.registerCommand('insta-presence.credentialsReset', () => {
		updateUsername(context, false).then(() => {
			updatePassword(context, false); // then run this shit.
		}); 
	}); 

	let interval: any; 

	/** 
	 * On activation, we need to check if the username and password are stored in vscode extension storage. 
	 */

	console.log(context.globalState.keys.toString()); 
	const USERNAME = context.globalState.get("USERNAME"); 
	const PASSWORD = context.globalState.get("PASSWORD"); 

	console.log(`username: ${USERNAME}`); 
	console.log(`password: ${PASSWORD}`);

	/** Instantiate the status bar window. */
	const statusBar = vscode.window.createStatusBarItem("Status Bar", 1, 2); 
	statusBar.accessibilityInformation = {label: "Status bar for the instagram presence extension.", role: "Clicking on this status bar will trigger the extension to be activated or deactivated."}; 
	statusBar.backgroundColor = new vscode.ThemeColor("green");
	statusBar.text = "$(circle-slash) Disconnected from Instagram";
	statusBar.tooltip = "insta-presence extension status";
	statusBar.show(); 
	// console.log(`showing status bar: ${statusBar}`);
	
	updateUsername(context, true).then(() => {
		updatePassword(context, true).then(() => {
			const USERNAME = context.globalState.get("USERNAME"); 
			const PASSWORD = context.globalState.get("PASSWORD"); 
			if (typeof(vscode.window.activeTextEditor?.document?.fileName) === "string") {
				// @ts-ignore
				changeNote(vscode.window.activeTextEditor.document.fileName, USERNAME, PASSWORD, ENDPOINT, statusBar, interval); 
			}
		})
	}); 

	vscode.window.onDidChangeActiveTextEditor((event) => {

		// every single time this is run, read the values from globalState. 
		const USERNAME = context.globalState.get("USERNAME"); 
		const PASSWORD = context.globalState.get("PASSWORD"); 

		console.log(`this is the found username: ${USERNAME}`); 
		console.log(`this is the found password: ${PASSWORD}`);

		if (typeof(USERNAME) !== "string" || typeof(PASSWORD) !== "string") {
			return; 
		}

		if (interval !== null) {
			console.log('Clearing this interval.'); 
			clearInterval(interval); // clear this interval 
		}

		if (typeof(event?.document?.fileName) === "string") {
			changeNote(event?.document.fileName, USERNAME, PASSWORD, ENDPOINT, statusBar, interval); 
		}
		
	}); 

	context.subscriptions.push(disposable);
	context.subscriptions.push(credentialsReset); 
}


export function deactivate(context: vscode.ExtensionContext) {
	console.log("WE DEACTIVATING....");
	const USERNAME = context.globalState.get("USERNAME"); 
	if (USERNAME) {
		fetch(`${ENDPOINT}/${USERNAME}`, {
			method: "DELETE"
		});
	}
}
