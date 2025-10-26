# Quick Start Guide - PDF Editor

## Installation & Setup (5 minutes)

### Step 1: Install Dependencies
Open terminal in the project directory and run:
```bash
npm install
```

This will install all required packages:
- Next.js, React, and Tailwind CSS (frontend)
- Express, pdf-lib, multer, sharp (backend)
- react-pdf for PDF rendering

### Step 2: Start the Application
Run both frontend and backend:
```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001

## First-Time Usage (2 minutes)

### 1. Upload a PDF
- Go to http://localhost:3000
- Drag and drop a PDF file or click "Select Files"
- The preview will load automatically

### 2. Try Basic Operations

**Merge PDFs:**
- Upload multiple PDF files
- Click "Merge PDFs (Client)" button
- Download the merged result

**Split Pages:**
- Click "Split PDF" button
- Enter ranges like "1-3, 5-7" or select pages visually
- Click "Split & Download"

**Rotate a Page:**
- Select a page (checkbox)
- Click "Rotate 90°" button

**Add an Image:**
- Upload both PDF and image files
- Click "Add Image"
- Configure position and size
- Click "Place Image"

**N-up Layout:**
- Click "N-up Layout"
- Choose 2, 4, or 6 pages per sheet
- Adjust spacing and margins
- Click "Apply N-up Layout"

## Testing the Application

### Test Files Needed:
1. **Sample PDF** - Any PDF with multiple pages
2. **Sample Image** - PNG or JPG file

### Quick Test Sequence:
1. Upload a multi-page PDF ✓
2. Select a few pages and extract them ✓
3. Rotate one page ✓
4. Upload an image and add it to a page ✓
5. Create a 2-up or 4-up layout ✓
6. Download the result ✓

## Common Commands

```bash
# Install dependencies
npm install

# Run both frontend & backend
npm run dev

# Run only frontend
npm run dev:next

# Run only backend
npm run dev:server

# Build for production
npm run build

# Start production
npm start

# Lint code
npm run lint
```

## Troubleshooting

### Port Already in Use
If port 3000 or 3001 is busy:
```bash
# Kill the process or change ports in:
# - Frontend: Next.js will auto-increment (3000 → 3001)
# - Backend: Edit server/index.js PORT variable
```

### PDF.js Not Loading
Check your internet connection - PDF.js worker loads from CDN:
```
https://cdnjs.cloudflare.com/ajax/libs/pdf.js/...
```

### Backend Not Responding
Ensure backend is running:
```bash
npm run dev:server
```
Check terminal for errors.

## File Size Limits

- **Client-side operations**: Up to ~20MB recommended
- **Server-side operations**: Up to 100MB (configurable)
- **Upload limit**: 100MB (set in server/index.js)

For larger files, increase the multer limit in `server/index.js`:
```javascript
limits: {
  fileSize: 200 * 1024 * 1024, // 200MB
}
```

## Need Help?

1. Check the full README.md for detailed documentation
2. Look at console logs in browser (F12) and terminal
3. Verify all dependencies installed correctly
4. Ensure both frontend and backend are running

## Next Steps

Once everything works:
- ✓ Explore all features
- ✓ Try with your own PDFs
- ✓ Test with large files using server-side processing
- ✓ Customize styling in `app/globals.css`
- ✓ Add new features to components

Happy PDF editing! 🎉
