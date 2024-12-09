from flask import Flask, render_template, request, redirect, session
from geopy.distance import geodesic  # Install via 'pip install geopy'

app = Flask(__name__)
app.secret_key = "your_secret_key_here"  # Replace with a secure key

# Define locations and clues
LOCATIONS = [
    {
        "name": "location1",
        "description": "hyde park, city hall",
        "lat": 41.79938501121729,
        "lon": -111.81619927128764,
        "proximity1": 100,  # Proximity in feet for the first clue
        "proximity2": 50,   # Proximity in feet for the target
        "first_clue": "You're getting warmer! Look for a playground",
        "second_clue": "Almost there! The magic word is hidden in plain sight.",
        "magic_input": "Hyde Park",
        "next": "/loc2",
    },
    {
        "name": "location2",
        "description": "Angies",
        "lat": 41.77737117328678,
        "lon": -111.80637179308403,
        "proximity1": 100,
        "proximity2": 25,
        "first_clue": "clue 1Eat the kitchen sink",
        "second_clue": "cost with tax",
        "magic_input": "$11.33",
        "next": "/location3",
    },
    {
        "name": "location3",
        "description": "chickafila",
        "lat": 41.75632177398785,
        "lon": -111.8348008765066,
        "proximity1": 300,
        "proximity2": 50,
        "first_clue": "You're near a famous university.",
        "second_clue": "Check near the library.",
        "magic_input": "berkeley",
        "next": None,
    },
]
@app.route("/")
def home():
    return render_template("home.html")

@app.route("/device")
def device():
    return render_template("device.html")

@app.route("/location/<int:location_id>", methods=["GET", "POST"])
def location_page(location_id):
    if location_id < 1 or location_id > len(LOCATIONS):
        #return "Location not found.", 404
        return redirect('/')

    if 'progress' not in session:
        session['progress'] = 0

    location = LOCATIONS[location_id - 1]
    total_locations = len(LOCATIONS)

    if location_id > session['progress'] + 1:
        return "Access denied. You haven't unlocked this location yet.", 403

    if request.method == "POST":
        user_input = request.form.get("magic_input", "").strip()
        user_lat = float(request.form.get("user_lat", 0))
        user_lon = float(request.form.get("user_lon", 0))
        user_position = (user_lat, user_lon)

        target_position = (location["lat"], location["lon"])
        distance = geodesic(user_position, target_position).feet

        if distance > location["proximity2"]:
            return render_template(
                "location.html", location=location, location_id=location_id,
                total_locations=total_locations, error="You are not close enough to the target."
            )

        if user_input == location["magic_input"]:
            session['progress'] = max(session['progress'], location_id)
            next_url = location["next"]
            if next_url:
                return redirect(next_url)
            else:
                return render_template("completed.html")
        else:
            return render_template(
                "location.html", location=location, location_id=location_id,
                total_locations=total_locations, error="Incorrect magic input. Try again!"
            )

    return render_template(
        "location.html", location=location, location_id=location_id,
        total_locations=total_locations, error=None
    )

@app.route("/restart")
def restart():
    session.clear()
    return redirect("/location1")

if __name__ == "__main__":
    app.run(debug=True, port=5001)