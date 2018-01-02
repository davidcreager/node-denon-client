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

  timeout(milliseconds) {
    return new Promise(() => {
      setTimeout(() => {
        const timeoutRejectionError = new Error(`Timeout out after ${milliseconds} ms.`);
        return Promise.reject(timeoutRejectionError);
      }, milliseconds); // Wait ms then resolve.
    });
  }

  write(command, timeout = 10 * 1000) {
    // let timeoutID;
    // const writePromise = new Promise((resolve) => {
    //   this.socket.write(`${command}\r`, 'ascii', resolve);
    // })
    // .then((writeResult) => {
    //   console.log('writeResult: ', writeResult);
    //   return Promise.resolve(writeResult);
    // });
    // // const timeoutPromise = this.timeout(timeout);
    // const timeoutPromise = new Promise((resolve, reject) => {
    //   timeoutID = setTimeout(() => {
    //     const timeoutRejectionError = new Error(`Timeout out after ${milliseconds} ms.`);
    //     return reject(timeoutRejectionError);
    //   }, timeout); // Wait ms then resolve.
    // });
    // return Promise.race([writePromise, timeoutPromise])
    //   .then((results) => {
    //     console.log('results: ', results);
    //     clearTimeout(timeoutID);
    //     return Promise.resolve();
    //   })
    //   .catch((error) => {
    //     console.error('timeout error');
    //     console.error(error);
    //   });
    let timeoutID;
    return new Promise((resolve, reject) => {
      timeoutID = setTimeout(() => {
        const timeoutRejectionError = new Error(`Timeout out after ${milliseconds} ms.`);
        reject(timeoutRejectionError);
      }, timeout); // Wait ms then resolve.
      this.socket.write(`${command}\r`, 'ascii', resolve);
    })
      .then((result) => {
        console.log('result: ', result);
        clearTimeout(timeoutID);
        return Promise.resolve(result);
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
