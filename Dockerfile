# ---------- Build stage ----------
FROM node:20-alpine AS build
WORKDIR /app
 
# Install deps
COPY package*.json ./
RUN npm ci
 
# Copy source
COPY . .
 
# Build Angular (adjust if your build script is different)
RUN npm run build -- --configuration production
 
# ---------- Runtime stage ----------
FROM nginx:1.27-alpine
 
# Angular output folder name varies by project.
# Replace <your-angular-dist-folder> with the folder inside /app/dist
COPY --from=build /app/dist/angular-18-skeleton /usr/share/nginx/html
 
# Optional: SPA routing support (recommended)
COPY nginx.conf /etc/nginx/conf.d/default.conf
 
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]