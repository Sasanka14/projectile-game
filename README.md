# 🎯 Projectile Target Practice  

A **physics-based educational game** that helps students understand **projectile motion** through interactive simulations and engaging gameplay. Perfect for both **learning** and **fun experimentation**.  


## 📸 Preview  

<table>
  <tr>
    <td>
      <img width="700" alt="Game Screenshot 1" src="https://github.com/user-attachments/assets/876d9a42-fe91-4fab-b743-f49e4ff1b35d" />
    </td>
    <td>
      <img width="700" alt="Game Screenshot 2" src="https://github.com/user-attachments/assets/3196b5ef-a614-4e25-90f9-aa7b9c885ab5" />
    </td>
  </tr>
</table>


## 🚀 Features  

### 🔬 Physics Simulation  
- Real-time trajectory visualization  
- Adjustable physics parameters (wind, air resistance, gravity)  
- Accurate motion calculations  

### 🏆 Scoring System  
- Multiple target zones with multipliers  
- Score tracking and leaderboard system  
- Progressive difficulty for skill growth  

### 📚 Educational Tools  
- On-the-fly parameter adjustments  
- Detailed trajectory analysis  
- Instant performance feedback  

### 🎨 Modern UI/UX  
- Glass morphism design with blur effects  
- Particle background effects  
- Smooth animations (GSAP + Animate.css)  
- Fully responsive layout  

---

## 🛠️ Technology Stack  

**Frontend**  
- HTML5 Canvas (physics rendering)  
- Vanilla JavaScript (game logic)  
- CSS3 (Grid, animations, glass morphism)  

**Backend**  
- Python **Flask API**  
- Physics computations & trajectory calculations  

**Libraries & Tools**  
- [Particles.js](https://vincentgarreau.com/particles.js/) – background effects  
- [GSAP](https://greensock.com/gsap/) – animations  
- [Animate.css](https://animate.style/) – transitions  

---

## 🎮 How to Play  

1. **Set Your Parameters** – Choose initial velocity, launch angle, and environment factors.  
2. **Aim for the Target** – Predict the best trajectory considering wind and drag.  
3. **Launch & Learn** – Observe the path, analyze results, and refine your aim.  

---

## ⚡ Getting Started  

### Prerequisites  
- Python **3.9+**  
- A modern web browser  
- npm *(optional, for development)*  

### Installation  

1. **Clone the repository**  
   ```bash
   git clone https://github.com/sasanka/projectile-game.git
   cd projectile-game


2. **Install backend dependencies**

   ```bash
   pip install flask flask-cors numpy
   ```

3. **Run the backend server**

   ```bash
   cd backend
   python app.py
   ```

4. **Run the frontend (using Python server)**

   ```bash
   cd frontend
   python -m http.server 8080
   ```

5. **Open in your browser**

   ```
   http://localhost:8080/landing.html
   ```

---

## 📐 Physics Simulation

**Implemented Factors**

* Gravity
* Air resistance (drag)
* Wind (speed & direction)
* Projectile mass & radius

**Core Calculations**

* Real-time trajectory prediction (numerical integration)
* Path visualization
* Collision detection with targets

---

## 🎨 Design Highlights

* Transparent glass morphism UI
* Adaptive mobile-first layout
* Smooth parameter-to-result feedback
* Engaging score animations

---

## 🤝 Contributing

We welcome contributions!

1. Fork the repository
2. Create a feature branch:

   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. Commit changes:

   ```bash
   git commit -m "Add AmazingFeature"
   ```
4. Push to branch & open PR

---

## 📝 License

Distributed under the **MIT License**. See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

* **Particles.js** – visual effects
* **GSAP** – smooth animations
* **Font Awesome** – icons
* **Google Fonts** – typography

---

## 📧 Contact

👤 **Sasanka**

* GitHub: [sasanka](https://github.com/sasanka14)
* Project: [Projectile Game](https://github.com/sasanka/projectile-game)

---

✨ Built with dedication by **Sasanka** © 2025
