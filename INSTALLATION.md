# Installation Instructions - PDF Editor

## 📋 Prerequisites

Before you begin, ensure you have:
- **Node.js** (v18.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- A modern web browser (Chrome, Firefox, Edge, Safari)
- At least 500MB free disk space

Check your Node.js version:
```bash
node --version
npm --version
```

## 🚀 Installation Steps

### Step 1: Navigate to Project Directory
```bash
cd C:\Users\srhar\OneDrive\Documents\project\DW\pdfedx
```

Or if you're cloning from Git:
```bash
git clone <repository-url>
cd pdfedx
```

### Step 2: Install Dependencies
This will install all required packages listed in `package.json`:

```bash
npm install
```

**Expected output:**
```
added 350+ packages in 30s
```

**What gets installed:**
- Frontend: Next.js, React, Tailwind CSS, pdf-lib, react-pdf
- Backend: Express, multer, cors, sharp, pdf-lib
- Dev tools: concurrently, nodemon, autoprefixer, postcss

### Step 3: Verify Installation
Check if all dependencies are installed correctly:

```bash
npm list --depth=0
```

You should see all the main packages listed without errors.

## ⚙️ Configuration

### Environment Variables
The `.env.local` file is already configured with:
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**No changes needed** unless you want to use different ports.

### Custom Port Configuration (Optional)

**Frontend Port:**
Next.js uses port 3000 by default. To change:
```bash
# Run with custom port
PORT=3002 npm run dev:next
```

**Backend Port:**
Edit `server/index.js`, line 8:
```javascript
const PORT = process.env.PORT || 3001; // Change 3001 to your port
```

Update `.env.local` accordingly:
```
NEXT_PUBLIC_API_URL=http://localhost:YOUR_PORT
```

## 🎬 Running the Application

### Option 1: Run Everything (Recommended)
Start both frontend and backend with one command:

```bash
npm run dev
```

**What happens:**
- Backend starts on http://localhost:3001
- Frontend starts on http://localhost:3000
- Both run concurrently with auto-reload

**Expected terminal output:**
```
[0] > pdf-editor@1.0.0 dev:next
[0] > next dev
[1] > pdf-editor@1.0.0 dev:server
[1] > nodemon server/index.js
[1] 🚀 PDF Editor API server running on http://localhost:3001
[0] ✓ Ready in 2.5s
[0] ○ Local:   http://localhost:3000
```

### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
npm run dev:server
```

**Terminal 2 - Frontend:**
```bash
npm run dev:next
```

### Option 3: Production Mode

**Build for production:**
```bash
npm run build
```

**Start production servers:**
```bash
npm start
```

## ✅ Verification

### 1. Check Backend Health
Open browser and visit:
```
http://localhost:3001/health
```

**Expected response:**
```json
{
  "status": "ok",
  "message": "PDF Editor API is running"
}
```

### 2. Check Frontend
Open browser and visit:
```
http://localhost:3000
```

**You should see:**
- PDF Editor heading
- File upload area with drag-and-drop zone
- "Select Files" button

### 3. Test File Upload
1. Drag and drop any PDF file
2. Wait for preview to load
3. Verify thumbnails appear

**If preview loads successfully, installation is complete! 🎉**

## 🔧 Troubleshooting

### Problem: `npm install` fails

**Solution 1 - Clear cache:**
```bash
npm cache clean --force
npm install
```

**Solution 2 - Delete node_modules:**
```bash
rm -rf node_modules package-lock.json
npm install
```

**Solution 3 - Use legacy peer deps:**
```bash
npm install --legacy-peer-deps
```

### Problem: Port 3000 or 3001 already in use

**Check what's using the port (Windows):**
```bash
netstat -ano | findstr :3000
netstat -ano | findstr :3001
```

**Kill the process:**
```bash
taskkill /PID <PID_NUMBER> /F
```

**Or use different ports:**
```bash
# Frontend
PORT=3002 npm run dev:next

# Backend - edit server/index.js
const PORT = 3003;
```

### Problem: PDF.js worker not loading

**Error in console:**
```
Error: Setting up fake worker failed: "Cannot read properties of undefined"
```

**Solution:**
1. Check your internet connection (worker loads from CDN)
2. Verify the CDN URL is accessible:
   ```
   https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js
   ```
3. Try clearing browser cache

### Problem: Backend not responding

**Check if backend is running:**
```bash
curl http://localhost:3001/health
```

**If no response:**
1. Verify terminal shows backend running
2. Check for error messages in terminal
3. Restart backend:
   ```bash
   npm run dev:server
   ```

### Problem: Module not found errors

**Example:**
```
Module not found: Can't resolve 'react-pdf'
```

**Solution:**
```bash
npm install react-pdf --save
```

Or reinstall all dependencies:
```bash
npm install
```

### Problem: Sharp installation fails (Windows)

**Error:**
```
Error: Could not load the "sharp" module
```

**Solution:**
```bash
npm install --platform=win32 --arch=x64 sharp
```

Or try the prebuilt binaries:
```bash
npm install sharp --ignore-scripts=false
```

## 📦 Package Versions

The application has been tested with these versions:

| Package | Version |
|---------|---------|
| Node.js | 18.x - 20.x |
| Next.js | 14.2.0+ |
| React | 18.3.1 |
| Express | 4.18.2 |
| pdf-lib | 1.17.1 |
| react-pdf | 7.7.0 |

## 🔄 Updating Dependencies

**Check for updates:**
```bash
npm outdated
```

**Update all dependencies:**
```bash
npm update
```

**Update specific package:**
```bash
npm update next
```

**Check for security vulnerabilities:**
```bash
npm audit
npm audit fix
```

## 🗑️ Uninstallation

To completely remove the application:

```bash
# Delete node_modules
rm -rf node_modules

# Delete build files
rm -rf .next
rm -rf out

# Delete lock file
rm package-lock.json

# Optional: Delete the entire project
cd ..
rm -rf pdfedx
```

## 📱 Browser Requirements

The application requires a modern browser with:
- ES6+ JavaScript support
- WebAssembly support (for PDF.js)
- Canvas API
- File API
- Fetch API

**Supported browsers:**
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+
- Opera 76+

**Not supported:**
- Internet Explorer (any version)
- Chrome < 90
- Very old mobile browsers

## 🌐 Network Requirements

**Required CDN access:**
- `cdnjs.cloudflare.com` - For PDF.js worker script

**Firewall ports:**
- Outbound: 443 (HTTPS) for CDN
- Inbound: 3000, 3001 for local development

**No internet? Offline mode:**
1. Download PDF.js worker manually
2. Place in `/public/pdf.worker.min.js`
3. Update worker path in `PDFPreview.js`:
   ```javascript
   pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';
   ```

## 📚 Next Steps

After successful installation:

1. ✅ Read [QUICKSTART.md](./QUICKSTART.md) for usage guide
2. ✅ Read [README.md](./README.md) for full documentation
3. ✅ Test with sample PDFs
4. ✅ Explore all features
5. ✅ Customize as needed

## 💡 Tips

- Use `npm run dev` for development (auto-reload)
- Use `npm start` for production (optimized)
- Check terminal for error messages
- Use browser DevTools (F12) for frontend debugging
- Backend logs appear in terminal
- Large files work better with server-side operations

## 🆘 Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review terminal/console logs
3. Verify all prerequisites are met
4. Try reinstalling dependencies
5. Check GitHub issues (if applicable)
6. Open a new issue with:
   - Error message
   - Steps to reproduce
   - Node.js version
   - Operating system

## ✅ Installation Checklist

- [ ] Node.js installed (v18+)
- [ ] Project files downloaded/cloned
- [ ] Dependencies installed (`npm install`)
- [ ] No error messages during install
- [ ] Backend health check passes
- [ ] Frontend loads in browser
- [ ] Can upload and preview PDF
- [ ] All features work as expected

**If all checked, you're ready to go! 🚀**

---

**Installation Time:** ~5 minutes  
**Disk Space:** ~350MB (including node_modules)  
**Memory Usage:** ~200MB (running both servers)

For questions or issues, refer to the troubleshooting section or documentation files.
