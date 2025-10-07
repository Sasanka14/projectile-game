// Initialize Particles.js
particlesJS("particles-js", {
  particles: {
    number: {
      value: 100,
      density: {
        enable: true,
        value_area: 1000
      }
    },
    color: {
      value: "#7cc4ff"
    },
    shape: {
      type: "circle"
    },
    opacity: {
      value: 0.6,
      random: false,
      animation: {
        enable: true,
        speed: 0.5,
        opacity_min: 0.2,
        sync: false
      }
    },
    size: {
      value: 2,
      random: true,
      animation: {
        enable: true,
        speed: 1,
        size_min: 0.1,
        sync: false
      }
    },
    line_linked: {
      enable: true,
      distance: 150,
      color: "#67f0a6",
      opacity: 0.3,
      width: 1.5
    },
    move: {
      enable: true,
      speed: 2,
      direction: "none",
      random: true,
      straight: false,
      out_mode: "out",
      bounce: false,
    }
  },
  interactivity: {
    detect_on: "canvas",
    events: {
      onhover: {
        enable: true,
        mode: "grab"
      },
      onclick: {
        enable: true,
        mode: "push"
      },
      resize: true
    },
    modes: {
      grab: {
        distance: 140,
        line_linked: {
          opacity: 1
        }
      },
      push: {
        particles_nb: 4
      }
    }
  },
    retina_detect: true
  });
  
  // Create tutorial section background effect
  particlesJS("tutorial-bg", {
    particles: {
      number: {
        value: 50,
        density: {
          enable: true,
          value_area: 800
        }
      },
      color: {
        value: "#7cc4ff"
      },
      shape: {
        type: "circle"
      },
      opacity: {
        value: 0.3,
        random: true
      },
      size: {
        value: 2,
        random: true
      },
      line_linked: {
        enable: true,
        distance: 150,
        color: "#067bc2",
        opacity: 0.2,
        width: 1
      },
      move: {
        enable: true,
        speed: 1,
        direction: "none",
        random: true,
        straight: false,
        out_mode: "out",
        bounce: false
      }
    },
    interactivity: {
      detect_on: "canvas",
      events: {
        onhover: {
          enable: true,
          mode: "grab"
        },
        onclick: {
          enable: true,
          mode: "push"
        },
        resize: true
      },
      modes: {
        grab: {
          distance: 140,
          line_linked: {
            opacity: 0.5
          }
        },
        push: {
          particles_nb: 3
        }
      }
    },
    retina_detect: true
  });// GSAP Animations
document.addEventListener('DOMContentLoaded', () => {
  // Register ScrollTrigger
  gsap.registerPlugin(ScrollTrigger);

  // Animate hero content
  gsap.from('.hero-content', {
    duration: 1,
    y: 50,
    opacity: 0,
    ease: 'power3.out',
    delay: 0.5
  });

  // Animate features list items one by one
  gsap.from('.features li', {
    duration: 0.5,
    x: -50,
    opacity: 0,
    stagger: 0.2,
    ease: 'power2.out',
    delay: 1
  });

  // Animate steps on scroll
  gsap.from('.step', {
    scrollTrigger: {
      trigger: '.steps',
      start: 'top center',
      toggleActions: 'play none none reverse'
    },
    duration: 0.8,
    y: 50,
    opacity: 0,
    stagger: 0.2,
    ease: 'back.out(1.7)'
  });

  // Add hover effect to buttons
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(btn => {
    btn.addEventListener('mouseenter', (e) => {
      gsap.to(btn, {
        scale: 1.05,
        duration: 0.3,
        ease: 'power2.out'
      });
    });
    
    btn.addEventListener('mouseleave', (e) => {
      gsap.to(btn, {
        scale: 1,
        duration: 0.3,
        ease: 'power2.out'
      });
    });
  });
});