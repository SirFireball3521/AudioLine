const fs = require('fs');
const readline = require('readline');
const colors = require('colors');
//const blessed = require('blessed');  //for gui, not used yet
//const ytdl = require('ytdl-core');  //for youtube downloading, not used yet
//const FfmpegCommand = require('fluent-ffmpeg'); //for youtube downloading, not used yet
const Audic = require('audic');
const rl = readline.createInterface({
   input: process.stdin,
   output: process.stdout
});



let currentSong = new Audic();

const helpMsg = `List of commands:
play <songname> | Plays the selected song. If another song is playing already, it stops that song.
pause           | Pauses the current song.
resume          | Resumes the current song
exit            | Turns off the program.
help            | Prints this message.`

console.log("Temporary CLI. Run 'help' to see a list of commands");
rl.prompt('>')
rl.on('close', () => process.exit(0))

rl.on('line', (input) => {
   input = input.split(' ');
   switch (input[0]) {
      case 'help':
         console.log(helpMsg); //see above, I din't want to write the whole thing here
         break;

      case 'play':

         currentSong.src = "songs/" + input[1] + ".mp3";
         currentSong.play();
         console.log("Now playing: " + input[1]);
         break;

      case 'pause':
         currentSong.pause();
         break;

      case 'resume':
         currentSong.play();
         break;

      default:
         console.log("Unexpected item in the bagging area");
         break;
   }
   rl.prompt('>');
})