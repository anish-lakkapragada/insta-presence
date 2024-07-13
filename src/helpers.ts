import * as vscode from 'vscode';

async function updateNote(username: string, newNote: string, params: {password: string, useStoredSession: boolean}, ENDPOINT: string) {
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
		return updateNote(username, newNote, {'useStoredSession': false, 'password': params.password}, ENDPOINT); 
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

export function changeNote(fileName: string, USERNAME: string, PASSWORD: string, ENDPOINT: string, statusBar: vscode.StatusBarItem, interval: any) {
    const truncatedFN = fileName.slice(fileName.lastIndexOf("/") + 1, fileName.length); 

    if (fileName) {
        // this is a fricking real thing.
        console.log("adding this new note."); 
        
        const newNote = emojiNote(`Editing ${truncatedFN} on Visual Studio Code`, truncatedFN); 

        if (newNote.length > 60) {
            vscode.window.showInformationMessage('Current file name too large to be displayed in an Instagram note.'); 
            return; // there's no point of even sending an API request. 
        }
    
        updateNote(USERNAME, newNote, {'useStoredSession': true, 'password': PASSWORD}, ENDPOINT).then((finalResult) => {
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
                        updateNote(USERNAME, newNote, {'useStoredSession': true, 'password': PASSWORD}, ENDPOINT); 

                    }, 1000 * 60); 
                }
            }
        }); 
    }



}