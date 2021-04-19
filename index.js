const fs = require('fs');
const readline = require('readline'); //used in CLI mode only
const colors = require('colors'); //green for expected/normal output, blue for unusual but intended output, red for errors.
const mp3Duration = require('mp3-duration')
const blessed = require('@blessed/neo-blessed');
//const ytdl = require('ytdl-core');  //for youtube downloading, not used yet
//const FfmpegCommand = require('fluent-ffmpeg'); //for youtube downloading, not used yet
const Audic = require('audic');
const cfonts = require('cfonts'); //for fancy song titles, not used yet
const {
   clearInterval
} = require('timers');

try {
   var songs = JSON.parse(fs.readFileSync('songs.json', 'utf8')); //load songs json into variable
} catch (error) {
   console.info('Info: songs.json does not exist, creating songs.json. if you have songs in the songs folder, run updatejson to add them.')
   fs.writeFileSync('songs.json', '{\n  \n}'); //add an empty object. if you don't do this, loading the json in the future will give an error
   var songs = {}
}
let currentSong = new Audic();

const helpMsg = `List of commands:
play <songname>   | Plays the selected song. If another song is playing already, it stops that song.
pause             | Pauses the current song.
resume            | Resumes the current song
exit              | Turns off the program.
help              | Prints this message.
queue <command>   | See queue help.
updatejson        | Updates your library to include any mp3 files added to the songs directory`.green;

const isCLI = (process.argv[2] === 'cli') //check for CLI mode
var currentVolume = 50; //0 - 100, as a percentage. Remember to divide by 100 for the audic.
var songBoxes = new Array(Object.keys(songs).length);
var songTime = 0; //the Audic currentTime is not consistent, so I'm using my own.
var pauseInc = false;
//Queue
let queue = {
   items: [], //item 0 is currently playing. 
   history: [],
   itemboxes: [],
   checkIntervalID: 0,
   completionCheck() {
      if (!pauseInc) {
         songTime++
         if(!isCLI)updateSongInfo();
         if (songTime >= queue.items[0].duration) {
            if (queue.items.length != 1) {
               if (isCLI) rl.write(`playing next song: ${queue.items[1].name}\n>`); //error is fine.
               playSong(queue.next(), false)
               songTime = 0;
            } else {
               currentSong.pause()
               queue.history.push(queue.items.shift())
               if (isCLI) {
                  console.log('queue complete')
               } else {
                  queue.draw()
                  renderCenter();
               }
               clearInterval(queue.checkIntervalID);
            }
         }
         if (!isCLI) screen.render();
      }
   },

   clear() {
      this.items.length = 0
   },
   next() {
      this.history.push(this.items.shift())
      return this.items[0].name //returns the 1st item in the shifted array
   },
   skip() {
      if (queue.items.length != 1) {
         if (isCLI) rl.write(`playing next song: ${queue.items[1].name}\n>`); //error is fine.
         playSong(queue.next(), false)
         songTime = 0;
      } else {
         if (isCLI) console.log('queue complete')
         currentSong.pause();
      }
   },
   add(song) {
      if (songs[song]) {
         this.items[this.items.length] = songs[song];
      } else {
         throw new Error("Song not found")
      }
   },
   draw() { //populates the queue box with the queue items

      let qbutton = blessed.box({ //show upcoming songs
         top: '0%',
         left: '0%',
         align: 'center',
         height: '0%+3',
         width: '50%-1',
         tags: true,
         content: `Queue`,
         border: {
            type: 'line',
         },
         style: {
            bg: !quMode ? 12 : 0,
            fg: !quMode ? 9 : 12,
            border: {
               bg: !quMode ? 12 : 0,
               fg: !quMode ? 0 : 12,
            }
         }
      });
      let histbutton = blessed.box({ //show history
         top: '0%',
         left: '50%-1',
         align: 'center',
         height: '0%+3',
         width: '50%',
         tags: true,
         content: `History`,
         border: {
            type: 'line',
         },
         style: {
            bg: quMode ? 12 : 0,
            fg: quMode ? 9 : 12,
            border: {
               bg: quMode ? 12 : 0,
               fg: quMode ? 0 : 12,
            }
         }
      });
      queueBox.children = []
      queue.itemboxes = []
      queueBox.append(qbutton)
      queueBox.append(histbutton)
      if (quMode) {
         for (let i = 0; i < queue.history.length; i++) {
            let yoff = (i * 3) + 3;
            queue.itemboxes[i] = blessed.box({
               border: {
                  type: 'line'
               },
               tags: true,
               align: 'left',
               top: yoff,
               left: '1',
               height: '0%+4',
               width: '100%-2',
               content: `${queue.history[i].name}
${'\033[32m'}Duration: ${Math.floor(queue.history[i].duration)}`,
               style: {
                  bg: 0,
                  fg: 3,
                  border: {
                     bg: 0,
                     fg: 11
                  },
                  focus: {
                     border: {
                        bg: 0,
                        fg: 3
                     }
                  }
               }
            })

            queueBox.append(queue.itemboxes[i]);
         }
      } else {
         for (let i = 1; i < queue.items.length; i++) { //starts at 1 because the zero-th item is currently playing.
            let yoff = ((i - 1) * 3) + 3;
            queue.itemboxes[i] = blessed.box({
               border: {
                  type: 'line'
               },
               tags: true,
               align: 'left',
               top: yoff,
               left: '1',
               height: '0%+4',
               width: '100%-2',
               //next line is long. Sorry.
               content: `${queue.items[i].name}
${'\033[32m'}Duration: ${Math.floor(queue.items[i].duration)}`,
               style: {
                  bg: 0,
                  fg: 3,
                  border: {
                     bg: 0,
                     fg: 11
                  },
                  focus: {
                     bold: true
                  }
               }
            })
            queueBox.append(queue.itemboxes[i]);
         }
      }
   }
};

