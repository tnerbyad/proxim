let userVisited = [];
const proximityCheckInterval = 1000; // Check every 1 second

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

function startListeningForOrientation() {
    debug("In Function startListeningForOrientation...", 1);

    const handleOrientation = (event) => {
        const { alpha, beta, gamma } = event;

        const alphaElement = document.getElementById("device_orientation_alpha", 1);
        if (alphaElement) {
            alphaElement.textContent = `${alpha != null ? alpha.toFixed(2) : ""}`;
        } else {
            console.error("Element 'device_orientation_alpha' not found.");
        }

        const betaElement = document.getElementById("device_orientation_beta");
        if (betaElement) {
            betaElement.textContent = `${beta != null ? beta.toFixed(2) : ""}`;
        } else {
            console.error("Element 'device_orientation_beta' not found.");
        }

        const gammaElement = document.getElementById("device_orientation_gamma");
        if (gammaElement) {
            gammaElement.textContent = `${gamma != null ? gamma.toFixed(2) : ""}`;
        } else {
            console.error("Element 'device_orientation_gamma' not found.");
        }
    };

    if (window.DeviceOrientationEvent) {
        window.removeEventListener("deviceorientation", handleOrientation); // Prevent duplicate listeners
        window.addEventListener("deviceorientation", handleOrientation);
    } else {
        console.error("DeviceOrientationEvent is not supported on this device.");
    }

    debug ("...Exiting Function startListeningForOrientation", 1);
}

function updateDisplay() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLon = position.coords.longitude;

                if (!locationData) {
                    console.error("Location data is not available.");
                    return;
                }

                const distToTarget = calculateDistance(userLat, userLon, locationData.lat, locationData.lon);
                const bearingToTarget = calculateBearing(userLat, userLon, locationData.lat, locationData.lon);

                //for debugging
                if (debug_dist != 0)
                {
                    debug("in debug_dist check (script.js)");
                    distToTarget = debug_dist;
                }

                document.getElementById("current_lattitude").innerText = userLat.toFixed(0);
                document.getElementById("current_longitude").innerText = userLon.toFixed(0);
                document.getElementById("distance_to_target").innerText = distToTarget.toFixed(0);
                document.getElementById("bearing_to_target").innerText = bearingToTarget.toFixed(0);

                const alphaText = document.getElementById("device_orientation_alpha").textContent;
                const alphaNumber = parseFloat(alphaText);
                let direction_offset = 0;

                if (!isNaN(bearingToTarget) && !isNaN(alphaNumber)) {
                    direction_offset = bearingToTarget - alphaNumber;
                } else if (!isNaN(bearingToTarget)) {
                    direction_offset = bearingToTarget;
                } else if (!isNaN(alphaNumber)) {
                    direction_offset = alphaNumber;
                } else {
                    debug("Both bearing and alpha are invalid.",1);
                }
                document.getElementById("direction_offset").innerText = direction_offset.toFixed(0);

                const clueElement = document.getElementById("clue");

                debug ("proximity1=" + locationData.proximity1 + " | proximity2=" + locationData.proximity2, 0);
                if (distToTarget <= locationData.proximity2) {
                    debug ("in proximity 2 code", 0);
                    //really close, show final clue and text box and
                    clueElement.innerText = locationData.second_clue;
                    const clue_div = document.getElementById("div_magic_input");

                    // Change the style of the div
                    clueElement.style.display = "block";

                } else if (distToTarget <= locationData.proximity1) {
                    clueElement.getElementById("clue").innerText = locationData.first_clue;
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

document.getElementById("requestPermissionButton").addEventListener("click", function() {
    this.style.display = "none"; // Hides the button
});

document.querySelector("#requestPermissionButton").addEventListener("click", () => {
    if (typeof DeviceOrientationEvent.requestPermission === "function") {
        // If requestPermission is supported
        DeviceOrientationEvent.requestPermission()
            .then((state) => {
                if (state === "granted") {
                    console.log("Device Permission granted!", 1);
                    startListeningForOrientation();
                } else {
                    debug("Device Permission denied.", 1);
                }
            })
            .catch((error) => console.error("Error requesting permission:", error));
    } else {
        // If requestPermission is not supported
        debug("requestPermission is not supported on this browser.", 1);
        startListeningForOrientation();
    }
});

setInterval(updateDisplay, proximityCheckInterval);


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
        debug_element.innerHTML = msg + "<br>" + curText;

    }
}
