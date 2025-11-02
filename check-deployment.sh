#!/bin/bash

echo "=== QUIZ APP - VERCEL DEPLOYMENT CHECKER ==="
echo ""

# Check if required files exist
echo "Kiểm tra các file cần thiết..."

if [ -f "package.json" ]; then
    echo "✅ package.json - Found"
else
    echo "❌ package.json - Missing"
    exit 1
fi

if [ -f "vercel.json" ]; then
    echo "✅ vercel.json - Found"
else
    echo "❌ vercel.json - Missing"
    exit 1
fi

if [ -d "api" ]; then
    echo "✅ api/ folder - Found"
    echo "📁 API functions:"
    ls -1 api/*.js 2>/dev/null | while read file; do
        echo "  - $(basename "$file")"
    done
else
    echo "❌ api/ folder - Missing"
fi

if [ -d "src" ]; then
    echo "✅ src/ folder - Found"
    echo "📁 Source files:"
    find src -name "*.js" -o -name "*.jsx" | head -5 | while read file; do
        echo "  - $(basename "$file")"
    done
else
    echo "❌ src/ folder - Missing"
fi

if [ -d "public" ]; then
    echo "✅ public/ folder - Found"
else
    echo "⚠️  public/ folder - Missing"
fi

echo ""
echo "=== DEPLOYMENT READY ==="
echo "🚀 Project sẵn sàng deploy lên Vercel!"
echo ""
echo "📋 Các bước deploy:"
echo "1. Upload lên GitHub repository"
echo "2. Import vào Vercel dashboard"
echo "3. Set environment variables trong Vercel"
echo "4. Click Deploy!"
echo ""
echo "🔗 API endpoints sẽ có dạng:"
echo "   https://your-app.vercel.app/api/[function-name]"
