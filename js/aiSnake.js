import { Snake } from "./snake.js";

export class AISnake extends Snake {
    constructor(color = "#800080") {
        super(color);
        this.alive = true;
        this.changeProb = 0.25; // chance to change direction each tick
    }

    // choose direction towards nearest apple if possible, fallback to random
    chooseDirection(cols, rows, apples) {
        const opposites = { up: "down", down: "up", left: "right", right: "left" };

        const head = { ...this.body[0] };

        // helper: check immediate collision if candidate direction applied
        const wouldHitWall = (candidate) => {
            const h = { ...head };
            switch (candidate) {
                case "right": h.x++; break;
                case "left": h.x--; break;
                case "up": h.y--; break;
                case "down": h.y++; break;
            }
            return (h.x < 0 || h.x >= cols || h.y < 0 || h.y >= rows);
        };

        // find nearest apple by Manhattan distance
        let target = null;
        if (apples && apples.length > 0) {
            let best = Infinity;
            for (const a of apples) {
                const d = Math.abs(a.x - head.x) + Math.abs(a.y - head.y);
                if (d < best) { best = d; target = a; }
            }
        }

        if (target) {
            const dx = target.x - head.x;
            const dy = target.y - head.y;

            // prefer axis with larger distance
            const tryDirs = [];
            if (Math.abs(dx) >= Math.abs(dy)) {
                if (dx > 0) tryDirs.push('right'); else if (dx < 0) tryDirs.push('left');
                if (dy > 0) tryDirs.push('down'); else if (dy < 0) tryDirs.push('up');
            } else {
                if (dy > 0) tryDirs.push('down'); else if (dy < 0) tryDirs.push('up');
                if (dx > 0) tryDirs.push('right'); else if (dx < 0) tryDirs.push('left');
            }

            // try preferred directions
            for (const candidate of tryDirs) {
                if (opposites[candidate] === this.direction && this.body.length > 1) continue;
                if (wouldHitWall(candidate)) continue;
                this.direction = candidate;
                return;
            }
        }

        // fallback: random change with some probability (preserve previous behavior)
        const dirs = ["up", "down", "left", "right"];
        if (Math.random() < this.changeProb) {
            for (let attempt = 0; attempt < 8; attempt++) {
                const candidate = dirs[Math.floor(Math.random() * dirs.length)];
                if (opposites[candidate] === this.direction && this.body.length > 1) continue;
                if (wouldHitWall(candidate)) continue;
                this.direction = candidate;
                return;
            }
        }
        // otherwise keep current direction
    }

    move(cols, rows, apples = []) {
        if (!this.alive) return;
        this.chooseDirection(cols, rows, apples);
        super.move();
        // check wall collision
        const head = this.body[0];
        if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
            this.alive = false;
        }
        // self-collision check is handled by game logic (it can treat alive=false)
    }
}
