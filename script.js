let currentSong = new Audio();
let currentIndex = 0;
let songs = [];
let currfolder;

async function getSongs(folder) {
    try {
        currfolder = folder;
        console.log('Fetching songs from:', folder);
        const response = await fetch(`/${folder}/`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const htmlText = await response.text();
        console.log('Received HTML:', htmlText.substring(0, 100)); // Log first 100 chars

        const div = document.createElement("div");
        div.innerHTML = htmlText;

        const links = div.getElementsByTagName("a");
        songs = Array.from(links)
            .filter(element => element.href.endsWith(".mp3"))
            .map(element => `/${folder}/` + element.href.split(`/${folder}/`)[1]);

        const songUL = document.querySelector(".songlist ul");
        if (!songUL) return [];

        songUL.innerHTML = songs.map(song => `
            <li class="first">
                <div class="info">
                    <div>${decodeURIComponent(song.split("/songs/")[1])}</div>
                    <div>default</div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img src="icon/play.svg" alt="">
                </div>
            </li>
        `).join('');

        // Event delegation for better performance
        songUL.addEventListener("click", (e) => {
            const listItem = e.target.closest("li");
            if (!listItem) return;

            const songName = listItem.querySelector(".info div").textContent.trim();
            const index = songs.findIndex(s =>
                decodeURIComponent(s.split("/songs/")[1]) === songName
            );
            if (index !== -1) {
                playMusic(index);
            }
        });

        return songs;
    } catch (error) {
        console.error("Error fetching songs:", error);
        console.log("Folder attempted:", folder);
        return [];
    }
}

const playMusic = (index) => {
    try {
        if (index < 0 || index >= songs.length) return;

        const playButton = document.getElementById("playm");
        if (!playButton) return;

        currentSong.src = songs[index];
        currentSong.play()
            .catch(error => {
                console.error("Playback error:", error);
                playButton.src = "icon/play1.svg";
            });

        playButton.src = "icon/pause.svg";
        currentIndex = index;

        const songPath = decodeURIComponent(songs[index]);
        const songTitle = songPath.split("/").pop();

        const songInfoElement = document.querySelector(".songinfo");
        const songTimeElement = document.querySelector(".songtime");

        if (songInfoElement) songInfoElement.textContent = songTitle;
        if (songTimeElement) songTimeElement.textContent = "00:00 / 00:00";
    } catch (error) {
        console.error("Error in playMusic:", error);
    }
};
// Helper function to format time as MM:SS
const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
};

// Play the next song in the playlist
const playNext = () => {
    const nextIndex = (currentIndex + 1) % songs.length;
    playMusic(nextIndex);
};

// Play the previous song in the playlist
const playPrevious = () => {
    const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
    playMusic(prevIndex);
};


