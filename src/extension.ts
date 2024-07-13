// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

const ENDPOINT = "https://insta-presence.onrender.com"; // http://127.0.0.1:6969

const outputChannel = vscode.window.createOutputChannel("My Extension");

async function updateNote(username: string, newNote: string, params: {password: string, useStoredSession: boolean}) {
	const response = await fetch(`${ENDPOINT}/update/${username}/${newNote}`, {
		method: "POST",
		body: JSON.stringify(params),
		headers: {
			'Content-Type': 'application/json'
		},
	}); 

	const data: any = await response.json(); 
	console.log('First data below: '); 
	console.log(data); 
	console.log("First data below: "); 
	console.log(data);

	/** We will only be sending a message if it's required. That means if the request lead to some BS. */
	if (data?.message === 'login_required') {
		/** You need to login again. */
		return updateNote(username, newNote, {'useStoredSession': false, 'password': params.password}); 
	} 
	else if (data?.message === "please_wait") {
		return 1; 
	} 
	else if (data?.message === "length_exceeded") {
		return 2;
	}
	else if (data?.message === "credential_error") {
		return 3; 
	} 
	else if (data?.message === "challenge_required") {
		return 4; 
	}
	else {
		return 0; // success base case. 
	}
}

function emojiNote(currentNote: string, truncatedFN: string) {
	
	const file_extension_to_emoji : {[key : string]: string} = {
		".py": "🐍",
		".js": "🌐",
		".java": "☕",
		".c": "🔧",
		".cpp": "🚀",
		".cs": "🎸",
		".rb": "💎",
		".swift": "🦅",
		".go": "🏎️",
		".php": "🐘",
		".html": "📄",
		".css": "🎨",
		".sql": "🗃️",
		".r": "📊",
		".kt": "🚀",
		".ts": "🔒",
		".tsx": "⚛️", 
		".jsx": "⚛️", 
		".pl": "🪄",
		".scala": "🔥",
		".rs": "🦀",
		".m": "📐",
		".sh": "🖥️",
		".hs": "🔮",
		".dart": "🎯",
		".lua": "🌕", 
		".env": "🤫", 
		".gitignore": "🤫", 
		".md": "📄",
		".json": "🛢"
	  }; 

	if (truncatedFN.indexOf(".") !== -1) {
		const fileExt = truncatedFN.slice(truncatedFN.indexOf("."), truncatedFN.length); 
		if (!(fileExt in file_extension_to_emoji)) {return currentNote;}
		return `${file_extension_to_emoji[fileExt]} ${currentNote}`;
	} 

	return currentNote; 
}

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
		title: "Instagram Password"
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

	updateUsername(context, true).then(() => {
		updatePassword(context, true); // then run this shit.
	}); 

	/** Instantiate the status bar window. */
	const statusBar = vscode.window.createStatusBarItem("Status Bar", 1, 2); 
	statusBar.accessibilityInformation = {label: "Status bar for the instagram presence extension.", role: "Clicking on this status bar will trigger the extension to be activated or deactivated."}; 
	statusBar.backgroundColor = new vscode.ThemeColor("green");
	statusBar.text = "$(circle-slash) Disconnected from Instagram";
	statusBar.tooltip = "insta-presence extension status";
	statusBar.show(); 
	console.log(`showing status bar: ${statusBar}`);

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

		// console.log(event);
		if (event?.document === undefined) {
			return; 
		}

		const fileName = event.document.fileName; 
		const truncatedFN = fileName.slice(fileName.lastIndexOf("/") + 1, fileName.length); 

		if (event?.document.fileName !== null) {
			// this is a fricking real thing.
			console.log("adding this new note."); 
			
			const newNote = emojiNote(`Editing ${truncatedFN} on Visual Studio Code`, truncatedFN); 

			if (newNote.length > 60) {
				vscode.window.showInformationMessage('Current file name too large to be displayed in an Instagram note.'); 
				return; // there's no point of even sending an API request. 
			}
		
			updateNote(USERNAME, newNote, {'useStoredSession': true, 'password': PASSWORD}).then((finalResult) => {
				/** based on the final result of how everything went, then decide to update the function. */
				console.log(finalResult.toString()); 

				if (finalResult === 1) {
					/** show a vscode information window. */
					vscode.window.showInformationMessage('Please wait a few more minutes before restarting the extension.'); 
				}

				else if (finalResult === 3) {
					/** show an error message. */
					vscode.window.showErrorMessage('Your current credentials are misconfigured. Please run the command to re-enter your username and password in VSCode.')
				}

				else if (finalResult === 4) {
					/** Please login to instagram. */
					vscode.window.showErrorMessage("Please login to Instagram and complete their online challenge. Then the extension will start to work."); 
				}
				
				/** If successful, add the interval tracking. */
				else if (finalResult === 0  ) {
					statusBar.text = "$(pencil) Connected to Instagram"; 
					if ((newNote.length + "for the last 1 minutes".length) <= 60) {
						let mins = 0; 
						interval = setInterval(() => {
							mins += 1; 
							
							const newNote = emojiNote(`Editing ${truncatedFN} for the last ${mins} minutes on Visual Studio Code`, truncatedFN); 
							console.log(`updating the note: ${newNote}`); 
							updateNote(USERNAME, newNote, {'useStoredSession': true, 'password': PASSWORD}); 

						}, 1000 * 60); 
					}
				}
			}); 
		}
	}); 

	context.subscriptions.push(disposable);
	context.subscriptions.push(credentialsReset); 
}


export function deactivate() {
	console.log("WE DEACTIVATING....");
	// const USERNAME = context.globalState.get("USERNAME"); 
	// if (USERNAME) {
	// 	fetch(`${ENDPOINT}/${USERNAME}`, {
	// 		method: "DELETE"
	// 	});
	// }
}
