let userVisited = [];
const proximityCheckInterval = 1000; // Check every 1 second
let watchId = null;
let debugDistance = 0;

//handle all the display
function updateDisplay(){

    //get target
    const targetLatNum = locationData.lat;
    const targetLonNum = locationData.lon;
    const proximity1Num = parseFloat(locationData.proximity1);
    const proximity2Num = parseFloat(locationData.proximity2);

    // Read current Latitude
    const currentLatElement = document.getElementById("current-latitude");
    const currentLatText = currentLatElement.innerText;
    const currentLatNum = parseFloat(currentLatText);
    if (isNaN(currentLatNum))
        debug ("Current Latitude is not a number !!", 1);

    // Read current Longitude
    const currentLonElement = document.getElementById("current-longitude");
    const currentLonText = currentLonElement.innerText;
    const currentLonNum = parseFloat(currentLonText);
    if (isNaN(currentLonNum))
        debug ("Current Longitude is not a number !!",1);

    // Calculate distance to target and update the UI
    const distanceToTarget = calculateDistance(currentLatNum, currentLonNum, targetLatNum, targetLonNum);
    document.getElementById("distance-to-target").innerText = distanceToTarget.toFixed(0);

    const bearingToTarget = calculateBearing(currentLatNum, currentLonNum, targetLatNum, targetLonNum);
    const alphaElement = document.getElementById("device-orientation-alpha");
    const alphaNumber = parseFloat(alphaElement.innerText);
    const directionOffset = calculateDirectionOffset(bearingToTarget, alphaNumber);

    setArrowRotation(directionOffset);

    //set direction offset
    msg = bearingToTarget.toFixed(0) + " | " + alphaNumber.toFixed(0);
    document.getElementById("div-debug").innerText = bearingToTarget.toFixed(0);
    document.getElementById("direction-offset").innerText = bearingToTarget.toFixed(0) + " | " + alphaNumber.toFixed(0);//directionOffset.toFixed(0);

    /////////////////

    const clueDisplayElement = document.getElementById('clue-display');
    const magicKeyDisplayElement = document.getElementById('magic-display');
    //const magicKeyInput = document.getElementById('magic_key_input');
    //const magicKeyButton = document.getElementById('magic_key_submit');

    if ( distanceToTarget <= proximity2Num ) {
        //alert('second clue=' + locationData);
        clueDisplayElement.textContent = locationData.second_clue;
        clueDisplayElement.display = 'block';
        magicKeyDisplayElement.style.display = 'block';

    }
    else if ( distanceToTarget <= proximity1Num ) {
       // alert('first clue=' + locationData);
        clueDisplayElement.textContent = locationData.first_clue;
        clueDisplayElement.style.display = 'block';
    }
    else {
        clueDisplayElement.style.display = 'none';
        magicKeyDisplayElement.style.display = 'none';
    }

}

//calculate distance in feet
function calculateDistance(lat1, lon1, lat2, lon2) {
    if (debugDistance != 0)
        return debugDistance;

    debug ("CALCULATING DISTANCE...", 1);
    debug (`Inputs: ${lat1}, ${lon1}, ${lat2}, ${lon2}`, 1);
    const R = 20900999; // Radius in feet
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    debug ("...FINISHED CALCULATING DISTANCE", 1);
    return Math.round(R * c);
}

//calculate the direction in degreese between two points
function calculateBearing(lat1, lon1, lat2, lon2) {
    debug ("CALCULATE BEARING...", 1);
    debug (`INPUTS: ${lat1}, ${lon1}, ${lat2}, ${lon2}`,1);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    lat1 = lat1 * (Math.PI / 180);
    lat2 = lat2 * (Math.PI / 180);

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const bearing = Math.atan2(y, x) * (180 / Math.PI);
    debug ("...FINSIHED CALCULATING BEARING",1 );
    return (bearing + 360) % 360;
}

function calculateDirectionOffset(bearing, alpha){
    //bearing is the direction from current location to target location
    //alpha is the direction the phone is pointing
    if (!isNaN(bearing) && !isNaN(alpha)) {
        return (alpha - bearing);
    } else if (!isNaN(bearing)) {
        return(bearing);
    } else if (!isNaN(alpha)) {
        return (alpha);
    } else {
        debug("Both bearing and alpha are invalid.",1);
        return 0;
    }
}

