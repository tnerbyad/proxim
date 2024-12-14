from flask import Flask, render_template, session, request, redirect, url_for, jsonify
import json
from geopy.distance import geodesic  # Install via 'pip install geopy'
import logging

app = Flask(__name__, static_folder='static')
app.secret_key = "your_secret_key_here"  # Replace with a secure key

with open('static/locations.json') as f:
    LOCATIONS = json.load(f)

logging.basicConfig(level=logging.DEBUG)

@app.route('/')
@app.route('/restart')
def start():
    # Clear session to start a new game
    session.clear()
    session['current_location'] = LOCATIONS[0]['name']
    session['visited'] = []  # Tracks visited locations
    return render_template('a.html')


@app.route('/blitz/<location_name>')
def blitz_location(location_name):
    logging.debug(f"Session data: {session}")
    # Ensure the session is initialized

    if 'current_location' not in session:
        return redirect(url_for('start'))

    # Get current location and visited locations from the session
    current_location = session.get('current_location')
    visited_locations = session.get('visited', [])

    logging.debug(f"current location: {current_location} | location name: {location_name}")

    # Redirect if the user is trying to skip ahead or access an unvisited location
    if location_name != current_location:
        return redirect(url_for('blitz_location', location_name=current_location))

    # Load the data for the current location
    location_data = next(loc for loc in LOCATIONS if loc['name'] == location_name)
    return render_template('blitz.html', location=location_data)


@app.route('/submit_key', methods=['POST'])
def submit_key():
    data = request.get_json()  # Parse the JSON request body
    user_key = data['key'].strip().lower()  # Retrieve the user's key input
    current_location = session.get('current_location')
    visited_locations = session.get('visited', [])
    # Check if there is a next location
    next_location = location_data.get('next', '')

    logging.debug(f"USER_KEY: {user_key} | CURRENT_LOCATION: {current_location} | VISITED_LOCATIONS: {visited_locations}")

    # Find the current location data
    try:
        location_data = next(loc for loc in LOCATIONS if loc['name'] == current_location)
    except StopIteration:
        logging.error(f"Invalid location: {current_location}")
        return jsonify(success=False, message="Oops, something went wrong! Please restart the game.")

    logging.debug(f"LOCATION_DATA: {location_data}")

    # Check if the user's key matches the magic key
    if user_key == location_data['magic_key']:
        # Mark the current location as visited
        if current_location not in visited_locations:
            visited_locations.append(current_location)
            session['visited'] = visited_locations

        # Check if there is a next location
        #next_location = location_data.get('next', '')

        if not next_location:  # No next location
            # Check if all locations have been visited
            all_locations_visited = all(
                loc['name'] in visited_locations for loc in LOCATIONS
            )

            if all_locations_visited:
                # Redirect to final page
                return jsonify(success=True, next=url_for('final'))
            else:
                # If not all locations are visited, inform the user
                return jsonify(success=False, message="Oh, so you think you can take a short cut? Nice try! You must find all the clues to save Buddy!!")

        # Move to the next location
        session['current_location'] = next_location
        return jsonify(success=True, next=url_for('blitz_location', location_name=next_location))

    # Handle incorrect key and fudge decrement
    if location_data['fudge'] > 0:
        location_data['fudge'] -= 1
        remaining_fudge = location_data['fudge']

        logging.debug(f"Incorrect key. Fudge remaining: {remaining_fudge}")

        if remaining_fudge == 0:
            # Allow user to proceed to the next location
            if current_location not in visited_locations:
                visited_locations.append(current_location)
                session['visited'] = visited_locations

            next_location = location_data.get('next', '')
            if not next_location:  # No next location
                all_locations_visited = all(
                    loc['name'] in visited_locations for loc in LOCATIONS
                )
                if all_locations_visited:
                    return jsonify(success=True, next=url_for('final'))
                else:
                    return jsonify(success=False, message="You must visit all locations before finishing the game.")

            # Update session with the new current location
            session['current_location'] = next_location
            return jsonify(success=True, next=url_for('blitz_location', location_name=next_location))

        return jsonify(success=False, message=f"Incorrect key. {remaining_fudge} tries left before you can skip.")

    # If the user's key is incorrect and fudge is 0
    return jsonify(success=False, message="Ouch. That is not right. Better guess again before it is too late!")


@app.route('/final')
def final():
    visited_locations = session.get('visited', [])
    all_locations_visited = all(
        loc['name'] in visited_locations for loc in LOCATIONS
    )

    if not all_locations_visited:
        return render_template(
            'not_finished.html',
            message="You're not done yet! Visit all the locations to finish the game."
        )

    # If all locations are visited, render the winner page
    return render_template('c.html', message="Congratulations! You saved Buddy!")


if __name__ == "__main__":
    app.run(debug=True)
