/**
 * Awakening.js - Premium Particle Logo Formation Engine
 * Replicates the "AI Awakening" effect by forming a logo from floating particles.
 */

class Particle {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.reset();
        
        // Target positions (forming the logo)
        this.baseX = this.x;
        this.baseY = this.y;
        
        // Visuals (Antigravity Style)
        this.colors = ["#4285F4", "#DB4437", "#F4B400", "#0F9D58", "#9B59B6", "#E67E22", "#1ABC9C", "#FF6B6B"];
        this.color = this.colors[Math.floor(Math.random() * this.colors.length)];
        
        this.size = Math.random() * 2 + 1.5;
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * 0.1;
        
        this.friction = 0.95;
        this.ease = 0.1 + Math.random() * 0.05;
    }

    reset() {
        this.x = Math.random() * this.canvas.width;
        this.y = Math.random() * this.canvas.height;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.opacity = Math.random() * 0.5 + 0.3;
        this.isForming = false;
    }

    update(mouse, state) {
        if (state === 'FORMING') {
            // Move toward base position (Logo Formation)
            let dx = this.baseX - this.x;
            let dy = this.baseY - this.y;
            this.x += dx * this.ease;
            this.y += dy * this.ease;
            this.opacity = 0.8;
        } else {
            // IDLE / DISPERSING (Float naturally)
            this.x += this.vx;
            this.y += this.vy;
            
            // Interaction: Mouse Repel (Subtle)
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < mouse.radius) {
                let forceX = (dx / distance) * 2;
                let forceY = (dy / distance) * 2;
                this.vx -= forceX;
                this.vy -= forceY;
            }

            // Boundary Check
            if (this.x < 0 || this.x > this.canvas.width) this.vx *= -1;
            if (this.y < 0 || this.y > this.canvas.height) this.vy *= -1;
            
            this.vx *= this.friction;
            this.vy *= this.friction;
            
            // Limit speed
            const maxSpeed = 1.2;
            if (Math.abs(this.vx) > maxSpeed) this.vx = Math.sign(this.vx) * maxSpeed;
            if (Math.abs(this.vy) > maxSpeed) this.vy = Math.sign(this.vy) * maxSpeed;

            // Subtle drift
            this.vx += (Math.random() - 0.5) * 0.05;
            this.vy += (Math.random() - 0.5) * 0.05 - 0.01; // Slight upward drift

            this.opacity = Math.max(0.3, this.opacity * 0.99);
        }

        this.rotation += this.rotationSpeed;
    }

    draw() {
        this.ctx.save();
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(this.rotation);
        this.ctx.globalAlpha = this.opacity;
        this.ctx.fillStyle = this.color;
        
        // Rectangular particle
        this.ctx.shadowBlur = 4;
        this.ctx.shadowColor = this.color;
        this.ctx.fillRect(-this.size, -this.size, this.size * 2, this.size * 2);
        this.ctx.restore();
    }
}

class AwakeningSystem {
    constructor(canvasId, text = "Qaly") {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.text = text;
        this.particles = [];
        this.state = 'IDLE'; // IDLE, FORMING, DISPERSING
        
        this.mouse = { x: 0, y: 0, radius: 100 };
        this.cooldown = false;
        
        this.init();
        this.animate();
        
        window.addEventListener('resize', () => this.init());
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    }

    init() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Scan text for coordinates
        const points = this.scanText();
        this.particles = [];
        
        // Create particles (one per point)
        for (let i = 0; i < points.length; i++) {
            const p = new Particle(this.canvas);
            p.baseX = points[i].x;
            p.baseY = points[i].y;
            this.particles.push(p);
        }
        
        // If we need more particles for background density
        const extra = Math.max(0, 100 - points.length);
        for (let i = 0; i < extra; i++) {
            this.particles.push(new Particle(this.canvas));
        }
    }

    scanText() {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = window.innerWidth;
        tempCanvas.height = window.innerHeight;
        
        // Split-screen positioning detection
        const isDesktop = window.innerWidth > 1024;
        const targetX = isDesktop ? tempCanvas.width * 0.35 : tempCanvas.width / 2;
        const targetY = tempCanvas.height / 2;
        
        // Responsive font scaling
        const fontSize = isDesktop ? Math.min(window.innerWidth * 0.12, 160) : Math.min(window.innerWidth * 0.2, 120);
        
        tempCtx.font = `900 ${fontSize}px 'Inter', sans-serif`;
        tempCtx.fillStyle = 'white';
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';
        
        // Position logo on the left for desktop, centered for mobile
        tempCtx.fillText(this.text, targetX, targetY);
        
        // Scan pixels
        const data = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height).data;
        const points = [];
        const step = window.innerWidth < 768 ? 8 : 6; 
        
        for (let y = 0; y < tempCanvas.height; y += step) {
            for (let x = 0; x < tempCanvas.width; x += step) {
                const alpha = data[(y * tempCanvas.width + x) * 4 + 3];
                if (alpha > 128) {
                    points.push({ x, y });
                }
            }
        }
        return points;
    }

    handleMouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
        
        if (this.state === 'IDLE' && !this.cooldown) {
            this.awaken();
        }
    }

    awaken() {
        this.state = 'FORMING';
        this.cooldown = true;
        
        // Maintain logo for 2 seconds
        setTimeout(() => {
            this.disperse();
        }, 2000);
    }

    disperse() {
        this.state = 'DISPERSING';
        
        // Set new random velocities for natural dispersal
        this.particles.forEach(p => {
            p.vx = (Math.random() - 0.5) * 3;
            p.vy = (Math.random() - 0.5) * 3;
        });

        // Cooldown before being able to awaken again
        setTimeout(() => {
            this.state = 'IDLE';
            this.cooldown = false;
        }, 3000);
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(p => {
            p.update(this.mouse, this.state);
            p.draw();
        });
        
        requestAnimationFrame(() => this.animate());
    }
}

// Auto-initialize if canvas exists
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('awakening-canvas')) {
        window.awakeningSystem = new AwakeningSystem('awakening-canvas');
    }
});
