alert('hello world');

let userVisited = [];
const proximityCheckInterval = 1000; // Check every 1 second

//calculate distance in feet
function calculateDistance(lat1, lon1, lat2, lon2) {
    console.log ("calculateDistance(lat1: " + lat1 + ", long1:" +lon1 + " | lat2:" + lat2 + ", long2:" + lon2 + ")");
    const R = 20900999; // Radius in feet
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
}

//calculate the direction in degreese between two points
function calculateBearing(lat1, lon1, lat2, lon2) {
    console.log ("calculateBearing(lat1: " + lat1 + ", long1:" +lon1 + " | lat2:" + lat2 + ", long2:" + lon2 + ")");
    console.log ("lat1: " + lat1 + ", long1:" +lon1 + " | lat2:" + lat2 + ", long2:" + lon2);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    lat1 = lat1 * (Math.PI / 180);
    lat2 = lat2 * (Math.PI / 180);

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const bearing = Math.atan2(y, x) * (180 / Math.PI);
    return (bearing + 360) % 360;
}

function startListeningForOrientation() {
    console.log("In Function startListeningForOrientation...");
    if (window.DeviceOrientationEvent) {
        window.addEventListener("deviceorientation", (event) => {
            //Device Orientation is alpha
            const { alpha, beta, gamma } = event;
            document.getElementById("device_orientation_alpha").textContent = `${alpha !== null ? alpha.toFixed(2) : ""}`;
        });
    } else {
        console.error("DeviceOrientationEvent is not supported on this device.");
    }
    console.log("...Exiting Function startListeningForOrientation");
}

function updateDisplay()
{
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLon = position.coords.longitude;
                const distToTarget = calculateDistance(userLat, userLon, locationData.lat, locationData.lon);
                const bearingToTarget = calculateBearing(userLat, userLon, locationData.lat, locationData.lon);

                //hold values in case needed
                document.getElementById("current_lattitude").innerText = userLat.toFixed(0);
                document.getElementById("current_longitude").innerText = userLon.toFixed(0);
                document.getElementById("distance_to_target").innerText = distToTarget.toFixed(0); //only one also displayed
                document.getElementById("bearing_to_target").innerText = bearingToTarget.toFixed(0);

                //Check for an alpha value if supported on device or permission granted by user
                const alpha = document.getElementById("device_orientation_alpha").textContent;
                const alphaNumber = parseFloat(alpha);

                console.log('distanceToTarget=${distToTarget}, bearingToTarget=${bearingToTarget}, alpha=${alphaNumber}');

                //Calculate the direction offset
                if (!isNaN(bearingToTarget) && ((alphaNumber != null) && !isNaN(alphaNumber)))
                {
                    console.log ("both bearing_to_target and alpha are valid number.  CALCULATING DIRECTION OFFSET...");
                    document.getElementById("direction_offset").innerText = (bearingToTarget - alphaNumber).toFixed(0);
                    console.log ("...Finished calculating CALCULATING DIRECTION OFFSET");
                }
                else if (!isNaN(bearingToTarget) && !((alphaNumber != null) && !isNaN(alphaNumber)))
                {
                    console.log ("bearing_to_target is good, alpha is not valid.  CALCULATING DIRECTION OFFSET...");
                    document.getElementById("direction_offset").innerText = bearingToTarget.toFixed(0);
                    console.log ("...Finished calculating CALCULATING DIRECTION OFFSET");
                }
                else if (isNaN(bearingToTarget) && ((alphaNumber != null) && !isNaN(alphaNumber)))
                {
                    console.log ("bearing_to_target is not good, alpha is valid.  CALCULATING DIRECTION OFFSET...");
                    document.getElementById("direction_offset").innerText = alpha.toFixed(0);
                    console.log ("...Finished calculating CALCULATING DIRECTION OFFSET");
                } else
                {
                    console.log("SOMETHING WRONG.  Both bearing_to_target and alpha are bad.");
                }

                //if (distToTarget <= targetProximity2) {
                if (distToTarget <= locationData.proximity2) {
                    console.log("WITHIN PROXIMITY 2 -- REALLY CLOSE");
                    document.getElementById("clue").innerText = secondClue;
               // } else if (distToTarget <= targetProximity1) {
                } else if (distToTarget <= locationData.proximity1) {
                    console.log("WITHIN PROXIMITY 1 -- APPROACHING DESTINATION");
                    document.getElementById("clue").innerText = firstClue;
                }
            },
            (error) => {
                console.error("Geolocation error:", error);
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
                    console.log("Permission granted!");
                    startListeningForOrientation();
                } else {
                    console.log("Permission denied.");
                }
            })
            .catch((error) => console.error("Error requesting permission:", error));
    } else {
        // If requestPermission is not supported
        console.log("requestPermission is not supported on this browser.");
        startListeningForOrientation();
    }
    //this.style.display = "none"; // Hides the button
});

setInterval(updateDisplay, proximityCheckInterval);
