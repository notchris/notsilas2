/* jshint esversion: 6 */
import Phaser from 'phaser';
import MultiKey from './multikey';

const intersects = require('intersects');

export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    create() {
        const {
            LEFT, RIGHT, UP, A, D, W,
        } = Phaser.Input.Keyboard.KeyCodes;
        this.cursors = this.input.keyboard.createCursorKeys();
        this.leftInput = new MultiKey(this, [LEFT, A]);
        this.rightInput = new MultiKey(this, [RIGHT, D]);
        this.jumpInput = new MultiKey(this, [UP, W]);

        // Player
        this.player = this.add.satRect(this, 'player', 100, 100, 48, 48);

        // Test Bodies
        this.testA = this.add.satPoly(this, 'polyA', 100, 400, [[0, 0], [128, 128], [0, 128]], true);
        this.testB = this.add.satPoly(this, 'polyB', 600, 300, [[0, 0], [128, 128], [0, 128]], true);

        // Track which sensors are touching something
        this.isTouching = { left: false, right: false, ground: false };

        // Jumping is going to have a cooldown
        this.canJump = true;
        this.jumpCooldownTimer = null;

        this.hookActive = false;
        this.lastHook = null;


        // Cursor
        this.input.on('pointerdown', (pointer) => {
            if (this.hook) {
                this.hookActive = false;
                this.hook.destroy();
                this.hook = false;
                return;
            }
            this.createHook(pointer);
            this.lastHook = { x: pointer.x, y: pointer.y };
        }, this);
    }

    createHook(pointer) {
        const children = this.children.list.filter((c) => {
            return c.type === 'Sprite' && c !== this.player;
        });

        let hookCollides = false;

        children.forEach((child) => {
            const pts = [];
            child.sat.points.forEach((p) => {
                pts.push(p.x + child.x, p.y + child.y);
            });
            const intersected = intersects.polygonLine(
                pts,
                this.player.x,
                this.player.y,
                pointer.x,
                pointer.y,
                1,
            );
            if (intersected) {
                hookCollides = true;
            }
        });

        if (!hookCollides) {
            // Only create a hook if it wont intersect with a body.
            this.hookActive = true;
            this.hook = new Phaser.GameObjects.Line(this,
                0,
                0,
                this.player.x + this.player.width / 2,
                this.player.y + this.player.width / 2,
                pointer.x,
                pointer.y,
                0xffffff);
            this.add.existing(this.hook).setOrigin(0, 0);
        }
    }

    update() {
        const isRightKeyDown = this.rightInput.isDown();
        const isLeftKeyDown = this.leftInput.isDown();
        const isJumpKeyDown = this.jumpInput.isDown();
        const isOnGround = this.isTouching.ground;
        const isInAir = !isOnGround;

        // Hook Logic
        if (this.hookActive) {
            this.player.body.setAllowGravity(false);
            this.physics.moveToObject(this.player, { x: this.lastHook.x - this.player.width / 2, y: this.lastHook.y - this.player.width / 2 }, 400);
            const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.lastHook.x - this.player.width / 2, this.lastHook.y - this.player.width / 2);

            this.hook.setTo(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.width / 2,
                this.lastHook.x - this.player.width / 2,
                this.lastHook.y - this.player.width / 2,
            );

            if (distance < 20) {
                this.hookActive = false;
                this.hook.destroy();
                this.hook = false;
            }
        } else {
            this.player.body.setAllowGravity(true);
        }

        // Key logic
        if (this.hook) return;
        if (isLeftKeyDown) {
            if (!(isInAir && this.isTouching.left)) {
                this.player.body.setVelocityX(-160);
            }
        } else if (isRightKeyDown) {
            if (!(isInAir && this.isTouching.right)) {
                this.player.body.setVelocityX(160);
            }
        } else {
            this.player.body.setVelocityX(0);
        }
        if (isJumpKeyDown) {
            this.player.body.setVelocityY(-330);
            this.canJump = false;
            this.jumpCooldownTimer = this.time.addEvent({
                delay: 250,
                callback: () => (this.canJump = true),
            });
        }
    }
}