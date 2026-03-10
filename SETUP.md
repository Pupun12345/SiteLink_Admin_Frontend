# Quick Setup Guide

## Step 1: Install Dependencies

Open terminal in the frontend folder and run:
```bash
npm install
```

## Step 2: Start Backend Server

In a separate terminal, navigate to SiteLink_Backend folder and run:
```bash
npm run dev
```

Make sure your backend is running on http://localhost:5000

## Step 3: Start Frontend

In the frontend folder terminal, run:
```bash
npm run dev
```

The admin panel will open at http://localhost:5173

## Step 4: Login

Navigate to http://localhost:5173/admin/login and use your admin credentials:
- Email: admin@sitelink.in
- Password: (your configured password)

## Features Overview

### Dashboard
- View total workers count
- See verified, pending, and rejected workers
- Quick access to pending verifications

### Worker Verification
- View all pending worker verifications
- Click on any worker to see detailed information:
  - Personal details (name, age, experience, city)
  - Skills
  - Profile photo
  - ID proof (Aadhaar front & back)
  - Certificates
- Approve or reject workers
- Provide rejection reason when rejecting

## Troubleshooting

### CORS Issues
If you face CORS errors, make sure your backend has CORS enabled for http://localhost:5173

### API Connection
Verify the backend URL in `src/api/axios.js` matches your backend server address

### Authentication
If redirected to login repeatedly, check:
1. Backend admin credentials are correct
2. JWT token is being saved in localStorage
3. Backend JWT_SECRET is configured
