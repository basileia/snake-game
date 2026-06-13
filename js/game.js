import { Snake } from "./snake.js";
import { Apple } from "./apple.js";
import { CONFIG } from "./config.js";

class Game {
    constructor() {
        this.canvas = document.getElementById("game");
        this.ctx = this.canvas.getContext("2d");

        this.initGrid();

        window.addEventListener("resize", () => {
            this.initGrid();
            this.apple = new Apple(this.cols, this.rows, this.snake.body);
        });

        this.snake = new Snake("green");
        this.apple = new Apple(this.cols, this.rows, this.snake.body);

        this.initControls();
        this.initTouchControls();
        this.initOnscreenControls();

        this.init();
    }

    initControls() {
        window.addEventListener("keydown", (e) => {
            const key = e.key;
            let newDir = null;

            if (key === "ArrowUp" || key === "w" || key === "W") newDir = "up";
            if (key === "ArrowDown" || key === "s" || key === "S") newDir = "down";
            if (key === "ArrowLeft" || key === "a" || key === "A") newDir = "left";
            if (key === "ArrowRight" || key === "d" || key === "D") newDir = "right";

            if (!newDir) return;

            const opposites = { up: "down", down: "up", left: "right", right: "left" };

            // Prevent reversing into itself
            if (opposites[newDir] === this.snake.direction && this.snake.body.length > 1) return;

            this.snake.direction = newDir;
        });
    }

    initTouchControls() {
        let startX = 0;
        let startY = 0;
        let startTime = 0;
        const threshold = Math.max(20, Math.floor(CONFIG.cellSize * 0.3));

        const onTouchStart = (e) => {
            const t = e.touches && e.touches[0];
            if (!t) return;
            startX = t.clientX;
            startY = t.clientY;
            startTime = Date.now();
        };

        const onTouchMove = (e) => {
            if (e.cancelable) e.preventDefault();
        };

        const onTouchEnd = (e) => {
            const t = e.changedTouches && e.changedTouches[0];
            if (!t) return;
            const dx = t.clientX - startX;
            const dy = t.clientY - startY;

            if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

            let newDir = null;
            if (Math.abs(dx) > Math.abs(dy)) {
                newDir = dx > 0 ? "right" : "left";
            } else {
                newDir = dy > 0 ? "down" : "up";
            }

            const opposites = { up: "down", down: "up", left: "right", right: "left" };
            if (opposites[newDir] === this.snake.direction && this.snake.body.length > 1) return;

            this.snake.direction = newDir;
        };

        this.canvas.addEventListener("touchstart", onTouchStart, { passive: true });
        this.canvas.addEventListener("touchmove", onTouchMove, { passive: false });
        this.canvas.addEventListener("touchend", onTouchEnd, { passive: true });
        this.canvas.addEventListener("touchcancel", () => { startX = startY = startTime = 0; }, { passive: true });
    }

    initOnscreenControls() {
        const map = {
            'btn-up': 'up',
            'btn-down': 'down',
            'btn-left': 'left',
            'btn-right': 'right'
        };

        const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };

        Object.keys(map).forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            const dir = map[id];

            const setDir = (e) => {
                if (e && e.preventDefault) e.preventDefault();
                if (opposites[dir] === this.snake.direction && this.snake.body.length > 1) return;
                this.snake.direction = dir;
            };

