// Load stratagem data
let stratagems = JSON.parse(data).list;

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
var sfxGameOver = [new Audio("./Images/Sounds/GameOver1.mp3"), new Audio("./Images/Sounds/GameOver2.mp3")]

// Create global tracking variables
var gameState = "initial" //initial, running, hitlag, over
var currentSequenceIndex = 0;
var currentRefreshIndex = 0;
var currentArrowSequenceTags = undefined;
var refreshArrowSequenceTags;
const TOTAL_TIME = 10000;
const COUNTDOWN_STEP = 10;
const NEW_STRATEGEM_TIMEOUT = 200;
const CORRECT_TIME_BONUS = 500;
const FAILURE_SHAKE_TIME = 200;
var timeRemaining = TOTAL_TIME;
var completedStrategemsList = [];
const CURRENT_STRATAGEM_LIST_LENGTH = 4; //dependent on the html, don't change without modifying html too
var currentStratagemsList = [];

// Load first stratagems
for(let i = 0; i < CURRENT_STRATAGEM_LIST_LENGTH; i++){
    currentStratagemsList.push(pickRandomStratagem());
}

// Show stratagems
refreshStratagemDisplay();

// Bootstrap countdown timer
countDown();

//~~~//

function keypress(keyCode){
    // Ignore invalid keypresses
    let sfx;
    switch(keyCode){
        case "KeyW":
        case "ArrowUp":
            sfx = sfxUp;
            keyCode = "KeyW";
            break;
        case "KeyS":
        case "ArrowDown":
            sfx = sfxDown;
            keyCode = "KeyS";
            break;
        case "KeyA":
        case "ArrowLeft":
            sfx = sfxLeft;
            keyCode = "KeyA";
            break;
        case "KeyD":
        case "ArrowRight":
            sfx = sfxRight;
            keyCode = "KeyD";
            break;
        default: 
            return;
    }

    //Route keypress to proper handling function
    switch(gameState){
        case "initial":
            gameState = "running";
            // Exclusion of `break;` here is intentional. The first keypress of the game should apply to the sequence
        case "running":
            checkGameKeypress(keyCode, sfx);
            break;
        case "over":
            checkRefreshKeypress(keyCode, sfx);
            break;
        case "hitlag":
            break;
    }
}

function checkGameKeypress(keyCode, sfx){
    // Check the keypress against the current sequence
    if(keyCode == currentArrowSequenceTags[currentSequenceIndex].code){
        //Success, apply the success
        currentSequenceIndex++;
        
        //Check if that success completes the entire sequence. 
        if(currentSequenceIndex == currentArrowSequenceTags.length){
            //Add time bonus and pause the countdown for the delay time
            timeRemaining += CORRECT_TIME_BONUS;
            gameState = "hitlag";

            //Add completed stratagem to completed list and remove from active list
            completedStrategemsList.push(currentStratagemsList.shift());

            //Add a new stratagem to the active list
            currentStratagemsList.push(pickRandomStratagem());

            //Set a delay for when the timer should unpause and the next stratagem should be loaded
            setTimeout(() => {
                currentSequenceIndex = 0;
                refreshStratagemDisplay();
                gameState = "running";
            }, NEW_STRATEGEM_TIMEOUT);
        }
    }
    else if (keyCode == currentArrowSequenceTags[0].code){
        //Edge case; if they're wrong but their input is the same as the first code, reset to first.
        currentSequenceIndex = 1;

        //Play failure animation
        shakeArrows(FAILURE_SHAKE_TIME);
    }
    else{
        //Failure, reset progress
        currentSequenceIndex = 0;

        //Play failure animation
        shakeArrows(FAILURE_SHAKE_TIME);
    }   

    updateArrowFilters(currentArrowSequenceTags, currentSequenceIndex);

    // Play/replay sound
    sfx.paused ? sfx.play() : sfx.currentTime = 0;
}

function checkRefreshKeypress(keyCode, sfx){
    // Check the keypress against the current sequence
    if(keyCode == refreshArrowSequenceTags[currentRefreshIndex].code){
        //Success, apply the success
        currentRefreshIndex++;
        
        //If that completes the entire sequence, reload the window after a short delay
        if(currentRefreshIndex == refreshArrowSequenceTags.length){
            setTimeout(() => {
                window.location.reload()
            }, 300);
        }
    }
    updateArrowFilters(refreshArrowSequenceTags, currentRefreshIndex);

    // Play/replay sound
    sfx.paused ? sfx.play() : sfx.currentTime = 0;
}

