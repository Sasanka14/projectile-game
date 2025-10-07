// ===== CONFIG =====
const API_BASE = "http://localhost:8000"; // Flask backend
const CANVAS_W = 960, CANVAS_H = 420;
const PADDING = 40;
const BONUS_ZONES = [0.5, 1.0, 1.5]; // Bonus scoring zones in meters

// ===== STATE =====
let targetX = null;     
let attempts = 0;
const attemptsMax = 5;
let score = 0;
let animId = null;
let lastSim = null; // store last simulation result for feedback
let windIndicatorId = null; // for wind animation

// ===== DOM =====
const $ = (sel) => document.querySelector(sel);

// Basic controls
const v0El = $("#v0");
const angleEl = $("#angle");
const gEl = $("#g");
const dtEl = $("#dt");
const radiusEl = $("#radius");

// Projectile properties
const massEl = $("#mass");
const projectileRadiusEl = $("#projectile-radius");

// Environment controls
const windSpeedEl = $("#wind-speed");
const windAngleEl = $("#wind-angle");
const airDensityEl = $("#air-density");
const altitudeEl = $("#altitude");
const temperatureEl = $("#temperature");

// Game stats
const attemptsEl = $("#attempts");
const attemptsMaxEl = $("#attemptsMax");
const scoreEl = $("#score");
const scoreMultiplierEl = $("#score-multiplier");
const targetXEl = $("#targetX");
const resultEl = $("#result");

// Trajectory stats
const maxHEl = $("#maxH");
const rangeEl = $("#range");
const tofEl = $("#tof");
const maxSpeedEl = $("#max-speed");
const impactSpeedEl = $("#impact-speed");
const impactAngleEl = $("#impact-angle");

const canvas = $("#game");
const ctx = canvas.getContext("2d");

// ===== INIT =====
attemptsMaxEl.textContent = attemptsMax.toString();
resetGame(true);
drawStatic();

$("#newTargetBtn").addEventListener("click", () => {
  if (lastSim) {
    newTarget(lastSim.simulation.stats.range);
    drawStatic(lastSim);
  }
});
$("#shootBtn").addEventListener("click", shoot);
$("#resetBtn").addEventListener("click", () => resetGame(false));

// ===== FUNCTIONS =====
function resetGame(full=false){
  cancelAnimationFrame(animId);
  attempts = 0;
  score = 0;
  attemptsEl.textContent = attempts.toString();
  scoreEl.textContent = score.toString();
  resultEl.textContent = "—";
  resultEl.style.color = "";
  maxHEl.textContent = "—";
  rangeEl.textContent = "—";
  tofEl.textContent = "—";
  if (full || targetX === null) {
    newTarget(50); // default expected range
  }
}

function newTarget(expectedRange = 50) {
  // Place target between 40%–80% of expected projectile range
  const usable = Math.min(expectedRange, 80); 
  targetX = Math.floor(usable * 0.4 + Math.random() * usable * 0.4);
  targetXEl.textContent = targetX.toString();
}

function physToCanvas(xm, ym, scale){
  const x = PADDING + xm * scale;
  const y = CANVAS_H - PADDING - ym * scale;
  return [x, y];
}

function computeScale(maxRange, maxHeight){
  const usableW = CANVAS_W - 2*PADDING;
  const usableH = CANVAS_H - 2*PADDING;
  const sx = usableW / Math.max(1, maxRange*1.1);
  const sy = usableH / Math.max(1, maxHeight*1.3);
  return Math.min(sx, sy);
}

