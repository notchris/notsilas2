import Phaser from 'phaser';
import MainScene from './Scene';
import SATPlugin from './phaser-sat';

const config = {
    type: Phaser.WEBGL,
    canvas: document.querySelector('canvas'),
    pixelArt: true,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: '#222222',
    plugins: {
        global: [
            { key: 'SATPlugin', plugin: SATPlugin, start: true },
        ],
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 },
            debug: false,
        },
    },
    scene: [MainScene],
};

new Phaser.Game(config);