var currentBox = 1;
var selectedElement = 0;
//var libMode = false //false for alphabetical song list, true for playlist view
var quMode = false //false to show upcoming songs in queue, true to show history

//User Input (cli mode)
if (isCLI) {
   const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
   });
   rl.on('close', () => process.exit(0))
   rl.write("Temporary CLI. Run 'help' to see a list of commands\n");
   rl.setPrompt('> ', 2);
   rl.prompt()

   rl.on('line', (input) => {

      input = input.split(' '); //split user input into multiple strings

      switch (input[0]) { //first argument
         case 'help':
            console.log(helpMsg); //see above, I din't want to write the whole thing here
            break;
         case 'play':
            pauseInc = false;
            playSong(input[1], true);
            break;
         case 'pause':
            pauseInc = true;
            currentSong.pause();
            break;
         case 'resume':
            pauseInc = false;
            currentSong.play();
            break;
         case 'queue':
            switch (input[1]) {
               case 'add':
                  queue.add(input[2]);
                  break;
               case 'next':
                  playSong(queue.next(), false);
                  break;
               case 'list':
                  console.log(queue.items);
                  break;
               case 'help':
                  console.log(`List of queue commands:
               queue add <song>  | Adds a song to the queue
               queue next        | Moves to the next song
               queue list        | Lists all the songs in the queue`)
            }
            break;
         case 'updatejson':
            fixJson((input[1] !== 'reset'));
            break;
         case 'exit':
            process.exit(0);
         default:
            console.log("Unexpected item in the bagging area");
            break;
      }
      rl.prompt();
   })
} else { //User Input (blessed mode) 

   //input
   process.stdin.removeAllListeners('data');
   var screen = blessed.screen({
      smartCSR: true,
      dockBorders: true,
   });
   screen.on('resize', () => {
      queue.draw();
      renderCenter();
      screen.render();
   })
   screen.title = 'AudioLine';
   screen.on('keypress', (ch, key) => {
      //Since there is no documentation for this, here's what's in the key object:
      switch (key.full) {
         //movement. hjkl because old vi hotkeys
         case 'C-c':
            return process.exit(0);
         case 'C-r':
            queue.draw();
            renderCenter();
            break;
         case 'left':
         case 'h':
            if (currentBox === 2) {
               screen.focused = centerBox;
               currentBox = 1;
               selectedElement = 0;
            } else {
               screen.focused = libraryBox
               currentBox = 0;
               selectedElement = -1
            }
            break;
         case 'up':
         case 'j':
            
            if (currentBox == 0) {
               selectedElement--
               selectedElement = Math.max(0, selectedElement)
               songBoxes[selectedElement].focus();
            } else if (currentBox == 2) {
               selectedElement--
               if(selectedElement === 0)queueBox.resetScroll()
               selectedElement = Math.max((quMode ? 0 : 1), selectedElement)
               queue.itemboxes[selectedElement].focus();
            } else {
               currentVolume += 10;
               currentVolume = Math.min(currentVolume, 100);
               currentSong.volume = (currentVolume / 100);
               updateSongInfo();
            }
            break;
         case 'down':
         case 'k':
            selectedElement++
            if (currentBox == 0) {
               selectedElement = Math.min(Object.keys(songs).length - 1, selectedElement);
               songBoxes[selectedElement].focus();
            } else if (currentBox == 2) {
               selectedElement = Math.min(queue.itemboxes.length - 1, selectedElement);
               queue.itemboxes[selectedElement].focus();
            } else {
               currentVolume -= 10;
               currentVolume = Math.max(currentVolume, 0);
               currentSong.volume = (currentVolume / 100);
               updateSongInfo();
            }
            break;
         case 'right':
         case 'l':
            if (currentBox === 0) {
               screen.focused = centerBox;
               selectedElement = 0;
               currentBox = 1;
            } else {
               screen.focused = queueBox
               currentBox = 2;
            }
            break;
         case 'tab':
            quMode = !quMode;
            queue.draw()
            break;
         case 'space': //toggles the current song playing.
            if (currentSong.playing) {
               currentSong.pause();
               pauseInc = true
            } else {
               currentSong.play();
               pauseInc = false
            }
            renderCenter();
            break;
         case 'q':
            if (queue.history.length === 0) break;
            queue.items.unshift(queue.history.pop())
            playSong();
            queue.draw();
            renderCenter();
            break;
         case 'e':
            if (queue.items.length === 0) break;
            queue.skip();
            queue.draw();
            renderCenter();
            break;
         case 's':
            if (currentBox === 2 && screen.focused != queueBox && !quMode) {
               for (let i = 0; i < selectedElement; i++) queue.next();
               playSong();
               queue.draw();
               renderCenter();
            } else if (currentBox === 0 && screen.focused != libraryBox) {
               queue.items.splice(1, 0, songs[Object.keys(songs)[selectedElement]]);
               queue.draw();
               if (queue.items.length == 1) playSong();
            }
            break;
         case 'x':
            if (currentBox === 2 && screen.focused != queueBox && !quMode) {
               queue.items.splice(selectedElement, 1);
               queue.itemboxes[selectedElement].focus();
               queue.draw();
               renderCenter();
            }
            break;
         case 'a':
            if (currentBox === 0 && selectedElement != -1) {
               queue.items.push(songs[Object.keys(songs)[selectedElement]]);
               queue.draw();
               if (queue.items.length == 1) playSong();
            }
            break;
         case 'd':
            queue.items.unshift(songs[Object.keys(songs)[selectedElement]]);
            playSong();
            break;
         case 'r': //will be used for repeat, coming soon
            break;
      }
      screen.render();
   })
   //boxes
   var containerBox = blessed.box({
      top: '0%',
      left: '0%',
      width: '100%',
      height: '100%',
      bg: 0,
      fg: 7
   })
   //left box, containing all songs.
   var libraryBox = blessed.box({
      border: {
         type: 'line'
      },
      dockBorders: true,
      top: 'center',
      left: '5%',
      width: '25%-2',
      height: '100%-2',
      style: {
         bg: 0,
         fg: 12,
         border: {
            bg: 0,
            fg: 14,
         },
         focus: {
            border: {
               fg: 3
            }
         }
      }
   })
   containerBox.append(libraryBox);
   //central box with song name, play/pause, volume, and duration.
   var centerBox = blessed.box({
      border: {
         type: 'line'
      },
      tags: true,
      top: 'center',
      left: '30%',
      width: '40%-2',
      height: '100%-2',
      content: 'Main box',
      focused: true,
      style: {
         bg: 0,
         fg: 12,
         border: {
            bg: 0,
            fg: 14,
         },
         focus: {
            border: {
               fg: 3
            }
         }
      }
   });
   containerBox.append(centerBox);
   //right box, containing queue.
   var queueBox = blessed.box({
      border: {
         type: 'line'
      },
      scrollable: true,
      scrollbar: {
         style: {
            fg: 6,
            bg: 0
         }
      },
      top: 'center',
      left: '70%+1',
      width: '25%-2',
      height: '100%-2',
      style: {
         bg: 0,
         fg: 12,
         border: {
            bg: 0,
            fg: 14,
         },
         focus: {
            border: {
               fg: 3
            }
         }
      }
   });
   containerBox.append(queueBox);
   screen.append(containerBox);
   queue.draw(); //this isn't called renderQueue because I'm trying to keep the queue stuff in the same place
   renderCenter();
   renderLibrary();
   screen.render();
}