async function displayAlbums() {
    try {

        let response = await fetch("./songs/");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        let htmlText = await response.text();
        let div = document.createElement("div");
        div.innerHTML = htmlText;
        let anchors = div.getElementsByTagName("a")
        let cardContainer = document.querySelector(".cardContainer")

        if (!cardContainer) {
            console.error("Card container not found");
            return;
        }

        let array = Array.from(anchors)
        for (let index = 0; index < array.length; index++) {
            const e = array[index];
            if (e.href.includes("/songs/")) {
                try {

                    let folder = e.href.split("/").slice(-2)[0];
                    let infoResponse = await fetch(`./songs/${folder}/info.json`);
                    if (!infoResponse.ok) {
                        console.error(`Error loading info.json for ${folder}`);
                        continue;
                    }
                    let htmlText = await infoResponse.json();
                    cardContainer.innerHTML  += `<div  data-folder="${folder}" class="card">
                    <div class="play">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                    <!-- Green Circle Background -->
                    <circle cx="12" cy="12" r="10" fill="#28A745" />
                    
                    <!-- Centered Play Icon Path -->
                    <path d="M10 8L16 12L10 16V8Z" fill="#00000" />
                    </svg>
                    </div>
                    <img aria-hidden="false" draggable="false" loading="lazy"
                    src="/songs/${folder}/img.jpg"
                    data-testid="shortcut-image" alt=""
                    class="mMx2LUixlnN_Fu45JpFB WWDxafTPs4AgThdcX5jN Yn2Ei5QZn19gria6LjZj">
                    <h2>${htmlText.title} </h2>
                    <p>${htmlText.description}</p>
                    </div>`
                }
                catch (error) {
                    console.error(`Error processing folder ${folder}:`, error);
                }

            }
        }


        Array.from(document.getElementsByClassName("card")).forEach(e => {
            e.addEventListener("click", async item => {
                songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`)
            })
        })
        Array.from(document.getElementsByClassName("card")).forEach(e => {
            e.addEventListener("click", async item => {
                try {
                    // Get the songs for the clicked folder
                    songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);

                    // Check if there are any songs in the folder
                    if (songs && songs.length > 0) {
                        // Play the first song (index 0)
                        playMusic(0);

                        // Update play button state
                        const playButton = document.getElementById("playm");
                        if (playButton) {
                            playButton.src = "icon/pause.svg";
                        }

                        // Optional: Update the UI to show which card is currently playing
                        document.querySelectorAll('.card').forEach(card => {
                            card.classList.remove('playing');
                        });
                        item.currentTarget.classList.add('playing');
                    } else {
                        console.log("No songs found in this folder");
                    }
                } catch (error) {
                    console.error("Error playing song from card:", error);
                }
            });
        });

        // Add click handlers after all cards are created
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', async () => {
                try {
                    const folder = card.dataset.folder;
                    songs = await getSongs(`songs/${folder}`);
                    if (songs.length > 0) {
                        playMusic(0);
                    }
                } catch (error) {
                    console.error('Error handling card click:', error);
                }
            });
        });
    } catch (error) {
        console.error("Error in displayAlbums:", error);
    }

}

// Main function to initialize the playlist
async function main() {
    try {
        // Cache DOM elements to avoid repeated queries
        const playm = document.getElementById("playm");
        const leftPanel = document.querySelector(".left");
        const volumeControl = document.querySelector(".range input");
        const volumeImg = document.querySelector(".volumeimg");

        await getSongs(".songs");
        await displayAlbums();

        // Play/Pause functionality
        playm.addEventListener("click", () => {
            if (!currentSong?.src && songs.length > 0) {
                playMusic(0);
            } else if (currentSong) {
                if (currentSong.paused) {
                    currentSong.play()
                        .catch(err => console.error('Error playing song:', err));
                    playm.src = "icon/pause.svg";
                } else {
                    currentSong.pause();
                    playm.src = "icon/play1.svg";
                }
            }
        });

        // Hamburger menu toggle
        document.querySelector(".hamburger").addEventListener("click", () => {
            leftPanel.style.left = "0";
        });

        document.querySelector(".close").addEventListener("click", () => {
            leftPanel.style.left = "-130%";
        });

        // Volume control
        volumeControl.addEventListener("input", (e) => {
            if (currentSong) {
                currentSong.volume = parseFloat(e.target.value) / 100;
            }
        });

        // Mute/Unmute toggle
        volumeImg.addEventListener("click", e => {
            const isMuted = e.target.src.includes("volume.svg");
            e.target.src = e.target.src.replace(
                isMuted ? "volume.svg" : "mute.svg",
                isMuted ? "mute.svg" : "volume.svg"
            );

            if (currentSong) {
                currentSong.volume = isMuted ? 0 : 0.1;
                volumeControl.value = isMuted ? 0 : 10;
            }
        });

        document.addEventListener('DOMContentLoaded', async () => {
            try {
                await displayAlbums();
                // Initialize with default folder
                await getSongs('songs/Rock');
            } catch (error) {
                console.error('Error initializing app:', error);
            }
        });
        

        // Next and Previous controls
        document.getElementById("next").addEventListener("click", playNext);
        document.getElementById("previous").addEventListener("click", playPrevious);

    } catch (error) {
        console.error('Error in main function:', error);
    }
}
function setupAudioEndedHandler() {
    currentSong.addEventListener("ended", () => {
        try {
            // Play next song if available
            if (currentIndex < songs.length - 1) {
                playMusic(currentIndex + 1);
            } else {
                // If it's the last song, reset to initial state
                const playButton = document.getElementById("playm");
                if (playButton) {
                    playButton.src = "icon/play1.svg";
                }

                // Reset song info
                const songInfoElement = document.querySelector(".songinfo");
                if (songInfoElement) {
                    songInfoElement.textContent = "Select a song to play";
                }

                // Reset time display
                const songTimeElement = document.querySelector(".songtime");
                if (songTimeElement) {
                    songTimeElement.textContent = "00:00 / 00:00";
                }

                // Reset progress bar
                const circle = document.querySelector(".circle");
                if (circle) {
                    circle.style.left = "0%";
                }

                // Optional: Reset seekbar
                const seekbar = document.querySelector(".seekbar");
                if (seekbar) {
                    seekbar.style.width = "0%";
                }
                currentSong.addEventListener("loadedmetadata", () => {
                    seekbar.addEventListener("click", (e) => {
                        const seekbarWidth = seekbar.offsetWidth;
                        const clickPosition = e.offsetX;
                        const newTime = (clickPosition / seekbarWidth) * currentSong.duration;

                        if (!isNaN(newTime)) {
                            currentSong.currentTime = newTime; // Only set if newTime is valid
                        }
                    });
                });

            }
        } catch (error) {
            console.error("Error handling song end:", error);
        }
    });

    // Add time update handler for progress bar
    currentSong.addEventListener("timeupdate", () => {
        try {
            // Update time display
            const songTimeElement = document.querySelector(".songtime");
            if (songTimeElement) {
                const currentTime = formatTime(currentSong.currentTime);
                const duration = formatTime(currentSong.duration);
                songTimeElement.textContent = `${currentTime} / ${duration}`;
            }

            // Update progress bar
            const circle = document.querySelector(".circle");
            if (circle) {
                const progress = (currentSong.currentTime / currentSong.duration) * 100;
                circle.style.left = progress + "%";
            }

            // Update seekbar
            const seekbar = document.querySelector(".seekbar");
            if (seekbar) {
                const progress = (currentSong.currentTime / currentSong.duration) * 100;
                seekbar.style.width = progress + "%";
            }
        } catch (error) {
            console.error("Error updating progress:", error);
        }
    });
}



setupAudioEndedHandler();

document.addEventListener("DOMContentLoaded", main);
