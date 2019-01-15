/*jslint browser:true */
/*global Audio: false */
/*jslint devel: true */
/*global ActiveXObject: false */

var textArray = [];
var gameOn = false;
var blurred = true;
var PREFIX = "<mark>";
var SUFFIX = "</mark>";
var preSpan = "";
var postSpan;
var highlightedChar;
var startTime;
var typed_entries = 0;
var errors = 0;
var netWPM = 0;
var x = 5, y = 145, x2, y2;

//Blurs writing box
function blurWritingBox() {
    "use strict";
    blurred = true;
    if (document.getElementById("swedish").checked === true) {
        document.getElementById("writingbox").value = "Skriv här...";
    } else {
        document.getElementById("writingbox").value = "Type here...";
    }

}

// Loads the text box with title, author and text to be written. Also stops any game currently in progress
// and blurs the writing box, this to avoid bugs if game is already in progress and we switch from english to swedish
// or we change text in the dropdown menu without first quitting current game.
function loadTextBox() {
    "use strict";
    var mySelect = document.getElementById("text"), i, idx, len = mySelect.length, len2 = textArray.length;
    for (i = 0, len; i < len; i += 1) {
        if (mySelect[i].selected === true) {
            for (idx = 0, len2; idx < len2; idx += 1) {
                if (textArray[idx].title === mySelect[i].text) {
                    document.getElementById("h1title").innerHTML = textArray[idx].title;
                    document.getElementById("h2author").innerHTML = textArray[idx].author + " (" + textArray[idx].text.split(" ").length + " words, " + textArray[idx].text.length + " chars)";
                    document.getElementById("textToSpeedWrite").innerHTML = textArray[idx].text;
                    break;
                }
            }
            break;
        }
    }
    blurWritingBox();
    document.getElementById("startstopbutton").innerHTML = '<img src="./img/play.png" />';
    stopGame();
    postSpan = document.getElementById("textToSpeedWrite").innerHTML;
}

//Adds the titles available for selected language to the dropdown menu
function loadTexts() {
    "use strict";
    var i = 0, len = textArray.length, idCounter = 0, mySelect, option;
    document.getElementById("text").options.length = 0;
    for (i, len; i < len; i += 1) {
        //Sort out non-swedish texts when swedish iFs checked
        if (document.getElementById("swedish").checked === true && textArray[i].language !== "swedish") {
            continue;
        }
        //Sort out non-english texts when english is checked
        if (document.getElementById("english").checked === true && textArray[i].language !== "english") {
            continue;
        }

        mySelect = document.getElementById("text");
        option = document.createElement("option");
        option.text = textArray[i].title;
        option.value = idCounter;
        idCounter += 1;
        mySelect.add(option);
    }
    loadTextBox();
}

//Gives writing box focus and removes text inside the writing box. Used when starting a game to be able
//to get a flying start in the game and not having to first click the play-button and then click the writing box.
function focusWritingBox() {
    "use strict";
    blurred = false;
    document.getElementById("writingbox").focus();
    document.getElementById("writingbox").value = "";
}

//Stops the game and resets the game values
function stopGame() {
    "use strict";
    gameOn = false;
    preSpan = "";
    typed_entries = 0;
    errors = 0;
    netWPM = 0;
    x = 5, y = 145, x2 = 0, y2 = 0;
}

//Draws the diagram inside the canvas.
function drawSpeedGauge(elapsed_seconds) {
    "use strict";
    if(gameOn === false) {
        return;
    }
    let canvas = document.getElementById("speedstatistics");
    let context = canvas.getContext("2d");

    //x2 and y2 are the old points from which the current stat-line should start from.
    x2 = x;
    y2 = y;

    //x and y is to where the line should be drawn, the line is drawn horizontally by 2 pixels per second in the game,
    //and the line is drawn vertically based on words per minute.
    x = 5 + elapsed_seconds * 2;
    y = 145 - netWPM;
    context.beginPath();
    context.moveTo(x2, y2);
    context.lineTo(x, y);

    //Make different WPM-values have different colors
    //0-30 = green, 31-60 = yellow, 61-90 = orange, 90+ = red
    if(netWPM <= 30) {
        context.strokeStyle = "green";
    }
    else if(netWPM > 30 && netWPM <= 60) {
        context.strokeStyle = "yellow";
    }
    else if(netWPM > 60 && netWPM <= 90) {
        context.strokeStyle = "orange";
    }
    else if(netWPM > 90) {
        context.strokeStyle = "red";
    }
    context.stroke();
    context.closePath();
}

