// Load stratagem data
let stratagems = JSON.parse(data).list;
console.log(stratagems);

// Install keypress listener
addEventListener("keydown", (event) => {
    if (event.isComposing || event.code === 229) {
        return;
    }
    keypress(event.code);
});

// Load SFX
var sfxDown = new Audio("./Images/Sounds/1_D.mp3");
var sfxLeft = new Audio("./Images/Sounds/2_l.mp3");
var sfxRight = new Audio("./Images/Sounds/3_R.mp3");
var sfxUp = new Audio("./Images/Sounds/4_U.mp3");

let currentStratagemDone = true;
let currentSequenceIndex = 0;
var currentArrowSequenceTags = undefined;

// Load first stratagem
loadNextStratagem();

//~~~//

function keypress(keyCode){
    // Guard clause; don't do anything if there's no active stratagem
    if(currentStratagemDone)
        return;

    // Ignore invalid keypresses
    // Play associated sound
    let sfx;
    switch(keyCode){
        case "KeyW":
            sfx = sfxUp;
            break;
        case "KeyS":
            sfx = sfxDown;
            break;
        case "KeyA":
            sfx = sfxLeft;
            break;
        case "KeyD":
            sfx = sfxRight;
            break;
        default: 
            console.log("Ignored Key");
            return;
    }

    // Play/replay sound
    sfx.paused ? sfx.play() : sfx.currentTime = 0;

    // Check the keypress against the current sequence
    console.log(`Checking ${keyCode} against ${currentArrowSequenceTags[currentSequenceIndex].code}`);
    if(keyCode == currentArrowSequenceTags[currentSequenceIndex].code){
        //Success, apply the success
        //TODO: Set currentArrowSequenceTags[currentSequenceIndex] to completed color
        currentSequenceIndex++;
        console.log(currentSequenceIndex);
        
        //Check if that success completes the entire sequence. 
        if(currentSequenceIndex == currentArrowSequenceTags.length){
            console.log("Stratagem done, loading next");
            currentSequenceIndex = 0;
            loadNextStratagem();
        }
    }
    else if (keyCode == currentArrowSequenceTags[0].code){
        //Edge case; if they're wrong but their input is the same as the first code, reset to first.
        //TODO: Set all currentArrowSequenceTags to normal color and play some kind of failure animation
        //TODO: Set currentArrowSequenceTags[0] to completed color
        currentSequenceIndex = 1;
        console.log("Fail but maintaining first correct input.");
    }
    else{
        //Failure, reset progress
        //TODO: Set all currentArrowSequenceTags to normal color and play some kind of failure animation
        currentSequenceIndex = 0;
        console.log("Fail!");
    }

    updateArrowFilters();
}

function updateArrowFilters(){
    for(i = 0; i < currentArrowSequenceTags.length; i++){
        currentArrowSequenceTags[i].setAttribute("class", i < currentSequenceIndex ? "arrow-complete-filter" : "arrow-incomplete-filter")
    }
}

function loadNextStratagem(){
    // Pick a random stratagem
    let currentStratagem = pickRandomStratagem();
    // console.log(currentStratagem);

    // Set the stratagem's picture
    document.getElementById("current-stratagem-icon").src = `./Images/Stratagem Icons/${currentStratagem.image}`;

    // Show arrow icons
    // Sequence list is global for use in the keypress event
    currentArrowSequenceTags = showArrowSequence(currentStratagem.sequence);

    // Stratagem name
    document.getElementById("stratagem-name").innerHTML = currentStratagem.name;

    currentStratagemDone = false;
}

function pickRandomStratagem(){
    return stratagems[Math.floor(Math.random() * stratagems.length)];
}

function showArrowSequence(arrowSequence){
    // Remove all table elements of old arrows
    let arrowsContainer = document.getElementById("arrows-container");
    arrowsContainer.innerHTML = '';

    //Create new arrow elements
    let arrowTags = [];
    for(arrow of arrowSequence){
        let td = document.createElement("td");
        let img = document.createElement("img");
        td.appendChild(img);
        img.setAttribute("src", `./Images/Arrows/${arrow}`);
        img.setAttribute("class", `arrow-incomplete-filter`);

        // Map filename to keycode
        switch(arrow){
            case "Arrow_4_U.png":
                img.code = "KeyW";
            break;
            case "Arrow_1_D.png":
                img.code = "KeyS";
            break;
            case "Arrow_2_L.png":
                img.code = "KeyA";
            break;
            case "Arrow_3_R.png":
                img.code = "KeyD";
            break;
        }
        arrowsContainer.appendChild(td);
        arrowTags.push(img);
    }
    return arrowTags;
}

async function sleep(ms){
    await new Promise(r => setTimeout(r, ms));
}