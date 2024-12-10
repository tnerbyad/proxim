from flask import Flask, render_template, request, redirect, session
from flask import Flask, render_template, session, request, redirect, url_for, jsonify
import json
import os
from geopy.distance import geodesic  # Install via 'pip install geopy'

app = Flask(__name__, static_folder='static')
app.secret_key = "your_secret_key_here"  # Replace with a secure key

@app.route("/")
def index():
    session["visited"] = session.get("visited", [])
    return redirect(url_for("location", location_name="location1"))


@app.route("/location/<location_name>")
def location(location_name):
    file_path = os.path.join(app.root_path, "static", "locations.json")
    with open(file_path) as f:
        locations = json.load(f)

    location = next((loc for loc in locations if loc["name"] == location_name), None)
    if not location:
        return "Location not found.", 404

    # Ensure user has visited previous locations
    visited = session.get("visited", [])
    if location_name not in visited and location["name"] != "location1" and location["name"] not in visited:
        return "You need to visit previous locations first.", 403

    return render_template("location.html", location=location)

@app.route("/progress", methods=["POST"])
def update_progress():
    data = request.json
    location_name = data.get("location")
    visited = session.get("visited", [])
    if location_name not in visited:
        visited.append(location_name)
        session["visited"] = visited
    return jsonify({"visited": visited})

if __name__ == "__main__":
app.run(debug=True)