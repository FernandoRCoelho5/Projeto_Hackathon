import { app } from "./app.js";

const PORT = Number(process.env.PORT ?? 3001);

app.listen(PORT, () => {
  console.log(`[opsync] servidor rodando em http://localhost:${PORT}`);
});
