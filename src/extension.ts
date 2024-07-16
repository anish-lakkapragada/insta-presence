// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { changeNote, showLoadingProgress, validUsername, validPassword } from './helpers';
const ENDPOINT =  "https://insta-presence.onrender.com"; // "http://127.0.0.1:6969";

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
		vscode.window.showInformationMessage(`Starting VSCode Extension for Instagram Presence. Username: ${context.globalState.get("USERNAME")} and password: ${context.globalState.get("PASSWORD")} and enablement: ${context.globalState.get("ENABLEMENT_STATUS")}`);
	});

	const credentialsReset = vscode.commands.registerCommand('insta-presence.credentialsReset', () => {
		updateUsername(context, false).then(() => {
			updatePassword(context, false).then(() => {
				vscode.window.showInformationMessage('It can take up to a minute to re-connect to Instagram after changing your username and/or password.'); 
			}); 
		}); 
	});
	
	const toggleEnablement = vscode.commands.registerCommand('insta-presence.toggleEnablement', () => {
		const enablement = context.globalState.get("ENABLEMENT_STATUS"); 
		if (enablement === "TRUE") {
			context.globalState.update("ENABLEMENT_STATUS", "FALSE");
			// send this 
			fetch(`${ENDPOINT}/${USERNAME}`, {
				method: "DELETE"
			}).then((response) => {
				if (response.ok) {statusBar.text = "$(refresh) Reconnect to Instagram Notes";} 
			}); 
		}
		
		else if (enablement === "FALSE") {
			context.globalState.update("ENABLEMENT_STATUS", "TRUE");
			statusBar.text = "$(check) Instagram Notes Enabled";
			if (typeof(vscode.window.activeTextEditor?.document?.fileName) === "string" && validUsername(context) && validPassword(context)) {
				// @ts-ignore
				changeNote(vscode.window.activeTextEditor.document.fileName, context.globalState.get("USERNAME"), context.globalState.get("PASSWORD"), ENDPOINT, statusBar, interval);
			}
		}

		else if (typeof(enablement) !== "string") {context.globalState.update("ENABLEMENT_STATUS", "TRUE");}
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
	statusBar.tooltip = "Enable/Disable insta-presence";
	statusBar.command = "insta-presence.toggleEnablement"; 
	statusBar.show(); 
	// console.log(`showing status bar: ${statusBar}`);
	
	const prevUSERNAME = context.globalState.get("USERNAME"); 
	const prevPASSWORD = context.globalState.get("PASSWORD");
	updateUsername(context, true).then(() => {
		updatePassword(context, true).then(() => {
			const USERNAME = context.globalState.get("USERNAME"); 
			const PASSWORD = context.globalState.get("PASSWORD");
			/** set to enabled if enabled **/ 
			const ENABLEMENT = context.globalState.get("ENABLEMENT_STATUS"); 
			if (typeof(ENABLEMENT) !== "string") {
				context.globalState.update("ENABLEMENT_STATUS", "TRUE"); 
			}

			if (typeof(vscode.window.activeTextEditor?.document?.fileName) === "string" && context.globalState.get("ENABLEMENT_STATUS") === "TRUE") {
				// @ts-ignore
				changeNote(vscode.window.activeTextEditor.document.fileName, USERNAME, PASSWORD, ENDPOINT, statusBar, interval); 
				statusBar.text = "$(loading~spin) Connecting to Instagram"; // add the loading bar.
				// now use a progress window to show that there is some connectivity. the text should differ based on if the username/password has changed. 
				showLoadingProgress(prevUSERNAME === USERNAME && prevPASSWORD === PASSWORD ? "Connecting to Instagram." : 
					"It can take up to a minute to connect to Instagram after updating your password.", 
					statusBar
				).then((successful: boolean) => {
					if (!successful) {
						vscode.window.showInformationMessage('It is taking longer than normal to connect to Instagram. If this issue persists, please email anish.lakkapragada@yale.edu for assistance.'); 
						// change the statusBar text  
						context.globalState.update("ENABLEMENT_STATUS", "FALSE");
						statusBar.text = "$(refresh) Reconnect to Instagram Notes";
					}
				}); 
			}
		});
	}); 

	// vscode.window.onDidChangeWindowState((windowState) => {
	// 	// if not focused, straight up clear the note. 
	// 	if (!windowState.focused) {
	// 		fetch(`${ENDPOINT}/${USERNAME}`, {
	// 			method: "DELETE"
	// 		});
	// 	}
	// }); 

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

		if (typeof(event?.document?.fileName) === "string" && context.globalState.get("ENABLEMENT_STATUS") === "TRUE") {
			console.log("running change note."); 
			changeNote(event?.document.fileName, USERNAME, PASSWORD, ENDPOINT, statusBar, interval); 
		}
		
	}); 

	context.subscriptions.push(disposable);
	context.subscriptions.push(credentialsReset); 
	context.subscriptions.push(toggleEnablement);
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
