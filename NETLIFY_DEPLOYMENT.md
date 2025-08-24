# Netlify Deployment Guide for LethaShop

This guide explains how to deploy your LethaShop application to Netlify.

## Prerequisites

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
2. **Git Repository**: Your code should be in a Git repository (GitHub, GitLab, etc.)

## Deployment Steps

### 1. Connect Your Repository

1. Log in to Netlify
2. Click "New site from Git"
3. Choose your Git provider (GitHub, GitLab, etc.)
4. Select your repository: `my-lethashop`

### 2. Build Configuration

Netlify will automatically detect the build settings from `netlify.toml`, but verify these settings:

- **Build Command**: `npm run build:netlify`
- **Publish Directory**: `dist`
- **Node Version**: 18

### 3. Environment Variables

Set up the following environment variables in Netlify:

**Required Variables:**
```bash
NODE_VERSION=18
VITE_API_URL=https://your-site-name.netlify.app/.netlify/functions/api
VITE_APP_URL=https://your-site-name.netlify.app
```

**Optional (for Mocha Auth Service):**
```bash
VITE_MOCHA_APP_ID=your-mocha-app-id
VITE_MOCHA_PUBLIC_KEY=your-mocha-public-key
MOCHA_USERS_SERVICE_API_URL=your-mocha-service-url
MOCHA_USERS_SERVICE_API_KEY=your-mocha-service-key
```

**Database (if using external database):**
```bash
DATABASE_URL=your-database-connection-string
```

### 4. Update Environment Variables After Deployment

Once your site is deployed:

1. Get your site URL (e.g., `https://amazing-site-123.netlify.app`)
2. Update these variables with your actual site URL:
   - `VITE_API_URL=https://your-actual-site-url.netlify.app/.netlify/functions/api`
   - `VITE_APP_URL=https://your-actual-site-url.netlify.app`
3. Redeploy the site for changes to take effect

### 5. Deploy

Click "Deploy site" - Netlify will:
1. Clone your repository
2. Install dependencies (`npm install`)
3. Build your application (`npm run build:netlify`)
4. Deploy the `dist` folder
5. Set up your Netlify Functions

## Features Configured

✅ **Single Page Application**: Configured in `netlify.toml`  
✅ **API Functions**: Located in `netlify/functions/`  
✅ **Asset Caching**: Optimized caching headers  
✅ **Environment Variables**: Proper configuration for different environments  
✅ **CORS**: Configured for your domain  

## Post-Deployment Checklist

1. **Test the homepage**: Verify it loads correctly
2. **Test product pages**: Check if products load
3. **Test navigation**: Ensure routing works
4. **Check browser console**: Look for any API errors
5. **Test authentication**: If using Mocha auth service

## Troubleshooting

### Common Issues:

**1. Build Fails**
- Check build logs in Netlify dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

**2. API Calls Fail**
- Check environment variables are set correctly
- Verify CORS configuration
- Check Netlify Functions logs

**3. Routing Issues**
- Ensure `netlify.toml` redirects are configured
- Check for client-side routing setup

**4. Images/Assets Not Loading**
- Verify asset paths are correct
- Check if images are in the `public` directory

### Viewing Logs

1. Go to Netlify dashboard
2. Select your site
3. Go to "Functions" tab to see function logs
4. Go to "Deploys" tab to see build logs

## Database Considerations

The current setup uses in-memory data for development. For production, you'll want to:

1. Set up a proper database (PostgreSQL, MySQL, etc.)
2. Update the Netlify Functions to connect to your database
3. Add database connection string to environment variables

## Custom Domain (Optional)

To use your own domain:

1. Go to "Domain settings" in Netlify
2. Add your custom domain
3. Update DNS records as instructed
4. Update environment variables with your custom domain

## Continuous Deployment

Once connected, Netlify will automatically:
- Deploy when you push to your main branch
- Create deploy previews for pull requests
- Run builds and tests

Your LethaShop should now be successfully deployed to Netlify! 🚀