const fs = require('fs');
const readline = require('readline');
const colors = require('colors'); //green for expected/normal output, blue for unusual but intended output, red for errors.
const mp3Duration = require('mp3-duration')
//const blessed = require('blessed');  //for gui, not used yet
//const ytdl = require('ytdl-core');  //for youtube downloading, not used yet
//const FfmpegCommand = require('fluent-ffmpeg'); //for youtube downloading, not used yet
const Audic = require('audic');
const rl = readline.createInterface({
   input: process.stdin,
   output: process.stdout
});
try {
   var songs = JSON.parse(fs.readFileSync('songs.json', 'utf8'));
} catch (error) {
   console.info('Info: songs.json does not exist, creating songs.json. if you have songs in the songs folder, run updatejson to add them.')
   fs.writeFileSync('songs.json', '{\n  \n}');
   var songs = {}
}

let currentSong = new Audic();

const helpMsg = `List of commands:
play <songname> | Plays the selected song. If another song is playing already, it stops that song.
pause           | Pauses the current song.
resume          | Resumes the current song
exit            | Turns off the program.
help            | Prints this message.
queue <command> | See queue help. !!incomplete feature, don't use!!
updatejson      | Updates your library to include any mp3 files added to the songs directory`.green;

//Queue
let queue = {
   items: [],

   clear() {
      this.items.length = 0
   },
   next() {
      return this.items.shift()
   },
   add(song) {
      if (songs[song]) {
         this.items[this.items.length] = songs[song];
      } else {
         throw new Error("Song not found")
      }
   }
};



//User Input (cli mode)

console.log("Temporary CLI. Run 'help' to see a list of commands");
rl.prompt('>');
rl.on('close', () => process.exit(0))

rl.on('line', (input) => {

   input = input.split(' '); //split user input into multiple strings

   switch (input[0]) { //first argument
      case 'help':
         console.log(helpMsg); //see above, I din't want to write the whole thing here
         break;
      case 'play':
         queue.clear();
         playSong(input[1]);
         break;
      case 'pause':
         currentSong.pause();
         break;
      case 'resume':
         currentSong.play();
         break;
      case 'queue':
         switch (input[1]) {
            case 'add':
               queue.add(input[1]);
               console.log(queue.items);
               break;
            case 'next':
               playSong(queue.next());
               break;
         }
         break;
      case 'updatejson':
         fixJson(true);
         break;
      case 'exit':
         process.exit(0);
      default:
         console.log("Unexpected item in the bagging area");
         break;
   }
   rl.prompt('>');
})

function playSong(sName) {
   currentSong.pause()
   if (songs[sName]) {
      currentSong = new Audic(songs[sName].path);
      console.log('song set to:' + songs[sName].path);
   } else {
      console.error('Song does not exist'.red);
   }
   currentSong.play();
}

function fixJson(ignoreExisting) {
   let newSongs = fs.readdirSync('songs').sort(); //returns all the in the songs directory, sorted alphabetically

   if (ignoreExisting) {
      //looks for mp3 files in the songs directory and add their data to the songs.json file
      let loadedSongs = [] //songs that are already loaded. Not loading them (which includes finding the duration) should save time.
      let i = 0;
      for (song in songs) {
         loadedSongs[i] = songs[song].path; //fills array with all the paths that can be ignored.
         loadedSongs[i] = loadedSongs[i].substring(6); // removes 'songs/' from the beginning of the path.
         i++;
      }
      //remove loaded songs from new songs.
      for (let i = 0; i < newSongs.length; i++) {
         for (let j = 0; j < loadedSongs.length; j++) {
            if (newSongs[i] === loadedSongs[j]) {
               newSongs.splice(i, 1) //if the song is already loaded, remove it from newsongs
               i--; //to correct for the array being shifted
            }
         }
      }
   }


   if (newSongs.length == 0) {
      console.log('No songs to add'.blue);
      return;
   } else {
      (async () => {
         for (song in newSongs) {
            song = newSongs[song].substring(0, newSongs[song].length - 4); //remove '.mp3'
            songs[song] = {
               path: `songs/${song}.mp3`,
               duration: await mp3Duration(`songs/${song}.mp3`)
            }
         }
         let songsString = JSON.stringify(songs, null, 3);
         fs.writeFileSync('songs.json', songsString);
      })();
   }
   console.log(`Added: ${newSongs}`.blue)
}