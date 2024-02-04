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
    switch(keyCode){
        case "KeyW":
        case "KeyS":
        case "KeyA":
        case "KeyD":
            break;
        default: 
            console.log("Ignored Key");
            return;
    }

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