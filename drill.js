// Load stratagem data
var stratagems = undefined;

var xhr = new XMLHttpRequest();
xhr.open(method='GET', url='./data/HD2-Sequences.json', async=false); // false indicates synchronous request
xhr.send();

if (xhr.status === 200) {
    stratagems = xhr.responseText;
} else {
    console.error('Error reading file:', xhr.statusText);
}

stratagems = JSON.parse(stratagems);

// Install keypress listener
function mainGameKeyDownListener(event) {
    if (event.isComposing || event.code === 229) {
        return;
    }
    keypress(event.code);
}

addMainGameListener();

// Set gamepad polling
let gpPollInterval;
const gpPollRate = 1000;
const gpButtonToKeyMap = {
    12: "KeyW", // Up
    13: "KeyS", // Down
    14: "KeyA", // Left
    15: "KeyD"  // Right
};

// Poll for gamepad connection
gpPollInterval = setInterval(pollGamepads, gpPollRate);

function pollGamepads() {
    const gamepads = navigator.getGamepads();

    // If any gamepad is connected, start the gamepad loop
    if (gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3]) {
        gamepadLoop();
        clearInterval(gpPollInterval);
    }
}

// Gamepad input handling
let prevButtons = new Array(16).fill(false);

function gamepadLoop() {
    const gamepads = navigator.getGamepads();
    // Get the first non-null gamepad
    const gp = gamepads[0] || gamepads[1] || gamepads[2] || gamepads[3];

    if (!gp) {
        return;
    }

    for (let i in gpButtonToKeyMap) {
        if (gp.buttons[i].pressed && !prevButtons[i]) {
            keypress(gpButtonToKeyMap[i]);
        }
    }

    // Update previous buttons state
    for (let i = 0; i < gp.buttons.length; i++) {
        prevButtons[i] = gp.buttons[i].pressed;
    }

    requestAnimationFrame(gamepadLoop);
}

// Load SFX
var sfxDown = new Audio("./data/Sounds/1_D.mp3");
var sfxLeft = new Audio("./data/Sounds/2_L.mp3");
var sfxRight = new Audio("./data/Sounds/3_R.mp3");
var sfxUp = new Audio("./data/Sounds/4_U.mp3");
var sfxGameOver = [new Audio("./data/Sounds/GameOver1.mp3"), new Audio("./data/Sounds/GameOver2.mp3")]

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
var lastCheckedTime = undefined;
var CONFIGPOPUP = document.getElementById('game-config-popup');
var DRILL_CONFIG_POPUP = document.getElementById('drill-config-popup');
var DRILL_CONFIG_STRATAGEM_OPTIONS = document.getElementById('drill-config-stratagem-options');
var TEMPARROWKEYS = {};
var seletecedStratagems = [];

// initial state of custom config
const storedArrowKeysConfig = localStorage.getItem("CONFIG.arrowKeys") ? JSON.parse(localStorage.getItem("CONFIG.arrowKeys")) : false;
const storedDrillConfig = localStorage.getItem("CONFIG.drillConfig") ? JSON.parse(localStorage.getItem("CONFIG.drillConfig")) : false;
const CONFIG = {};

if(storedArrowKeysConfig) {
    CONFIG.arrowKeys = storedArrowKeysConfig;
} else {
    CONFIG.arrowKeys = {
        up:"KeyW",
        down:"KeyS",
        left:"KeyA",
        right:"KeyD"
    }
}

if(storedDrillConfig) {
    CONFIG.drillConfig = storedDrillConfig;
} else {
    CONFIG.drillConfig = [];
}

// render stratagem config options
function createStratagemDrillOptionNode(stratagem) {
    let stratagemNode = document.createElement("div");
    let inputNode = document.createElement("input");
    inputNode.type = "checkbox";
    inputNode.id = `${stratagem.name}__option`;
    inputNode.setAttribute("data-stratagem-name", stratagem.name);
    inputNode.classList.add("game-config-popup__stratagem-option");
    let labelNode = document.createElement("label");
    labelNode.htmlFor = inputNode.id;
    labelNode.textContent = stratagem.name;
    stratagemNode.appendChild(inputNode);
    stratagemNode.appendChild(labelNode);
    return stratagemNode;
}

for (let stratagem of stratagems) {
    let node = createStratagemDrillOptionNode(stratagem);
    DRILL_CONFIG_STRATAGEM_OPTIONS.appendChild(node);
}


// Show directional buttons if user is on mobile
if(userIsMobile())
    showMobileButtons();

function loadRandomStratagems() {
    for(let i = 0; i < CURRENT_STRATAGEM_LIST_LENGTH; i++){
      currentStratagemsList.push(pickRandomStratagem());
    }
}