//Checks which button the user pushed
function checkCharInput(e) {
    "use strict";
    var audioError = new Audio('./audio/ding.wav'), keyCode, tmpHighlight, tmpChar, elapsed_minutes, elapsed_seconds, grossWPM;

    //Alert player that game is done and stop the game
    if (postSpan.length === 0) {
        alert("Game is finished!");
        stopGame();
        return;
    }

    //Don't register keys that occurs while game is not live or the text-window is not in focus
    if (gameOn === false || blurred === true) {
        return;
    }

    //Register which key was pressed
    keyCode = e.which;
    typed_entries += 1;

    //Remove writing box text when space is pressed
    if (keyCode === 32) {
        document.getElementById("writingbox").value = "";
    }

    //If ignore case-button is pressed, then ignore case sensitivity (duh...)
    if (document.getElementById("ignorecase").checked === true) {
        tmpHighlight = highlightedChar;
        tmpChar = String.fromCharCode(keyCode).toLowerCase();
        keyCode = tmpChar.charCodeAt(0);
        highlightedChar = highlightedChar.toLowerCase();

        //Correct key. Uses the stored char to not change the main text to lowercase if it were uppercase to begin with
        if (keyCode === highlightedChar.charCodeAt(0)) {
            highlightedChar = tmpHighlight;
            preSpan += "<span style='color: dimgray'>" + highlightedChar + "</span>";
        }
        //If the key pressed was wrong, make text color red and register error (also uses the stored char to not change
        //the main text to lowercase if it were uppercase to begin with)
        else {
                highlightedChar = tmpHighlight;
                errors += 1;
                audioError.play();
                preSpan += "<span style='color: red'>" + highlightedChar + "</span>";
            }
    }

    //If ignore case-button is not pressed, treat every char with case sensitivity
    else {
        //If the key pressed was correct
            if (keyCode === highlightedChar.charCodeAt(0)) {
                preSpan += "<span style='color: dimgray'>" + highlightedChar + "</span>";
            }
        //If the key pressed was wrong, make text color red and register error
        else {
                    errors += 1;
                    audioError.play();
                    preSpan += "<span style='color: red'>" + highlightedChar + "</span>";
                }
        }
    highlightedChar = postSpan.substr(0, 1);
    postSpan = postSpan.substring(1);
    document.getElementById("textToSpeedWrite").innerHTML = preSpan + PREFIX + highlightedChar + SUFFIX + postSpan;

    //Calculate minutes/seconds/WPM
    elapsed_minutes = new Date().getTime() / 60000 - (startTime.getTime() / 60000);
    elapsed_seconds = elapsed_minutes*60;
    grossWPM = ((typed_entries / 5) / elapsed_minutes);
    netWPM = grossWPM - (errors / 5 / elapsed_minutes);

    //Print statistics
    document.getElementById("grosswpm").innerHTML = "Gross WPM: " + Math.round(grossWPM);
    document.getElementById("accuracy").innerHTML = "Accuracy: " + Math.round(((typed_entries - errors) / typed_entries) * 100) + "%";
    document.getElementById("netwpm").innerHTML = "Net WPM: " + Math.round(netWPM);
    document.getElementById("errors").innerHTML = "Errors: " + errors;

    //Draw statistics line
    drawSpeedGauge(elapsed_seconds);
}

//Start the game. This is triggered when the 'play'-button is pressed
function playGame() {
    "use strict";

    //Initialize values
    postSpan = document.getElementById("textToSpeedWrite").innerHTML;
    highlightedChar  = postSpan.substr(0, 1);
    postSpan = postSpan.substring(1);
    document.getElementById("textToSpeedWrite").innerHTML = preSpan + PREFIX + highlightedChar + SUFFIX + postSpan;
    gameOn = true;

    //Set starting time to the time the button was pressed
    startTime = new Date();

    document.getElementById("grosswpm").innerHTML = "Gross WPM: ";
    document.getElementById("accuracy").innerHTML = "Accuracy: %";
    document.getElementById("netwpm").innerHTML = "Net WPM: ";
    document.getElementById("errors").innerHTML = "Errors: ";

    drawCanvas();
}

