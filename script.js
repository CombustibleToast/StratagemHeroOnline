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
var sfxLeft = new Audio("./Images/Sounds/2_L.mp3");
var sfxRight = new Audio("./Images/Sounds/3_R.mp3");
var sfxUp = new Audio("./Images/Sounds/4_U.mp3");

// Create global tracking variables
var gameIsRunning = true;
const NEW_STRATEGEM_TIMEOUT = 200;
var currentStratagem = undefined;
var currentStratagemDone = true;
var currentSequenceIndex = 0;
var currentArrowSequenceTags = undefined;
const TOTAL_TIME = 10000;
const COUNTDOWN_STEP = 10;
const CORRECT_TIME_BONUS = 500;
var timeRemaining = TOTAL_TIME;
var numCompletedStratagems = 0
var completedStrategemsList = [];

// Load first stratagem
loadNextStratagem();

// Bootstrap countdown timer
countDown();

//~~~//

function keypress(keyCode){
    // Guard clause; don't do anything if there's no active stratagem
    if(currentStratagemDone || !gameIsRunning)
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
            return;
    }

    // Play/replay sound
    sfx.paused ? sfx.play() : sfx.currentTime = 0;

    // Check the keypress against the current sequence
    if(keyCode == currentArrowSequenceTags[currentSequenceIndex].code){
        //Success, apply the success
        currentSequenceIndex++;
        
        //Check if that success completes the entire sequence. 
        if(currentSequenceIndex == currentArrowSequenceTags.length){
            timeRemaining += CORRECT_TIME_BONUS;
            completedStrategemsList.push(currentStratagem);
            setTimeout(() => {
                currentSequenceIndex = 0;
                loadNextStratagem();
            }, NEW_STRATEGEM_TIMEOUT);
        }
    }
    else if (keyCode == currentArrowSequenceTags[0].code){
        //Edge case; if they're wrong but their input is the same as the first code, reset to first.
        //TODO: play some kind of failure animation
        currentSequenceIndex = 1;
    }
    else{
        //Failure, reset progress
        //TODO: play some kind of failure animation
        currentSequenceIndex = 0;
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
    currentStratagem = pickRandomStratagem();
    // console.log(currentStratagem);

    // Set the stratagem's picture
    document.getElementById("current-stratagem-icon").src = `./Images/Stratagem\ Icons/${currentStratagem.image}`;

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

function gameOver(){
    //Stop the game
    gameIsRunning = false;

    // Write score to readout
    let scoreReadout = document.getElementById("score-readout");
    scoreReadout.innerHTML = `SCORE: ${numCompletedStratagems}`

    // Write completed strategems to readout
    let stratagemReadout = document.getElementById("completed-strategems-readout");
    stratagemReadout.innerHTML = stratagemListToString(true);

    // Show the popup
    let popup = document.getElementById("game-over-popup");
    popup.removeAttribute("hidden");
    popup.style.visibility = "visible";
}

function stratagemListToString(html){
    let re = "";
    for(let stratagem of completedStrategemsList){
        re += stratagem.name + ": \t\t";
        for(let arrow of stratagem.sequence){
            switch(arrow){
                case "Arrow_4_U.png":
                    re += "🡅";
                break;
                case "Arrow_1_D.png":
                    re += "🡇";
                break;
                case "Arrow_2_L.png":
                    re += "🡄";
                break;
                case "Arrow_3_R.png":
                    re += "🡆";
                break;
            }
        }
        re += html ? "<br>" : "\n";
    }

    return re;
}

function copyShare(){
    // Gather text and write to clipboard
    let output = `My Strategem Hero Online Score: ${completedStrategemsList.length}\n`
    output += stratagemListToString(false);
    output += "Do your part! Try Strategem Hero Online here: https://combustibletoast.github.io/"
    navigator.clipboard.writeText(output);

    //Change button's text
    let buttonElement = document.getElementById("share-button");
    let buttonOriginalText = buttonElement.innerHTML;
    buttonElement.innerHTML = "Copied!";

    //Set timeout to change it back
    //Doesn't work, unable to pass in original text
    setTimeout((buttonElement, buttonOriginalText) => {
        buttonElement.innerHTML = buttonOriginalText;
    }, 3000);
}

async function countDown(){
    if(!gameIsRunning)
        return;

    if(timeRemaining <= 0){
        gameOver();
    }

    // Apply countdown
    timeRemaining -= COUNTDOWN_STEP;
    updateTimeBar();

    // Set timeout for next countdown step
    setTimeout(() => {
        countDown();
        // console.log(timeRemaining)
    }, COUNTDOWN_STEP);
}

function updateTimeBar(){
    let bar = document.getElementById("time-remaining-bar");  
    let width = (timeRemaining/TOTAL_TIME) * 100;
    // console.log(width);
    bar.style.width = `${width}%`;   
}

async function sleep(ms){
    await new Promise(r => setTimeout(r, ms));
}