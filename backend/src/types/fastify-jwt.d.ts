import "@fastify/jwt";

// Даёт TypeScript знать форму payload/request.user — без этого
// request.user.sub в роутах не типизируется (см. @fastify/jwt docs).
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { sub: string };
    user: { sub: string };
  }
}
