import { Snake } from "./snake.js";

export class AISnake extends Snake {
    constructor(color = "blue") {
        super(color);
        this.alive = true;
        this.changeProb = 0.25; // chance to change direction each tick
    }

    // pick a random valid direction (avoid immediate reverse)
    chooseDirection(cols, rows) {
        const opposites = { up: "down", down: "up", left: "right", right: "left" };
        const dirs = ["up", "down", "left", "right"];

        // with some probability, try a random direction
        if (Math.random() < this.changeProb) {
            // attempt a few times to find a non-reversing direction that doesn't immediately hit wall
            for (let attempt = 0; attempt < 6; attempt++) {
                const candidate = dirs[Math.floor(Math.random() * dirs.length)];
                if (opposites[candidate] === this.direction && this.body.length > 1) continue;

                // check immediate wall collision
                const head = { ...this.body[0] };
                switch (candidate) {
                    case "right": head.x++; break;
                    case "left": head.x--; break;
                    case "up": head.y--; break;
                    case "down": head.y++; break;
                }
                if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) continue;

                this.direction = candidate;
                return;
            }
        }
        // otherwise keep current direction
    }

    move(cols, rows) {
        if (!this.alive) return;
        this.chooseDirection(cols, rows);
        super.move();
        // check wall collision
        const head = this.body[0];
        if (head.x < 0 || head.x >= cols || head.y < 0 || head.y >= rows) {
            this.alive = false;
        }
        // self-collision check is handled by game logic (it can treat alive=false)
    }
}