            el.addEventListener('pointerdown', setDir);
            el.addEventListener('touchstart', setDir, { passive: false });
            el.addEventListener('pointerup', () => el.blur());
            el.addEventListener('contextmenu', (e) => e.preventDefault());
        });
    }

    init() {
        this.loop();
    }

    initGrid() {
        this.cols = Math.floor(window.innerWidth / CONFIG.cellSize);
        this.rows = Math.floor(window.innerHeight / CONFIG.cellSize);

        this.canvas.width = this.cols * CONFIG.cellSize;
        this.canvas.height = this.rows * CONFIG.cellSize;
    }

    reset() {
        this.snake = new Snake("green");
        this.apple = new Apple(this.cols, this.rows, this.snake.body);
    }

    loop() {
        this.update();
        this.draw();

        setTimeout(() => this.loop(), CONFIG.speed);
    }

    update() {
        this.snake.move();

        const head = this.snake.body[0];

        // wall collision
        if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) {
            alert("Game over: hit the wall");
            this.reset();
            return;
        }

        // self collision
        for (let i = 1; i < this.snake.body.length; i++) {
            const part = this.snake.body[i];
            if (part.x === head.x && part.y === head.y) {
                alert("Game over: hit yourself");
                this.reset();
                return;
            }
        }

        // apple collision
        if (head.x === this.apple.position.x && head.y === this.apple.position.y) {
            this.snake.grow();
            this.apple.position = this.apple.randomPosition(this.snake.body);
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // grid dots for orientation (inside walls)
        this.ctx.fillStyle = "#e0e0e0";
        const dotRadius = Math.max(1, Math.floor(CONFIG.cellSize / 10));
        for (let gy = 1; gy < this.rows - 1; gy++) {
            for (let gx = 1; gx < this.cols - 1; gx++) {
                const cx = gx * CONFIG.cellSize + CONFIG.cellSize / 2;
                const cy = gy * CONFIG.cellSize + CONFIG.cellSize / 2;
                this.ctx.beginPath();
                this.ctx.arc(cx, cy, dotRadius, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }

        // draw walls (border)
        this.ctx.fillStyle = "#D2691E"; // orange-brown
        // top and bottom
        for (let x = 0; x < this.cols; x++) {
            this.ctx.fillRect(x * CONFIG.cellSize, 0, CONFIG.cellSize, CONFIG.cellSize);
            this.ctx.fillRect(x * CONFIG.cellSize, (this.rows - 1) * CONFIG.cellSize, CONFIG.cellSize, CONFIG.cellSize);
        }
        // left and right
        for (let y = 0; y < this.rows; y++) {
            this.ctx.fillRect(0, y * CONFIG.cellSize, CONFIG.cellSize, CONFIG.cellSize);
            this.ctx.fillRect((this.cols - 1) * CONFIG.cellSize, y * CONFIG.cellSize, CONFIG.cellSize, CONFIG.cellSize);
        }

        // apple
        this.ctx.fillStyle = "red";
        this.ctx.fillRect(
            this.apple.position.x * CONFIG.cellSize,
            this.apple.position.y * CONFIG.cellSize,
            CONFIG.cellSize,
            CONFIG.cellSize
        );

        // snake: body, tail, head (with simple eyes)
        const body = this.snake.body;

        // body (exclude head and tail)
        if (body.length > 2) {
            this.ctx.fillStyle = this.snake.color;
            for (let i = 1; i < body.length - 1; i++) {
                const part = body[i];
                this.ctx.fillRect(
                    part.x * CONFIG.cellSize,
                    part.y * CONFIG.cellSize,
                    CONFIG.cellSize,
                    CONFIG.cellSize
                );
            }
        }

        // tail (darker)
        if (body.length > 1) {
            const tail = body[body.length - 1];
            this.ctx.fillStyle = "darkgreen";
            this.ctx.fillRect(
                tail.x * CONFIG.cellSize,
                tail.y * CONFIG.cellSize,
                CONFIG.cellSize,
                CONFIG.cellSize
            );
        }

        // head
        if (body.length > 0) {
            const head = body[0];
            const cx = head.x * CONFIG.cellSize;
            const cy = head.y * CONFIG.cellSize;

            this.ctx.fillStyle = this.snake.color;
            this.ctx.fillRect(cx, cy, CONFIG.cellSize, CONFIG.cellSize);

            // eyes
            const eyeSize = Math.max(2, Math.floor(CONFIG.cellSize / 6));
            let ex1, ey1, ex2, ey2;

            switch (this.snake.direction) {
                case "right":
                    ex1 = cx + CONFIG.cellSize * 0.6;
                    ey1 = cy + CONFIG.cellSize * 0.25;
                    ex2 = cx + CONFIG.cellSize * 0.6;
                    ey2 = cy + CONFIG.cellSize * 0.75;
                    break;
                case "left":
                    ex1 = cx + CONFIG.cellSize * 0.15;
                    ey1 = cy + CONFIG.cellSize * 0.25;
                    ex2 = cx + CONFIG.cellSize * 0.15;
                    ey2 = cy + CONFIG.cellSize * 0.75;
                    break;
                case "up":
                    ex1 = cx + CONFIG.cellSize * 0.25;
                    ey1 = cy + CONFIG.cellSize * 0.15;
                    ex2 = cx + CONFIG.cellSize * 0.75;
                    ey2 = cy + CONFIG.cellSize * 0.15;
                    break;
                case "down":
                default:
                    ex1 = cx + CONFIG.cellSize * 0.25;
                    ey1 = cy + CONFIG.cellSize * 0.75;
                    ex2 = cx + CONFIG.cellSize * 0.75;
                    ey2 = cy + CONFIG.cellSize * 0.75;
                    break;
            }

            this.ctx.fillStyle = "white";
            this.ctx.beginPath();
            this.ctx.arc(ex1 + eyeSize / 2, ey1 + eyeSize / 2, eyeSize / 2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.arc(ex2 + eyeSize / 2, ey2 + eyeSize / 2, eyeSize / 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
}

new Game();