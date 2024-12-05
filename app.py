from flask import Flask, render_template

app = Flask(__name__)

# Target location (latitude, longitude)
TARGET_LOCATION = (41.80670, -111.79549)  # Example: San Francisco

@app.route("/")
def index():
    return render_template("index.html", target_lat=TARGET_LOCATION[0], target_lon=TARGET_LOCATION[1])

if __name__ == "__main__":
    app.run(debug=True)