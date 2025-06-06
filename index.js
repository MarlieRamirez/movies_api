import express from 'express';
import userRoutes from "./routes/user.js"
import adminRoutes from "./routes/admin.js"
import defaultRoutes from "./routes/default.js"
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import cors from  'cors';

const app = express()
const swaggerDocument = YAML.load('swagger.yml');
app.use(cors({
  origin: ['https://movietheather-production.up.railway.app', 'http://localhost:3000'],
  methods: 'GET, POST, PUT, DELETE'
}))
app.use(express.json())
app.use('/user', userRoutes);
app.use('/admin', adminRoutes);
app.use('/', defaultRoutes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.listen(3001, () => {
    console.log("Servidor corriendo en 3001")
})