import { Snake } from "./snake.js";
import { Apple } from "./apple.js";
import { CONFIG } from "./config.js";
import { AISnake } from "./aiSnake.js";

class Game {
    constructor() {
        this.canvas = document.getElementById("game");
        this.ctx = this.canvas.getContext("2d");

        this.initGrid();

        window.addEventListener("resize", () => {
            this.initGrid();
            this.spawnApplesForLevel();
        });

        this.snake = new Snake("green");
        this.aiSnake = null;
        this.aiEnabled = false;
        this.apples = []; // array of {x,y}

        // level manager
        this.level = 1;
        this.levelComplete = false;
        this.levelCompleteTimer = 0;
        this.currentSpeed = CONFIG.speed;
        this.setLevel(this.level);

        this.initControls();
        this.initTouchControls();
        this.initOnscreenControls();

        // don't auto-start; wait for user to pick mode
        this.mode = null; // 'endless' | 'levels'
        this.setupStartMenu();
    }

    setupStartMenu() {
        const overlay = document.getElementById('start-overlay');
        const btnEndless = document.getElementById('start-endless');
        const btnLevels = document.getElementById('start-levels');
        const aiCheckbox = document.getElementById('start-ai');
        if (!overlay) return;
        if (btnEndless) btnEndless.addEventListener('click', () => this.start('endless', undefined, aiCheckbox && aiCheckbox.checked));
        if (btnLevels) btnLevels.addEventListener('click', () => this.start('levels', undefined, aiCheckbox && aiCheckbox.checked));
    }

