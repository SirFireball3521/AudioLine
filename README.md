# AudioLine
A command line music player built in Node.js

Note that this is in beta, and many things either do not exist or are non-functional. If you have feature requests feel free to submit them.

# Installation
Dependencies: Node.js, npm.

Just clone the repository. The `songs` directory will be empty on download, you can add .mp3 files into it. See "Adding songs" for more info  .
# Usage

Enter the folder and run `node index.js`. (you can access the command line version by running `node index.js cli`, but some parts of this are currently broken)
I recommend using a fullscreen terminal for this.

Controls use either hjkl or arrow keys for movement.

In the program you will see 3 windows. From left to right they are the library, the main window, and the queue.

You can navigate between the 3 windows using the left/right arrow keys.
## Global buttons
The following buttons will work no matter which window you have selected.
* Space: Pauses and resumes the current song. If no song is playing, nothing happens.
* Tab: Toggles between viewing the queue of upcoming songs and the history.
* Q: Moves to previous song
* E: Moves to next song


## The Library
The library will show all songs you have in the program. If you have nothing there, then you don't have any songs and should see the "adding songs" section.

With the library box selected, you can select a song using the up/down arrows and press one of the following buttons:
* A: Adds the selected song to the end of the queue.
* S: Adds the selected song to the next position in the queue, shifting everything forwards.
* D: Plays the selected song immediately, moving the currently playing song to the history and preserving the queue. 

## The Main Window
The main window contains information about the current song. The following buttons work in the main box:
* Up/J: Increases the volume by 10%
* Down/K: Decreases the volume by 10%

## The Queue

The queue window contains your queue of upcoming songs, as well as your play history. You can switch between the two by pressing tab.

While looking at the queue of upcoming songs, you can select a song using the up/down arrows and press one of the following buttons:
* S: Skips to this song.
* X: Removes the song from the queue.

These do not work when viewing the history.


## Adding songs
Adding songs requires you to use the command line mode. 

Important: remove spaces from the file names.

First, move the MP3 files of whichever sonngs you want to add into the `songs` folder, then open command line mode and run `updatejson`.

### Renaming songs

This must be done through the json file for the moment. The key is the name you type when you using the play command in cli mode. The "name" property is the name displayed in the program (and this can contain spaces).

If you mess up the json, you can delete it and run `updatejson` again. 

## Removing songs from your library
Don't do this. If you really need to, then delete the MP3 and remove the entry in the `songs.json` file. 

`updatejson` **DOES NOT** remove deleted files.