//renders the left box
function renderLibrary() {
   // let azbutton = blessed.box({ //az = a through z
   //    top: '0%',
   //    left: '0%',
   //    align: 'center',
   //    height: '0%+3',
   //    width: '50%-1',
   //    tags: true,
   //    content: `Alphabetical View`,
   //    border: {
   //       type: 'line',
   //    },
   //    style: {
   //       bg: !libMode ? 12 : 0,
   //       fg: !libMode ? 9 : 12,
   //       border: {
   //          bg: !libMode ? 12 : 0,
   //          fg: !libMode ? 0 : 12,             //this part is for playlists. I don't have playlists due to time constraints.
   //       }
   //    }
   // });
   // let plbutton = blessed.box({
   //    top: '0%',
   //    left: '50%-1',
   //    align: 'center',
   //    height: '0%+3',
   //    width: '50%',
   //    tags: true,
   //    content: `Playlist View`,
   //    border: {
   //       type: 'line',
   //    },
   //    style: {
   //       bg: libMode ? 12 : 0,
   //       fg: libMode ? 9 : 12,
   //       border: {
   //          bg: libMode ? 12 : 0,
   //          fg: libMode ? 0 : 12,
   //       }
   //    }
   // });
   // libraryBox.append(plbutton)
   // libraryBox.append(azbutton)
   let i = 0;

   for (song in songs) {
      let yoff = ((i - 1) * 3) + 3;
      songBoxes[i] = blessed.box({
         border: {
            type: 'line'
         },
         tags: true,
         align: 'left',
         top: yoff,
         left: '1',
         height: '0%+4',
         width: '100%-2',
         content: `${songs[song].name}
${'\033[32m'}Duration: ${Math.floor(songs[song].duration)}`,
         style: {
            bg: 0,
            fg: 3,
            border: {
               bg: 0,
               fg: 11
            },
            focus: {
               bold: true
            }
         }
      })
      libraryBox.append(songBoxes[i]);
      i++;
   }
}
var tHeight;

