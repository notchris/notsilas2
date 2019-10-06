// PHASER3 SAT BY NOTCHRIS, EMPEROR OF DESPAIR

import Phaser from 'phaser';
import Polygon from 'polygon';
import SAT from 'sat';

const P = SAT.Polygon;
const V = SAT.Vector;

P.prototype.collidesWith = function (polygon, response) {
    return SAT.testPolygonPolygon(this, polygon, response);
};

class SATRect {
    constructor(scene, id, x, y, width, height, isStatic) {
        this.scene = scene;
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.points = [[0, 0], [0, this.height], [this.width, this.height], [this.width, 0]];
        this.sat = new P(new V(this.x, this.y), this.points.map((p) => new V(p[0], p[1])));


        const rect = this.scene.make.graphics();
        rect.fillStyle(0xff0000, 1);
        rect.fillRect(0, 0, this.width, this.height);
        rect.generateTexture(this.id, this.width, this.height);
        rect.destroy();

        this.sprite = this.scene.make.sprite({ key: id, x: this.x, y: this.y });
        this.sprite.setTexture(this.id);
        this.sprite.sat = this.sat;
        this.sprite.isStatic = isStatic;

        // Enable normal Arcade Physics
        this.scene.physics.world.enable(this.sprite);
        this.scene.add.existing(this.sprite);
        this.sprite.body.setBounce(0);
        this.sprite.setOrigin(0);
        this.sprite.body.setCollideWorldBounds(true);

        this.sprite.preUpdate = (time, delta) => {
            this.collides();
        };
    }

    collides() {
        this.sat.pos.x = this.sprite.body.position.x;
        this.sat.pos.y = this.sprite.body.position.y;
        this.sprite.sat.pos.x = this.sprite.body.position.x;
        this.sprite.sat.pos.y = this.sprite.body.position.y;
        const response = new SAT.Response();
        const children = this.scene.children.list.filter((c) => {
            return c.sat !== null && c !== this.sprite;
        });
        children.forEach((child) => {
            if (child.type === 'Line') return;
            const collided = this.sat.collidesWith(child.sat, response);
            if (collided) {
                const overlapV = response.overlapV.clone().scale(-1);
                this.sprite.setPosition(
                    this.sprite.body.position.x + overlapV.x, this.sprite.body.position.y + overlapV.y,
                );
                const velocity = new V(this.sprite.body.velocity.x, this.sprite.body.velocity.y);
                const overlapN = response.overlapN.clone().scale(-0.99, -0.95);
                const velocityN = velocity.clone().projectN(overlapN);
                const velocityT = velocity.clone().sub(velocityN);
                const bounce = velocityN.clone().scale(0);
                const friction = velocityT.clone().scale(1);
                const newVelocity = friction.clone().add(bounce);
                this.sprite.body.setVelocity(newVelocity.x, newVelocity.y);
            }
        });
        response.clear();
    }
}

export class SATPoly {
    constructor(scene, id, x, y, points, isStatic) {
        this.scene = scene;
        this.id = id;
        this.x = x;
        this.y = y;
        this.bounds = new Polygon(points).aabb();
        this.points = points;
        this.sat = new P(new V(this.x, this.y), this.points.map((p) => new V(p[0], p[1])));
        this.width = this.bounds.w;
        this.height = this.bounds.h;

        const poly = this.scene.make.graphics();
        poly.fillStyle(0x00ff00, 1);
        poly.beginPath();
        poly.moveTo(points[0][0], points[0][1]);
        points.forEach((pt) => {
            poly.lineTo(pt[0], pt[1]);
        });
        poly.closePath();
        poly.fillPath();
        poly.generateTexture(this.id, this.width, this.height);
        poly.destroy();

        this.sprite = this.scene.make.sprite({ key: id, x: this.x, y: this.y });
        this.sprite.setTexture(this.id);
        this.sprite.sat = this.sat;
        this.sprite.isStatic = isStatic;

        // Enable normal Arcade Physics
        this.scene.physics.world.enable(this.sprite);
        this.scene.add.existing(this.sprite);
        this.sprite.body.setBounce(0);
        this.sprite.setPosition(this.x, this.y);
        this.sprite.setOrigin(0);
        this.sprite.body.setCollideWorldBounds(true);
        this.sprite.body.setImmovable(true);
        this.sprite.body.setAllowGravity(false);

        this.sprite.preUpdate = (time, delta) => {
            this.collides();
        };
    }

    collides() {
        this.sat.pos.x = this.sprite.body.position.x;
        this.sat.pos.y = this.sprite.body.position.y;
        this.sprite.sat.pos.x = this.sprite.body.position.x;
        this.sprite.sat.pos.y = this.sprite.body.position.y;

        if (!this.sprite.isStatic) return;
        const response = new SAT.Response();
        const children = this.scene.children.list.filter((c) => {
            return c.sat !== null && c !== this.sprite;
        });
        children.forEach((child) => {
            if (child.type === 'Line') return;
            const collided = this.sat.collidesWith(child.sat, response);
            if (collided) {
                const overlapV = response.overlapV.clone().scale(-1);
                this.sprite.setPosition(
                    this.sprite.body.position.x + overlapV.x, this.sprite.body.position.y + overlapV.y,
                );
                const velocity = new V(this.sprite.body.velocity.x, this.sprite.body.velocity.y);
                const overlapN = response.overlapN.clone().scale(-0.99, -0.95);
                const velocityN = velocity.clone().projectN(overlapN);
                const velocityT = velocity.clone().sub(velocityN);
                const bounce = velocityN.clone().scale(0);
                const friction = velocityT.clone().scale(1);
                const newVelocity = friction.clone().add(bounce);
                this.sprite.body.setVelocity(newVelocity.x, newVelocity.y);
            }
        });
        response.clear();
    }
}

export default class SATPlugin extends Phaser.Plugins.BasePlugin {
    constructor(pluginManager) {
        super(pluginManager);
        pluginManager.registerGameObject('satRect', this.createSatRect);
        pluginManager.registerGameObject('satPoly', this.createSatPoly);
    }

    createSatRect(scene, id, x, y, width, height) {
        const s = new SATRect(scene, id, x, y, width, height);
        this.displayList.add(s.sprite);
        return s.sprite;
    }

    createSatPoly(scene, id, x, y, points) {
        const s = new SATPoly(scene, id, x, y, points);
        this.displayList.add(s.sprite);
        return s.sprite;
    }
}