function updateArrowFilters(arrowTags, index){
    for(i = 0; i < arrowTags.length; i++){
        arrowTags[i].setAttribute("class", i < index ? "arrow-complete-filter" : "arrow-incomplete-filter")
    }
}

function shakeArrows(time){
    document.getElementById("arrows-container").setAttribute("style", `animation: shake ${time/1000}s;`);

    setTimeout(() => {
        document.getElementById("arrows-container").removeAttribute("style");
    }, 200);
}

function refreshStratagemDisplay(){
    for(let i in currentStratagemsList){
        // Show the stratagem's picture in the correct slot
        document.getElementById(`stratagem-icon-${i}`).src = `./Images/Stratagem\ Icons/${currentStratagemsList[i].image}`;
    }

    // Show arrow icons for the current active stratagem
    currentArrowSequenceTags = showArrowSequence(currentStratagemsList[0].sequence);

    // Show active stratagem name
    document.getElementById("stratagem-name").innerHTML = currentStratagemsList[0].name;
}

function pickRandomStratagem(){
    return stratagems[Math.floor(Math.random() * stratagems.length)];
}

function showArrowSequence(arrowSequence, arrowsContainer){
    if(arrowsContainer == undefined)
        arrowsContainer = document.getElementById("arrows-container");

    // Remove all table elements of old arrows
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
    gameState = "over";

    // Write score to readout
    let scoreReadout = document.getElementById("score-readout");
    scoreReadout.innerHTML = `SCORE: ${completedStrategemsList.length}`

    // Write completed strategems to readout
    let stratagemReadout = document.getElementById("completed-strategems-readout");
    stratagemReadout.innerHTML = stratagemListToString(true);

    // Show refresh arrow sequence
    let sequence = ["Arrow_4_U.png", "Arrow_1_D.png", "Arrow_3_R.png", "Arrow_2_L.png", "Arrow_4_U.png"];
    let container = document.getElementById("refresh-arrows-container");
    refreshArrowSequenceTags = showArrowSequence(sequence, container);
    // console.log(`Refresh tags ${refreshArrowSequenceTags}`);

    // Show the popup
    let popup = document.getElementById("game-over-popup");
    popup.removeAttribute("hidden");
    popup.style.visibility = "visible";

    // Play game over sfx
    sfxGameOver[Math.floor(Math.random() * sfxGameOver.length)].play();
}

function stratagemListToString(html){
    // const TOTAL_PADDING = 50;
    let re = "";
    for(let stratagem of completedStrategemsList){
        let line = `${stratagem.name}: `;
        
        //Put padding spaces
        // console.log(`i ${line.length}`)
        // for(let i = line.length; i < TOTAL_PADDING; i++){
        //     line += " ";
        //     console.log(`put space: ${line}.`)
        // }

        //Put arrows
        for(let arrow of stratagem.sequence){
            switch(arrow){
                case "Arrow_4_U.png":
                    line += "🡅";
                break;
                case "Arrow_1_D.png":
                    line += "🡇";
                break;
                case "Arrow_2_L.png":
                    line += "🡄";
                break;
                case "Arrow_3_R.png":
                    line += "🡆";
                break;
            }
        }
        line += html ? "<br>" : "\n";
        re += line;
    }

    return re;
}

function copyShare(){
    // Gather text and write to clipboard
    let output = `## My Stratagem Hero Online Score: ${completedStrategemsList.length}\n`
    output += stratagemListToString(false);
    output += "Do your part! Play Stratagem Hero Online: https://combustibletoast.github.io/"
    navigator.clipboard.writeText(output);

    //Change button's text
    let buttonElement = document.getElementById("share-button");
    let buttonOriginalText = buttonElement.innerHTML;
    buttonElement.innerHTML = "Copied!";

    //Set timeout to change it back
    //Doesn't work, unable to pass in original text
    setTimeout(() => {
        buttonElement.innerHTML = buttonOriginalText;
    }, 3000);
}

async function countDown(){
    if(gameState == "over")
        return;

    if(timeRemaining <= 0){
        gameOver();
        return;
    }

    // Immediately Set timeout for next countdown step
    setTimeout(() => {
        countDown();
        // console.log(timeRemaining)
    }, COUNTDOWN_STEP);

    // Apply countdown if it's not paused
    if(gameState != "hitlag" && gameState != "initial")
        timeRemaining -= COUNTDOWN_STEP;
    updateTimeBar();
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