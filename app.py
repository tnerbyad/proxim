from flask import Flask, render_template, session, request, redirect, url_for, jsonify
import json
from geopy.distance import geodesic  # Install via 'pip install geopy'
import logging

app = Flask(__name__, static_folder='static')
app.secret_key = "your_secret_key_here"  # Replace with a secure key

global_guess_allowance = 1

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

@app.route('/blitz')
def no_location_yet():
    # Ensure the session is initialized
    if 'visited' not in session:
        session['visited'] = []

    visited_locations = session.get('visited', [])

    # Find the first unvisited location in LOCATIONS
    unvisited_location = next(
        (loc for loc in LOCATIONS if loc['name'] not in visited_locations),
        None
    )

    if unvisited_location:
        # Redirect to the first unvisited location
        session['current_location'] = unvisited_location['name']
        return redirect(url_for('blitz_location', location_name=unvisited_location['name']))
    else:
        # If all locations are visited, redirect to the final page
        return redirect(url_for('final'))


@app.route('/blitz/<location_name>')
def blitz_location(location_name):
    logging.debug(f"Session data: {session}")
    # Ensure the session is initialized

    if 'current_location' not in session:
        logging.debug("CURRENT_LOCATION not in session...")
        return redirect(url_for('start'))

    # Get current location and visited locations from the session
    current_location = session.get('current_location')
    visited_locations = session.get('visited', [])

    logging.debug(f"current location: {current_location} | location name: {location_name}")

    # Redirect if the user is trying to skip ahead or access an unvisited location
    if location_name != current_location:
        logging.debug(f"User is trying to skip ahead.  LOCATION_NAME({location_name}) | CURRENT_LOCATION({current_location})")
        return redirect(url_for('blitz_location', location_name=current_location))

    # Load the data for the current location
    location_data = next(loc for loc in LOCATIONS if loc['name'] == location_name)
    return render_template('blitz.html', location=location_data)


@app.route('/submit_key', methods=['POST'])
def submit_key():
    # Parse the JSON request body
    data = request.get_json()

    # Get some key fields from what was
    user_key = data['key'].strip().lower()  # Retrieve the user's key input
    current_location = session.get('current_location')
    visited_locations = session.get('visited', [])
    logging.debug(f"USER_KEY: {user_key} | CURRENT_LOCATION: {current_location} | VISITED_LOCATIONS: {visited_locations}")

    # Find the stored data for matching location (LOCATIONS is what was stored from the json file)
    try:
        location_data = next(loc for loc in LOCATIONS if loc['name'] == current_location)
        logging.debug(f"Got a match on LOCATION_DATA: {location_data}")
    except StopIteration:
        logging.error(f"Invalid location: {current_location}")
        return jsonify(success=False, message="Oops, something went wrong! Please restart the game.")

    # Keeping track of number of guesses
    location_data['fudge'] += 1

    # Get some values from the location data
    next_location = location_data.get('next', '')
    magic_key = location_data.get('magic_key','').strip().lower()
    fudge_value = location_data.get('fudge', 0)

    logging.debug(f"FUDGE={fudge_value}")
    # Check if the user's key matches the magic key or they've already guessed a bunch (fudge_value)
    if user_key == magic_key or fudge_value>global_guess_allowance:
        logging.debug(f"Magic key is a match({user_key}={magic_key})")
        # Mark the current location as visited
        if current_location not in visited_locations:
            visited_locations.append(current_location)
            session['visited'] = visited_locations

        #If there is no next location, are we finished
        if not next_location:
            all_locations_visited = all(
                loc['name'] in visited_locations for loc in LOCATIONS
            )
            # And all locations have been visited
            if all_locations_visited:
                # Redirect to final page
                logging.debug ("All locations have been visited.")
                return jsonify(success=True, next=url_for('final'))
            else:
                # If not all locations are visited, inform the user
                logging.debug ("Not all locations have been visited.  Probably shouldn't ever get to this point...")
                logging.debug("...Since skipping ahead is handled by blitz_location")
                return jsonify(success=False, message="Oh, so you think you can take a short cut? Nice try! You must find all the clues to save Buddy!!")

        # Still more to go, direct to next location
        session['current_location'] = next_location
        return jsonify(success=True, next=url_for('blitz_location', location_name=next_location))
    else:
        logging.debug ("guess is wrong...")
        return jsonify(success=False, message="Ouch. That is not right. Better guess again before it is too late!")


@app.route('/final')
def final():
    visited_locations = session.get('visited', [])
    logging.debug(f"VISITED_LOCATIONS: {visited_locations}")
    all_locations_visited = all(
        loc['name'] in visited_locations for loc in LOCATIONS
    )
    logging.debug(f"ALL_LOCATIONS_VISITED({all_locations_visited})")
    if not all_locations_visited:
        return redirect(url_for('no_location_yet'))

    # If all locations are visited, render the winner page
    return render_template('c.html', message="Congratulations! You saved Buddy!")


if __name__ == "__main__":
    app.run(debug=True)