    initControls() {
        window.addEventListener("keydown", (e) => {
            const key = e.key;
            let newDir = null;

            if (key === "ArrowUp" || key === "w" || key === "W") newDir = "up";
            if (key === "ArrowDown" || key === "s" || key === "S") newDir = "down";
            if (key === "ArrowLeft" || key === "a" || key === "A") newDir = "left";
            if (key === "ArrowRight" || key === "d" || key === "D") newDir = "right";

            // (no level shortcut keys)

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

        // no on-screen level buttons
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
        this.aiSnake = this.aiEnabled ? new AISnake("yellow") : null;
        this.spawnApplesForLevel();
    }

    start(mode, startLevel, aiEnabled = false) {
        const overlay = document.getElementById('start-overlay');
        if (overlay) overlay.style.display = 'none';
        this.mode = mode;
        this.aiEnabled = !!aiEnabled;
        if (this.aiEnabled) this.aiSnake = new AISnake("yellow");
        if (mode === 'levels') {
            if (typeof startLevel === 'number' && startLevel > 0) {
                this.setLevel(startLevel);
            } else if (this.level && this.level > 1) {
                this.setLevel(this.level);
            } else {
                this.setLevel(1);
            }
        } else {
            // endless: no level progression
            this.level = 1;
            this.levelComplete = false;
            this.currentSpeed = CONFIG.speed;
        }

        // draw AI snake if present
        if (this.aiSnake && this.aiSnake.body && this.aiSnake.body.length > 0) {
            const abody = this.aiSnake.body;

            // body (exclude head and tail)
            if (abody.length > 2) {
                this.ctx.fillStyle = this.aiSnake.color;
                for (let i = 1; i < abody.length - 1; i++) {
                    const part = abody[i];
                    this.ctx.fillRect(
                        part.x * CONFIG.cellSize,
                        part.y * CONFIG.cellSize,
                        CONFIG.cellSize,
                        CONFIG.cellSize
                    );
                }
            }

            // tail (darker)
            if (abody.length > 1) {
                const tail = abody[abody.length - 1];
                this.ctx.fillStyle = "darkblue";
                this.ctx.fillRect(
                    tail.x * CONFIG.cellSize,
                    tail.y * CONFIG.cellSize,
                    CONFIG.cellSize,
                    CONFIG.cellSize
                );
            }

            // head
            const aHead = abody[0];
            if (aHead) {
                const acx = aHead.x * CONFIG.cellSize;
                const acy = aHead.y * CONFIG.cellSize;
                this.ctx.fillStyle = this.aiSnake.color;
                this.ctx.fillRect(acx, acy, CONFIG.cellSize, CONFIG.cellSize);
            }
        }
        this.reset();
        this.loop();
    }

    loop() {
        // update depending on mode
        if (this.mode === 'levels') {
            if (!this.levelComplete) this.update();
        } else {
            // endless or not-started (defensive)
            this.update();
        }

        this.draw();

        // advance level when timer expires (levels only)
        if (this.mode === 'levels' && this.levelComplete && Date.now() >= this.levelCompleteTimer) {
            this.levelUp();
        }

        setTimeout(() => this.loop(), this.currentSpeed);
    }

    update() {
        // player move
        this.snake.move();
        const head = this.snake.body[0];

        // AI move (if present)
        if (this.aiSnake && this.aiSnake.alive) {
            this.aiSnake.move(this.cols, this.rows);
        }

        // player wall collision
        if (head.x < 0 || head.x >= this.cols || head.y < 0 || head.y >= this.rows) {
            alert("Game over: hit the wall");
            this.reset();
            return;
        }

        // player self collision
        for (let i = 1; i < this.snake.body.length; i++) {
            const part = this.snake.body[i];
            if (part.x === head.x && part.y === head.y) {
                alert("Game over: hit yourself");
                this.reset();
                return;
            }
        }

        // AI self-collision (kills AI only)
        if (this.aiSnake && this.aiSnake.alive) {
            const aHead = this.aiSnake.body[0];
            for (let i = 1; i < this.aiSnake.body.length; i++) {
                const part = this.aiSnake.body[i];
                if (part.x === aHead.x && part.y === aHead.y) {
                    // AI died
                    this.aiSnake.alive = false;
                    break;
                }
            }
        }

        // apple collision - support multiple apples and both snakes
        for (let i = 0; i < this.apples.length; i++) {
            const a = this.apples[i];
            // player eats
            if (head.x === a.x && head.y === a.y) {
                this.snake.grow();
                this.apples.splice(i, 1);
                this.spawnApplesForLevel(1);
                break;
            }
            // AI eats
            if (this.aiSnake && this.aiSnake.alive) {
                const aHead = this.aiSnake.body[0];
                if (aHead.x === a.x && aHead.y === a.y) {
                    this.aiSnake.grow();
                    this.apples.splice(i, 1);
                    this.spawnApplesForLevel(1);
                    break;
                }
            }
        }

        if (this.mode === 'levels') this.checkLevelComplete();
    }

    setLevel(level) {
        this.level = Math.max(1, Math.floor(level));
        const desired = 20; // keep target fixed at 20 per user's request
        const caps = this.getCapacity();
        this.targetLength = Math.min(desired, caps.recommended);
        this.currentSpeed = Math.max(40, CONFIG.speed - (this.level - 1) * 10);
    }

    getCapacity() {
        const playableCols = Math.max(0, this.cols - 2);
        const playableRows = Math.max(0, this.rows - 2);
        const playable = playableCols * playableRows;
        const maxMoving = Math.max(0, playable - 1);
        const recommended = Math.max(1, Math.floor(playable * 0.7));
        return { playable, maxMoving, recommended, playableCols, playableRows };
    }

    checkLevelComplete() {
        if (this.levelComplete) return;
        if (this.snake.body.length >= this.targetLength) {
            this.levelComplete = true;
            this.levelCompleteTimer = Date.now() + 1500; // 1.5s pause
        }
    }

    levelUp() {
        this.levelComplete = false;
        this.setLevel(this.level + 1);
        // reset snake to a single square for the new level and respawn apples
        this.reset();
    }

    // changeLevel removed — levels progress via gameplay

    spawnApplesForLevel(ensureCount = null) {
        // ensureCount: if number provided, spawn that many new apples (used on eat)
        const applesNeeded = (() => {
            if (ensureCount && ensureCount > 0) return ensureCount;
            if (this.mode === 'levels' && this.level === 2) return 5;
            return 1;
        })();
        if (!ensureCount) this.apples = []; // fresh fill for the level

        const occupied = () => {
            const occ = new Set();
            this.snake.body.forEach(p => occ.add(`${p.x},${p.y}`));
            if (this.aiSnake) this.aiSnake.body.forEach(p => occ.add(`${p.x},${p.y}`));
            this.apples.forEach(p => occ.add(`${p.x},${p.y}`));
            return occ;
        };

        const occ = occupied();
        const maxAttempts = 2000;
        for (let n = 0; n < applesNeeded; n++) {
            let attempts = 0;
            let px, py;
            do {
                px = Math.floor(Math.random() * Math.max(1, this.cols - 2)) + 1;
                py = Math.floor(Math.random() * Math.max(1, this.rows - 2)) + 1;
                attempts++;
                if (attempts > maxAttempts) break;
            } while (occ.has(`${px},${py}`));

            if (attempts <= maxAttempts) {
                this.apples.push({ x: px, y: py });
                occ.add(`${px},${py}`);
            }
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
        for (const a of this.apples) {
            this.ctx.fillRect(
                a.x * CONFIG.cellSize,
                a.y * CONFIG.cellSize,
                CONFIG.cellSize,
                CONFIG.cellSize
            );
        }

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

        // HUD: show current level only in levels mode
        if (this.mode === 'levels') {
            const hud = `Level ${this.level}`;
            this.ctx.fillStyle = "rgba(0,0,0,0.6)";
            const w = Math.min(this.canvas.width - 16, this.ctx.measureText(hud).width + 16);
            this.ctx.fillRect(8, 8, w, 28);
            this.ctx.fillStyle = "white";
            this.ctx.font = "14px sans-serif";
            this.ctx.textAlign = "left";
            this.ctx.textBaseline = "top";
            this.ctx.fillText(hud, 16, 12);
        }
    }
}

// expose instance for debugging / manual start from console
window.game = new Game();