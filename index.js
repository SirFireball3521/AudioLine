const fs = require('fs');
const blessed = require('blessed');
const ytdl = require('ytdl-core');
const FfmpegCommand = require('fluent-ffmpeg');
const { createAudio } = require('node-mp3-player');
const Audio = createAudio();

var screen = blessed.screen({
   smartCSR: true
});

//input
screen.key(['p'], (ch, key) => {
   testSong.stop();
});
screen.key(['escape'], () =>{
   return process.exit(0);
});

// (async () => {
//    const testSong = await Audio('songs/unravel.mp3');
//    await testSong.volume(0.5);
//    await testSong.play();
// })();
const testSong = Audio('songs/unravel.mp3');