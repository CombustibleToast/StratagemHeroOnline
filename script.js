// Load sequence data
let stratagems = JSON.parse(data).list;
console.log(stratagems);

// Pick a random strategem
let currentStratagem = pickRandomStratagem();
console.log(currentStratagem);

// Set the strategem's picture
document.getElementById("current-strategem-icon").src = `./Images/Strategem Icons/${currentStratagem.image}`;

// Set arrow icons
showArrowSequence(currentStratagem.sequence);

//~~~//

function pickRandomStratagem(){
    return stratagems[Math.floor(Math.random() * stratagems.length)];
}

function showArrowSequence(arrowSequence){
    // Remove all table elements of old arrows
    let arrowsContainer = document.getElementById("arrows-container");
    arrowsContainer.innerHTML = '';
    
    //Create new arrow elements
    for(arrow of arrowSequence){
        let td = document.createElement("td");
        let img = document.createElement("img");
        td.appendChild(img);
        img.setAttribute("src", `./Images/Arrows/${arrow}`);
        arrowsContainer.appendChild(td);
    }
}