alert('pizza');

let userVisited = [];
const proximityCheckInterval = 1000; // Check every 1 second

//calculate distance in feet
function calculateDistance(lat1, lon1, lat2, lon2) {
    console.log ("CALCULATING DISTANCE...");
    console.log (`Inputs: ${lat1}, ${lon1}, ${lat2}, ${lon2}`);
    const R = 20900999; // Radius in feet
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    console.log ("...FINISHED CALCULATING DISTANCE");
    return Math.round(R * c);
}

//calculate the direction in degreese between two points
function calculateBearing(lat1, lon1, lat2, lon2) {
    console.log ("CALCULATE BEARING...");
    console.log (`INPUTS: ${lat1}, ${lon1}, ${lat2}, ${lon2}`);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    lat1 = lat1 * (Math.PI / 180);
    lat2 = lat2 * (Math.PI / 180);

    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    const bearing = Math.atan2(y, x) * (180 / Math.PI);
    console.log ("...FINSIHED CALCULATING BEARING");
    return (bearing + 360) % 360;
}

function startListeningForOrientation() {
    console.log("In Function startListeningForOrientation...");

    const handleOrientation = (event) => {
        const { alpha, beta, gamma } = event;

        const alphaElement = document.getElementById("device_orientation_alpha");
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

    console.log("...Exiting Function startListeningForOrientation");
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
                    console.error("Both bearing and alpha are invalid.");
                }
                document.getElementById("direction_offset").innerText = direction_offset.toFixed(0);

                if (distToTarget <= locationData.proximity2) {
                    document.getElementById("clue").innerText = locationData.second_clue;
                } else if (distToTarget <= locationData.proximity1) {
                    document.getElementById("clue").innerText = locationData.first_clue;
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
});

setInterval(updateDisplay, proximityCheckInterval);