function drawStatic(sim=null){
  ctx.clearRect(0,0,CANVAS_W,CANVAS_H);
  
  // Background with gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
  gradient.addColorStop(0, "#091126");
  gradient.addColorStop(1, "#060c1a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Ground line with gradient
  const groundGradient = ctx.createLinearGradient(0, CANVAS_H - PADDING, 0, CANVAS_H - PADDING + 2);
  groundGradient.addColorStop(0, "#1c2a4d");
  groundGradient.addColorStop(1, "#131e38");
  ctx.strokeStyle = groundGradient;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(PADDING, CANVAS_H - PADDING);
  ctx.lineTo(CANVAS_W - PADDING, CANVAS_H - PADDING);
  ctx.stroke();

  // Target and bonus zones
  const radius = Number(radiusEl.value || 1.5);
  let scale = 6;
  if (sim) {
    const R = sim.simulation.stats.range;
    const H = sim.simulation.stats.max_height;
    scale = computeScale(Math.max(R, targetX), H);
  }
  const [tx, ty] = physToCanvas(targetX, 0, scale);
  
  // Draw bonus zones
  BONUS_ZONES.slice().reverse().forEach((zoneRadius, idx) => {
    const scaledRadius = Math.max(6, zoneRadius * scale);
    ctx.strokeStyle = ["#ff6b6b", "#7cc4ff", "#50fa7b"][idx];
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.arc(tx, ty, scaledRadius, 0, Math.PI*2);
    ctx.stroke();
  });
  
  // Main target circle
  ctx.setLineDash([]);
  ctx.strokeStyle = "#67f0a6";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(tx, ty, Math.max(6, radius*scale), 0, Math.PI*2);
  ctx.stroke();

  // Draw wind indicator if wind is present
  const windSpeed = Number(windSpeedEl.value || 0);
  const windAngle = Number(windAngleEl.value || 0);
  if (windSpeed > 0) {
    drawWindIndicator(windSpeed, windAngle);
  }

  // Distance markers and labels
  const distanceStep = 10;
  const maxDistance = Math.max(targetX * 1.2, sim?.simulation.stats.range || 0);
  
  // Setup text style
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 4;
  ctx.fillStyle = "#9db0d1";
  ctx.font = "12px Inter, Arial, sans-serif";
  
  // Calculate positions for all labels first
  const labels = [];
  
  // Add starting point label
  labels.push({
    text: "0 m",
    x: PADDING,
    xCenter: PADDING,
    width: ctx.measureText("0 m").width
  });
  
  // Add target label
  const targetText = `${targetX} m (target)`;
  labels.push({
    text: targetText,
    x: tx,
    xCenter: tx,
    width: ctx.measureText(targetText).width,
    isTarget: true
  });
  
  // Add distance marker labels
  for (let d = distanceStep; d <= maxDistance; d += distanceStep) {
    const [x, y] = physToCanvas(d, 0, scale);
    if (x < CANVAS_W - PADDING) {
      // Draw tick marks
      ctx.strokeStyle = "#1c2a4d";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, CANVAS_H - PADDING - 5);
      ctx.lineTo(x, CANVAS_H - PADDING + 5);
      ctx.stroke();
      
      // Add to potential labels
      if (d !== targetX) { // Skip if it's the target distance
        const text = `${d}m`;
        labels.push({
          text: text,
          x: x,
          xCenter: x,
          width: ctx.measureText(text).width
        });
      }
    }
  }
  
  // Sort labels by x position
  labels.sort((a, b) => a.x - b.x);
  
  // Filter out overlapping labels
  const minSpacing = 40;
  const visibleLabels = labels.reduce((acc, label, i) => {
    const prev = acc[acc.length - 1];
    
    // Always show first, target, and last label
    if (i === 0 || i === labels.length - 1 || label.isTarget) {
      acc.push(label);
    } else if (!prev || (label.x - prev.x) >= minSpacing) {
      // Check if this label would overlap with the next important label
      const nextImportant = labels.find(l => l.isTarget && l.x > label.x);
      if (!nextImportant || (nextImportant.x - label.x) >= minSpacing) {
        acc.push(label);
      }
    }
    return acc;
  }, []);
  
  // Draw the filtered labels
  visibleLabels.forEach(label => {
    if (label.isTarget) {
      ctx.fillText(label.text, label.x - label.width/2, CANVAS_H - PADDING + 20);
    } else {
      ctx.fillText(label.text, label.x - label.width/2, CANVAS_H - PADDING + 14);
    }
  });
  
  ctx.shadowBlur = 0;
}