// Load first stratagems
if (CONFIG.drillConfig.length > 0) {
    seletecedStratagems = CONFIG.drillConfig;
    currentStratagemsList = [seletecedStratagems[0]];
    while (currentStratagemsList.length < CURRENT_STRATAGEM_LIST_LENGTH) {
        currentStratagemsList.push(pickNextStratagem());
    }
} else {
    loadRandomStratagems();
    seletecedStratagems = [...currentStratagemsList];
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
        case "ArrowUp":
        case CONFIG.arrowKeys.up:
            sfx = sfxUp;
            keyCode = "KeyW";
            break;
        case "ArrowDown":
        case CONFIG.arrowKeys.down:
            sfx = sfxDown;
            keyCode = "KeyS";
            break;
        case "ArrowLeft":
        case CONFIG.arrowKeys.left:
            sfx = sfxLeft;
            keyCode = "KeyA";
            break;
        case "ArrowRight":
        case CONFIG.arrowKeys.right:
            sfx = sfxRight;
            keyCode = "KeyD";
            break;
        default:
            return;
    }

    //b

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
            currentStratagemsList.push(pickNextStratagem());

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
        if (currentStratagemsList[i].image) {
            document.getElementById(`stratagem-icon-${i}`).src = `./data/Images/Stratagem\ Icons/hd2/${currentStratagemsList[i].image}`;
        }
        else {
            document.getElementById(`stratagem-icon-${i}`).src = `./data/Images/Stratagem\ Icons/hd2/placeholder.png`;
        }
    }

    // Show arrow icons for the current active stratagem
    currentArrowSequenceTags = showArrowSequence(currentStratagemsList[0].sequence);

    // Show active stratagem name
    document.getElementById("stratagem-name").innerHTML = currentStratagemsList[0].name;
}

function pickRandomStratagem(){
    return stratagems[Math.floor(Math.random() * stratagems.length)];
}