//Toggles what happens when you press the start/stop-button
function startStopButton() {
    "use strict";
    //get image source for the button
    var img = document.getElementById("startstopbutton").innerHTML;

    //If button is pressed while it's in "stopped mode" we start the game, change the icon and put focus on the writing box
    if (img.indexOf("play.png") !== -1) {
        loadTextBox();
        document.getElementById("startstopbutton").innerHTML = '<img src="./img/stop.png" />';
        gameOn = true;
        focusWritingBox();
        playGame();
    }
    //If button is pressed while it's in "game mode" we stop the game and change the icon
    else if (img.indexOf("stop.png") !== -1) {
        document.getElementById("startstopbutton").innerHTML = '<img src="./img/play.png" />';
        gameOn = false;
        stopGame();
    }
}

//Called from loadXML, reads and adds the texts from the xml-file to the textArray
function readXML(xml) {
    "use strict";
    var x, i, xmlDoc, title, author, language, text;
    xmlDoc = xml.responseXML;
    x = xmlDoc.getElementsByTagName("poem");
    for (i = 0; i < x.length; i += 1) {
        title  = x[i].getElementsByTagName("title")[0].childNodes[0].nodeValue;
        author = x[i].getElementsByTagName("author")[0].childNodes[0].nodeValue;
        language = x[i].getElementsByTagName("language")[0].childNodes[0].nodeValue;
        text = x[i].getElementsByTagName("text")[0].childNodes[0].nodeValue;
        textArray.push(
            {
                title: title,
                author: author,
                language: language,
                text: text
            }
        );
    }
}

//Uses XMLHttpRequest to open an XML file from a web server
function loadXML() {
    "use strict";
    var xmlhttp;
    if (window.XMLHttpRequest) {
        xmlhttp = new XMLHttpRequest();
    } else {
        // code for older browsers
        xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
    }
    xmlhttp.onreadystatechange = function () {
        if (this.readyState === 4 && this.status === 200) {
            readXML(this);
        }
    };
    xmlhttp.open("GET", "http://studenter.miun.se/~mova1701/project/texts.xml", true);
    xmlhttp.send();
}

//Initializes textArray with loadXML and loads the texts to dropdown-list and fills the text box
function initializeArray() {
    "use strict";
    loadXML();
    setTimeout(loadTexts, 50);
}

//Creates events
function createEvents() {
    "use strict";
    document.getElementById("swedish").addEventListener("click", loadTexts, false);
    document.getElementById("english").addEventListener("click", loadTexts, false);
    document.getElementById("startstopbutton").addEventListener("click", startStopButton, false);
    document.getElementById("writingbox").addEventListener("focus", focusWritingBox, false);
    document.getElementById("writingbox").addEventListener("blur", blurWritingBox, false);
    document.getElementById("ignorecase").addEventListener("click", focusWritingBox, false);
    var mySelect = document.getElementById("text");
    mySelect.onchange = loadTextBox;
}

//Draws the static canvas parts, i.e. the black area, the white 'border'-rectangle and the horizontal measurement lines
function drawCanvas() {
    "use strict";
    let canvas = document.getElementById("speedstatistics");
    let context = canvas.getContext("2d");
    context.fillStyle = "black";
    context.fillRect(0, 0, 300, 150);

    context.strokeStyle = "white";
    context.strokeRect(5, 5, 290, 140);

    context.beginPath();
    context.moveTo(6.5, 33.5);
    context.lineTo(293.5, 33.5);
    context.strokeStyle = '#363636';
    context.stroke();

    context.moveTo(6.5, 61.5);
    context.lineTo(293.5, 61.5);
    context.stroke();

    context.moveTo(6.5, 89.5);
    context.lineTo(293.5, 89.5);
    context.stroke();

    context.moveTo(6.5, 117.5);
    context.lineTo(293.5, 117.5);
    context.stroke();
    context.closePath();
}

//Add load events
window.addEventListener("load", initializeArray, false);
window.addEventListener("load", createEvents, false);
window.addEventListener("load", drawCanvas, false);
window.addEventListener("keypress", checkCharInput, false);