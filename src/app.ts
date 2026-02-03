import express, { Application, Request, Response } from 'express';
import bodyParser from 'body-parser';
import { connectDatabase } from './database/mongodb';
import { PORT } from './config';
import authRoutes from "./routes/auth.route";
import adminRoutes from "./routes/admin/admin.route";
import cors from 'cors';
import path from 'path';

const app: Application = express();

const corsOptions = {
    origin:[ 'http://localhost:3000', 'http://localhost:3003', 'http://localhost:3005' ],
    optionsSuccessStatus: 200,
    credentials: true,
};

app.use(cors(corsOptions));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve uploaded files as static
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req: Request, res: Response) => {
    return res.status(200).json({ success: "true", message: "Welcome to the API" });
});


export default app;