function startOrientationListening() {
    debug("In Function startOrientationListening...", 5);

    const handleOrientation = (event) => {
        debug("handleOrientation start", 5);
        const { alpha, beta, gamma } = event;

        const alphaElement = document.getElementById("device-orientation-alpha");
        if (alphaElement) {
            alphaElement.textContent = `${alpha != null ? alpha : "0"}`;
        } else {
            debug("Element 'device-orientation-alpha' not found.", 5);
        }

        const betaElement = document.getElementById("device-orientation-beta");
        if (betaElement) {
            betaElement.textContent = `${beta != null ? beta : "0"}`;
        } else {
            debug("Element 'device-orientation-beta' not found.", 5);
        }

        const gammaElement = document.getElementById("device-orientation-gamma");
        if (gammaElement) {
            gammaElement.textContent = `${gamma != null ? gamma : "0"}`;
        } else {
            debug("Element 'device-orientation-gamma' not found.",5);
        }

        debug("handleOrientation end", 5);
    };

    if ("DeviceOrientationEvent" in window) {
        debug("DeviceOrientationEvent is supported!", 5);

        if (typeof DeviceOrientationEvent.requestPermission === "function") {
            // For iOS Safari
            DeviceOrientationEvent.requestPermission()
                .then((response) => {
                    if (response === "granted") {
                        window.addEventListener("deviceorientation", handleOrientation);
                        debug("DeviceOrientationEvent listener added.", 5);
                    } else {
                        debug("DeviceOrientation permission denied.", 5);
                    }
                })
                .catch((error) => {
                    console.error("Error requesting DeviceOrientation permission:", error);
                });
        } else {
            // For other browsers
            window.addEventListener("deviceorientation", handleOrientation);
            console.log("DeviceOrientationEvent listener added.");
        }
    } else {
        console.error("DeviceOrientationEvent is not supported on this device/browser.");
    }

    debug("...Exiting Function startOrientationListening", 5);
}

function startPositionWatching() {
    debug ("In startPositionWatching", 3);
    if (navigator.geolocation) {
        watchId = navigator.geolocation.watchPosition(
            (position) => {
                debug ("in watchPosition", 3);
                const currentLatElement = document.getElementById("current-latitude");
                if (currentLatElement) {
                    currentLatElement.innerText = position.coords.latitude;
                    debug ("current lat = " + position.coords.latitude, 3);
                } else {
                    debug("Element 'current-latitude' not found.", 3);
                }

                const currentLonElement = document.getElementById("current-longitude");
                if (currentLonElement) {
                    currentLonElement.innerText = position.coords.longitude;
                    debug ("current lon = " + position.coords.longitude, 3);
                } else {
                    debug("Element 'current-longitude' not found.", 3);
                }
            },
            (error) => {
                console.error("Geolocation error code:", error.code);
                console.error("Geolocation error message:", error.message);
            },
            { enableHighAccuracy: true }
        );
    } else {
        debug ("Geolocation is not supported by your browser. XXX", 5);
    }
}

document.querySelector("#request-permission-button").addEventListener("click", () => {
    ////don't hide the button.  Turn on updates.
    //document.getElementById("request-permission-button").style.display = "none"; // Hides the button


    if (typeof DeviceOrientationEvent.requestPermission === "function") {
        debug ("requesting permission...", 5);

        // If requestPermission is supported
        DeviceOrientationEvent.requestPermission()
            .then((state) => {
                if (state === "granted") {
                    debug("Device Permission granted!", 5);
                    startOrientationListening();
                } else {
                    debug("Device Permission denied.", 5);
                }
            })
            .catch((error) => console.error("Error requesting permission:", error));
    } else {
        // If requestPermission is not supported
        debug("requestPermission is not supported on this browser.", 5);
        startOrientationListening();
    }
});

function stopOrientationListening() {
    if (handleOrientation) {
        window.removeEventListener("deviceorientation", handleOrientation);
        console.log("DeviceOrientationEvent listener removed.");
    } else {
        console.error("No listener to remove.");
    }
}

function stopPositionWatching() {
    if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId); // Stop the listener
        console.log("Position watching stopped. watchId:", watchId);
        watchId = null; // Reset the watchId
    } else {
        console.error("No active geolocation watcher to stop.");
    }
}

function debug(msg, priority){
    if (priority!=6)
    {
        console.log (msg);
    }
    else
    {
        const debug_element = document.getElementById("debug");
        debug_element.innerHTML += msg + "<br>";

    }
}

startPositionWatching();
setInterval(updateDisplay, proximityCheckInterval);


document.getElementById('magic-key-submit').addEventListener('click', function (event) {
    event.preventDefault();  //prevent default button behavior

    const userInputElement = document.getElementById('magic-key-input');
    const userInput = userInputElement.value;

    fetch('/submit_key', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ key: userInput }), // Send the clue as JSON
    })
        .then((response) => response.json())
        .then((data) => {
            if (data.success) {
                window.location.href = data.next; // Redirect to the server provided url
            } else {
                alert(data.message); // Show error message
            }
        })
        .catch((error) => {
            console.error('Error:', error);
        });
});

document.getElementById('debug-button').addEventListener('click', function(){
    if (debugDistance == 0)
        debugDistance = 49;
    else if (debugDistance == 49)
        debugDistance = 8;
    else
        debugDistance = 0;
});


//0 = arrow pointing up.  90 = arrow pointing to the right
function setArrowRotation(angle) {
    const svgElement = document.querySelector('#request-permission-button svg');
    svgElement.style.transform = `rotate(${angle}deg)`;
}