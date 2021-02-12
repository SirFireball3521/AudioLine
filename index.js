const fs = require('fs');
const blessed = require('blessed');
const ytdl = require('ytdl-core');
const FfmpegCommand = require('fluent-ffmpeg');
const Audic = require('audic');

var screen = blessed.screen({
   smartCSR: true
});

let testSong = new Audic('songs/unravel.mp3');

testSong.play();
let playing = true
//input
screen.key(['p'], (ch, key) => {
   if(playing){
      testSong.pause();
   } else {
      testSong.play();
   }
   playing = !playing
});
screen.key(['escape'], () =>{
   return process.exit(0);
});

