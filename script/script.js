let currentSong = new Audio();
let currentIndex = 0;
let songs = [];
let currfolder;

async function getSongs(folder) {
    try {
        currfolder = folder;
        let response = await fetch(`/${folder}/`);
        let htmlText = await response.text();

        let div = document.createElement("div");
        div.innerHTML = htmlText;

        let links = div.getElementsByTagName("a");
        songs = [];

        for (let i = 0; i < links.length; i++) {
            const element = links[i];
            if (element.href.endsWith(".mp3")) {
                songs.push(`/${folder}/` + element.href.split(`/${folder}/`)[1]);
            }
        }


        let songUL = document.querySelector(".songlist ul");
        songUL.innerHTML = ""
        for (const song of songs) {
            const listItem = document.createElement("li");
            listItem.classList.add("first");

            listItem.innerHTML = `
            <div class="info">
                <div>${decodeURIComponent(song.split("songs/")[1])}</div>
                <div>default</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img src="icon/play.svg" alt="">
            </div>
        `;
            songUL.appendChild(listItem);
        }

        Array.from(songUL.getElementsByTagName("li")).forEach(element => {
            element.addEventListener("click", () => {
                const songName = element.querySelector(".info div").textContent.trim();
                const index = songs.findIndex(s => decodeURIComponent(s.split("songs/")[1]) === songName);
                playMusic(index);
            });
        });
        return songs

    } catch (error) {
        console.error("Error fetching songs:", error);
    }
}

// Function to load and play a song at a specific index


const playMusic = (index) => {
    if (index < 0 || index >= songs.length) return;

    currentSong.src = `${songs[index]}`;
    currentSong.play().catch(error => console.error("Playback error:", error));

    document.getElementById("playm").src = "icon/pause.svg";
    currentIndex = index;

    const songPath = decodeURIComponent(songs[index]);
    const songTitle = songPath.split("/").pop();

    // const songTitle = decodeURIComponent(songs[index].split("/songs/")[1]);
    document.querySelector(".songinfo").innerHTML = `${songTitle}`;
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";




};

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


// Seekbar elements
const seekbar = document.querySelector(".seekbar");
const circle = document.querySelector(".circle");

// Update the circle position according to song time
currentSong.ontimeupdate = () => {
    const progress = currentSong.currentTime / currentSong.duration;
    const seekbarWidth = seekbar.offsetWidth;
    const circlePosition = progress * seekbarWidth;

    circle.style.left = `${circlePosition}px`;

    const currentTime = formatTime(currentSong.currentTime);
    const duration = formatTime(currentSong.duration);
    document.querySelector(".songtime").innerHTML = `${currentTime} / ${duration}`;
};

// Helper function to format time as MM:SS
const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
};

// Make the seekbar clickable to jump to specific song time
seekbar.addEventListener("click", (e) => {
    const seekbarWidth = seekbar.offsetWidth;
    const clickPosition = e.offsetX;
    const newTime = (clickPosition / seekbarWidth) * currentSong.duration;

    currentSong.currentTime = newTime;
});

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
    let response = await fetch(`songs/`);
    let htmlText = await response.text();
    let div = document.createElement("div");
    div.innerHTML = htmlText;
    let anchors = div.getElementsByTagName("a")
    let cardContainer = document.querySelector(".cardContainer")
    let array = Array.from(anchors)
    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        if (e.href.includes("songs")) {
            let folder = e.href.split("/").slice(-2)[0];
            let response = await fetch(`songs/${folder}/info.json`);
            let htmlText = await response.json();
            cardContainer.innerHTML = cardContainer.innerHTML + `<div  data-folder="${folder}" class="card">
                        <div class="play">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                                <!-- Green Circle Background -->
                                <circle cx="12" cy="12" r="10" fill="#28A745" />

                                <!-- Centered Play Icon Path -->
                                <path d="M10 8L16 12L10 16V8Z" fill="#00000" />
                            </svg>
                        </div>
                        <img aria-hidden="false" draggable="false" loading="lazy"
                            src="songs/${folder}/img.jpg"
                            data-testid="shortcut-image" alt=""
                            class="mMx2LUixlnN_Fu45JpFB WWDxafTPs4AgThdcX5jN Yn2Ei5QZn19gria6LjZj">
                        <h2>${htmlText.title} </h2>
                        <p>${htmlText.description}</p>
                    </div>`

        }
    }
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`)
        })
    })

}

// Main function to initialize the playlist
async function main() {
    await getSongs("songs/Rock");
    await displayAlbums()
    const playm = document.getElementById("playm");

    playm.addEventListener("click", () => {
        if (!currentSong.src && songs.length > 0) {
            playMusic(0);
        } else {
            if (currentSong.paused) {
                currentSong.play();
                playm.src = "icon/pause.svg";
            } else {
                currentSong.pause();
                playm.src = "icon/play1.svg";
            }
        }
    });

    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-130%";
    });

    document.querySelector(".range").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        currentSong.volume = parseInt(e.target.value) / 100;
    });

    document.querySelector(".volumeimg").addEventListener("click", e => {

        if (e.target.src.includes("volume.svg")) {
            e.target.src = e.target.src.replace("volume.svg", "mute.svg")
            currentSong.volume = 0;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 0;
        }
        else {
            e.target.src = e.target.src.replace("mute.svg", "volume.svg")
            currentSong.volume = .1;
            document.querySelector(".range").getElementsByTagName("input")[0].value = 10;
        }
    })

    document.getElementById("next").addEventListener("click", playNext);
    document.getElementById("previous").addEventListener("click", playPrevious);
}

document.addEventListener("DOMContentLoaded", main);
