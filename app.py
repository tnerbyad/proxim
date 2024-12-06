from flask import Flask, render_template, request, redirect, session
from geopy.distance import geodesic  # Install via 'pip install geopy'

app = Flask(__name__)
app.secret_key = "your_secret_key_here"  # Replace with a secure key

# Define locations and clues
LOCATIONS = [
    {
        "name": "location1",
        "description": "red building",
        "lat": 37.7749,
        "lon": -122.4194,
        "proximity1": 500,  # Proximity in feet for the first clue
        "proximity2": 50,   # Proximity in feet for the target
        "first_clue": "You're getting warmer! Look for a tall red building.",
        "second_clue": "Almost there! The magic word is hidden in plain sight.",
        "magic_input": "goldengate",
        "next": "/loc2",
    },
    {
        "name": "location2",
        "description": "clock tower",
        "lat": 37.8044,
        "lon": -122.2711,
        "proximity1": 400,
        "proximity2": 50,
        "first_clue": "Close! Look for a clock tower.",
        "second_clue": "Check near the base of the tower.",
        "magic_input": "oaklandclock",
        "next": "/location3",
    },
    {
        "name": "location3",
        "description": "University Library",
        "lat": 37.8715,
        "lon": -122.2730,
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