import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import path from 'path'
import { dirname } from 'path'
import cookieParser from 'cookie-parser'
import { fileURLToPath } from 'url'
import connectDb from './config/dbConnection.js'
import authRouter from './routes/auth.route.js'
import userRouter from './routes/user.route.js'
import investorRouter from './routes/investor.route.js'
import entrepreneurRouter from './routes/entrepreneur.route.js'
import requestRouter from './routes/request.route.js'
import messageRouter from './routes/message.route.js'
import meetingsRouter from './routes/meeting.route.js'
import documentRouter from './routes/document.route.js'
// import accountRouter from './routes/account.route.js'
import refreshTokenRouter from './routes/refreshToken.route.js'

import paymentRouter from "./routes/payment.routes.js";
import investmentRouter from "./routes/investment.routes.js";
import webhookRouter from "./routes/webhook.routes.js";

import { deleteExpiredTempUsers } from './utils/deleteExpiredTempUsers.js'

const app = express()
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config()


const allowedOrigins = [process.env.CLIENT_URL, process.env.LOCAL_CLIENT_URL];

// Middlewares
app.use(cors({
  origin: function (CLIENT_URL, callback) {
    if (!CLIENT_URL || allowedOrigins.includes(CLIENT_URL)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use("/webhooks", webhookRouter);


app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({ extended: true }))
app.use(express.static(path.join(__dirname, 'public')));


// Connect Database
await connectDb();
deleteExpiredTempUsers();

// Routes
app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/investor', investorRouter);
app.use('/entrepreneur', entrepreneurRouter);
app.use('/refresh', refreshTokenRouter);
app.use('/request', requestRouter);
app.use('/messages', messageRouter);
app.use('/meetings', meetingsRouter);
app.use('/document', documentRouter);
// app.use('/account', accountRouter);
app.use("/payments", paymentRouter);
app.use("/investments", investmentRouter);



app.get('/', (req, res) => {
  console.log("Cookies", req.cookies)
  res.send({ message: 'Backend is working!', cookie: req.cookies});
}); 

export default app;