function pickNextStratagem() {
  let lastCurrentStratagem = currentStratagemsList[currentStratagemsList.length - 1];
  let stratagemIndex = seletecedStratagems.findIndex((stratagem) => stratagem.name === lastCurrentStratagem.name);
  let nextStratagemIndex = stratagemIndex + 1;
  if (nextStratagemIndex >= seletecedStratagems.length) {
    nextStratagemIndex = 0;
  }
  return seletecedStratagems[nextStratagemIndex];
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
        img.setAttribute("src", `./data/Images/Arrows/${arrow}.png`);
        img.setAttribute("class", `arrow-incomplete-filter`);

        // Map filename to keycode
        switch(arrow){
            case "U":
                img.code = "KeyW";
            break;
            case "D":
                img.code = "KeyS";
            break;
            case "L":
                img.code = "KeyA";
            break;
            case "R":
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
    scoreReadout.innerHTML = `DRILL SCORE: ${completedStrategemsList.length}`

    // Write completed strategems to readout
    let stratagemReadout = document.getElementById("completed-strategems-readout");
    stratagemReadout.innerHTML = stratagemListToString(true);

    // Show refresh arrow sequence
    let sequence = ["U", "D", "R", "L", "U"];
    let container = document.getElementById("refresh-arrows-container");
    refreshArrowSequenceTags = showArrowSequence(sequence, container);

    // Hide the game
    let game = document.getElementById("interactable-center-container");
    game.setAttribute("hidden", "hidden");
    game.style.visibility = "invisible";

    // Show the popup
    let popup = document.getElementById("game-over-popup");
    popup.removeAttribute("hidden");
    popup.style.visibility = "visible";

    // Play game over sfx
    sfxGameOver[Math.floor(Math.random() * sfxGameOver.length)].play();
}

function stratagemListToString(html, spamless){
    // Set direction characters based on argument
    let up = "🡅", down = "🡇", left = "🡄", right = "🡆";
    if(userIsMobile()){
        up = "⬆️", down = "⬇️", left = "⬅️", right = "➡️";
    }

    if(spamless){
        up = "U", down = "D", left = "L", right = "R";
    }

    let re = "";
    for(let stratagem of completedStrategemsList){
        let line = `${stratagem.name}: `;

        //Put arrows
        for(let direction of stratagem.sequence){
            switch(direction){
                case "U":
                    line += up;
                break;
                case "D":
                    line += down;
                break;
                case "L":
                    line += left;
                break;
                case "R":
                    line += right;
                break;
            }
        }
        line += html ? "<br>" : "\n";
        re += line;
    }

    return re;
}

async function countDown(){
    if(gameState == "over")
        return;

    if(timeRemaining <= 0){
        gameOver();
        return;
    }

    //Calculate the true delta time since last check
    //This should fix #2
    if(lastCheckedTime == undefined)
        lastCheckedTime = Date.now();
    let now = Date.now();
    let trueDeltaT = now-lastCheckedTime;
    lastCheckedTime = now;

    // Immediately Set timeout for next countdown step
    setTimeout(() => {
        countDown();
        // console.log(timeRemaining)
    }, COUNTDOWN_STEP);

    // Apply countdown if it's not paused
    if(gameState != "hitlag" && gameState != "initial")
        timeRemaining -= trueDeltaT;
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

function userIsMobile() {
    return navigator.userAgent.match(/Android/i)
    || navigator.userAgent.match(/webOS/i)
    || navigator.userAgent.match(/iPhone/i)
    || navigator.userAgent.match(/iPad/i)
    || navigator.userAgent.match(/iPod/i)
    || navigator.userAgent.match(/BlackBerry/i)
    || navigator.userAgent.match(/Windows Phone/i);
}

function showMobileButtons() {
    container = document.getElementById("mobile-button-container");

    container.removeAttribute("hidden");
    container.style.visibility = "visible";
}

function configPopupInputListener(event) {
    //this limits the input charater length to 1 char
    event.target.value = event.data.toUpperCase();
}

function configPopupButtonListener(event) {
    let actionTypes = [
      "game-config--save",
      "game-config--close",
      "game-config--open",
      "drill-config--save",
      "drill-config--close",
      "drill-config--open",
    ];
    let foundType = actionTypes.find(actionType => {
        return event.target.closest(`[data-action-type="${actionType}"]`);
    });
    let foundButton = event.target.closest(`[data-action-type="${foundType}"]`);

    if (foundButton) {
        switch (foundButton.dataset.actionType) {
            // Drill settings
            case "drill-config--save":
                configDrill();
            case "drill-config--close":
            case "drill-config--open":
                //close popup
                toggleDrillConfigPopup();
                break;

            // Key bindings settings
            case "game-config--save":
                //save controls
                configSaveArrowKeys();
                //NOTE: This is a intentional missing break as i want both the save and the popup close to happen due to there not being any more settings here
            case "game-config--close":
            case "game-config--open":
                //close popup
                toggleConfigPopup();
                break;
        }
    }
}

function configSaveArrowKeys() {
    CONFIG.arrowKeys = TEMPARROWKEYS;
    localStorage.setItem("CONFIG.arrowKeys", JSON.stringify(CONFIG.arrowKeys));
}

function configDrill() {
  // Get selected stratagems from drill config stratagem checkboxes
  let stratagemOptions = Array.from(DRILL_CONFIG_STRATAGEM_OPTIONS.getElementsByClassName(
      "game-config-popup__stratagem-option",
    ));
    let selectedStratagemNames = stratagemOptions
      .filter((node) => node.checked)
      .map((node) => node.dataset.stratagemName);
    let newSelectedStratagems = stratagems.filter((stratagem) => selectedStratagemNames.includes(stratagem.name));

    // Select random stratagems when none were selected
    if (newSelectedStratagems.length === 0) {
        loadRandomStratagems();
        refreshStratagemDisplay();
        return;
    }

    // Load selected stratagems
    seletecedStratagems = newSelectedStratagems;
    currentStratagemsList = [seletecedStratagems[0]];
    while (currentStratagemsList.length < CURRENT_STRATAGEM_LIST_LENGTH) {
        currentStratagemsList.push(pickNextStratagem());
    }
    refreshStratagemDisplay();
    localStorage.setItem("CONFIG.drillConfig", JSON.stringify(seletecedStratagems));
}

function configPopupKeydownListener(event) {
    let activeElement = document.activeElement;

    if (activeElement.tagName == "INPUT") {
        let excludedKeys = ["TAB", "ALT"];
        if (!excludedKeys.find((keyCode) => event.code.toUpperCase().includes(keyCode))) {
            TEMPARROWKEYS[activeElement.name] = event.code;
        }
    }
}


let configPopupEvents = [
    ["input", configPopupInputListener],
    ["keydown", configPopupKeydownListener]
];
function addConfigPopupListener() {
    configPopupEvents.forEach((event)=>{
        addEventListener(event[0], event[1]);
    })
}
function removeConfigPopupListener() {
    configPopupEvents.forEach((event)=>{
        removeEventListener(event[0], event[1]);
    })
}

function addMainGameListener() {
    addEventListener("keydown", mainGameKeyDownListener);
    addEventListener("click", configPopupButtonListener);
}
function removeMainGameListener() {
    removeEventListener("keydown", mainGameKeyDownListener);
}

function toggleDrillConfigPopup() {
    let popupCurrentState = DRILL_CONFIG_POPUP.classList.contains('active');

    if (popupCurrentState == true) {
        DRILL_CONFIG_POPUP.classList.remove('active');
        addMainGameListener();
    } else {
        DRILL_CONFIG_POPUP.classList.add('active');
        removeMainGameListener();
    }
}


function toggleConfigPopup() {
    let popupCurrentState = CONFIGPOPUP.classList.contains('active');

    if (popupCurrentState == true) {
        CONFIGPOPUP.classList.remove('active');
        addMainGameListener();
        removeConfigPopupListener();
    } else {
        CONFIGPOPUP.classList.add('active');
        initaliseConfigPopupInputs();
        removeMainGameListener();
        addConfigPopupListener();
        TEMPARROWKEYS = Object.assign({}, CONFIG.arrowKeys);
    }
}

function getConfigPopupInputs() {
    return CONFIGPOPUP.querySelectorAll('input[name][type=text]');
}

function initaliseConfigPopupInputs() {
    let inputs = getConfigPopupInputs();

    inputs.forEach((input)=>{
        let inputKey = Object.keys(CONFIG.arrowKeys).find((key)=>{
            return key.toLowerCase() == input.name.toLowerCase();
        });

        if (inputKey) {
            input.value = CONFIG.arrowKeys[inputKey].slice(-1).toUpperCase();
        }
    })
}
