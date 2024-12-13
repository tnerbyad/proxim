let userVisited = [];
const proximityCheckInterval = 1000; // Check every 1 second

//handle all the display
function updateDisplay(){

    //get target
    const targetLatNum = locationData.lat;
    const targetLonNum = locationData.lon

    // Read current Latitude
    const currentLatElement = document.getElementbyId("current_latitude");
    const currentLatText = currentLatElement.innerText;
    const currentLatNum = parseFloat(currentLatText);
    if (isNaN(currentLatNum))
        debug ("Current Latitude is not a number !!");

    // Read current Longitude
    const currentLonElement = document.getElementbyId("current_longitude");
    const currentLonText = currentLatElement.innerText;
    const currentLonNum = parseFloat(currentLatText);
    if (isNaN(currentLonNum))
        debug ("Current Longitude is not a number !!");

    // Calculate distance to target and update the UI
    const distanceToTarget = calculateDistance(currentLatNum, currentLonNum, targetLatNum, targetLonNum);
    document.getElementById("distance_to_target").innerText = distanceToTarget.toFixed(0);

    const bearingToTarget = calculateBearing(currentLatNum, currentLonNum, targetLatNum, targetLonNum);
    const alphaElement = document.getElementById("device_orientation_alpha");
    const alphaNumber = parseFloat(alphaElement.innerText);
    const directionOffset = calculateDirectionOffset(bearingToTarget, alphaNumber);

    //set direction offset
    document.getElementById("direction_offset").innerText = directionOffset.toFixed(0);






    const clueElement = document.getElementById("clue");
    const magic_div = document.getElementById("div_magic_input");

    const distToTarget = calculateDistance(userLat, userLon, locationData.lat, locationData.lon);
                const bearingToTarget = calculateBearing(userLat, userLon, locationData.lat, locationData.lon);

}

//calculate distance in feet
function calculateDistance(lat1, lon1, lat2, lon2) {
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
        return (bearingToTarget - alphaNumber);
    } else if (!isNaN(bearing)) {
        return(bearing);
    } else if (!isNaN(alphaNumber)) {
        return (alpha);
    } else {
        debug("Both bearing and alpha are invalid.",1);
        return 0;
    }
}

function startOrientationListening() {
    debug("In Function startOrientationListening...", 1);

    const handleOrientation = (event) => {
        const { alpha, beta, gamma } = event;

        const alphaElement = document.getElementById("device_orientation_alpha", 1);
        if (alphaElement) {
            alphaElement.textContent = `${alpha != null ? alpha : "0"}`;
        } else {
            console.error("Element 'device_orientation_alpha' not found.");
        }

        const betaElement = document.getElementById("device_orientation_beta");
        if (betaElement) {
            betaElement.textContent = `${beta != null ? beta : "0"}`;
        } else {
            console.error("Element 'device_orientation_beta' not found.");
        }

        const gammaElement = document.getElementById("device_orientation_gamma");
        if (gammaElement) {
            gammaElement.textContent = `${gamma != null ? gamma : "0"}`;
        } else {
            console.error("Element 'device_orientation_gamma' not found.");
        }
    };

    /*if (window.DeviceOrientationEvent) {
        window.removeEventListener("deviceorientation", handleOrientation); // Prevent duplicate listeners
        window.addEventListener("deviceorientation", handleOrientation);
    } else {
        console.error("DeviceOrientationEvent is not supported on this device.");
    }*/

    debug ("...Exiting Function startOrientationListening", 1);
}


function startPositionWatching() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                const currentLatElement = document.getElementById("current_latitude");
                if (currentLatElement) {
                    currentLatElement.innerText = position.coords.latitude;
                } else {
                    console.error("Element 'current_latitude' not found.");
                }

                const currentLonElement = document.getElementById("current_longitude");
                if (currentLonElement) {
                    currentLonElement.innerText = position.coords.longitude;
                } else {
                    console.error("Element 'current_longitude' not found.");
                }
            },
            (error) => {
                console.error("Geolocation error code:", error.code);
                console.error("Geolocation error message:", error.message);
            },
            { enableHighAccuracy: true }
        );
    } else {
        console.error("Geolocation is not supported by your browser.");
    }
}

document.querySelector("#requestPermissionButton").addEventListener("click", () => {
    this.style.display = "none"; // Hides the button
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
        // If requestPermission is supported
        DeviceOrientationEvent.requestPermission()
            .then((state) => {
                if (state === "granted") {
                    console.log("Device Permission granted!", 1);
                    startOrientationListening();
                } else {
                    debug("Device Permission denied.", 1);
                }
            })
            .catch((error) => console.error("Error requesting permission:", error));
    } else {
        // If requestPermission is not supported
        debug("requestPermission is not supported on this browser.", 1);
        startOrientationListening();
    }
});


function debug(msg, priority){
    if (priority==1)
    {
        console.log (msg);
    }
    else
    {
        const debug_element = document.getElementById("debug");
        const curText = debug_element.innerHTML;
        if (curText.length>3000)
            curText.innerHTML="";
        //debug_element.innerHTML = msg + "<br>" + curText;

    }
}

startPositionWatching();
setInterval(updateDisplay, proximityCheckInterval);

//navigator.geolocation.clearWatch - to stop