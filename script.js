// Load strategem data
let stratagems = JSON.parse(data).list;
console.log(stratagems);

// Install keypress listener
addEventListener("keydown", (event) => {
    if (event.isComposing || event.code === 229) {
        return;
    }
    keypress(event.code);
});

let currentStrategemDone = true;
let currentSequenceIndex = 0;
var currentArrowSequenceTags = undefined;

// Load first strategem
loadNextStrategem();

//~~~//

function keypress(code){
    // Guard clause; don't do anything if there's no active strategem
    if(currentStrategemDone)
        return;

    // Map the keypress to the arrow filename; ignore invalid keypresses
    let pressedKeyFilename = undefined;
    switch(code){
        case "KeyW":
            pressedKeyFilename = "Arrow_4_U.png";
            break;
        case "KeyS":
            pressedKeyFilename = "Arrow_1_D.png";
            break;
        case "KeyA":
            pressedKeyFilename = "Arrow_2_L.png";
            break;
        case "KeyD":
            pressedKeyFilename = "Arrow_3_R.png";
            break;
        default: 
            console.log("Ignored Key");
    }

    // Check the keypress against the current sequence
    if(pressedKeyFilename == currentArrowSequenceTags[currentSequenceIndex].code){
        //Success, apply the success
        //TODO: Set currentArrowSequenceTags[currentSequenceIndex] to completed color
        currentSequenceIndex++;
        console.log("Correct!");
        
        //Check if that success completes the entire sequence. 
        if(currentSequenceIndex == currentArrowSequenceTags.length){
            console.log("Strategem done, loading next");
            currentSequenceIndex = 0;
            loadNextStrategem();
        }
    }
    else{
        //Failure, reset progress
        //TODO: Set all currentArrowSequenceTags to normal color and play some kind of failure animation
        currentSequenceIndex = 0;
        console.log("Fail!");
    }
}

function loadNextStrategem(){
    // Pick a random strategem
    let currentStratagem = pickRandomStratagem();
    console.log(currentStratagem);

    // Set the strategem's picture
    document.getElementById("current-strategem-icon").src = `./Images/Strategem Icons/${currentStratagem.image}`;

    // Show arrow icons
    // Sequence list is global for use in the keypress event
    currentArrowSequenceTags = showArrowSequence(currentStratagem.sequence);

    currentStrategemDone = false;
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
        // img.setAttribute("code", arrow);
        img.code = arrow;
        arrowsContainer.appendChild(td);
        arrowTags.push(img);
    }
    return arrowTags;
}

async function sleep(ms){
    await new Promise(r => setTimeout(r, ms));
}