function renderCenter() {
   //big song name at the top
   tHeight = 0; //title height
   if (queue.items[0] !== undefined) {
      let bigTitle = cfonts.render(queue.items[0].name, {
         font: 'simple',
         space: false, //IMPORTANT
         letterSpacing: 1,
         color: 'blue',
         env: 'node'
      });
      if (centerBox.width >= (bigTitle.array[3].length)) {
         centerBox.setContent(`{center}${bigTitle.string}{/center}`)
         tHeight = 5
      } else {
         centerBox.setContent(`\n{center}{blue-fg}{bold}${queue.items[0].name}{/bold}{/blue-fg}{/center}`)
         tHeight = 3
      }
   } else {
      centerBox.setContent(`\n{center}{red-fg}No song currently playing{/center}`)
      tHeight = 3
   }
   updateSongInfo();
}

function updateSongInfo() {
   centerBox.children = [];
   var infobox = blessed.box({
      border: {
         type: 'line'
      },
      top: tHeight,
      left: 'center',
      width: '80%',
      height: `80%-${Math.floor(0.2 * tHeight)}`,
      tags: true,
      content: `\n{center}{bold}${pauseInc ? 'Paused' : 'Playing'}{bold}\n
Volume: ${currentVolume}%\n\nDuration: ${queue.items[0] ? //Only show duration if there is a song playing
            `${Math.floor(100*(songTime/(queue.items[0].duration)))}% {11-fg}(${Math.floor(songTime / 60)}:${songTime % 60 < 10 ? '0' : ''}${songTime % 60} / ${Math.floor(queue.items[0].duration / 60)}:${Math.floor(queue.items[0].duration % 60)})` : '{11-fg}N/A'}`,
      style: {
         bg: 0,
         fg: 12,
         border: {
            bg: 0,
            fg: 12
         }
      }
   });
   centerBox.append(infobox);
}

function playSong(sName, resetQueue) {
   currentSong.pause()
   if (sName == undefined) {
      currentSong = new Audic(queue.items[0].path)
   } else if (songs[sName] || (() => {
         for (let i in songs)
            if (songs[i].name === sName) { //this just checks if you're using the longer name of one of the songs. Because of the way JS logical OR works, this isn't too slow.
               sName = i;
               return true
            }
      })()) {
      //the foor loop looks for the song name as the name value of one of the songs. There's probably an easier way, but I can't think of one.
      if (resetQueue) queue.items = [songs[sName]]
      currentSong = new Audic(songs[sName].path);
      currentSong.volume = (currentVolume / 100);
   } else {
      console.error('Song does not exist'.red);
      return
   }

   clearInterval(queue.checkIntervalID);
   songTime = 0;
   queue.checkIntervalID = setInterval(queue.completionCheck, 1000);
   //output or set song name in gui
   if (isCLI) {
      console.log('song set to:' + queue.items[0].path);
   } else {
      renderCenter();
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
      (async () => { //async function because mp3duration returns a promise
         for (song in newSongs) {
            song = newSongs[song].substring(0, newSongs[song].length - 4); //remove '.mp3'
            songs[song] = {
               name: song,
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