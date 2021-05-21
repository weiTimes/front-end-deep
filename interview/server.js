const Koa = require('koa');
const route = require('koa-router');
const app = new Koa();

app.use(async (ctx) => {
  ctx.body = 'Hello World';
});

app.use(
  route.get('/hello', (ctx) => {
    ctx.body = 'hellor world';
  })
);
app.use(
  route.get('/info', () => {
    ctx.body = 'info';
  })
);

app.listen(2345);
