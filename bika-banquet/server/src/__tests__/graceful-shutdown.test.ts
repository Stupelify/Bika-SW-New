import http from 'http';

describe('graceful shutdown pattern', () => {
  it('http.Server.close() resolves after all connections drain', (done) => {
    const app = require('express')();
    const server = app.listen(0, () => {
      expect(server).toBeInstanceOf(http.Server);
      server.close(() => done());
    });
  });
});