function drawWindIndicator(speed, angle) {
  // Convert angle to radians (adjust for direction convention)
  const angleRad = (angle - 90) * Math.PI / 180;
  const maxSpeed = 20; // m/s for scaling
  const baseLength = 40; // base arrow length in pixels
  const length = Math.min(baseLength * (speed / maxSpeed), baseLength);
  
  // Position wind indicator in top-right corner
  const x = CANVAS_W - PADDING - 60;
  const y = PADDING + 30;
  
  // Calculate arrow end point
  const endX = x + length * Math.cos(angleRad);
  const endY = y + length * Math.sin(angleRad);
  
  // Draw arrow shaft
  ctx.strokeStyle = "#7cc4ff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(endX, endY);
  ctx.stroke();
  
  // Draw arrow head
  const headLength = 10;
  const angle1 = angleRad - Math.PI / 6;
  const angle2 = angleRad + Math.PI / 6;
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLength * Math.cos(angle1),
    endY - headLength * Math.sin(angle1)
  );
  ctx.moveTo(endX, endY);
  ctx.lineTo(
    endX - headLength * Math.cos(angle2),
    endY - headLength * Math.sin(angle2)
  );
  ctx.stroke();
  
  // Draw wind speed label
  ctx.fillStyle = "#9db0d1";
  ctx.font = "12px Inter, Arial, sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`${speed.toFixed(1)} m/s`, x - 10, y + 4);
  ctx.textAlign = "left";
}

async function shoot(){
  if (attempts >= attemptsMax){
    banner("Game over. Reset to play again.", "#ff6b6b");
    return;
  }
  attempts += 1;
  attemptsEl.textContent = attempts.toString();
  resultEl.textContent = "—";
  resultEl.style.color = "";

  // Get all physics parameters
  const payload = {
    // Basic parameters
    v0: Number(v0El.value || 25),
    angle_deg: Number(angleEl.value || 45),
    g: Number(gEl.value || 9.81),
    dt: Number(dtEl.value || 0.02),
    y0: 0.0,
    
    // Target parameters
    target_x: targetX,
    target_radius: Number(radiusEl.value || 1.5),
    bonus_zones: BONUS_ZONES,
    
    // Projectile properties
    mass: Number(massEl.value || 0.1),
    radius: Number(projectileRadiusEl.value || 0.02),
    
    // Environment properties
    wind_speed: Number(windSpeedEl.value || 0),
    wind_angle: Number(windAngleEl.value || 0),
    air_density: Number(airDensityEl.value || 1.225),
    altitude: Number(altitudeEl.value || 0),
    temperature: Number(temperatureEl.value || 20)
  };

  let res;
  try {
    const r = await fetch(`${API_BASE}/api/v2/simulate`, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(payload)
    });
    res = await r.json();
    if (!r.ok) throw new Error(res.error || "API error");
  } catch(err) {
    banner(`API error: ${err.message}`, "#ff6b6b");
    return;
  }

  lastSim = res;

  // Update trajectory stats
  const s = res.simulation.stats;
  maxHEl.textContent = s.max_height.toFixed(2);
  rangeEl.textContent = s.range.toFixed(2);
  tofEl.textContent = s.time_of_flight.toFixed(2);
  maxSpeedEl.textContent = s.max_speed.toFixed(2);
  impactSpeedEl.textContent = s.impact_speed.toFixed(2);
  impactAngleEl.textContent = s.impact_angle.toFixed(1);

  // Adjust target if first attempt
  if (attempts === 1) {
    newTarget(s.range);
  }

  // Animate trajectory
  await animateTrajectory(res);

  // Evaluate result and update score
  if (res.result?.hit) {
    const multiplier = res.result.score_multiplier;
    const points = 10 * multiplier;
    scoreMultiplierEl.textContent = multiplier.toString();
    score += points;
    banner(res.result.message, "#50fa7b");
  } else {
    const miss = res.result ? res.result.miss_distance : Math.abs(s.range - targetX);
    banner(`${res.result.message || `Missed by ${miss.toFixed(2)} m`}`, "#ff6b6b");
    scoreMultiplierEl.textContent = "0";
  }
  scoreEl.textContent = score.toString();
}

function banner(text, color){
  resultEl.textContent = text;
  resultEl.style.color = color || "";
}

