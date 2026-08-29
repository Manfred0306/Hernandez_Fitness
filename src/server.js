import "dotenv/config";
import app from "./app.js";
app.listen(process.env.PORT || 3000, () =>
  console.log(
    `Hernández Fitness en http://localhost:${process.env.PORT || 3000}`,
  ),
);
