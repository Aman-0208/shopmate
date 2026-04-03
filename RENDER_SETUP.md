# Render Web Service Deployment Guide

Shopmate (GULJAR HARDWARE) is fully configured to be deployed as a monolithic Web Service on [Render.com](https://render.com) for **free**. The frontend Vite application will build and be served by the same Express Node.js application, making it clean and minimal.

Follow these steps to deploy your application online:

## 1. Create a Repository
1. Push your entire `shopmate-stock-flow-main` folder to a new **GitHub repository** (e.g. `github.com/your-username/shopmate`).

## 2. Prepare Render
1. Go to [Render Dashboard](https://dashboard.render.com).
2. Click on the **New +** button and select **Web Service**.
3. Connect your GitHub account and select your `shopmate` repository.

## 3. Configure the Web Service
Configure the settings as follows:
- **Name**: `shopmate` (or anything you prefer)
- **Region**: Select the region closest to you
- **Branch**: `main`
- **Language**: `Node`
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

## 4. Set Environment Variables
Scroll down to the **Environment Variables** section and add the following keys:

1. **`MONGODB_URI`**
   - Value: `mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/shopmate?retryWrites=true&w=majority` (Get this from your MongoDB Atlas dashboard. Make sure to whitelist IP `0.0.0.0/0` in Atlas Network Access for Render to connect).
2. **`JWT_SECRET`**
   - Value: Generate a random long string (e.g., `supersecretshopmateauth12345!`)

## 5. Deploy
1. Click **Create Web Service**.
2. Render will begin pulling the repository, running the build step (compiling standard React code), and starting the server using Node.
3. Once the logs show "Server started on port 10000", your site will be live!
4. Render will provide a free `.onrender.com` URL. You can access the app from anywhere.

*Note on Free Tier*: Render's free tier spins down the application after 15 minutes of inactivity. The first person to visit it after it spins down may experience a 30-60 second loading delay as it boots back up.