function drawTrajectory(sim, stepIdx){
  const x = sim.simulation.x;
  const y = sim.simulation.y;
  const v = sim.simulation.v; // velocity array
  const R = sim.simulation.stats.range;
  const H = sim.simulation.stats.max_height;

  const scale = computeScale(Math.max(R, targetX), H);
  drawStatic(sim);

  // Velocity-based gradient for trajectory
  const maxV = Math.max(...v);
  const minV = Math.min(...v);
  
  // Trajectory line with gradient
  ctx.strokeStyle = "#7cc4ff";
  ctx.lineWidth = 2;
  ctx.setLineDash([6,6]);
  
  // Draw trajectory with velocity-based color
  for (let i = 1; i < x.length; i++) {
    const [x1, y1] = physToCanvas(x[i-1], y[i-1], scale);
    const [x2, y2] = physToCanvas(x[i], y[i], scale);
    
    // Calculate color based on velocity
    const velocity = v[i];
    const normalizedV = (velocity - minV) / (maxV - minV);
    const hue = 200 + normalizedV * 40; // blue to cyan
    const alpha = 0.6 + normalizedV * 0.4;
    
    ctx.beginPath();
    ctx.strokeStyle = `hsla(${hue}, 80%, 70%, ${alpha})`;
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // Draw motion blur effect behind projectile
  const idx = Math.min(stepIdx, x.length-1);
  if (idx > 0) {
    const [px, py] = physToCanvas(x[idx], y[idx], scale);
    const blurLength = 5;
    const startIdx = Math.max(0, idx - blurLength);
    
    const gradient = ctx.createLinearGradient(
      px, py,
      ...physToCanvas(x[startIdx], y[startIdx], scale)
    );
    gradient.addColorStop(0, "rgba(255, 175, 95, 0.6)");
    gradient.addColorStop(1, "rgba(255, 175, 95, 0)");
    
    ctx.beginPath();
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4;
    for (let i = idx; i >= startIdx; i--) {
      const [bx, by] = physToCanvas(x[i], y[i], scale);
      if (i === idx) ctx.moveTo(bx, by);
      else ctx.lineTo(bx, by);
    }
    ctx.stroke();
  }

  // Projectile with glowing effect
  const [px, py] = physToCanvas(x[idx], y[idx], scale);
  
  // Outer glow
  const glowSize = 20;
  const radialGradient = ctx.createRadialGradient(px, py, 2, px, py, glowSize);
  radialGradient.addColorStop(0, "rgba(255, 175, 95, 0.4)");
  radialGradient.addColorStop(1, "rgba(255, 175, 95, 0)");
  ctx.fillStyle = radialGradient;
  ctx.beginPath();
  ctx.arc(px, py, glowSize, 0, Math.PI*2);
  ctx.fill();
  
  // Main projectile
  ctx.fillStyle = "#ffaf5f";
  ctx.beginPath();
  ctx.arc(px, py, 6, 0, Math.PI*2);
  ctx.fill();
  
  // Highlight
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  ctx.beginPath();
  ctx.arc(px - 2, py - 2, 2, 0, Math.PI*2);
  ctx.fill();

  // Final feedback on canvas
  if (idx === x.length-1 && sim.result) {
    // Background glow for message
    const msgY = 60;
    const msgX = CANVAS_W/2;
    const msg = sim.result.message || (sim.result.hit ? "🎉 Bullseye!" : "❌ Missed!");
    
    ctx.font = "22px Inter, Arial, sans-serif";
    const metrics = ctx.measureText(msg);
    const msgWidth = metrics.width;
    
    // Draw glowing background
    const padding = 20;
    ctx.fillStyle = sim.result.hit ? 
      "rgba(80, 250, 123, 0.1)" : 
      "rgba(255, 107, 107, 0.1)";
    ctx.beginPath();
    ctx.roundRect(
      msgX - msgWidth/2 - padding,
      msgY - 20,
      msgWidth + padding*2,
      40,
      10
    );
    ctx.fill();
    
    // Draw text with shadow
    ctx.fillStyle = sim.result.hit ? "#50fa7b" : "#ff6b6b";
    ctx.textAlign = "center";
    ctx.shadowColor = sim.result.hit ? 
      "rgba(80, 250, 123, 0.5)" : 
      "rgba(255, 107, 107, 0.5)";
    ctx.shadowBlur = 10;
    ctx.fillText(msg, msgX, msgY);
    ctx.shadowBlur = 0;
    ctx.textAlign = "left";
  }
}

function animateTrajectory(sim){
  return new Promise((resolve)=>{
    let i = 0;
    const N = sim.simulation.x.length;

    const loop = () => {
      drawTrajectory(sim, i);
      i++;
      if (i < N){
        animId = requestAnimationFrame(loop);
      } else {
        resolve();
      }
    };
    cancelAnimationFrame(animId);
    loop();
  });
}
