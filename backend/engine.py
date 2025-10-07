#!/usr/bin/env python3
"""
engine.py
Advanced projectile physics engine with air resistance, wind effects, and realistic calculations.
"""

from math import sin, cos, radians, exp
import numpy as np
from dataclasses import dataclass
from typing import Dict, List, Optional, Tuple

@dataclass
class PhysicsConfig:
    """Configuration parameters for physics simulation"""
    air_density: float = 1.225  # kg/m³ at sea level
    drag_coefficient: float = 0.47  # sphere
    wind_speed: float = 0.0  # m/s
    wind_angle: float = 0.0  # degrees
    temperature: float = 20.0  # Celsius
    altitude: float = 0.0  # meters above sea level

@dataclass
class ProjectileStats:
    """Statistical data about the projectile's trajectory"""
    time_of_flight: float
    max_height: float
    range: float
    max_speed: float
    impact_speed: float
    impact_angle: float

class ProjectilePhysics:
    """Advanced projectile physics calculations"""
    
    def __init__(self, config: Optional[PhysicsConfig] = None):
        self.config = config or PhysicsConfig()
        # Adjust air density based on altitude using barometric formula
        self.config.air_density *= exp(-self.config.altitude / 7400)

    def calculate_drag_force(self, velocity: float, area: float) -> float:
        """Calculate drag force using drag equation"""
        return 0.5 * self.config.air_density * velocity**2 * self.config.drag_coefficient * area

    def calculate_wind_effect(self, velocity_x: float, velocity_y: float) -> Tuple[float, float]:
        """Calculate wind effect on velocity components"""
        wind_rad = radians(self.config.wind_angle)
        wind_x = self.config.wind_speed * cos(wind_rad)
        wind_y = self.config.wind_speed * sin(wind_rad)
        return velocity_x - wind_x, velocity_y - wind_y

    def simulate(self,
                v0: float,
                angle_deg: float,
                g: float = 9.81,
                dt: float = 0.01,
                y0: float = 0.0,
                mass: float = 0.1,  # kg
                radius: float = 0.02  # meters
                ) -> Dict:
        """
        Simulate projectile motion with air resistance and wind effects.
        
        Parameters:
        - v0: initial velocity (m/s)
        - angle_deg: launch angle (degrees)
        - g: gravitational acceleration (m/s²)
        - dt: time step (s)
        - y0: initial height (m)
        - mass: projectile mass (kg)
        - radius: projectile radius (m)
        
        Returns dictionary with trajectory data and statistics.
        """
        # Input validation
        if v0 < 0: raise ValueError("v0 must be >= 0")
        if g <= 0: raise ValueError("g must be > 0")
        if dt <= 0: raise ValueError("dt must be > 0")
        if mass <= 0: raise ValueError("mass must be > 0")
        if radius <= 0: raise ValueError("radius must be > 0")

        # Initial conditions
        theta = radians(angle_deg)
        vx = v0 * cos(theta)
        vy = v0 * sin(theta)
        x = 0.0
        y = y0
        
        # Arrays to store trajectory
        t = [0.0]
        xs = [x]
        ys = [y]
        velocities = [v0]
        
        # Calculate projectile area
        area = np.pi * radius**2
        
        max_height = y0
        max_speed = v0
        
        while y >= 0:
            # Calculate current velocity
            v = np.sqrt(vx**2 + vy**2)
            max_speed = max(max_speed, v)
            
            # Calculate drag force
            drag_force = self.calculate_drag_force(v, area)
            drag_ax = -(drag_force * vx / (v * mass)) if v > 0 else 0
            drag_ay = -(drag_force * vy / (v * mass)) if v > 0 else 0
            
            # Apply wind effects
            vx_rel, vy_rel = self.calculate_wind_effect(vx, vy)
            
            # Update velocities
            vx += drag_ax * dt
            vy += (drag_ay - g) * dt
            
            # Update positions
            x += vx_rel * dt
            y += vy * dt
            
            # Store data
            t.append(t[-1] + dt)
            xs.append(x)
            ys.append(y)
            velocities.append(np.sqrt(vx**2 + vy**2))
            
            # Update max height
            max_height = max(max_height, y)
            
            # Break if taking too long (e.g., if wind is stronger than initial velocity)
            if t[-1] > 30:  # 30 seconds limit
                break

        # Calculate final statistics
        stats = ProjectileStats(
            time_of_flight=t[-1],
            max_height=max_height,
            range=x,
            max_speed=max_speed,
            impact_speed=velocities[-1],
            impact_angle=abs(np.arctan2(vy, vx) * 180 / np.pi)
        )

        return {
            "t": t,
            "x": xs,
            "y": ys,
            "v": velocities,
            "stats": {
                "time_of_flight": float(stats.time_of_flight),
                "max_height": float(stats.max_height),
                "range": float(stats.range),
                "max_speed": float(stats.max_speed),
                "impact_speed": float(stats.impact_speed),
                "impact_angle": float(stats.impact_angle),
                "v0": float(v0),
                "angle_deg": float(angle_deg),
                "g": float(g),
                "dt": float(dt),
                "y0": float(y0),
                "wind_speed": float(self.config.wind_speed),
                "wind_angle": float(self.config.wind_angle)
            }
        }

def simulate(v0: float,
            angle_deg: float,
            g: float = 9.81,
            dt: float = 0.01,
            y0: float = 0.0,
            mass: float = 0.1,
            radius: float = 0.02,
            config: Optional[PhysicsConfig] = None) -> Dict:
    """
    Wrapper around ProjectilePhysics.simulate() to maintain backward compatibility
    """
    physics = ProjectilePhysics(config)
    return physics.simulate(v0, angle_deg, g, dt, y0, mass, radius)

def evaluate_hit(landing_x: float,
                target_x: float,
                target_radius: float,
                bonus_zones: Optional[List[float]] = None) -> Dict:
    """
    Evaluate projectile landing with bonus scoring zones.
    
    Parameters:
    - landing_x: where the projectile landed
    - target_x: center of target
    - target_radius: radius of target
    - bonus_zones: list of radii for bonus scoring zones (e.g., [0.5, 1.0, 1.5])
                  each zone has different score multiplier
    
    Returns dictionary with hit information and score.
    """
    dx = abs(landing_x - target_x)
    hit = dx <= target_radius
    
    # Calculate score based on accuracy
    score_multiplier = 0
    if hit:
        if bonus_zones:
            for i, zone_radius in enumerate(sorted(bonus_zones)):
                if dx <= zone_radius:
                    score_multiplier = len(bonus_zones) - i
                    break
        else:
            score_multiplier = 1

    return {
        "hit": bool(hit),
        "miss_distance": float(dx),
        "target_x": float(target_x),
        "target_radius": float(target_radius),
        "score_multiplier": score_multiplier,
        "message": get_hit_message(hit, dx, target_radius)
    }

def get_hit_message(hit: bool, miss_distance: float, target_radius: float) -> str:
    """Generate appropriate message based on hit accuracy"""
    if not hit:
        return f"Missed by {miss_distance:.2f} meters!"
    
    accuracy = (1 - miss_distance/target_radius) * 100
    if accuracy >= 95:
        return "Perfect Shot! 🎯"
    elif accuracy >= 80:
        return "Excellent! ⭐"
    elif accuracy >= 60:
        return "Great Shot! 👍"
    else:
        return "Hit! ✓"
