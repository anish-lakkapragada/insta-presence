from fastapi import FastAPI
from instagrapi import Client
from instagrapi.exceptions import LoginRequired, PleaseWaitFewMinutes, BadCredentials, BadPassword, UserError, UserNotFound, ChallengeRequired
from pydantic import BaseModel
from collections import defaultdict
import os

app = FastAPI()

USERNAMES_TO_CLIENTS = defaultdict()
USERNAMES_TO_LAST_NOTES = defaultdict()

def custom_hash(string):
    # Use a large prime number for the hash base
    hash_value = 5381
    for char in string:
        hash_value = ((hash_value << 5) + hash_value) + ord(char)  # hash_value * 33 + ord(char)
    return hash_value

@app.get("/")
async def root():
    return {"message": "Hello World"}

class BodyParams(BaseModel):
    useStoredSession: bool # if you should use instagrapi_settings.json
    password: str

@app.post("/update/{username}/{newNote}")
async def root(username: str ,newNote: str, params: BodyParams):
    print(params)
    print(params.useStoredSession)

    if len(newNote) > 60: 
        return {'message': 'length_exceeded'}

    global USERNAMES_TO_CLIENTS, USERNAMES_TO_LAST_NOTES 

    cl = None 
    if username in USERNAMES_TO_CLIENTS: 
        cl = USERNAMES_TO_CLIENTS[username]

    if not cl or not params.useStoredSession: 
        """This means that a re-login is required."""
        cl = Client() # don't login with current session data 
        if params.useStoredSession and os.path.isfile("instagrapi_settings.json"): 
            print("loading settings.")
            cl.load_settings(f"{username}-{params.password}-instagrapi_settings.json") # load the local settings
        elif params.useStoredSession == False:
            print("not loading settings here.") 
        cl.login(username, params.password)
        cl.dump_settings(f"{username}-{params.password}-instagrapi_settings.json") # dumping the settings 
        USERNAMES_TO_CLIENTS[username] = cl # storing the cl. 

    try: 
        last_note = cl.create_note(newNote) # using the new note here.
        print('ending this process.')
        USERNAMES_TO_LAST_NOTES[username] = last_note
    except LoginRequired as e: 
        print(e)
        print("A Login is required.")
        return {'message': 'login_required'} # you need to login again.
    except PleaseWaitFewMinutes as e: 
        print(e)
        print("please wait a few minutes error.")
        return {'message': 'please_wait'}
    # all the exceptions here for not logging in correctly. 
    except (BadCredentials, BadPassword, UserNotFound) as e: 
        print(e)
        print("some credential is screwed.")
        return {'message': 'credential_error'}
    except ChallengeRequired as e: 
        print(e)
        print("a challenge is required ...")
        return {'message': 'challenge_required'}
    except Exception as e: 
        print(e)


@app.delete("/{username}")
async def clearNote(username: str): 
    global USERNAMES_TO_CLIENTS, USERNAMES_TO_LAST_NOTES
    last_note = USERNAMES_TO_LAST_NOTES[username] 
    cl = USERNAMES_TO_CLIENTS[username]

    if last_note and last_note.id: 
        cl.delete_note(last_note.id)




