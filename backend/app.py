#!/usr/bin/env python3
"""
app.py
Flask API exposing projectile engine.
Serves JSON only. Frontend is a separate static site.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from engine import simulate, evaluate_hit, PhysicsConfig
from functools import lru_cache

app = Flask(__name__)
CORS(app)  # allow frontend on a different origin during dev

# Cache simulation results for common parameters
@lru_cache(maxsize=1024)
def cached_simulation(v0, angle_deg, g, dt, y0, mass, radius, 
                     air_density, drag_coef, wind_speed, wind_angle, 
                     temp, altitude):
    config = PhysicsConfig(
        air_density=air_density,
        drag_coefficient=drag_coef,
        wind_speed=wind_speed,
        wind_angle=wind_angle,
        temperature=temp,
        altitude=altitude
    )
    return simulate(v0, angle_deg, g, dt, y0, mass, radius, config)

@app.route("/api/v2/simulate", methods=["POST"])
def api_simulate_v2():
    """
    JSON body:
    {
      "v0": 25.0,               # initial velocity (m/s)
      "angle_deg": 45,          # launch angle (degrees)
      "g": 9.81,               # gravity (m/s²)
      "dt": 0.02,              # time step (s)
      "y0": 0.0,               # initial height (m)
      "mass": 0.1,             # projectile mass (kg)
      "radius": 0.02,          # projectile radius (m)
      "air_density": 1.225,    # air density (kg/m³)
      "drag_coef": 0.47,       # drag coefficient
      "wind_speed": 0.0,       # wind speed (m/s)
      "wind_angle": 0.0,       # wind angle (degrees)
      "temperature": 20.0,     # temperature (°C)
      "altitude": 0.0,         # altitude (m)
      "target_x": 40.0,        # optional target x position
      "target_radius": 1.5,    # optional target radius
      "bonus_zones": [0.5, 1.0, 1.5]  # optional bonus scoring zones
    }
    """
    data = request.get_json(force=True, silent=True) or {}
    try:
        # Required parameters with defaults
        v0 = float(data.get("v0", 25.0))
        angle = float(data.get("angle_deg", 45.0))
        g = float(data.get("g", 9.81))
        dt = float(data.get("dt", 0.02))
        y0 = float(data.get("y0", 0.0))
        mass = float(data.get("mass", 0.1))
        radius = float(data.get("radius", 0.02))
        
        # Physics configuration parameters
        air_density = float(data.get("air_density", 1.225))
        drag_coef = float(data.get("drag_coef", 0.47))
        wind_speed = float(data.get("wind_speed", 0.0))
        wind_angle = float(data.get("wind_angle", 0.0))
        temperature = float(data.get("temperature", 20.0))
        altitude = float(data.get("altitude", 0.0))
        
        # Use cached simulation for performance
        sim = cached_simulation(
            v0, angle, g, dt, y0, mass, radius,
            air_density, drag_coef, wind_speed, wind_angle,
            temperature, altitude
        )

        # Optional gamified evaluation
        target_x = data.get("target_x")
        target_radius = float(data.get("target_radius", 1.5))
        bonus_zones = data.get("bonus_zones")
        result = {"simulation": sim}

        if target_x is not None:
            landing_x = sim["stats"]["range"]
            eval_ = evaluate_hit(landing_x, float(target_x), target_radius, bonus_zones)
            result["result"] = {
                **eval_,
                "landing_x": float(landing_x)
            }

        return jsonify(result), 200
    except ValueError as e:
        return jsonify({
            "error": "Invalid parameter value",
            "details": str(e)
        }), 400
    except Exception as e:
        return jsonify({
            "error": "Internal server error",
            "details": str(e)
        }), 500

# Keep v1 endpoint for backward compatibility
@app.route("/api/simulate", methods=["POST"])
def api_simulate_v1():
    """Legacy v1 endpoint with basic physics only"""
    data = request.get_json(force=True, silent=True) or {}
    try:
        v0 = float(data.get("v0", 25.0))
        angle = float(data.get("angle_deg", 45.0))
        g = float(data.get("g", 9.81))
        dt = float(data.get("dt", 0.02))
        y0 = float(data.get("y0", 0.0))
        
        # Use default values for new parameters
        sim = simulate(v0, angle, g, dt, y0)

        # Optional gamified evaluation
        target_x = data.get("target_x")
        target_radius = float(data.get("target_radius", 1.5))
        result = {"simulation": sim}

        if target_x is not None:
            landing_x = sim["stats"]["range"]
            eval_ = evaluate_hit(landing_x, float(target_x), target_radius)
            result["result"] = {
                **eval_,
                "landing_x": float(landing_x),
                "message": "Bullseye!" if eval_["hit"] else "Missed!"
            }

        return jsonify(result), 200
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "version": "2.0",
        "endpoints": [
            "/api/v2/simulate",  # New endpoint with advanced physics
            "/api/simulate",     # Legacy endpoint
            "/health"            # Health check
        ]
    }), 200

if __name__ == "__main__":
    # Dev server
    app.run(host="0.0.0.0", port=8000, debug=True)
