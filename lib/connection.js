'use strict';
const net = require('net');
const EventEmitter = require('events');
const Promise = require('bluebird');

class Connection extends EventEmitter {

  get host() {
    return this._host;
    }

  get port() {
      return this._port;
  }

  get socket() {
    return this._socket;
  }


  constructor(host, port = 23) {
    super();

    this._host = host;
    this._port = port;

    this.initializeSocket();
  }

  initializeSocket() {
    this._socket = new net.Socket();

    this.socket.setEncoding('ascii');

    this.socket.on('data', (data) => {
      this.emit('data', data);
    });

    this.socket.on('close', () => {
      this.emit('close');
    });

    this.socket.on('error', (error) => {
      this.emit('error', error);
    });

    this.socket.on('connect', () => {
      this.emit('connect');
    });
  }

  race({promise, timeout, error}) {
    let timer = null;

    return Promise.race([
      new Promise((resolve, reject) => {
        console.log('set timeout');
        timer = setTimeout(reject, timeout, error);
        return timer;
      }),
      promise.then((value) => {
        console.log('clear timeout!');
        clearTimeout(timer);
        return value;
      })
    ]);
  }

  write(command, milliseconds) {
    const writePromise = new Promise((resolve) => {
      console.log('now write!');
      this.socket.write(`${command}\r`, 'ascii', resolve);
    });
    let timeoutID;
    const timeoutPromise = new Promise((resolve, reject) => {
      timeoutID = setTimeout(() => {
        reject();
      }, milliseconds);
    });
    return Promise.race([writePromise, timeoutPromise])
      .then((results) => {
        console.log('results: ', results);
      })
      .catch((error) => {
        console.error('oops, write catch');
        console.error(error);
      });
  }

  connect()
  {
    return new Promise((resolve, reject) => {
      this.initializeSocket();

      this.socket.once('connect', () => {
        resolve();
        this.socket.removeListener('error', reject);
      });
      this.socket.once('error', (error) => {
        reject(error);

        this.socket.removeListener('connect', resolve);
      });

      this.socket.connect(this.port, this.host);
    });
  }

  disconnect()
  {
    this.socket.end();
  }
}

module.exports = Connection;
