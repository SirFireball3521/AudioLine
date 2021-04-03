# AudioLine
A command line music player built in Node.js

Still in very early beta, if you're seeing this I either sent you the link or you made a wrong turn.

## Installation
Dependencies: Node.js, npm

Just clone the repository
## Usage

Enter the folder and run `node index.js cli`. Running it without the cli option will do practically nothing, the gui is coming soon. 

This program has a temporary CLI at the moment. Upon running the program run `help` to see possible commands.

### Adding songs
To add songs, add the mp3 files to the `songs` directory, then run `updatejson` to add them into the json file. the song name will be the mp3 name minus the extension. This can be changed manually in the json file if you want.
